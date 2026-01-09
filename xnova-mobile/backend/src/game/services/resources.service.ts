import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
  ) {}

  // 활성 행성이 모행성인지 확인
  isHomePlanet(activePlanetId: string | null, userId: string): boolean {
    if (!activePlanetId) return true; // null이면 모행성
    return activePlanetId.startsWith('home_') || activePlanetId === `home_${userId}`;
  }

  // 태양광 인공위성 에너지 계산
  // 공식: 에너지 = (행성최대온도 / 4 + 20) × 위성 수
  getSatelliteEnergy(satelliteCount: number, temperature: number): number {
    if (satelliteCount <= 0) return 0;
    const energyPerSatellite = Math.floor(temperature / 4 + 20);
    return energyPerSatellite * satelliteCount;
  }

  // 자원 생산량 계산 (시간당) - XNOVA.js getResourceProduction 마이그레이션
  // 생산 속도 5배 적용
  getResourceProduction(level: number, type: 'metal' | 'crystal' | 'deuterium'): number {
    const effectiveLevel = level + 1;
    const SPEED_MULTIPLIER = 5; // 생산 속도 배율
    
    switch (type) {
      case 'metal':
        return Math.floor(90 * effectiveLevel * Math.pow(1.1, effectiveLevel) * SPEED_MULTIPLIER);
      case 'crystal':
        return Math.floor(60 * effectiveLevel * Math.pow(1.1, effectiveLevel) * SPEED_MULTIPLIER);
      case 'deuterium':
        return Math.floor(30 * effectiveLevel * Math.pow(1.1, effectiveLevel) * SPEED_MULTIPLIER);
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

  // 핵융합로 듀테륨 소비량 (5배 증가)
  getFusionDeuteriumConsumption(fusionLevel: number): number {
    if (fusionLevel <= 0) return 0;
    return Math.floor(50 * fusionLevel * Math.pow(1.1, fusionLevel));
  }

  // 자원 업데이트 (경과 시간 기반) - 활성 행성 기준
  // 기존 호환성을 위해 UserDocument 반환, 내부에서 활성 행성 업데이트 처리
  async updateResources(userId: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const activePlanetId = user.activePlanetId;
    const isHome = this.isHomePlanet(activePlanetId, userId);

    if (isHome) {
      // 모행성 자원 업데이트
      await this.updateHomePlanetResources(user);
    } else {
      // 식민지 자원 업데이트
      const planet = await this.planetModel.findById(activePlanetId).exec();
      if (planet) {
        await this.updateColonyResources(planet);
      } else {
        // 식민지를 찾지 못하면 모행성으로 폴백
        await this.updateHomePlanetResources(user);
      }
    }

    return user;
  }

  // 자원 업데이트 (행성 정보 포함 반환)
  async updateResourcesWithPlanet(userId: string): Promise<{ user: UserDocument; planet?: PlanetDocument } | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const activePlanetId = user.activePlanetId;
    const isHome = this.isHomePlanet(activePlanetId, userId);

    if (isHome) {
      await this.updateHomePlanetResources(user);
      return { user };
    } else {
      const planet = await this.planetModel.findById(activePlanetId).exec();
      if (planet) {
        await this.updateColonyResources(planet);
        return { user, planet };
      }
      await this.updateHomePlanetResources(user);
      return { user };
    }
  }

  // 모행성 자원 업데이트
  private async updateHomePlanetResources(user: UserDocument): Promise<void> {
    const now = new Date();
    const lastUpdate = user.lastResourceUpdate || now;
    const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

    if (elapsedSeconds <= 0) return;

    const mines = user.mines;
    const fleet = user.fleet;
    
    const satelliteCount = fleet?.solarSatellite || 0;
    const planetTemperature = user.planetInfo?.temperature ?? 50;
    const fusionLevel = mines?.fusionReactor || 0;

    const solarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
    const satelliteEnergy = this.getSatelliteEnergy(satelliteCount, planetTemperature);
    const fusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

    let energyConsumption = 0;
    energyConsumption += this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
    energyConsumption += this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
    energyConsumption += this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');

    let energyRatio = 1.0;
    if (energyProduction < energyConsumption) {
      energyRatio = Math.max(0.1, energyProduction / energyConsumption);
    }

    const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel);

    const metalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal') * energyRatio;
    const crystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal') * energyRatio;
    const deuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium') * energyRatio;
    const netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;

    const hoursElapsed = elapsedSeconds / 3600;
    
    user.resources.metal += metalProduction * hoursElapsed;
    user.resources.crystal += crystalProduction * hoursElapsed;
    user.resources.deuterium += netDeuteriumProduction * hoursElapsed;
    user.resources.energy = energyProduction - energyConsumption;
    user.lastResourceUpdate = now;

    await user.save();
  }

  // 식민지 자원 업데이트
  private async updateColonyResources(planet: PlanetDocument): Promise<void> {
    const now = new Date();
    const lastUpdate = planet.lastResourceUpdate || now;
    const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

    if (elapsedSeconds <= 0) return;

    const mines = planet.mines;
    const fleet = planet.fleet;
    
    const satelliteCount = fleet?.solarSatellite || 0;
    const planetTemperature = planet.planetInfo?.tempMax ?? 50;
    const fusionLevel = mines?.fusionReactor || 0;

    const solarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
    const satelliteEnergy = this.getSatelliteEnergy(satelliteCount, planetTemperature);
    const fusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

    let energyConsumption = 0;
    energyConsumption += this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
    energyConsumption += this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
    energyConsumption += this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');

    let energyRatio = 1.0;
    if (energyProduction < energyConsumption) {
      energyRatio = Math.max(0.1, energyProduction / energyConsumption);
    }

    const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel);

    const metalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal') * energyRatio;
    const crystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal') * energyRatio;
    const deuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium') * energyRatio;
    const netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;

    const hoursElapsed = elapsedSeconds / 3600;
    
    planet.resources.metal += metalProduction * hoursElapsed;
    planet.resources.crystal += crystalProduction * hoursElapsed;
    planet.resources.deuterium += netDeuteriumProduction * hoursElapsed;
    planet.resources.energy = energyProduction - energyConsumption;
    planet.lastResourceUpdate = now;

    await planet.save();
  }

  // 현재 자원 상태 조회 (활성 행성 기준)
  async getResources(userId: string) {
    const result = await this.updateResourcesWithPlanet(userId);
    if (!result) return null;

    const { user, planet } = result;
    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    // 활성 행성의 데이터 사용
    const mines: any = isHome ? user.mines : (planet?.mines || {});
    const fleet: any = isHome ? user.fleet : (planet?.fleet || {});
    const resources: any = isHome ? user.resources : (planet?.resources || { metal: 0, crystal: 0, deuterium: 0, energy: 0 });
    const temperature = isHome ? (user.planetInfo?.temperature ?? 50) : (planet?.planetInfo?.tempMax ?? 50);
    
    const satelliteCount = fleet?.solarSatellite || 0;
    const fusionLevel = mines?.fusionReactor || 0;
    
    const solarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
    const satelliteEnergy = this.getSatelliteEnergy(satelliteCount, temperature);
    const fusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    
    let energyConsumption = 0;
    energyConsumption += this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
    energyConsumption += this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
    energyConsumption += this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');

    let energyRatio = 1.0;
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
    if (energyProduction < energyConsumption) {
      energyRatio = Math.max(0.1, energyProduction / energyConsumption);
    }

    const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel);

    return {
      resources: {
        metal: Math.floor(resources?.metal || 0),
        crystal: Math.floor(resources?.crystal || 0),
        deuterium: Math.floor(resources?.deuterium || 0),
        energy: energyProduction - energyConsumption,
      },
      production: {
        metal: Math.floor(this.getResourceProduction(mines?.metalMine || 0, 'metal') * energyRatio),
        crystal: Math.floor(this.getResourceProduction(mines?.crystalMine || 0, 'crystal') * energyRatio),
        deuterium: Math.floor((this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium') * energyRatio) - fusionDeuteriumConsumption),
        energyProduction,
        energyConsumption,
      },
      energyRatio: Math.round(energyRatio * 100),
      activePlanetId: user.activePlanetId,
      isHomePlanet: isHome,
    };
  }

  // 자원 차감 (활성 행성 기준)
  async deductResources(userId: string, cost: { metal?: number; crystal?: number; deuterium?: number }): Promise<boolean> {
    const result = await this.updateResourcesWithPlanet(userId);
    if (!result) return false;

    const { user, planet } = result;
    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    if (isHome) {
      // 모행성 자원 차감
      if ((cost.metal || 0) > user.resources.metal) return false;
      if ((cost.crystal || 0) > user.resources.crystal) return false;
      if ((cost.deuterium || 0) > user.resources.deuterium) return false;

      user.resources.metal -= (cost.metal || 0);
      user.resources.crystal -= (cost.crystal || 0);
      user.resources.deuterium -= (cost.deuterium || 0);
      await user.save();
    } else if (planet) {
      // 식민지 자원 차감
      if ((cost.metal || 0) > (planet.resources?.metal || 0)) return false;
      if ((cost.crystal || 0) > (planet.resources?.crystal || 0)) return false;
      if ((cost.deuterium || 0) > (planet.resources?.deuterium || 0)) return false;

      planet.resources.metal -= (cost.metal || 0);
      planet.resources.crystal -= (cost.crystal || 0);
      planet.resources.deuterium -= (cost.deuterium || 0);
      await planet.save();
    } else {
      return false;
    }

    return true;
  }

  // 자원 추가 (활성 행성 기준)
  async addResources(userId: string, resources: { metal?: number; crystal?: number; deuterium?: number }): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return false;

    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    if (isHome) {
      user.resources.metal += (resources.metal || 0);
      user.resources.crystal += (resources.crystal || 0);
      user.resources.deuterium += (resources.deuterium || 0);
      await user.save();
    } else {
      const planet = await this.planetModel.findById(user.activePlanetId).exec();
      if (!planet) return false;

      planet.resources.metal += (resources.metal || 0);
      planet.resources.crystal += (resources.crystal || 0);
      planet.resources.deuterium += (resources.deuterium || 0);
      await planet.save();
    }

    return true;
  }

  // 특정 행성에 자원 추가 (귀환 등)
  async addResourcesToHomePlanet(userId: string, resources: { metal?: number; crystal?: number; deuterium?: number }): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return false;

    user.resources.metal += (resources.metal || 0);
    user.resources.crystal += (resources.crystal || 0);
    user.resources.deuterium += (resources.deuterium || 0);
    await user.save();
    return true;
  }
}
