import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';
import { ResourcesService } from './resources.service';
import { FLEET_DATA, NAME_MAPPING } from '../constants/game-data';

export interface FleetInfo {
  type: string;
  name: string;
  count: number;
  cost: { metal: number; crystal: number; deuterium: number };
  stats: any;
  buildTime: number;
  requirementsMet: boolean;
  missingRequirements: string[];
}

@Injectable()
export class FleetService {
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

  // 요구사항 확인 (시설은 행성별, 연구는 유저 전역)
  checkRequirements(facilities: any, researchLevels: any, fleetType: string): { met: boolean; missing: string[] } {
    const fleetData = FLEET_DATA[fleetType];
    if (!fleetData || !fleetData.requirements) {
      return { met: true, missing: [] };
    }

    const missing: string[] = [];

    for (const req in fleetData.requirements) {
      const requiredLevel = fleetData.requirements[req];
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

  // 함대 1대당 건조 시간 계산
  getSingleBuildTime(fleetType: string, shipyardLevel: number, nanoFactoryLevel: number): number {
    const fleetData = FLEET_DATA[fleetType];
    if (!fleetData) return 0;

    const totalCost = (fleetData.cost.metal || 0) + (fleetData.cost.crystal || 0);
    const nanoBonus = Math.pow(2, nanoFactoryLevel);

    // 1대당 건조 시간 (초) - 10배 속도
    return (totalCost / (25 * (1 + shipyardLevel) * nanoBonus)) / 10;
  }

  // 함대 건조 시간 계산 (하위 호환성 유지)
  getBuildTime(fleetType: string, quantity: number, shipyardLevel: number, nanoFactoryLevel: number): number {
    return this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel) * quantity;
  }

  // 함대 현황 조회 (활성 행성 기준)
  async getFleet(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const isHome = this.isHomePlanet(user.activePlanetId, userId);
    let fleet: any;
    let facilities: any;
    let fleetProgress: any;

    if (isHome) {
      fleet = user.fleet || {};
      facilities = user.facilities || {};
      fleetProgress = user.fleetProgress;
    } else {
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet) {
        // 폴백
        fleet = user.fleet || {};
        facilities = user.facilities || {};
        fleetProgress = user.fleetProgress;
      } else {
        fleet = planet.fleet || {};
        facilities = planet.facilities || {};
        fleetProgress = planet.fleetProgress;
      }
    }

    const fleetInfo: FleetInfo[] = [];
    const shipyardLevel = facilities.shipyard || 0;
    const nanoFactoryLevel = facilities.nanoFactory || 0;

    for (const key in FLEET_DATA) {
      const count = fleet[key] || 0;
      const fleetData = FLEET_DATA[key];
      const requirements = this.checkRequirements(facilities, user.researchLevels, key);
      const buildTime = this.getBuildTime(key, 1, shipyardLevel, nanoFactoryLevel);

      fleetInfo.push({
        type: key,
        name: NAME_MAPPING[key],
        count,
        cost: fleetData.cost,
        stats: fleetData.stats,
        buildTime,
        requirementsMet: requirements.met,
        missingRequirements: requirements.missing,
      });
    }

    return {
      fleet: fleetInfo,
      fleetProgress,
      shipyardLevel,
      isHomePlanet: isHome,
    };
  }

  // 함대 건조 시작 (활성 행성 기준)
  async startBuild(userId: string, fleetType: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      throw new BadRequestException('수량은 1 ~ 100,000 사이의 정수여야 합니다.');
    }

    const result = await this.resourcesService.updateResourcesWithPlanet(userId);
    if (!result) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const { user, planet } = result;
    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    let facilities: any;
    let fleetProgress: any;

    if (isHome) {
      facilities = user.facilities || {};
      fleetProgress = user.fleetProgress;
    } else if (planet) {
      facilities = planet.facilities || {};
      fleetProgress = planet.fleetProgress;
    } else {
      throw new BadRequestException('행성을 찾을 수 없습니다.');
    }

    // 이미 건조 진행 중인지 확인
    if (fleetProgress) {
      const remainingTime = Math.max(0, (fleetProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[fleetProgress.name] || fleetProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    const fleetData = FLEET_DATA[fleetType];
    if (!fleetData) {
      throw new BadRequestException('알 수 없는 함대입니다.');
    }

    // 요구사항 확인 (시설: 행성별, 연구: 유저 전역)
    const requirements = this.checkRequirements(facilities, user.researchLevels, fleetType);
    if (!requirements.met) {
      throw new BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
    }

    const totalCost = {
      metal: (fleetData.cost.metal || 0) * quantity,
      crystal: (fleetData.cost.crystal || 0) * quantity,
      deuterium: (fleetData.cost.deuterium || 0) * quantity,
    };

    const hasResources = await this.resourcesService.deductResources(userId, totalCost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    const shipyardLevel = facilities.shipyard || 0;
    const nanoFactoryLevel = facilities.nanoFactory || 0;
    const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);

    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + singleBuildTime * 1000);

    const progress = {
      type: 'fleet',
      name: fleetType,
      quantity,
      startTime,
      finishTime,
    };

    if (isHome) {
      user.fleetProgress = progress;
      await user.save();
    } else if (planet) {
      planet.fleetProgress = progress;
      await planet.save();
    }

    return {
      message: `${NAME_MAPPING[fleetType]} ${quantity}대 건조가 시작되었습니다.`,
      fleet: fleetType,
      quantity,
      totalCost,
      buildTime: singleBuildTime,
      totalBuildTime: singleBuildTime * quantity,
      finishTime,
    };
  }

  // 함대 건조 완료 처리 (활성 행성 기준, 1대씩 완료되는 큐 시스템)
  async completeBuild(userId: string): Promise<{ completed: boolean; fleet?: string; quantity?: number; remaining?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return { completed: false };

    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    if (isHome) {
      // 모행성 함대 건조 완료
      if (!user.fleetProgress) return { completed: false };
      if (user.fleetProgress.finishTime.getTime() > Date.now()) return { completed: false };

      const fleetType = user.fleetProgress.name;
      const remainingQuantity = user.fleetProgress.quantity || 1;

      (user.fleet as any)[fleetType] = ((user.fleet as any)[fleetType] || 0) + 1;
      user.markModified('fleet');

      const newRemaining = remainingQuantity - 1;

      if (newRemaining > 0) {
        const shipyardLevel = user.facilities?.shipyard || 0;
        const nanoFactoryLevel = user.facilities?.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);

        user.fleetProgress = {
          type: 'fleet',
          name: fleetType,
          quantity: newRemaining,
          startTime: new Date(),
          finishTime: new Date(Date.now() + singleBuildTime * 1000),
        };
      } else {
        user.fleetProgress = null;
      }

      user.markModified('fleetProgress');
      await user.save();

      return { completed: true, fleet: fleetType, quantity: 1, remaining: newRemaining };
    } else {
      // 식민지 함대 건조 완료
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet || !planet.fleetProgress) return { completed: false };
      if (planet.fleetProgress.finishTime.getTime() > Date.now()) return { completed: false };

      const fleetType = planet.fleetProgress.name;
      const remainingQuantity = planet.fleetProgress.quantity || 1;

      if (!planet.fleet) planet.fleet = {} as any;
      (planet.fleet as any)[fleetType] = ((planet.fleet as any)[fleetType] || 0) + 1;
      planet.markModified('fleet');

      const newRemaining = remainingQuantity - 1;

      if (newRemaining > 0) {
        const shipyardLevel = planet.facilities?.shipyard || 0;
        const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);

        planet.fleetProgress = {
          type: 'fleet',
          name: fleetType,
          quantity: newRemaining,
          startTime: new Date(),
          finishTime: new Date(Date.now() + singleBuildTime * 1000),
        };
      } else {
        planet.fleetProgress = null;
      }

      planet.markModified('fleetProgress');
      await planet.save();

      return { completed: true, fleet: fleetType, quantity: 1, remaining: newRemaining };
    }
  }

  // 함대의 총 선적량 계산 - XNOVA.js calculateTotalCapacity 마이그레이션
  calculateTotalCapacity(fleet: Record<string, number>): number {
    let totalCapacity = 0;

    for (const type in fleet) {
      if (fleet[type] > 0 && FLEET_DATA[type]) {
        const cargoCapacity = FLEET_DATA[type].stats.cargo || 0;
        totalCapacity += fleet[type] * cargoCapacity;
      }
    }

    return totalCapacity;
  }

  // 함대 연료 소비량 계산 - XNOVA.js calculateFuelConsumption 마이그레이션
  calculateFuelConsumption(fleet: Record<string, number>, distance: number, duration: number): number {
    let totalConsumption = 0;

    for (const type in fleet) {
      if (fleet[type] > 0 && FLEET_DATA[type]) {
        const basicConsumption = FLEET_DATA[type].stats.fuelConsumption || 0;
        const shipSpeed = FLEET_DATA[type].stats.speed || 0;

        // 임시속도 계산
        let tmpSpeed = 0;
        if (duration > 0 && shipSpeed > 0) {
          const sqrtTerm = Math.sqrt((distance * 10) / shipSpeed);
          const denominator = duration - 10;
          if (denominator > 0) {
            tmpSpeed = (35000 / denominator) * sqrtTerm;
          }
        }

        // 실제 소비량 공식
        const speedFactor = Math.pow((tmpSpeed / 10 + 1), 2);
        let consumption = (basicConsumption * fleet[type] * distance) / 35000 * speedFactor;

        // 소비량 조정 (게임 밸런스) - 10배 증가
        consumption = consumption / 50;
        consumption = Math.max(1, Math.round(consumption));

        totalConsumption += consumption;
      }
    }

    return totalConsumption;
  }

  // 함대 속도 계산 (가장 느린 함선 기준)
  getFleetSpeed(fleet: Record<string, number>): number {
    let minSpeed = Infinity;

    for (const type in fleet) {
      if (fleet[type] > 0 && FLEET_DATA[type]) {
        const shipSpeed = FLEET_DATA[type].stats.speed || 10000;
        minSpeed = Math.min(minSpeed, shipSpeed);
      }
    }

    return minSpeed === Infinity ? 10000 : minSpeed;
  }
}
