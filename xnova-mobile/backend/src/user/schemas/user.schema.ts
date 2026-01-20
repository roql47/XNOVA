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

// 가동률 스키마 (0~100%)
@Schema({ _id: false })
export class OperationRates {
  @Prop({ default: 100 })
  metalMine: number;

  @Prop({ default: 100 })
  crystalMine: number;

  @Prop({ default: 100 })
  deuteriumMine: number;

  @Prop({ default: 100 })
  solarPlant: number;

  @Prop({ default: 100 })
  fusionReactor: number;

  @Prop({ default: 100 })
  solarSatellite: number;
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
  @Prop({ default: 300 })
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

  @Prop({ default: 0 })
  colonyShip: number;
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

  @Prop({ default: false })
  isDowngrade?: boolean;
}

// 공격 진행 상태 스키마 (하위 호환성 유지)
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

  @Prop({ type: Object, default: null })
  transportResources?: { metal: number; crystal: number; deuterium: number };

  @Prop({ type: String, default: 'attack' })
  missionType?: string; // 'attack', 'transport', 'deploy', 'recycle', 'colony'

  @Prop({ type: String, default: null })
  originCoord?: string; // 출발 좌표 (식민지에서 출격 시)

  @Prop({ type: String, default: null })
  originPlanetId?: string; // 출발 식민지 ID (null이면 모행성)
}

// 적 공격 수신 상태 스키마 (정탐 레벨에 따른 함대 정보 가시성 지원)
@Schema({ _id: false })
export class IncomingAttackProgress {
  @Prop()
  targetCoord: string;  // 공격자 출발 좌표

  @Prop()
  targetUserId: string;

  @Prop({ type: String, default: null })
  defendingCoord?: string;  // 공격받는 행성 좌표 (내 모행성 또는 식민지)

  @Prop({ type: Object })
  fleet: Record<string, number | string>;  // 숫자 또는 '?' (정탐 차이로 수량 숨김 시)

  @Prop({ type: String, default: 'full' })
  fleetVisibility?: 'full' | 'composition' | 'hidden';  // 정탐 레벨 차이에 따른 가시성

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

// 귀환 진행 상태 스키마 (하위 호환성 유지)
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

  @Prop({ default: 'attack' })
  missionType: string; // 'attack', 'transport', 'recycle'

  @Prop({ type: String, default: null })
  originPlanetId?: string; // 출발 식민지 ID (null이면 모행성)
}

// 함대 미션 스키마 (출격 + 귀환 통합, 다중 함대 지원)
@Schema({ _id: false })
export class FleetMission {
  @Prop({ required: true })
  missionId: string; // 고유 미션 ID (UUID)

  @Prop({ required: true })
  phase: string; // 'outbound' (출격중), 'returning' (귀환중)

  @Prop({ required: true })
  missionType: string; // 'attack', 'transport', 'deploy', 'recycle', 'colony'

  @Prop({ required: true })
  targetCoord: string;

  @Prop()
  targetUserId?: string;

  @Prop({ type: Object, required: true })
  fleet: Record<string, number>;

  @Prop({ default: 0 })
  capacity: number;

  @Prop({ required: true })
  travelTime: number;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  arrivalTime: Date;

  @Prop()
  returnTime?: Date;

  @Prop()
  returnStartTime?: Date;

  @Prop({ type: Object })
  loot?: Record<string, number>;

  @Prop({ type: Object })
  transportResources?: { metal: number; crystal: number; deuterium: number };

  @Prop()
  originCoord?: string; // 출발 좌표

  @Prop()
  originPlanetId?: string; // 출발 식민지 ID (undefined면 모행성)

  @Prop({ default: false })
  battleCompleted?: boolean;
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

  @Prop({ required: true })
  coordinate: string;  // 현재 활성 행성 좌표 (호환성)

  // 다중 행성 지원
  @Prop({ type: String, default: null })
  homePlanetId: string | null;  // 모행성 Planet ObjectId

  @Prop({ type: String, default: null })
  activePlanetId: string | null;  // 현재 활성 행성 Planet ObjectId

  @Prop({ default: false })
  isAdmin: boolean;  // 관리자 여부

  @Prop({ type: VacationMode, default: () => ({ isActive: false, startTime: null, minEndTime: null }) })
  vacationMode: VacationMode;

  @Prop({ type: Resources, default: () => ({}) })
  resources: Resources;

  @Prop({ type: Mines, default: () => ({}) })
  mines: Mines;

  @Prop({ type: OperationRates, default: () => ({}) })
  operationRates: OperationRates;

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
  pendingAttack: AttackProgress | null;  // 하위 호환용 (단일 미션)

  @Prop({ type: ReturnProgress, default: null })
  pendingReturn: ReturnProgress | null;  // 하위 호환용 (단일 미션)

  @Prop({ type: IncomingAttackProgress, default: null })
  incomingAttack: IncomingAttackProgress | null;

  // 다중 함대 미션 지원 (컴퓨터공학 레벨 + 1 = 최대 동시 운용 함대 수)
  @Prop({ type: [FleetMission], default: [] })
  fleetMissions: FleetMission[];

  @Prop({ default: Date.now })
  lastResourceUpdate: Date;

  @Prop({ default: Date.now })
  lastActivity: Date;  // 최근 활동 시간
}

export const UserSchema = SchemaFactory.createForClass(User);
