import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Ip,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { CreateFeaturedRequestDto } from './dto/featured-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../entitlements/guards/permissions.guard';
import { RequirePermissions } from '../entitlements/decorators/require-permissions.decorator';
import { Permission } from '../entitlements/enums/permissions.enum';
import { UserRole, PlatformRole, AccountType, AccountStatus } from '../auth/enums/auth.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

import { JwtService } from '@nestjs/jwt';

@ApiTags('Properties & Categories')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly jwtService: JwtService,
  ) {}

  private extractOptionalUser(req: any): any {
    if (req.user) return req.user;
    let token: string | null = null;
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }
    if (token) {
      try {
        const decoded: any = this.jwtService.decode(token);
        if (decoded) {
          return {
            id: decoded.userId || decoded.sub,
            role: decoded.role,
            platformRole: decoded.platformRole,
            accountType: decoded.accountType,
            status: decoded.status,
          };
        }
      } catch {}
    }
    return null;
  }

  // ==========================================
  // PUBLIC SEARCH & DISCOVERY ENDPOINTS
  // ==========================================

  @Get('search')
  @ApiOperation({ summary: 'Phase 07 — Public multi-facet search & discovery endpoint' })
  @ApiResponse({ status: 200, description: 'Paginated search results returned from MongoDB Atlas' })
  search(@Query() searchDto: SearchPropertiesDto, @Req() req: any) {
    const user = this.extractOptionalUser(req);
    return this.propertiesService.search(searchDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter active published properties from live MongoDB Atlas' })
  @ApiResponse({ status: 200, description: 'Property list returned' })
  findAll(@Query() query: any, @Req() req: any) {
    const user = this.extractOptionalUser(req);
    return this.propertiesService.findAll(query, user);
  }

  @Get('categories/all')
  @ApiOperation({ summary: 'Get all property categories from live MongoDB Atlas' })
  @ApiResponse({ status: 200, description: 'Categories list returned' })
  findAllCategories() {
    return this.propertiesService.findAllCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new property category into MongoDB Atlas' })
  @ApiResponse({ status: 201, description: 'Category created' })
  createCategory(@Body() dto: { name: string; code?: string; description?: string }) {
    return this.propertiesService.createCategory(dto);
  }

  @Patch('categories/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle category active status' })
  toggleCategory(@Param('id') id: string) {
    return this.propertiesService.toggleCategoryStatus(id);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category from MongoDB Atlas' })
  deleteCategory(@Param('id') id: string) {
    return this.propertiesService.deleteCategory(id);
  }

  // ==========================================
  // OWNER / AGENT / DEVELOPER PROTECTED WORKFLOW
  // ==========================================

  @Get('user/my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all properties owned by currently authenticated user' })
  @ApiResponse({ status: 200, description: 'List of owned properties' })
  findMyProperties(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.findMyProperties(user.id, user);
  }

  @Get('user/my/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single property owned by currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Property details returned' })
  findMyPropertyById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.findMyPropertyById(id, user.id, user);
  }

  @Post('featured-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a request to feature a property' })
  @ApiResponse({ status: 201, description: 'Featured request submitted as PENDING' })
  createFeaturedRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFeaturedRequestDto,
  ) {
    return this.propertiesService.createFeaturedRequest(user, dto);
  }

  @Get('featured-requests/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all featured requests submitted by current Broker' })
  @ApiResponse({ status: 200, description: 'List of featured requests' })
  getMyFeaturedRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.getMyFeaturedRequests(user);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a draft or rejected property listing for myproperty moderation' })
  @ApiResponse({ status: 200, description: 'Property submitted for review' })
  submitProperty(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.submitProperty(id, user);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get single property by MongoDB ID or ID string' })
  @ApiResponse({ status: 200, description: 'Property details returned' })
  findById(@Param('id') id: string, @Req() req: any, @Ip() ip: string) {
    const user = this.extractOptionalUser(req);
    return this.propertiesService.findById(id, user, ip);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single property details by slug or ID' })
  @ApiResponse({ status: 200, description: 'Property details returned' })
  findBySlug(@Param('slug') slug: string, @Req() req: any, @Ip() ip: string) {
    const user = this.extractOptionalUser(req);
    return this.propertiesService.findBySlug(slug, user, ip);
  }

  @Post('upload-video')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_CREATE)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max video size
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a property video file to persistent storage' })
  @ApiResponse({ status: 201, description: 'Video file uploaded successfully' })
  uploadVideo(
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user?.status === AccountStatus.SUSPENDED || user?.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException(
        'Your account is currently suspended or inactive. Please contact administration.',
      );
    }

    const roleStr = String(user?.role || user?.accountType || '').toUpperCase();
    const isConsumer =
      roleStr === 'BUYER' ||
      roleStr === 'TENANT' ||
      roleStr === 'PURCHASER' ||
      user?.accountType === AccountType.BUYER ||
      user?.accountType === AccountType.TENANT;

    if (isConsumer) {
      throw new ForbiddenException(
        'Reel and video upload is restricted. Property Buyers and Rental Tenants are not permitted to upload video reels.',
      );
    }

    const isAuthorizedAdvertiser =
      user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ADMIN ||
      user?.platformRole === PlatformRole.SUPER_ADMIN ||
      user?.platformRole === PlatformRole.ADMIN ||
      [
        'BROKER',
        'AGENT',
        'BROKER_AGENCY',
        'BROKER_AGENT',
        'DEVELOPER',
        'PROPERTY_OWNER',
        'SELLER',
        'VERIFIED_AGENT',
      ].includes(roleStr);

    if (!isAuthorizedAdvertiser) {
      throw new ForbiddenException(
        'Only eligible property advertisers (Brokers, Agents, Developers, and Property Owners) can access reel-upload functionality.',
      );
    }

    return this.propertiesService.uploadVideoFile(file, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property listing / draft (Seller, Agent, Broker, Developer)' })
  @ApiResponse({ status: 201, description: 'Property created' })
  create(@Body() createPropertyDto: any, @CurrentUser() user: AuthenticatedUser) {
    if (user?.status === AccountStatus.SUSPENDED || user?.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException(
        'Your account is currently suspended or inactive. Please contact administration.',
      );
    }

    const isDirectAdmin =
      user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ADMIN ||
      user?.platformRole === PlatformRole.SUPER_ADMIN ||
      user?.platformRole === PlatformRole.ADMIN ||
      (user as any)?.role === 'SUPER_ADMIN' ||
      (user as any)?.platformRole === 'SUPER_ADMIN';

    if (isDirectAdmin) {
      throw new ForbiddenException(
        'Super Admin and platform administrators manage listings, moderation, and approvals via the Admin Portal, and cannot create marketplace listings directly.',
      );
    }

    const roleStr = String(user?.role || user?.accountType || '').toUpperCase();
    const isConsumer =
      roleStr === 'BUYER' ||
      roleStr === 'TENANT' ||
      roleStr === 'PURCHASER' ||
      user?.accountType === AccountType.BUYER ||
      user?.accountType === AccountType.TENANT;

    if (isConsumer) {
      throw new ForbiddenException(
        'Property creation is restricted. Property Buyers and Rental Tenants are not permitted to list properties.',
      );
    }

    const isAuthorizedAdvertiser = [
      'BROKER',
      'AGENT',
      'BROKER_AGENCY',
      'BROKER_AGENT',
      'DEVELOPER',
      'PROPERTY_OWNER',
      'SELLER',
      'VERIFIED_AGENT',
    ].includes(roleStr);

    if (!isAuthorizedAdvertiser) {
      throw new ForbiddenException(
        'Only eligible property advertisers (Brokers, Agents, Developers, and Property Owners) can create property listings.',
      );
    }

    return this.propertiesService.createProperty(createPropertyDto, user);
  }

  @Put(':id')
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_EDIT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing property with ownership verification' })
  update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.updateProperty(id, updateDto, user);
  }

  @Get(':id/units')
  @ApiOperation({ summary: 'Get all units/plots under a parent project/building' })
  @ApiResponse({ status: 200, description: 'Units directory returned' })
  findUnits(@Param('id') id: string) {
    return this.propertiesService.findUnitsByParentId(id);
  }

  @Patch(':id/units/:unitId/availability')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_EDIT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update availability status of a specific unit/plot' })
  @ApiResponse({ status: 200, description: 'Unit availability updated' })
  updateUnitAvailability(
    @Param('id') id: string,
    @Param('unitId') unitId: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.updateUnitAvailability(id, unitId, status, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin only delete or archive a property listing or reel' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const isSuperAdmin =
      user?.role === UserRole.SUPER_ADMIN ||
      user?.platformRole === PlatformRole.SUPER_ADMIN ||
      (user as any)?.role === 'SUPER_ADMIN' ||
      (user as any)?.platformRole === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admin authenticated in the Admin Portal is authorized to delete property listings or reels.',
      );
    }

    return this.propertiesService.deleteProperty(id, user);
  }
}
