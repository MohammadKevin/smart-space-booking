import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { FilterReservationDto } from './dto/filter-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-status.dto';
import {
  generateQrCode,
  isTimeOverlapping,
  normalizeDateToStartOfDay,
  timeStringToMinutes,
  minutesToTimeString,
} from '../common/utils/time.util';
import {
  Prisma,
  ReservasiStatus,
  PembayaranStatus,
  Role,
  SpaceTipe,
} from '@prisma/client';

@Injectable()
export class ReservationService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  onModuleInit() {
    this.cleanupExpiredReservations().catch(() => {});
    setInterval(() => {
      this.cleanupExpiredReservations().catch((err) => {
        console.error('Error cleaning up expired reservations:', err);
      });
    }, 15 * 60 * 1000);
  }

  async cleanupExpiredReservations() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();
    const todayStart = normalizeDateToStartOfDay(now.toISOString());

    // 1. Pending reservations created over 24h ago
    const expiredByAge = await this.prisma.reservasi.findMany({
      where: {
        status: ReservasiStatus.pending,
        createdAt: { lt: oneDayAgo },
      },
      include: { transaksi: true },
    });

    // 2. Unpaid reservations where scheduled reservation date is in the past
    const expiredByDate = await this.prisma.reservasi.findMany({
      where: {
        status: {
          in: [ReservasiStatus.pending, ReservasiStatus.disetujui],
        },
        tanggalReservasi: { lt: todayStart },
        OR: [
          { transaksi: null },
          {
            transaksi: {
              statusPembayaran: {
                in: [
                  PembayaranStatus.belum_bayar,
                  PembayaranStatus.menunggu_pembayaran,
                  PembayaranStatus.gagal,
                ],
              },
            },
          },
        ],
      },
      include: { transaksi: true },
    });

    const combined = [...expiredByAge, ...expiredByDate];
    const uniqueIds = new Set<number>();

    for (const item of combined) {
      if (uniqueIds.has(item.id)) continue;
      uniqueIds.add(item.id);

      await this.prisma.reservasi.update({
        where: { id: item.id },
        data: { status: ReservasiStatus.dibatalkan },
      });

      if (
        item.transaksi &&
        item.transaksi.statusPembayaran !== PembayaranStatus.lunas
      ) {
        await this.prisma.transaksi.update({
          where: { id: item.transaksi.id },
          data: { statusPembayaran: PembayaranStatus.gagal },
        });
      }
    }
  }

  private generateInvoiceNumber(reservationId: number): string {
    const stamp = Date.now().toString().slice(-6);
    return `INV-${reservationId}-${stamp}`;
  }

  async create(dto: CreateReservationDto, memberUserId: number) {
    const spaceId = dto.spaceId || dto.space_id;
    const tanggalReservasi =
      dto.tanggalReservasi || dto.tanggal_reservasi || dto.tanggal;
    const jamMulai = dto.jamMulai || dto.jam_mulai;
    const durasiJam = dto.durasiJam || dto.durasi_jam || dto.durasi;
    const diskonId = dto.diskonId || dto.diskon_id;
    const kodeDiskon = dto.kodeDiskon || dto.kode_diskon;

    if (!spaceId) {
      throw new BadRequestException('spaceId / ID ruangan tidak boleh kosong.');
    }
    if (!tanggalReservasi) {
      throw new BadRequestException('Tanggal reservasi tidak boleh kosong.');
    }
    if (!jamMulai) {
      throw new BadRequestException('Jam mulai tidak boleh kosong.');
    }
    if (!durasiJam || durasiJam < 1) {
      throw new BadRequestException('Durasi pemakaian minimal 1 jam.');
    }

    const member = await this.prisma.member.findUnique({
      where: { userId: memberUserId },
    });

    if (!member) {
      throw new ForbiddenException(
        'Hanya akun dengan profil Member yang dapat melakukan reservasi.',
      );
    }

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { owner: true },
    });

    if (!space) {
      throw new NotFoundException(
        `Space dengan ID ${spaceId} tidak ditemukan.`,
      );
    }

    const targetDate = normalizeDateToStartOfDay(tanggalReservasi);
    const newStartMinutes = timeStringToMinutes(jamMulai);
    const newEndMinutes = newStartMinutes + durasiJam * 60;
    const jamSelesaiStr = minutesToTimeString(newEndMinutes);

    const now = new Date();
    const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayWibStr = wibNow.toISOString().split('T')[0];
    const todayStart = normalizeDateToStartOfDay(todayWibStr);

    if (targetDate.getTime() < todayStart.getTime()) {
      throw new BadRequestException(
        'Tidak dapat membuat reservasi untuk tanggal di masa lalu.',
      );
    }

    if (targetDate.getTime() === todayStart.getTime()) {
      const nowWibMinutes = wibNow.getUTCHours() * 60 + wibNow.getUTCMinutes();
      if (newStartMinutes <= nowWibMinutes) {
        throw new BadRequestException(
          'Jam mulai reservasi harus lebih dari waktu saat ini.',
        );
      }
    }

    const existingReservations = await this.prisma.reservasi.findMany({
      where: {
        detailReservasi: {
          spaceId: space.id,
        },
        status: {
          in: [
            ReservasiStatus.pending,
            ReservasiStatus.disetujui,
            ReservasiStatus.aktif,
          ],
        },
      },
      include: {
        detailReservasi: true,
      },
    });

    for (const ex of existingReservations) {
      const exDate = normalizeDateToStartOfDay(ex.tanggalReservasi);
      if (exDate.getTime() === targetDate.getTime()) {
        const exStartMinutes = timeStringToMinutes(ex.jamMulai);
        const exEndMinutes = exStartMinutes + ex.durasiJam * 60;

        if (
          isTimeOverlapping(
            newStartMinutes,
            newEndMinutes,
            exStartMinutes,
            exEndMinutes,
          )
        ) {
          const exSelesaiStr = minutesToTimeString(exEndMinutes);
          throw new BadRequestException(
            `Jadwal bentrok! Space '${space.namaSpace}' telah terisi pada slot ${ex.jamMulai} - ${exSelesaiStr}. Silakan pilih jam atau durasi lain.`,
          );
        }
      }
    }

    const basePrice = space.hargaPerJam * durasiJam;
    let selectedDiskon: any = null;
    let totalHarga = basePrice;

    if (diskonId || kodeDiskon) {
      if (diskonId) {
        selectedDiskon = await this.prisma.diskon.findUnique({
          where: { id: diskonId },
        });
      } else if (kodeDiskon) {
        selectedDiskon = await this.prisma.diskon.findUnique({
          where: { kodeDiskon: kodeDiskon.toUpperCase() },
        });
      }

      if (selectedDiskon) {
        if (
          selectedDiskon.ownerId !== null &&
          selectedDiskon.ownerId !== space.ownerId
        ) {
          throw new BadRequestException(
            `Kupon promo '${selectedDiskon.namaDiskon}' tidak berlaku untuk coworking space ini.`,
          );
        }

        const nowCheck = new Date();
        const isValidDate =
          nowCheck >= selectedDiskon.tanggalAwal &&
          nowCheck <= selectedDiskon.tanggalAkhir;

        if (!isValidDate) {
          throw new BadRequestException(
            `Kupon diskon '${selectedDiskon.namaDiskon}' tidak aktif atau sudah kedaluwarsa.`,
          );
        }

        const potongan = (basePrice * selectedDiskon.persentaseDiskon) / 100;
        totalHarga = Math.max(0, basePrice - potongan);
      } else {
        throw new NotFoundException('Kupon diskon tidak ditemukan.');
      }
    }

    const qrCode = generateQrCode();

    const isHotDesk = space.tipe === SpaceTipe.desk;
    const isAutoApproved =
      isHotDesk && space.owner?.autoApproveHotDesk !== false;
    const initialStatus = isAutoApproved
      ? ReservasiStatus.disetujui
      : ReservasiStatus.pending;

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await this.prisma.reservasi.create({
      data: {
        tanggalReservasi: new Date(tanggalReservasi),
        jamMulai: jamMulai,
        durasiJam: durasiJam,
        status: initialStatus,
        qrCode,
        ownerId: space.ownerId,
        memberId: member.id,
        detailReservasi: {
          create: {
            spaceId: space.id,
            diskonId: selectedDiskon ? selectedDiskon.id : null,
            totalHarga,
          },
        },
        transaksi: {
          create: {
            nomorInvoice: invoiceNumber,
            jumlah: totalHarga,
            statusPembayaran: PembayaranStatus.belum_bayar,
          },
        },
      },
      include: {
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
        transaksi: true,
      },
    });

    const reservation = {
      ...res,
      jamSelesai: jamSelesaiStr,
    };

    const message = isAutoApproved
      ? 'Reservasi berhasil dibuat dan otomatis disetujui (Instant Booking Hot Desk). Silakan selesaikan pembayaran.'
      : 'Reservasi berhasil dibuat. Menunggu konfirmasi admin/staff.';

    return {
      message,
      data: reservation,
    };
  }

  async findAll(filter: FilterReservationDto, user: any) {
    const where: Prisma.ReservasiWhereInput = {};

    if (user.role === Role.member) {
      if (!user.member) {
        throw new ForbiddenException('Profil member tidak ditemukan.');
      }
      where.memberId = user.member.id;
    } else if (user.role === Role.admin_space) {
      if (!user.spaceOwner) {
        throw new ForbiddenException('Profil coworking space tidak ditemukan.');
      }
      where.ownerId = user.spaceOwner.id;
    } else if (user.role === Role.staff) {
      if (!user.staff) {
        throw new ForbiddenException('Profil staff tidak ditemukan.');
      }
      where.ownerId = user.staff.ownerId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.spaceId) {
      where.detailReservasi = {
        spaceId: filter.spaceId,
      };
    }

    if (filter.tanggal) {
      const targetDate = normalizeDateToStartOfDay(filter.tanggal);
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      where.tanggalReservasi = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const reservations = await this.prisma.reservasi.findMany({
      where,
      include: {
        member: true,
        owner: true,
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((res) => {
      const startMinutes = timeStringToMinutes(res.jamMulai);
      const endMinutes = startMinutes + res.durasiJam * 60;
      return {
        ...res,
        jamSelesai: minutesToTimeString(endMinutes),
      };
    });
  }

  async findOne(id: number, user: any) {
    const res = await this.prisma.reservasi.findUnique({
      where: { id },
      include: {
        member: true,
        owner: true,
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
      },
    });

    if (!res) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    if (user.role === Role.member && user.member?.id !== res.memberId) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk melihat reservasi ini.',
      );
    }
    if (user.role === Role.admin_space && user.spaceOwner?.id !== res.ownerId) {
      throw new ForbiddenException(
        'Reservasi ini bukan milik coworking space Anda.',
      );
    }
    if (user.role === Role.staff && user.staff?.ownerId !== res.ownerId) {
      throw new ForbiddenException(
        'Reservasi ini bukan milik coworking space tempat Anda bertugas.',
      );
    }

    const startMinutes = timeStringToMinutes(res.jamMulai);
    const endMinutes = startMinutes + res.durasiJam * 60;

    return {
      ...res,
      jamSelesai: minutesToTimeString(endMinutes),
    };
  }

  async updateStatus(id: number, dto: UpdateReservationStatusDto, user: any) {
    await this.findOne(id, user);

    if (user.role !== Role.admin_space && user.role !== Role.staff) {
      throw new ForbiddenException(
        'Hanya admin space dan staff yang dapat memperbarui status reservasi.',
      );
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: dto.status },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        transaksi: true,
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
      },
    });

    if (dto.status === ReservasiStatus.disetujui && updated.member?.user?.email) {
      const email = updated.member.user.email;
      const memberName = updated.member.namaMember;
      const spaceName = updated.detailReservasi?.space?.namaSpace || 'Space';
      const rawDate = updated.tanggalReservasi ? updated.tanggalReservasi.toISOString().split('T')[0] : '';
      const invoiceNum = updated.transaksi?.nomorInvoice || `INV-${updated.id}`;
      const totalCost = updated.detailReservasi?.totalHarga || 0;

      this.mailService
        .sendBookingApprovedEmail(
          email,
          memberName,
          spaceName,
          rawDate,
          updated.jamMulai,
          updated.qrCode,
          invoiceNum,
          totalCost,
        )
        .catch(() => {});
    }

    return {
      message: `Status reservasi berhasil diubah menjadi '${dto.status}'.`,
      data: updated,
    };
  }

  async cancelMyReservation(id: number, memberUserId: number) {
    const member = await this.prisma.member.findUnique({
      where: { userId: memberUserId },
    });

    if (!member) {
      throw new ForbiddenException(
        'Hanya member yang dapat membatalkan reservasinya.',
      );
    }

    const res = await this.prisma.reservasi.findUnique({
      where: { id },
    });

    if (!res || res.memberId !== member.id) {
      throw new NotFoundException(
        'Reservasi tidak ditemukan atau bukan milik Anda.',
      );
    }

    if (
      res.status !== ReservasiStatus.pending &&
      res.status !== ReservasiStatus.disetujui
    ) {
      throw new BadRequestException(
        `Reservasi dengan status '${res.status}' tidak dapat dibatalkan secara mandiri.`,
      );
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: ReservasiStatus.dibatalkan },
    });

    return {
      message: 'Reservasi berhasil dibatalkan.',
      data: updated,
    };
  }
}
