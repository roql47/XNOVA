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
exports.BuildingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const planet_schema_1 = require("../../planet/schemas/planet.schema");
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
const FIELD_CONSUMING_BUILDINGS = [
    'metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor',
    'robotFactory', 'nanoFactory', 'shipyard', 'metalStorage', 'crystalStorage',
    'deuteriumTank', 'researchLab', 'terraformer', 'allianceDepot', 'missileSilo',
    'lunarBase', 'sensorPhalanx', 'jumpGate'
];
const PLANET_FIELD_RANGES = {
    min: [40, 50, 55, 100, 95, 80, 115, 120, 125, 75, 80, 85, 60, 40, 50],
    max: [90, 95, 95, 240, 240, 230, 180, 180, 190, 125, 120, 130, 160, 300, 150]
};
const PLANET_TEMP_RANGES = {
    min: [40, 40, 40, 15, 15, 15, -10, -10, -10, -35, -35, -35, -60, -60, -60],
    max: [140, 140, 140, 115, 115, 115, 90, 90, 90, 65, 65, 65, 50, 50, 50]
};
const PLANET_TYPES = [
    'trocken', 'trocken', 'trocken',
    'dschjungel', 'dschjungel', 'dschjungel',
    'normaltemp', 'normaltemp', 'normaltemp',
    'wasser', 'wasser', 'wasser',
    'eis', 'eis', 'eis'
];
let BuildingsService = class BuildingsService {
    userModel;
    planetModel;
    resourcesService;
    constructor(userModel, planetModel, resourcesService) {
        this.userModel = userModel;
        this.planetModel = planetModel;
        this.resourcesService = resourcesService;
    }
    isHomePlanet(activePlanetId, userId) {
        if (!activePlanetId)
            return true;
        return activePlanetId.startsWith('home_') || activePlanetId === `home_${userId}`;
    }
    extractPlanetPosition(coordinate) {
        const parts = coordinate.split(':');
        if (parts.length !== 3)
            return 7;
        return parseInt(parts[2], 10) || 7;
    }
    generatePlanetFields(position, isHomeWorld = false) {
        if (isHomeWorld) {
            return {
                maxFields: 163,
                temperature: 50,
                planetType: 'normaltemp'
            };
        }
        const posIndex = Math.max(0, Math.min(14, position - 1));
        const minFields = PLANET_FIELD_RANGES.min[posIndex];
        const maxFields = PLANET_FIELD_RANGES.max[posIndex];
        const randomFields = Math.floor(Math.random() * (maxFields - minFields + 1)) + minFields;
        const minTemp = PLANET_TEMP_RANGES.min[posIndex];
        const maxTemp = PLANET_TEMP_RANGES.max[posIndex];
        const randomTemp = Math.floor(Math.random() * (maxTemp - minTemp + 1)) + minTemp;
        return {
            maxFields: randomFields,
            temperature: randomTemp,
            planetType: PLANET_TYPES[posIndex]
        };
    }
    calculateUsedFields(user) {
        let usedFields = 0;
        if (user.mines) {
            usedFields += user.mines.metalMine || 0;
            usedFields += user.mines.crystalMine || 0;
            usedFields += user.mines.deuteriumMine || 0;
            usedFields += user.mines.solarPlant || 0;
            usedFields += user.mines.fusionReactor || 0;
        }
        if (user.facilities) {
            usedFields += user.facilities.robotFactory || 0;
            usedFields += user.facilities.nanoFactory || 0;
            usedFields += user.facilities.shipyard || 0;
            usedFields += user.facilities.researchLab || 0;
            usedFields += user.facilities.terraformer || 0;
            usedFields += user.facilities.allianceDepot || 0;
            usedFields += user.facilities.missileSilo || 0;
            usedFields += user.facilities.metalStorage || 0;
            usedFields += user.facilities.crystalStorage || 0;
            usedFields += user.facilities.deuteriumTank || 0;
            usedFields += user.facilities.lunarBase || 0;
            usedFields += user.facilities.sensorPhalanx || 0;
            usedFields += user.facilities.jumpGate || 0;
        }
        return usedFields;
    }
    getTerraformerBonus(terraformerLevel) {
        return terraformerLevel * 5;
    }
    getMaxFields(user) {
        const baseFields = user.planetInfo?.maxFields || 163;
        const terraformerLevel = user.facilities?.terraformer || 0;
        return baseFields + this.getTerraformerBonus(terraformerLevel);
    }
    isFieldsFull(user) {
        const usedFields = this.calculateUsedFields(user);
        const maxFields = this.getMaxFields(user);
        return usedFields >= maxFields;
    }
    getFieldInfo(user) {
        const usedFields = this.calculateUsedFields(user);
        const maxFields = this.getMaxFields(user);
        return {
            used: usedFields,
            max: maxFields,
            remaining: maxFields - usedFields,
            percentage: Math.round((usedFields / maxFields) * 100)
        };
    }
    getUpgradeCost(buildingType, currentLevel) {
        const buildingData = game_data_1.BUILDING_COSTS[buildingType];
        if (!buildingData)
            return null;
        const cost = {
            metal: 0,
            crystal: 0,
        };
        if (buildingData.base.metal) {
            cost.metal = Math.floor(buildingData.base.metal * Math.pow(buildingData.factor, currentLevel));
        }
        if (buildingData.base.crystal) {
            cost.crystal = Math.floor(buildingData.base.crystal * Math.pow(buildingData.factor, currentLevel));
        }
        if (buildingData.base.deuterium) {
            cost.deuterium = Math.floor(buildingData.base.deuterium * Math.pow(buildingData.factor, currentLevel));
        }
        return cost;
    }
    getConstructionTime(buildingType, currentLevel, robotFactoryLevel, nanoFactoryLevel = 0) {
        const cost = this.getUpgradeCost(buildingType, currentLevel);
        if (!cost)
            return 3600;
        const totalCost = (cost.metal || 0) + (cost.crystal || 0);
        const nanoBonus = Math.pow(2, nanoFactoryLevel);
        const facilityBonus = 1 + robotFactoryLevel;
        return Math.ceil((totalCost / (25 * facilityBonus * nanoBonus)) * 4 / 10);
    }
    calculateColonyUsedFields(planet) {
        let usedFields = 0;
        if (planet.mines) {
            usedFields += planet.mines.metalMine || 0;
            usedFields += planet.mines.crystalMine || 0;
            usedFields += planet.mines.deuteriumMine || 0;
            usedFields += planet.mines.solarPlant || 0;
            usedFields += planet.mines.fusionReactor || 0;
        }
        if (planet.facilities) {
            usedFields += planet.facilities.robotFactory || 0;
            usedFields += planet.facilities.nanoFactory || 0;
            usedFields += planet.facilities.shipyard || 0;
            usedFields += planet.facilities.researchLab || 0;
            usedFields += planet.facilities.terraformer || 0;
            usedFields += planet.facilities.allianceDepot || 0;
            usedFields += planet.facilities.missileSilo || 0;
            usedFields += planet.facilities.metalStorage || 0;
            usedFields += planet.facilities.crystalStorage || 0;
            usedFields += planet.facilities.deuteriumTank || 0;
        }
        return usedFields;
    }
    getColonyMaxFields(planet) {
        const baseFields = planet.planetInfo?.maxFields || 163;
        const terraformerLevel = planet.facilities?.terraformer || 0;
        return baseFields + this.getTerraformerBonus(terraformerLevel);
    }
    getColonyFieldInfo(planet) {
        const usedFields = this.calculateColonyUsedFields(planet);
        const maxFields = this.getColonyMaxFields(planet);
        return {
            used: usedFields,
            max: maxFields,
            remaining: maxFields - usedFields,
            percentage: Math.round((usedFields / maxFields) * 100)
        };
    }
    async getBuildings(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        let mines;
        let facilities;
        let constructionProgress;
        let fieldInfo;
        let planetInfo;
        if (isHome) {
            mines = user.mines || {};
            facilities = user.facilities || {};
            constructionProgress = user.constructionProgress;
            fieldInfo = this.getFieldInfo(user);
            planetInfo = {
                temperature: user.planetInfo?.temperature ?? 50,
                planetType: user.planetInfo?.planetType ?? 'normaltemp',
                planetName: user.planetInfo?.planetName ?? user.playerName,
                diameter: user.planetInfo?.diameter ?? 12800,
            };
        }
        else {
            const planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet) {
                mines = user.mines || {};
                facilities = user.facilities || {};
                constructionProgress = user.constructionProgress;
                fieldInfo = this.getFieldInfo(user);
                planetInfo = {
                    temperature: user.planetInfo?.temperature ?? 50,
                    planetType: user.planetInfo?.planetType ?? 'normaltemp',
                    planetName: user.planetInfo?.planetName ?? user.playerName,
                    diameter: user.planetInfo?.diameter ?? 12800,
                };
            }
            else {
                mines = planet.mines || {};
                facilities = planet.facilities || {};
                constructionProgress = planet.constructionProgress;
                fieldInfo = this.getColonyFieldInfo(planet);
                planetInfo = {
                    temperature: planet.planetInfo?.tempMax ?? 50,
                    planetType: planet.planetInfo?.planetType ?? 'normaltemp',
                    planetName: planet.name || '식민지',
                    diameter: planet.planetInfo?.diameter ?? 12800,
                };
            }
        }
        const buildingsInfo = [];
        const mineTypes = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'];
        for (const key of mineTypes) {
            const level = mines[key] || 0;
            const cost = this.getUpgradeCost(key, level);
            const time = this.getConstructionTime(key, level, facilities.robotFactory || 0, facilities.nanoFactory || 0);
            let production;
            let consumption;
            let nextProduction;
            let nextConsumption;
            if (key === 'metalMine') {
                production = this.resourcesService.getResourceProduction(level, 'metal');
                consumption = this.resourcesService.getEnergyConsumption(level, 'metal');
                nextProduction = this.resourcesService.getResourceProduction(level + 1, 'metal');
                nextConsumption = this.resourcesService.getEnergyConsumption(level + 1, 'metal');
            }
            else if (key === 'crystalMine') {
                production = this.resourcesService.getResourceProduction(level, 'crystal');
                consumption = this.resourcesService.getEnergyConsumption(level, 'crystal');
                nextProduction = this.resourcesService.getResourceProduction(level + 1, 'crystal');
                nextConsumption = this.resourcesService.getEnergyConsumption(level + 1, 'crystal');
            }
            else if (key === 'deuteriumMine') {
                production = this.resourcesService.getResourceProduction(level, 'deuterium');
                consumption = this.resourcesService.getEnergyConsumption(level, 'deuterium');
                nextProduction = this.resourcesService.getResourceProduction(level + 1, 'deuterium');
                nextConsumption = this.resourcesService.getEnergyConsumption(level + 1, 'deuterium');
            }
            else if (key === 'solarPlant') {
                production = this.resourcesService.getEnergyProduction(level);
                nextProduction = this.resourcesService.getEnergyProduction(level + 1);
            }
            else if (key === 'fusionReactor') {
                production = this.resourcesService.getFusionEnergyProduction(level);
                consumption = this.resourcesService.getFusionDeuteriumConsumption(level);
                nextProduction = this.resourcesService.getFusionEnergyProduction(level + 1);
                nextConsumption = this.resourcesService.getFusionDeuteriumConsumption(level + 1);
            }
            buildingsInfo.push({
                type: key,
                name: game_data_1.NAME_MAPPING[key],
                level,
                category: 'mines',
                upgradeCost: cost,
                upgradeTime: time,
                production,
                consumption,
                nextProduction,
                nextConsumption,
            });
        }
        const facilityTypes = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'];
        for (const key of facilityTypes) {
            const level = facilities[key] || 0;
            const cost = this.getUpgradeCost(key, level);
            const time = this.getConstructionTime(key, level, facilities.robotFactory || 0, facilities.nanoFactory || 0);
            buildingsInfo.push({
                type: key,
                name: game_data_1.NAME_MAPPING[key],
                level,
                category: 'facilities',
                upgradeCost: cost,
                upgradeTime: time,
            });
        }
        return {
            buildings: buildingsInfo,
            constructionProgress,
            fieldInfo: {
                used: fieldInfo.used,
                max: fieldInfo.max,
                remaining: fieldInfo.remaining,
                percentage: fieldInfo.percentage,
            },
            planetInfo,
            isHomePlanet: isHome,
        };
    }
    async startUpgrade(userId, buildingType) {
        const result = await this.resourcesService.updateResourcesWithPlanet(userId);
        if (!result) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        let mines;
        let facilities;
        let constructionProgress;
        if (isHome) {
            mines = user.mines || {};
            facilities = user.facilities || {};
            constructionProgress = user.constructionProgress;
        }
        else if (planet) {
            mines = planet.mines || {};
            facilities = planet.facilities || {};
            constructionProgress = planet.constructionProgress;
        }
        else {
            throw new common_1.BadRequestException('행성을 찾을 수 없습니다.');
        }
        if (constructionProgress) {
            const remainingTime = Math.max(0, (constructionProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[constructionProgress.name] || constructionProgress.name} 건설이 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
        const isFacility = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory', 'terraformer',
            'allianceDepot', 'missileSilo', 'metalStorage', 'crystalStorage', 'deuteriumTank',
            'lunarBase', 'sensorPhalanx', 'jumpGate'].includes(buildingType);
        if (!isMine && !isFacility) {
            throw new common_1.BadRequestException('알 수 없는 건물 유형입니다.');
        }
        if (FIELD_CONSUMING_BUILDINGS.includes(buildingType) && buildingType !== 'terraformer') {
            if (isHome) {
                if (this.isFieldsFull(user)) {
                    const fieldInfo = this.getFieldInfo(user);
                    throw new common_1.BadRequestException(`필드가 가득 찼습니다. (${fieldInfo.used}/${fieldInfo.max}) 테라포머를 건설하여 필드를 확장하세요.`);
                }
            }
            else if (planet) {
                const fieldInfo = this.getColonyFieldInfo(planet);
                if (fieldInfo.remaining <= 0) {
                    throw new common_1.BadRequestException(`필드가 가득 찼습니다. (${fieldInfo.used}/${fieldInfo.max}) 테라포머를 건설하여 필드를 확장하세요.`);
                }
            }
        }
        const currentLevel = isMine
            ? (mines[buildingType] || 0)
            : (facilities[buildingType] || 0);
        const cost = this.getUpgradeCost(buildingType, currentLevel);
        if (!cost) {
            throw new common_1.BadRequestException('건물 비용을 계산할 수 없습니다.');
        }
        const hasResources = await this.resourcesService.deductResources(userId, cost);
        if (!hasResources) {
            throw new common_1.BadRequestException('자원이 부족합니다.');
        }
        const constructionTime = this.getConstructionTime(buildingType, currentLevel, facilities.robotFactory || 0, facilities.nanoFactory || 0);
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + constructionTime * 1000);
        const progress = {
            type: isMine ? 'mine' : 'facility',
            name: buildingType,
            startTime,
            finishTime,
        };
        if (isHome) {
            user.constructionProgress = progress;
            await user.save();
        }
        else if (planet) {
            planet.constructionProgress = progress;
            await planet.save();
        }
        return {
            message: `${game_data_1.NAME_MAPPING[buildingType]} 업그레이드가 시작되었습니다.`,
            building: buildingType,
            currentLevel,
            targetLevel: currentLevel + 1,
            cost,
            constructionTime,
            finishTime,
        };
    }
    async completeConstruction(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return { completed: false };
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        if (isHome) {
            if (!user.constructionProgress)
                return { completed: false };
            if (user.constructionProgress.finishTime.getTime() > Date.now())
                return { completed: false };
            const buildingType = user.constructionProgress.name;
            const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
            if (isMine) {
                user.mines[buildingType] = (user.mines[buildingType] || 0) + 1;
            }
            else {
                user.facilities[buildingType] = (user.facilities[buildingType] || 0) + 1;
            }
            const newLevel = isMine ? user.mines[buildingType] : user.facilities[buildingType];
            user.constructionProgress = null;
            await user.save();
            return { completed: true, building: buildingType, newLevel };
        }
        else {
            const planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet || !planet.constructionProgress)
                return { completed: false };
            if (planet.constructionProgress.finishTime.getTime() > Date.now())
                return { completed: false };
            const buildingType = planet.constructionProgress.name;
            const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
            if (isMine) {
                if (!planet.mines)
                    planet.mines = {};
                planet.mines[buildingType] = (planet.mines[buildingType] || 0) + 1;
            }
            else {
                if (!planet.facilities)
                    planet.facilities = {};
                planet.facilities[buildingType] = (planet.facilities[buildingType] || 0) + 1;
            }
            const newLevel = isMine ? planet.mines[buildingType] : planet.facilities[buildingType];
            planet.constructionProgress = null;
            await planet.save();
            return { completed: true, building: buildingType, newLevel };
        }
    }
    async cancelConstruction(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        if (isHome) {
            if (!user.constructionProgress) {
                throw new common_1.BadRequestException('진행 중인 건설이 없습니다.');
            }
            const buildingType = user.constructionProgress.name;
            const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
            const currentLevel = isMine
                ? (user.mines[buildingType] || 0)
                : (user.facilities[buildingType] || 0);
            const cost = this.getUpgradeCost(buildingType, currentLevel);
            const refund = {
                metal: Math.floor((cost?.metal || 0) * 0.5),
                crystal: Math.floor((cost?.crystal || 0) * 0.5),
                deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
            };
            await this.resourcesService.addResources(userId, refund);
            user.constructionProgress = null;
            await user.save();
            return { message: '건설이 취소되었습니다.', refund };
        }
        else {
            const planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet || !planet.constructionProgress) {
                throw new common_1.BadRequestException('진행 중인 건설이 없습니다.');
            }
            const buildingType = planet.constructionProgress.name;
            const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
            const currentLevel = isMine
                ? (planet.mines?.[buildingType] || 0)
                : (planet.facilities?.[buildingType] || 0);
            const cost = this.getUpgradeCost(buildingType, currentLevel);
            const refund = {
                metal: Math.floor((cost?.metal || 0) * 0.5),
                crystal: Math.floor((cost?.crystal || 0) * 0.5),
                deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
            };
            await this.resourcesService.addResources(userId, refund);
            planet.constructionProgress = null;
            await planet.save();
            return { message: '건설이 취소되었습니다.', refund };
        }
    }
};
exports.BuildingsService = BuildingsService;
exports.BuildingsService = BuildingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        resources_service_1.ResourcesService])
], BuildingsService);
//# sourceMappingURL=buildings.service.js.map