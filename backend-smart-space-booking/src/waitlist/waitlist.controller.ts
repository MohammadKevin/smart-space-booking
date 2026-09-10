import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Waitlist')
@Controller('waitlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Bergabung ke Antrean / Waitlist Ruangan',
    description: 'Member mendaftarkan diri ke antrean ruangan saat jadwal penuh.',
  })
  @ApiResponse({ status: 201, description: 'Berhasil bergabung ke waitlist.' })
  joinWaitlist(
    @GetUser('id') userId: number,
    @Body() dto: CreateWaitlistDto,
  ) {
    return this.waitlistService.joinWaitlist(userId, dto);
  }

  @Get('my')
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Melihat Antrean Waitlist Saya',
    description: 'Menampilkan seluruh antrean waitlist milik member yang sedang login.',
  })
  @ApiResponse({ status: 200, description: 'Daftar waitlist berhasil dimuat.' })
  getMyWaitlists(@GetUser('id') userId: number) {
    return this.waitlistService.getMyWaitlists(userId);
  }

  @Delete(':id')
  @Roles(Role.member)
  @ApiOperation({
    summary: 'Membatalkan Pendaftaran Waitlist',
    description: 'Member membatalkan antrean waitlist ruangan miliknya.',
  })
  @ApiResponse({ status: 200, description: 'Waitlist berhasil dibatalkan.' })
  cancelWaitlist(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.waitlistService.cancelWaitlist(userId, id);
  }
}
