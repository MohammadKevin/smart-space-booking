import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWaitlistDto {
  @ApiProperty({ description: 'ID Ruangan / Space', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  spaceId: number;

  @ApiProperty({ description: 'Tanggal (YYYY-MM-DD)', example: '2026-09-15' })
  @IsString()
  @IsNotEmpty()
  tanggal: string;

  @ApiProperty({ description: 'Jam mulai (HH:mm)', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  jamMulai: string;

  @ApiProperty({ description: 'Durasi pemakaian dalam jam', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  durasiJam: number;
}
