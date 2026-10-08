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
  getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.engagementService.getPublicReviews(ReviewTargetType.PROPERTY, propertyId);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get public approved reviews and rating statistics for an agent' })
  @ApiResponse({ status: 200, description: 'Public agent reviews' })
  getAgentReviews(@Param('agentId') agentId: string) {
    return this.engagementService.getPublicReviews(ReviewTargetType.AGENT, agentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.REVIEW_CREATE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a verified review for a property or agent' })
  @ApiResponse({ status: 201, description: 'Review submitted' })
  createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
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
  ) {
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
  ) {
    return this.engagementService.moderateReview(user, id, dto);
  }
}
