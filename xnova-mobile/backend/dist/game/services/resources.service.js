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
    async updateColonyResources(planet) {
        const now = new Date();
        const lastUpdate = planet.lastResourceUpdate || now;
        const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
        if (elapsedSeconds <= 0)
            return;
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
    async getResources(userId) {
        const result = await this.updateResourcesWithPlanet(userId);
        if (!result)
            return null;
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        const mines = isHome ? user.mines : (planet?.mines || {});
        const fleet = isHome ? user.fleet : (planet?.fleet || {});
        const resources = isHome ? user.resources : (planet?.resources || { metal: 0, crystal: 0, deuterium: 0, energy: 0 });
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