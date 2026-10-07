import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
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

  @Get(':slug')
  @ApiOperation({ summary: 'Public agent landing page & published listings' })
  @ApiResponse({ status: 200, description: 'Public agent profile and listings returned' })
  getPublicAgentProfile(@Param('slug') slug: string) {
    return this.agentsService.getPublicAgentProfile(slug);
  }
}
