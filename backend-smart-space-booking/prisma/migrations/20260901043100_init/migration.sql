-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('admin_space', 'staff', 'member') NOT NULL DEFAULT 'member',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `space_owners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaCoworking` VARCHAR(191) NOT NULL,
    `namaPemilik` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `telp` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `space_owners_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staffs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaStaff` VARCHAR(191) NOT NULL,
    `telp` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staffs_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaMember` VARCHAR(191) NOT NULL,
    `instansi` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `telp` VARCHAR(191) NOT NULL,
    `foto` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spaces` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaSpace` VARCHAR(191) NOT NULL,
    `tipe` ENUM('desk', 'meeting_room', 'private_office') NOT NULL,
    `hargaPerJam` DOUBLE NOT NULL,
    `kapasitas` INTEGER NOT NULL,
    `foto` VARCHAR(191) NULL,
    `deskripsi` TEXT NULL,
    `ownerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diskon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaDiskon` VARCHAR(191) NOT NULL,
    `kodeDiskon` VARCHAR(191) NULL,
    `persentaseDiskon` DOUBLE NOT NULL,
    `tanggalAwal` DATETIME(3) NOT NULL,
    `tanggalAkhir` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `diskon_kodeDiskon_key`(`kodeDiskon`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tanggalReservasi` DATETIME(3) NOT NULL,
    `jamMulai` VARCHAR(191) NOT NULL,
    `durasiJam` INTEGER NOT NULL,
    `status` ENUM('pending', 'disetujui', 'aktif', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'pending',
    `qrCode` VARCHAR(191) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reservasi_qrCode_key`(`qrCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_reservasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservasiId` INTEGER NOT NULL,
    `spaceId` INTEGER NOT NULL,
    `diskonId` INTEGER NULL,
    `totalHarga` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `detail_reservasi_reservasiId_key`(`reservasiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `space_owners` ADD CONSTRAINT `space_owners_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffs` ADD CONSTRAINT `staffs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffs` ADD CONSTRAINT `staffs_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `space_owners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spaces` ADD CONSTRAINT `spaces_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `space_owners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservasi` ADD CONSTRAINT `reservasi_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `space_owners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservasi` ADD CONSTRAINT `reservasi_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_reservasi` ADD CONSTRAINT `detail_reservasi_reservasiId_fkey` FOREIGN KEY (`reservasiId`) REFERENCES `reservasi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_reservasi` ADD CONSTRAINT `detail_reservasi_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_reservasi` ADD CONSTRAINT `detail_reservasi_diskonId_fkey` FOREIGN KEY (`diskonId`) REFERENCES `diskon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
