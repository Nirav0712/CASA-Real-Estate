import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { CreateReportDto, ResolveReportDto } from './dto/report.dto';
import { ReportStatus } from './schemas/property-report.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';

@ApiTags('Property Reports & Marketplace Trust')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a suspicious or fake property listing' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  reportProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.engagementService.reportProperty(user, dto);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Admin get all reported properties' })
  @ApiResponse({ status: 200, description: 'Reports list' })
  getAdminReports(
    @Query('status') status?: ReportStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engagementService.getAdminReports(status, page, limit);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Admin resolve property report with optional unpublish action' })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  resolveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.engagementService.resolveReport(user, id, dto);
  }
}
