import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeoService } from './seo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../entitlements/guards/permissions.guard';
import { RequirePermissions } from '../entitlements/decorators/require-permissions.decorator';
import { Permission } from '../entitlements/enums/permissions.enum';
import { UserRole } from '../auth/enums/auth.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateSeoMetadataDto } from './dto/update-seo-metadata.dto';
import { UpdateSeoSettingsDto } from './dto/update-seo-settings.dto';
import { SeoMetadataQueryDto, CreateRedirectDto } from './dto/seo-query.dto';

@ApiTags('Admin SEO Management Engine')
@Controller('seo/admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth()
export class SeoAdminController {
  constructor(private readonly seoService: SeoService) {}

  @Get('overview')
  @RequirePermissions(Permission.SEO_VIEW)
  @ApiOperation({ summary: 'Get overall SEO metrics, indexability status, and score' })
  @ApiResponse({ status: 200, description: 'Overview metrics returned' })
  getOverview() {
    return this.seoService.getAuditOverview();
  }

  @Get('settings')
  @RequirePermissions(Permission.SEO_VIEW)
  @ApiOperation({ summary: 'Get global SEO configuration and templates' })
  getSettings() {
    return this.seoService.getSettings();
  }

  @Put('settings')
  @RequirePermissions(Permission.SEO_MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update global SEO settings, automation modes, or templates' })
  updateSettings(
    @Body() dto: UpdateSeoSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seoService.updateSettings(dto, user);
  }

  @Get('metadata')
  @RequirePermissions(Permission.SEO_VIEW)
  @ApiOperation({ summary: 'Search and filter SEO metadata records across properties and pages' })
  getMetadataList(@Query() query: SeoMetadataQueryDto) {
    return this.seoService.getMetadataList(query);
  }

  @Get('metadata/:id')
  @RequirePermissions(Permission.SEO_VIEW)
  @ApiOperation({ summary: 'Get single SEO metadata record with quality diagnostics' })
  getMetadataById(@Param('id') id: string) {
    return this.seoService.getMetadataById(id);
  }

  @Put('metadata/:id')
  @RequirePermissions(Permission.SEO_MANAGE_METADATA)
  @ApiOperation({ summary: 'Update SEO metadata with manual override and field locking' })
  updateMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateSeoMetadataDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seoService.updateMetadata(id, dto, user);
  }

  @Post('metadata/:id/approve')
  @RequirePermissions(Permission.SEO_APPROVE)
  @ApiOperation({ summary: 'Approve SEO metadata for public search engine indexing' })
  approveMetadata(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seoService.approveMetadata(id, user);
  }

  @Post('metadata/:id/reject')
  @RequirePermissions(Permission.SEO_APPROVE)
  @ApiOperation({ summary: 'Reject SEO metadata with feedback' })
  rejectMetadata(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seoService.rejectMetadata(id, reason, user);
  }

  @Post('metadata/:id/regenerate')
  @RequirePermissions(Permission.SEO_MANAGE_METADATA)
  @ApiOperation({ summary: 'Regenerate metadata using configured template while respecting locks' })
  regenerateMetadata(@Param('id') id: string) {
    return this.seoService.regenerateMetadata(id);
  }

  @Post('audits/run')
  @RequirePermissions(Permission.SEO_AUDIT_VIEW)
  @ApiOperation({ summary: 'Trigger a full website technical SEO audit' })
  runFullSiteAudit() {
    return this.seoService.runFullSiteAudit();
  }

  @Get('audits/issues')
  @RequirePermissions(Permission.SEO_AUDIT_VIEW)
  @ApiOperation({ summary: 'List technical and on-page SEO issues' })
  getAuditIssues(
    @Query('severity') severity?: string,
    @Query('resolved') resolved?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.seoService.getAuditIssues({ severity, resolved, page, limit });
  }

  @Patch('audits/issues/:id/resolve')
  @RequirePermissions(Permission.SEO_MANAGE_METADATA)
  @ApiOperation({ summary: 'Mark an SEO issue as resolved' })
  resolveAuditIssue(@Param('id') id: string) {
    return this.seoService.resolveAuditIssue(id);
  }

  @Get('redirects')
  @RequirePermissions(Permission.SEO_VIEW)
  @ApiOperation({ summary: 'List URL redirects and slug mapping history' })
  getRedirects(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.seoService.getRedirects({ page, limit, search });
  }

  @Post('redirects')
  @RequirePermissions(Permission.SEO_MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Create manual 301 URL redirect' })
  createRedirect(@Body() dto: CreateRedirectDto) {
    return this.seoService.createRedirect(dto);
  }

  @Delete('redirects/:id')
  @RequirePermissions(Permission.SEO_MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Delete a URL redirect' })
  deleteRedirect(@Param('id') id: string) {
    return this.seoService.deleteRedirect(id);
  }
}
