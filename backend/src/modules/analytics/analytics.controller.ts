import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, ResolveRiskFlagDto, AnalyticsQueryDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../entitlements/guards/permissions.guard';
import { RequirePermissions } from '../entitlements/decorators/require-permissions.decorator';
import { Permission } from '../entitlements/enums/permissions.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { RateLimit } from '../../common/guards/rate-limit.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // 16.5 Ingest first-party marketplace analytics event (Rate limited to 60 events/min per IP)
  @RateLimit({ limit: 60, windowMs: 60000, keyPrefix: 'analytics_ingest' })
  @Post('events')
  async trackEvent(
    @Body() dto: TrackEventDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.analyticsService.trackEvent(dto, userId, ip);
  }

  // 16.6 Admin Business Intelligence Dashboard
  @Get('admin/bi')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ANALYTICS_VIEW)
  async getAdminBI(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getAdminMarketplaceBI(query);
    return { success: true, data };
  }

  // 16.7 Agent Performance & Transparent Ranking
  @Get('agent/:agentId/performance')
  async getAgentPerformance(@Param('agentId') agentId: string) {
    const data = await this.analyticsService.getAgentRankingAndPerformance(agentId);
    return { success: true, data };
  }

  // 16.9 Fraud & Abuse Detection Scan
  @Post('admin/risk-scan')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_VIEW)
  async runRiskScan(@Body('propertyId') propertyId?: string) {
    const result = await this.analyticsService.runFraudAndAbuseScan(propertyId);
    return { success: true, data: result };
  }

  // Risk Flags List
  @Get('admin/risk-flags')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_VIEW)
  async getRiskFlags(
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const data = await this.analyticsService.getRiskFlags(
      status,
      level,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return { success: true, data };
  }

  // Risk Flag Status Resolution
  @Patch('admin/risk-flags/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REPORT_MANAGE)
  async resolveRiskFlag(
    @Param('id') id: string,
    @Body() dto: ResolveRiskFlagDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.analyticsService.resolveRiskFlag(
      id,
      dto.status,
      dto.actionTaken,
      user.id,
    );
    return { success: true, data: updated };
  }
}
