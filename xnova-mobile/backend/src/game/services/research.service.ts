import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
import { RESEARCH_DATA, NAME_MAPPING } from '../constants/game-data';

export interface ResearchInfo {
  type: string;
  name: string;
  level: number;
  cost: { metal: number; crystal: number; deuterium: number } | null;
  researchTime: number;
  requirementsMet: boolean;
  missingRequirements: string[];
}

@Injectable()
export class ResearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private resourcesService: ResourcesService,
  ) {}

  // 연구 비용 계산
  getResearchCost(researchType: string, currentLevel: number): { metal: number; crystal: number; deuterium: number } | null {
    const researchData = RESEARCH_DATA[researchType];
    if (!researchData) return null;

    return {
      metal: Math.floor((researchData.cost.metal || 0) * Math.pow(2, currentLevel)),
      crystal: Math.floor((researchData.cost.crystal || 0) * Math.pow(2, currentLevel)),
      deuterium: Math.floor((researchData.cost.deuterium || 0) * Math.pow(2, currentLevel)),
    };
  }

  // 연구 시간 계산 - XNOVA.js getResearchTime 마이그레이션
  getResearchTime(metal: number, crystal: number, labLevel: number): number {
    // 연구 시간(초) = (메탈 + 크리스탈) / (20000 × (1 + 연구소 레벨)) - 10배 속도
    const hours = (metal + crystal) / (20000 * (1 + labLevel));
    return hours * 3600 / 10; // 초 단위로 반환 (10배 속도)
  }

  // 연구 요구사항 확인
  checkRequirements(user: UserDocument, researchType: string): { met: boolean; missing: string[] } {
    const researchData = RESEARCH_DATA[researchType];
    if (!researchData || !researchData.requirements) {
      return { met: true, missing: [] };
    }

    const missing: string[] = [];

    for (const req in researchData.requirements) {
      const requiredLevel = researchData.requirements[req];
      let currentLevel = 0;

      // 시설 요구사항 확인
      if ((user.facilities as any)[req] !== undefined) {
        currentLevel = (user.facilities as any)[req];
      }
      // 연구 요구사항 확인
      else if ((user.researchLevels as any)[req] !== undefined) {
        currentLevel = (user.researchLevels as any)[req];
      }

      if (currentLevel < requiredLevel) {
        missing.push(`${NAME_MAPPING[req] || req} Lv.${requiredLevel}`);
      }
    }

    return { met: missing.length === 0, missing };
  }

  // 연구 현황 조회
  async getResearch(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const researchInfo: ResearchInfo[] = [];
    const labLevel = user.facilities.researchLab || 0;

    for (const key in RESEARCH_DATA) {
      const level = (user.researchLevels as any)[key] || 0;
      const cost = this.getResearchCost(key, level);
      const time = cost ? this.getResearchTime(cost.metal, cost.crystal, labLevel) : 0;
      const requirements = this.checkRequirements(user, key);

      researchInfo.push({
        type: key,
        name: NAME_MAPPING[key],
        level,
        cost,
        researchTime: time,
        requirementsMet: requirements.met,
        missingRequirements: requirements.missing,
      });
    }

    return {
      research: researchInfo,
      researchProgress: user.researchProgress,
      labLevel,
    };
  }

  // 연구 시작
  async startResearch(userId: string, researchType: string) {
    const user = await this.resourcesService.updateResources(userId);
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 연구 진행 중인지 확인
    if (user.researchProgress) {
      const remainingTime = Math.max(0, (user.researchProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[user.researchProgress.name] || user.researchProgress.name} 연구가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    // 연구 존재 여부 확인
    if (!RESEARCH_DATA[researchType]) {
      throw new BadRequestException('알 수 없는 연구입니다.');
    }

    // 요구사항 확인
    const requirements = this.checkRequirements(user, researchType);
    if (!requirements.met) {
      throw new BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
    }

    // 현재 레벨 및 비용 계산
    const currentLevel = (user.researchLevels as any)[researchType] || 0;
    const cost = this.getResearchCost(researchType, currentLevel);
    if (!cost) {
      throw new BadRequestException('연구 비용을 계산할 수 없습니다.');
    }

    const labLevel = user.facilities.researchLab || 0;
    const researchTime = this.getResearchTime(cost.metal, cost.crystal, labLevel);

    // 자원 차감
    const hasResources = await this.resourcesService.deductResources(userId, cost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    // 연구 진행 정보 저장
    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + researchTime * 1000);

    user.researchProgress = {
      type: 'research',
      name: researchType,
      startTime,
      finishTime,
    };

    await user.save();

    return {
      message: `${NAME_MAPPING[researchType]} 연구가 시작되었습니다.`,
      research: researchType,
      currentLevel,
      targetLevel: currentLevel + 1,
      cost,
      researchTime,
      finishTime,
    };
  }

  // 연구 완료 처리
  async completeResearch(userId: string): Promise<{ completed: boolean; research?: string; newLevel?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.researchProgress) {
      return { completed: false };
    }

    // 완료 시간 확인
    if (user.researchProgress.finishTime.getTime() > Date.now()) {
      return { completed: false };
    }

    const researchType = user.researchProgress.name;

    // 레벨 업
    (user.researchLevels as any)[researchType] = ((user.researchLevels as any)[researchType] || 0) + 1;
    const newLevel = (user.researchLevels as any)[researchType];

    // 연구 진행 정보 삭제
    user.researchProgress = null;

    await user.save();

    return {
      completed: true,
      research: researchType,
      newLevel,
    };
  }

  // 연구 취소
  async cancelResearch(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.researchProgress) {
      throw new BadRequestException('진행 중인 연구가 없습니다.');
    }

    const researchType = user.researchProgress.name;
    const currentLevel = (user.researchLevels as any)[researchType] || 0;

    // 자원 환불 (50%)
    const cost = this.getResearchCost(researchType, currentLevel);
    const refund = {
      metal: Math.floor((cost?.metal || 0) * 0.5),
      crystal: Math.floor((cost?.crystal || 0) * 0.5),
      deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
    };

    await this.resourcesService.addResources(userId, refund);

    // 연구 진행 정보 삭제
    user.researchProgress = null;
    await user.save();

    return {
      message: '연구가 취소되었습니다.',
      refund,
    };
  }
}
