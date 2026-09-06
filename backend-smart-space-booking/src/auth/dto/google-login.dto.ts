import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'ID Token atau Access Token dari Google OAuth / Credential',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI...',
  })
  @IsString({ message: 'Token Google harus berupa teks' })
  @IsNotEmpty({ message: 'Token Google tidak boleh kosong' })
  token: string;

  @ApiPropertyOptional({
    description: 'Nama pengguna dari profil Google',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString({ message: 'Nama harus berupa teks' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Alamat email pengguna Google',
    example: 'johndoe@gmail.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({
    description: 'URL foto avatar profil Google',
    example: 'https://lh3.googleusercontent.com/a/...',
  })
  @IsOptional()
  @IsString({ message: 'URL foto avatar harus berupa teks' })
  avatar?: string;
}
