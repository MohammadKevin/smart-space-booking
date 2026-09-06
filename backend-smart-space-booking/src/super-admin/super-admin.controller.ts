import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Super Admin (Platform Owner / CEO)')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.super_admin)
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Executive Summary Finansial Platform',
    description:
      'Menampilkan Total GMV, Total Keuntungan Bersih Platform (Komisi CEO), Total Space Owner, Total Ruangan, dan Member se-Platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Executive overview berhasil dimuat.',
  })
  getOverview() {
    return this.superAdminService.getOverview();
  }

  @Get('commission')
  @ApiOperation({
    summary: 'Melihat Persentase Komisi Platform Aktif',
    description:
      'Mengambil persentase tarif komisi platform saat ini yang dikenakan ke seluruh transaksi sewa.',
  })
  getCommissionRate() {
    return this.superAdminService.getCommissionRate();
  }

  @Put('commission')
  @ApiOperation({
    summary: 'Memperbarui Persentase Komisi Platform',
    description:
      'Mengubah persentase tarif komisi platform secara dinamis tanpa perlu restart backend.',
  })
  setCommissionRate(@Body() dto: UpdateCommissionDto) {
    return this.superAdminService.setCommissionRate(dto.commissionPercent);
  }

  @Get('monthly-revenue')
  @ApiOperation({
    summary: 'Laporan Pendapatan Platform Bulanan',
    description:
      'Menghitung rincian GMV, Komisi Platform, dan Payout Space Owner untuk 12 bulan.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Tahun laporan (default tahun berjalan)',
  })
  getMonthlyRevenue(@Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.superAdminService.getMonthlyRevenue(targetYear);
  }

  @Get('owners')
  @ApiOperation({
    summary: 'Daftar Seluruh Mitra Space Owner (Sellers / Merchants)',
    description:
      'Menampilkan performa toko tiap Space Owner, rincian GMV, potongan komisi platform, dan hak saldo payout.',
  })
  getAllSpaceOwners() {
    return this.superAdminService.getAllSpaceOwners();
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Log Transaksi Global Se-Platform',
    description:
      'Monitoring seluruh transaksi yang terjadi di platform secara real-time.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Batas jumlah transaksi (default 50)',
  })
  getAllTransactions(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.superAdminService.getAllTransactions(limitNum);
  }
}
