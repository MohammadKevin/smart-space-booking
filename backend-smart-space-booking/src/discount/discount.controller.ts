import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
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
      'Hanya dapat diakses oleh admin_space untuk membuat kode promo baru pada coworking space miliknya.',
  })
  @ApiResponse({ status: 201, description: 'Diskon berhasil dibuat.' })
  create(
    @Body() createDiscountDto: CreateDiscountDto,
    @GetUser() user: any,
  ) {
    return this.discountService.create(createDiscountDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan Semua Daftar Promo',
    description: 'Daftar promo dan diskon yang tersedia.',
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    type: Number,
    description: 'Filter promo berdasarkan ID Space Owner',
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    type: Number,
    description: 'Filter promo berdasarkan ID Ruangan (Space)',
  })
  @ApiResponse({ status: 200, description: 'Daftar diskon berhasil dimuat.' })
  findAll(
    @Query('ownerId') ownerId?: string,
    @Query('spaceId') spaceId?: string,
  ) {
    return this.discountService.findAll(
      ownerId ? Number(ownerId) : undefined,
      spaceId ? Number(spaceId) : undefined,
    );
  }

  @Get('check/:code')
  @ApiOperation({
    summary: 'Cek Keaktifan dan Validitas Kode Promo',
    description:
      'Memeriksa apakah kode promo valid, ada, dan masih dalam periode tanggal berlaku.',
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    type: Number,
    description: 'ID Ruangan untuk memastikan promo berlaku pada space terkait',
  })
  @ApiResponse({ status: 200, description: 'Kode promo valid.' })
  @ApiResponse({
    status: 400,
    description: 'Kode promo kedaluwarsa, tidak aktif, atau tidak berlaku untuk ruangan ini.',
  })
  @ApiResponse({ status: 404, description: 'Kode promo tidak ditemukan.' })
  checkValidity(
    @Param('code') code: string,
    @Query('spaceId') spaceId?: string,
  ) {
    return this.discountService.checkValidity(
      code,
      spaceId ? Number(spaceId) : undefined,
    );
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
      'Hanya dapat diakses oleh admin_space pemilik promo untuk mengubah parameter diskon.',
  })
  @ApiResponse({ status: 200, description: 'Diskon berhasil diperbarui.' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki hak akses atas promo ini.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscountDto: UpdateDiscountDto,
    @GetUser() user: any,
  ) {
    return this.discountService.update(id, updateDiscountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Menghapus Promo / Diskon',
    description: 'Hanya dapat diakses oleh admin_space pemilik promo untuk menghapus promo.',
  })
  @ApiResponse({ status: 200, description: 'Diskon berhasil dihapus.' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki hak akses atas promo ini.' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.discountService.remove(id, user);
  }
}
