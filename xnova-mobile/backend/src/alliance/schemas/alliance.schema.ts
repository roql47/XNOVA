import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AllianceDocument = Alliance & Document;

// 연합 계급 권한 스키마
@Schema({ _id: false })
export class AllianceRank {
  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  delete: boolean; // r1: 연합 해산 권한

  @Prop({ default: false })
  kick: boolean; // r2: 멤버 추방 권한

  @Prop({ default: false })
  applications: boolean; // r3: 가입 신청 열람 권한

  @Prop({ default: false })
  memberlist: boolean; // r4: 멤버 목록 열람 권한

  @Prop({ default: false })
  manageApplications: boolean; // r5: 가입 신청 처리(승인/거절) 권한

  @Prop({ default: false })
  administrate: boolean; // r6: 연합 관리 권한

  @Prop({ default: false })
  onlineStatus: boolean; // r7: 멤버 온라인 상태 확인 권한

  @Prop({ default: false })
  mails: boolean; // r8: 회람 메시지 발송 권한

  @Prop({ default: false })
  rightHand: boolean; // r9: 권한 설정 권한 (Right Hand)
}

export const AllianceRankSchema = SchemaFactory.createForClass(AllianceRank);

// 연합 멤버 스키마
@Schema({ _id: false })
export class AllianceMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true })
  coordinate: string;

  @Prop({ type: String, default: null })
  rankName: string | null; // null이면 일반 멤버 (계급 없음)

  @Prop({ default: Date.now })
  joinedAt: Date;
}

export const AllianceMemberSchema = SchemaFactory.createForClass(AllianceMember);

// 연합 가입 신청 스키마
@Schema({ _id: false })
export class AllianceApplication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true })
  coordinate: string;

  @Prop({ default: '' })
  message: string; // 가입 신청 메시지

  @Prop({ default: Date.now })
  appliedAt: Date;
}

export const AllianceApplicationSchema =
  SchemaFactory.createForClass(AllianceApplication);

// 연합 메인 스키마
@Schema({ timestamps: true })
export class Alliance {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 8 })
  tag: string; // 연합 태그 (3-8자)

  @Prop({ required: true, unique: true, maxlength: 35 })
  name: string; // 연합 이름 (최대 35자)

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId; // 창립자/리더

  @Prop({ default: '창립자' })
  ownerTitle: string; // 창립자 직함

  @Prop({ default: '' })
  externalText: string; // 외부 텍스트 (비회원에게 보이는 연합 소개)

  @Prop({ default: '' })
  internalText: string; // 내부 텍스트 (회원에게만 보이는 내부 공지)

  @Prop({ default: '' })
  logo: string; // 연합 로고 이미지 URL

  @Prop({ default: '' })
  website: string; // 연합 웹사이트 URL

  @Prop({ default: true })
  isOpen: boolean; // 가입 신청 허용 여부

  @Prop({ type: [AllianceRankSchema], default: [] })
  ranks: AllianceRank[]; // 계급 목록

  @Prop({ type: [AllianceMemberSchema], default: [] })
  members: AllianceMember[]; // 멤버 목록

  @Prop({ type: [AllianceApplicationSchema], default: [] })
  applications: AllianceApplication[]; // 가입 신청 목록
}

export const AllianceSchema = SchemaFactory.createForClass(Alliance);

// 인덱스 설정
AllianceSchema.index({ tag: 1 }, { unique: true });
AllianceSchema.index({ name: 1 }, { unique: true });
AllianceSchema.index({ ownerId: 1 });
AllianceSchema.index({ 'members.userId': 1 });
