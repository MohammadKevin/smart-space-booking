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
import { Type, Transform } from 'class-transformer';

export class CreateReservationDto {
  @ApiProperty({
    example: 1,
    description: 'ID Workstation / Ruangan yang dipesan',
  })
  @Transform(({ value, obj }) => value ?? obj?.space_id)
  @Type(() => Number)
  @IsInt({ message: 'spaceId harus berupa bilangan bulat' })
  @IsNotEmpty({ message: 'spaceId tidak boleh kosong' })
  spaceId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias snake_case untuk spaceId (opsional jika spaceId diisi)',
  })
  @IsOptional()
  space_id?: number;

  @ApiProperty({
    example: '2026-09-10',
    description: 'Tanggal reservasi (format YYYY-MM-DD atau ISO string)',
  })
  @Transform(({ value, obj }) => value ?? obj?.tanggal_reservasi ?? obj?.tanggal)
  @IsDateString(
    {},
    { message: 'Tanggal reservasi harus berformat YYYY-MM-DD atau ISO string' },
  )
  @IsNotEmpty({ message: 'tanggalReservasi tidak boleh kosong' })
  tanggalReservasi: string;

  @ApiPropertyOptional({
    example: '2026-09-10',
    description: 'Alias snake_case untuk tanggalReservasi',
  })
  @IsOptional()
  tanggal_reservasi?: string;

  @ApiPropertyOptional({
    example: '2026-09-10',
    description: 'Alias pendek untuk tanggalReservasi',
  })
  @IsOptional()
  tanggal?: string;

  @ApiProperty({
    example: '09:00',
    description: 'Jam mulai reservasi (format HH:mm, 24 jam)',
  })
  @Transform(({ value, obj }) => value ?? obj?.jam_mulai)
  @IsString({ message: 'Jam mulai harus berupa teks' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format jam mulai harus HH:mm (contoh: 09:00, 14:30)',
  })
  @IsNotEmpty({ message: 'jamMulai tidak boleh kosong' })
  jamMulai: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Alias snake_case untuk jamMulai',
  })
  @IsOptional()
  jam_mulai?: string;

  @ApiProperty({
    example: 3,
    description: 'Durasi pemakaian dalam jam (minimal 1 jam, maksimal 24 jam)',
  })
  @Transform(({ value, obj }) => value ?? obj?.durasi_jam ?? obj?.durasi)
  @Type(() => Number)
  @IsInt({ message: 'Durasi jam harus berupa bilangan bulat' })
  @Min(1, { message: 'Durasi pemakaian minimal 1 jam' })
  @Max(24, { message: 'Durasi pemakaian maksimal 24 jam' })
  @IsNotEmpty({ message: 'durasiJam tidak boleh kosong' })
  durasiJam: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Alias snake_case untuk durasiJam',
  })
  @IsOptional()
  durasi_jam?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Alias pendek untuk durasiJam',
  })
  @IsOptional()
  durasi?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID program promo / diskon jika ada',
  })
  @Transform(({ value, obj }) => value ?? obj?.diskon_id)
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'diskonId harus berupa bilangan bulat' })
  diskonId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias snake_case untuk diskonId',
  })
  @IsOptional()
  diskon_id?: number;

  @ApiPropertyOptional({
    example: 'PROMO2026',
    description: 'Kode promo / kupon diskon jika ada',
  })
  @Transform(({ value, obj }) => value ?? obj?.kode_diskon)
  @IsOptional()
  @IsString({ message: 'Kode diskon harus berupa teks' })
  kodeDiskon?: string;

  @ApiPropertyOptional({
    example: 'PROMO2026',
    description: 'Alias snake_case untuk kodeDiskon',
  })
  @IsOptional()
  kode_diskon?: string;
}
