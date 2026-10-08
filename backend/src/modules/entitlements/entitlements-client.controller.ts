import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EntitlementsService } from './entitlements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Client - Entitlements, Packages & View Limits')
@Controller('entitlements')
export class EntitlementsClientController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get('packages')
  @ApiOperation({ summary: 'Get active marketplace packages' })
  async getPublicPackages(): Promise<any[]> {
    const all = await this.entitlementsService.getAllPackages();
    return all.filter((p) => p.isActive);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user entitlements, permissions, limits, and usage' })
  getMyEntitlementsMe(@Req() req: any): Promise<any> {
    return this.entitlementsService.getUserEntitlementDetails(req.user.id);
  }

  @Get('my-entitlements')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user entitlements, permissions, limits, and usage (alias)' })
  getMyEntitlements(@Req() req: any): Promise<any> {
    return this.entitlementsService.getUserEntitlementDetails(req.user.id);
  }

  @Post('properties/:id/track-view')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Track property view and check contact visibility status' })
  trackPropertyView(@Param('id') id: string, @Req() req: any, @Ip() ip: string): Promise<any> {
    const userId = req.user?.id || null;
    return this.entitlementsService.trackAndValidatePropertyView(userId, id, ip);
  }

  @Post('track-view')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Track property view with body payload' })
  trackPropertyViewBody(@Req() req: any, @Ip() ip: string): Promise<any> {
    const userId = req.user?.id || null;
    const propertyId = req.body?.propertyId || req.body?.id;
    return this.entitlementsService.trackAndValidatePropertyView(userId, propertyId, ip);
  }
}
