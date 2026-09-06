import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCommissionDto {
  @ApiProperty({
    example: 5.0,
    description: 'Persentase komisi platform dari setiap transaksi sewa (0% - 50%)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Persentase komisi harus berupa angka' })
  @Min(0, { message: 'Persentase komisi minimal 0%' })
  @Max(50, { message: 'Persentase komisi maksimal 50%' })
  commissionPercent: number;
}
