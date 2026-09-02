import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';

/**
 * Public endpoint that receives Midtrans HTTP(S) notifications.
 * Must remain unauthenticated so Midtrans can reach it without custom headers.
 */
@ApiTags('Transactions & Payments')
@Controller('transactions')
export class MidtransNotificationController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook Notifikasi Pembayaran dari Midtrans',
    description: 'Diterima oleh Midtrans saat status pembayaran berubah. Memverifikasi signature lalu memperbarui status pembayaran.',
  })
  @ApiResponse({ status: 200, description: 'Notifikasi diterima.' })
  @ApiResponse({ status: 202, description: 'Notifikasi diterima (sukses).' })
  handleNotification(@Body() payload: Record<string, any>) {
    return this.transactionService.handleNotification(payload);
  }
}