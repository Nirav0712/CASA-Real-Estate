import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { SavedSearch, SavedSearchSchema } from './schemas/saved-search.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { SiteVisit, SiteVisitSchema } from './schemas/site-visit.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { PropertyReport, PropertyReportSchema } from './schemas/property-report.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { EngagementService } from './engagement.service';
import { WishlistController } from './wishlist.controller';
import { SavedSearchesController } from './saved-searches.controller';
import { NotificationsController } from './notifications.controller';
import { SiteVisitsController } from './site-visits.controller';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { ReviewsController } from './reviews.controller';
import { ReportsController } from './reports.controller';
import { EngagementController } from './engagement.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
      { name: SavedSearch.name, schema: SavedSearchSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: PropertyReport.name, schema: PropertyReportSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [
    WishlistController,
    SavedSearchesController,
    NotificationsController,
    SiteVisitsController,
    ConversationsController,
    MessagesController,
    ReviewsController,
    ReportsController,
    EngagementController,
  ],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
