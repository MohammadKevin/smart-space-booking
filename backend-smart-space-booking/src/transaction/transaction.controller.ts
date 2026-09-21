import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Get(':id/invoice/pdf')
  @ApiOperation({
    summary: 'Unduh Berkas Invoice PDF Resmi',
    description:
      'Menghasilkan berkas faktur/bukti pembayaran resmi dalam format PDF standar A4.',
  })
  async downloadInvoicePdf(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.transactionService.getInvoicePdf(
      id,
      user,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Post(':reservationId/pay')
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Memulai Pembayaran Reservasi (Direct VA / Midtrans Snap)',
    description:
      'Member membuat token Snap atau langsung mendapatkan VA/QRIS Midtrans untuk menyelesaikan pembayaran reservasi.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pembayaran berhasil diinisialisasi.',
  })
  startPayment(
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @GetUser('id') memberUserId: number,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.transactionService.startPayment(
      reservationId,
      memberUserId,
      paymentMethod,
    );
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
  @Roles(Role.super_admin, Role.admin_space, Role.staff)
  @ApiOperation({
    summary: 'Tandai Transaksi sebagai Refund',
    description:
      'Super Admin / Admin Space / Staff menandai transaksi lunas sebagai refund, misalnya saat pembatalan sebelum check-in.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaksi ditandai sebagai refund.',
  })
  markRefund(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.transactionService.markRefund(id, user);
  }
}
