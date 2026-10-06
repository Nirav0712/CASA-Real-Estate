import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Notification Center')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for authenticated user' })
  @ApiResponse({ status: 200, description: 'Notification list' })
  getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() queryDto: NotificationQueryDto,
  ) {
    return this.engagementService.getNotifications(user, queryDto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get current unread notification count badge' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.getUnreadNotificationCount(user);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.markAllNotificationsAsRead(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.markNotificationAsRead(user, id);
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all notifications for current user' })
  @ApiResponse({ status: 200, description: 'All notifications cleared' })
  clearAll(@CurrentUser() user: AuthenticatedUser) {
    return this.engagementService.clearAllNotifications(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification' })
  @ApiResponse({ status: 200, description: 'Notification removed' })
  deleteNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.deleteNotification(user, id);
  }
}
