import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum CheckinAction {
  AUTO = 'auto',
  CHECKIN = 'checkin',
  CHECKOUT = 'checkout',
}

export class ProcessCheckinDto {
  @ApiProperty({
    example: 'SSB-1725178900000-A3B9F1',
    description: 'String kode QR hasil scan',
  })
  @IsString({ message: 'Kode QR harus berupa teks' })
  @IsNotEmpty({ message: 'Kode QR tidak boleh kosong' })
  qrCode: string;

  @ApiPropertyOptional({
    enum: CheckinAction,
    default: CheckinAction.AUTO,
    example: CheckinAction.AUTO,
    description:
      'Aksi check-in / check-out: "auto" (otomatis deteksi), "checkin", atau "checkout"',
  })
  @IsOptional()
  @IsEnum(CheckinAction)
  action?: CheckinAction = CheckinAction.AUTO;
}
