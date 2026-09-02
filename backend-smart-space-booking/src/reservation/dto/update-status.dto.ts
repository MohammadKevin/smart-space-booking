import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReservasiStatus } from '@prisma/client';

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: ReservasiStatus,
    example: ReservasiStatus.disetujui,
    description:
      'Status reservasi baru: pending, disetujui, aktif, selesai, dibatalkan',
  })
  @IsEnum(ReservasiStatus, {
    message:
      'Status harus salah satu dari: pending, disetujui, aktif, selesai, dibatalkan',
  })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  status: ReservasiStatus;
}
