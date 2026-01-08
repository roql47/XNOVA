import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DebrisDocument = Debris & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Debris {
  @Prop({ required: true, unique: true })
  coordinate: string; // "G:S:P" 형식

  @Prop({ default: 0 })
  metal: number;

  @Prop({ default: 0 })
  crystal: number;

  // timestamps: true 옵션으로 자동 생성되는 필드
  // 데브리 만료 체크에 사용 (3일 후 자동 소멸)
  createdAt?: Date;
  updatedAt?: Date;
}

export const DebrisSchema = SchemaFactory.createForClass(Debris);




