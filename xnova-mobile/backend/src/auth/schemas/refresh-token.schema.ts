import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// 만료된 토큰 자동 삭제를 위한 TTL 인덱스
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 사용자별 토큰 조회를 위한 인덱스
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });





