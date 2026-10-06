import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import {
  QueryLocationDto,
  AutocompleteLocationDto,
  NearbyLocationDto,
} from './dto/query-location.dto';

@ApiTags('Locations (Public)')
@Controller('locations')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter active locations' })
  async getLocations(@Query() query: QueryLocationDto) {
    const result = await this.locationsService.searchLocations(query, false);
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
  @ApiOperation({ summary: 'Get active location hierarchy tree' })
  async getLocationTree() {
    const data = await this.locationsService.getTree(true);
    return {
      success: true,
      data,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search active locations with fuzzy keyword and pincode' })
  async search(@Query() query: QueryLocationDto) {
    const result = await this.locationsService.searchLocations(query, false);
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

  @Get('autocomplete')
  @ApiOperation({ summary: 'Location autocomplete with parent/hierarchy context' })
  async autocomplete(@Query() query: AutocompleteLocationDto) {
    const data = await this.locationsService.autocomplete(query);
    return {
      success: true,
      data,
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Geospatial nearby location discovery' })
  async getNearby(@Query() query: NearbyLocationDto) {
    const data = await this.locationsService.getNearby(query);
    return {
      success: true,
      data,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get location details by unique slug' })
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.locationsService.getLocationBySlug(slug);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by MongoDB ID' })
  async getById(@Param('id') id: string) {
    const data = await this.locationsService.getLocationById(id);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get direct child locations under this parent' })
  async getChildren(@Param('id') id: string) {
    const data = await this.locationsService.getChildren(id, true);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get full ancestor hierarchy and breadcrumb path' })
  async getHierarchy(@Param('id') id: string) {
    const data = await this.locationsService.getHierarchy(id);
    return {
      success: true,
      data,
    };
  }
}
