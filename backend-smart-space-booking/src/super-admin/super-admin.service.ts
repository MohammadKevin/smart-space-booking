import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservasiStatus, PembayaranStatus, Role } from '@prisma/client';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);
  private commissionPercent: number = parseFloat(
    process.env.PLATFORM_COMMISSION_PERCENT || '5.0',
  );

  constructor(private prisma: PrismaService) {}

  getCommissionRate() {
    return {
      commissionPercent: this.commissionPercent,
      defaultEnvPercent: parseFloat(
        process.env.PLATFORM_COMMISSION_PERCENT || '5.0',
      ),
      model: 'revenue_share_settlement',
      description: `Platform memotong ${this.commissionPercent}% dari total omzet setiap transaksi yang lunas.`,
    };
  }

  setCommissionRate(percent: number) {
    this.commissionPercent = percent;
    this.logger.log(`Platform commission rate updated to: ${percent}%`);
    return {
      success: true,
      commissionPercent: this.commissionPercent,
      message: `Persentase komisi platform berhasil diperbarui menjadi ${percent}%.`,
    };
  }

  async getOverview() {
    const transactions = await this.prisma.transaksi.findMany({
      where: {
        statusPembayaran: PembayaranStatus.lunas,
      },
    });

    const totalGmv = transactions.reduce((acc, t) => acc + (t.jumlah || 0), 0);
    const platformProfit = (totalGmv * this.commissionPercent) / 100;
    const totalOwnersPayout = totalGmv - platformProfit;

    const totalOwners = await this.prisma.spaceOwner.count();
    const totalSpaces = await this.prisma.space.count();
    const totalMembers = await this.prisma.member.count();
    const totalStaffs = await this.prisma.staff.count();
    const totalReservations = await this.prisma.reservasi.count();

    const activeReservations = await this.prisma.reservasi.count({
      where: {
        status: {
          in: [ReservasiStatus.aktif, ReservasiStatus.disetujui],
        },
      },
    });

    return {
      totalGmv,
      platformProfit,
      totalOwnersPayout,
      currentCommissionPercent: this.commissionPercent,
      totalOwners,
      totalSpaces,
      totalMembers,
      totalStaffs,
      totalReservations,
      activeReservations,
    };
  }

  async getMonthlyRevenue(year: number = new Date().getFullYear()) {
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));

    const transactions = await this.prisma.transaksi.findMany({
      where: {
        statusPembayaran: PembayaranStatus.lunas,
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
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
      gmv: 0,
      platformProfit: 0,
      ownerPayout: 0,
      totalTransactions: 0,
    }));

    for (const tx of transactions) {
      const date = tx.dibayarPada || tx.createdAt;
      const monthIdx = new Date(date).getUTCMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        const amt = tx.jumlah || 0;
        const profit = (amt * this.commissionPercent) / 100;
        const payout = amt - profit;

        monthlyStats[monthIdx].gmv += amt;
        monthlyStats[monthIdx].platformProfit += profit;
        monthlyStats[monthIdx].ownerPayout += payout;
        monthlyStats[monthIdx].totalTransactions += 1;
      }
    }

    const totalGmvAnnual = monthlyStats.reduce((acc, curr) => acc + curr.gmv, 0);
    const totalPlatformProfitAnnual = monthlyStats.reduce(
      (acc, curr) => acc + curr.platformProfit,
      0,
    );

    return {
      year,
      commissionPercent: this.commissionPercent,
      totalGmvAnnual,
      totalPlatformProfitAnnual,
      months: monthlyStats,
    };
  }

  async getAllSpaceOwners() {
    const owners = await this.prisma.spaceOwner.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
        spaces: {
          select: {
            id: true,
            namaSpace: true,
            tipe: true,
            hargaPerJam: true,
          },
        },
        staffs: {
          select: {
            id: true,
            namaStaff: true,
            telp: true,
          },
        },
        reservasi: {
          include: {
            transaksi: true,
            detailReservasi: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return owners.map((o) => {
      let gmv = 0;
      let totalBookings = o.reservasi.length;
      let paidBookings = 0;

      for (const res of o.reservasi) {
        if (
          res.transaksi &&
          res.transaksi.statusPembayaran === PembayaranStatus.lunas
        ) {
          gmv += res.transaksi.jumlah || 0;
          paidBookings += 1;
        } else if (
          res.status === ReservasiStatus.selesai ||
          res.status === ReservasiStatus.aktif
        ) {
          if (res.detailReservasi?.totalHarga) {
            gmv += res.detailReservasi.totalHarga;
            paidBookings += 1;
          }
        }
      }

      const platformFee = (gmv * this.commissionPercent) / 100;
      const netPayout = gmv - platformFee;

      const { reservasi: _, ...rest } = o;

      return {
        ...rest,
        gmv,
        platformFee,
        netPayout,
        totalBookings,
        paidBookings,
        totalSpaces: o.spaces.length,
        totalStaffs: o.staffs.length,
      };
    });
  }

  async getAllTransactions(limit = 50) {
    const transactions = await this.prisma.transaksi.findMany({
      include: {
        reservasi: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions.map((t) => {
      const amt = t.jumlah || 0;
      const isPaid = t.statusPembayaran === PembayaranStatus.lunas;
      const platformFee = isPaid ? (amt * this.commissionPercent) / 100 : 0;
      const ownerPayout = isPaid ? amt - platformFee : 0;

      return {
        ...t,
        commissionPercent: this.commissionPercent,
        platformFee,
        ownerPayout,
      };
    });
  }
}
