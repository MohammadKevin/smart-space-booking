import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyQrDto {
  @ApiProperty({
    example: 'SSB-1725178900000-A3B9F1',
    description: 'String kode QR hasil scan dari aplikasi/tiket member',
  })
  @IsString({ message: 'Kode QR harus berupa teks' })
  @IsNotEmpty({ message: 'Kode QR tidak boleh kosong' })
  qrCode: string;
}
