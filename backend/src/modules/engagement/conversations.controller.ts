import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { StartConversationDto, SendMessageDto } from './dto/messaging.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Buyer-Agent Messaging & Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate or retrieve existing conversation with an agent or buyer' })
  @ApiResponse({ status: 200, description: 'Conversation session' })
  startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartConversationDto,
  ) {
    return this.engagementService.startConversation(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active conversations for current authenticated user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  getConversations(@CurrentUser() user: AuthenticatedUser): Promise<{ success: boolean; data: any[] }> {
    return this.engagementService.getConversations(user);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engagementService.getConversationMessages(user, id, page, limit);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.engagementService.sendMessage(user, id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark all unread messages in conversation as read' })
  @ApiResponse({ status: 200, description: 'Messages marked read' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.engagementService.markConversationRead(user, id);
  }
}
