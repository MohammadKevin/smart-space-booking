import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SpaceTipe } from '@prisma/client';

export class CreateSpaceDto {
  @ApiProperty({
    example: 'Dedicated Hot Desk #04',
    description: 'Nama ruangan / workstation / desk',
  })
  @IsString({ message: 'Nama space harus berupa teks' })
  @IsNotEmpty({ message: 'Nama space tidak boleh kosong' })
  namaSpace: string;

  @ApiProperty({
    enum: SpaceTipe,
    example: SpaceTipe.desk,
    description: 'Tipe space: desk, meeting_room, atau private_office',
  })
  @IsEnum(SpaceTipe, { message: 'Tipe space harus salah satu dari: desk, meeting_room, private_office' })
  @IsNotEmpty({ message: 'Tipe space tidak boleh kosong' })
  tipe: SpaceTipe;

  @ApiProperty({
    example: 25000,
    description: 'Harga sewa per jam dalam Rupiah (IDR)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Harga per jam harus berupa angka' })
  @IsPositive({ message: 'Harga per jam harus bernilai positif' })
  hargaPerJam: number;

  @ApiProperty({
    example: 1,
    description: 'Kapasitas maksimal orang dalam space',
  })
  @Type(() => Number)
  @IsInt({ message: 'Kapasitas harus berupa bilangan bulat' })
  @Min(1, { message: 'Kapasitas minimal 1 orang' })
  kapasitas: number;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80',
    description: 'URL foto ruangan / workstation',
  })
  @IsOptional()
  @IsString({ message: 'Foto harus berupa URL teks' })
  foto?: string;

  @ApiPropertyOptional({
    example: 'Workstation ergonomis dengan koneksi internet Gigabit, stopkontak dedicated, dan view ke taman.',
    description: 'Deskripsi fasilitas dan keunggulan space',
  })
  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa teks' })
  deskripsi?: string;
}
