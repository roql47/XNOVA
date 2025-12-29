import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
import { BUILDING_COSTS, NAME_MAPPING } from '../constants/game-data';

export interface BuildingInfo {
  type: string;
  name: string;
  level: number;
  category: string;
  upgradeCost: { metal: number; crystal: number; deuterium?: number } | null;
  upgradeTime: number;
}

@Injectable()
export class BuildingsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private resourcesService: ResourcesService,
  ) {}

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

    // 건설 시간 (초)
    return (totalCost / (25 * facilityBonus * nanoBonus)) * 4;
  }

  // 건물 현황 조회
  async getBuildings(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const mines = user.mines;
    const facilities = user.facilities;

    // 각 건물의 업그레이드 비용 및 시간 계산
    const buildingsInfo: BuildingInfo[] = [];

    // 광산
    const mineTypes = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'];
    for (const key of mineTypes) {
      const level = (mines as any)[key] || 0;
      const cost = this.getUpgradeCost(key, level);
      const time = this.getConstructionTime(key, level, facilities.robotFactory || 0, facilities.nanoFactory || 0);
      
      buildingsInfo.push({
        type: key,
        name: NAME_MAPPING[key],
        level,
        category: 'mines',
        upgradeCost: cost,
        upgradeTime: time,
      });
    }

    // 시설
    const facilityTypes = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'];
    for (const key of facilityTypes) {
      const level = (facilities as any)[key] || 0;
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
      constructionProgress: user.constructionProgress,
    };
  }

  // 건물 업그레이드 시작
  async startUpgrade(userId: string, buildingType: string) {
    const user = await this.resourcesService.updateResources(userId);
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 건설 진행 중인지 확인
    if (user.constructionProgress) {
      const remainingTime = Math.max(0, (user.constructionProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[user.constructionProgress.name] || user.constructionProgress.name} 건설이 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    // 건물 타입 확인
    const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
    const isFacility = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'].includes(buildingType);

    if (!isMine && !isFacility) {
      throw new BadRequestException('알 수 없는 건물 유형입니다.');
    }

    // 현재 레벨 확인
    const currentLevel = isMine 
      ? ((user.mines as any)[buildingType] || 0)
      : ((user.facilities as any)[buildingType] || 0);

    // 비용 계산
    const cost = this.getUpgradeCost(buildingType, currentLevel);
    if (!cost) {
      throw new BadRequestException('건물 비용을 계산할 수 없습니다.');
    }

    // 자원 확인 및 차감
    const hasResources = await this.resourcesService.deductResources(userId, cost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    // 건설 시간 계산
    const constructionTime = this.getConstructionTime(
      buildingType,
      currentLevel,
      user.facilities.robotFactory || 0,
      user.facilities.nanoFactory || 0,
    );

    // 건설 진행 정보 저장
    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + constructionTime * 1000);

    user.constructionProgress = {
      type: isMine ? 'mine' : 'facility',
      name: buildingType,
      startTime,
      finishTime,
    };

    await user.save();

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

  // 건설 완료 처리
  async completeConstruction(userId: string): Promise<{ completed: boolean; building?: string; newLevel?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.constructionProgress) {
      return { completed: false };
    }

    // 완료 시간 확인
    if (user.constructionProgress.finishTime.getTime() > Date.now()) {
      return { completed: false };
    }

    const buildingType = user.constructionProgress.name;
    const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);

    // 레벨 업
    if (isMine) {
      (user.mines as any)[buildingType] = ((user.mines as any)[buildingType] || 0) + 1;
    } else {
      (user.facilities as any)[buildingType] = ((user.facilities as any)[buildingType] || 0) + 1;
    }

    const newLevel = isMine ? (user.mines as any)[buildingType] : (user.facilities as any)[buildingType];

    // 건설 진행 정보 삭제
    user.constructionProgress = null;

    await user.save();

    return {
      completed: true,
      building: buildingType,
      newLevel,
    };
  }

  // 건설 취소
  async cancelConstruction(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.constructionProgress) {
      throw new BadRequestException('진행 중인 건설이 없습니다.');
    }

    const buildingType = user.constructionProgress.name;
    const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
    const currentLevel = isMine 
      ? ((user.mines as any)[buildingType] || 0)
      : ((user.facilities as any)[buildingType] || 0);

    // 자원 환불 (50%)
    const cost = this.getUpgradeCost(buildingType, currentLevel);
    const refund = {
      metal: Math.floor((cost?.metal || 0) * 0.5),
      crystal: Math.floor((cost?.crystal || 0) * 0.5),
      deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
    };

    await this.resourcesService.addResources(userId, refund);

    // 건설 진행 정보 삭제
    user.constructionProgress = null;
    await user.save();

    return {
      message: '건설이 취소되었습니다.',
      refund,
    };
  }
}
