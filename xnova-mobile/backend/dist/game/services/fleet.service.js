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
const planet_schema_1 = require("../../planet/schemas/planet.schema");
const resources_service_1 = require("./resources.service");
const game_data_1 = require("../constants/game-data");
let FleetService = class FleetService {
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
    checkRequirements(facilities, researchLevels, fleetType) {
        const fleetData = game_data_1.FLEET_DATA[fleetType];
        if (!fleetData || !fleetData.requirements) {
            return { met: true, missing: [] };
        }
        const missing = [];
        for (const req in fleetData.requirements) {
            const requiredLevel = fleetData.requirements[req];
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
    getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel) {
        const fleetData = game_data_1.FLEET_DATA[fleetType];
        if (!fleetData)
            return 0;
        const totalCost = (fleetData.cost.metal || 0) + (fleetData.cost.crystal || 0);
        const nanoBonus = Math.pow(2, nanoFactoryLevel);
        return (totalCost / (25 * (1 + shipyardLevel) * nanoBonus)) / 10;
    }
    getBuildTime(fleetType, quantity, shipyardLevel, nanoFactoryLevel) {
        return this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel) * quantity;
    }
    async getFleet(userId) {
        let user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        let fleet;
        let facilities;
        let fleetProgress;
        if (isHome) {
            if (user.fleetProgress && new Date(user.fleetProgress.finishTime).getTime() <= Date.now()) {
                let result = await this.completeBuild(userId);
                while (result.completed) {
                    user = await this.userModel.findById(userId).exec();
                    if (!user?.fleetProgress)
                        break;
                    if (new Date(user.fleetProgress.finishTime).getTime() > Date.now())
                        break;
                    result = await this.completeBuild(userId);
                }
                user = await this.userModel.findById(userId).exec();
                if (!user)
                    return null;
            }
            fleet = user.fleet || {};
            facilities = user.facilities || {};
            fleetProgress = user.fleetProgress;
        }
        else {
            let planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet) {
                fleet = user.fleet || {};
                facilities = user.facilities || {};
                fleetProgress = user.fleetProgress;
            }
            else {
                if (planet.fleetProgress && new Date(planet.fleetProgress.finishTime).getTime() <= Date.now()) {
                    await this.completePlanetFleetBuildInternal(planet);
                    planet = await this.planetModel.findById(user.activePlanetId).exec();
                    if (!planet)
                        return null;
                }
                fleet = planet.fleet || {};
                facilities = planet.facilities || {};
                fleetProgress = planet.fleetProgress;
            }
        }
        const fleetInfo = [];
        const shipyardLevel = facilities.shipyard || 0;
        const nanoFactoryLevel = facilities.nanoFactory || 0;
        for (const key in game_data_1.FLEET_DATA) {
            const count = fleet[key] || 0;
            const fleetData = game_data_1.FLEET_DATA[key];
            const requirements = this.checkRequirements(facilities, user.researchLevels, key);
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
            fleetProgress,
            shipyardLevel,
            isHomePlanet: isHome,
        };
    }
    async startBuild(userId, fleetType, quantity) {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
            throw new common_1.BadRequestException('수량은 1 ~ 100,000 사이의 정수여야 합니다.');
        }
        const result = await this.resourcesService.updateResourcesWithPlanet(userId);
        if (!result) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        const { user, planet } = result;
        const isHome = this.isHomePlanet(user.activePlanetId, userId);
        let facilities;
        let fleetProgress;
        if (isHome) {
            facilities = user.facilities || {};
            fleetProgress = user.fleetProgress;
        }
        else if (planet) {
            facilities = planet.facilities || {};
            fleetProgress = planet.fleetProgress;
        }
        else {
            throw new common_1.BadRequestException('행성을 찾을 수 없습니다.');
        }
        if (fleetProgress) {
            const remainingTime = Math.max(0, (fleetProgress.finishTime.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`이미 ${game_data_1.NAME_MAPPING[fleetProgress.name] || fleetProgress.name} 건조가 진행 중입니다. 완료까지 ${Math.ceil(remainingTime)}초 남았습니다.`);
        }
        const fleetData = game_data_1.FLEET_DATA[fleetType];
        if (!fleetData) {
            throw new common_1.BadRequestException('알 수 없는 함대입니다.');
        }
        const requirements = this.checkRequirements(facilities, user.researchLevels, fleetType);
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
        const shipyardLevel = facilities.shipyard || 0;
        const nanoFactoryLevel = facilities.nanoFactory || 0;
        const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);
        const startTime = new Date();
        const finishTime = new Date(startTime.getTime() + singleBuildTime * 1000);
        const progress = {
            type: 'fleet',
            name: fleetType,
            quantity,
            startTime,
            finishTime,
        };
        if (isHome) {
            user.fleetProgress = progress;
            await user.save();
        }
        else if (planet) {
            planet.fleetProgress = progress;
            await planet.save();
        }
        return {
            message: `${game_data_1.NAME_MAPPING[fleetType]} ${quantity}대 건조가 시작되었습니다.`,
            fleet: fleetType,
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
            if (!user.fleetProgress)
                return { completed: false };
            if (user.fleetProgress.finishTime.getTime() > Date.now())
                return { completed: false };
            const fleetType = user.fleetProgress.name;
            const remainingQuantity = user.fleetProgress.quantity || 1;
            user.fleet[fleetType] = (user.fleet[fleetType] || 0) + 1;
            user.markModified('fleet');
            const newRemaining = remainingQuantity - 1;
            if (newRemaining > 0) {
                const shipyardLevel = user.facilities?.shipyard || 0;
                const nanoFactoryLevel = user.facilities?.nanoFactory || 0;
                const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);
                const prevFinishTime = user.fleetProgress.finishTime.getTime();
                const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);
                user.fleetProgress = {
                    type: 'fleet',
                    name: fleetType,
                    quantity: newRemaining,
                    startTime: new Date(prevFinishTime),
                    finishTime: nextFinishTime,
                };
            }
            else {
                user.fleetProgress = null;
            }
            user.markModified('fleetProgress');
            await user.save();
            return { completed: true, fleet: fleetType, quantity: 1, remaining: newRemaining };
        }
        else {
            const planet = await this.planetModel.findById(user.activePlanetId).exec();
            if (!planet || !planet.fleetProgress)
                return { completed: false };
            if (planet.fleetProgress.finishTime.getTime() > Date.now())
                return { completed: false };
            const fleetType = planet.fleetProgress.name;
            const remainingQuantity = planet.fleetProgress.quantity || 1;
            if (!planet.fleet)
                planet.fleet = {};
            planet.fleet[fleetType] = (planet.fleet[fleetType] || 0) + 1;
            planet.markModified('fleet');
            const newRemaining = remainingQuantity - 1;
            if (newRemaining > 0) {
                const shipyardLevel = planet.facilities?.shipyard || 0;
                const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
                const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);
                const prevFinishTime = planet.fleetProgress.finishTime.getTime();
                const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);
                planet.fleetProgress = {
                    type: 'fleet',
                    name: fleetType,
                    quantity: newRemaining,
                    startTime: new Date(prevFinishTime),
                    finishTime: nextFinishTime,
                };
            }
            else {
                planet.fleetProgress = null;
            }
            planet.markModified('fleetProgress');
            await planet.save();
            return { completed: true, fleet: fleetType, quantity: 1, remaining: newRemaining };
        }
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
                consumption = consumption / 50;
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
    async completePlanetFleetBuildInternal(planet) {
        const now = Date.now();
        while (planet.fleetProgress && new Date(planet.fleetProgress.finishTime).getTime() <= now) {
            const fleetType = planet.fleetProgress.name;
            const remainingQuantity = planet.fleetProgress.quantity || 1;
            if (!planet.fleet)
                planet.fleet = {};
            planet.fleet[fleetType] = (planet.fleet[fleetType] || 0) + 1;
            planet.markModified('fleet');
            const newRemaining = remainingQuantity - 1;
            if (newRemaining > 0) {
                const shipyardLevel = planet.facilities?.shipyard || 0;
                const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
                const singleBuildTime = this.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);
                const prevFinishTime = new Date(planet.fleetProgress.finishTime).getTime();
                const nextFinishTime = new Date(prevFinishTime + singleBuildTime * 1000);
                planet.fleetProgress = {
                    type: 'fleet',
                    name: fleetType,
                    quantity: newRemaining,
                    startTime: new Date(prevFinishTime),
                    finishTime: nextFinishTime,
                };
                if (planet.fleetProgress && new Date(planet.fleetProgress.finishTime).getTime() > now) {
                    break;
                }
            }
            else {
                planet.fleetProgress = null;
                break;
            }
        }
        planet.markModified('fleetProgress');
        await planet.save();
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        resources_service_1.ResourcesService])
], FleetService);
//# sourceMappingURL=fleet.service.js.map