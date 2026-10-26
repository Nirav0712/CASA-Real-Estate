import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CreateBrokerEmployeeDto, UpdateBrokerEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';

@ApiTags('Agent Workspace & Verification')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AGENT,
    UserRole.VERIFIED_AGENT,
    UserRole.BROKER,
    UserRole.DEVELOPER,
    UserRole.PROPERTY_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live real-time agent dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Aggregated dashboard metrics returned' })
  getDashboardMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.agentsService.getDashboardMetrics(user);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current agent business profile' })
  @ApiResponse({ status: 200, description: 'Agent profile returned' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.agentsService.getMyProfile(user);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current agent business profile' })
  @ApiResponse({ status: 200, description: 'Agent profile updated' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAgentProfileDto,
  ) {
    return this.agentsService.updateMyProfile(user, dto);
  }

  @Get('me/verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current agent RERA verification status and documents' })
  @ApiResponse({ status: 200, description: 'Verification status returned' })
  getMyVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.agentsService.getMyVerification(user);
  }

  @Post('me/verification/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit RERA verification application for administrator review' })
  @ApiResponse({ status: 201, description: 'Verification application submitted' })
  submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitVerificationDto,
  ) {
    return this.agentsService.submitVerification(user, dto);
  }

  @Post('me/verification/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload or attach a verification document' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.agentsService.uploadDocument(user, dto);
  }

  // ==========================================
  // BROKER AGENCY & BROKER TEAM ENDPOINTS (Requirement 5)
  // ==========================================

  @Get('team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all broker agents under the current agency/broker' })
  @ApiResponse({ status: 200, description: 'Team members returned' })
  getAgencyTeamMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.agentsService.getAgencyTeamMembers(user);
  }

  @Post('team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new broker agent to the current agency' })
  @ApiResponse({ status: 201, description: 'Team member added' })
  addAgencyTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: {
      name: string;
      mobile: string;
      email?: string;
      assignedProperties?: string[];
      permissions?: string[];
    },
  ) {
    return this.agentsService.addAgencyTeamMember(user, dto);
  }

  @Patch('team/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permissions and assigned properties of an agent' })
  @ApiResponse({ status: 200, description: 'Team member updated' })
  updateAgencyTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    dto: {
      assignedProperties?: string[];
      permissions?: string[];
      status?: string;
    },
  ) {
    return this.agentsService.updateAgencyTeamMember(user, id, dto);
  }

  @Delete('team/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove or unlink an agent from the agency' })
  @ApiResponse({ status: 200, description: 'Team member removed' })
  removeAgencyTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.agentsService.removeAgencyTeamMember(user, id);
  }

  // ==========================================
  // BROKER EMPLOYEE MANAGEMENT (Requirement 1 & 2)
  // ==========================================

  @Get('employees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get employee list and counts for current verified Broker' })
  @ApiResponse({ status: 200, description: 'Employees and counts returned' })
  getBrokerEmployees(@CurrentUser() user: AuthenticatedUser) {
    return this.agentsService.getBrokerEmployees(user);
  }

  @Post('employees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new employee under the verified Broker' })
  @ApiResponse({ status: 201, description: 'Employee created' })
  createBrokerEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBrokerEmployeeDto,
  ) {
    return this.agentsService.createBrokerEmployee(user, dto);
  }

  @Put('employees/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update employee details and permissions' })
  @ApiResponse({ status: 200, description: 'Employee updated' })
  updateBrokerEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBrokerEmployeeDto,
  ) {
    return this.agentsService.updateBrokerEmployee(user, id, dto);
  }

  @Patch('employees/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Patch employee details and permissions' })
  @ApiResponse({ status: 200, description: 'Employee updated' })
  patchBrokerEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBrokerEmployeeDto,
  ) {
    return this.agentsService.updateBrokerEmployee(user, id, dto);
  }

  @Patch('employees/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle employee active/deactivated status' })
  @ApiResponse({ status: 200, description: 'Status toggled' })
  toggleBrokerEmployeeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.agentsService.toggleBrokerEmployeeStatus(user, id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Public agent landing page & published listings' })
  @ApiResponse({ status: 200, description: 'Public agent profile and listings returned' })
  getPublicAgentProfile(@Param('slug') slug: string) {
    return this.agentsService.getPublicAgentProfile(slug);
  }
}
