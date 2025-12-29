import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

// 자원 스키마
@Schema({ _id: false })
export class Resources {
  @Prop({ default: 5000 })
  metal: number;

  @Prop({ default: 2500 })
  crystal: number;

  @Prop({ default: 1500 })
  deuterium: number;

  @Prop({ default: 0 })
  energy: number;
}

// 광산 스키마
@Schema({ _id: false })
export class Mines {
  @Prop({ default: 0 })
  metalMine: number;

  @Prop({ default: 0 })
  crystalMine: number;

  @Prop({ default: 0 })
  deuteriumMine: number;

  @Prop({ default: 0 })
  solarPlant: number;

  @Prop({ default: 0 })
  fusionReactor: number;
}

// 시설 스키마
@Schema({ _id: false })
export class Facilities {
  @Prop({ default: 0 })
  robotFactory: number;

  @Prop({ default: 0 })
  shipyard: number;

  @Prop({ default: 0 })
  researchLab: number;

  @Prop({ default: 0 })
  nanoFactory: number;
}

// 연구 레벨 스키마
@Schema({ _id: false })
export class ResearchLevels {
  @Prop({ default: 0 })
  energyTech: number;

  @Prop({ default: 0 })
  laserTech: number;

  @Prop({ default: 0 })
  ionTech: number;

  @Prop({ default: 0 })
  hyperspaceTech: number;

  @Prop({ default: 0 })
  plasmaTech: number;

  @Prop({ default: 0 })
  combustionDrive: number;

  @Prop({ default: 0 })
  impulseDrive: number;

  @Prop({ default: 0 })
  hyperspaceDrive: number;

  @Prop({ default: 0 })
  espionageTech: number;

  @Prop({ default: 0 })
  computerTech: number;

  @Prop({ default: 0 })
  astrophysics: number;

  @Prop({ default: 0 })
  intergalacticResearch: number;

  @Prop({ default: 0 })
  gravitonTech: number;

  @Prop({ default: 0 })
  weaponsTech: number;

  @Prop({ default: 0 })
  shieldTech: number;

  @Prop({ default: 0 })
  armorTech: number;
}

// 함대 스키마
@Schema({ _id: false })
export class Fleet {
  @Prop({ default: 0 })
  smallCargo: number;

  @Prop({ default: 0 })
  largeCargo: number;

  @Prop({ default: 0 })
  lightFighter: number;

  @Prop({ default: 0 })
  heavyFighter: number;

  @Prop({ default: 0 })
  cruiser: number;

  @Prop({ default: 0 })
  battleship: number;

  @Prop({ default: 0 })
  battlecruiser: number;

  @Prop({ default: 0 })
  bomber: number;

  @Prop({ default: 0 })
  destroyer: number;

  @Prop({ default: 0 })
  deathstar: number;

  @Prop({ default: 0 })
  recycler: number;

  @Prop({ default: 0 })
  espionageProbe: number;

  @Prop({ default: 0 })
  solarSatellite: number;
}

// 방어시설 스키마
@Schema({ _id: false })
export class Defense {
  @Prop({ default: 0 })
  rocketLauncher: number;

  @Prop({ default: 0 })
  lightLaser: number;

  @Prop({ default: 0 })
  heavyLaser: number;

  @Prop({ default: 0 })
  gaussCannon: number;

  @Prop({ default: 0 })
  ionCannon: number;

  @Prop({ default: 0 })
  plasmaTurret: number;

  @Prop({ default: 0 })
  smallShieldDome: number;

  @Prop({ default: 0 })
  largeShieldDome: number;

  @Prop({ default: 0 })
  antiBallisticMissile: number;

  @Prop({ default: 0 })
  interplanetaryMissile: number;
}

// 건설/연구/건조 진행상황 스키마
@Schema({ _id: false })
export class ProgressInfo {
  @Prop()
  type: string;

  @Prop()
  name: string;

  @Prop()
  quantity?: number;

  @Prop()
  startTime: Date;

  @Prop()
  finishTime: Date;
}

// 공격 진행 상태 스키마
@Schema({ _id: false })
export class AttackProgress {
  @Prop()
  targetCoord: string;

  @Prop()
  targetUserId: string;

  @Prop({ type: Object })
  fleet: Record<string, number>;

  @Prop()
  capacity: number;

  @Prop()
  travelTime: number;

  @Prop()
  startTime: Date;

  @Prop()
  arrivalTime: Date;

  @Prop({ default: false })
  battleCompleted: boolean;
}

// 귀환 진행 상태 스키마
@Schema({ _id: false })
export class ReturnProgress {
  @Prop({ type: Object })
  fleet: Record<string, number>;

  @Prop({ type: Object })
  loot: Record<string, number>;

  @Prop()
  returnTime: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true, unique: true })
  coordinate: string;

  @Prop({ type: Resources, default: () => ({}) })
  resources: Resources;

  @Prop({ type: Mines, default: () => ({}) })
  mines: Mines;

  @Prop({ type: Facilities, default: () => ({}) })
  facilities: Facilities;

  @Prop({ type: ResearchLevels, default: () => ({}) })
  researchLevels: ResearchLevels;

  @Prop({ type: Fleet, default: () => ({}) })
  fleet: Fleet;

  @Prop({ type: Defense, default: () => ({}) })
  defense: Defense;

  @Prop({ type: ProgressInfo, default: null })
  constructionProgress: ProgressInfo | null;

  @Prop({ type: ProgressInfo, default: null })
  researchProgress: ProgressInfo | null;

  @Prop({ type: ProgressInfo, default: null })
  fleetProgress: ProgressInfo | null;

  @Prop({ type: ProgressInfo, default: null })
  defenseProgress: ProgressInfo | null;

  @Prop({ type: AttackProgress, default: null })
  pendingAttack: AttackProgress | null;

  @Prop({ type: ReturnProgress, default: null })
  pendingReturn: ReturnProgress | null;

  @Prop({ type: AttackProgress, default: null })
  incomingAttack: AttackProgress | null;

  @Prop({ default: Date.now })
  lastResourceUpdate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
