import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Public Settings & Company Hotlines')
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly adminService: AdminService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public company hotline numbers and trial parameters' })
  @ApiResponse({ status: 200, description: 'Public company contact numbers' })
  getPublicSettings() {
    return this.adminService.getPublicSettings();
  }
}
