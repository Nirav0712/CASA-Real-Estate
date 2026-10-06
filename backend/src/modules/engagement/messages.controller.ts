import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Direct Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count across all conversations' })
  @ApiResponse({ status: 200, description: 'Total unread message count' })
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.getTotalUnreadMessageCount(user);
  }
}
