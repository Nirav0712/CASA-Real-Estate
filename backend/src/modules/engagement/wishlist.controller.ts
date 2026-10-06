import {
  Controller,
  Get,
  Post,
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
import { AddToWishlistDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Wishlist & Saved Properties')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a property to authenticated user wishlist' })
  @ApiResponse({ status: 200, description: 'Property added to wishlist' })
  addToWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddToWishlistDto,
  ) {
    return this.engagementService.addToWishlist(user, dto);
  }

  @Delete(':propertyId')
  @ApiOperation({ summary: 'Remove a property from authenticated user wishlist' })
  @ApiResponse({ status: 200, description: 'Property removed from wishlist' })
  removeFromWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.engagementService.removeFromWishlist(user, propertyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated wishlist items for authenticated user' })
  @ApiResponse({ status: 200, description: 'Paginated wishlist with property data' })
  getWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engagementService.getWishlist(user, page, limit);
  }

  @Get('check/:propertyId')
  @ApiOperation({ summary: 'Check if a property is in authenticated user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist presence boolean' })
  isPropertyInWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.engagementService.isPropertyInWishlist(user, propertyId);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get quick array of all wishlist property IDs' })
  @ApiResponse({ status: 200, description: 'Array of property IDs' })
  getWishlistPropertyIds(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.getWishlistPropertyIds(user);
  }
}
