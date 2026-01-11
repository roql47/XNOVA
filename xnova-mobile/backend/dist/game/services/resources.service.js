"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const planet_schema_1 = require("../../planet/schemas/planet.schema");
const game_data_1 = require("../constants/game-data");
let ResourcesService = class ResourcesService {
    userModel;
    planetModel;
    constructor(userModel, planetModel) {
        this.userModel = userModel;
        this.planetModel = planetModel;
    }
    isHomePlanet(activePlanetId, userId) {
        if (!activePlanetId)
            return true;
        return activePlanetId.startsWith('home_') || activePlanetId === `home_${userId}`;
    }
    getSatelliteEnergy(satelliteCount, temperature) {
        if (satelliteCount <= 0)
            return 0;
        const energyPerSatellite = Math.floor(temperature / 4 + 20);
        return energyPerSatellite * satelliteCount;
    }
    getResourceProduction(level, type) {
        const effectiveLevel = level + 1;
        const SPEED_MULTIPLIER = 5;
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
    getEnergyProduction(solarPlantLevel) {
        if (solarPlantLevel <= 0)
            return 0;
        return Math.floor(20 * solarPlantLevel * Math.pow(1.1, solarPlantLevel));
    }
    getFusionEnergyProduction(fusionLevel) {
        if (fusionLevel <= 0)
            return 0;
        return Math.floor(30 * fusionLevel * Math.pow(1.05, fusionLevel));
    }
    getEnergyConsumption(level, type) {
        if (level <= 0)
            return 0;
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
    getFusionDeuteriumConsumption(fusionLevel) {
        if (fusionLevel <= 0)
            return 0;
        return Math.floor(50 * fusionLevel * Math.pow(1.1, fusionLevel));
    }
    async updateResources(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const activePlanetId = user.activePlanetId;
        const isHome = this.isHomePlanet(activePlanetId, userId);
        if (isHome) {
            await this.updateHomePlanetResources(user);
        }
        else {
            const planet = await this.planetModel.findById(activePlanetId).exec();
            if (planet) {
                await this.updateColonyResources(planet);
            }
            else {
                await this.updateHomePlanetResources(user);
            }
        }
        return user;
    }
    async updateResourcesWithPlanet(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const activePlanetId = user.activePlanetId;
        const isHome = this.isHomePlanet(activePlanetId, userId);
        if (isHome) {
            await this.updateHomePlanetResources(user);
            return { user };
        }
        else {
            const planet = await this.planetModel.findById(activePlanetId).exec();
            if (planet) {
                await this.updateColonyResources(planet);
                return { user, planet };
            }
            await this.updateHomePlanetResources(user);
            return { user };
        }
    }
    async updateHomePlanetResources(user) {
        const now = new Date();
        const lastUpdate = user.lastResourceUpdate || now;
        const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
        if (elapsedSeconds <= 0)
            return;
        const mines = user.mines;
        const facilities = user.facilities;
        const fleet = user.fleet;
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
        const baseSolarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
        const baseSatelliteEnergy = this.getSatelliteEnergy(satelliteCount, planetTemperature);
        const baseFusionEnergy = this.getFusionEnergyProduction(fusionLevel);
        const solarEnergy = Math.floor(baseSolarEnergy * (operationRates.solarPlant / 100));
        const satelliteEnergy = Math.floor(baseSatelliteEnergy * (operationRates.solarSatellite / 100));
        const fusionEnergy = Math.floor(baseFusionEnergy * (operationRates.fusionReactor / 100));
        const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
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
        const baseMetalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal');
        const baseCrystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal');
        const baseDeuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium');
        const metalProduction = baseMetalProduction * (operationRates.metalMine / 100) * energyRatio;
        const crystalProduction = baseCrystalProduction * (operationRates.crystalMine / 100) * energyRatio;
        const deuteriumProduction = baseDeuteriumProduction * (operationRates.deuteriumMine / 100) * energyRatio;
        const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel) * (operationRates.fusionReactor / 100);
        const netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;
        const hoursElapsed = elapsedSeconds / 3600;
        const metalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.metalStorage || 0);
        const crystalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.crystalStorage || 0);
        const deuteriumStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.deuteriumTank || 0);
        const newMetal = user.resources.metal + metalProduction * hoursElapsed;
        const newCrystal = user.resources.crystal + crystalProduction * hoursElapsed;
        const newDeuterium = user.resources.deuterium + netDeuteriumProduction * hoursElapsed;
        user.resources.metal = Math.max(user.resources.metal, Math.min(newMetal, metalStorageCapacity));
        user.resources.crystal = Math.max(user.resources.crystal, Math.min(newCrystal, crystalStorageCapacity));
        user.resources.deuterium = Math.max(user.resources.deuterium, Math.min(newDeuterium, deuteriumStorageCapacity));
        user.resources.energy = energyProduction - energyConsumption;
        user.lastResourceUpdate = now;
        await user.save();
    }
    async updateColonyResources(planet) {
        const now = new Date();
        const lastUpdate = planet.lastResourceUpdate || now;
        const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
        if (elapsedSeconds <= 0)
            return;
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
        const metalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.metalStorage || 0);
        const crystalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.crystalStorage || 0);
        const deuteriumStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.deuteriumTank || 0);
        const newMetal = planet.resources.metal + metalProduction * hoursElapsed;
        const newCrystal = planet.resources.crystal + crystalProduction * hoursElapsed;
        const newDeuterium = planet.resources.deuterium + netDeuteriumProduction * hoursElapsed;
        planet.resources.metal = Math.max(planet.resources.metal, Math.min(newMetal, metalStorageCapacity));
        planet.resources.crystal = Math.max(planet.resources.crystal, Math.min(newCrystal, crystalStorageCapacity));
        planet.resources.deuterium = Math.max(planet.resources.deuterium, Math.min(newDeuterium, deuteriumStorageCapacity));
        planet.resources.energy = energyProduction - energyConsumption;
        planet.lastResourceUpdate = now;
        await planet.save();
    }
    async getResources(userId) {
        const result = await this.updateResourcesWithPlanet(userId);
        if (!result)
            return null;
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        const mines = isHome ? user.mines : (planet?.mines || {});
        const facilities = isHome ? user.facilities : (planet?.facilities || {});
        const fleet = isHome ? user.fleet : (planet?.fleet || {});
        const resources = isHome ? user.resources : (planet?.resources || { metal: 0, crystal: 0, deuterium: 0, energy: 0 });
        const temperature = isHome ? (user.planetInfo?.temperature ?? 50) : (planet?.planetInfo?.tempMax ?? 50);
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
        const baseSolarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
        const baseSatelliteEnergy = this.getSatelliteEnergy(satelliteCount, temperature);
        const baseFusionEnergy = this.getFusionEnergyProduction(fusionLevel);
        const solarEnergy = Math.floor(baseSolarEnergy * (operationRates.solarPlant / 100));
        const satelliteEnergy = Math.floor(baseSatelliteEnergy * (operationRates.solarSatellite / 100));
        const fusionEnergy = Math.floor(baseFusionEnergy * (operationRates.fusionReactor / 100));
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
        const baseMetalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal');
        const baseCrystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal');
        const baseDeuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium');
        const metalProduction = Math.floor(baseMetalProduction * (operationRates.metalMine / 100) * energyRatio);
        const crystalProduction = Math.floor(baseCrystalProduction * (operationRates.crystalMine / 100) * energyRatio);
        const deuteriumProduction = Math.floor(baseDeuteriumProduction * (operationRates.deuteriumMine / 100) * energyRatio);
        const fusionDeuteriumConsumption = Math.floor(this.getFusionDeuteriumConsumption(fusionLevel) * (operationRates.fusionReactor / 100));
        const basicIncome = { metal: 30, crystal: 15, deuterium: 0 };
        const metalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.metalStorage || 0);
        const crystalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.crystalStorage || 0);
        const deuteriumStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.deuteriumTank || 0);
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
    async deductResources(userId, cost) {
        const result = await this.updateResourcesWithPlanet(userId);
        if (!result)
            return false;
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        if (isHome) {
            if ((cost.metal || 0) > user.resources.metal)
                return false;
            if ((cost.crystal || 0) > user.resources.crystal)
                return false;
            if ((cost.deuterium || 0) > user.resources.deuterium)
                return false;
            user.resources.metal -= (cost.metal || 0);
            user.resources.crystal -= (cost.crystal || 0);
            user.resources.deuterium -= (cost.deuterium || 0);
            await user.save();
        }
        else if (planet) {
            if ((cost.metal || 0) > (planet.resources?.metal || 0))
                return false;
            if ((cost.crystal || 0) > (planet.resources?.crystal || 0))
                return false;
            if ((cost.deuterium || 0) > (planet.resources?.deuterium || 0))
                return false;
            planet.resources.metal -= (cost.metal || 0);
            planet.resources.crystal -= (cost.crystal || 0);
            planet.resources.deuterium -= (cost.deuterium || 0);
            await planet.save();
        }
        else {
            return false;
        }
        return true;
    }
    async addResources(userId, resources) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return false;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        if (isHome) {
            user.resources.metal += (resources.metal || 0);
            user.resources.crystal += (resources.crystal || 0);
            user.resources.deuterium += (resources.deuterium || 0);
            await user.save();
        }
        else {
            const planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet)
                return false;
            planet.resources.metal += (resources.metal || 0);
            planet.resources.crystal += (resources.crystal || 0);
            planet.resources.deuterium += (resources.deuterium || 0);
            await planet.save();
        }
        return true;
    }
    async addResourcesToHomePlanet(userId, resources) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return false;
        user.resources.metal += (resources.metal || 0);
        user.resources.crystal += (resources.crystal || 0);
        user.resources.deuterium += (resources.deuterium || 0);
        await user.save();
        return true;
    }
    async setOperationRates(userId, rates) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const validateRate = (rate) => {
            if (rate === undefined)
                return undefined;
            return Math.max(0, Math.min(100, Math.round(rate / 10) * 10));
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
        if (rates.metalMine !== undefined)
            user.operationRates.metalMine = validateRate(rates.metalMine);
        if (rates.crystalMine !== undefined)
            user.operationRates.crystalMine = validateRate(rates.crystalMine);
        if (rates.deuteriumMine !== undefined)
            user.operationRates.deuteriumMine = validateRate(rates.deuteriumMine);
        if (rates.solarPlant !== undefined)
            user.operationRates.solarPlant = validateRate(rates.solarPlant);
        if (rates.fusionReactor !== undefined)
            user.operationRates.fusionReactor = validateRate(rates.fusionReactor);
        if (rates.solarSatellite !== undefined)
            user.operationRates.solarSatellite = validateRate(rates.solarSatellite);
        user.markModified('operationRates');
        await user.save();
        return { success: true, operationRates: user.operationRates };
    }
    async getDetailedResources(userId) {
        const result = await this.updateResourcesWithPlanet(userId);
        if (!result)
            return null;
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        const mines = isHome ? user.mines : (planet?.mines || {});
        const facilities = isHome ? user.facilities : (planet?.facilities || {});
        const fleet = isHome ? user.fleet : (planet?.fleet || {});
        const resources = isHome ? user.resources : (planet?.resources || { metal: 0, crystal: 0, deuterium: 0, energy: 0 });
        const temperature = isHome ? (user.planetInfo?.temperature ?? 50) : (planet?.planetInfo?.tempMax ?? 50);
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
        const baseMetalProduction = this.getResourceProduction(mines?.metalMine || 0, 'metal');
        const baseCrystalProduction = this.getResourceProduction(mines?.crystalMine || 0, 'crystal');
        const baseDeuteriumProduction = this.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium');
        const baseSolarEnergy = this.getEnergyProduction(mines?.solarPlant || 0);
        const baseSatelliteEnergy = this.getSatelliteEnergy(satelliteCount, temperature);
        const baseFusionEnergy = this.getFusionEnergyProduction(fusionLevel);
        const baseMetalConsumption = this.getEnergyConsumption(mines?.metalMine || 0, 'metal');
        const baseCrystalConsumption = this.getEnergyConsumption(mines?.crystalMine || 0, 'crystal');
        const baseDeuteriumConsumption = this.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium');
        const metalProduction = Math.floor(baseMetalProduction * (operationRates.metalMine / 100));
        const crystalProduction = Math.floor(baseCrystalProduction * (operationRates.crystalMine / 100));
        const deuteriumProduction = Math.floor(baseDeuteriumProduction * (operationRates.deuteriumMine / 100));
        const solarEnergy = Math.floor(baseSolarEnergy * (operationRates.solarPlant / 100));
        const satelliteEnergy = Math.floor(baseSatelliteEnergy * (operationRates.solarSatellite / 100));
        const fusionEnergy = Math.floor(baseFusionEnergy * (operationRates.fusionReactor / 100));
        const metalEnergyConsumption = Math.floor(baseMetalConsumption * (operationRates.metalMine / 100));
        const crystalEnergyConsumption = Math.floor(baseCrystalConsumption * (operationRates.crystalMine / 100));
        const deuteriumEnergyConsumption = Math.floor(baseDeuteriumConsumption * (operationRates.deuteriumMine / 100));
        const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
        const energyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deuteriumEnergyConsumption;
        let energyRatio = 1.0;
        if (energyProduction < energyConsumption && energyConsumption > 0) {
            energyRatio = Math.max(0, energyProduction / energyConsumption);
        }
        const fusionDeuteriumConsumption = Math.floor(this.getFusionDeuteriumConsumption(fusionLevel) * (operationRates.fusionReactor / 100));
        const basicIncome = { metal: 30, crystal: 15, deuterium: 0 };
        const finalMetalProduction = Math.floor(metalProduction * energyRatio) + basicIncome.metal;
        const finalCrystalProduction = Math.floor(crystalProduction * energyRatio) + basicIncome.crystal;
        const finalDeuteriumProduction = Math.floor(deuteriumProduction * energyRatio) - fusionDeuteriumConsumption + basicIncome.deuterium;
        const metalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.metalStorage || 0);
        const crystalStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.crystalStorage || 0);
        const deuteriumStorageCapacity = (0, game_data_1.calculateStorageCapacity)(facilities?.deuteriumTank || 0);
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
            resources: {
                metal: Math.floor(resources?.metal || 0),
                crystal: Math.floor(resources?.crystal || 0),
                deuterium: Math.floor(resources?.deuterium || 0),
                energy: energyProduction - energyConsumption,
            },
            production: {
                metal: finalMetalProduction,
                crystal: finalCrystalProduction,
                deuterium: finalDeuteriumProduction,
                energyProduction,
                energyConsumption,
            },
            basicIncome,
            productionDetails,
            operationRates,
            energyRatio: Math.round(energyRatio * 100),
            storageCapacity: {
                metal: metalStorageCapacity,
                crystal: crystalStorageCapacity,
                deuterium: deuteriumStorageCapacity,
            },
            storageStatus: {
                metal: Math.min(100, Math.round(((resources?.metal || 0) / metalStorageCapacity) * 100)),
                crystal: Math.min(100, Math.round(((resources?.crystal || 0) / crystalStorageCapacity) * 100)),
                deuterium: Math.min(100, Math.round(((resources?.deuterium || 0) / deuteriumStorageCapacity) * 100)),
            },
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
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map