import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: {
        member: true,
        spaceOwner: true,
        staff: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    // Check email verification
    if (!user.isVerified) {
      const newOtp = this.generate6DigitOtp();
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: newOtp,
          otpExpires: expires,
        },
      });

      const recipientName =
        user.member?.namaMember ||
        user.spaceOwner?.namaPemilik ||
        user.staff?.namaStaff ||
        'Pengguna';

      await this.mailService.sendVerificationOtp(
        user.email,
        recipientName,
        newOtp,
      );

      throw new ForbiddenException({
        isVerified: false,
        email: user.email,
        devOtp: newOtp,
        message:
          'Email Anda belum diverifikasi. Kode OTP verifikasi baru telah dikirimkan ke email Anda.',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);
    const { password: _, otpCode: _o, resetOtpCode: _r, ...sanitizedUser } = user;

    return {
      message: 'Login berhasil',
      access_token: token,
      user: sanitizedUser,
    };
  }

  async registerMember(dto: RegisterMemberDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${cleanEmail}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otpCode = this.generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: Role.member,
          isVerified: false,
          otpCode,
          otpExpires,
        },
      });

      const member = await tx.member.create({
        data: {
          namaMember: dto.namaMember.trim(),
          instansi: dto.instansi ? dto.instansi.trim() : 'Umum / Personal',
          alamat: dto.alamat ? dto.alamat.trim() : 'Indonesia',
          telp: dto.telp.trim(),
          foto: dto.foto || null,
          userId: user.id,
        },
      });

      return { user, member };
    });

    // Send verification OTP email
    await this.mailService.sendVerificationOtp(
      cleanEmail,
      dto.namaMember,
      otpCode,
    );

    return {
      message:
        'Pendaftaran berhasil! Silakan periksa email Anda untuk memasukkan kode OTP verifikasi 6-digit.',
      email: cleanEmail,
      isVerified: false,
      devOtp: otpCode,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        member: result.member,
      },
    };
  }

  async registerOwner(dto: RegisterOwnerDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${cleanEmail}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otpCode = this.generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: Role.admin_space,
          isVerified: false,
          otpCode,
          otpExpires,
        },
      });

      const spaceOwner = await tx.spaceOwner.create({
        data: {
          namaCoworking: dto.namaCoworking.trim(),
          namaPemilik: dto.namaPemilik.trim(),
          alamat: dto.alamat.trim(),
          telp: dto.telp.trim(),
          userId: user.id,
        },
      });

      return { user, spaceOwner };
    });

    // Send verification OTP email
    await this.mailService.sendVerificationOtp(
      cleanEmail,
      dto.namaPemilik,
      otpCode,
    );

    return {
      message:
        'Pendaftaran pengelola coworking berhasil! Silakan periksa email Anda untuk memasukkan kode OTP verifikasi.',
      email: cleanEmail,
      isVerified: false,
      devOtp: otpCode,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        spaceOwner: result.spaceOwner,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanOtp = dto.otp.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (user.isVerified) {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);
      const { password: _, otpCode: _o, resetOtpCode: _r, ...sanitizedUser } = user;

      return {
        message: 'Email sudah terverifikasi sebelumnya.',
        access_token: token,
        user: sanitizedUser,
      };
    }

    if (!user.otpCode || user.otpCode !== cleanOtp) {
      throw new BadRequestException(
        'Kode OTP salah. Silakan periksa kembali email Anda atau minta kode baru.',
      );
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      throw new BadRequestException(
        'Kode OTP sudah kedaluwarsa (lebih dari 15 menit). Silakan minta kode OTP baru.',
      );
    }

    // Mark as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpires: null,
      },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };
    const token = this.jwtService.sign(payload);
    const { password: _, otpCode: _o, resetOtpCode: _r, ...sanitizedUser } = updatedUser;

    return {
      message: 'Verifikasi email berhasil! Selamat datang di WorkNest.',
      access_token: token,
      user: sanitizedUser,
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Akun dengan email tersebut tidak ditemukan.');
    }

    const recipientName =
      user.member?.namaMember ||
      user.spaceOwner?.namaPemilik ||
      user.staff?.namaStaff ||
      'Pengguna';

    const newOtp = this.generate6DigitOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    if (dto.type === 'forgot_password') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtpCode: newOtp,
          resetOtpExpires: expires,
        },
      });

      await this.mailService.sendResetPasswordOtp(
        user.email,
        recipientName,
        newOtp,
      );
    } else {
      if (user.isVerified) {
        throw new BadRequestException('Email akun ini sudah terverifikasi.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: newOtp,
          otpExpires: expires,
        },
      });

      await this.mailService.sendVerificationOtp(
        user.email,
        recipientName,
        newOtp,
      );
    }

    return {
      message: 'Kode OTP baru berhasil dikirimkan ke email Anda.',
      email: cleanEmail,
      devOtp: newOtp,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Akun dengan alamat email tersebut tidak terdaftar di sistem.',
      );
    }

    const resetOtp = this.generate6DigitOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtpCode: resetOtp,
        resetOtpExpires: expires,
      },
    });

    const recipientName =
      user.member?.namaMember ||
      user.spaceOwner?.namaPemilik ||
      user.staff?.namaStaff ||
      'Pengguna';

    await this.mailService.sendResetPasswordOtp(
      user.email,
      recipientName,
      resetOtp,
    );

    return {
      message:
        'Kode OTP reset kata sandi telah dikirimkan ke email Anda. Silakan cek kotak masuk email.',
      email: cleanEmail,
      devOtp: resetOtp,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanOtp = dto.otp.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (!user.resetOtpCode || user.resetOtpCode !== cleanOtp) {
      throw new BadRequestException(
        'Kode OTP salah. Silakan periksa kembali email Anda.',
      );
    }

    if (user.resetOtpExpires && new Date() > user.resetOtpExpires) {
      throw new BadRequestException(
        'Kode OTP reset kata sandi sudah kedaluwarsa. Silakan ajukan permohonan reset baru.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtpCode: null,
        resetOtpExpires: null,
        isVerified: true,
      },
    });

    return {
      message:
        'Kata sandi Anda berhasil diperbarui! Silakan login dengan kata sandi baru Anda.',
    };
  }

  async createStaff(dto: CreateStaffDto, ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException(
        'Hanya admin/pemilik coworking space yang dapat mendaftarkan staff.',
      );
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${cleanEmail}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: Role.staff,
          isVerified: true, // Created directly by space owner
        },
      });

      const staff = await tx.staff.create({
        data: {
          namaStaff: dto.namaStaff.trim(),
          telp: dto.telp.trim(),
          userId: user.id,
          ownerId: owner.id,
        },
        include: {
          owner: true,
        },
      });

      return { user, staff };
    });

    return {
      message: 'Akun staff berhasil dibuat',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        staff: result.staff,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
        spaceOwner: {
          include: {
            spaces: true,
            staffs: true,
          },
        },
        staff: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const { password: _, otpCode: _o, resetOtpCode: _r, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
