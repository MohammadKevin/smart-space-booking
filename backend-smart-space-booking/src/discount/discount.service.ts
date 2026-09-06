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
  constructor(private readonly prisma: PrismaService) {}

  private async getOwner(userId: number) {
    return this.prisma.spaceOwner.findUnique({
      where: { userId },
    });
  }

  async create(dto: CreateDiscountDto, user: any) {
    const owner = await this.getOwner(user.id);
    if (!owner) {
      throw new ForbiddenException(
        'Hanya admin/pemilik coworking space (admin_space) yang dapat membuat diskon.',
      );
    }

    const tglAwal = new Date(dto.tanggalAwal);
    const tglAkhir = new Date(dto.tanggalAkhir);

    if (tglAwal >= tglAkhir) {
      throw new BadRequestException(
        'Tanggal awal promo harus lebih awal daripada tanggal akhir.',
      );
    }

    if (dto.kodeDiskon) {
      const existing = await this.prisma.diskon.findUnique({
        where: { kodeDiskon: dto.kodeDiskon.toUpperCase().trim() },
      });
      if (existing) {
        throw new ConflictException(
          `Kode diskon '${dto.kodeDiskon}' sudah digunakan. Silakan gunakan kode kupon lain.`,
        );
      }
    }

    let targetSpaceId: number | null = null;
    if (dto.spaceId) {
      const space = await this.prisma.space.findUnique({
        where: { id: dto.spaceId },
      });
      if (!space) {
        throw new NotFoundException(
          `Ruangan dengan ID ${dto.spaceId} tidak ditemukan.`,
        );
      }
      if (space.ownerId !== owner.id) {
        throw new ForbiddenException(
          'Ruangan ini bukan milik coworking space Anda.',
        );
      }
      targetSpaceId = space.id;
    }

    return this.prisma.diskon.create({
      data: {
        namaDiskon: dto.namaDiskon.trim(),
        kodeDiskon: dto.kodeDiskon ? dto.kodeDiskon.toUpperCase().trim() : null,
        persentaseDiskon: dto.persentaseDiskon,
        tanggalAwal: tglAwal,
        tanggalAkhir: tglAkhir,
        ownerId: owner.id,
        spaceId: targetSpaceId,
      },
      include: {
        owner: true,
        space: true,
      },
    });
  }

  async getMyDiscounts(ownerUserId: number) {
    const owner = await this.getOwner(ownerUserId);
    if (!owner) {
      throw new NotFoundException('Data coworking space tidak ditemukan.');
    }

    return this.prisma.diskon.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            namaCoworking: true,
            namaPemilik: true,
          },
        },
        space: {
          select: {
            id: true,
            namaSpace: true,
            tipe: true,
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
      where.ownerId = targetOwnerId;
    }

    if (spaceId) {
      where.OR = [{ spaceId: spaceId }, { spaceId: null }];
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
        space: {
          select: {
            id: true,
            namaSpace: true,
            tipe: true,
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
        space: true,
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
        include: { owner: true, space: true },
      });
    } else {
      diskon = await this.prisma.diskon.findUnique({
        where: { kodeDiskon: String(codeOrId).toUpperCase().trim() },
        include: { owner: true, space: true },
      });
    }

    if (!diskon) {
      throw new NotFoundException(`Kupon diskon '${codeOrId}' tidak ditemukan.`);
    }

    const now = new Date();
    const tglAwal = new Date(diskon.tanggalAwal);
    tglAwal.setHours(0, 0, 0, 0);
    const tglAkhir = new Date(diskon.tanggalAkhir);
    tglAkhir.setHours(23, 59, 59, 999);
    const isValid = now >= tglAwal && now <= tglAkhir;

    if (!isValid) {
      throw new BadRequestException(
        `Kupon promo '${diskon.namaDiskon}' tidak aktif atau sudah kedaluwarsa. Periode: ${diskon.tanggalAwal.toISOString().split('T')[0]} s/d ${diskon.tanggalAkhir.toISOString().split('T')[0]}`,
      );
    }

    if (spaceId) {
      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
        include: { owner: true },
      });

      if (!space) {
        throw new NotFoundException(`Ruangan dengan ID ${spaceId} tidak ditemukan.`);
      }

      if (diskon.ownerId && space.ownerId !== diskon.ownerId) {
        throw new BadRequestException(
          `Kupon promo '${diskon.namaDiskon}' hanya berlaku pada coworking space '${diskon.owner?.namaCoworking || 'lain'}'.`,
        );
      }

      if (diskon.spaceId && diskon.spaceId !== space.id) {
        throw new BadRequestException(
          `Kupon promo '${diskon.namaDiskon}' hanya berlaku khusus untuk ruangan '${diskon.space?.namaSpace || 'tertentu'}'.`,
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
    const owner = await this.getOwner(user.id);

    if (!owner || existing.ownerId !== owner.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengubah diskon milik coworking space lain.',
      );
    }

    const updateData: any = {};

    if (dto.namaDiskon !== undefined) {
      updateData.namaDiskon = dto.namaDiskon.trim();
    }
    if (dto.persentaseDiskon !== undefined) {
      updateData.persentaseDiskon = Number(dto.persentaseDiskon);
    }
    if (dto.kodeDiskon !== undefined) {
      updateData.kodeDiskon = dto.kodeDiskon ? dto.kodeDiskon.toUpperCase().trim() : null;
    }
    if (dto.tanggalAwal) {
      updateData.tanggalAwal = new Date(dto.tanggalAwal);
    }
    if (dto.tanggalAkhir) {
      updateData.tanggalAkhir = new Date(dto.tanggalAkhir);
    }

    if (dto.spaceId !== undefined) {
      if (dto.spaceId) {
        const space = await this.prisma.space.findUnique({
          where: { id: dto.spaceId },
        });
        if (!space) {
          throw new NotFoundException(`Ruangan dengan ID ${dto.spaceId} tidak ditemukan.`);
        }
        if (space.ownerId !== owner.id) {
          throw new ForbiddenException('Ruangan ini bukan milik coworking space Anda.');
        }
        updateData.spaceId = space.id;
      } else {
        updateData.spaceId = null;
      }
    }

    const start = updateData.tanggalAwal || existing.tanggalAwal;
    const end = updateData.tanggalAkhir || existing.tanggalAkhir;

    if (start >= end) {
      throw new BadRequestException(
        'Tanggal awal promo harus lebih awal daripada tanggal akhir.',
      );
    }

    return this.prisma.diskon.update({
      where: { id },
      data: updateData,
      include: { owner: true, space: true },
    });
  }

  async remove(id: number, user: any) {
    const existing = await this.findOne(id);
    const owner = await this.getOwner(user.id);

    if (!owner || existing.ownerId !== owner.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk menghapus diskon milik coworking space lain.',
      );
    }

    await this.prisma.diskon.delete({
      where: { id },
    });

    return { message: `Program diskon dengan ID ${id} berhasil dihapus.` };
  }
}
