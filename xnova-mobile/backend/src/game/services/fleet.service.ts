import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
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
    private resourcesService: ResourcesService,
  ) {}

  // 요구사항 확인
  checkRequirements(user: UserDocument, fleetType: string): { met: boolean; missing: string[] } {
    const fleetData = FLEET_DATA[fleetType];
    if (!fleetData || !fleetData.requirements) {
      return { met: true, missing: [] };
    }

    const missing: string[] = [];

    for (const req in fleetData.requirements) {
      const requiredLevel = fleetData.requirements[req];
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

  // 함대 건조 시간 계산
  getBuildTime(fleetType: string, quantity: number, shipyardLevel: number, nanoFactoryLevel: number): number {
    const fleetData = FLEET_DATA[fleetType];
    if (!fleetData) return 0;

    const totalCost = (fleetData.cost.metal || 0) + (fleetData.cost.crystal || 0);
    const nanoBonus = Math.pow(2, nanoFactoryLevel);

    // 1대당 건조 시간 (초) - 10배 상향
    const singleShipTime = (totalCost / (25 * (1 + shipyardLevel) * nanoBonus)) * 10;
    
    return singleShipTime * quantity;
  }

  // 함대 현황 조회
  async getFleet(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const fleetInfo: FleetInfo[] = [];
    const shipyardLevel = user.facilities.shipyard || 0;
    const nanoFactoryLevel = user.facilities.nanoFactory || 0;

    for (const key in FLEET_DATA) {
      const count = (user.fleet as any)[key] || 0;
      const fleetData = FLEET_DATA[key];
      const requirements = this.checkRequirements(user, key);
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
      fleetProgress: user.fleetProgress,
      shipyardLevel,
    };
  }

  // 함대 건조 시작
  async startBuild(userId: string, fleetType: string, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('수량은 1 이상이어야 합니다.');
    }

    const user = await this.resourcesService.updateResources(userId);
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 건조 진행 중인지 확인
    if (user.fleetProgress) {
      const remainingTime = Math.max(0, (user.fleetProgress.finishTime.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`이미 ${NAME_MAPPING[user.fleetProgress.name] || user.fleetProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
    }

    // 함대 존재 여부 확인
    const fleetData = FLEET_DATA[fleetType];
    if (!fleetData) {
      throw new BadRequestException('알 수 없는 함대입니다.');
    }

    // 요구사항 확인
    const requirements = this.checkRequirements(user, fleetType);
    if (!requirements.met) {
      throw new BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
    }

    // 총 비용 계산
    const totalCost = {
      metal: (fleetData.cost.metal || 0) * quantity,
      crystal: (fleetData.cost.crystal || 0) * quantity,
      deuterium: (fleetData.cost.deuterium || 0) * quantity,
    };

    // 자원 차감
    const hasResources = await this.resourcesService.deductResources(userId, totalCost);
    if (!hasResources) {
      throw new BadRequestException('자원이 부족합니다.');
    }

    // 건조 시간 계산
    const shipyardLevel = user.facilities.shipyard || 0;
    const nanoFactoryLevel = user.facilities.nanoFactory || 0;
    const buildTime = this.getBuildTime(fleetType, quantity, shipyardLevel, nanoFactoryLevel);

    // 건조 진행 정보 저장
    const startTime = new Date();
    const finishTime = new Date(startTime.getTime() + buildTime * 1000);

    user.fleetProgress = {
      type: 'fleet',
      name: fleetType,
      quantity,
      startTime,
      finishTime,
    };

    await user.save();

    return {
      message: `${NAME_MAPPING[fleetType]} ${quantity}대 건조가 시작되었습니다.`,
      fleet: fleetType,
      quantity,
      totalCost,
      buildTime,
      finishTime,
    };
  }

  // 함대 건조 완료 처리
  async completeBuild(userId: string): Promise<{ completed: boolean; fleet?: string; quantity?: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.fleetProgress) {
      return { completed: false };
    }

    // 완료 시간 확인
    if (user.fleetProgress.finishTime.getTime() > Date.now()) {
      return { completed: false };
    }

    const fleetType = user.fleetProgress.name;
    const quantity = user.fleetProgress.quantity || 1;

    // 함대 추가
    (user.fleet as any)[fleetType] = ((user.fleet as any)[fleetType] || 0) + quantity;

    // 건조 진행 정보 삭제
    user.fleetProgress = null;

    await user.save();

    return {
      completed: true,
      fleet: fleetType,
      quantity,
    };
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

        // 소비량 조정 (게임 밸런스)
        consumption = consumption / 500;
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
