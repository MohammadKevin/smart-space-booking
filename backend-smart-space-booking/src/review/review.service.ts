import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Prisma, ReservasiStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReviewDto, memberUserId: number) {
    // Cek apakah user punya reservasi yang relevan
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { id: dto.reservasiId },
      include: {
        member: true,
        detailReservasi: {
          include: {
            space: true,
          },
        },
      },
    });

    if (!reservasi) {
      throw new NotFoundException('Reservasi tidak ditemukan.');
    }

    if (reservasi.member.userId !== memberUserId) {
      throw new ForbiddenException('Hanya pemilik reservasi yang dapat memberikan ulasan.');
    }

    if (reservasi.status !== ReservasiStatus.selesai) {
      throw new ForbiddenException('Ulasan hanya dapat diberikan setelah reservasi selesai.');
    }

    // Cek apakah sudah ada review untuk reservasi ini
    const existingReview = await this.prisma.review.findUnique({
      where: { reservasiId: dto.reservasiId },
    });

    if (existingReview) {
      throw new ForbiddenException('Anda sudah memberikan ulasan untuk reservasi ini.');
    }

    const review = await this.prisma.review.create({
      data: {
        rating: dto.rating,
        komentar: dto.komentar || null,
        reservasiId: dto.reservasiId,
      },
      include: {
        reservasi: {
          include: {
            member: true,
            detailReservasi: {
              include: {
                space: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Ulasan berhasil diberikan.',
      data: review,
    };
  }

  async findAll(spaceId?: number, page = 1, limit = 10) {
    const where: Prisma.ReviewWhereInput = {};

    if (spaceId) {
      where.reservasi = {
        detailReservasi: {
          spaceId,
        },
      };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reservasi: {
            include: {
              member: true,
              detailReservasi: {
                include: {
                  space: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAverageRating(spaceId: number) {
    const result = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        reservasi: {
          detailReservasi: {
            spaceId,
          },
        },
      },
    });

    return {
      spaceId,
      averageRating: result._avg.rating || 0,
      totalReviews: await this.prisma.review.count({
        where: {
          reservasi: {
            detailReservasi: {
              spaceId,
            },
          },
        },
      }),
    };
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        reservasi: {
          include: {
            member: true,
            detailReservasi: {
              include: {
                space: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Ulasan tidak ditemukan.');
    }

    return review;
  }
}
