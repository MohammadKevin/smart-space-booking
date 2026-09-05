import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID Reservasi yang telah berstatus selesai',
    example: 1,
  })
  @IsInt({ message: 'reservasiId harus berupa angka bulat.' })
  @IsNotEmpty({ message: 'reservasiId tidak boleh kosong.' })
  reservasiId: number;

  @ApiProperty({
    description: 'Rating bintang dari 1 hingga 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Rating harus berupa angka 1 sampai 5.' })
  @Min(1, { message: 'Rating minimal adalah 1.' })
  @Max(5, { message: 'Rating maksimal adalah 5.' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Komentar testimoni atau ulasan pengalaman',
    example: 'Tempat sangat nyaman, koneksi internet kencang dan AC dingin!',
  })
  @IsOptional()
  @IsString({ message: 'Komentar harus berupa teks.' })
  komentar?: string;
}
