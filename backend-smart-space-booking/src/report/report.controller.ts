import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports & Financial Analytics')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin_space)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Ringkasan Metrik Dashboard',
    description: 'Menampilkan total pendapatan, jumlah space, jumlah staff, dan ringkasan status reservasi untuk Admin Space.',
  })
  @ApiResponse({ status: 200, description: 'Ringkasan metrik berhasil dimuat.' })
  getDashboardSummary(@GetUser('id') ownerUserId: number) {
    return this.reportService.getDashboardSummary(ownerUserId);
  }

  @Get('monthly-revenue')
  @ApiOperation({
    summary: 'Laporan Pendapatan Bulanan',
    description: 'Menghitung total pendapatan dan jumlah booking per bulan (Januari - Desember) pada tahun yang dipilih.',
  })
  @ApiResponse({ status: 200, description: 'Laporan pendapatan bulanan berhasil dimuat.' })
  getMonthlyRevenue(
    @GetUser('id') ownerUserId: number,
    @Query() queryDto: ReportQueryDto,
  ) {
    return this.reportService.getMonthlyRevenue(ownerUserId, queryDto.year);
  }

  @Get('space-distribution')
  @ApiOperation({
    summary: 'Distribusi Pendapatan Berdasarkan Tipe Space',
    description: 'Menganalisis pendapatan dan kontribusi pesanan berdasarkan tipe: desk, meeting_room, dan private_office.',
  })
  @ApiResponse({ status: 200, description: 'Distribusi tipe space berhasil dimuat.' })
  getSpaceTypeDistribution(@GetUser('id') ownerUserId: number) {
    return this.reportService.getSpaceTypeDistribution(ownerUserId);
  }

  @Get('recent-transactions')
  @ApiOperation({
    summary: 'Daftar Transaksi Terbaru',
    description: 'Mengambil riwayat transaksi dan reservasi terbaru pada coworking space.',
  })
  @ApiResponse({ status: 200, description: 'Daftar transaksi terbaru berhasil dimuat.' })
  getRecentTransactions(
    @GetUser('id') ownerUserId: number,
    @Query() queryDto: ReportQueryDto,
  ) {
    return this.reportService.getRecentTransactions(ownerUserId, queryDto.limit);
  }
}
