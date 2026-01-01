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
exports.DefenseService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
let DefenseService = class DefenseService {
    userModel;
    resourcesService;
    constructor(userModel, resourcesService) {
        this.userModel = userModel;
        this.resourcesService = resourcesService;
    }
    checkRequirements(user, defenseType) {
        const defenseData = game_data_1.DEFENSE_DATA[defenseType];
        if (!defenseData || !defenseData.requirements) {
            return { met: true, missing: [] };
        }
        const missing = [];
        for (const req in defenseData.requirements) {
            const requiredLevel = defenseData.requirements[req];
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
    getBuildTime(defenseType, quantity, robotFactoryLevel, nanoFactoryLevel) {
        const defenseData = game_data_1.DEFENSE_DATA[defenseType];
        if (!defenseData)
            return 0;
        const totalCost = (defenseData.cost.metal || 0) + (defenseData.cost.crystal || 0);
        const nanoBonus = Math.pow(2, nanoFactoryLevel);
        const singleUnitTime = (totalCost / (25 * (1 + robotFactoryLevel) * nanoBonus)) * 4 * 10;
        return singleUnitTime * quantity;
    }
    async getDefense(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const defenseInfo = [];
        const robotFactoryLevel = user.facilities.robotFactory || 0;
        const nanoFactoryLevel = user.facilities.nanoFactory || 0;
        for (const key in game_data_1.DEFENSE_DATA) {
            const count = user.defense[key] || 0;
            const defenseData = game_data_1.DEFENSE_DATA[key];
            const requirements = this.checkRequirements(user, key);
            const buildTime = this.getBuildTime(key, 1, robotFactoryLevel, nanoFactoryLevel);
            defenseInfo.push({
                type: key,
                name: game_data_1.NAME_MAPPING[key],
                count,
                cost: defenseData.cost,
                stats: defenseData.stats,
                buildTime,
                maxCount: defenseData.maxCount || null,
                requirementsMet: requirements.met,
                missingRequirements: requirements.missing,
            });
        }
        return {
            defense: defenseInfo,
            defenseProgress: user.defenseProgress,
            robotFactoryLevel,
        };
    }
    async startBuild(userId, defenseType, quantity) {
        if (quantity < 1) {
            throw new common_1.BadRequestException('수량은 1 이상이어야 합니다.');
        }
        const user = await this.resourcesService.updateResources(userId);
        if (!user) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (user.defenseProgress) {
            const remainingTime = Math.max(0, (user.defenseProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[user.defenseProgress.name] || user.defenseProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        const defenseData = game_data_1.DEFENSE_DATA[defenseType];
        if (!defenseData) {
            throw new common_1.BadRequestException('알 수 없는 방어시설입니다.');
        }
        const maxCount = defenseData.maxCount;
        if (maxCount) {
            const currentCount = user.defense[defenseType] || 0;
            if (currentCount + quantity > maxCount) {
                throw new common_1.BadRequestException(`${game_data_1.NAME_MAPPING[defenseType]}은(는) 최대 ${maxCount}개까지 건조할 수 있습니다. 현재 ${currentCount}개 보유 중.`);
            }
        }
        const requirements = this.checkRequirements(user, defenseType);
        if (!requirements.met) {
            throw new common_1.BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
        }
        const totalCost = {
            metal: (defenseData.cost.metal || 0) * quantity,
            crystal: (defenseData.cost.crystal || 0) * quantity,
            deuterium: (defenseData.cost.deuterium || 0) * quantity,
        };
        const hasResources = await this.resourcesService.deductResources(userId, totalCost);
        if (!hasResources) {
            throw new common_1.BadRequestException('자원이 부족합니다.');
        }
        const robotFactoryLevel = user.facilities.robotFactory || 0;
        const nanoFactoryLevel = user.facilities.nanoFactory || 0;
        const buildTime = this.getBuildTime(defenseType, quantity, robotFactoryLevel, nanoFactoryLevel);
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + buildTime * 1000);
        user.defenseProgress = {
            type: 'defense',
            name: defenseType,
            quantity,
            startTime,
            finishTime,
        };
        await user.save();
        return {
            message: `${game_data_1.NAME_MAPPING[defenseType]} ${quantity}대 건조가 시작되었습니다.`,
            defense: defenseType,
            quantity,
            totalCost,
            buildTime,
            finishTime,
        };
    }
    async completeBuild(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.defenseProgress) {
            return { completed: false };
        }
        if (user.defenseProgress.finishTime.getTime() > Date.now()) {
            return { completed: false };
        }
        const defenseType = user.defenseProgress.name;
        const quantity = user.defenseProgress.quantity || 1;
        user.defense[defenseType] = (user.defense[defenseType] || 0) + quantity;
        user.defenseProgress = null;
        await user.save();
        return {
            completed: true,
            defense: defenseType,
            quantity,
        };
    }
};
exports.DefenseService = DefenseService;
exports.DefenseService = DefenseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        resources_service_1.ResourcesService])
], DefenseService);
//# sourceMappingURL=defense.service.js.map