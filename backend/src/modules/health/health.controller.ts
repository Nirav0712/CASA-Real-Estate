import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'System health check and uptime status' })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
  })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('api/v1/health')
  @ApiOperation({ summary: 'Versioned API health check' })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
  })
  async getApiHealth() {
    return this.healthService.getHealth();
  }
}
