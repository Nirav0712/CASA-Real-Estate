import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { ComparePropertiesDto } from './dto/compare.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';

@ApiTags('Engagement, Comparison & Analytics')
@Controller('engagement')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare 2 to 4 properties side-by-side' })
  @ApiResponse({ status: 200, description: 'Comparison matrix' })
  compareProperties(@Body() dto: ComparePropertiesDto) {
    return this.engagementService.compareProperties(dto);
  }

  @Post('contact-activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record enquiry / contact request action and update CRM lead' })
  @ApiResponse({ status: 200, description: 'Activity recorded' })
  recordContactActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      propertyId: string;
      actionType: 'ENQUIRY' | 'CONTACT_REQUEST' | 'CALL_REQUEST' | 'WHATSAPP_REQUEST' | 'CHAT_STARTED';
      message?: string;
    },
  ) {
    return this.engagementService.recordContactActivity(user, body);
  }

  @Get('analytics/agent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.VERIFIED_AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get agent lead conversion funnel and analytics' })
  @ApiResponse({ status: 200, description: 'Agent conversion analytics' })
  getAgentAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.getAgentConversionAnalytics(user);
  }

  @Get('analytics/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide conversion analytics' })
  @ApiResponse({ status: 200, description: 'Platform conversion analytics' })
  getAdminAnalytics() {
    return this.engagementService.getAdminPlatformConversionAnalytics();
  }
}
