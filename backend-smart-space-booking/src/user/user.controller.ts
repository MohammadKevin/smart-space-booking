import {
  Controller,
  Get,
  Put,
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
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('User & Profile Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('profile')
  @ApiOperation({
    summary: 'Update Profil Pengguna',
    description: 'Memperbarui profil diri sesuai dengan role yang login.',
  })
  @ApiResponse({ status: 200, description: 'Profil berhasil diperbarui.' })
  updateProfile(
    @GetUser('id') userId: number,
    @GetUser('role') role: Role,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, role, updateDto);
  }

  @Get('members')
  @Roles(Role.admin_space, Role.staff)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Semua Member',
    description: 'Hanya dapat diakses oleh admin_space dan staff untuk melihat daftar member terdaftar.',
  })
  @ApiResponse({ status: 200, description: 'Daftar member berhasil dimuat.' })
  getAllMembers() {
    return this.userService.getAllMembers();
  }

  @Get('staffs')
  @Roles(Role.admin_space)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Staff Coworking Space',
    description: 'Hanya dapat diakses oleh admin_space untuk melihat seluruh staff yang bekerja di spacenya.',
  })
  @ApiResponse({ status: 200, description: 'Daftar staff berhasil dimuat.' })
  getOwnerStaffs(@GetUser('id') ownerUserId: number) {
    return this.userService.getOwnerStaffs(ownerUserId);
  }

  @Delete('staffs/:id')
  @Roles(Role.admin_space)
  @ApiOperation({
    summary: 'Menghapus Akun Staff',
    description: 'Hanya dapat diakses oleh admin_space untuk menghapus staff miliknya.',
  })
  @ApiResponse({ status: 200, description: 'Staff berhasil dihapus.' })
  deleteStaff(
    @Param('id', ParseIntPipe) staffId: number,
    @GetUser('id') ownerUserId: number,
  ) {
    return this.userService.deleteStaff(staffId, ownerUserId);
  }
}
