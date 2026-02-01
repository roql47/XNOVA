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
const planet_schema_1 = require("../../planet/schemas/planet.schema");
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
let DefenseService = class DefenseService {
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
    checkRequirements(facilities, researchLevels, defenseType) {
        const defenseData = game_data_1.DEFENSE_DATA[defenseType];
        if (!defenseData || !defenseData.requirements) {
            return { met: true, missing: [] };
        }
        const missing = [];
        for (const req in defenseData.requirements) {
            const requiredLevel = defenseData.requirements[req];
            let currentLevel = 0;
            if (facilities && facilities[req] !== undefined) {
                currentLevel = facilities[req];
            }
            else if (researchLevels && researchLevels[req] !== undefined) {
                currentLevel = researchLevels[req];
            }
            if (currentLevel < requiredLevel) {
                missing.push(`${game_data_1.NAME_MAPPING[req] || req} Lv.${requiredLevel}`);
            }
        }
        return { met: missing.length === 0, missing };
    }
    getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel) {
        const defenseData = game_data_1.DEFENSE_DATA[defenseType];
        if (!defenseData)
            return 0;
        const totalCost = (defenseData.cost.metal || 0) + (defenseData.cost.crystal || 0);
        const nanoBonus = Math.pow(2, nanoFactoryLevel);
        return (totalCost / (25 * (1 + robotFactoryLevel) * nanoBonus)) / 10;
    }
    getBuildTime(defenseType, quantity, robotFactoryLevel, nanoFactoryLevel) {
        return this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel) * quantity;
    }
    async getDefense(userId) {
        let user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        let defense;
        let facilities;
        let defenseProgress;
        if (isHome) {
            if (user.defenseProgress && new Date(user.defenseProgress.finishTime).getTime() <= Date.now()) {
                let result = await this.completeBuild(userId);
                while (result.completed) {
                    user = await this.userModel.findById(userId).exec();
                    if (!user?.defenseProgress)
                        break;
                    if (new Date(user.defenseProgress.finishTime).getTime() > Date.now())
                        break;
                    result = await this.completeBuild(userId);
                }
                user = await this.userModel.findById(userId).exec();
                if (!user)
                    return null;
            }
            defense = user.defense || {};
            facilities = user.facilities || {};
            defenseProgress = user.defenseProgress;
        }
        else {
            let planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet) {
                defense = user.defense || {};
                facilities = user.facilities || {};
                defenseProgress = user.defenseProgress;
            }
            else {
                if (planet.defenseProgress && new Date(planet.defenseProgress.finishTime).getTime() <= Date.now()) {
                    await this.completePlanetDefenseBuildInternal(planet);
                    planet = await this.planetModel.findById(user.activePlanetId).exec();
                    if (!planet)
                        return null;
                }
                defense = planet.defense || {};
                facilities = planet.facilities || {};
                defenseProgress = planet.defenseProgress;
            }
        }
        const defenseInfo = [];
        const robotFactoryLevel = facilities.robotFactory || 0;
        const nanoFactoryLevel = facilities.nanoFactory || 0;
        for (const key in game_data_1.DEFENSE_DATA) {
            const count = defense[key] || 0;
            const defenseData = game_data_1.DEFENSE_DATA[key];
            const requirements = this.checkRequirements(facilities, user.researchLevels, key);
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
            defenseProgress,
            robotFactoryLevel,
            isHomePlanet: isHome,
        };
    }
    async startBuild(userId, defenseType, quantity) {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
            throw new common_1.BadRequestException('수량은 1 ~ 100,000 사이의 정수여야 합니다.');
        }
        const result = await this.resourcesService.updateResourcesWithPlanet(userId);
        if (!result) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        let defense;
        let facilities;
        let defenseProgress;
        if (isHome) {
            defense = user.defense || {};
            facilities = user.facilities || {};
            defenseProgress = user.defenseProgress;
        }
        else if (planet) {
            defense = planet.defense || {};
            facilities = planet.facilities || {};
            defenseProgress = planet.defenseProgress;
        }
        else {
            throw new common_1.BadRequestException('행성을 찾을 수 없습니다.');
        }
        if (defenseProgress) {
            const remainingTime = Math.max(0, (defenseProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[defenseProgress.name] || defenseProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        const defenseData = game_data_1.DEFENSE_DATA[defenseType];
        if (!defenseData) {
            throw new common_1.BadRequestException('알 수 없는 방어시설입니다.');
        }
        const maxCount = defenseData.maxCount;
        if (maxCount) {
            const currentCount = defense[defenseType] || 0;
            if (currentCount + quantity > maxCount) {
                throw new common_1.BadRequestException(`${game_data_1.NAME_MAPPING[defenseType]}은(는) 최대 ${maxCount}개까지 건조할 수 있습니다. 현재 ${currentCount}개 보유 중.`);
            }
        }
        const requirements = this.checkRequirements(facilities, user.researchLevels, defenseType);
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
        const robotFactoryLevel = facilities.robotFactory || 0;
        const nanoFactoryLevel = facilities.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + singleBuildTime * 1000);
        const progress = {
            type: 'defense',
            name: defenseType,
            quantity,
            startTime,
            finishTime,
        };
        if (isHome) {
            user.defenseProgress = progress;
            await user.save();
        }
        else if (planet) {
            planet.defenseProgress = progress;
            await planet.save();
        }
        return {
            message: `${game_data_1.NAME_MAPPING[defenseType]} ${quantity}대 건조가 시작되었습니다.`,
            defense: defenseType,
            quantity,
            totalCost,
            buildTime: singleBuildTime,
            totalBuildTime: singleBuildTime * quantity,
            finishTime,
        };
    }
    async completeBuild(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return { completed: false };
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        if (isHome) {
            if (!user.defenseProgress)
                return { completed: false };
            if (user.defenseProgress.finishTime.getTime() > Date.now())
                return { completed: false };
            const defenseType = user.defenseProgress.name;
            const remainingQuantity = user.defenseProgress.quantity || 1;
            user.defense[defenseType] = (user.defense[defenseType] || 0) + 1;
            user.markModified('defense');
            const newRemaining = remainingQuantity - 1;
            if (newRemaining > 0) {
                const robotFactoryLevel = user.facilities?.robotFactory || 0;
                const nanoFactoryLevel = user.facilities?.nanoFactory || 0;
                const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);
                const prevFinishTime = user.defenseProgress.finishTime.getTime();
                const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);
                user.defenseProgress = {
                    type: 'defense',
                    name: defenseType,
                    quantity: newRemaining,
                    startTime: new Date(prevFinishTime),
                    finishTime: nextFinishTime,
                };
            }
            else {
                user.defenseProgress = null;
            }
            user.markModified('defenseProgress');
            await user.save();
            return { completed: true, defense: defenseType, quantity: 1, remaining: newRemaining };
        }
        else {
            const planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet || !planet.defenseProgress)
                return { completed: false };
            if (planet.defenseProgress.finishTime.getTime() > Date.now())
                return { completed: false };
            const defenseType = planet.defenseProgress.name;
            const remainingQuantity = planet.defenseProgress.quantity || 1;
            if (!planet.defense)
                planet.defense = {};
            planet.defense[defenseType] = (planet.defense[defenseType] || 0) + 1;
            planet.markModified('defense');
            const newRemaining = remainingQuantity - 1;
            if (newRemaining > 0) {
                const robotFactoryLevel = planet.facilities?.robotFactory || 0;
                const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
                const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);
                const prevFinishTime = planet.defenseProgress.finishTime.getTime();
                const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);
                planet.defenseProgress = {
                    type: 'defense',
                    name: defenseType,
                    quantity: newRemaining,
                    startTime: new Date(prevFinishTime),
                    finishTime: nextFinishTime,
                };
            }
            else {
                planet.defenseProgress = null;
            }
            planet.markModified('defenseProgress');
            await planet.save();
            return { completed: true, defense: defenseType, quantity: 1, remaining: newRemaining };
        }
    }
    async completePlanetDefenseBuildInternal(planet) {
        const now = Date.now();
        while (planet.defenseProgress && new Date(planet.defenseProgress.finishTime).getTime() <= now) {
            const defenseType = planet.defenseProgress.name;
            const remainingQuantity = planet.defenseProgress.quantity || 1;
            if (!planet.defense)
                planet.defense = {};
            planet.defense[defenseType] = (planet.defense[defenseType] || 0) + 1;
            planet.markModified('defense');
            const newRemaining = remainingQuantity - 1;
            if (newRemaining > 0) {
                const robotFactoryLevel = planet.facilities?.robotFactory || 0;
                const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
                const singleBuildTime = this.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);
                const prevFinishTime = new Date(planet.defenseProgress.finishTime).getTime();
                const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);
                planet.defenseProgress = {
                    type: 'defense',
                    name: defenseType,
                    quantity: newRemaining,
                    startTime: new Date(prevFinishTime),
                    finishTime: nextFinishTime,
                };
                if (new Date(planet.defenseProgress.finishTime).getTime() > now) {
                    break;
                }
            }
            else {
                planet.defenseProgress = null;
                break;
            }
        }
        planet.markModified('defenseProgress');
        await planet.save();
    }
};
exports.DefenseService = DefenseService;
exports.DefenseService = DefenseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        resources_service_1.ResourcesService])
], DefenseService);
//# sourceMappingURL=defense.service.js.map