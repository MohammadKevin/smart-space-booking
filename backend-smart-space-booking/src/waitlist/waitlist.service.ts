import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { normalizeDateToStartOfDay } from '../common/utils/time.util';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async joinWaitlist(userId: number, dto: CreateWaitlistDto) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
    });

    if (!member) {
      throw new ForbiddenException(
        'Hanya member yang dapat bergabung ke daftar tunggu (waitlist).',
      );
    }

    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });

    if (!space) {
      throw new NotFoundException(
        `Space dengan ID ${dto.spaceId} tidak ditemukan.`,
      );
    }

    const targetDate = normalizeDateToStartOfDay(dto.tanggal);

    const existingWaitlist = await this.prisma.waitlist.findFirst({
      where: {
        memberId: member.id,
        spaceId: dto.spaceId,
        tanggal: targetDate,
        jamMulai: dto.jamMulai,
        status: 'pending',
      },
    });

    if (existingWaitlist) {
      throw new BadRequestException(
        'Anda sudah terdaftar di waitlist untuk slot dan jadwal ini.',
      );
    }

    return this.prisma.waitlist.create({
      data: {
        memberId: member.id,
        spaceId: dto.spaceId,
        tanggal: targetDate,
        jamMulai: dto.jamMulai,
        durasiJam: dto.durasiJam,
        status: 'pending',
      },
      include: {
        space: true,
      },
    });
  }

  async getMyWaitlists(userId: number) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
    });

    if (!member) {
      return [];
    }

    return this.prisma.waitlist.findMany({
      where: {
        memberId: member.id,
      },
      include: {
        space: {
          include: {
            owner: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelWaitlist(userId: number, waitlistId: number) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
    });

    if (!member) {
      throw new ForbiddenException('Akses ditolak.');
    }

    const item = await this.prisma.waitlist.findUnique({
      where: { id: waitlistId },
    });

    if (!item) {
      throw new NotFoundException(
        `Item waitlist #${waitlistId} tidak ditemukan.`,
      );
    }

    if (item.memberId !== member.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin membatalkan waitlist ini.',
      );
    }

    return this.prisma.waitlist.update({
      where: { id: waitlistId },
      data: { status: 'cancelled' },
    });
  }
}
