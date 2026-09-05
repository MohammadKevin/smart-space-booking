import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  private async getOwner(userId: number) {
    return this.prisma.spaceOwner.findUnique({
      where: { userId },
    });
  }

  async create(dto: CreateDiscountDto, user: any) {
    const tglAwal = new Date(dto.tanggalAwal);
    const tglAkhir = new Date(dto.tanggalAkhir);

    if (tglAwal >= tglAkhir) {
      throw new BadRequestException(
        'Tanggal awal promo harus lebih awal daripada tanggal akhir.',
      );
    }

    if (dto.kodeDiskon) {
      const existing = await this.prisma.diskon.findUnique({
        where: { kodeDiskon: dto.kodeDiskon.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(
          `Kode diskon '${dto.kodeDiskon}' sudah digunakan.`,
        );
      }
    }

    let ownerId: number | null = null;
    if (user && user.id) {
      const owner = await this.getOwner(user.id);
      if (owner) {
        ownerId = owner.id;
      }
    }

    return this.prisma.diskon.create({
      data: {
        namaDiskon: dto.namaDiskon,
        kodeDiskon: dto.kodeDiskon ? dto.kodeDiskon.toUpperCase() : null,
        persentaseDiskon: dto.persentaseDiskon,
        tanggalAwal: tglAwal,
        tanggalAkhir: tglAkhir,
        ownerId,
      },
      include: {
        owner: true,
      },
    });
  }

  async findAll(ownerId?: number, spaceId?: number) {
    const where: Prisma.DiskonWhereInput = {};

    let targetOwnerId = ownerId;
    if (!targetOwnerId && spaceId) {
      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
      });
      if (space) {
        targetOwnerId = space.ownerId;
      }
    }

    if (targetOwnerId) {
      where.OR = [{ ownerId: targetOwnerId }, { ownerId: null }];
    }

    return this.prisma.diskon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            namaCoworking: true,
            namaPemilik: true,
          },
        },
        _count: {
          select: {
            detailReservasi: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    return diskon;
  }

  async checkValidity(codeOrId: string | number, spaceId?: number) {
    let diskon: any = null;

    if (typeof codeOrId === 'number' || !isNaN(Number(codeOrId))) {
      diskon = await this.prisma.diskon.findUnique({
        where: { id: Number(codeOrId) },
        include: { owner: true },
      });
    } else {
      diskon = await this.prisma.diskon.findUnique({
        where: { kodeDiskon: String(codeOrId).toUpperCase() },
        include: { owner: true },
      });
    }

    if (!diskon) {
      throw new NotFoundException(
        `Kupon diskon '${codeOrId}' tidak ditemukan.`,
      );
    }

    const now = new Date();
    const isValid = now >= diskon.tanggalAwal && now <= diskon.tanggalAkhir;

    if (!isValid) {
      throw new BadRequestException(
        `Kupon promo '${diskon.namaDiskon}' tidak aktif atau sudah kedaluwarsa. Periode: ${diskon.tanggalAwal.toISOString().split('T')[0]} s/d ${diskon.tanggalAkhir.toISOString().split('T')[0]}`,
      );
    }

    if (spaceId && diskon.ownerId !== null) {
      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
      });
      if (space && space.ownerId !== diskon.ownerId) {
        throw new BadRequestException(
          `Kupon promo '${diskon.namaDiskon}' hanya berlaku pada coworking space '${diskon.owner?.namaCoworking || 'terkait'}'.`,
        );
      }
    }

    return {
      isValid: true,
      message: `Kupon promo '${diskon.namaDiskon}' aktif dengan potongan ${diskon.persentaseDiskon}%.`,
      diskon,
    };
  }

  async update(id: number, dto: UpdateDiscountDto, user: any) {
    const existing = await this.findOne(id);

    if (user && user.id) {
      const owner = await this.getOwner(user.id);
      if (owner && existing.ownerId && existing.ownerId !== owner.id) {
        throw new ForbiddenException(
          'Anda tidak memiliki izin untuk mengubah diskon milik coworking space lain.',
        );
      }
    }

    const updateData: any = { ...dto };

    if (dto.kodeDiskon) {
      updateData.kodeDiskon = dto.kodeDiskon.toUpperCase();
    }
    if (dto.tanggalAwal) {
      updateData.tanggalAwal = new Date(dto.tanggalAwal);
    }
    if (dto.tanggalAkhir) {
      updateData.tanggalAkhir = new Date(dto.tanggalAkhir);
    }

    if (updateData.tanggalAwal && updateData.tanggalAkhir) {
      if (updateData.tanggalAwal >= updateData.tanggalAkhir) {
        throw new BadRequestException(
          'Tanggal awal promo harus lebih awal daripada tanggal akhir.',
        );
      }
    }

    return this.prisma.diskon.update({
      where: { id },
      data: updateData,
      include: { owner: true },
    });
  }

  async remove(id: number, user: any) {
    const existing = await this.findOne(id);

    if (user && user.id) {
      const owner = await this.getOwner(user.id);
      if (owner && existing.ownerId && existing.ownerId !== owner.id) {
        throw new ForbiddenException(
          'Anda tidak memiliki izin untuk menghapus diskon milik coworking space lain.',
        );
      }
    }

    await this.prisma.diskon.delete({
      where: { id },
    });

    return { message: `Program diskon dengan ID ${id} berhasil dihapus.` };
  }
}
