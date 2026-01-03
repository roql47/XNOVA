import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';
import { ResourcesService } from './resources.service';
import { BUILDING_COSTS, NAME_MAPPING } from '../constants/game-data';

export interface BuildingInfo {
  type: string;
  name: string;
  level: number;
  category: string;
  upgradeCost: { metal: number; crystal: number; deuterium?: number } | null;
  upgradeTime: number;
  production?: number;
  consumption?: number;
  nextProduction?: number;
  nextConsumption?: number;
}

// 필드를 차지하는 건물 목록
const FIELD_CONSUMING_BUILDINGS = [
  'metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor',
  'robotFactory', 'nanoFactory', 'shipyard', 'metalStorage', 'crystalStorage',
  'deuteriumTank', 'researchLab', 'terraformer', 'allianceDepot', 'missileSilo',
  'lunarBase', 'sensorPhalanx', 'jumpGate'
];

// 위치별 행성 필드 범위 (1~15 위치)
const PLANET_FIELD_RANGES = {
  min: [40, 50, 55, 100, 95, 80, 115, 120, 125, 75, 80, 85, 60, 40, 50],
  max: [90, 95, 95, 240, 240, 230, 180, 180, 190, 125, 120, 130, 160, 300, 150]
};

// 위치별 온도 범위
const PLANET_TEMP_RANGES = {
  min: [40, 40, 40, 15, 15, 15, -10, -10, -10, -35, -35, -35, -60, -60, -60],
  max: [140, 140, 140, 115, 115, 115, 90, 90, 90, 65, 65, 65, 50, 50, 50]
};

// 위치별 행성 타입
const PLANET_TYPES = [
  'trocken', 'trocken', 'trocken',       // 1-3: 건조
  'dschjungel', 'dschjungel', 'dschjungel', // 4-6: 정글
  'normaltemp', 'normaltemp', 'normaltemp', // 7-9: 온대
  'wasser', 'wasser', 'wasser',           // 10-12: 물
  'eis', 'eis', 'eis'                     // 13-15: 얼음
];

@Injectable()
export class BuildingsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
    private resourcesService: ResourcesService,
  ) {}

  // 활성 행성이 모행성인지 확인
  isHomePlanet(activePlanetId: string | null, userId: string): boolean {
    if (!activePlanetId) return true;
    return activePlanetId.startsWith('home_') || activePlanetId === `home_${userId}`;
  }

  // 행성 위치에서 position 추출 (좌표 형식: "1:1:4")
  extractPlanetPosition(coordinate: string): number {
    const parts = coordinate.split(':');
    if (parts.length !== 3) return 7; // 기본값: 온대 지역
    return parseInt(parts[2], 10) || 7;
  }

  // 행성 생성 시 필드 수 결정 (랜덤)
  generatePlanetFields(position: number, isHomeWorld: boolean = false): { maxFields: number; temperature: number; planetType: string } {
    if (isHomeWorld) {
      // 모행성은 기본 163 필드
      return {
        maxFields: 163,
        temperature: 50,
        planetType: 'normaltemp'
      };
    }

    // 위치 인덱스 (0-14)
    const posIndex = Math.max(0, Math.min(14, position - 1));
    
    // 랜덤 필드 수 결정
    const minFields = PLANET_FIELD_RANGES.min[posIndex];
    const maxFields = PLANET_FIELD_RANGES.max[posIndex];
    const randomFields = Math.floor(Math.random() * (maxFields - minFields + 1)) + minFields;

    // 랜덤 온도 결정
    const minTemp = PLANET_TEMP_RANGES.min[posIndex];
    const maxTemp = PLANET_TEMP_RANGES.max[posIndex];
    const randomTemp = Math.floor(Math.random() * (maxTemp - minTemp + 1)) + minTemp;

    return {
      maxFields: randomFields,
      temperature: randomTemp,
      planetType: PLANET_TYPES[posIndex]
    };
  }

  // 현재 사용 중인 필드 수 계산
  calculateUsedFields(user: UserDocument): number {
    let usedFields = 0;

    // 광산 레벨 합산
    if (user.mines) {
      usedFields += user.mines.metalMine || 0;
      usedFields += user.mines.crystalMine || 0;
      usedFields += user.mines.deuteriumMine || 0;
      usedFields += user.mines.solarPlant || 0;
      usedFields += user.mines.fusionReactor || 0;
    }

    // 시설 레벨 합산
    if (user.facilities) {
      usedFields += user.facilities.robotFactory || 0;
      usedFields += user.facilities.nanoFactory || 0;
      usedFields += user.facilities.shipyard || 0;
      usedFields += user.facilities.researchLab || 0;
      usedFields += user.facilities.terraformer || 0;
      usedFields += user.facilities.allianceDepot || 0;
      usedFields += user.facilities.missileSilo || 0;
      usedFields += user.facilities.metalStorage || 0;
      usedFields += user.facilities.crystalStorage || 0;
      usedFields += user.facilities.deuteriumTank || 0;
      usedFields += user.facilities.lunarBase || 0;
      usedFields += user.facilities.sensorPhalanx || 0;
      usedFields += user.facilities.jumpGate || 0;
    }

    return usedFields;
  }

  // 테라포머 보너스 필드 계산 (레벨당 5 필드 추가)
  getTerraformerBonus(terraformerLevel: number): number {
    return terraformerLevel * 5;
  }

  // 최대 필드 수 계산 (기본 + 테라포머 보너스)
  getMaxFields(user: UserDocument): number {
    const baseFields = user.planetInfo?.maxFields || 163;
    const terraformerLevel = user.facilities?.terraformer || 0;
    return baseFields + this.getTerraformerBonus(terraformerLevel);
  }

  // 필드가 가득 찼는지 확인
  isFieldsFull(user: UserDocument): boolean {
    const usedFields = this.calculateUsedFields(user);
    const maxFields = this.getMaxFields(user);
    return usedFields >= maxFields;
  }

  // 필드 정보 조회
  getFieldInfo(user: UserDocument): { used: number; max: number; remaining: number; percentage: number } {
    const usedFields = this.calculateUsedFields(user);
    const maxFields = this.getMaxFields(user);
    return {
      used: usedFields,
      max: maxFields,
      remaining: maxFields - usedFields,
      percentage: Math.round((usedFields / maxFields) * 100)
    };
  }

  // 건물 업그레이드 비용 계산 - XNOVA.js getUpgradeCost 마이그레이션
  getUpgradeCost(buildingType: string, currentLevel: number): { metal: number; crystal: number; deuterium?: number } | null {
    const buildingData = BUILDING_COSTS[buildingType];
    if (!buildingData) return null;

    const cost: { metal: number; crystal: number; deuterium?: number } = {
      metal: 0,
      crystal: 0,
    };

    if (buildingData.base.metal) {
      cost.metal = Math.floor(buildingData.base.metal * Math.pow(buildingData.factor, currentLevel));
    }
    if (buildingData.base.crystal) {
      cost.crystal = Math.floor(buildingData.base.crystal * Math.pow(buildingData.factor, currentLevel));
    }
    if (buildingData.base.deuterium) {
      cost.deuterium = Math.floor(buildingData.base.deuterium * Math.pow(buildingData.factor, currentLevel));
    }

    return cost;
  }

  // 건설 시간 계산 - XNOVA.js getConstructionTime 마이그레이션
  getConstructionTime(
    buildingType: string,
    currentLevel: number,
    robotFactoryLevel: number,
    nanoFactoryLevel: number = 0,
  ): number {
    const cost = this.getUpgradeCost(buildingType, currentLevel);
    if (!cost) return 3600;

    const totalCost = (cost.metal || 0) + (cost.crystal || 0);
    const nanoBonus = Math.pow(2, nanoFactoryLevel);
    const facilityBonus = 1 + robotFactoryLevel;

    // 건설 시간 (초) - 10배 속도 적용
    return Math.ceil((totalCost / (25 * facilityBonus * nanoBonus)) * 4 / 10);
  }

  // 식민지 필드 정보 계산
  calculateColonyUsedFields(planet: PlanetDocument): number {
    let usedFields = 0;

    if (planet.mines) {
      usedFields += planet.mines.metalMine || 0;
      usedFields += planet.mines.crystalMine || 0;
      usedFields += planet.mines.deuteriumMine || 0;
      usedFields += planet.mines.solarPlant || 0;
      usedFields += planet.mines.fusionReactor || 0;
    }

    if (planet.facilities) {
      usedFields += planet.facilities.robotFactory || 0;
      usedFields += planet.facilities.nanoFactory || 0;
      usedFields += planet.facilities.shipyard || 0;
      usedFields += planet.facilities.researchLab || 0;
      usedFields += planet.facilities.terraformer || 0;
      usedFields += planet.facilities.allianceDepot || 0;
      usedFields += planet.facilities.missileSilo || 0;
      usedFields += planet.facilities.metalStorage || 0;
      usedFields += planet.facilities.crystalStorage || 0;
      usedFields += planet.facilities.deuteriumTank || 0;
    }

    return usedFields;
  }

  // 식민지 최대 필드 계산
  getColonyMaxFields(planet: PlanetDocument): number {
    const baseFields = planet.planetInfo?.maxFields || 163;
    const terraformerLevel = planet.facilities?.terraformer || 0;
    return baseFields + this.getTerraformerBonus(terraformerLevel);
  }

  // 식민지 필드 정보
  getColonyFieldInfo(planet: PlanetDocument): { used: number; max: number; remaining: number; percentage: number } {
    const usedFields = this.calculateColonyUsedFields(planet);
    const maxFields = this.getColonyMaxFields(planet);
    return {
      used: usedFields,
      max: maxFields,
      remaining: maxFields - usedFields,
      percentage: Math.round((usedFields / maxFields) * 100)
    };
  }

  // 건물 현황 조회 (활성 행성 기준)
  async getBuildings(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const isHome = this.isHomePlanet(user.activePlanetId, userId);
    let mines: any;
    let facilities: any;
    let constructionProgress: any;
    let fieldInfo: any;
    let planetInfo: any;

    if (isHome) {
      // 모행성 데이터
      mines = user.mines || {};
      facilities = user.facilities || {};
      constructionProgress = user.constructionProgress;
      fieldInfo = this.getFieldInfo(user);
      planetInfo = {
        temperature: user.planetInfo?.temperature ?? 50,
        planetType: user.planetInfo?.planetType ?? 'normaltemp',
        planetName: user.planetInfo?.planetName ?? user.playerName,
        diameter: user.planetInfo?.diameter ?? 12800,
      };
    } else {
      // 식민지 데이터
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet) {
        // 식민지 못찾으면 모행성으로 폴백
        mines = user.mines || {};
        facilities = user.facilities || {};
        constructionProgress = user.constructionProgress;
        fieldInfo = this.getFieldInfo(user);
        planetInfo = {
          temperature: user.planetInfo?.temperature ?? 50,
          planetType: user.planetInfo?.planetType ?? 'normaltemp',
          planetName: user.planetInfo?.planetName ?? user.playerName,
          diameter: user.planetInfo?.diameter ?? 12800,
        };
      } else {
        mines = planet.mines || {};
        facilities = planet.facilities || {};
        constructionProgress = planet.constructionProgress;
        fieldInfo = this.getColonyFieldInfo(planet);
        planetInfo = {
          temperature: planet.planetInfo?.tempMax ?? 50,
          planetType: planet.planetInfo?.planetType ?? 'normaltemp',
          planetName: planet.name || '식민지',
          diameter: planet.planetInfo?.diameter ?? 12800,
        };
      }
    }

    // 각 건물의 업그레이드 비용 및 시간 계산
    const buildingsInfo: BuildingInfo[] = [];

    // 광산
    const mineTypes = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'];
    for (const key of mineTypes) {
      const level = mines[key] || 0;
      const cost = this.getUpgradeCost(key, level);
      const time = this.getConstructionTime(key, level, facilities.robotFactory || 0, facilities.nanoFactory || 0);
      
      let production: number | undefined;
      let consumption: number | undefined;
      let nextProduction: number | undefined;
      let nextConsumption: number | undefined;

      if (key === 'metalMine') {
        production = this.resourcesService.getResourceProduction(level, 'metal');
        consumption = this.resourcesService.getEnergyConsumption(level, 'metal');
        nextProduction = this.resourcesService.getResourceProduction(level + 1, 'metal');
        nextConsumption = this.resourcesService.getEnergyConsumption(level + 1, 'metal');
      } else if (key === 'crystalMine') {
        production = this.resourcesService.getResourceProduction(level, 'crystal');
        consumption = this.resourcesService.getEnergyConsumption(level, 'crystal');
        nextProduction = this.resourcesService.getResourceProduction(level + 1, 'crystal');
        nextConsumption = this.resourcesService.getEnergyConsumption(level + 1, 'crystal');
      } else if (key === 'deuteriumMine') {
        production = this.resourcesService.getResourceProduction(level, 'deuterium');
        consumption = this.resourcesService.getEnergyConsumption(level, 'deuterium');
        nextProduction = this.resourcesService.getResourceProduction(level + 1, 'deuterium');
        nextConsumption = this.resourcesService.getEnergyConsumption(level + 1, 'deuterium');
      } else if (key === 'solarPlant') {
        production = this.resourcesService.getEnergyProduction(level);
        nextProduction = this.resourcesService.getEnergyProduction(level + 1);
      } else if (key === 'fusionReactor') {
        production = this.resourcesService.getFusionEnergyProduction(level);
        consumption = this.resourcesService.getFusionDeuteriumConsumption(level);
        nextProduction = this.resourcesService.getFusionEnergyProduction(level + 1);
        nextConsumption = this.resourcesService.getFusionDeuteriumConsumption(level + 1);
      }

      buildingsInfo.push({
        type: key,
        name: NAME_MAPPING[key],
        level,
        category: 'mines',
        upgradeCost: cost,
        upgradeTime: time,
        production,
        consumption,
        nextProduction,
        nextConsumption,
      });
    }

    // 시설
    const facilityTypes = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'];
    for (const key of facilityTypes) {
      const level = facilities[key] || 0;
      const cost = this.getUpgradeCost(key, level);
      const time = this.getConstructionTime(key, level, facilities.robotFactory || 0, facilities.nanoFactory || 0);
      
      buildingsInfo.push({
        type: key,
        name: NAME_MAPPING[key],
        level,
        category: 'facilities',
        upgradeCost: cost,
        upgradeTime: time,
      });
    }

    return {
      buildings: buildingsInfo,
      constructionProgress,
      fieldInfo: {
        used: fieldInfo.used,
        max: fieldInfo.max,
        remaining: fieldInfo.remaining,
        percentage: fieldInfo.percentage,
      },
      planetInfo,
      isHomePlanet: isHome,
    };
  }

  // 건물 업그레이드 시작 (활성 행성 기준)
  async startUpgrade(userId: string, buildingType: string) {
    const result = await this.resourcesService.updateResourcesWithPlanet(userId);
    if (!result) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const { user, planet } = result;
    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    // 활성 행성 데이터
    let mines: any;
    let facilities: any;
    let constructionProgress: any;

    if (isHome) {
      mines = user.mines || {};
      facilities = user.facilities || {};
      constructionProgress = user.constructionProgress;
    } else if (planet) {
      mines = planet.mines || {};
      facilities = planet.facilities || {};
      constructionProgress = planet.constructionProgress;
    } else {
      throw new BadRequestException('행성을 찾을 수 없습니다.');
    }

    // 이미 건설 진행 중인지 확인
    if (constructionProgress) {
      const remainingTime = Math.max(0, (constructionProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[constructionProgress.name] || constructionProgress.name} 건설이 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    // 건물 타입 확인
    const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
    const isFacility = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory', 'terraformer', 
                        'allianceDepot', 'missileSilo', 'metalStorage', 'crystalStorage', 'deuteriumTank',
                        'lunarBase', 'sensorPhalanx', 'jumpGate'].includes(buildingType);

    if (!isMine && !isFacility) {
      throw new BadRequestException('알 수 없는 건물 유형입니다.');
    }

    // 필드 체크
    if (FIELD_CONSUMING_BUILDINGS.includes(buildingType) && buildingType !== 'terraformer') {
      if (isHome) {
        if (this.isFieldsFull(user)) {
          const fieldInfo = this.getFieldInfo(user);
          throw new BadRequestException(`필드가 가득 찼습니다. (${fieldInfo.used}/${fieldInfo.max}) 테라포머를 건설하여 필드를 확장하세요.`);
        }
      } else if (planet) {
        const fieldInfo = this.getColonyFieldInfo(planet);
        if (fieldInfo.remaining <= 0) {
          throw new BadRequestException(`필드가 가득 찼습니다. (${fieldInfo.used}/${fieldInfo.max}) 테라포머를 건설하여 필드를 확장하세요.`);
        }
      }
    }

    // 현재 레벨 확인
    const currentLevel = isMine 
      ? (mines[buildingType] || 0)
      : (facilities[buildingType] || 0);

    // 비용 계산
    const cost = this.getUpgradeCost(buildingType, currentLevel);
    if (!cost) {
      throw new BadRequestException('건물 비용을 계산할 수 없습니다.');
    }

    // 자원 확인 및 차감 (활성 행성에서)
    const hasResources = await this.resourcesService.deductResources(userId, cost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    // 건설 시간 계산
    const constructionTime = this.getConstructionTime(
      buildingType,
      currentLevel,
      facilities.robotFactory || 0,
      facilities.nanoFactory || 0,
    );

    // 건설 진행 정보 저장
    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + constructionTime * 1000);

    const progress = {
      type: isMine ? 'mine' : 'facility',
      name: buildingType,
      startTime,
      finishTime,
    };

    if (isHome) {
      user.constructionProgress = progress;
      await user.save();
    } else if (planet) {
      planet.constructionProgress = progress;
      await planet.save();
    }

    return {
      message: `${NAME_MAPPING[buildingType]} 업그레이드가 시작되었습니다.`,
      building: buildingType,
      currentLevel,
      targetLevel: currentLevel + 1,
      cost,
      constructionTime,
      finishTime,
    };
  }

  // 건설 완료 처리 (활성 행성 기준)
  async completeConstruction(userId: string): Promise<{ completed: boolean; building?: string; newLevel?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return { completed: false };

    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    if (isHome) {
      // 모행성 건설 완료
      if (!user.constructionProgress) return { completed: false };
      if (user.constructionProgress.finishTime.getTime() > Date.now()) return { completed: false };

      const buildingType = user.constructionProgress.name;
      const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);

      if (isMine) {
        (user.mines as any)[buildingType] = ((user.mines as any)[buildingType] || 0) + 1;
      } else {
        (user.facilities as any)[buildingType] = ((user.facilities as any)[buildingType] || 0) + 1;
      }

      const newLevel = isMine ? (user.mines as any)[buildingType] : (user.facilities as any)[buildingType];
      user.constructionProgress = null;
      await user.save();

      return { completed: true, building: buildingType, newLevel };
    } else {
      // 식민지 건설 완료
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet || !planet.constructionProgress) return { completed: false };
      if (planet.constructionProgress.finishTime.getTime() > Date.now()) return { completed: false };

      const buildingType = planet.constructionProgress.name;
      const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);

      if (isMine) {
        if (!planet.mines) planet.mines = {} as any;
        (planet.mines as any)[buildingType] = ((planet.mines as any)[buildingType] || 0) + 1;
      } else {
        if (!planet.facilities) planet.facilities = {} as any;
        (planet.facilities as any)[buildingType] = ((planet.facilities as any)[buildingType] || 0) + 1;
      }

      const newLevel = isMine ? (planet.mines as any)[buildingType] : (planet.facilities as any)[buildingType];
      planet.constructionProgress = null;
      await planet.save();

      return { completed: true, building: buildingType, newLevel };
    }
  }

  // 건설 취소 (활성 행성 기준)
  async cancelConstruction(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new BadRequestException('사용자를 찾을 수 없습니다.');

    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    if (isHome) {
      // 모행성 건설 취소
      if (!user.constructionProgress) {
        throw new BadRequestException('진행 중인 건설이 없습니다.');
      }

      const buildingType = user.constructionProgress.name;
      const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
      const currentLevel = isMine 
        ? ((user.mines as any)[buildingType] || 0)
        : ((user.facilities as any)[buildingType] || 0);

      const cost = this.getUpgradeCost(buildingType, currentLevel);
      const refund = {
        metal: Math.floor((cost?.metal || 0) * 0.5),
        crystal: Math.floor((cost?.crystal || 0) * 0.5),
        deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
      };

      await this.resourcesService.addResources(userId, refund);
      user.constructionProgress = null;
      await user.save();

      return { message: '건설이 취소되었습니다.', refund };
    } else {
      // 식민지 건설 취소
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet || !planet.constructionProgress) {
        throw new BadRequestException('진행 중인 건설이 없습니다.');
      }

      const buildingType = planet.constructionProgress.name;
      const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
      const currentLevel = isMine 
        ? ((planet.mines as any)?.[buildingType] || 0)
        : ((planet.facilities as any)?.[buildingType] || 0);

      const cost = this.getUpgradeCost(buildingType, currentLevel);
      const refund = {
        metal: Math.floor((cost?.metal || 0) * 0.5),
        crystal: Math.floor((cost?.crystal || 0) * 0.5),
        deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
      };

      await this.resourcesService.addResources(userId, refund);
      planet.constructionProgress = null;
      await planet.save();

      return { message: '건설이 취소되었습니다.', refund };
    }
  }
}
