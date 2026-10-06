import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AutomationRuleDocument = AutomationRule & Document;
export type AutomationExecutionDocument = AutomationExecution & Document;
export type FollowUpTaskDocument = FollowUpTask & Document;

export enum AutomationTrigger {
  NEW_ENQUIRY = 'NEW_ENQUIRY',
  SITE_VISIT_REQUESTED = 'SITE_VISIT_REQUESTED',
  SITE_VISIT_COMPLETED = 'SITE_VISIT_COMPLETED',
  LEAD_HOT_INTENT = 'LEAD_HOT_INTENT',
  NO_RESPONSE_TIMEOUT = 'NO_RESPONSE_TIMEOUT',
  LEAD_INACTIVE_REMINDER = 'LEAD_INACTIVE_REMINDER',
}

export enum AutomationAction {
  CREATE_LEAD = 'CREATE_LEAD',
  SCHEDULE_FOLLOW_UP = 'SCHEDULE_FOLLOW_UP',
  NOTIFY_AGENT = 'NOTIFY_AGENT',
  SEND_SMS_ALERT = 'SEND_SMS_ALERT',
  ESCALATE_TO_ADMIN = 'ESCALATE_TO_ADMIN',
}

@Schema({ timestamps: true, collection: 'automation_rules' })
export class AutomationRule {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: Object.values(AutomationTrigger), index: true })
  trigger: AutomationTrigger;

  @Prop({ required: true, enum: Object.values(AutomationAction) })
  action: AutomationAction;

  @Prop({ type: Object, default: {} })
  conditions: Record<string, any>;

  @Prop({ type: Object, default: {} })
  actionPayload: Record<string, any>;

  @Prop({ default: 0 })
  delayMinutes: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  agentId?: string; // Optional agent scope, null = global
}

export const AutomationRuleSchema = SchemaFactory.createForClass(AutomationRule);
AutomationRuleSchema.index({ trigger: 1, isActive: 1 });

@Schema({ timestamps: true, collection: 'automation_executions' })
export class AutomationExecution {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AutomationRule', required: true, index: true })
  ruleId: string;

  @Prop({ required: true })
  ruleName: string;

  @Prop({ required: true, enum: Object.values(AutomationTrigger) })
  trigger: AutomationTrigger;

  @Prop({ required: true })
  targetEntity: string; // 'LEAD', 'SITE_VISIT', 'USER', 'PROPERTY'

  @Prop({ required: true, index: true })
  targetId: string;

  @Prop({ required: true, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], default: 'SUCCESS', index: true })
  status: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop({ type: Date, default: Date.now, index: true })
  executedAt: Date;
}

export const AutomationExecutionSchema = SchemaFactory.createForClass(AutomationExecution);
AutomationExecutionSchema.index({ targetId: 1, trigger: 1, createdAt: -1 });

@Schema({ timestamps: true, collection: 'follow_up_tasks' })
export class FollowUpTask {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Lead', required: true, index: true })
  leadId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  agentId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true, enum: ['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED'], default: 'PENDING', index: true })
  status: string;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: false })
  completedAt?: Date;
}

export const FollowUpTaskSchema = SchemaFactory.createForClass(FollowUpTask);
FollowUpTaskSchema.index({ agentId: 1, status: 1, dueDate: 1 });
