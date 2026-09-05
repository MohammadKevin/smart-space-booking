import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email pengguna yang didaftarkan',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit kode verifikasi OTP',
  })
  @IsString({ message: 'Kode OTP harus berupa teks' })
  @IsNotEmpty({ message: 'Kode OTP tidak boleh kosong' })
  @Length(6, 6, { message: 'Kode OTP harus terdiri dari 6 digit angka' })
  otp: string;
}
