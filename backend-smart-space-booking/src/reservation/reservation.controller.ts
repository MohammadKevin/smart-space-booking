import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { FilterReservationDto } from './dto/filter-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reservations & Bookings')
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Membuat Reservasi Ruangan / Workstation Baru',
    description: 'Member memesan workstation dengan pengecekan bentrok slot waktu (anti-collision) dan kalkulasi diskon otomatis.',
  })
  @ApiResponse({ status: 201, description: 'Reservasi berhasil dibuat.' })
  @ApiResponse({ status: 400, description: 'Jadwal bentrok atau kupon tidak valid.' })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @GetUser('id') memberUserId: number,
  ) {
    return this.reservationService.create(createReservationDto, memberUserId);
  }

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan Daftar Reservasi Sesuai Role',
    description: 'Member melihat reservasinya sendiri; Admin Space & Staff melihat semua reservasi pada Coworking Space mereka.',
  })
  @ApiResponse({ status: 200, description: 'Daftar reservasi berhasil dimuat.' })
  findAll(@Query() filterDto: FilterReservationDto, @GetUser() user: any) {
    return this.reservationService.findAll(filterDto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Mendapatkan Detail Satu Reservasi',
    description: 'Menampilkan detail lengkap transaksi reservasi, informasi workstation, diskon, dan status.',
  })
  @ApiResponse({ status: 200, description: 'Detail reservasi berhasil dimuat.' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan.' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.reservationService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.admin_space, Role.staff)
  @ApiOperation({
    summary: 'Mengubah Status Reservasi',
    description: 'Hanya dapat diakses oleh Admin Space dan Staff untuk menyetujui, mengaktifkan, menyelesaikan, atau membatalkan reservasi.',
  })
  @ApiResponse({ status: 200, description: 'Status reservasi berhasil diperbarui.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateReservationStatusDto,
    @GetUser() user: any,
  ) {
    return this.reservationService.updateStatus(id, updateStatusDto, user);
  }

  @Patch(':id/cancel')
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Batalkan Reservasi Mandiri oleh Member',
    description: 'Member dapat membatalkan reservasinya sendiri jika status masih "pending" atau "disetujui".',
  })
  @ApiResponse({ status: 200, description: 'Reservasi berhasil dibatalkan.' })
  @ApiResponse({ status: 400, description: 'Reservasi tidak dapat dibatalkan.' })
  cancelMyReservation(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') memberUserId: number,
  ) {
    return this.reservationService.cancelMyReservation(id, memberUserId);
  }
}
