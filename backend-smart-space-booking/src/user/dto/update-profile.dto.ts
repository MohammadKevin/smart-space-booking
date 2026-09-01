import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Kevin Sanjaya Pratama' })
  @IsOptional()
  @IsString()
  nama?: string;

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
