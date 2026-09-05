import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email pengguna yang akan dikirimi ulang OTP',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiPropertyOptional({
    example: 'register',
    enum: ['register', 'forgot_password'],
    description: 'Tipe permintaan OTP: register atau forgot_password',
  })
  @IsOptional()
  @IsString()
  type?: 'register' | 'forgot_password' = 'register';
}
