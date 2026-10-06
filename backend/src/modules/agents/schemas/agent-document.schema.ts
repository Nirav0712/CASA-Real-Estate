import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentVerificationDocumentDocument = AgentVerificationDocument & Document;

@Schema({ timestamps: true, collection: 'agent_documents' })
export class AgentVerificationDocument {
  @Prop({ required: true, index: true })
  agentId: string; // linked to AgentProfile._id or userId

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
    enum: ['RERA_CERTIFICATE', 'AGENCY_LICENSE', 'IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'OTHER'],
  })
  documentType: string;

  @Prop({ required: true })
  documentUrl: string;

  @Prop({ required: true })
  documentName: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  documentNumber?: string;

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  })
  status: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reviewedBy?: string;

  @Prop()
  rejectionReason?: string;
}

export const AgentVerificationDocumentSchema = SchemaFactory.createForClass(AgentVerificationDocument);

AgentVerificationDocumentSchema.index({ userId: 1, createdAt: -1 });
AgentVerificationDocumentSchema.index({ status: 1, createdAt: -1 });
