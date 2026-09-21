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
import { ResetDataDto } from '../super-admin/dto/reset-data.dto';
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

  async resetDatabase(dto?: ResetDataDto, ipAddress: string = '127.0.0.1') {
    const configuredSecret = process.env.SUPER_ADMIN_SECRET_KEY;
    const isSecretValid =
      dto?.secretKey &&
      configuredSecret &&
      dto.secretKey === configuredSecret;
    const isResetAllowed = process.env.ALLOW_DATA_RESET === 'true';

    if (!isResetAllowed && !isSecretValid) {
      throw new ForbiddenException(
        'Data reset dinonaktifkan di environment ini atau kunci rahasia salah.',
      );
    }

    if (dto?.confirmationText && dto.confirmationText !== 'RESET ALL DATA') {
      throw new BadRequestException('Teks konfirmasi tidak sesuai.');
    }

    const timestamp = new Date().toISOString();
    const affectedTables = [
      'detail_reservasi',
      'review',
      'waitlist',
      'transaksi',
      'reservasi',
      'diskon',
      'spaces',
      'staffs',
      'space_owners',
      'members',
      'users',
      'platform_settings',
    ];

    this.logger.warn(
      `[DATA_RESET_AUDIT] Action: DATA_RESET, IP: ${ipAddress}, Timestamp: ${timestamp}, AffectedTables: ${affectedTables.join(', ')}`,
    );

    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS platform_settings (
          id INT NOT NULL AUTO_INCREMENT,
          \`key\` VARCHAR(191) NOT NULL UNIQUE,
          \`value\` TEXT NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {}

    const summary = {
      detail_reservasi: 0,
      review: 0,
      waitlist: 0,
      transaksi: 0,
      reservasi: 0,
      diskon: 0,
      spaces: 0,
      staffs: 0,
      space_owners: 0,
      members: 0,
      users_deleted: 0,
    };

    try {
      const res = await this.prisma.detailReservasi.deleteMany({});
      summary.detail_reservasi = res.count;
    } catch {}

    try {
      const res = await this.prisma.review.deleteMany({});
      summary.review = res.count;
    } catch {}

    try {
      const res = await this.prisma.waitlist.deleteMany({});
      summary.waitlist = res.count;
    } catch {}

    try {
      const res = await this.prisma.transaksi.deleteMany({});
      summary.transaksi = res.count;
    } catch {}

    try {
      const res = await this.prisma.reservasi.deleteMany({});
      summary.reservasi = res.count;
    } catch {}

    try {
      const res = await this.prisma.diskon.deleteMany({});
      summary.diskon = res.count;
    } catch {}

    try {
      const res = await this.prisma.space.deleteMany({});
      summary.spaces = res.count;
    } catch {}

    try {
      const res = await this.prisma.staff.deleteMany({});
      summary.staffs = res.count;
    } catch {}

    try {
      const res = await this.prisma.spaceOwner.deleteMany({});
      summary.space_owners = res.count;
    } catch {}

    try {
      const res = await this.prisma.member.deleteMany({});
      summary.members = res.count;
    } catch {}

    try {
      const res = await this.prisma.user.deleteMany({});
      summary.users_deleted = res.count;
    } catch {}

    try {
      await this.prisma.platformSetting.deleteMany({});
    } catch {}

    const tablesToResetAutoIncrement = [
      'detail_reservasi',
      'review',
      'waitlist',
      'transaksi',
      'reservasi',
      'diskon',
      'spaces',
      'staffs',
      'space_owners',
      'members',
      'users',
      'platform_settings',
    ];

    for (const table of tablesToResetAutoIncrement) {
      try {
        await this.prisma.$executeRawUnsafe(
          `ALTER TABLE ${table} AUTO_INCREMENT = 1;`,
        );
      } catch (autoIncErr: any) {
        this.logger.warn(`Auto-increment reset warning: ${autoIncErr.message}`);
      }
    }

    const DEFAULT_EMAIL = 'kvn4.200581@gmail.com';
    const DEFAULT_PASS = 'Kevin135*';
    const hashedPassword = await bcrypt.hash(DEFAULT_PASS, 10);

    const createdSuperAdmin = await this.prisma.user.create({
      data: {
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        role: Role.super_admin,
        isVerified: true,
      },
    });

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE users SET role = 'super_admin' WHERE id = ?;`,
        createdSuperAdmin.id,
      );
    } catch {}

    try {
      await this.prisma.platformSetting.create({
        data: {
          key: 'PLATFORM_COMMISSION_PERCENT',
          value: process.env.PLATFORM_COMMISSION_PERCENT || '5.0',
        },
      });
    } catch {}

    const payload = {
      sub: createdSuperAdmin.id,
      email: createdSuperAdmin.email,
      role: createdSuperAdmin.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: `Seluruh database berhasil direset menjadi 0 dan akun super_admin '${DEFAULT_EMAIL}' berhasil dibuat otomatis.`,
      defaultSuperAdmin: {
        id: createdSuperAdmin.id,
        email: DEFAULT_EMAIL,
        role: Role.super_admin,
        passwordHint: DEFAULT_PASS,
      },
      access_token: token,
      summary,
      executedAt: timestamp,
      executedBy: 'auth_reset_database',
    };
  }
}
