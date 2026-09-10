import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SpaceModule } from './space/space.module';
import { DiscountModule } from './discount/discount.module';
import { ReservationModule } from './reservation/reservation.module';
import { CheckinModule } from './checkin/checkin.module';
import { ReportModule } from './report/report.module';
import { TransactionModule } from './transaction/transaction.module';
import { ReviewModule } from './review/review.module';
import { MailModule } from './common/mail/mail.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { NotificationModule } from './notification/notification.module';
import { WaitlistModule } from './waitlist/waitlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    UserModule,
    SuperAdminModule,
    SpaceModule,
    DiscountModule,
    ReservationModule,
    CheckinModule,
    ReportModule,
    TransactionModule,
    ReviewModule,
    NotificationModule,
    WaitlistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
