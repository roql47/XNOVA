import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  // 연합 채팅용 - null이면 전체 채팅
  @Prop({ type: String, default: null })
  allianceId: string | null;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// 최근 메시지만 유지하기 위한 인덱스 (선택적으로 TTL 사용 가능)
ChatMessageSchema.index({ timestamp: -1 });
// 연합 채팅용 인덱스
ChatMessageSchema.index({ allianceId: 1, timestamp: -1 });






