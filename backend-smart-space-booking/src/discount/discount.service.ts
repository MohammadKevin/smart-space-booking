import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDiscountDto) {
    const tglAwal = new Date(dto.tanggalAwal);
    const tglAkhir = new Date(dto.tanggalAkhir);

    if (tglAwal >= tglAkhir) {
      throw new BadRequestException('Tanggal awal promo harus lebih awal daripada tanggal akhir.');
    }

    if (dto.kodeDiskon) {
      const existing = await this.prisma.diskon.findUnique({
        where: { kodeDiskon: dto.kodeDiskon.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(`Kode diskon '${dto.kodeDiskon}' sudah digunakan.`);
      }
    }

    return this.prisma.diskon.create({
      data: {
        namaDiskon: dto.namaDiskon,
        kodeDiskon: dto.kodeDiskon ? dto.kodeDiskon.toUpperCase() : null,
        persentaseDiskon: dto.persentaseDiskon,
        tanggalAwal: tglAwal,
        tanggalAkhir: tglAkhir,
      },
    });
  }

  async findAll() {
    return this.prisma.diskon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    return diskon;
  }

  async checkValidity(codeOrId: string | number) {
    let diskon: any = null;

    if (typeof codeOrId === 'number' || !isNaN(Number(codeOrId))) {
      diskon = await this.prisma.diskon.findUnique({
        where: { id: Number(codeOrId) },
      });
    } else {
      diskon = await this.prisma.diskon.findUnique({
        where: { kodeDiskon: codeOrId.toUpperCase() },
      });
    }

    if (!diskon) {
      throw new NotFoundException(`Kupon diskon '${codeOrId}' tidak ditemukan.`);
    }

    const now = new Date();
    const isValid = now >= diskon.tanggalAwal && now <= diskon.tanggalAkhir;

    if (!isValid) {
      throw new BadRequestException(
        `Kupon promo '${diskon.namaDiskon}' tidak aktif atau sudah kedaluwarsa. Periode: ${diskon.tanggalAwal.toISOString().split('T')[0]} s/d ${diskon.tanggalAkhir.toISOString().split('T')[0]}`,
      );
    }

    return {
      isValid: true,
      message: `Kupon promo '${diskon.namaDiskon}' aktif dengan potongan ${diskon.persentaseDiskon}%.`,
      diskon,
    };
  }

  async update(id: number, dto: UpdateDiscountDto) {
    await this.findOne(id);

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
        throw new BadRequestException('Tanggal awal promo harus lebih awal daripada tanggal akhir.');
      }
    }

    return this.prisma.diskon.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.diskon.delete({
      where: { id },
    });

    return { message: `Program diskon dengan ID ${id} berhasil dihapus.` };
  }
}
