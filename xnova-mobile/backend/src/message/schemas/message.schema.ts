import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  metadata: any;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ required: true, enum: ['battle', 'system', 'player'] })
  type: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

