import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reviews & Testimonials')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.member)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Memberikan Ulasan & Rating Reservasi Selesai',
    description:
      'Hanya dapat dilakukan oleh Member yang reservasinya telah berstatus selesai.',
  })
  @ApiResponse({ status: 201, description: 'Ulasan berhasil dibuat.' })
  @ApiResponse({
    status: 403,
    description:
      'Reservasi belum selesai atau bukan milik member yang sedang login.',
  })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser('id') memberUserId: number,
  ) {
    return this.reviewService.create(createReviewDto, memberUserId);
  }

  @Get()
  @ApiOperation({
    summary: 'Daftar Ulasan & Testimoni',
    description:
      'Mendapatkan daftar ulasan, dapat difilter berdasarkan ID Ruangan (spaceId).',
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    type: Number,
    description: 'Filter ulasan berdasarkan ID Space / Ruangan',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Nomor halaman pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Batas data per halaman (default: 10)',
  })
  findAll(
    @Query('spaceId') spaceId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.findAll(
      spaceId ? Number(spaceId) : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('space/:spaceId/summary')
  @ApiOperation({
    summary: 'Ringkasan Rating & Total Review untuk Space',
    description: 'Mendapatkan nilai rata-rata rating dan total jumlah ulasan.',
  })
  @ApiResponse({ status: 200, description: 'Statistik rating berhasil dimuat.' })
  getAverageRating(@Param('spaceId', ParseIntPipe) spaceId: number) {
    return this.reviewService.getAverageRating(spaceId);
  }
}
