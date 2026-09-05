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
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  @ApiResponse({
    status: 403,
    description: 'Email belum diverifikasi.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register/member')
  @ApiOperation({
    summary: 'Registrasi Member Baru',
    description:
      'Mendaftarkan akun baru dengan role "member" dan mengirimkan kode OTP verifikasi email.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registrasi member berhasil dibuat, OTP terkirim.',
  })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan.' })
  registerMember(@Body() registerMemberDto: RegisterMemberDto) {
    return this.authService.registerMember(registerMemberDto);
  }

  @Post('register/owner')
  @ApiOperation({
    summary: 'Registrasi Pengelola Coworking (Space Owner)',
    description:
      'Mendaftarkan akun baru dengan role "admin_space" dan mengirimkan kode OTP verifikasi email.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registrasi admin space berhasil dibuat, OTP terkirim.',
  })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan.' })
  registerOwner(@Body() registerOwnerDto: RegisterOwnerDto) {
    return this.authService.registerOwner(registerOwnerDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi Email dengan 6-Digit OTP',
    description:
      'Memverifikasi alamat email akun yang baru didaftarkan menggunakan kode OTP yang dikirimkan via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email berhasil diverifikasi, mengembalikan token JWT.',
  })
  @ApiResponse({
    status: 400,
    description: 'Kode OTP salah atau telah kedaluwarsa.',
  })
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kirim Ulang Kode OTP',
    description:
      'Mengirimkan kode OTP 6-digit baru ke alamat email untuk keperluan verifikasi registrasi atau reset password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kode OTP baru berhasil dikirimkan.',
  })
  resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lupa Kata Sandi (Kirim OTP Reset)',
    description:
      'Mengirimkan kode OTP 6-digit ke email terdaftar untuk proses pemulihan kata sandi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kode OTP reset kata sandi telah dikirimkan ke email.',
  })
  @ApiResponse({
    status: 404,
    description: 'Email tidak terdaftar di sistem.',
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset Kata Sandi dengan OTP',
    description:
      'Memperbarui kata sandi akun menggunakan 6-digit kode OTP reset yang valid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kata sandi berhasil diperbarui.',
  })
  @ApiResponse({
    status: 400,
    description: 'Kode OTP tidak valid atau telah kedaluwarsa.',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
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
