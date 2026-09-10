import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    const sqlStatements = [
      `ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin_space', 'staff', 'member') NOT NULL DEFAULT 'member';`,
      `ALTER TABLE User MODIFY COLUMN role ENUM('super_admin', 'admin_space', 'staff', 'member') NOT NULL DEFAULT 'member';`,
      `ALTER TABLE transaksi ADD COLUMN persentaseKomisiPlatform DOUBLE DEFAULT 10;`,
      `ALTER TABLE Transaksi ADD COLUMN persentaseKomisiPlatform DOUBLE DEFAULT 10;`,
      `ALTER TABLE transaksi ADD COLUMN komisiPlatform DOUBLE DEFAULT 0;`,
      `ALTER TABLE Transaksi ADD COLUMN komisiPlatform DOUBLE DEFAULT 0;`,
      `ALTER TABLE transaksi ADD COLUMN pendapatanOwner DOUBLE DEFAULT 0;`,
      `ALTER TABLE Transaksi ADD COLUMN pendapatanOwner DOUBLE DEFAULT 0;`,
    ];

    for (const sql of sqlStatements) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch {}
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
