import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
import { Prisma, ReservasiStatus, PembayaranStatus, Role } from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  private generateInvoiceNumber(reservationId: number): string {
    const stamp = Date.now().toString().slice(-6);
    return `INV-${reservationId}-${stamp}`;
  }

  async create(dto: CreateReservationDto, memberUserId: number) {
    const member = await this.prisma.member.findUnique({
      where: { userId: memberUserId },
    });

    if (!member) {
      throw new ForbiddenException('Hanya akun dengan profil Member yang dapat melakukan reservasi.');
    }

    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
      include: { owner: true },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${dto.spaceId} tidak ditemukan.`);
    }

    const targetDate = normalizeDateToStartOfDay(dto.tanggalReservasi);
    const newStartMinutes = timeStringToMinutes(dto.jamMulai);
    const newEndMinutes = newStartMinutes + dto.durasiJam * 60;
    const jamSelesaiStr = minutesToTimeString(newEndMinutes);

    const todayStart = normalizeDateToStartOfDay(new Date());
    if (targetDate.getTime() < todayStart.getTime()) {
      throw new BadRequestException('Tidak dapat membuat reservasi untuk tanggal di masa lalu.');
    }

    if (targetDate.getTime() === todayStart.getTime()) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (newStartMinutes <= nowMinutes) {
        throw new BadRequestException('Jam mulai reservasi harus lebih dari waktu saat ini.');
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

        if (isTimeOverlapping(newStartMinutes, newEndMinutes, exStartMinutes, exEndMinutes)) {
          const exSelesaiStr = minutesToTimeString(exEndMinutes);
          throw new BadRequestException(
            `Jadwal bentrok! Space '${space.namaSpace}' telah terisi pada slot ${ex.jamMulai} - ${exSelesaiStr}. Silakan pilih jam atau durasi lain.`,
          );
        }
      }
    }

    const basePrice = space.hargaPerJam * dto.durasiJam;
    let selectedDiskon: any = null;
    let totalHarga = basePrice;

    if (dto.diskonId || dto.kodeDiskon) {
      if (dto.diskonId) {
        selectedDiskon = await this.prisma.diskon.findUnique({
          where: { id: dto.diskonId },
        });
      } else if (dto.kodeDiskon) {
        selectedDiskon = await this.prisma.diskon.findUnique({
          where: { kodeDiskon: dto.kodeDiskon.toUpperCase() },
        });
      }

      if (selectedDiskon) {
        const now = new Date();
        const isValidDate = now >= selectedDiskon.tanggalAwal && now <= selectedDiskon.tanggalAkhir;

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

    const reservation = await this.prisma.$transaction(async (tx) => {
      const res = await tx.reservasi.create({
        data: {
          tanggalReservasi: new Date(dto.tanggalReservasi),
          jamMulai: dto.jamMulai,
          durasiJam: dto.durasiJam,
          status: ReservasiStatus.pending,
          qrCode,
          ownerId: space.ownerId,
          memberId: member.id,
        },
      });

      const detail = await tx.detailReservasi.create({
        data: {
          reservasiId: res.id,
          spaceId: space.id,
          diskonId: selectedDiskon ? selectedDiskon.id : null,
          totalHarga,
        },
        include: {
          space: true,
          diskon: true,
        },
      });

      const transaksi = await tx.transaksi.create({
        data: {
          nomorInvoice: this.generateInvoiceNumber(res.id),
          reservasiId: res.id,
          jumlah: totalHarga,
          statusPembayaran: PembayaranStatus.belum_bayar,
        },
      });

      return {
        ...res,
        jamSelesai: jamSelesaiStr,
        detailReservasi: detail,
        transaksi,
      };
    });

    return {
      message: 'Reservasi berhasil dibuat. Menunggu konfirmasi admin/staff.',
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
      throw new ForbiddenException('Anda tidak memiliki izin untuk melihat reservasi ini.');
    }
    if (user.role === Role.admin_space && user.spaceOwner?.id !== res.ownerId) {
      throw new ForbiddenException('Reservasi ini bukan milik coworking space Anda.');
    }
    if (user.role === Role.staff && user.staff?.ownerId !== res.ownerId) {
      throw new ForbiddenException('Reservasi ini bukan milik coworking space tempat Anda bertugas.');
    }

    const startMinutes = timeStringToMinutes(res.jamMulai);
    const endMinutes = startMinutes + res.durasiJam * 60;

    return {
      ...res,
      jamSelesai: minutesToTimeString(endMinutes),
    };
  }

  async updateStatus(id: number, dto: UpdateReservationStatusDto, user: any) {
    const res = await this.findOne(id, user);

    if (user.role !== Role.admin_space && user.role !== Role.staff) {
      throw new ForbiddenException('Hanya admin space dan staff yang dapat memperbarui status reservasi.');
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: dto.status },
      include: {
        member: true,
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
      },
    });

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
      throw new ForbiddenException('Hanya member yang dapat membatalkan reservasinya.');
    }

    const res = await this.prisma.reservasi.findUnique({
      where: { id },
    });

    if (!res || res.memberId !== member.id) {
      throw new NotFoundException('Reservasi tidak ditemukan atau bukan milik Anda.');
    }

    if (res.status !== ReservasiStatus.pending && res.status !== ReservasiStatus.disetujui) {
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
