import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email akun yang sedang di-reset',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit kode reset OTP',
  })
  @IsString({ message: 'Kode OTP harus berupa teks' })
  @IsNotEmpty({ message: 'Kode OTP tidak boleh kosong' })
  @Length(6, 6, { message: 'Kode OTP harus terdiri dari 6 digit angka' })
  otp: string;

  @ApiProperty({
    example: 'newpassword123*',
    description: 'Kata sandi baru (minimal 6 karakter)',
  })
  @IsString({ message: 'Password baru harus berupa teks' })
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong' })
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  password: string;
}
