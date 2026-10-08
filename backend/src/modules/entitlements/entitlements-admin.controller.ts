import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntitlementsService } from './entitlements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/auth.enums';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { CreatePackageDto, UpdatePackageDto } from './dto/create-package.dto';
import { UpdateUserOverridesDto, AddBonusCreditsDto } from './dto/update-user-overrides.dto';

@ApiTags('Admin - Roles, Permissions & Entitlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin/entitlements')
export class EntitlementsAdminController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  // ------------------------------------------
  // ROLES
  // ------------------------------------------
  @Get('roles')
  @ApiOperation({ summary: 'List all system and custom roles' })
  @ApiResponse({ status: 200, description: 'All roles retrieved successfully' })
  getAllRoles(): Promise<any[]> {
    return this.entitlementsService.getAllRoles();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role details by ID or slug' })
  getRoleById(@Param('id') id: string): Promise<any> {
    return this.entitlementsService.getRoleById(id);
  }

  @Post('roles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new custom role' })
  createRole(@Body() dto: CreateRoleDto, @Req() req: any): Promise<any> {
    return this.entitlementsService.createRole(dto, req.user);
  }

  @Patch('roles/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing custom role' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: any): Promise<any> {
    return this.entitlementsService.updateRole(id, dto, req.user);
  }

  @Delete('roles/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete custom role (protected for system roles)' })
  deleteRole(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.entitlementsService.deleteRole(id, req.user);
  }

  @Post('roles/:id/duplicate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Duplicate an existing role as template' })
  duplicateRole(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.entitlementsService.duplicateRole(id, req.user);
  }

  // ------------------------------------------
  // PERMISSIONS DIRECTORY
  // ------------------------------------------
  @Get('permissions')
  @ApiOperation({ summary: 'Get all granular permissions grouped by module' })
  getPermissionsDirectory(): any {
    return this.entitlementsService.getPermissionsDirectory();
  }

  // ------------------------------------------
  // PACKAGES
  // ------------------------------------------
  @Get('packages')
  @ApiOperation({ summary: 'List all subscription packages' })
  getAllPackages(): Promise<any[]> {
    return this.entitlementsService.getAllPackages();
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get package details by ID or slug' })
  getPackageById(@Param('id') id: string): Promise<any> {
    return this.entitlementsService.getPackageById(id);
  }

  @Post('packages')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new subscription package' })
  createPackage(@Body() dto: CreatePackageDto, @Req() req: any): Promise<any> {
    return this.entitlementsService.createPackage(dto, req.user);
  }

  @Patch('packages/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing subscription package' })
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto, @Req() req: any): Promise<any> {
    return this.entitlementsService.updatePackage(id, dto, req.user);
  }

  @Delete('packages/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a subscription package' })
  deletePackage(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.entitlementsService.deletePackage(id, req.user);
  }

  // ------------------------------------------
  // USER ENTITLEMENT CONTROL & OVERRIDES
  // ------------------------------------------
  @Get('usage')
  @ApiOperation({ summary: 'List entitlement usage metrics and quotas across users' })
  getUsageMetrics(@Query() query: { search?: string; page?: number; limit?: number }): Promise<any> {
    return this.entitlementsService.getUsageMetrics(query);
  }

  @Get('users/:id/entitlements')
  @ApiOperation({ summary: 'Get comprehensive user entitlements, package, and usage' })
  getUserEntitlementDetails(@Param('id') id: string): Promise<any> {
    return this.entitlementsService.getUserEntitlementDetails(id);
  }

  @Patch('users/:id/overrides')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user-specific role, package, permission overrides, and limits' })
  updateUserOverrides(@Param('id') id: string, @Body() dto: UpdateUserOverridesDto, @Req() req: any): Promise<any> {
    return this.entitlementsService.updateUserOverrides(id, dto, req.user);
  }

  @Post('users/:id/bonus-credits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Grant bonus credits (e.g. +10 property views) to user' })
  addBonusCredits(@Param('id') id: string, @Body() dto: AddBonusCreditsDto, @Req() req: any): Promise<any> {
    return this.entitlementsService.addBonusCredits(id, dto, req.user);
  }
}
