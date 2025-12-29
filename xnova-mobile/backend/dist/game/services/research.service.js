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
exports.ResearchService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
let ResearchService = class ResearchService {
    userModel;
    resourcesService;
    constructor(userModel, resourcesService) {
        this.userModel = userModel;
        this.resourcesService = resourcesService;
    }
    getResearchCost(researchType, currentLevel) {
        const researchData = game_data_1.RESEARCH_DATA[researchType];
        if (!researchData)
            return null;
        return {
            metal: Math.floor((researchData.cost.metal || 0) * Math.pow(2, currentLevel)),
            crystal: Math.floor((researchData.cost.crystal || 0) * Math.pow(2, currentLevel)),
            deuterium: Math.floor((researchData.cost.deuterium || 0) * Math.pow(2, currentLevel)),
        };
    }
    getResearchTime(metal, crystal, labLevel) {
        const hours = (metal + crystal) / (20000 * (1 + labLevel));
        return hours * 3600;
    }
    checkRequirements(user, researchType) {
        const researchData = game_data_1.RESEARCH_DATA[researchType];
        if (!researchData || !researchData.requirements) {
            return { met: true, missing: [] };
        }
        const missing = [];
        for (const req in researchData.requirements) {
            const requiredLevel = researchData.requirements[req];
            let currentLevel = 0;
            if (user.facilities[req] !== undefined) {
                currentLevel = user.facilities[req];
            }
            else if (user.researchLevels[req] !== undefined) {
                currentLevel = user.researchLevels[req];
            }
            if (currentLevel < requiredLevel) {
                missing.push(`${game_data_1.NAME_MAPPING[req] || req} Lv.${requiredLevel}`);
            }
        }
        return { met: missing.length === 0, missing };
    }
    async getResearch(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const researchInfo = [];
        const labLevel = user.facilities.researchLab || 0;
        for (const key in game_data_1.RESEARCH_DATA) {
            const level = user.researchLevels[key] || 0;
            const cost = this.getResearchCost(key, level);
            const time = cost ? this.getResearchTime(cost.metal, cost.crystal, labLevel) : 0;
            const requirements = this.checkRequirements(user, key);
            researchInfo.push({
                type: key,
                name: game_data_1.NAME_MAPPING[key],
                level,
                cost,
                researchTime: time,
                requirementsMet: requirements.met,
                missingRequirements: requirements.missing,
            });
        }
        return {
            research: researchInfo,
            researchProgress: user.researchProgress,
            labLevel,
        };
    }
    async startResearch(userId, researchType) {
        const user = await this.resourcesService.updateResources(userId);
        if (!user) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (user.researchProgress) {
            const remainingTime = Math.max(0, (user.researchProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[user.researchProgress.name] || user.researchProgress.name} 연구가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        if (!game_data_1.RESEARCH_DATA[researchType]) {
            throw new common_1.BadRequestException('알 수 없는 연구입니다.');
        }
        const requirements = this.checkRequirements(user, researchType);
        if (!requirements.met) {
            throw new common_1.BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
        }
        const currentLevel = user.researchLevels[researchType] || 0;
        const cost = this.getResearchCost(researchType, currentLevel);
        if (!cost) {
            throw new common_1.BadRequestException('연구 비용을 계산할 수 없습니다.');
        }
        const labLevel = user.facilities.researchLab || 0;
        const researchTime = this.getResearchTime(cost.metal, cost.crystal, labLevel);
        const hasResources = await this.resourcesService.deductResources(userId, cost);
        if (!hasResources) {
            throw new common_1.BadRequestException('자원이 부족합니다.');
        }
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + researchTime * 1000);
        user.researchProgress = {
            type: 'research',
            name: researchType,
            startTime,
            finishTime,
        };
        await user.save();
        return {
            message: `${game_data_1.NAME_MAPPING[researchType]} 연구가 시작되었습니다.`,
            research: researchType,
            currentLevel,
            targetLevel: currentLevel + 1,
            cost,
            researchTime,
            finishTime,
        };
    }
    async completeResearch(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.researchProgress) {
            return { completed: false };
        }
        if (user.researchProgress.finishTime.getTime() > Date.now()) {
            return { completed: false };
        }
        const researchType = user.researchProgress.name;
        user.researchLevels[researchType] = (user.researchLevels[researchType] || 0) + 1;
        const newLevel = user.researchLevels[researchType];
        user.researchProgress = null;
        await user.save();
        return {
            completed: true,
            research: researchType,
            newLevel,
        };
    }
    async cancelResearch(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.researchProgress) {
            throw new common_1.BadRequestException('진행 중인 연구가 없습니다.');
        }
        const researchType = user.researchProgress.name;
        const currentLevel = user.researchLevels[researchType] || 0;
        const cost = this.getResearchCost(researchType, currentLevel);
        const refund = {
            metal: Math.floor((cost?.metal || 0) * 0.5),
            crystal: Math.floor((cost?.crystal || 0) * 0.5),
            deuterium: Math.floor((cost?.deuterium || 0) * 0.5),
        };
        await this.resourcesService.addResources(userId, refund);
        user.researchProgress = null;
        await user.save();
        return {
            message: '연구가 취소되었습니다.',
            refund,
        };
    }
};
exports.ResearchService = ResearchService;
exports.ResearchService = ResearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        resources_service_1.ResourcesService])
], ResearchService);
//# sourceMappingURL=research.service.js.map