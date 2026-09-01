import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiscountDto {
  @ApiProperty({
    example: 'Promo Diskon Awal Tahun 2026',
    description: 'Nama program promo / diskon',
  })
  @IsString({ message: 'Nama diskon harus berupa teks' })
  @IsNotEmpty({ message: 'Nama diskon tidak boleh kosong' })
  namaDiskon: string;

  @ApiPropertyOptional({
    example: 'PROMO2026',
    description: 'Kode kupon promo yang dapat dimasukkan saat reservasi',
  })
  @IsOptional()
  @IsString({ message: 'Kode diskon harus berupa teks' })
  kodeDiskon?: string;

  @ApiProperty({
    example: 20,
    description: 'Besaran persentase potongan harga (1 - 100%)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Persentase diskon harus berupa angka' })
  @Min(1, { message: 'Persentase minimal 1%' })
  @Max(100, { message: 'Persentase maksimal 100%' })
  persentaseDiskon: number;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Tanggal & waktu mulai berlakunya promo (ISO-8601 string)',
  })
  @IsDateString({}, { message: 'Tanggal awal harus berupa format ISO-8601 string' })
  @IsNotEmpty({ message: 'Tanggal awal tidak boleh kosong' })
  tanggalAwal: string;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Tanggal & waktu berakhirnya promo (ISO-8601 string)',
  })
  @IsDateString({}, { message: 'Tanggal akhir harus berupa format ISO-8601 string' })
  @IsNotEmpty({ message: 'Tanggal akhir tidak boleh kosong' })
  tanggalAkhir: string;
}
