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
import { PurchaserService } from './purchaser.service';
import { UpdatePurchaserProfileDto } from './dto/update-purchaser-profile.dto';
import { PurchaserEnquiryQueryDto } from './dto/purchaser-enquiry-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Purchaser Workspace & Buyer Experience')
@Controller('purchaser')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchaserController {
  constructor(private readonly purchaserService: PurchaserService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated live purchaser dashboard KPI metrics and activity' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics, saved properties, enquiries and recommendations' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.purchaserService.getDashboard(user);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current authenticated purchaser profile and preferences' })
  @ApiResponse({ status: 200, description: 'Purchaser profile and preferences' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.purchaserService.getProfile(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update purchaser profile details and buyer preferences (strictly whitelisted fields)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePurchaserProfileDto,
  ) {
    return this.purchaserService.updateProfile(user, dto);
  }

  @Get('saved-properties')
  @ApiOperation({ summary: 'Get paginated list of saved/favorite properties for authenticated purchaser' })
  @ApiResponse({ status: 200, description: 'Paginated saved property list' })
  getSavedProperties(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.purchaserService.getSavedProperties(user, page, limit);
  }

  @Get('saved-properties/ids')
  @ApiOperation({ summary: 'Get quick array of saved property IDs for state synchronization' })
  @ApiResponse({ status: 200, description: 'Array of property IDs' })
  getSavedPropertyIds(@CurrentUser() user: AuthenticatedUser) {
    return this.purchaserService.getSavedPropertyIds(user);
  }

  @Get('saved-properties/:propertyId/status')
  @ApiOperation({ summary: 'Check if a specific property is saved in favorites' })
  @ApiResponse({ status: 200, description: 'Saved boolean state' })
  isPropertySaved(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.purchaserService.isPropertySaved(user, propertyId);
  }

  @Post('saved-properties/:propertyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save a published property to buyer favorites shortlist' })
  @ApiResponse({ status: 200, description: 'Property saved successfully' })
  saveProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.purchaserService.saveProperty(user, propertyId);
  }

  @Delete('saved-properties/:propertyId')
  @ApiOperation({ summary: 'Remove a property from buyer favorites shortlist' })
  @ApiResponse({ status: 200, description: 'Property removed from saved shortlist' })
  unsaveProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.purchaserService.unsaveProperty(user, propertyId);
  }

  @Get('recently-viewed')
  @ApiOperation({ summary: 'Get list of recently viewed properties for authenticated purchaser' })
  @ApiResponse({ status: 200, description: 'Recently viewed properties' })
  getRecentlyViewed(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
  ) {
    return this.purchaserService.getRecentlyViewed(user, limit);
  }

  @Post('recently-viewed/:propertyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a property view timestamp for purchaser' })
  @ApiResponse({ status: 200, description: 'Property view recorded' })
  recordRecentlyViewed(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.purchaserService.recordRecentlyViewed(user, propertyId);
  }

  @Get('enquiries')
  @ApiOperation({ summary: 'Get list of property enquiries submitted by authenticated purchaser' })
  @ApiResponse({ status: 200, description: 'Paginated enquiry list' })
  getEnquiries(
    @CurrentUser() user: AuthenticatedUser,
    @Query() queryDto: PurchaserEnquiryQueryDto,
  ) {
    return this.purchaserService.getEnquiries(user, queryDto);
  }

  @Get('enquiries/:id')
  @ApiOperation({ summary: 'Get details of a specific enquiry owned by the authenticated purchaser' })
  @ApiResponse({ status: 200, description: 'Enquiry details' })
  getEnquiryById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.purchaserService.getEnquiryById(user, id);
  }

  @Patch('enquiries/:id/cancel')
  @ApiOperation({ summary: 'Cancel/Close an enquiry submitted by purchaser' })
  @ApiResponse({ status: 200, description: 'Enquiry closed' })
  cancelEnquiry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.purchaserService.cancelEnquiry(user, id, reason);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized property recommendations based on buyer history & preferences' })
  @ApiResponse({ status: 200, description: 'List of recommended published properties' })
  getRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
  ) {
    return this.purchaserService.getRecommendations(user, limit);
  }
}
