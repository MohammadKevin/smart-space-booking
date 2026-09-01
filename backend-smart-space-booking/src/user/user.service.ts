import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: number, role: Role, dto: UpdateProfileDto) {
    if (role === Role.member) {
      const member = await this.prisma.member.findUnique({
        where: { userId },
      });
      if (!member) {
        throw new NotFoundException('Data member tidak ditemukan.');
      }

      return this.prisma.member.update({
        where: { userId },
        data: {
          namaMember: dto.nama !== undefined ? dto.nama : member.namaMember,
          instansi: dto.instansi !== undefined ? dto.instansi : member.instansi,
          alamat: dto.alamat !== undefined ? dto.alamat : member.alamat,
          telp: dto.telp !== undefined ? dto.telp : member.telp,
          foto: dto.foto !== undefined ? dto.foto : member.foto,
        },
      });
    }

    if (role === Role.admin_space) {
      const owner = await this.prisma.spaceOwner.findUnique({
        where: { userId },
      });
      if (!owner) {
        throw new NotFoundException('Data pengelola coworking tidak ditemukan.');
      }

      return this.prisma.spaceOwner.update({
        where: { userId },
        data: {
          namaCoworking: dto.namaCoworking !== undefined ? dto.namaCoworking : owner.namaCoworking,
          namaPemilik: dto.nama !== undefined ? dto.nama : owner.namaPemilik,
          alamat: dto.alamat !== undefined ? dto.alamat : owner.alamat,
          telp: dto.telp !== undefined ? dto.telp : owner.telp,
        },
      });
    }

    if (role === Role.staff) {
      const staff = await this.prisma.staff.findUnique({
        where: { userId },
      });
      if (!staff) {
        throw new NotFoundException('Data staff tidak ditemukan.');
      }

      return this.prisma.staff.update({
        where: { userId },
        data: {
          namaStaff: dto.nama !== undefined ? dto.nama : staff.namaStaff,
          telp: dto.telp !== undefined ? dto.telp : staff.telp,
        },
      });
    }

    throw new ForbiddenException('Role tidak dikenali.');
  }

  async getAllMembers() {
    return this.prisma.member.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
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
            username: true,
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
      throw new NotFoundException('Staff tidak ditemukan atau bukan milik coworking space Anda.');
    }

    await this.prisma.user.delete({
      where: { id: staff.userId },
    });

    return { message: `Staff '${staff.namaStaff}' berhasil dihapus.` };
  }
}
