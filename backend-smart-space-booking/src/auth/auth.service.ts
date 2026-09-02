import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    const { password: _, ...sanitizedUser } = user;

    return {
      message: 'Login berhasil',
      access_token: token,
      user: sanitizedUser,
    };
  }

  async registerMember(dto: RegisterMemberDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${dto.email}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: Role.member,
        },
      });

      const member = await tx.member.create({
        data: {
          namaMember: dto.namaMember,
          instansi: dto.instansi,
          alamat: dto.alamat,
          telp: dto.telp,
          foto: dto.foto || null,
          userId: user.id,
        },
      });

      return { user, member };
    });

    const payload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Registrasi member berhasil',
      access_token: token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        member: result.member,
      },
    };
  }

  async registerOwner(dto: RegisterOwnerDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${dto.email}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: Role.admin_space,
        },
      });

      const spaceOwner = await tx.spaceOwner.create({
        data: {
          namaCoworking: dto.namaCoworking,
          namaPemilik: dto.namaPemilik,
          alamat: dto.alamat,
          telp: dto.telp,
          userId: user.id,
        },
      });

      return { user, spaceOwner };
    });

    const payload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Registrasi pengelola coworking berhasil',
      access_token: token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        spaceOwner: result.spaceOwner,
      },
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${dto.email}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: Role.staff,
        },
      });

      const staff = await tx.staff.create({
        data: {
          namaStaff: dto.namaStaff,
          telp: dto.telp,
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

    const { password: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
