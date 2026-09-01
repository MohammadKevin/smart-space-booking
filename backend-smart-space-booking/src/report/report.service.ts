import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservasiStatus, SpaceTipe } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private async getOwner(ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new NotFoundException('Data coworking space tidak ditemukan.');
    }

    return owner;
  }

  async getDashboardSummary(ownerUserId: number) {
    const owner = await this.getOwner(ownerUserId);

    const reservations = await this.prisma.reservasi.findMany({
      where: { ownerId: owner.id },
      include: {
        detailReservasi: true,
      },
    });

    let totalRevenue = 0;
    const bookingCounts = {
      total: reservations.length,
      pending: 0,
      disetujui: 0,
      aktif: 0,
      selesai: 0,
      dibatalkan: 0,
    };

    for (const res of reservations) {
      bookingCounts[res.status] = (bookingCounts[res.status] || 0) + 1;

      if (
        res.status === ReservasiStatus.selesai ||
        res.status === ReservasiStatus.aktif ||
        res.status === ReservasiStatus.disetujui
      ) {
        if (res.detailReservasi?.totalHarga) {
          totalRevenue += res.detailReservasi.totalHarga;
        }
      }
    }

    const totalSpaces = await this.prisma.space.count({
      where: { ownerId: owner.id },
    });

    const totalStaffs = await this.prisma.staff.count({
      where: { ownerId: owner.id },
    });

    const totalMembers = await this.prisma.member.count();

    return {
      coworkingName: owner.namaCoworking,
      ownerName: owner.namaPemilik,
      totalRevenue,
      totalSpaces,
      totalStaffs,
      totalMembers,
      bookingCounts,
    };
  }

  async getMonthlyRevenue(ownerUserId: number, year: number = new Date().getFullYear()) {
    const owner = await this.getOwner(ownerUserId);

    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        ownerId: owner.id,
        tanggalReservasi: {
          gte: startOfYear,
          lt: endOfYear,
        },
        status: {
          in: [
            ReservasiStatus.disetujui,
            ReservasiStatus.aktif,
            ReservasiStatus.selesai,
          ],
        },
      },
      include: {
        detailReservasi: true,
      },
    });

    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    const monthlyStats = monthNames.map((name, index) => ({
      monthIndex: index + 1,
      monthName: name,
      revenue: 0,
      totalBookings: 0,
    }));

    for (const res of reservations) {
      const monthIdx = new Date(res.tanggalReservasi).getUTCMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyStats[monthIdx].totalBookings += 1;
        if (res.detailReservasi?.totalHarga) {
          monthlyStats[monthIdx].revenue += res.detailReservasi.totalHarga;
        }
      }
    }

    const grandTotalRevenue = monthlyStats.reduce((acc, curr) => acc + curr.revenue, 0);
    const grandTotalBookings = monthlyStats.reduce((acc, curr) => acc + curr.totalBookings, 0);

    return {
      year,
      grandTotalRevenue,
      grandTotalBookings,
      months: monthlyStats,
    };
  }

  async getSpaceTypeDistribution(ownerUserId: number) {
    const owner = await this.getOwner(ownerUserId);

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        ownerId: owner.id,
        status: {
          in: [
            ReservasiStatus.disetujui,
            ReservasiStatus.aktif,
            ReservasiStatus.selesai,
          ],
        },
      },
      include: {
        detailReservasi: {
          include: {
            space: true,
          },
        },
      },
    });

    const distribution: Record<SpaceTipe, { type: SpaceTipe; label: string; count: number; revenue: number }> = {
      [SpaceTipe.desk]: {
        type: SpaceTipe.desk,
        label: 'Hot Desk & Workstation',
        count: 0,
        revenue: 0,
      },
      [SpaceTipe.meeting_room]: {
        type: SpaceTipe.meeting_room,
        label: 'Meeting Room',
        count: 0,
        revenue: 0,
      },
      [SpaceTipe.private_office]: {
        type: SpaceTipe.private_office,
        label: 'Private Office',
        count: 0,
        revenue: 0,
      },
    };

    for (const res of reservations) {
      const spaceType = res.detailReservasi?.space?.tipe;
      if (spaceType && distribution[spaceType]) {
        distribution[spaceType].count += 1;
        if (res.detailReservasi?.totalHarga) {
          distribution[spaceType].revenue += res.detailReservasi.totalHarga;
        }
      }
    }

    return Object.values(distribution);
  }

  async getRecentTransactions(ownerUserId: number, limit: number = 10) {
    const owner = await this.getOwner(ownerUserId);

    return this.prisma.reservasi.findMany({
      where: { ownerId: owner.id },
      include: {
        member: true,
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
