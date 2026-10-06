import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto, UpdateLeadPriorityDto } from './dto/update-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { AddLeadNoteDto } from './dto/add-lead-note.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadFollowUpDto } from './dto/create-lead-follow-up.dto';
import { SetFollowUpDto } from './dto/set-follow-up.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';

@ApiTags('Leads & CRM')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a property enquiry / create a lead' })
  @ApiResponse({ status: 201, description: 'Enquiry submitted and routed to advertiser' })
  createLead(
    @Body() dto: CreateLeadDto,
    @CurrentUser() purchaser?: AuthenticatedUser,
  ) {
    return this.leadsService.createLead(dto, purchaser);
  }

  @Get('kpis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AGENT,
    UserRole.VERIFIED_AGENT,
    UserRole.PROPERTY_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get CRM Dashboard KPIs' })
  @ApiResponse({ status: 200, description: 'CRM KPI metrics returned' })
  getKPIs(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.getKPIs(user);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AGENT,
    UserRole.VERIFIED_AGENT,
    UserRole.PROPERTY_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get CRM Analytics and Aggregations' })
  @ApiResponse({ status: 200, description: 'CRM analytics data returned' })
  getAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.getAnalytics(user);
  }

  @Get('follow-ups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AGENT,
    UserRole.VERIFIED_AGENT,
    UserRole.PROPERTY_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get due, upcoming, and overdue follow-ups' })
  @ApiResponse({ status: 200, description: 'Follow-ups queue returned' })
  getFollowUps(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.getAgentFollowUps(user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AGENT,
    UserRole.VERIFIED_AGENT,
    UserRole.PROPERTY_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List leads assigned to current Agent / Property Owner (Legacy alias)' })
  @ApiResponse({ status: 200, description: 'Paginated lead list returned' })
  getMyLeads(
    @CurrentUser() user: AuthenticatedUser,
    @Query() queryDto: LeadQueryDto,
  ) {
    return this.leadsService.getLeads(user, queryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AGENT,
    UserRole.VERIFIED_AGENT,
    UserRole.PROPERTY_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List leads with RBAC filtering and search' })
  @ApiResponse({ status: 200, description: 'Paginated lead list returned' })
  getLeads(
    @CurrentUser() user: AuthenticatedUser,
    @Query() queryDto: LeadQueryDto,
  ) {
    return this.leadsService.getLeads(user, queryDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single lead details and full CRM timeline' })
  @ApiResponse({ status: 200, description: 'Lead details and timeline returned' })
  getLeadById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.getLeadById(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead workflow status' })
  @ApiResponse({ status: 200, description: 'Lead status updated' })
  updateLeadStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateLeadStatus(id, user, dto);
  }

  @Patch(':id/priority')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead priority' })
  @ApiResponse({ status: 200, description: 'Lead priority updated' })
  updateLeadPriority(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLeadPriorityDto,
  ) {
    return this.leadsService.updateLeadPriority(id, user, dto);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROPERTY_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign or reassign a lead to an Agent' })
  @ApiResponse({ status: 200, description: 'Lead assigned successfully' })
  assignLead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignLeadDto,
  ) {
    return this.leadsService.assignLead(id, user, dto);
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a private internal note to lead timeline' })
  @ApiResponse({ status: 201, description: 'Note added to lead' })
  addLeadNote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddLeadNoteDto,
  ) {
    return this.leadsService.addLeadNote(id, user, dto);
  }

  @Post(':id/activities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log a CRM activity (Call, WhatsApp, Site Visit, Email)' })
  @ApiResponse({ status: 201, description: 'Activity logged on lead' })
  addLeadActivity(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeadActivityDto,
  ) {
    return this.leadsService.addLeadActivity(id, user, dto);
  }

  @Post(':id/follow-ups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule a follow-up for lead' })
  @ApiResponse({ status: 201, description: 'Follow-up created' })
  createFollowUp(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeadFollowUpDto,
  ) {
    return this.leadsService.createFollowUp(id, user, dto);
  }

  @Post(':id/follow-up')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule a follow-up date for lead (Legacy alias)' })
  @ApiResponse({ status: 201, description: 'Follow-up date scheduled' })
  setFollowUp(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetFollowUpDto,
  ) {
    return this.leadsService.setFollowUp(id, user, dto);
  }

  @Patch(':id/follow-ups/:followUpId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark scheduled follow-up as completed' })
  @ApiResponse({ status: 200, description: 'Follow-up completed' })
  completeFollowUp(
    @Param('id') id: string,
    @Param('followUpId') followUpId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('note') note?: string,
  ) {
    return this.leadsService.completeFollowUp(id, followUpId, user, note);
  }

  @Patch(':id/follow-ups/:followUpId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel scheduled follow-up' })
  @ApiResponse({ status: 200, description: 'Follow-up cancelled' })
  cancelFollowUp(
    @Param('id') id: string,
    @Param('followUpId') followUpId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('note') note?: string,
  ) {
    return this.leadsService.cancelFollowUp(id, followUpId, user, note);
  }
}
