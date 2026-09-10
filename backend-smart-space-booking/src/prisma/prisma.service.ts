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

    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE transaksi ADD COLUMN persentaseKomisiPlatform DOUBLE DEFAULT 10;`,
      );
    } catch {}

    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE transaksi ADD COLUMN komisiPlatform DOUBLE DEFAULT 0;`,
      );
    } catch {}

    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE transaksi ADD COLUMN pendapatanOwner DOUBLE DEFAULT 0;`,
      );
    } catch {}
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
