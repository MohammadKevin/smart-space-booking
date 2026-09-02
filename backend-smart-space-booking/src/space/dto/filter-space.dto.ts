import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SpaceTipe } from '@prisma/client';

export class FilterSpaceDto {
  @ApiPropertyOptional({
    description: 'Kata kunci pencarian pada nama space atau deskripsi',
    example: 'Hot Desk',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: SpaceTipe,
    description: 'Filter berdasarkan tipe: desk, meeting_room, private_office',
  })
  @IsOptional()
  @IsEnum(SpaceTipe)
  tipe?: SpaceTipe;

  @ApiPropertyOptional({
    description: 'Kapasitas minimal orang',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minKapasitas?: number;

  @ApiPropertyOptional({
    description: 'Kapasitas maksimal orang',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxKapasitas?: number;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Space Owner',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @ApiPropertyOptional({
    description:
      'Tanggal reservasi yang ingin dicek ketersediaannya (YYYY-MM-DD)',
    example: '2026-09-10',
  })
  @IsOptional()
  @IsString()
  tanggal?: string;

  @ApiPropertyOptional({
    description: 'Jam mulai untuk cek ketersediaan (format HH:mm)',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  jamMulai?: string;

  @ApiPropertyOptional({
    description: 'Durasi pemakaian dalam jam untuk cek ketersediaan',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durasiJam?: number;
}
