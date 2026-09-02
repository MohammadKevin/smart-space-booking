import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MidtransNotificationController } from './midtrans-notification.controller';
import { MidtransService } from './midtrans.service';

@Module({
  controllers: [TransactionController, MidtransNotificationController],
  providers: [TransactionService, MidtransService],
  exports: [TransactionService, MidtransService],
})
export class TransactionModule {}