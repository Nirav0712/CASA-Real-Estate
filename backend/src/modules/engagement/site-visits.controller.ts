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
import { CreateSiteVisitDto, RescheduleSiteVisitDto, CancelSiteVisitDto } from './dto/site-visit.dto';
import { SiteVisitStatus } from './schemas/site-visit.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../entitlements/guards/permissions.guard';
import { RequirePermissions } from '../entitlements/decorators/require-permissions.decorator';
import { Permission } from '../entitlements/enums/permissions.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Site Visits & Tour Scheduling')
@Controller('site-visits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SiteVisitsController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  @RequirePermissions(Permission.SITE_VISIT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a site visit tour for a property' })
  @ApiResponse({ status: 201, description: 'Site visit tour requested' })
  requestSiteVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSiteVisitDto,
  ) {
    return this.engagementService.requestSiteVisit(user, dto);
  }

  @Get('my')
  @RequirePermissions(Permission.SITE_VISIT_VIEW)
  @ApiOperation({ summary: 'Get buyer list of requested and confirmed site visits' })
  @ApiResponse({ status: 200, description: 'Buyer site visits' })
  getMySiteVisits(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: SiteVisitStatus,
  ) {
    return this.engagementService.getMySiteVisits(user, status);
  }

  @Get('agent')
  @RequirePermissions(Permission.SITE_VISIT_VIEW)
  @ApiOperation({ summary: 'Get assigned site visits for agent or owner' })
  @ApiResponse({ status: 200, description: 'Assigned site visits' })
  getAgentSiteVisits(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: SiteVisitStatus,
  ) {
    return this.engagementService.getAgentSiteVisits(user, status);
  }

  @Get('admin')
  @RequirePermissions(Permission.SITE_VISIT_VIEW)
  @ApiOperation({ summary: 'Get all platform site visits with pagination and status filters' })
  @ApiResponse({ status: 200, description: 'Admin platform site visits' })
  getAdminSiteVisits(
    @Query('status') status?: SiteVisitStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engagementService.getAdminSiteVisits(status, page, limit);
  }

  @Patch(':id/confirm')
  @RequirePermissions(Permission.SITE_VISIT_MANAGE)
  @ApiOperation({ summary: 'Agent or Admin confirms a requested site visit' })
  @ApiResponse({ status: 200, description: 'Site visit confirmed' })
  confirmSiteVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    return this.engagementService.confirmSiteVisit(user, id, notes);
  }

  @Patch(':id/reschedule')
  @RequirePermissions(Permission.SITE_VISIT_MANAGE)
  @ApiOperation({ summary: 'Propose new date/time slot for site visit' })
  @ApiResponse({ status: 200, description: 'Site visit rescheduled' })
  rescheduleSiteVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RescheduleSiteVisitDto,
  ) {
    return this.engagementService.rescheduleSiteVisit(user, id, dto);
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.SITE_VISIT_CANCEL)
  @ApiOperation({ summary: 'Cancel a site visit booking' })
  @ApiResponse({ status: 200, description: 'Site visit cancelled' })
  cancelSiteVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelSiteVisitDto,
  ) {
    return this.engagementService.cancelSiteVisit(user, id, dto);
  }

  @Patch(':id/complete')
  @RequirePermissions(Permission.SITE_VISIT_MANAGE)
  @ApiOperation({ summary: 'Mark a site visit as completed' })
  @ApiResponse({ status: 200, description: 'Site visit completed' })
  completeSiteVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.completeSiteVisit(user, id);
  }
}
