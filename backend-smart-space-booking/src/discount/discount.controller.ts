import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Discounts & Promo Codes')
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Membuat Promo / Diskon Baru',
    description:
      'Hanya dapat diakses oleh admin_space untuk membuat kode promo baru.',
  })
  @ApiResponse({ status: 201, description: 'Diskon berhasil dibuat.' })
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountService.create(createDiscountDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan Semua Daftar Promo',
    description: 'Daftar promo dan diskon yang tersedia.',
  })
  @ApiResponse({ status: 200, description: 'Daftar diskon berhasil dimuat.' })
  findAll() {
    return this.discountService.findAll();
  }

  @Get('check/:code')
  @ApiOperation({
    summary: 'Cek Keaktifan dan Validitas Kode Promo',
    description:
      'Memeriksa apakah kode promo valid, ada, dan masih dalam periode tanggal berlaku.',
  })
  @ApiResponse({ status: 200, description: 'Kode promo valid.' })
  @ApiResponse({
    status: 400,
    description: 'Kode promo kedaluwarsa atau tidak aktif.',
  })
  @ApiResponse({ status: 404, description: 'Kode promo tidak ditemukan.' })
  checkValidity(@Param('code') code: string) {
    return this.discountService.checkValidity(code);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Mendapatkan Detail Satu Diskon',
    description: 'Menampilkan detail promo berdasarkan ID.',
  })
  @ApiResponse({ status: 200, description: 'Detail diskon berhasil dimuat.' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Memperbarui Promo / Diskon',
    description:
      'Hanya dapat diakses oleh admin_space untuk mengubah parameter diskon.',
  })
  @ApiResponse({ status: 200, description: 'Diskon berhasil diperbarui.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountService.update(id, updateDiscountDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Menghapus Promo / Diskon',
    description: 'Hanya dapat diakses oleh admin_space untuk menghapus promo.',
  })
  @ApiResponse({ status: 200, description: 'Diskon berhasil dihapus.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.discountService.remove(id);
  }
}
