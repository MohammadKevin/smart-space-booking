-- AlterTable
ALTER TABLE `users` CHANGE COLUMN `username` `email` VARCHAR(191) NOT NULL;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_username_key` TO `users_email_key`;
