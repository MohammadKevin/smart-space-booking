import {
  Controller,
  Post,
  Body,
  Get,
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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Authentication & Authorization')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login Akun',
    description:
      'Autentikasi untuk semua role (admin_space, staff, member) menggunakan email dan password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil, mengembalikan access_token dan data user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Email atau password tidak valid.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register/member')
  @ApiOperation({
    summary: 'Registrasi Member Baru',
    description:
      'Mendaftarkan akun baru dengan role "member" beserta data profil member.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registrasi member berhasil dibuat.',
  })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan.' })
  registerMember(@Body() registerMemberDto: RegisterMemberDto) {
    return this.authService.registerMember(registerMemberDto);
  }

  @Post('register/owner')
  @ApiOperation({
    summary: 'Registrasi Pengelola Coworking (Space Owner)',
    description:
      'Mendaftarkan akun baru dengan role "admin_space" beserta informasi Coworking Space miliknya.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registrasi admin space berhasil dibuat.',
  })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan.' })
  registerOwner(@Body() registerOwnerDto: RegisterOwnerDto) {
    return this.authService.registerOwner(registerOwnerDto);
  }

  @Post('staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Pendaftaran Akun Staff oleh Space Owner',
    description:
      'Hanya dapat diakses oleh "admin_space" untuk mendaftarkan staff operasional di coworking spacenya.',
  })
  @ApiResponse({ status: 201, description: 'Akun staff berhasil dibuat.' })
  @ApiResponse({
    status: 403,
    description: 'Akses ditolak (bukan admin_space).',
  })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan.' })
  createStaff(
    @Body() createStaffDto: CreateStaffDto,
    @GetUser('id') ownerUserId: number,
  ) {
    return this.authService.createStaff(createStaffDto, ownerUserId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan Profil Pengguna Login',
    description:
      'Mengambil data profil lengkap pengguna yang saat ini sedang login berdasarkan token JWT.',
  })
  @ApiResponse({ status: 200, description: 'Profil pengguna berhasil dimuat.' })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau telah kedaluwarsa.',
  })
  getProfile(@GetUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }
}
