import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
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
import { SecretProvisionDto } from './dto/secret-provision.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getDevOtp(otpCode: string): string | undefined {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ENABLE_DEV_OTP !== 'true'
    ) {
      return undefined;
    }
    return otpCode;
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

      const devOtp = this.getDevOtp(newOtp);
      throw new ForbiddenException({
        isVerified: false,
        email: user.email,
        ...(devOtp ? { devOtp } : {}),
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
    const {
      password: _,
      otpCode: _o,
      resetOtpCode: _r,
      ...sanitizedUser
    } = user;

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

    await this.mailService.sendVerificationOtp(
      cleanEmail,
      dto.namaMember,
      otpCode,
    );

    const devOtp = this.getDevOtp(otpCode);
    return {
      message:
        'Pendaftaran berhasil! Silakan periksa email Anda untuk memasukkan kode OTP verifikasi 6-digit.',
      email: cleanEmail,
      isVerified: false,
      ...(devOtp ? { devOtp } : {}),
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

    await this.mailService.sendVerificationOtp(
      cleanEmail,
      dto.namaPemilik,
      otpCode,
    );

    const devOtp = this.getDevOtp(otpCode);
    return {
      message:
        'Pendaftaran pengelola coworking berhasil! Silakan periksa email Anda untuk memasukkan kode OTP verifikasi.',
      email: cleanEmail,
      isVerified: false,
      ...(devOtp ? { devOtp } : {}),
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
      const {
        password: _,
        otpCode: _o,
        resetOtpCode: _r,
        ...sanitizedUser
      } = user;

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
    const {
      password: _,
      otpCode: _o,
      resetOtpCode: _r,
      ...sanitizedUser
    } = updatedUser;

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
      throw new NotFoundException(
        'Akun dengan email tersebut tidak ditemukan.',
      );
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

    const devOtp = this.getDevOtp(newOtp);
    return {
      message: 'Kode OTP baru berhasil dikirimkan ke email Anda.',
      email: cleanEmail,
      ...(devOtp ? { devOtp } : {}),
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

    const devOtp = this.getDevOtp(resetOtp);
    return {
      message:
        'Kode OTP reset kata sandi telah dikirimkan ke email Anda. Silakan cek kotak masuk email.',
      email: cleanEmail,
      ...(devOtp ? { devOtp } : {}),
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
          isVerified: true,
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

  async provisionSuperAdmin(dto: SecretProvisionDto) {
    const configuredSecret = process.env.SUPER_ADMIN_SECRET_KEY;

    if (!configuredSecret || dto.secretKey !== configuredSecret) {
      throw new ForbiddenException(
        'Kunci rahasia Super Admin salah atau tidak terkonfigurasi pada server.',
      );
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin_space', 'staff', 'member') NOT NULL DEFAULT 'member';`,
      );
    } catch (err) {
      this.logger.warn(
        `Could not alter users table role enum: ${(err as Error).message}`,
      );
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const existing = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    let userId: number;
    if (existing) {
      if (existing.role !== Role.super_admin) {
        throw new ForbiddenException(
          `Email '${cleanEmail}' sudah terdaftar sebagai akun ${existing.role}. Operasi dibatalkan demi keamanan.`,
        );
      }
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          isVerified: true,
          otpCode: null,
          otpExpires: null,
        },
      });
      userId = existing.id;
    } else {
      const created = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          isVerified: true,
        },
      });
      userId = created.id;
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE users SET role = 'super_admin' WHERE id = ?;`,
        userId,
      );
    } catch (err) {
      this.logger.warn(
        `Could not execute raw role update to super_admin: ${(err as Error).message}`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    const payload = {
      sub: user!.id,
      email: user!.email,
      role: user!.role,
    };
    const token = this.jwtService.sign(payload);
    const {
      password: _,
      otpCode: _o,
      resetOtpCode: _r,
      ...sanitizedUser
    } = user!;

    return {
      message: 'Akun Super Admin (Platform CEO) berhasil diaktifkan.',
      access_token: token,
      user: sanitizedUser,
    };
  }

  async googleAuth(dto: GoogleLoginDto) {
    let email = dto.email?.trim().toLowerCase();
    let name = dto.name?.trim();
    let avatar = dto.avatar?.trim();

    if (dto.token) {
      try {
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${dto.token}`,
        );
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.email) {
            email = googleData.email.trim().toLowerCase();
            name =
              googleData.name ||
              name ||
              (email ? email.split('@')[0] : 'Member');
            avatar = googleData.picture || avatar;
          }
        } else {
          const userinfoRes = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
              headers: { Authorization: `Bearer ${dto.token}` },
            },
          );
          if (userinfoRes.ok) {
            const userinfoData = await userinfoRes.json();
            if (userinfoData.email) {
              email = userinfoData.email.trim().toLowerCase();
              name =
                userinfoData.name ||
                name ||
                (email ? email.split('@')[0] : 'Member');
              avatar = userinfoData.picture || avatar;
            }
          }
        }
      } catch (err) {
        this.logger.warn(
          `Failed verifying Google token: ${(err as Error).message}`,
        );
      }
    }

    if (!email) {
      throw new BadRequestException(
        'Autentikasi Google gagal. Alamat email tidak dapat diverifikasi.',
      );
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    if (user) {
      if (!user.isVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true, otpCode: null, otpExpires: null },
          include: {
            member: true,
            spaceOwner: true,
            staff: true,
          },
        });
      }

      if (user.member && avatar && !user.member.foto) {
        await this.prisma.member.update({
          where: { id: user.member.id },
          data: { foto: avatar },
        });
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);
      const {
        password: _,
        otpCode: _o,
        resetOtpCode: _r,
        ...sanitizedUser
      } = user;

      return {
        message: 'Login dengan Google berhasil!',
        access_token: token,
        user: sanitizedUser,
      };
    }

    const randomPassword = Math.random().toString(36).slice(-10) + 'Aa1*';
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const memberName = name || email.split('@')[0];

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.member,
          isVerified: true,
        },
      });

      const member = await tx.member.create({
        data: {
          namaMember: memberName,
          instansi: 'Umum / Personal',
          alamat: 'Indonesia',
          telp: '081234567890',
          foto: avatar || null,
          userId: newUser.id,
        },
      });

      return { user: newUser, member };
    });

    const payload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Registrasi Akun Member dengan Google berhasil!',
      access_token: token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        isVerified: true,
        member: result.member,
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

    const {
      password: _,
      otpCode: _o,
      resetOtpCode: _r,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  }
}
