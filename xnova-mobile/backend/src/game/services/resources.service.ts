import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // 자원 생산량 계산 (시간당) - XNOVA.js getResourceProduction 마이그레이션
  getResourceProduction(level: number, type: 'metal' | 'crystal' | 'deuterium'): number {
    const effectiveLevel = level + 1;
    
    switch (type) {
      case 'metal':
        return Math.floor(90 * effectiveLevel * Math.pow(1.1, effectiveLevel));
      case 'crystal':
        return Math.floor(60 * effectiveLevel * Math.pow(1.1, effectiveLevel));
      case 'deuterium':
        return Math.floor(30 * effectiveLevel * Math.pow(1.1, effectiveLevel));
      default:
        return 0;
    }
  }

  // 에너지 생산량 계산 - XNOVA.js getEnergyProduction 마이그레이션
  getEnergyProduction(solarPlantLevel: number): number {
    if (solarPlantLevel <= 0) return 0;
    return Math.floor(20 * solarPlantLevel * Math.pow(1.1, solarPlantLevel));
  }

  // 핵융합로 에너지 생산량
  getFusionEnergyProduction(fusionLevel: number): number {
    if (fusionLevel <= 0) return 0;
    return Math.floor(30 * fusionLevel * Math.pow(1.05, fusionLevel));
  }

  // 에너지 소비량 계산 - XNOVA.js getEnergyConsumption 마이그레이션
  getEnergyConsumption(level: number, type: 'metal' | 'crystal' | 'deuterium'): number {
    if (level <= 0) return 0;
    
    switch (type) {
      case 'metal':
      case 'crystal':
        return Math.floor(10 * level * Math.pow(1.1, level));
      case 'deuterium':
        return Math.floor(20 * level * Math.pow(1.05, level));
      default:
        return 0;
    }
  }

  // 핵융합로 듀테륨 소비량
  getFusionDeuteriumConsumption(fusionLevel: number): number {
    if (fusionLevel <= 0) return 0;
    return Math.floor(10 * fusionLevel * Math.pow(1.1, fusionLevel));
  }

  // 자원 업데이트 (경과 시간 기반) - XNOVA.js updateResources 마이그레이션
  async updateResources(userId: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const now = new Date();
    const lastUpdate = user.lastResourceUpdate || now;
    const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

    if (elapsedSeconds <= 0) return user;

    const mines = user.mines;
    const fleet = user.fleet;
    
    // 태양광 위성 에너지 계산
    const satelliteCount = fleet.solarSatellite || 0;
    const fusionLevel = mines.fusionReactor || 0;

    // 에너지 생산량 계산
    const solarEnergy = this.getEnergyProduction(mines.solarPlant || 0);
    const satelliteEnergy = satelliteCount * 25;
    const fusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

    // 에너지 소비량 계산
    let energyConsumption = 0;
    energyConsumption += this.getEnergyConsumption(mines.metalMine || 0, 'metal');
    energyConsumption += this.getEnergyConsumption(mines.crystalMine || 0, 'crystal');
    energyConsumption += this.getEnergyConsumption(mines.deuteriumMine || 0, 'deuterium');

    // 에너지 비율 계산
    let energyRatio = 1.0;
    if (energyProduction < energyConsumption) {
      energyRatio = Math.max(0.1, energyProduction / energyConsumption);
    }

    // 핵융합로 듀테륨 소비량
    const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel);

    // 자원 생산량 적용
    const metalProduction = this.getResourceProduction(mines.metalMine || 0, 'metal') * energyRatio;
    const crystalProduction = this.getResourceProduction(mines.crystalMine || 0, 'crystal') * energyRatio;
    const deuteriumProduction = this.getResourceProduction(mines.deuteriumMine || 0, 'deuterium') * energyRatio;
    const netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;

    // 자원 업데이트
    const hoursElapsed = elapsedSeconds / 3600;
    
    user.resources.metal += metalProduction * hoursElapsed;
    user.resources.crystal += crystalProduction * hoursElapsed;
    user.resources.deuterium += netDeuteriumProduction * hoursElapsed;
    user.resources.energy = energyProduction - energyConsumption;
    user.lastResourceUpdate = now;

    await user.save();
    return user;
  }

  // 현재 자원 상태 조회
  async getResources(userId: string) {
    const user = await this.updateResources(userId);
    if (!user) return null;

    const mines = user.mines;
    const fleet = user.fleet;
    
    // 에너지 계산
    const satelliteCount = fleet.solarSatellite || 0;
    const fusionLevel = mines.fusionReactor || 0;
    
    const solarEnergy = this.getEnergyProduction(mines.solarPlant || 0);
    const satelliteEnergy = satelliteCount * 25;
    const fusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    
    let energyConsumption = 0;
    energyConsumption += this.getEnergyConsumption(mines.metalMine || 0, 'metal');
    energyConsumption += this.getEnergyConsumption(mines.crystalMine || 0, 'crystal');
    energyConsumption += this.getEnergyConsumption(mines.deuteriumMine || 0, 'deuterium');

    let energyRatio = 1.0;
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
    if (energyProduction < energyConsumption) {
      energyRatio = Math.max(0.1, energyProduction / energyConsumption);
    }

    const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel);

    return {
      resources: {
        metal: Math.floor(user.resources.metal),
        crystal: Math.floor(user.resources.crystal),
        deuterium: Math.floor(user.resources.deuterium),
        energy: energyProduction - energyConsumption,
      },
      production: {
        metal: Math.floor(this.getResourceProduction(mines.metalMine || 0, 'metal') * energyRatio),
        crystal: Math.floor(this.getResourceProduction(mines.crystalMine || 0, 'crystal') * energyRatio),
        deuterium: Math.floor((this.getResourceProduction(mines.deuteriumMine || 0, 'deuterium') * energyRatio) - fusionDeuteriumConsumption),
        energyProduction,
        energyConsumption,
      },
      energyRatio: Math.round(energyRatio * 100),
    };
  }

  // 자원 차감
  async deductResources(userId: string, cost: { metal?: number; crystal?: number; deuterium?: number }): Promise<boolean> {
    const user = await this.updateResources(userId);
    if (!user) return false;

    // 자원 확인
    if ((cost.metal || 0) > user.resources.metal) return false;
    if ((cost.crystal || 0) > user.resources.crystal) return false;
    if ((cost.deuterium || 0) > user.resources.deuterium) return false;

    // 자원 차감
    user.resources.metal -= (cost.metal || 0);
    user.resources.crystal -= (cost.crystal || 0);
    user.resources.deuterium -= (cost.deuterium || 0);

    await user.save();
    return true;
  }

  // 자원 추가
  async addResources(userId: string, resources: { metal?: number; crystal?: number; deuterium?: number }): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return false;

    user.resources.metal += (resources.metal || 0);
    user.resources.crystal += (resources.crystal || 0);
    user.resources.deuterium += (resources.deuterium || 0);

    await user.save();
    return true;
  }
}
