import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Kevin Sanjaya Pratama' })
  @IsOptional()
  @IsString()
  nama?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({ example: 'oldpassword123' })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  password?: string;

  @ApiPropertyOptional({ example: 'Universitas Airlangga' })
  @IsOptional()
  @IsString()
  instansi?: string;

  @ApiPropertyOptional({ example: 'Jl. Ahmad Yani No. 100, Surabaya' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: '081234567899' })
  @IsOptional()
  @IsString()
  telp?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  foto?: string;

  @ApiPropertyOptional({ example: 'SpaceWorks Innovation Hub' })
  @IsOptional()
  @IsString()
  namaCoworking?: string;
}
