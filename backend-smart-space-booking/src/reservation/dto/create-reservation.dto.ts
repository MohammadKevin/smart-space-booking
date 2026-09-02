import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @ApiProperty({
    example: 1,
    description: 'ID Workstation / Ruangan yang dipesan',
  })
  @Type(() => Number)
  @IsInt({ message: 'spaceId harus berupa bilangan bulat' })
  @IsNotEmpty({ message: 'spaceId tidak boleh kosong' })
  spaceId: number;

  @ApiProperty({
    example: '2026-09-10',
    description: 'Tanggal reservasi (format YYYY-MM-DD atau ISO-8601 string)',
  })
  @IsDateString(
    {},
    { message: 'Tanggal reservasi harus berformat YYYY-MM-DD atau ISO string' },
  )
  @IsNotEmpty({ message: 'Tanggal reservasi tidak boleh kosong' })
  tanggalReservasi: string;

  @ApiProperty({
    example: '09:00',
    description: 'Jam mulai reservasi (format HH:mm, 24 jam)',
  })
  @IsString({ message: 'Jam mulai harus berupa teks' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format jam mulai harus HH:mm (contoh: 09:00, 14:30)',
  })
  @IsNotEmpty({ message: 'Jam mulai tidak boleh kosong' })
  jamMulai: string;

  @ApiProperty({
    example: 3,
    description: 'Durasi pemakaian dalam jam (minimal 1 jam, maksimal 24 jam)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Durasi jam harus berupa bilangan bulat' })
  @Min(1, { message: 'Durasi pemakaian minimal 1 jam' })
  @Max(24, { message: 'Durasi pemakaian maksimal 24 jam' })
  durasiJam: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID program promo / diskon jika ada',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'diskonId harus berupa bilangan bulat' })
  diskonId?: number;

  @ApiPropertyOptional({
    example: 'PROMO2026',
    description: 'Kode promo / kupon diskon jika ada',
  })
  @IsOptional()
  @IsString({ message: 'Kode diskon harus berupa teks' })
  kodeDiskon?: string;
}
