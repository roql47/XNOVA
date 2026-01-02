import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
import { DEFENSE_DATA, NAME_MAPPING } from '../constants/game-data';

export interface DefenseInfo {
  type: string;
  name: string;
  count: number;
  cost: { metal: number; crystal: number; deuterium: number };
  stats: any;
  buildTime: number;
  maxCount: number | null;
  requirementsMet: boolean;
  missingRequirements: string[];
}

@Injectable()
export class DefenseService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private resourcesService: ResourcesService,
  ) {}

  // 요구사항 확인
  checkRequirements(user: UserDocument, defenseType: string): { met: boolean; missing: string[] } {
    const defenseData = DEFENSE_DATA[defenseType];
    if (!defenseData || !defenseData.requirements) {
      return { met: true, missing: [] };
    }

    const missing: string[] = [];

    for (const req in defenseData.requirements) {
      const requiredLevel = defenseData.requirements[req];
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

  // 방어시설 건조 시간 계산
  getBuildTime(defenseType: string, quantity: number, robotFactoryLevel: number, nanoFactoryLevel: number): number {
    const defenseData = DEFENSE_DATA[defenseType];
    if (!defenseData) return 0;

    const totalCost = (defenseData.cost.metal || 0) + (defenseData.cost.crystal || 0);
    const nanoBonus = Math.pow(2, nanoFactoryLevel);

    // 1대당 건조 시간 (초) - 2배 상향
    const singleUnitTime = (totalCost / (25 * (1 + robotFactoryLevel) * nanoBonus)) * 2;
    
    return singleUnitTime * quantity;
  }

  // 방어시설 현황 조회
  async getDefense(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const defenseInfo: DefenseInfo[] = [];
    const robotFactoryLevel = user.facilities.robotFactory || 0;
    const nanoFactoryLevel = user.facilities.nanoFactory || 0;

    for (const key in DEFENSE_DATA) {
      const count = (user.defense as any)[key] || 0;
      const defenseData = DEFENSE_DATA[key];
      const requirements = this.checkRequirements(user, key);
      const buildTime = this.getBuildTime(key, 1, robotFactoryLevel, nanoFactoryLevel);

      defenseInfo.push({
        type: key,
        name: NAME_MAPPING[key],
        count,
        cost: defenseData.cost,
        stats: defenseData.stats,
        buildTime,
        maxCount: (defenseData as any).maxCount || null,
        requirementsMet: requirements.met,
        missingRequirements: requirements.missing,
      });
    }

    return {
      defense: defenseInfo,
      defenseProgress: user.defenseProgress,
      robotFactoryLevel,
    };
  }

  // 방어시설 건조 시작
  async startBuild(userId: string, defenseType: string, quantity: number) {
    // 수량 검증 (정수, 양수, 합리적인 범위)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      throw new BadRequestException('수량은 1 ~ 100,000 사이의 정수여야 합니다.');
    }

    const user = await this.resourcesService.updateResources(userId);
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 건조 진행 중인지 확인
    if (user.defenseProgress) {
      const remainingTime = Math.max(0, (user.defenseProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[user.defenseProgress.name] || user.defenseProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    // 방어시설 존재 여부 확인
    const defenseData = DEFENSE_DATA[defenseType];
    if (!defenseData) {
      throw new BadRequestException('알 수 없는 방어시설입니다.');
    }

    // 최대 개수 확인 (보호막 돔 등)
    const maxCount = (defenseData as any).maxCount;
    if (maxCount) {
      const currentCount = (user.defense as any)[defenseType] || 0;
      if (currentCount + quantity > maxCount) {
        throw new BadRequestException(`${NAME_MAPPING[defenseType]}은(는) 최대 ${maxCount}개까지 건조할 수 있습니다. 현재 ${currentCount}개 보유 중.`);
      }
    }

    // 요구사항 확인
    const requirements = this.checkRequirements(user, defenseType);
    if (!requirements.met) {
      throw new BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
    }

    // 총 비용 계산
    const totalCost = {
      metal: (defenseData.cost.metal || 0) * quantity,
      crystal: (defenseData.cost.crystal || 0) * quantity,
      deuterium: (defenseData.cost.deuterium || 0) * quantity,
    };

    // 자원 차감
    const hasResources = await this.resourcesService.deductResources(userId, totalCost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    // 건조 시간 계산
    const robotFactoryLevel = user.facilities.robotFactory || 0;
    const nanoFactoryLevel = user.facilities.nanoFactory || 0;
    const buildTime = this.getBuildTime(defenseType, quantity, robotFactoryLevel, nanoFactoryLevel);

    // 건조 진행 정보 저장
    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + buildTime * 1000);

    user.defenseProgress = {
      type: 'defense',
      name: defenseType,
      quantity,
      startTime,
      finishTime,
    };

    await user.save();

    return {
      message: `${NAME_MAPPING[defenseType]} ${quantity}대 건조가 시작되었습니다.`,
      defense: defenseType,
      quantity,
      totalCost,
      buildTime,
      finishTime,
    };
  }

  // 방어시설 건조 완료 처리
  async completeBuild(userId: string): Promise<{ completed: boolean; defense?: string; quantity?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.defenseProgress) {
      return { completed: false };
    }

    // 완료 시간 확인
    if (user.defenseProgress.finishTime.getTime() > Date.now()) {
      return { completed: false };
    }

    const defenseType = user.defenseProgress.name;
    const quantity = user.defenseProgress.quantity || 1;

    // 방어시설 추가
    (user.defense as any)[defenseType] = ((user.defense as any)[defenseType] || 0) + quantity;

    // 건조 진행 정보 삭제
    user.defenseProgress = null;

    await user.save();

    return {
      completed: true,
      defense: defenseType,
      quantity,
    };
  }
}
