import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessCheckinDto, CheckinAction } from './dto/process-checkin.dto';
import { ReservasiStatus, Role } from '@prisma/client';
import {
  timeStringToMinutes,
  minutesToTimeString,
} from '../common/utils/time.util';

@Injectable()
export class CheckinService {
  constructor(private prisma: PrismaService) {}

  private validateStaffOrOwnerPermission(
    reservationOwnerId: number,
    user: any,
  ) {
    if (user.role === Role.admin_space) {
      if (user.spaceOwner?.id !== reservationOwnerId) {
        throw new ForbiddenException(
          'Reservasi ini bukan milik coworking space Anda.',
        );
      }
    } else if (user.role === Role.staff) {
      if (user.staff?.ownerId !== reservationOwnerId) {
        throw new ForbiddenException(
          'Reservasi ini bukan milik coworking space tempat Anda bertugas.',
        );
      }
    } else {
      throw new ForbiddenException(
        'Hanya admin space dan staff yang dapat melakukan scan QR.',
      );
    }
  }

  async verifyQr(qrCode: string, user: any) {
    const reservation = await this.prisma.reservasi.findUnique({
      where: { qrCode },
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

    if (!reservation) {
      throw new NotFoundException(
        `Kode QR '${qrCode}' tidak valid atau tidak ditemukan.`,
      );
    }

    this.validateStaffOrOwnerPermission(reservation.ownerId, user);

    const startMinutes = timeStringToMinutes(reservation.jamMulai);
    const endMinutes = startMinutes + reservation.durasiJam * 60;
    const jamSelesai = minutesToTimeString(endMinutes);

    const canCheckIn = reservation.status === ReservasiStatus.disetujui;
    const canCheckOut = reservation.status === ReservasiStatus.aktif;

    let actionLabel = 'Tidak ada aksi yang tersedia';
    if (canCheckIn) actionLabel = 'Siap Check-In (Mulai Pemakaian)';
    else if (canCheckOut) actionLabel = 'Siap Check-Out (Selesai Pemakaian)';
    else if (reservation.status === ReservasiStatus.pending)
      actionLabel = 'Menunggu Persetujuan Admin';
    else if (reservation.status === ReservasiStatus.selesai)
      actionLabel = 'Reservasi Telah Selesai';
    else if (reservation.status === ReservasiStatus.dibatalkan)
      actionLabel = 'Reservasi Dibatalkan';

    return {
      isValid: true,
      canCheckIn,
      canCheckOut,
      nextAction: canCheckIn ? 'checkin' : canCheckOut ? 'checkout' : null,
      actionLabel,
      reservation: {
        ...reservation,
        jamSelesai,
      },
    };
  }

  async processCheckin(dto: ProcessCheckinDto, user: any) {
    const reservation = await this.prisma.reservasi.findUnique({
      where: { qrCode: dto.qrCode },
      include: {
        member: true,
        owner: true,
        detailReservasi: {
          include: {
            space: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Kode QR '${dto.qrCode}' tidak ditemukan.`);
    }

    this.validateStaffOrOwnerPermission(reservation.ownerId, user);

    const requestedAction = dto.action || CheckinAction.AUTO;

    if (
      reservation.status === ReservasiStatus.disetujui &&
      (requestedAction === CheckinAction.AUTO ||
        requestedAction === CheckinAction.CHECKIN)
    ) {
      const updated = await this.prisma.reservasi.update({
        where: { id: reservation.id },
        data: { status: ReservasiStatus.aktif },
        include: {
          member: true,
          detailReservasi: { include: { space: true } },
        },
      });

      return {
        success: true,
        actionPerformed: 'checkin',
        message: `Check-in berhasil! Selamat datang ${reservation.member.namaMember} di ${reservation.detailReservasi?.space.namaSpace}.`,
        reservation: updated,
      };
    }

    if (
      reservation.status === ReservasiStatus.aktif &&
      (requestedAction === CheckinAction.AUTO ||
        requestedAction === CheckinAction.CHECKOUT)
    ) {
      const updated = await this.prisma.reservasi.update({
        where: { id: reservation.id },
        data: { status: ReservasiStatus.selesai },
        include: {
          member: true,
          detailReservasi: { include: { space: true } },
        },
      });

      return {
        success: true,
        actionPerformed: 'checkout',
        message: `Check-out berhasil! Terima kasih telah menggunakan layanan coworking space kami.`,
        reservation: updated,
      };
    }

    if (reservation.status === ReservasiStatus.pending) {
      throw new BadRequestException(
        'Reservasi masih berstatus "pending". Harap setujui reservasi terlebih dahulu sebelum check-in.',
      );
    }

    if (reservation.status === ReservasiStatus.selesai) {
      throw new BadRequestException(
        'Reservasi ini sudah selesai (sudah check-out sebelumnya).',
      );
    }

    if (reservation.status === ReservasiStatus.dibatalkan) {
      throw new BadRequestException('Reservasi ini telah dibatalkan.');
    }

    throw new BadRequestException(
      `Aksi '${requestedAction}' tidak dapat dilakukan pada reservasi dengan status '${reservation.status}'.`,
    );
  }
}
