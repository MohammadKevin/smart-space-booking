import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { FilterSpaceDto } from './dto/filter-space.dto';
import {
  isTimeOverlapping,
  normalizeDateToStartOfDay,
  timeStringToMinutes,
  minutesToTimeString,
} from '../common/utils/time.util';
import { Prisma, ReservasiStatus } from '@prisma/client';

@Injectable()
export class SpaceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSpaceDto, ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException(
        'Hanya pengelola coworking (admin_space) yang dapat menambahkan space.',
      );
    }

    return this.prisma.space.create({
      data: {
        namaSpace: dto.namaSpace,
        tipe: dto.tipe,
        hargaPerJam: dto.hargaPerJam,
        kapasitas: dto.kapasitas,
        foto: dto.foto || null,
        deskripsi: dto.deskripsi || null,
        ownerId: owner.id,
      },
      include: {
        owner: true,
      },
    });
  }

  async findAll(filter: FilterSpaceDto) {
    const where: Prisma.SpaceWhereInput = {};

    if (filter.ownerId) {
      where.ownerId = filter.ownerId;
    }

    if (filter.tipe) {
      where.tipe = filter.tipe;
    }

    if (filter.minKapasitas || filter.maxKapasitas) {
      where.kapasitas = {};
      if (filter.minKapasitas) {
        where.kapasitas.gte = filter.minKapasitas;
      }
      if (filter.maxKapasitas) {
        where.kapasitas.lte = filter.maxKapasitas;
      }
    }

    if (filter.search) {
      where.OR = [
        { namaSpace: { contains: filter.search } },
        { deskripsi: { contains: filter.search } },
      ];
    }

    const spaces = await this.prisma.space.findMany({
      where,
      include: {
        owner: true,
        detailReservasi: {
          include: {
            reservasi: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (filter.tanggal && filter.jamMulai && filter.durasiJam) {
      const targetDate = normalizeDateToStartOfDay(filter.tanggal);
      const newStartMinutes = timeStringToMinutes(filter.jamMulai);
      const newEndMinutes = newStartMinutes + filter.durasiJam * 60;

      return spaces.map((space) => {
        const hasConflict = space.detailReservasi.some((detail) => {
          const res = detail.reservasi;
          if (!res) return false;

          const isActiveStatus = (
            [
              ReservasiStatus.pending,
              ReservasiStatus.disetujui,
              ReservasiStatus.aktif,
            ] as ReservasiStatus[]
          ).includes(res.status);

          if (!isActiveStatus) return false;

          const resDate = normalizeDateToStartOfDay(res.tanggalReservasi);
          if (resDate.getTime() !== targetDate.getTime()) return false;

          const existingStart = timeStringToMinutes(res.jamMulai);
          const existingEnd = existingStart + res.durasiJam * 60;

          return isTimeOverlapping(
            newStartMinutes,
            newEndMinutes,
            existingStart,
            existingEnd,
          );
        });

        const { detailReservasi: _, ...spaceData } = space;
        return {
          ...spaceData,
          isAvailable: !hasConflict,
        };
      });
    }

    return spaces.map((space) => {
      const { detailReservasi: _, ...spaceData } = space;
      return spaceData;
    });
  }

  async findOne(id: number) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${id} tidak ditemukan.`);
    }

    return space;
  }

  async getMySpaces(ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new NotFoundException('Data coworking space tidak ditemukan.');
    }

    return this.prisma.space.findMany({
      where: { ownerId: owner.id },
      include: {
        owner: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, dto: UpdateSpaceDto, ownerUserId: number) {
    const space = await this.findOne(id);
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner || space.ownerId !== owner.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengubah space ini.',
      );
    }

    return this.prisma.space.update({
      where: { id },
      data: {
        namaSpace: dto.namaSpace,
        tipe: dto.tipe,
        hargaPerJam: dto.hargaPerJam,
        kapasitas: dto.kapasitas,
        foto: dto.foto,
        deskripsi: dto.deskripsi,
      },
      include: {
        owner: true,
      },
    });
  }

  async remove(id: number, ownerUserId: number) {
    const space = await this.findOne(id);
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner || space.ownerId !== owner.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk menghapus space ini.',
      );
    }

    const activeReservations = await this.prisma.detailReservasi.count({
      where: {
        spaceId: space.id,
        reservasi: {
          status: {
            in: [
              ReservasiStatus.pending,
              ReservasiStatus.disetujui,
              ReservasiStatus.aktif,
            ],
          },
        },
      },
    });

    if (activeReservations > 0) {
      throw new BadRequestException(
        `Space '${space.namaSpace}' masih memiliki ${activeReservations} reservasi aktif (pending/disetujui/aktif). Selesaikan semua reservasi sebelum menghapus space.`,
      );
    }

    await this.prisma.space.delete({
      where: { id },
    });

    return { message: `Space '${space.namaSpace}' berhasil dihapus.` };
  }

  async getBookedSlots(spaceId: number, dateStr?: string) {
    const space = await this.findOne(spaceId);
    const targetDate = dateStr
      ? normalizeDateToStartOfDay(dateStr)
      : normalizeDateToStartOfDay(new Date().toISOString());

    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        detailReservasi: {
          spaceId: space.id,
        },
        tanggalReservasi: {
          gte: targetDate,
          lt: nextDay,
        },
        status: {
          in: [
            ReservasiStatus.pending,
            ReservasiStatus.disetujui,
            ReservasiStatus.aktif,
          ],
        },
      },
      select: {
        id: true,
        jamMulai: true,
        durasiJam: true,
        status: true,
        tanggalReservasi: true,
      },
      orderBy: { jamMulai: 'asc' },
    });

    return reservations.map((r) => {
      const startMin = timeStringToMinutes(r.jamMulai);
      const endMin = startMin + r.durasiJam * 60;
      return {
        id: r.id,
        jamMulai: r.jamMulai,
        durasiJam: r.durasiJam,
        jamSelesai: minutesToTimeString(endMin),
        status: r.status,
      };
    });
  }
}
