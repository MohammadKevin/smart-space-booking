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
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'spaceId harus berupa bilangan bulat' })
  spaceId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias snake_case untuk spaceId',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'space_id harus berupa bilangan bulat' })
  space_id?: number;

  @ApiProperty({
    example: '2026-09-10',
    description: 'Tanggal reservasi (format YYYY-MM-DD atau ISO-8601 string)',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Tanggal reservasi harus berformat YYYY-MM-DD atau ISO string' },
  )
  tanggalReservasi?: string;

  @ApiPropertyOptional({
    example: '2026-09-10',
    description: 'Alias snake_case untuk tanggalReservasi',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'tanggal_reservasi harus berformat YYYY-MM-DD atau ISO string' },
  )
  tanggal_reservasi?: string;

  @ApiPropertyOptional({
    example: '2026-09-10',
    description: 'Alias pendek untuk tanggalReservasi',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'tanggal harus berformat YYYY-MM-DD atau ISO string' },
  )
  tanggal?: string;

  @ApiProperty({
    example: '09:00',
    description: 'Jam mulai reservasi (format HH:mm, 24 jam)',
  })
  @IsOptional()
  @IsString({ message: 'Jam mulai harus berupa teks' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format jam mulai harus HH:mm (contoh: 09:00, 14:30)',
  })
  jamMulai?: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Alias snake_case untuk jamMulai',
  })
  @IsOptional()
  @IsString({ message: 'jam_mulai harus berupa teks' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format jam_mulai harus HH:mm (contoh: 09:00, 14:30)',
  })
  jam_mulai?: string;

  @ApiProperty({
    example: 3,
    description: 'Durasi pemakaian dalam jam (minimal 1 jam, maksimal 24 jam)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Durasi jam harus berupa bilangan bulat' })
  @Min(1, { message: 'Durasi pemakaian minimal 1 jam' })
  @Max(24, { message: 'Durasi pemakaian maksimal 24 jam' })
  durasiJam?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Alias snake_case untuk durasiJam',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'durasi_jam harus berupa bilangan bulat' })
  @Min(1, { message: 'Durasi pemakaian minimal 1 jam' })
  @Max(24, { message: 'Durasi pemakaian maksimal 24 jam' })
  durasi_jam?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Alias pendek untuk durasiJam',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'durasi harus berupa bilangan bulat' })
  @Min(1, { message: 'Durasi pemakaian minimal 1 jam' })
  @Max(24, { message: 'Durasi pemakaian maksimal 24 jam' })
  durasi?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID program promo / diskon jika ada',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'diskonId harus berupa bilangan bulat' })
  diskonId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias snake_case untuk diskonId',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'diskon_id harus berupa bilangan bulat' })
  diskon_id?: number;

  @ApiPropertyOptional({
    example: 'PROMO2026',
    description: 'Kode promo / kupon diskon jika ada',
  })
  @IsOptional()
  @IsString({ message: 'Kode diskon harus berupa teks' })
  kodeDiskon?: string;

  @ApiPropertyOptional({
    example: 'PROMO2026',
    description: 'Alias snake_case untuk kodeDiskon',
  })
  @IsOptional()
  @IsString({ message: 'kode_diskon harus berupa teks' })
  kode_diskon?: string;
}
