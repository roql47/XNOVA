import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlacklistedTokenDocument = BlacklistedToken & Document;

@Schema({ timestamps: true })
export class BlacklistedToken {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  reason: string; // 'logout', 'password_change', 'security_revoke' 등
}

export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);

// 만료된 블랙리스트 토큰 자동 삭제를 위한 TTL 인덱스
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 토큰 조회를 위한 인덱스
BlacklistedTokenSchema.index({ token: 1 });





