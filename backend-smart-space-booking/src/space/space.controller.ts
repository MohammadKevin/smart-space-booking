import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SpaceService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { FilterSpaceDto } from './dto/filter-space.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Spaces & Workstations')
@Controller('spaces')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Membuat Ruangan / Workstation Baru',
    description: 'Hanya dapat diakses oleh admin_space untuk menambahkan unit workstation / ruangan baru.',
  })
  @ApiResponse({ status: 201, description: 'Space berhasil dibuat.' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (bukan admin_space).' })
  create(
    @Body() createSpaceDto: CreateSpaceDto,
    @GetUser('id') ownerUserId: number,
  ) {
    return this.spaceService.create(createSpaceDto, ownerUserId);
  }

  @Get()
  @ApiOperation({
    summary: 'Melihat Daftar Seluruh Space (Katalog)',
    description: 'Publik & Member dapat melihat katalog space dengan filter tipe, kapasitas, kata kunci, dan ketersediaan waktu.',
  })
  @ApiResponse({ status: 200, description: 'Daftar space berhasil dimuat.' })
  findAll(@Query() filterDto: FilterSpaceDto) {
    return this.spaceService.findAll(filterDto);
  }

  @Get('my-spaces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan Daftar Space Milik Sendiri',
    description: 'Hanya dapat diakses oleh admin_space untuk melihat seluruh unit ruangan di coworking spacenya.',
  })
  @ApiResponse({ status: 200, description: 'Daftar space pengelola berhasil dimuat.' })
  getMySpaces(@GetUser('id') ownerUserId: number) {
    return this.spaceService.getMySpaces(ownerUserId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Mendapatkan Detail Satu Space',
    description: 'Menampilkan detail lengkap unit space beserta informasi coworking space pemilik.',
  })
  @ApiResponse({ status: 200, description: 'Detail space berhasil dimuat.' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.spaceService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Memperbarui Data Space',
    description: 'Hanya pemilik space (admin_space) yang dapat memperbarui unit space miliknya.',
  })
  @ApiResponse({ status: 200, description: 'Space berhasil diperbarui.' })
  @ApiResponse({ status: 403, description: 'Akses ditolak.' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpaceDto: UpdateSpaceDto,
    @GetUser('id') ownerUserId: number,
  ) {
    return this.spaceService.update(id, updateSpaceDto, ownerUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin_space)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Menghapus Unit Space',
    description: 'Hanya pemilik space (admin_space) yang dapat menghapus unit space miliknya.',
  })
  @ApiResponse({ status: 200, description: 'Space berhasil dihapus.' })
  @ApiResponse({ status: 403, description: 'Akses ditolak.' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') ownerUserId: number,
  ) {
    return this.spaceService.remove(id, ownerUserId);
  }
}
