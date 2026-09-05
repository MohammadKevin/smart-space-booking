import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: number, role: Role, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
        spaceOwner: true,
        staff: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Data pengguna tidak ditemukan.');
    }

    const userDataToUpdate: any = {};

    if (dto.email && dto.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(`Email '${dto.email}' sudah terdaftar pada akun lain.`);
      }
      userDataToUpdate.email = dto.email.trim().toLowerCase();
    }

    if (dto.password) {
      if (!dto.oldPassword) {
        throw new BadRequestException(
          'Kata sandi saat ini (lama) wajib diisi untuk mengubah kata sandi.',
        );
      }
      const isOldValid = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isOldValid) {
        throw new BadRequestException('Kata sandi saat ini (lama) tidak sesuai.');
      }
      userDataToUpdate.password = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(userDataToUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userDataToUpdate,
      });
    }

    if (role === Role.member) {
      const member = await this.prisma.member.findUnique({
        where: { userId },
      });
      if (!member) {
        throw new NotFoundException('Data profil member tidak ditemukan.');
      }

      await this.prisma.member.update({
        where: { userId },
        data: {
          namaMember: dto.nama !== undefined ? dto.nama.trim() : member.namaMember,
          instansi: dto.instansi !== undefined ? dto.instansi.trim() : member.instansi,
          alamat: dto.alamat !== undefined ? dto.alamat.trim() : member.alamat,
          telp: dto.telp !== undefined ? dto.telp.trim() : member.telp,
          foto: dto.foto !== undefined ? dto.foto : member.foto,
        },
      });
    } else if (role === Role.admin_space) {
      const owner = await this.prisma.spaceOwner.findUnique({
        where: { userId },
      });
      if (!owner) {
        throw new NotFoundException(
          'Data profil pengelola coworking tidak ditemukan.',
        );
      }

      await this.prisma.spaceOwner.update({
        where: { userId },
        data: {
          namaCoworking:
            dto.namaCoworking !== undefined
              ? dto.namaCoworking.trim()
              : owner.namaCoworking,
          namaPemilik: dto.nama !== undefined ? dto.nama.trim() : owner.namaPemilik,
          alamat: dto.alamat !== undefined ? dto.alamat.trim() : owner.alamat,
          telp: dto.telp !== undefined ? dto.telp.trim() : owner.telp,
        },
      });
    } else if (role === Role.staff) {
      const staff = await this.prisma.staff.findUnique({
        where: { userId },
      });
      if (!staff) {
        throw new NotFoundException('Data profil staff tidak ditemukan.');
      }

      await this.prisma.staff.update({
        where: { userId },
        data: {
          namaStaff: dto.nama !== undefined ? dto.nama.trim() : staff.namaStaff,
          telp: dto.telp !== undefined ? dto.telp.trim() : staff.telp,
        },
      });
    }

    const updatedUser = await this.prisma.user.findUnique({
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

    const { password: _p, ...sanitized } = updatedUser!;
    return sanitized;
  }

  async getAllMembers() {
    return this.prisma.member.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            reservasi: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOwnerStaffs(ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new NotFoundException('Data coworking space tidak ditemukan.');
    }

    return this.prisma.staff.findMany({
      where: { ownerId: owner.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteStaff(staffId: number, ownerUserId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException('Data pengelola tidak ditemukan.');
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff || staff.ownerId !== owner.id) {
      throw new NotFoundException(
        'Staff tidak ditemukan atau bukan milik coworking space Anda.',
      );
    }

    await this.prisma.user.delete({
      where: { id: staff.userId },
    });

    return { message: `Staff '${staff.namaStaff}' berhasil dihapus.` };
  }
}
