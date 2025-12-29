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
let ResourcesService = class ResourcesService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    getResourceProduction(level, type) {
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
        return Math.floor(10 * fusionLevel * Math.pow(1.1, fusionLevel));
    }
    async updateResources(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const now = new Date();
        const lastUpdate = user.lastResourceUpdate || now;
        const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
        if (elapsedSeconds <= 0)
            return user;
        const mines = user.mines;
        const fleet = user.fleet;
        const satelliteCount = fleet.solarSatellite || 0;
        const fusionLevel = mines.fusionReactor || 0;
        const solarEnergy = this.getEnergyProduction(mines.solarPlant || 0);
        const satelliteEnergy = satelliteCount * 25;
        const fusionEnergy = this.getFusionEnergyProduction(fusionLevel);
        const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
        let energyConsumption = 0;
        energyConsumption += this.getEnergyConsumption(mines.metalMine || 0, 'metal');
        energyConsumption += this.getEnergyConsumption(mines.crystalMine || 0, 'crystal');
        energyConsumption += this.getEnergyConsumption(mines.deuteriumMine || 0, 'deuterium');
        let energyRatio = 1.0;
        if (energyProduction < energyConsumption) {
            energyRatio = Math.max(0.1, energyProduction / energyConsumption);
        }
        const fusionDeuteriumConsumption = this.getFusionDeuteriumConsumption(fusionLevel);
        const metalProduction = this.getResourceProduction(mines.metalMine || 0, 'metal') * energyRatio;
        const crystalProduction = this.getResourceProduction(mines.crystalMine || 0, 'crystal') * energyRatio;
        const deuteriumProduction = this.getResourceProduction(mines.deuteriumMine || 0, 'deuterium') * energyRatio;
        const netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;
        const hoursElapsed = elapsedSeconds / 3600;
        user.resources.metal += metalProduction * hoursElapsed;
        user.resources.crystal += crystalProduction * hoursElapsed;
        user.resources.deuterium += netDeuteriumProduction * hoursElapsed;
        user.resources.energy = energyProduction - energyConsumption;
        user.lastResourceUpdate = now;
        await user.save();
        return user;
    }
    async getResources(userId) {
        const user = await this.updateResources(userId);
        if (!user)
            return null;
        const mines = user.mines;
        const fleet = user.fleet;
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
    async deductResources(userId, cost) {
        const user = await this.updateResources(userId);
        if (!user)
            return false;
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
        return true;
    }
    async addResources(userId, resources) {
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
    __metadata("design:paramtypes", [mongoose_2.Model])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map