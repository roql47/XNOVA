import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanetDocument = Planet & Document;

// 자원 스키마
@Schema({ _id: false })
export class PlanetResources {
  @Prop({ default: 500 })
  metal: number;

  @Prop({ default: 500 })
  crystal: number;

  @Prop({ default: 0 })
  deuterium: number;

  @Prop({ default: 0 })
  energy: number;
}

// 광산 스키마
@Schema({ _id: false })
export class PlanetMines {
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
export class PlanetFacilities {
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

// 함대 스키마
@Schema({ _id: false })
export class PlanetFleet {
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
export class PlanetDefense {
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

// 행성 정보 스키마
@Schema({ _id: false })
export class PlanetInfo {
  @Prop({ default: 163 })
  maxFields: number;

  @Prop({ default: 0 })
  usedFields: number;

  @Prop({ default: 50 })
  tempMin: number;

  @Prop({ default: 90 })
  tempMax: number;

  @Prop({ default: 'normaltemp' })
  planetType: string;  // trocken, dschjungel, normaltemp, wasser, eis

  @Prop({ default: 12800 })
  diameter: number;
}

// 건설/건조 진행상황 스키마
@Schema({ _id: false })
export class ProgressInfo {
  @Prop()
  type: string;

  @Prop()
  name: string;

  @Prop()
  quantity?: number;

  @Prop()
  builtCount?: number;

  @Prop()
  singleUnitBuildTime?: number;

  @Prop()
  startTime: Date;

  @Prop()
  finishTime: Date;
}

@Schema({ timestamps: true })
export class Planet {
  @Prop({ required: true, index: true })
  ownerId: string;  // User ObjectId

  @Prop({ required: true, unique: true })
  coordinate: string;  // "1:1:1"

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  isHomeworld: boolean;

  @Prop({ default: 'planet' })
  type: string;  // 'planet' | 'moon'

  @Prop({ type: PlanetResources, default: () => ({}) })
  resources: PlanetResources;

  @Prop({ type: PlanetMines, default: () => ({}) })
  mines: PlanetMines;

  @Prop({ type: PlanetFacilities, default: () => ({}) })
  facilities: PlanetFacilities;

  @Prop({ type: PlanetFleet, default: () => ({}) })
  fleet: PlanetFleet;

  @Prop({ type: PlanetDefense, default: () => ({}) })
  defense: PlanetDefense;

  @Prop({ type: PlanetInfo, default: () => ({}) })
  planetInfo: PlanetInfo;

  @Prop({ type: ProgressInfo, default: null })
  constructionProgress: ProgressInfo | null;

  @Prop({ type: ProgressInfo, default: null })
  fleetProgress: ProgressInfo | null;

  @Prop({ type: ProgressInfo, default: null })
  defenseProgress: ProgressInfo | null;

  @Prop({ default: Date.now })
  lastResourceUpdate: Date;
}

export const PlanetSchema = SchemaFactory.createForClass(Planet);

// 위치별 행성 특성 생성 함수
export function generatePlanetCharacteristics(position: number): { 
  planetType: string; 
  tempMin: number; 
  tempMax: number; 
  maxFields: number;
  diameter: number;
} {
  // 위치별 필드 범위 (OGame 기준)
  const fieldRanges = {
    1: { min: 40, max: 90 },
    2: { min: 50, max: 95 },
    3: { min: 55, max: 95 },
    4: { min: 100, max: 240 },
    5: { min: 95, max: 240 },
    6: { min: 80, max: 230 },
    7: { min: 115, max: 180 },
    8: { min: 120, max: 180 },
    9: { min: 125, max: 190 },
    10: { min: 75, max: 125 },
    11: { min: 80, max: 120 },
    12: { min: 85, max: 130 },
    13: { min: 60, max: 160 },
    14: { min: 40, max: 300 },
    15: { min: 50, max: 150 },
  };

  let planetType: string;
  let tempMin: number;
  let tempMax: number;

  // 위치별 행성 타입 및 온도
  if (position >= 1 && position <= 3) {
    planetType = 'trocken';  // 건조한 행성
    tempMin = Math.floor(Math.random() * 101);  // 0~100
    tempMax = tempMin + 40;
  } else if (position >= 4 && position <= 6) {
    planetType = 'dschjungel';  // 정글 행성
    tempMin = Math.floor(Math.random() * 101) - 25;  // -25~75
    tempMax = tempMin + 40;
  } else if (position >= 7 && position <= 9) {
    planetType = 'normaltemp';  // 온대 행성
    tempMin = Math.floor(Math.random() * 101) - 50;  // -50~50
    tempMax = tempMin + 40;
  } else if (position >= 10 && position <= 12) {
    planetType = 'wasser';  // 물 행성
    tempMin = Math.floor(Math.random() * 101) - 75;  // -75~25
    tempMax = tempMin + 40;
  } else {
    planetType = 'eis';  // 얼음 행성
    tempMin = Math.floor(Math.random() * 111) - 100;  // -100~10
    tempMax = tempMin + 40;
  }

  // 필드 크기 계산
  const range = fieldRanges[position] || { min: 100, max: 200 };
  const baseFields = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  const addon = Math.floor(Math.random() * 111) - Math.floor(Math.random() * 101);  // -100 ~ +110
  const maxFields = Math.max(40, baseFields + addon);

  // 직경 계산 (필드 수 기반)
  const diameter = Math.floor(Math.sqrt(maxFields) * 1000);

  return { planetType, tempMin, tempMax, maxFields, diameter };
}


