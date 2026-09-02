import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckinService } from './checkin.service';
import { VerifyQrDto } from './dto/verify-qr.dto';
import { ProcessCheckinDto } from './dto/process-checkin.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('QR Check-In & Check-Out')
@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin_space, Role.staff)
@ApiBearerAuth()
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi & Scan Kode QR',
    description:
      'Staff / Admin Space memindai QR code tiket member untuk memeriksa validitas dan status terkini reservasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR Code valid dan detail reservasi berhasil diverifikasi.',
  })
  @ApiResponse({ status: 404, description: 'Kode QR tidak ditemukan.' })
  verifyQr(@Body() verifyDto: VerifyQrDto, @GetUser() user: any) {
    return this.checkinService.verifyQr(verifyDto.qrCode, user);
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proses Check-In / Check-Out Seketika',
    description:
      'Melakukan transisi status secara otomatis: "disetujui" -> "aktif" (Check-In) -> "selesai" (Check-Out).',
  })
  @ApiResponse({
    status: 200,
    description: 'Proses Check-In atau Check-Out berhasil.',
  })
  @ApiResponse({
    status: 400,
    description: 'Status reservasi tidak valid untuk check-in/out.',
  })
  processCheckin(@Body() processDto: ProcessCheckinDto, @GetUser() user: any) {
    return this.checkinService.processCheckin(processDto, user);
  }
}
