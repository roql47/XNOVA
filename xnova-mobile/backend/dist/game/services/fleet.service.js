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
exports.FleetService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
let FleetService = class FleetService {
    userModel;
    resourcesService;
    constructor(userModel, resourcesService) {
        this.userModel = userModel;
        this.resourcesService = resourcesService;
    }
    checkRequirements(user, fleetType) {
        const fleetData = game_data_1.FLEET_DATA[fleetType];
        if (!fleetData || !fleetData.requirements) {
            return { met: true, missing: [] };
        }
        const missing = [];
        for (const req in fleetData.requirements) {
            const requiredLevel = fleetData.requirements[req];
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
    getBuildTime(fleetType, quantity, shipyardLevel, nanoFactoryLevel) {
        const fleetData = game_data_1.FLEET_DATA[fleetType];
        if (!fleetData)
            return 0;
        const totalCost = (fleetData.cost.metal || 0) + (fleetData.cost.crystal || 0);
        const nanoBonus = Math.pow(2, nanoFactoryLevel);
        const singleShipTime = (totalCost / (25 * (1 + shipyardLevel) * nanoBonus)) / 10;
        return singleShipTime * quantity;
    }
    async getFleet(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const fleetInfo = [];
        const shipyardLevel = user.facilities.shipyard || 0;
        const nanoFactoryLevel = user.facilities.nanoFactory || 0;
        for (const key in game_data_1.FLEET_DATA) {
            const count = user.fleet[key] || 0;
            const fleetData = game_data_1.FLEET_DATA[key];
            const requirements = this.checkRequirements(user, key);
            const buildTime = this.getBuildTime(key, 1, shipyardLevel, nanoFactoryLevel);
            fleetInfo.push({
                type: key,
                name: game_data_1.NAME_MAPPING[key],
                count,
                cost: fleetData.cost,
                stats: fleetData.stats,
                buildTime,
                requirementsMet: requirements.met,
                missingRequirements: requirements.missing,
            });
        }
        return {
            fleet: fleetInfo,
            fleetProgress: user.fleetProgress,
            shipyardLevel,
        };
    }
    async startBuild(userId, fleetType, quantity) {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
            throw new common_1.BadRequestException('수량은 1 ~ 100,000 사이의 정수여야 합니다.');
        }
        const user = await this.resourcesService.updateResources(userId);
        if (!user) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (user.fleetProgress) {
            const remainingTime = Math.max(0, (user.fleetProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[user.fleetProgress.name] || user.fleetProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        const fleetData = game_data_1.FLEET_DATA[fleetType];
        if (!fleetData) {
            throw new common_1.BadRequestException('알 수 없는 함대입니다.');
        }
        const requirements = this.checkRequirements(user, fleetType);
        if (!requirements.met) {
            throw new common_1.BadRequestException(`요구사항이 충족되지 않았습니다: ${requirements.missing.join(', ')}`);
        }
        const totalCost = {
            metal: (fleetData.cost.metal || 0) * quantity,
            crystal: (fleetData.cost.crystal || 0) * quantity,
            deuterium: (fleetData.cost.deuterium || 0) * quantity,
        };
        const hasResources = await this.resourcesService.deductResources(userId, totalCost);
        if (!hasResources) {
            throw new common_1.BadRequestException('자원이 부족합니다.');
        }
        const shipyardLevel = user.facilities.shipyard || 0;
        const nanoFactoryLevel = user.facilities.nanoFactory || 0;
        const buildTime = this.getBuildTime(fleetType, quantity, shipyardLevel, nanoFactoryLevel);
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + buildTime * 1000);
        user.fleetProgress = {
            type: 'fleet',
            name: fleetType,
            quantity,
            startTime,
            finishTime,
        };
        await user.save();
        return {
            message: `${game_data_1.NAME_MAPPING[fleetType]} ${quantity}대 건조가 시작되었습니다.`,
            fleet: fleetType,
            quantity,
            totalCost,
            buildTime,
            finishTime,
        };
    }
    async completeBuild(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.fleetProgress) {
            return { completed: false };
        }
        if (user.fleetProgress.finishTime.getTime() > Date.now()) {
            return { completed: false };
        }
        const fleetType = user.fleetProgress.name;
        const quantity = user.fleetProgress.quantity || 1;
        user.fleet[fleetType] = (user.fleet[fleetType] || 0) + quantity;
        user.fleetProgress = null;
        await user.save();
        return {
            completed: true,
            fleet: fleetType,
            quantity,
        };
    }
    calculateTotalCapacity(fleet) {
        let totalCapacity = 0;
        for (const type in fleet) {
            if (fleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const cargoCapacity = game_data_1.FLEET_DATA[type].stats.cargo || 0;
                totalCapacity += fleet[type] * cargoCapacity;
            }
        }
        return totalCapacity;
    }
    calculateFuelConsumption(fleet, distance, duration) {
        let totalConsumption = 0;
        for (const type in fleet) {
            if (fleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const basicConsumption = game_data_1.FLEET_DATA[type].stats.fuelConsumption || 0;
                const shipSpeed = game_data_1.FLEET_DATA[type].stats.speed || 0;
                let tmpSpeed = 0;
                if (duration > 0 && shipSpeed > 0) {
                    const sqrtTerm = Math.sqrt((distance * 10) / shipSpeed);
                    const denominator = duration - 10;
                    if (denominator > 0) {
                        tmpSpeed = (35000 / denominator) * sqrtTerm;
                    }
                }
                const speedFactor = Math.pow((tmpSpeed / 10 + 1), 2);
                let consumption = (basicConsumption * fleet[type] * distance) / 35000 * speedFactor;
                consumption = consumption / 500;
                consumption = Math.max(1, Math.round(consumption));
                totalConsumption += consumption;
            }
        }
        return totalConsumption;
    }
    getFleetSpeed(fleet) {
        let minSpeed = Infinity;
        for (const type in fleet) {
            if (fleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const shipSpeed = game_data_1.FLEET_DATA[type].stats.speed || 10000;
                minSpeed = Math.min(minSpeed, shipSpeed);
            }
        }
        return minSpeed === Infinity ? 10000 : minSpeed;
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        resources_service_1.ResourcesService])
], FleetService);
//# sourceMappingURL=fleet.service.js.map