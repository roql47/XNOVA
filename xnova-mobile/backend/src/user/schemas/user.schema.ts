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

  @Prop({ default: 0 })
  terraformer: number;

  @Prop({ default: 0 })
  allianceDepot: number;

  @Prop({ default: 0 })
  missileSilo: number;

  @Prop({ default: 0 })
  metalStorage: number;

  @Prop({ default: 0 })
  crystalStorage: number;

  @Prop({ default: 0 })
  deuteriumTank: number;

  // 달 전용 건물
  @Prop({ default: 0 })
  lunarBase: number;

  @Prop({ default: 0 })
  sensorPhalanx: number;

  @Prop({ default: 0 })
  jumpGate: number;
}

// 행성 정보 스키마
@Schema({ _id: false })
export class PlanetInfo {
  @Prop({ default: 163 })
  maxFields: number;

  @Prop({ default: 0 })
  usedFields: number;

  @Prop({ default: 50 })
  temperature: number;  // 최고 온도

  @Prop({ default: 'normaltemp' })
  planetType: string;  // trocken, dschjungel, normaltemp, wasser, eis

  @Prop({ default: false })
  isMoon: boolean;

  @Prop({ default: '' })
  planetName: string;

  @Prop({ default: 12800 })
  diameter: number;
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

  @Prop()
  startTime: Date;
}

// 휴가 모드 스키마
@Schema({ _id: false })
export class VacationMode {
  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  startTime: Date;

  @Prop({ type: Date, default: null })
  minEndTime: Date;  // 최소 48시간 후
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true, unique: true })
  coordinate: string;

  @Prop({ type: VacationMode, default: () => ({ isActive: false, startTime: null, minEndTime: null }) })
  vacationMode: VacationMode;

  @Prop({ type: Resources, default: () => ({}) })
  resources: Resources;

  @Prop({ type: Mines, default: () => ({}) })
  mines: Mines;

  @Prop({ type: Facilities, default: () => ({}) })
  facilities: Facilities;

  @Prop({ type: PlanetInfo, default: () => ({}) })
  planetInfo: PlanetInfo;

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

  @Prop({ default: Date.now })
  lastActivity: Date;  // 최근 활동 시간
}

export const UserSchema = SchemaFactory.createForClass(User);
