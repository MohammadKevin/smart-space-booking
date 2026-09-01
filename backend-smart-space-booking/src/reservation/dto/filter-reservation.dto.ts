import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservasiStatus } from '@prisma/client';

export class FilterReservationDto {
  @ApiPropertyOptional({
    enum: ReservasiStatus,
    description: 'Filter berdasarkan status reservasi: pending, disetujui, aktif, selesai, dibatalkan',
  })
  @IsOptional()
  @IsEnum(ReservasiStatus)
  status?: ReservasiStatus;

  @ApiPropertyOptional({
    example: '2026-09-10',
    description: 'Filter berdasarkan tanggal reservasi (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  tanggal?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter berdasarkan ID Space',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceId?: number;
}
