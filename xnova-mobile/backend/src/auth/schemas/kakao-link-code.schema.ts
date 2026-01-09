import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KakaoLinkCodeDocument = KakaoLinkCode & Document;

@Schema({ timestamps: true })
export class KakaoLinkCode {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const KakaoLinkCodeSchema = SchemaFactory.createForClass(KakaoLinkCode);

// 인덱스 설정
KakaoLinkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL 인덱스
KakaoLinkCodeSchema.index({ code: 1 });
KakaoLinkCodeSchema.index({ userId: 1 });

