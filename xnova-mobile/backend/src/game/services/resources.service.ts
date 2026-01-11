import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';
import { calculateStorageCapacity } from '../constants/game-data';

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
    const facilities = user.facilities;
    const fleet = user.fleet;
    
    // 가동률 적용
    const operationRates = user.operationRates || {
      metalMine: 100,
      crystalMine: 100,
      deuteriumMine: 100,
      solarPlant: 100,
      fusionReactor: 100,
      solarSatellite: 100,
    };
    
    const satelliteCount = fleet?.solarSatellite || 0;
    const planetTemperature = user.planetInfo?.temperature ?? 50;
    const fusionLevel = mines?.fusionReactor || 0;

    // 가동률 적용 에너지 생산
    const baseSolarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
    const baseSatelliteEnergy = this.getSatelliteEnergy(satelliteCount, planetTemperature);
    const baseFusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    
    const solarEnergy = Math.floor(baseSolarEnergy * (operationRates.solarPlant / 100));
    const satelliteEnergy = Math.floor(baseSatelliteEnergy * (operationRates.solarSatellite / 100));
    const fusionEnergy = Math.floor(baseFusionEnergy * (operationRates.fusionReactor / 100));
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

    // 가동률 적용 에너지 소비
    const baseMetalConsumption = this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
    const baseCrystalConsumption = this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
    const baseDeuteriumConsumption = this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');
    
    const metalEnergyConsumption = Math.floor(baseMetalConsumption * (operationRates.metalMine / 100));
    const crystalEnergyConsumption = Math.floor(baseCrystalConsumption * (operationRates.crystalMine / 100));
    const deuteriumEnergyConsumption = Math.floor(baseDeuteriumConsumption * (operationRates.deuteriumMine / 100));
    const energyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deuteriumEnergyConsumption;

    let energyRatio = 1.0;
    if (energyProduction < energyConsumption && energyConsumption > 0) {
      energyRatio = Math.max(0, energyProduction / energyConsumption);
    }

    // 가동률 적용 자원 생산량
    const baseMetalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal');
    const baseCrystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal');
    const baseDeuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium');
    
    const metalProduction = baseMetalProduction * (operationRates.metalMine / 100) * energyRatio;
    const crystalProduction = baseCrystalProduction * (operationRates.crystalMine / 100) * energyRatio;
    const deuteriumProduction = baseDeuteriumProduction * (operationRates.deuteriumMine / 100) * energyRatio;
    
    // 핵융합로 듀테륨 소비 (가동률 적용)
    const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel) * (operationRates.fusionReactor / 100);
    const netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;

    const hoursElapsed = elapsedSeconds / 3600;
    
    // 창고 용량 계산
    const metalStorageCapacity = calculateStorageCapacity(facilities?.metalStorage || 0);
    const crystalStorageCapacity = calculateStorageCapacity(facilities?.crystalStorage || 0);
    const deuteriumStorageCapacity = calculateStorageCapacity(facilities?.deuteriumTank || 0);
    
    // 자원 생산 (창고 용량 제한 적용 - 생산으로 얻는 자원만)
    const newMetal = user.resources.metal + metalProduction * hoursElapsed;
    const newCrystal = user.resources.crystal + crystalProduction * hoursElapsed;
    const newDeuterium = user.resources.deuterium + netDeuteriumProduction * hoursElapsed;
    
    // 생산으로 얻는 자원은 창고 용량까지만 증가 (이미 초과된 경우 유지)
    user.resources.metal = Math.max(user.resources.metal, Math.min(newMetal, metalStorageCapacity));
    user.resources.crystal = Math.max(user.resources.crystal, Math.min(newCrystal, crystalStorageCapacity));
    user.resources.deuterium = Math.max(user.resources.deuterium, Math.min(newDeuterium, deuteriumStorageCapacity));
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
    const facilities = planet.facilities;
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
    
    // 창고 용량 계산
    const metalStorageCapacity = calculateStorageCapacity(facilities?.metalStorage || 0);
    const crystalStorageCapacity = calculateStorageCapacity(facilities?.crystalStorage || 0);
    const deuteriumStorageCapacity = calculateStorageCapacity(facilities?.deuteriumTank || 0);
    
    // 자원 생산 (창고 용량 제한 적용 - 생산으로 얻는 자원만)
    const newMetal = planet.resources.metal + metalProduction * hoursElapsed;
    const newCrystal = planet.resources.crystal + crystalProduction * hoursElapsed;
    const newDeuterium = planet.resources.deuterium + netDeuteriumProduction * hoursElapsed;
    
    // 생산으로 얻는 자원은 창고 용량까지만 증가 (이미 초과된 경우 유지)
    planet.resources.metal = Math.max(planet.resources.metal, Math.min(newMetal, metalStorageCapacity));
    planet.resources.crystal = Math.max(planet.resources.crystal, Math.min(newCrystal, crystalStorageCapacity));
    planet.resources.deuterium = Math.max(planet.resources.deuterium, Math.min(newDeuterium, deuteriumStorageCapacity));
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
    const facilities: any = isHome ? user.facilities : (planet?.facilities || {});
    const fleet: any = isHome ? user.fleet : (planet?.fleet || {});
    const resources: any = isHome ? user.resources : (planet?.resources || { metal: 0, crystal: 0, deuterium: 0, energy: 0 });
    const temperature = isHome ? (user.planetInfo?.temperature ?? 50) : (planet?.planetInfo?.tempMax ?? 50);
    
    // 가동률 (현재는 모행성만 지원)
    const operationRates = user.operationRates || {
      metalMine: 100,
      crystalMine: 100,
      deuteriumMine: 100,
      solarPlant: 100,
      fusionReactor: 100,
      solarSatellite: 100,
    };

    const satelliteCount = fleet?.solarSatellite || 0;
    const fusionLevel = mines?.fusionReactor || 0;
    
    // 가동률 적용 에너지 생산
    const baseSolarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
    const baseSatelliteEnergy = this.getSatelliteEnergy(satelliteCount, temperature);
    const baseFusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    
    const solarEnergy = Math.floor(baseSolarEnergy * (operationRates.solarPlant / 100));
    const satelliteEnergy = Math.floor(baseSatelliteEnergy * (operationRates.solarSatellite / 100));
    const fusionEnergy = Math.floor(baseFusionEnergy * (operationRates.fusionReactor / 100));
    
    // 가동률 적용 에너지 소비
    const baseMetalConsumption = this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
    const baseCrystalConsumption = this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
    const baseDeuteriumConsumption = this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');
    
    const metalEnergyConsumption = Math.floor(baseMetalConsumption * (operationRates.metalMine / 100));
    const crystalEnergyConsumption = Math.floor(baseCrystalConsumption * (operationRates.crystalMine / 100));
    const deuteriumEnergyConsumption = Math.floor(baseDeuteriumConsumption * (operationRates.deuteriumMine / 100));
    
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
    const energyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deuteriumEnergyConsumption;

    let energyRatio = 1.0;
    if (energyProduction < energyConsumption && energyConsumption > 0) {
      energyRatio = Math.max(0, energyProduction / energyConsumption);
    }

    // 가동률 적용 자원 생산량
    const baseMetalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal');
    const baseCrystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal');
    const baseDeuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium');
    
    const metalProduction = Math.floor(baseMetalProduction * (operationRates.metalMine / 100) * energyRatio);
    const crystalProduction = Math.floor(baseCrystalProduction * (operationRates.crystalMine / 100) * energyRatio);
    const deuteriumProduction = Math.floor(baseDeuteriumProduction * (operationRates.deuteriumMine / 100) * energyRatio);
    
    // 핵융합로 듀테륨 소비 (가동률 적용)
    const fusionDeuteriumConsumption = Math.floor(this.getFusionDeuteriumConsumption(fusionLevel) * (operationRates.fusionReactor / 100));

    // 기본 수입
    const basicIncome = { metal: 30, crystal: 15, deuterium: 0 };

    // 창고 용량 계산
    const metalStorageCapacity = calculateStorageCapacity(facilities?.metalStorage || 0);
    const crystalStorageCapacity = calculateStorageCapacity(facilities?.crystalStorage || 0);
    const deuteriumStorageCapacity = calculateStorageCapacity(facilities?.deuteriumTank || 0);

    return {
      resources: {
        metal: Math.floor(resources?.metal || 0),
        crystal: Math.floor(resources?.crystal || 0),
        deuterium: Math.floor(resources?.deuterium || 0),
        energy: energyProduction - energyConsumption,
      },
      production: {
        metal: metalProduction + basicIncome.metal,
        crystal: crystalProduction + basicIncome.crystal,
        deuterium: deuteriumProduction - fusionDeuteriumConsumption + basicIncome.deuterium,
        energyProduction,
        energyConsumption,
      },
      storage: {
        metalCapacity: metalStorageCapacity,
        crystalCapacity: crystalStorageCapacity,
        deuteriumCapacity: deuteriumStorageCapacity,
        metalLevel: facilities?.metalStorage || 0,
        crystalLevel: facilities?.crystalStorage || 0,
        deuteriumLevel: facilities?.deuteriumTank || 0,
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

  // 가동률 설정 (활성 행성 기준)
  async setOperationRates(
    userId: string, 
    rates: { metalMine?: number; crystalMine?: number; deuteriumMine?: number; solarPlant?: number; fusionReactor?: number; solarSatellite?: number }
  ): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    // 가동률 유효성 검사 (0~100)
    const validateRate = (rate: number | undefined) => {
      if (rate === undefined) return undefined;
      return Math.max(0, Math.min(100, Math.round(rate / 10) * 10)); // 10% 단위로 반올림
    };

    if (!user.operationRates) {
      user.operationRates = {
        metalMine: 100,
        crystalMine: 100,
        deuteriumMine: 100,
        solarPlant: 100,
        fusionReactor: 100,
        solarSatellite: 100,
      };
    }

    if (rates.metalMine !== undefined) user.operationRates.metalMine = validateRate(rates.metalMine)!;
    if (rates.crystalMine !== undefined) user.operationRates.crystalMine = validateRate(rates.crystalMine)!;
    if (rates.deuteriumMine !== undefined) user.operationRates.deuteriumMine = validateRate(rates.deuteriumMine)!;
    if (rates.solarPlant !== undefined) user.operationRates.solarPlant = validateRate(rates.solarPlant)!;
    if (rates.fusionReactor !== undefined) user.operationRates.fusionReactor = validateRate(rates.fusionReactor)!;
    if (rates.solarSatellite !== undefined) user.operationRates.solarSatellite = validateRate(rates.solarSatellite)!;

    user.markModified('operationRates');
    await user.save();

    return { success: true, operationRates: user.operationRates };
  }

  // 상세 자원 정보 조회 (자원 탭용)
  async getDetailedResources(userId: string): Promise<any> {
    const result = await this.updateResourcesWithPlanet(userId);
    if (!result) return null;

    const { user, planet } = result;
    const isHome = this.isHomePlanet(user.activePlanetId, userId);

    // 활성 행성의 데이터 사용
    const mines: any = isHome ? user.mines : (planet?.mines || {});
    const facilities: any = isHome ? user.facilities : (planet?.facilities || {});
    const fleet: any = isHome ? user.fleet : (planet?.fleet || {});
    const resources: any = isHome ? user.resources : (planet?.resources || { metal: 0, crystal: 0, deuterium: 0, energy: 0 });
    const temperature = isHome ? (user.planetInfo?.temperature ?? 50) : (planet?.planetInfo?.tempMax ?? 50);
    
    // 가동률 (현재는 모행성만 지원)
    const operationRates = user.operationRates || {
      metalMine: 100,
      crystalMine: 100,
      deuteriumMine: 100,
      solarPlant: 100,
      fusionReactor: 100,
      solarSatellite: 100,
    };

    const satelliteCount = fleet?.solarSatellite || 0;
    const fusionLevel = mines?.fusionReactor || 0;
    
    // 가동률 적용 전 기본 생산량
    const baseMetalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal');
    const baseCrystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal');
    const baseDeuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium');
    
    // 기본 에너지 생산량
    const baseSolarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
    const baseSatelliteEnergy = this.getSatelliteEnergy(satelliteCount, temperature);
    const baseFusionEnergy = this.getFusionEnergyProduction(fusionLevel);
    
    // 기본 에너지 소비량
    const baseMetalConsumption = this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
    const baseCrystalConsumption = this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
    const baseDeuteriumConsumption = this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');
    
    // 가동률 적용 생산량
    const metalProduction = Math.floor(baseMetalProduction * (operationRates.metalMine / 100));
    const crystalProduction = Math.floor(baseCrystalProduction * (operationRates.crystalMine / 100));
    const deuteriumProduction = Math.floor(baseDeuteriumProduction * (operationRates.deuteriumMine / 100));
    
    // 가동률 적용 에너지 생산
    const solarEnergy = Math.floor(baseSolarEnergy * (operationRates.solarPlant / 100));
    const satelliteEnergy = Math.floor(baseSatelliteEnergy * (operationRates.solarSatellite / 100));
    const fusionEnergy = Math.floor(baseFusionEnergy * (operationRates.fusionReactor / 100));
    
    // 가동률 적용 에너지 소비
    const metalEnergyConsumption = Math.floor(baseMetalConsumption * (operationRates.metalMine / 100));
    const crystalEnergyConsumption = Math.floor(baseCrystalConsumption * (operationRates.crystalMine / 100));
    const deuteriumEnergyConsumption = Math.floor(baseDeuteriumConsumption * (operationRates.deuteriumMine / 100));
    
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
    const energyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deuteriumEnergyConsumption;
    
    // 에너지 효율 (부족하면 생산량 감소)
    let energyRatio = 1.0;
    if (energyProduction < energyConsumption && energyConsumption > 0) {
      energyRatio = Math.max(0, energyProduction / energyConsumption);
    }

    // 핵융합로 듀테륨 소비 (가동률 적용)
    const fusionDeuteriumConsumption = Math.floor(this.getFusionDeuteriumConsumption(fusionLevel) * (operationRates.fusionReactor / 100));

    // 기본 수입 (서버 설정)
    const basicIncome = { metal: 30, crystal: 15, deuterium: 0 };

    // 최종 시간당 생산량 (가동률 + 에너지효율 적용 + 기본수입)
    const finalMetalProduction = Math.floor(metalProduction * energyRatio) + basicIncome.metal;
    const finalCrystalProduction = Math.floor(crystalProduction * energyRatio) + basicIncome.crystal;
    const finalDeuteriumProduction = Math.floor(deuteriumProduction * energyRatio) - fusionDeuteriumConsumption + basicIncome.deuterium;

    // 창고 용량
    const metalStorageCapacity = calculateStorageCapacity(facilities?.metalStorage || 0);
    const crystalStorageCapacity = calculateStorageCapacity(facilities?.crystalStorage || 0);
    const deuteriumStorageCapacity = calculateStorageCapacity(facilities?.deuteriumTank || 0);

    // 시설별 상세 정보
    const productionDetails = [
      {
        name: '메탈 광산',
        type: 'metalMine',
        level: mines?.metalMine || 0,
        metal: Math.floor(baseMetalProduction * (operationRates.metalMine / 100) * energyRatio),
        crystal: 0,
        deuterium: 0,
        energy: -metalEnergyConsumption,
        operationRate: operationRates.metalMine,
      },
      {
        name: '크리스탈 광산',
        type: 'crystalMine',
        level: mines?.crystalMine || 0,
        metal: 0,
        crystal: Math.floor(baseCrystalProduction * (operationRates.crystalMine / 100) * energyRatio),
        deuterium: 0,
        energy: -crystalEnergyConsumption,
        operationRate: operationRates.crystalMine,
      },
      {
        name: '듀테륨 합성기',
        type: 'deuteriumMine',
        level: mines?.deuteriumMine || 0,
        metal: 0,
        crystal: 0,
        deuterium: Math.floor(baseDeuteriumProduction * (operationRates.deuteriumMine / 100) * energyRatio),
        energy: -deuteriumEnergyConsumption,
        operationRate: operationRates.deuteriumMine,
      },
      {
        name: '태양열 발전소',
        type: 'solarPlant',
        level: mines?.solarPlant || 0,
        metal: 0,
        crystal: 0,
        deuterium: 0,
        energy: solarEnergy,
        operationRate: operationRates.solarPlant,
      },
      {
        name: '핵융합 발전소',
        type: 'fusionReactor',
        level: fusionLevel,
        metal: 0,
        crystal: 0,
        deuterium: -fusionDeuteriumConsumption,
        energy: fusionEnergy,
        operationRate: operationRates.fusionReactor,
      },
      {
        name: '태양광 위성',
        type: 'solarSatellite',
        level: satelliteCount,
        metal: 0,
        crystal: 0,
        deuterium: 0,
        energy: satelliteEnergy,
        operationRate: operationRates.solarSatellite,
      },
    ];

    return {
      // 현재 자원
      resources: {
        metal: Math.floor(resources?.metal || 0),
        crystal: Math.floor(resources?.crystal || 0),
        deuterium: Math.floor(resources?.deuterium || 0),
        energy: energyProduction - energyConsumption,
      },
      // 시간당 생산량 (최종)
      production: {
        metal: finalMetalProduction,
        crystal: finalCrystalProduction,
        deuterium: finalDeuteriumProduction,
        energyProduction,
        energyConsumption,
      },
      // 기본 수입
      basicIncome,
      // 시설별 생산량
      productionDetails,
      // 가동률
      operationRates,
      // 에너지 효율 (%)
      energyRatio: Math.round(energyRatio * 100),
      // 저장소 용량
      storageCapacity: {
        metal: metalStorageCapacity,
        crystal: crystalStorageCapacity,
        deuterium: deuteriumStorageCapacity,
      },
      // 저장소 상태 (%)
      storageStatus: {
        metal: Math.min(100, Math.round(((resources?.metal || 0) / metalStorageCapacity) * 100)),
        crystal: Math.min(100, Math.round(((resources?.crystal || 0) / crystalStorageCapacity) * 100)),
        deuterium: Math.min(100, Math.round(((resources?.deuterium || 0) / deuteriumStorageCapacity) * 100)),
      },
      // 예상 생산량
      forecast: {
        daily: {
          metal: finalMetalProduction * 24,
          crystal: finalCrystalProduction * 24,
          deuterium: finalDeuteriumProduction * 24,
        },
        weekly: {
          metal: finalMetalProduction * 24 * 7,
          crystal: finalCrystalProduction * 24 * 7,
          deuterium: finalDeuteriumProduction * 24 * 7,
        },
        monthly: {
          metal: finalMetalProduction * 24 * 30,
          crystal: finalCrystalProduction * 24 * 30,
          deuterium: finalDeuteriumProduction * 24 * 30,
        },
      },
      isHomePlanet: isHome,
    };
  }
}
