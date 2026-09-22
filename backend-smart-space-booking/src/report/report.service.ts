import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservasiStatus, SpaceTipe, PembayaranStatus } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwner(ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new NotFoundException('Data coworking space tidak ditemukan.');
    }

    return owner;
  }

  private async getActiveCommissionRate(): Promise<number> {
    try {
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key: 'PLATFORM_COMMISSION_PERCENT' },
      });
      if (setting?.value) {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          return parsed;
        }
      }
    } catch {}
    return 10;
  }

  private calculateOwnerNetRevenue(res: any, defaultRate: number): number {
    const gross = res.transaksi?.jumlah || res.detailReservasi?.totalHarga || 0;
    if (res.transaksi) {
      if (
        res.transaksi.pendapatanOwner !== null &&
        res.transaksi.pendapatanOwner !== undefined &&
        res.transaksi.pendapatanOwner >= 0
      ) {
        return res.transaksi.pendapatanOwner;
      }
      if (
        res.transaksi.komisiPlatform !== null &&
        res.transaksi.komisiPlatform !== undefined
      ) {
        return Math.max(0, gross - res.transaksi.komisiPlatform);
      }
      if (
        res.transaksi.persentaseKomisiPlatform !== null &&
        res.transaksi.persentaseKomisiPlatform !== undefined
      ) {
        const komisi = (gross * res.transaksi.persentaseKomisiPlatform) / 100;
        return Math.max(0, gross - komisi);
      }
    }
    const komisi = (gross * defaultRate) / 100;
    return Math.max(0, gross - komisi);
  }

  async getDashboardSummary(ownerUserId: number) {
    const owner = await this.getOwner(ownerUserId);
    const activeRate = await this.getActiveCommissionRate();

    const reservations = await this.prisma.reservasi.findMany({
      where: { ownerId: owner.id },
      include: {
        detailReservasi: true,
        transaksi: true,
      },
    });

    let totalNetRevenue = 0;
    let totalGrossRevenue = 0;
    let totalPlatformCommission = 0;

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

      const isPaid = res.transaksi?.statusPembayaran === PembayaranStatus.lunas;
      const isNotCancelled =
        res.status !== ReservasiStatus.dibatalkan &&
        res.transaksi?.statusPembayaran !== PembayaranStatus.refund &&
        res.transaksi?.statusPembayaran !== PembayaranStatus.gagal;

      if (isPaid && isNotCancelled) {
        const gross = res.transaksi?.jumlah || res.detailReservasi?.totalHarga || 0;
        const net = this.calculateOwnerNetRevenue(res, activeRate);
        const commission = Math.max(0, gross - net);

        totalGrossRevenue += gross;
        totalNetRevenue += net;
        totalPlatformCommission += commission;
      }
    }

    const totalSpaces = await this.prisma.space.count({
      where: { ownerId: owner.id },
    });

    const totalStaffs = await this.prisma.staff.count({
      where: { ownerId: owner.id },
    });

    const distinctMembers = await this.prisma.reservasi.findMany({
      where: { ownerId: owner.id },
      select: { memberId: true },
      distinct: ['memberId'],
    });
    const totalMembers = distinctMembers.length;

    return {
      coworkingName: owner.namaCoworking,
      ownerName: owner.namaPemilik,
      totalRevenue: totalNetRevenue, // Pendapatan bersih mitra (setelah dipotong komisi super admin)
      totalNetRevenue,
      totalGrossRevenue,
      totalPlatformCommission,
      commissionRate: activeRate,
      totalSpaces,
      totalStaffs,
      totalMembers,
      bookingCounts,
    };
  }

  async getMonthlyRevenue(
    ownerUserId: number,
    year: number = new Date().getFullYear(),
  ) {
    const owner = await this.getOwner(ownerUserId);
    const activeRate = await this.getActiveCommissionRate();

    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        ownerId: owner.id,
        tanggalReservasi: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      include: {
        detailReservasi: true,
        transaksi: true,
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
      grossRevenue: 0,
      commission: 0,
      totalBookings: 0,
    }));

    for (const res of reservations) {
      const isPaid = res.transaksi?.statusPembayaran === PembayaranStatus.lunas;
      const isNotCancelled =
        res.status !== ReservasiStatus.dibatalkan &&
        res.transaksi?.statusPembayaran !== PembayaranStatus.refund &&
        res.transaksi?.statusPembayaran !== PembayaranStatus.gagal;

      if (isPaid && isNotCancelled) {
        const monthIdx = new Date(res.tanggalReservasi).getUTCMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          const gross = res.transaksi?.jumlah || res.detailReservasi?.totalHarga || 0;
          const net = this.calculateOwnerNetRevenue(res, activeRate);
          const commission = Math.max(0, gross - net);

          monthlyStats[monthIdx].totalBookings += 1;
          monthlyStats[monthIdx].revenue += net; // Net revenue (setelah dipotong komisi super admin)
          monthlyStats[monthIdx].grossRevenue += gross;
          monthlyStats[monthIdx].commission += commission;
        }
      }
    }

    const grandTotalRevenue = monthlyStats.reduce(
      (acc, curr) => acc + curr.revenue,
      0,
    );
    const grandTotalGrossRevenue = monthlyStats.reduce(
      (acc, curr) => acc + curr.grossRevenue,
      0,
    );
    const grandTotalBookings = monthlyStats.reduce(
      (acc, curr) => acc + curr.totalBookings,
      0,
    );

    return {
      year,
      grandTotalRevenue,
      grandTotalGrossRevenue,
      grandTotalBookings,
      commissionRate: activeRate,
      months: monthlyStats,
    };
  }

  async getSpaceTypeDistribution(ownerUserId: number) {
    const owner = await this.getOwner(ownerUserId);
    const activeRate = await this.getActiveCommissionRate();

    const spaces = await this.prisma.space.findMany({
      where: { ownerId: owner.id },
    });

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        ownerId: owner.id,
      },
      include: {
        detailReservasi: {
          include: {
            space: true,
          },
        },
        transaksi: true,
      },
    });

    const distribution: Record<
      SpaceTipe,
      {
        type: SpaceTipe;
        label: string;
        count: number;
        revenue: number;
        totalBookings: number;
        percentage: number;
      }
    > = {
      [SpaceTipe.desk]: {
        type: SpaceTipe.desk,
        label: 'Hot Desk & Workstation',
        count: 0,
        revenue: 0,
        totalBookings: 0,
        percentage: 0,
      },
      [SpaceTipe.meeting_room]: {
        type: SpaceTipe.meeting_room,
        label: 'Meeting Room',
        count: 0,
        revenue: 0,
        totalBookings: 0,
        percentage: 0,
      },
      [SpaceTipe.private_office]: {
        type: SpaceTipe.private_office,
        label: 'Private Office',
        count: 0,
        revenue: 0,
        totalBookings: 0,
        percentage: 0,
      },
    };

    for (const space of spaces) {
      if (distribution[space.tipe]) {
        distribution[space.tipe].count += 1;
      }
    }

    for (const res of reservations) {
      const isPaid = res.transaksi?.statusPembayaran === PembayaranStatus.lunas;
      const isNotCancelled =
        res.status !== ReservasiStatus.dibatalkan &&
        res.transaksi?.statusPembayaran !== PembayaranStatus.refund &&
        res.transaksi?.statusPembayaran !== PembayaranStatus.gagal;

      if (isPaid && isNotCancelled) {
        const spaceType = res.detailReservasi?.space?.tipe;
        if (spaceType && distribution[spaceType]) {
          const net = this.calculateOwnerNetRevenue(res, activeRate);
          distribution[spaceType].totalBookings += 1;
          distribution[spaceType].revenue += net;
        }
      }
    }

    const totalSpaces = spaces.length;
    for (const key of Object.keys(distribution) as SpaceTipe[]) {
      distribution[key].percentage =
        totalSpaces > 0
          ? Math.round((distribution[key].count / totalSpaces) * 100)
          : 0;
    }

    return Object.values(distribution);
  }

  async getRecentTransactions(ownerUserId: number, limit: number = 10) {
    const owner = await this.getOwner(ownerUserId);

    return this.prisma.reservasi.findMany({
      where: { ownerId: owner.id },
      include: {
        member: true,
        transaksi: true,
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
