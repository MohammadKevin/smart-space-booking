import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterOwnerDto {
  @ApiProperty({
    example: 'owner@example.com',
    description: 'Email unik untuk pengelola / admin space',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password untuk akun admin space (minimal 6 karakter)',
  })
  @IsString({ message: 'Password harus berupa teks' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({
    example: 'SpaceWorks Hub Surabaya',
    description: 'Nama bisnis coworking space / workstation',
  })
  @IsString({ message: 'Nama coworking harus berupa teks' })
  @IsNotEmpty({ message: 'Nama coworking tidak boleh kosong' })
  namaCoworking: string;

  @ApiProperty({
    example: 'Budi Santoso',
    description: 'Nama lengkap pemilik / penanggung jawab space',
  })
  @IsString({ message: 'Nama pemilik harus berupa teks' })
  @IsNotEmpty({ message: 'Nama pemilik tidak boleh kosong' })
  namaPemilik: string;

  @ApiProperty({
    example: 'Jl. Basuki Rahmat No. 12-14, Surabaya',
    description: 'Alamat lengkap coworking space',
  })
  @IsString({ message: 'Alamat harus berupa teks' })
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  alamat: string;

  @ApiProperty({
    example: '081987654321',
    description: 'Nomor telepon resmi coworking space',
  })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  telp: string;
}
