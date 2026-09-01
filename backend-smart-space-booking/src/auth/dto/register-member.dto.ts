import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterMemberDto {
  @ApiProperty({
    example: 'member_kevin',
    description: 'Username unik untuk member',
  })
  @IsString({ message: 'Username harus berupa teks' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password untuk akun member (minimal 6 karakter)',
  })
  @IsString({ message: 'Password harus berupa teks' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({
    example: 'Kevin Sanjaya',
    description: 'Nama lengkap member',
  })
  @IsString({ message: 'Nama member harus berupa teks' })
  @IsNotEmpty({ message: 'Nama member tidak boleh kosong' })
  namaMember: string;

  @ApiProperty({
    example: 'SMK Negeri 1 Surabaya',
    description: 'Instansi, perusahaan, atau institusi asal member',
  })
  @IsString({ message: 'Instansi harus berupa teks' })
  @IsNotEmpty({ message: 'Instansi tidak boleh kosong' })
  instansi: string;

  @ApiProperty({
    example: 'Jl. Pemuda No. 45, Surabaya',
    description: 'Alamat domisili member',
  })
  @IsString({ message: 'Alamat harus berupa teks' })
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  alamat: string;

  @ApiProperty({
    example: '081234567890',
    description: 'Nomor telepon / WhatsApp member',
  })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  telp: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    description: 'URL foto profil member',
  })
  @IsOptional()
  @IsString({ message: 'Foto harus berupa URL teks' })
  foto?: string;
}
