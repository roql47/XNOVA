import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';
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
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
    private resourcesService: ResourcesService,
  ) {}

  // 활성 행성이 모행성인지 확인
  isHomePlanet(activePlanetId: string | null, userId: string): boolean {
    if (!activePlanetId) return true;
    return activePlanetId.startsWith('home_') || activePlanetId === `home_${userId}`;
  }

  // 요구사항 확인 (시설: 행성별, 연구: 유저 전역)
  checkRequirements(facilities: any, researchLevels: any, defenseType: string): { met: boolean; missing: string[] } {
    const defenseData = DEFENSE_DATA[defenseType];
    if (!defenseData || !defenseData.requirements) {
      return { met: true, missing: [] };
    }

    const missing: string[] = [];

    for (const req in defenseData.requirements) {
      const requiredLevel = defenseData.requirements[req];
      let currentLevel = 0;

      // 시설 요구사항 확인 (행성별)
      if (facilities && facilities[req] !== undefined) {
        currentLevel = facilities[req];
      }
      // 연구 요구사항 확인 (유저 전역)
      else if (researchLevels && researchLevels[req] !== undefined) {
        currentLevel = researchLevels[req];
      }

      if (currentLevel < requiredLevel) {
        missing.push(`${NAME_MAPPING[req] || req} Lv.${requiredLevel}`);
      }
    }

    return { met: missing.length === 0, missing };
  }

  // 방어시설 1대당 건조 시간 계산
  getSingleBuildTime(defenseType: string, robotFactoryLevel: number, nanoFactoryLevel: number): number {
    const defenseData = DEFENSE_DATA[defenseType];
    if (!defenseData) return 0;

    const totalCost = (defenseData.cost.metal || 0) + (defenseData.cost.crystal || 0);
    const nanoBonus = Math.pow(2, nanoFactoryLevel);

    // 1대당 건조 시간 (초) - 10배 속도
    return (totalCost / (25 * (1 + robotFactoryLevel) * nanoBonus)) / 10;
  }

  // 방어시설 건조 시간 계산 (하위 호환성 유지)
  getBuildTime(defenseType: string, quantity: number, robotFactoryLevel: number, nanoFactoryLevel: number): number {
    return this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel) * quantity;
  }

  // 방어시설 현황 조회 (활성 행성 기준)
  async getDefense(userId: string) {
    let user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const isHome = this.isHomePlanet(user.activePlanetId, userId);
    let defense: any;
    let facilities: any;
    let defenseProgress: any;

    if (isHome) {
      // 모행성: 건조 완료 자동 처리
      if (user.defenseProgress && new Date(user.defenseProgress.finishTime).getTime() <= Date.now()) {
        let result = await this.completeBuild(userId);
        while (result.completed) {
          user = await this.userModel.findById(userId).exec();
          if (!user?.defenseProgress) break;
          if (new Date(user.defenseProgress.finishTime).getTime() > Date.now()) break;
          result = await this.completeBuild(userId);
        }
        user = await this.userModel.findById(userId).exec();
        if (!user) return null;
      }
      defense = user.defense || {};
      facilities = user.facilities || {};
      defenseProgress = user.defenseProgress;
    } else {
      let planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet) {
        defense = user.defense || {};
        facilities = user.facilities || {};
        defenseProgress = user.defenseProgress;
      } else {
        // 식민지: 건조 완료 자동 처리
        if (planet.defenseProgress && new Date(planet.defenseProgress.finishTime).getTime() <= Date.now()) {
          await this.completePlanetDefenseBuildInternal(planet);
          planet = await this.planetModel.findById(user.activePlanetId).exec();
          if (!planet) return null;
        }
        defense = planet.defense || {};
        facilities = planet.facilities || {};
        defenseProgress = planet.defenseProgress;
      }
    }

    const defenseInfo: DefenseInfo[] = [];
    const robotFactoryLevel = facilities.robotFactory || 0;
    const nanoFactoryLevel = facilities.nanoFactory || 0;

    for (const key in DEFENSE_DATA) {
      const count = defense[key] || 0;
      const defenseData = DEFENSE_DATA[key];
      const requirements = this.checkRequirements(facilities, user.researchLevels, key);
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
      defenseProgress,
      robotFactoryLevel,
      isHomePlanet: isHome,
    };
  }

  // 방어시설 건조 시작 (활성 행성 기준)
  async startBuild(userId: string, defenseType: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      throw new BadRequestException('수량은 1 ~ 100,000 사이의 정수여야 합니다.');
    }

    const result = await this.resourcesService.updateResourcesWithPlanet(userId);
    if (!result) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const { user, planet } = result;
    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    let defense: any;
    let facilities: any;
    let defenseProgress: any;

    if (isHome) {
      defense = user.defense || {};
      facilities = user.facilities || {};
      defenseProgress = user.defenseProgress;
    } else if (planet) {
      defense = planet.defense || {};
      facilities = planet.facilities || {};
      defenseProgress = planet.defenseProgress;
    } else {
      throw new BadRequestException('행성을 찾을 수 없습니다.');
    }

    // 이미 건조 진행 중인지 확인
    if (defenseProgress) {
      const remainingTime = Math.max(0, (defenseProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[defenseProgress.name] || defenseProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    const defenseData = DEFENSE_DATA[defenseType];
    if (!defenseData) {
      throw new BadRequestException('알 수 없는 방어시설입니다.');
    }

    // 최대 개수 확인 (보호막 돔 등)
    const maxCount = (defenseData as any).maxCount;
    if (maxCount) {
      const currentCount = defense[defenseType] || 0;
      if (currentCount + quantity > maxCount) {
        throw new BadRequestException(`${NAME_MAPPING[defenseType]}은(는) 최대 ${maxCount}개까지 건조할 수 있습니다. 현재 ${currentCount}개 보유 중.`);
      }
    }

    // 요구사항 확인 (시설: 행성별, 연구: 유저 전역)
    const requirements = this.checkRequirements(facilities, user.researchLevels, defenseType);
    if (!requirements.met) {
      throw new BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
    }

    const totalCost = {
      metal: (defenseData.cost.metal || 0) * quantity,
      crystal: (defenseData.cost.crystal || 0) * quantity,
      deuterium: (defenseData.cost.deuterium || 0) * quantity,
    };

    const hasResources = await this.resourcesService.deductResources(userId, totalCost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    const robotFactoryLevel = facilities.robotFactory || 0;
    const nanoFactoryLevel = facilities.nanoFactory || 0;
    const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);

    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + singleBuildTime * 1000);

    const progress = {
      type: 'defense',
      name: defenseType,
      quantity,
      startTime,
      finishTime,
    };

    if (isHome) {
      user.defenseProgress = progress;
      await user.save();
    } else if (planet) {
      planet.defenseProgress = progress;
      await planet.save();
    }

    return {
      message: `${NAME_MAPPING[defenseType]} ${quantity}대 건조가 시작되었습니다.`,
      defense: defenseType,
      quantity,
      totalCost,
      buildTime: singleBuildTime,
      totalBuildTime: singleBuildTime * quantity,
      finishTime,
    };
  }

  // 방어시설 건조 완료 처리 (활성 행성 기준, 1대씩 완료되는 큐 시스템)
  async completeBuild(userId: string): Promise<{ completed: boolean; defense?: string; quantity?: number; remaining?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return { completed: false };

    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    if (isHome) {
      // 모행성 방어시설 건조 완료
      if (!user.defenseProgress) return { completed: false };
      if (user.defenseProgress.finishTime.getTime() > Date.now()) return { completed: false };

      const defenseType = user.defenseProgress.name;
      const remainingQuantity = user.defenseProgress.quantity || 1;

      (user.defense as any)[defenseType] = ((user.defense as any)[defenseType] || 0) + 1;
      user.markModified('defense');

      const newRemaining = remainingQuantity - 1;

      if (newRemaining > 0) {
        const robotFactoryLevel = user.facilities?.robotFactory || 0;
        const nanoFactoryLevel = user.facilities?.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);

        // 이전 finishTime 기준으로 다음 건조 시간 계산 (백그라운드 복귀 시 연속 완료 지원)
        const prevFinishTime = user.defenseProgress.finishTime.getTime();
        const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);

        user.defenseProgress = {
          type: 'defense',
          name: defenseType,
          quantity: newRemaining,
          startTime: new Date(prevFinishTime),
          finishTime: nextFinishTime,
        };
      } else {
        user.defenseProgress = null;
      }

      user.markModified('defenseProgress');
      await user.save();

      return { completed: true, defense: defenseType, quantity: 1, remaining: newRemaining };
    } else {
      // 식민지 방어시설 건조 완료
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet || !planet.defenseProgress) return { completed: false };
      if (planet.defenseProgress.finishTime.getTime() > Date.now()) return { completed: false };

      const defenseType = planet.defenseProgress.name;
      const remainingQuantity = planet.defenseProgress.quantity || 1;

      if (!planet.defense) planet.defense = {} as any;
      (planet.defense as any)[defenseType] = ((planet.defense as any)[defenseType] || 0) + 1;
      planet.markModified('defense');

      const newRemaining = remainingQuantity - 1;

      if (newRemaining > 0) {
        const robotFactoryLevel = planet.facilities?.robotFactory || 0;
        const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);

        // 이전 finishTime 기준으로 다음 건조 시간 계산 (백그라운드 복귀 시 연속 완료 지원)
        const prevFinishTime = planet.defenseProgress.finishTime.getTime();
        const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);

        planet.defenseProgress = {
          type: 'defense',
          name: defenseType,
          quantity: newRemaining,
          startTime: new Date(prevFinishTime),
          finishTime: nextFinishTime,
        };
      } else {
        planet.defenseProgress = null;
      }

      planet.markModified('defenseProgress');
      await planet.save();

      return { completed: true, defense: defenseType, quantity: 1, remaining: newRemaining };
    }
  }

  /**
   * 식민지 방어시설 건조 완료 내부 처리 (getDefense에서 사용)
   */
  private async completePlanetDefenseBuildInternal(planet: PlanetDocument): Promise<void> {
    const now = Date.now();
    
    while (planet.defenseProgress && new Date(planet.defenseProgress.finishTime).getTime() <= now) {
      const defenseType = planet.defenseProgress.name;
      const remainingQuantity = (planet.defenseProgress as any).quantity || 1;

      // 방어시설 추가
      if (!planet.defense) planet.defense = {} as any;
      (planet.defense as any)[defenseType] = ((planet.defense as any)[defenseType] || 0) + 1;
      planet.markModified('defense');

      const newRemaining = remainingQuantity - 1;

      if (newRemaining > 0) {
        // 다음 건조 설정 - 이전 finishTime 기준으로 계산
        const robotFactoryLevel = planet.facilities?.robotFactory || 0;
        const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);

        const prevFinishTime = new Date(planet.defenseProgress.finishTime).getTime();
        const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);

        planet.defenseProgress = {
          type: 'defense',
          name: defenseType,
          quantity: newRemaining,
          startTime: new Date(prevFinishTime),
          finishTime: nextFinishTime,
        };

        // 다음 건조가 아직 완료 시간이 안 됐으면 종료
        if (new Date(planet.defenseProgress.finishTime).getTime() > now) {
          break;
        }
      } else {
        planet.defenseProgress = null;
        break;
      }
    }

    planet.markModified('defenseProgress');
    await planet.save();
  }
}
