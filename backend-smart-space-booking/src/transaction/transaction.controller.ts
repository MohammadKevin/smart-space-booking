import {
  Controller,
  Get,
  Post,
  Patch,
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
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Transactions & Payments')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post(':reservationId/pay')
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Memulai Pembayaran Reservasi (Midtrans Snap)',
    description:
      'Member membuat token Snap untuk menyelesaikan pembayaran reservasi yang sudah disetujui.',
  })
  @ApiResponse({ status: 201, description: 'Snap token berhasil dibuat.' })
  startPayment(
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @GetUser('id') memberUserId: number,
  ) {
    return this.transactionService.startPayment(reservationId, memberUserId);
  }

  @Get()
  @ApiOperation({
    summary: 'Daftar Transaksi Sesuai Role',
    description:
      'Member melihat transaksinya sendiri; Admin Space & Staff melihat seluruh transaksi pada coworking space mereka (dapat difilter per spaceId).',
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    type: Number,
    description: 'Filter transaksi berdasarkan ID Ruangan / Space',
  })
  findAll(@GetUser() user: any, @Query('spaceId') spaceId?: string) {
    return this.transactionService.findAll(
      user,
      spaceId ? Number(spaceId) : undefined,
    );
  }

  @Get('space/:spaceId')
  @ApiOperation({
    summary: 'Daftar Transaksi Berdasarkan ID Ruangan (Space)',
    description:
      'Mengambil riwayat transaksi yang terkait dengan ruangan tertentu.',
  })
  findBySpace(
    @Param('spaceId', ParseIntPipe) spaceId: number,
    @GetUser() user: any,
  ) {
    return this.transactionService.findAll(user, spaceId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Satu Transaksi / Invoice',
    description:
      'Menampilkan rincian invoice, status pembayaran, dan data reservasi terkait.',
  })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan.' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.transactionService.findOne(id, user);
  }

  @Post(':id/sync')
  @ApiOperation({
    summary: 'Sinkronkan Status Pembayaran dengan Midtrans',
    description:
      'Menanyakan ulang status transaksi ke Midtrans dan memperbarui status pembayaran di sistem.',
  })
  syncPayment(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.transactionService.syncPayment(id, user);
  }

  @Patch(':id/refund')
  @Roles(Role.admin_space, Role.staff)
  @ApiOperation({
    summary: 'Tandai Transaksi sebagai Refund',
    description:
      'Admin Space / Staff menandai transaksi lunas sebagai refund, misalnya saat pembatalan sebelum check-in.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaksi ditandai sebagai refund.',
  })
  markRefund(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.transactionService.markRefund(id, user);
  }
}
