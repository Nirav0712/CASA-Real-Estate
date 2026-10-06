import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentProfile, AgentProfileSchema } from './schemas/agent-profile.schema';
import {
  AgentVerificationDocument,
  AgentVerificationDocumentSchema,
} from './schemas/agent-document.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { AuditLog, AuditLogSchema } from '../admin/schemas/audit-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentProfile.name, schema: AgentProfileSchema },
      { name: AgentVerificationDocument.name, schema: AgentVerificationDocumentSchema },
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Lead.name, schema: LeadSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    AuthModule,
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
