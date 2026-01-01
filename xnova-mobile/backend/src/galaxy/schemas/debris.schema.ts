import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DebrisDocument = Debris & Document;

@Schema({ timestamps: true })
export class Debris {
  @Prop({ required: true, unique: true })
  coordinate: string; // "G:S:P" 형식

  @Prop({ default: 0 })
  metal: number;

  @Prop({ default: 0 })
  crystal: number;
}

export const DebrisSchema = SchemaFactory.createForClass(Debris);

