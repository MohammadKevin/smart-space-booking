import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SecretProvisionDto {
  @ApiProperty({
    example: 'ceo@worknest.app',
    description: 'Email akun Super Admin / Platform Owner',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'CeoPassword123*',
    description: 'Kata sandi akun Super Admin (minimal 6 karakter)',
  })
  @IsString({ message: 'Password harus berupa teks' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({
    example: 'WorkNest_CEO_SuperAdmin_Secret_Key_2026*',
    description: 'Kunci rahasia Super Admin dari konfigurasi server (.env)',
  })
  @IsString({ message: 'Secret key harus berupa teks' })
  @IsNotEmpty({ message: 'Secret key tidak boleh kosong' })
  secretKey: string;

  @ApiPropertyOptional({
    example: 'Chief Executive Officer',
    description: 'Nama tampilan akun Super Admin',
  })
  @IsOptional()
  @IsString()
  nama?: string;
}
