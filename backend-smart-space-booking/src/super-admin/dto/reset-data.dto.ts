import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResetDataDto {
  @ApiProperty({
    example: 'RESET ALL DATA',
    description: 'Teks konfirmasi wajib persis sama dengan "RESET ALL DATA"',
  })
  @IsString({ message: 'Teks konfirmasi harus berupa teks' })
  @IsNotEmpty({ message: 'Teks konfirmasi tidak boleh kosong' })
  confirmationText: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Konfirmasi pengecualian akun super_admin agar tidak ikut terhapus',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'excludeSuperAdmin harus berupa boolean' })
  excludeSuperAdmin?: boolean;
}
