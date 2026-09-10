import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservasiStatus, PembayaranStatus, Role } from '@prisma/client';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);
  private commissionPercent: number = parseFloat(
    process.env.PLATFORM_COMMISSION_PERCENT || '5.0',
  );

  constructor(private readonly prisma: PrismaService) {}

  async getCommissionRate() {
    const activeRate = await this.getCurrentCommissionRate();
    return {
      commissionPercent: activeRate,
      defaultEnvPercent: parseFloat(
        process.env.PLATFORM_COMMISSION_PERCENT || '5.0',
      ),
      model: 'revenue_share_settlement',
      description: `Platform memotong ${activeRate}% dari total omzet setiap transaksi yang lunas.`,
    };
  }

  private async getCurrentCommissionRate(): Promise<number> {
    try {
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key: 'PLATFORM_COMMISSION_PERCENT' },
      });
      if (setting && setting.value) {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed)) {
          this.commissionPercent = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback to in-memory / env
    }
    return this.commissionPercent;
  }

  async setCommissionRate(percent: number) {
    this.commissionPercent = percent;
    try {
      await this.prisma.platformSetting.upsert({
        where: { key: 'PLATFORM_COMMISSION_PERCENT' },
        update: { value: percent.toString() },
        create: { key: 'PLATFORM_COMMISSION_PERCENT', value: percent.toString() },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist commission rate to DB, using in-memory: ${err.message}`);
    }

    this.logger.log(`Platform commission rate updated to: ${percent}%`);
    return {
      success: true,
      commissionPercent: this.commissionPercent,
      message: `Persentase komisi platform berhasil diperbarui menjadi ${percent}%.`,
    };
  }

  async getOverview() {
    const rate = await this.getCurrentCommissionRate();
    const transactions = await this.prisma.transaksi.findMany({
      where: {
        statusPembayaran: PembayaranStatus.lunas,
      },
    });

    const totalGmv = transactions.reduce((acc, t) => acc + (t.jumlah || 0), 0);
    const platformProfit = transactions.reduce(
      (acc, t) =>
        acc +
        (t.komisiPlatform ??
          ((t.jumlah * (t.persentaseKomisiPlatform ?? rate)) / 100)),
      0,
    );
    const totalOwnersPayout = transactions.reduce(
      (acc, t) =>
        acc +
        (t.pendapatanOwner ??
          (t.jumlah -
            (t.komisiPlatform ??
              ((t.jumlah * (t.persentaseKomisiPlatform ?? rate)) / 100)))),
      0,
    );

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
      currentCommissionPercent: rate,
      totalOwners,
      totalSpaces,
      totalMembers,
      totalStaffs,
      totalReservations,
      activeReservations,
    };
  }

  async getMonthlyRevenue(year: number = new Date().getFullYear()) {
    const rate = await this.getCurrentCommissionRate();
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
        const profit =
          tx.komisiPlatform ??
          ((amt * (tx.persentaseKomisiPlatform ?? rate)) / 100);
        const payout =
          tx.pendapatanOwner ??
          (amt - profit);

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
      commissionPercent: rate,
      totalGmvAnnual,
      totalPlatformProfitAnnual,
      months: monthlyStats,
    };
  }

  async getAllSpaceOwners() {
    const rate = await this.getCurrentCommissionRate();
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
      let platformFee = 0;
      let totalBookings = o.reservasi.length;
      let paidBookings = 0;

      for (const res of o.reservasi) {
        if (
          res.transaksi &&
          res.transaksi.statusPembayaran === PembayaranStatus.lunas
        ) {
          const amt = res.transaksi.jumlah || 0;
          gmv += amt;
          paidBookings += 1;
          const fee =
            res.transaksi.komisiPlatform ??
            ((amt * (res.transaksi.persentaseKomisiPlatform ?? rate)) / 100);
          platformFee += fee;
        } else if (
          res.status === ReservasiStatus.selesai ||
          res.status === ReservasiStatus.aktif
        ) {
          if (res.detailReservasi?.totalHarga) {
            const amt = res.detailReservasi.totalHarga;
            gmv += amt;
            paidBookings += 1;
            platformFee += (amt * rate) / 100;
          }
        }
      }

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
    const rate = await this.getCurrentCommissionRate();
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
      const platformFee = isPaid ? (amt * rate) / 100 : 0;
      const ownerPayout = isPaid ? amt - platformFee : 0;

      return {
        ...t,
        commissionPercent: rate,
        platformFee,
        ownerPayout,
      };
    });
  }

  async getAllUsers(role?: Role, isVerified?: boolean, search?: string) {
    const where: any = {};

    if (role) {
      where.role = role;
    }
    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }
    if (search) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q } },
        { member: { namaMember: { contains: q } } },
        { spaceOwner: { namaCoworking: { contains: q } } },
        { spaceOwner: { namaPemilik: { contains: q } } },
        { staff: { namaStaff: { contains: q } } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            namaMember: true,
            telp: true,
            instansi: true,
            alamat: true,
            foto: true,
          },
        },
        spaceOwner: {
          select: {
            id: true,
            namaCoworking: true,
            namaPemilik: true,
            telp: true,
            alamat: true,
          },
        },
        staff: {
          select: {
            id: true,
            namaStaff: true,
            telp: true,
            owner: {
              select: {
                id: true,
                namaCoworking: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async verifyUser(userId: number, verified: boolean = true) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID ${userId} tidak ditemukan.`);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: verified,
        otpCode: null,
        otpExpires: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return {
      message: `Status verifikasi akun '${user.email}' berhasil diubah menjadi ${verified ? 'Terverifikasi (Aktif)' : 'Belum Terverifikasi'}.`,
      user: updated,
    };
  }

  async deleteUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID ${userId} tidak ditemukan.`);
    }

    if (user.role === Role.super_admin) {
      throw new ForbiddenException('Akun Super Admin tidak dapat dihapus.');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: `Akun '${user.email}' (${user.role}) berhasil dihapus dari platform.`,
    };
  }
}

