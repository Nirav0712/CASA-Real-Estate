import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntelligenceService } from './intelligence.service';
import {
  RecommendationQueryDto,
  CreatePromotionDto,
  CreateAutomationRuleDto,
  UpdateNotificationPreferencesDto,
  PricingIntelligenceQueryDto,
} from './dto/intelligence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';
import { RateLimit } from '../../common/guards/rate-limit.guard';

@ApiTags('Marketplace Intelligence & Growth')
@Controller()
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  // 18.2 Recommendations
  @Get('recommendations/properties')
  @ApiOperation({ summary: 'Get personalized or similar property recommendations' })
  async getRecommendations(
    @Query() query: RecommendationQueryDto,
    @Req() req: any,
  ) {
    const user = req.user as AuthenticatedUser | undefined;
    return this.intelligenceService.getRecommendations(user, query);
  }

  // 18.3 Buyer Intent Scoring
  @UseGuards(JwtAuthGuard)
  @Get('buyer/intent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time intent score and signals for authenticated buyer' })
  async getBuyerIntent(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.intelligenceService.getBuyerIntent(user.id);
    return { success: true, data };
  }

  // 18.6 Property Promotion Plans
  @Get('promotions/plans')
  @ApiOperation({ summary: 'List available paid property promotion plans' })
  async getPromotionPlans() {
    const plans = await this.intelligenceService.getPromotionPlans();
    return { success: true, data: plans };
  }

  // 18.6 Create Property Promotion
  @UseGuards(JwtAuthGuard)
  @Post('promotions/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promote a published property listing' })
  async createPromotion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePromotionDto,
  ) {
    const data = await this.intelligenceService.createPromotion(user, dto);
    return { success: true, message: 'Property promotion activated successfully', data };
  }

  // 18.6 Get User Promotions
  @UseGuards(JwtAuthGuard)
  @Get('promotions/my')
  @ApiBearerAuth()
  async getMyPromotions(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.intelligenceService.getUserPromotions(user.id);
    return { success: true, data };
  }

  // 18.9 Marketplace Pricing Intelligence
  @RateLimit({ limit: 60, windowMs: 60000, keyPrefix: 'pricing_intel' })
  @Get('market-intelligence/pricing')
  @ApiOperation({ summary: 'Get aggregated marketplace price trends, distributions and sq.ft benchmarks' })
  async getPricingIntelligence(@Query() query: PricingIntelligenceQueryDto) {
    const data = await this.intelligenceService.getPricingIntelligence(query);
    return { success: true, data };
  }

  // 18.14 Conversion Funnel Intelligence
  @UseGuards(JwtAuthGuard)
  @Get('market-intelligence/funnel')
  @ApiBearerAuth()
  async getConversionFunnel(@CurrentUser() user: AuthenticatedUser) {
    const isAgent = user.role === UserRole.AGENT || user.role === UserRole.PROPERTY_OWNER;
    const data = await this.intelligenceService.getConversionFunnel(isAgent ? user.id : undefined);
    return { success: true, data };
  }

  // 18.10 Notification Preferences
  @UseGuards(JwtAuthGuard)
  @Get('notifications/preferences')
  @ApiBearerAuth()
  async getNotificationPreferences(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.intelligenceService.getNotificationPreferences(user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Put('notifications/preferences')
  @ApiBearerAuth()
  async updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const data = await this.intelligenceService.updateNotificationPreferences(user.id, dto);
    return { success: true, message: 'Notification preferences updated successfully', data };
  }

  // 18.5 Lead Automation Rules
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT)
  @Get('automation/rules')
  @ApiBearerAuth()
  async getAutomationRules(@CurrentUser() user: AuthenticatedUser) {
    const agentId = user.role === UserRole.AGENT ? user.id : undefined;
    const data = await this.intelligenceService.getAutomationRules(agentId);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('automation/rules')
  @ApiBearerAuth()
  async createAutomationRule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAutomationRuleDto,
  ) {
    const data = await this.intelligenceService.createAutomationRule(dto, user.id);
    return { success: true, message: 'Automation rule created successfully', data };
  }

  // 18.11 Admin Operations Automation Overview
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/intelligence/operations-overview')
  @ApiBearerAuth()
  async getAdminOperationsOverview() {
    const data = await this.intelligenceService.getAdminOperationsOverview();
    return { success: true, data };
  }
}
