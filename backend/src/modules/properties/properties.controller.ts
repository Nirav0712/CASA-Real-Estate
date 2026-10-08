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
  Req,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../entitlements/guards/permissions.guard';
import { RequirePermissions } from '../entitlements/decorators/require-permissions.decorator';
import { Permission } from '../entitlements/enums/permissions.enum';
import { UserRole } from '../auth/enums/auth.enums';
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
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7).trim();
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
  search(@Query() searchDto: SearchPropertiesDto) {
    return this.propertiesService.search(searchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter active published properties from live MongoDB Atlas' })
  @ApiResponse({ status: 200, description: 'Property list returned' })
  findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
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
    return this.propertiesService.findMyProperties(user.id);
  }

  @Get('user/my/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single property owned by currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Property details returned' })
  findMyPropertyById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.findMyPropertyById(id, user.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a draft or rejected property listing for CASA moderation' })
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

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property listing / draft (Seller, Agent, Broker, Developer)' })
  @ApiResponse({ status: 201, description: 'Property created' })
  create(@Body() createPropertyDto: any, @CurrentUser() user: AuthenticatedUser) {
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROPERTY_DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete or archive a property listing' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.deleteProperty(id, user);
  }
}
