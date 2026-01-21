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
var BuildSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const planet_schema_1 = require("../../planet/schemas/planet.schema");
const fleet_service_1 = require("./fleet.service");
const defense_service_1 = require("./defense.service");
const research_service_1 = require("./research.service");
const buildings_service_1 = require("./buildings.service");
let BuildSchedulerService = BuildSchedulerService_1 = class BuildSchedulerService {
    userModel;
    planetModel;
    fleetService;
    defenseService;
    researchService;
    buildingsService;
    logger = new common_1.Logger(BuildSchedulerService_1.name);
    isProcessing = false;
    constructor(userModel, planetModel, fleetService, defenseService, researchService, buildingsService) {
        this.userModel = userModel;
        this.planetModel = planetModel;
        this.fleetService = fleetService;
        this.defenseService = defenseService;
        this.researchService = researchService;
        this.buildingsService = buildingsService;
    }
    async handleBuildProgress() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        const now = Date.now();
        try {
            const usersWithProgress = await this.userModel.find({
                $or: [
                    { fleetProgress: { $ne: null } },
                    { defenseProgress: { $ne: null } },
                    { researchProgress: { $ne: null } },
                    { constructionProgress: { $ne: null } },
                ]
            }).select('_id fleetProgress defenseProgress researchProgress constructionProgress activePlanetId').exec();
            let processedCount = 0;
            for (const user of usersWithProgress) {
                try {
                    let processed = false;
                    if (user.fleetProgress) {
                        const finishTime = new Date(user.fleetProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            let result = await this.fleetService.completeBuild(user._id.toString());
                            while (result.completed) {
                                this.logger.debug(`Fleet build completed for user ${user._id}: ${result.fleet}`);
                                const updatedUser = await this.userModel.findById(user._id).select('fleetProgress').exec();
                                if (!updatedUser?.fleetProgress)
                                    break;
                                if (new Date(updatedUser.fleetProgress.finishTime).getTime() > now)
                                    break;
                                result = await this.fleetService.completeBuild(user._id.toString());
                            }
                            processed = true;
                        }
                    }
                    if (user.defenseProgress) {
                        const finishTime = new Date(user.defenseProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            let result = await this.defenseService.completeBuild(user._id.toString());
                            while (result.completed) {
                                this.logger.debug(`Defense build completed for user ${user._id}: ${result.defense}`);
                                const updatedUser = await this.userModel.findById(user._id).select('defenseProgress').exec();
                                if (!updatedUser?.defenseProgress)
                                    break;
                                if (new Date(updatedUser.defenseProgress.finishTime).getTime() > now)
                                    break;
                                result = await this.defenseService.completeBuild(user._id.toString());
                            }
                            processed = true;
                        }
                    }
                    if (user.researchProgress) {
                        const finishTime = new Date(user.researchProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            const result = await this.researchService.completeResearch(user._id.toString());
                            if (result.completed) {
                                this.logger.debug(`Research completed for user ${user._id}: ${result.research}`);
                            }
                            processed = true;
                        }
                    }
                    if (user.constructionProgress) {
                        const finishTime = new Date(user.constructionProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            const result = await this.buildingsService.completeConstruction(user._id.toString());
                            if (result.completed) {
                                this.logger.debug(`Construction completed for user ${user._id}: ${result.building}`);
                            }
                            processed = true;
                        }
                    }
                    if (processed) {
                        processedCount++;
                    }
                }
                catch (e) {
                    this.logger.warn(`Failed to process build for user ${user._id}: ${e.message}`);
                }
            }
            const planetsWithProgress = await this.planetModel.find({
                $or: [
                    { fleetProgress: { $ne: null } },
                    { defenseProgress: { $ne: null } },
                    { constructionProgress: { $ne: null } },
                ]
            }).exec();
            for (const planet of planetsWithProgress) {
                try {
                    if (planet.fleetProgress) {
                        const finishTime = new Date(planet.fleetProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            await this.completePlanetFleetBuild(planet, now);
                            processedCount++;
                        }
                    }
                    if (planet.defenseProgress) {
                        const finishTime = new Date(planet.defenseProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            await this.completePlanetDefenseBuild(planet, now);
                            processedCount++;
                        }
                    }
                    if (planet.constructionProgress) {
                        const finishTime = new Date(planet.constructionProgress.finishTime).getTime();
                        if (finishTime <= now) {
                            await this.completePlanetConstruction(planet);
                            processedCount++;
                        }
                    }
                }
                catch (e) {
                    this.logger.warn(`Failed to process build for planet ${planet._id}: ${e.message}`);
                }
            }
            if (processedCount > 0) {
                this.logger.log(`Processed ${processedCount} build completions`);
            }
        }
        catch (e) {
            this.logger.error(`Build scheduler error: ${e.message}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async completePlanetFleetBuild(planet, now) {
        if (!planet.fleetProgress)
            return;
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
            const singleBuildTime = this.fleetService.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);
            planet.fleetProgress = {
                type: 'fleet',
                name: fleetType,
                quantity: newRemaining,
                startTime: new Date(),
                finishTime: new Date(Date.now() + singleBuildTime * 1000),
            };
            if (planet.fleetProgress && new Date(planet.fleetProgress.finishTime).getTime() <= now) {
                planet.markModified('fleetProgress');
                await planet.save();
                await this.completePlanetFleetBuild(planet, now);
                return;
            }
        }
        else {
            planet.fleetProgress = null;
        }
        planet.markModified('fleetProgress');
        await planet.save();
        this.logger.debug(`Planet fleet build completed: ${planet._id} - ${fleetType}`);
    }
    async completePlanetDefenseBuild(planet, now) {
        if (!planet.defenseProgress)
            return;
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
            const singleBuildTime = this.defenseService.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);
            planet.defenseProgress = {
                type: 'defense',
                name: defenseType,
                quantity: newRemaining,
                startTime: new Date(),
                finishTime: new Date(Date.now() + singleBuildTime * 1000),
            };
            if (planet.defenseProgress && new Date(planet.defenseProgress.finishTime).getTime() <= now) {
                planet.markModified('defenseProgress');
                await planet.save();
                await this.completePlanetDefenseBuild(planet, now);
                return;
            }
        }
        else {
            planet.defenseProgress = null;
        }
        planet.markModified('defenseProgress');
        await planet.save();
        this.logger.debug(`Planet defense build completed: ${planet._id} - ${defenseType}`);
    }
    async completePlanetConstruction(planet) {
        if (!planet.constructionProgress)
            return;
        const buildingType = planet.constructionProgress.name;
        const isDowngrade = planet.constructionProgress.isDowngrade || false;
        const isMine = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'].includes(buildingType);
        if (isMine) {
            if (!planet.mines)
                planet.mines = {};
            if (isDowngrade) {
                planet.mines[buildingType] = Math.max(0, (planet.mines[buildingType] || 0) - 1);
            }
            else {
                planet.mines[buildingType] = (planet.mines[buildingType] || 0) + 1;
            }
            planet.markModified('mines');
        }
        else {
            if (!planet.facilities)
                planet.facilities = {};
            if (isDowngrade) {
                planet.facilities[buildingType] = Math.max(0, (planet.facilities[buildingType] || 0) - 1);
            }
            else {
                planet.facilities[buildingType] = (planet.facilities[buildingType] || 0) + 1;
            }
            planet.markModified('facilities');
        }
        planet.constructionProgress = null;
        planet.markModified('constructionProgress');
        await planet.save();
        this.logger.debug(`Planet construction completed: ${planet._id} - ${buildingType} (isMine: ${isMine})`);
    }
};
exports.BuildSchedulerService = BuildSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BuildSchedulerService.prototype, "handleBuildProgress", null);
exports.BuildSchedulerService = BuildSchedulerService = BuildSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        fleet_service_1.FleetService,
        defense_service_1.DefenseService,
        research_service_1.ResearchService,
        buildings_service_1.BuildingsService])
], BuildSchedulerService);
//# sourceMappingURL=build-scheduler.service.js.map