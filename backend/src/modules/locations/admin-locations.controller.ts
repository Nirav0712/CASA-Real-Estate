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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/enums/auth.enums';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';

@ApiTags('Locations (Admin Management)')
@Controller('admin/locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AdminLocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin paginated location list with property and child metrics' })
  async getLocations(@Query() query: QueryLocationDto) {
    const result = await this.locationsService.searchLocations(query, true);
    return {
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    };
  }

  @Get('tree')
  @ApiOperation({ summary: 'Admin full location hierarchy tree (including inactive nodes)' })
  async getTree() {
    const data = await this.locationsService.getTree(false);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single location details with populated parent' })
  async getById(@Param('id') id: string) {
    const data = await this.locationsService.getLocationById(id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new location in hierarchy' })
  async createLocation(
    @Body() dto: CreateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.locationsService.createLocation(dto, {
      id: user.id,
      name: user.email || 'Admin',
      role: user.role,
    });
    return {
      success: true,
      message: `Location "${data.name}" created successfully.`,
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update location details, coordinates, aliases, or hierarchy' })
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.locationsService.updateLocation(id, dto, {
      id: user.id,
      name: user.email || 'Admin',
      role: user.role,
    });
    return {
      success: true,
      message: `Location "${data.name}" updated successfully.`,
      data,
    };
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate location' })
  async activateLocation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.locationsService.activateLocation(id, {
      id: user.id,
      name: user.email || 'Admin',
      role: user.role,
    });
    return {
      success: true,
      message: `Location "${data.name}" activated.`,
      data,
    };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate location' })
  async deactivateLocation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.locationsService.deactivateLocation(id, {
      id: user.id,
      name: user.email || 'Admin',
      role: user.role,
    });
    return {
      success: true,
      message: `Location "${data.name}" deactivated.`,
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Safely delete location (prevented if properties or children exist)' })
  async deleteLocation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.locationsService.deleteLocation(id, {
      id: user.id,
      name: user.email || 'Admin',
      role: user.role,
    });
    return {
      success: true,
      message: result.message,
      data: { id: result.deletedId },
    };
  }
}
