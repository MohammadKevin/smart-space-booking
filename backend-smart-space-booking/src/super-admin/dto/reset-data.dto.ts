import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ResetDataDto {
  @ApiPropertyOptional({
    example: 'RESET ALL DATA',
    description:
      'Teks konfirmasi ("RESET ALL DATA") opsional jika menggunakan secretKey atau diizinkan di dev',
    default: 'RESET ALL DATA',
  })
  @IsOptional()
  @IsString({ message: 'Teks konfirmasi harus berupa teks' })
  confirmationText?: string;

  @ApiPropertyOptional({
    example: 'WorkNest_CEO_SuperAdmin_Secret_Key_2026*',
    description: 'Kunci rahasia SUPER_ADMIN_SECRET_KEY jika dipanggil tanpa JWT super_admin',
  })
  @IsOptional()
  @IsString({ message: 'secretKey harus berupa teks' })
  secretKey?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Flag excludeSuperAdmin (opsional)',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'excludeSuperAdmin harus berupa boolean' })
  excludeSuperAdmin?: boolean;
}
