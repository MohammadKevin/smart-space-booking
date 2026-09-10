import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({
    example: 'staff@example.com',
    description: 'Email unik untuk staff operasional',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password untuk akun staff (minimal 6 karakter)',
  })
  @IsString({ message: 'Password harus berupa teks' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({
    example: 'Ani Lestari',
    description: 'Nama lengkap staff operasional',
  })
  @IsString({ message: 'Nama staff harus berupa teks' })
  @IsNotEmpty({ message: 'Nama staff tidak boleh kosong' })
  namaStaff: string;

  @ApiProperty({
    example: '081223344556',
    description: 'Nomor telepon / WhatsApp staff',
  })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @Matches(/^(\+62|62|08)\d+$/, {
    message: 'Nomor telepon harus format Indonesia (08xx / 62xx / +62xx)',
  })
  @MinLength(12, {
    message: 'Nomor telepon minimal 12 digit (format Indonesia)',
  })
  telp: string;
}
