-- AlterTable
ALTER TABLE `members` MODIFY `foto` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `spaces` MODIFY `foto` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `transaksi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomorInvoice` VARCHAR(191) NOT NULL,
    `reservasiId` INTEGER NOT NULL,
    `jumlah` DOUBLE NOT NULL,
    `metodePembayaran` VARCHAR(191) NULL,
    `snapToken` VARCHAR(191) NULL,
    `snapRedirectUrl` VARCHAR(191) NULL,
    `midtransOrderId` VARCHAR(191) NULL,
    `midtransTransId` VARCHAR(191) NULL,
    `statusPembayaran` ENUM('belum_bayar', 'menunggu_pembayaran', 'lunas', 'gagal', 'refund') NOT NULL DEFAULT 'belum_bayar',
    `dibayarPada` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transaksi_nomorInvoice_key`(`nomorInvoice`),
    UNIQUE INDEX `transaksi_reservasiId_key`(`reservasiId`),
    UNIQUE INDEX `transaksi_midtransOrderId_key`(`midtransOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_reservasiId_fkey` FOREIGN KEY (`reservasiId`) REFERENCES `reservasi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
