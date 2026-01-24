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
var FleetSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const battle_service_1 = require("./battle.service");
const colony_service_1 = require("./colony.service");
const galaxy_service_1 = require("../../galaxy/galaxy.service");
let FleetSchedulerService = FleetSchedulerService_1 = class FleetSchedulerService {
    userModel;
    battleService;
    colonyService;
    galaxyService;
    logger = new common_1.Logger(FleetSchedulerService_1.name);
    isProcessing = false;
    constructor(userModel, battleService, colonyService, galaxyService) {
        this.userModel = userModel;
        this.battleService = battleService;
        this.colonyService = colonyService;
        this.galaxyService = galaxyService;
    }
    async handleFleetMissions() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        const now = Date.now();
        try {
            const usersWithMissions = await this.userModel.find({
                $or: [
                    { 'fleetMissions.0': { $exists: true } },
                    { pendingAttack: { $ne: null } },
                    { pendingReturn: { $ne: null } },
                ]
            }).select('_id fleetMissions pendingAttack pendingReturn').exec();
            let processedCount = 0;
            for (const user of usersWithMissions) {
                try {
                    const completedMissionIds = this.getCompletedMissionIds(user, now);
                    if (completedMissionIds.length > 0 || this.hasLegacyCompletedMission(user, now)) {
                        for (const missionInfo of completedMissionIds) {
                            try {
                                if (missionInfo.phase === 'outbound') {
                                    switch (missionInfo.missionType) {
                                        case 'attack':
                                            await this.battleService.processAttackArrival(user._id.toString(), missionInfo.missionId);
                                            break;
                                        case 'recycle':
                                            await this.battleService.processRecycleArrival(user._id.toString(), missionInfo.missionId);
                                            break;
                                        case 'transport':
                                            await this.battleService.processTransportArrival(user._id.toString(), missionInfo.missionId);
                                            break;
                                        case 'deploy':
                                            await this.battleService.processDeployArrival(user._id.toString(), missionInfo.missionId);
                                            break;
                                        case 'colony':
                                            await this.colonyService.completeColonization(user._id.toString());
                                            break;
                                        case 'spy':
                                            await this.galaxyService.processSpyArrival(user._id.toString(), missionInfo.missionId);
                                            break;
                                    }
                                }
                                else if (missionInfo.phase === 'returning') {
                                    await this.battleService.processFleetReturn(user._id.toString(), missionInfo.missionId);
                                }
                            }
                            catch (missionError) {
                                this.logger.warn(`Failed to process mission ${missionInfo.missionId}: ${missionError.message}`);
                            }
                        }
                        await this.battleService.processAttackArrival(user._id.toString());
                        await this.battleService.processRecycleArrival(user._id.toString());
                        await this.battleService.processIncomingAttacks(user._id.toString());
                        await this.battleService.processFleetReturn(user._id.toString());
                        await this.battleService.processTransportArrival(user._id.toString());
                        await this.battleService.processDeployArrival(user._id.toString());
                        await this.colonyService.completeColonization(user._id.toString());
                        processedCount++;
                    }
                }
                catch (e) {
                    this.logger.warn(`Failed to process missions for user ${user._id}: ${e.message}`);
                }
            }
            if (processedCount > 0) {
                this.logger.log(`Processed ${processedCount} users' fleet missions`);
            }
        }
        catch (e) {
            this.logger.error(`Fleet scheduler error: ${e.message}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    getCompletedMissionIds(user, now) {
        const completedMissions = [];
        if (user.fleetMissions && user.fleetMissions.length > 0) {
            for (const mission of user.fleetMissions) {
                if (mission.phase === 'outbound') {
                    const arrivalTime = new Date(mission.arrivalTime).getTime();
                    if (arrivalTime <= now) {
                        completedMissions.push({
                            missionId: mission.missionId,
                            missionType: mission.missionType,
                            phase: 'outbound',
                        });
                    }
                }
                else if (mission.phase === 'returning') {
                    const returnTime = new Date(mission.returnTime).getTime();
                    if (returnTime && returnTime <= now) {
                        completedMissions.push({
                            missionId: mission.missionId,
                            missionType: mission.missionType,
                            phase: 'returning',
                        });
                    }
                }
            }
        }
        return completedMissions;
    }
    hasLegacyCompletedMission(user, now) {
        if (user.pendingAttack && !user.pendingAttack.battleCompleted) {
            const arrivalTime = new Date(user.pendingAttack.arrivalTime).getTime();
            if (arrivalTime <= now)
                return true;
        }
        if (user.pendingReturn) {
            const returnTime = new Date(user.pendingReturn.returnTime).getTime();
            if (returnTime <= now)
                return true;
        }
        return false;
    }
    hasCompletedMission(user, now) {
        return this.getCompletedMissionIds(user, now).length > 0 || this.hasLegacyCompletedMission(user, now);
    }
};
exports.FleetSchedulerService = FleetSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetSchedulerService.prototype, "handleFleetMissions", null);
exports.FleetSchedulerService = FleetSchedulerService = FleetSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => galaxy_service_1.GalaxyService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        battle_service_1.BattleService,
        colony_service_1.ColonyService,
        galaxy_service_1.GalaxyService])
], FleetSchedulerService);
//# sourceMappingURL=fleet-scheduler.service.js.map