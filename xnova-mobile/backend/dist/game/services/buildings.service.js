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
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
let BuildingsService = class BuildingsService {
    userModel;
    resourcesService;
    constructor(userModel, resourcesService) {
        this.userModel = userModel;
        this.resourcesService = resourcesService;
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
        return (totalCost / (25 * facilityBonus * nanoBonus)) * 4;
    }
    async getBuildings(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const mines = user.mines;
        const facilities = user.facilities;
        const buildingsInfo = [];
        const mineTypes = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'];
        for (const key of mineTypes) {
            const level = mines[key] || 0;
            const cost = this.getUpgradeCost(key, level);
            const time = this.getConstructionTime(key, level, facilities.robotFactory || 0, facilities.nanoFactory || 0);
            buildingsInfo.push({
                type: key,
                name: game_data_1.NAME_MAPPING[key],
                level,
                category: 'mines',
                upgradeCost: cost,
                upgradeTime: time,
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
            constructionProgress: user.constructionProgress,
        };
    }
    async startUpgrade(userId, buildingType) {
        const user = await this.resourcesService.updateResources(userId);
        if (!user) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (user.constructionProgress) {
            const remainingTime = Math.max(0, (user.constructionProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[user.constructionProgress.name] || user.constructionProgress.name} 건설이 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
        const isFacility = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'].includes(buildingType);
        if (!isMine && !isFacility) {
            throw new common_1.BadRequestException('알 수 없는 건물 유형입니다.');
        }
        const currentLevel = isMine
            ? (user.mines[buildingType] || 0)
            : (user.facilities[buildingType] || 0);
        const cost = this.getUpgradeCost(buildingType, currentLevel);
        if (!cost) {
            throw new common_1.BadRequestException('건물 비용을 계산할 수 없습니다.');
        }
        const hasResources = await this.resourcesService.deductResources(userId, cost);
        if (!hasResources) {
            throw new common_1.BadRequestException('자원이 부족합니다.');
        }
        const constructionTime = this.getConstructionTime(buildingType, currentLevel, user.facilities.robotFactory || 0, user.facilities.nanoFactory || 0);
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + constructionTime * 1000);
        user.constructionProgress = {
            type: isMine ? 'mine' : 'facility',
            name: buildingType,
            startTime,
            finishTime,
        };
        await user.save();
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
        if (!user || !user.constructionProgress) {
            return { completed: false };
        }
        if (user.constructionProgress.finishTime.getTime() > Date.now()) {
            return { completed: false };
        }
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
        return {
            completed: true,
            building: buildingType,
            newLevel,
        };
    }
    async cancelConstruction(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.constructionProgress) {
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
        return {
            message: '건설이 취소되었습니다.',
            refund,
        };
    }
};
exports.BuildingsService = BuildingsService;
exports.BuildingsService = BuildingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        resources_service_1.ResourcesService])
], BuildingsService);
//# sourceMappingURL=buildings.service.js.map