import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { CreateReviewDto, ModerateReviewDto } from './dto/review.dto';
import { ReviewStatus, ReviewTargetType } from './schemas/review.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../entitlements/guards/permissions.guard';
import { RequirePermissions } from '../entitlements/decorators/require-permissions.decorator';
import { Permission } from '../entitlements/enums/permissions.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Reviews & Ratings')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get public approved reviews and rating statistics for a property' })
  @ApiResponse({ status: 200, description: 'Public property reviews' })
  getPropertyReviews(@Param('propertyId') propertyId: string): Promise<any> {
    return this.engagementService.getPublicReviews(ReviewTargetType.PROPERTY, propertyId);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get public approved reviews and rating statistics for an agent' })
  @ApiResponse({ status: 200, description: 'Public agent reviews' })
  getAgentReviews(@Param('agentId') agentId: string): Promise<any> {
    return this.engagementService.getPublicReviews(ReviewTargetType.AGENT, agentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a verified review for a property or agent' })
  @ApiResponse({ status: 201, description: 'Review submitted' })
  createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ): Promise<any> {
    return this.engagementService.createReview(user, dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REVIEW_MODERATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin get all reviews for moderation' })
  @ApiResponse({ status: 200, description: 'Reviews moderation list' })
  getAdminReviews(
    @Query('status') status?: ReviewStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return this.engagementService.getAdminReviews(status, page, limit);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REVIEW_MODERATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin get all reviews alias' })
  getAdminReviewsAll(
    @Query('status') status?: ReviewStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return this.engagementService.getAdminReviews(status, page, limit);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REVIEW_MODERATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin moderate a review (approve, reject, hide)' })
  @ApiResponse({ status: 200, description: 'Review moderation updated' })
  moderateReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ): Promise<any> {
    return this.engagementService.moderateReview(user, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REVIEW_MODERATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update review status alias' })
  updateReviewStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ): Promise<any> {
    return this.engagementService.moderateReview(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REVIEW_MODERATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete review' })
  deleteReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<any> {
    return this.engagementService.deleteReview(user, id);
  }
}
