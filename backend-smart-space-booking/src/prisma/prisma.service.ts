import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin_space', 'staff', 'member') NOT NULL DEFAULT 'member';`,
      );
    } catch {}
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
