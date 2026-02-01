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
exports.CheckInService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const resources_service_1 = require("./resources.service");
let CheckInService = class CheckInService {
    userModel;
    resourcesService;
    constructor(userModel, resourcesService) {
        this.userModel = userModel;
        this.resourcesService = resourcesService;
    }
    getTodayDateKST() {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset);
        return kstDate.toISOString().split('T')[0];
    }
    getYesterdayDateKST() {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset - 24 * 60 * 60 * 1000);
        return kstDate.toISOString().split('T')[0];
    }
    getWeekStartDateKST() {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset);
        const dayOfWeek = kstDate.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
        const monday = new Date(kstDate.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
        return monday.toISOString().split('T')[0];
    }
    getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = d1.getTime() - d2.getTime();
        return Math.floor(diffTime / (24 * 60 * 60 * 1000));
    }
    isSameDate(date1, date2) {
        if (!date1)
            return false;
        return date1.substring(0, 10) === date2.substring(0, 10);
    }
    getRewardHours(streak) {
        if (streak <= 2)
            return 2;
        if (streak <= 6)
            return 3;
        return 5;
    }
    calculateHourlyProduction(user) {
        const mines = user.mines;
        const facilities = user.facilities;
        const fleet = user.fleet;
        const operationRates = user.operationRates || {
            metalMine: 100,
            crystalMine: 100,
            deuteriumMine: 100,
            solarPlant: 100,
            fusionReactor: 100,
            solarSatellite: 100,
        };
        const solarPlantEnergy = this.resourcesService.getEnergyProduction(mines?.solarPlant || 0) * ((operationRates.solarPlant || 100) / 100);
        const fusionEnergy = this.resourcesService.getFusionEnergyProduction(mines?.fusionReactor || 0) * ((operationRates.fusionReactor || 100) / 100);
        const satelliteCount = fleet?.solarSatellite || 0;
        const planetTemperature = user.planetInfo?.temperature ?? 50;
        const satelliteEnergy = this.resourcesService.getSatelliteEnergy(satelliteCount, planetTemperature) * ((operationRates.solarSatellite || 100) / 100);
        const totalEnergyProduction = solarPlantEnergy + fusionEnergy + satelliteEnergy;
        const metalEnergyConsumption = this.resourcesService.getEnergyConsumption(mines?.metalMine || 0, 'metal') * ((operationRates.metalMine || 100) / 100);
        const crystalEnergyConsumption = this.resourcesService.getEnergyConsumption(mines?.crystalMine || 0, 'crystal') * ((operationRates.crystalMine || 100) / 100);
        const deuteriumEnergyConsumption = this.resourcesService.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium') * ((operationRates.deuteriumMine || 100) / 100);
        const totalEnergyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deuteriumEnergyConsumption;
        let energyRatio = 1.0;
        if (totalEnergyProduction < totalEnergyConsumption) {
            energyRatio = Math.max(0.1, totalEnergyProduction / totalEnergyConsumption);
        }
        const metalProduction = this.resourcesService.getResourceProduction(mines?.metalMine || 0, 'metal') * ((operationRates.metalMine || 100) / 100) * energyRatio;
        const crystalProduction = this.resourcesService.getResourceProduction(mines?.crystalMine || 0, 'crystal') * ((operationRates.crystalMine || 100) / 100) * energyRatio;
        const deuteriumProduction = this.resourcesService.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium') * ((operationRates.deuteriumMine || 100) / 100) * energyRatio;
        const fusionDeuteriumConsumption = this.resourcesService.getFusionDeuteriumConsumption(mines?.fusionReactor || 0) * ((operationRates.fusionReactor || 100) / 100);
        return {
            metal: Math.floor(metalProduction),
            crystal: Math.floor(crystalProduction),
            deuterium: Math.floor(deuteriumProduction - fusionDeuteriumConsumption),
        };
    }
    calculateWeekDays(lastCheckInDate, streak, weekStartDate) {
        const weekDays = [false, false, false, false, false, false, false];
        const currentWeekStart = this.getWeekStartDateKST();
        if (!weekStartDate || !this.isSameDate(weekStartDate, currentWeekStart)) {
            return weekDays;
        }
        if (!lastCheckInDate)
            return weekDays;
        const today = this.getTodayDateKST();
        const todayDate = new Date(today);
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstTodayDate = new Date(todayDate.getTime() + kstOffset);
        const todayDayOfWeek = kstTodayDate.getUTCDay();
        const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
        for (let i = 0; i < streak && i <= todayIndex; i++) {
            const dayIndex = todayIndex - i;
            if (dayIndex >= 0 && dayIndex < 7) {
                weekDays[dayIndex] = true;
            }
        }
        return weekDays;
    }
    async getCheckInStatus(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        const checkIn = user.checkIn || { lastCheckInDate: null, checkInStreak: 0, weekStartDate: null };
        const today = this.getTodayDateKST();
        const yesterday = this.getYesterdayDateKST();
        const currentWeekStart = this.getWeekStartDateKST();
        const todayCheckedIn = this.isSameDate(checkIn.lastCheckInDate, today);
        let currentStreak = checkIn.checkInStreak || 0;
        if (!this.isSameDate(checkIn.weekStartDate, currentWeekStart)) {
            currentStreak = 0;
        }
        else if (!todayCheckedIn && !this.isSameDate(checkIn.lastCheckInDate, yesterday)) {
            currentStreak = 0;
        }
        const nextStreak = todayCheckedIn ? currentStreak : Math.min(currentStreak + 1, 7);
        if (nextStreak === 0) {
        }
        const rewardStreak = todayCheckedIn ? currentStreak : (currentStreak === 0 ? 1 : Math.min(currentStreak + 1, 7));
        const rewardHours = this.getRewardHours(rewardStreak);
        const hourlyProduction = this.calculateHourlyProduction(user);
        const nextReward = {
            metal: Math.floor(hourlyProduction.metal * rewardHours),
            crystal: Math.floor(hourlyProduction.crystal * rewardHours),
            deuterium: Math.floor(hourlyProduction.deuterium * rewardHours),
        };
        const weekDays = this.calculateWeekDays(checkIn.lastCheckInDate, currentStreak, checkIn.weekStartDate);
        return {
            streak: currentStreak,
            canCheckIn: !todayCheckedIn,
            weekDays,
            rewardHours,
            nextReward,
            todayCheckedIn,
        };
    }
    async checkIn(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        const checkIn = user.checkIn || { lastCheckInDate: null, checkInStreak: 0, weekStartDate: null };
        const today = this.getTodayDateKST();
        const yesterday = this.getYesterdayDateKST();
        const currentWeekStart = this.getWeekStartDateKST();
        if (this.isSameDate(checkIn.lastCheckInDate, today)) {
            return {
                success: false,
                streak: checkIn.checkInStreak,
                rewardHours: 0,
                reward: { metal: 0, crystal: 0, deuterium: 0 },
                message: '오늘은 이미 출석했습니다.',
            };
        }
        let newStreak = 1;
        if (!this.isSameDate(checkIn.weekStartDate, currentWeekStart)) {
            newStreak = 1;
        }
        else if (this.isSameDate(checkIn.lastCheckInDate, yesterday)) {
            newStreak = Math.min((checkIn.checkInStreak || 0) + 1, 7);
        }
        else {
            newStreak = 1;
        }
        if (newStreak > 7) {
            newStreak = 1;
        }
        const rewardHours = this.getRewardHours(newStreak);
        const hourlyProduction = this.calculateHourlyProduction(user);
        const reward = {
            metal: Math.floor(hourlyProduction.metal * rewardHours),
            crystal: Math.floor(hourlyProduction.crystal * rewardHours),
            deuterium: Math.floor(hourlyProduction.deuterium * rewardHours),
        };
        user.resources.metal = (user.resources.metal || 0) + reward.metal;
        user.resources.crystal = (user.resources.crystal || 0) + reward.crystal;
        user.resources.deuterium = (user.resources.deuterium || 0) + reward.deuterium;
        user.checkIn = {
            lastCheckInDate: today,
            checkInStreak: newStreak,
            weekStartDate: currentWeekStart,
        };
        user.markModified('resources');
        user.markModified('checkIn');
        await user.save();
        return {
            success: true,
            streak: newStreak,
            rewardHours,
            reward,
            message: `${newStreak}일차 출석 완료! ${rewardHours}시간 분량의 자원을 받았습니다.`,
        };
    }
};
exports.CheckInService = CheckInService;
exports.CheckInService = CheckInService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        resources_service_1.ResourcesService])
], CheckInService);
//# sourceMappingURL=check-in.service.js.map