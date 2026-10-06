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
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Saved Searches & Search Alerts')
@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedSearchesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save search filters with optional automatic alert notification triggers' })
  @ApiResponse({ status: 201, description: 'Search filters saved' })
  createSavedSearch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSavedSearchDto,
  ) {
    return this.engagementService.createSavedSearch(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved search filters for current user' })
  @ApiResponse({ status: 200, description: 'List of saved searches' })
  getSavedSearches(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.getSavedSearches(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single saved search by ID' })
  @ApiResponse({ status: 200, description: 'Saved search details' })
  getSavedSearchById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.getSavedSearchById(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved search name or criteria' })
  @ApiResponse({ status: 200, description: 'Saved search updated' })
  updateSavedSearch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    return this.engagementService.updateSavedSearch(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search removed' })
  deleteSavedSearch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.deleteSavedSearch(user, id);
  }

  @Patch(':id/toggle-alerts')
  @ApiOperation({ summary: 'Toggle search alert notifications for a saved search' })
  @ApiResponse({ status: 200, description: 'Search alert toggled' })
  toggleSavedSearchAlerts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.toggleSavedSearchAlerts(user, id);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run saved search filters against live properties' })
  @ApiResponse({ status: 200, description: 'Matching properties result' })
  executeSavedSearch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engagementService.executeSavedSearch(user, id, page, limit);
  }
}
