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
exports.ColonyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const planet_service_1 = require("../../planet/planet.service");
const message_service_1 = require("../../message/message.service");
const game_data_1 = require("../constants/game-data");
let ColonyService = class ColonyService {
    userModel;
    planetService;
    messageService;
    constructor(userModel, planetService, messageService) {
        this.userModel = userModel;
        this.planetService = planetService;
        this.messageService = messageService;
    }
    calculateDistance(coord1, coord2) {
        const [g1, s1, p1] = coord1.split(':').map(Number);
        const [g2, s2, p2] = coord2.split(':').map(Number);
        if (g1 !== g2) {
            return Math.abs(g1 - g2) * 20000;
        }
        if (s1 !== s2) {
            return Math.abs(s1 - s2) * 95 + 2700;
        }
        return Math.abs(p1 - p2) * 5 + 1000;
    }
    calculateTravelTime(distance, fleetSpeed) {
        const speedPercent = 100;
        return Math.round((35000 / speedPercent * Math.sqrt(distance * 10 / fleetSpeed) + 10));
    }
    getFleetMinSpeed(fleet, researchLevels) {
        let minSpeed = Infinity;
        for (const [shipType, count] of Object.entries(fleet)) {
            if (count > 0) {
                const shipData = game_data_1.FLEET_DATA[shipType];
                if (shipData && shipData.stats.speed > 0) {
                    const speed = (0, game_data_1.calculateShipSpeed)(shipType, researchLevels);
                    if (speed < minSpeed) {
                        minSpeed = speed;
                    }
                }
            }
        }
        return minSpeed === Infinity ? 1 : minSpeed;
    }
    calculateFuelConsumption(fleet, distance, travelTime) {
        let totalFuel = 0;
        for (const [shipType, count] of Object.entries(fleet)) {
            if (count > 0) {
                const shipData = game_data_1.FLEET_DATA[shipType];
                if (shipData) {
                    const baseFuel = shipData.stats.fuelConsumption || 0;
                    totalFuel += baseFuel * count * (1 + distance / 35000);
                }
            }
        }
        return Math.ceil(totalFuel);
    }
    async startColonization(userId, targetCoord, fleet) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (user.pendingAttack) {
            throw new common_1.BadRequestException('이미 진행 중인 함대 미션이 있습니다.');
        }
        const colonyShipCount = fleet.colonyShip || 0;
        if (colonyShipCount < 1) {
            throw new common_1.BadRequestException('식민선이 최소 1대 이상 필요합니다.');
        }
        for (const [shipType, count] of Object.entries(fleet)) {
            if (count > 0) {
                const available = user.fleet[shipType] || 0;
                if (available < count) {
                    throw new common_1.BadRequestException(`${shipType} 보유량이 부족합니다. (보유: ${available}, 필요: ${count})`);
                }
            }
        }
        const [galaxy, system, position] = targetCoord.split(':').map(Number);
        if (!galaxy || !system || !position || position < 1 || position > 15) {
            throw new common_1.BadRequestException('유효하지 않은 좌표입니다.');
        }
        const isEmpty = await this.planetService.isCoordinateEmpty(targetCoord);
        if (!isEmpty) {
            throw new common_1.BadRequestException('해당 좌표에 이미 행성이 존재합니다.');
        }
        const planetCount = await this.planetService.getPlanetCount(userId);
        if (planetCount >= planet_service_1.MAX_PLANETS) {
            throw new common_1.BadRequestException(`최대 행성 수(${planet_service_1.MAX_PLANETS}개)에 도달했습니다.`);
        }
        const distance = this.calculateDistance(user.coordinate, targetCoord);
        const fleetSpeed = this.getFleetMinSpeed(fleet, user.researchLevels);
        const travelTime = this.calculateTravelTime(distance, fleetSpeed);
        const fuelNeeded = this.calculateFuelConsumption(fleet, distance, travelTime);
        if ((user.resources?.deuterium || 0) < fuelNeeded) {
            throw new common_1.BadRequestException(`듀테륨이 부족합니다. (필요: ${fuelNeeded}, 보유: ${user.resources?.deuterium || 0})`);
        }
        for (const [shipType, count] of Object.entries(fleet)) {
            if (count > 0) {
                user.fleet[shipType] -= count;
            }
        }
        user.resources.deuterium -= fuelNeeded;
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + travelTime * 1000);
        user.pendingAttack = {
            targetCoord,
            targetUserId: '',
            fleet,
            capacity: this.calculateCargoCapacity(fleet),
            travelTime,
            startTime: now,
            arrivalTime,
            battleCompleted: false,
            transportResources: undefined,
        };
        await user.save();
        return {
            success: true,
            message: `식민 함대가 ${targetCoord}를 향해 출발했습니다.`,
            arrivalTime,
        };
    }
    async completeColonization(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingAttack) {
            return { success: false, colonized: false, message: '진행 중인 미션이 없습니다.' };
        }
        if (user.pendingAttack.targetUserId !== '') {
            return { success: false, colonized: false, message: '식민 미션이 아닙니다.' };
        }
        if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
            return { success: false, colonized: false, message: '아직 도착하지 않았습니다.' };
        }
        const targetCoord = user.pendingAttack.targetCoord;
        const fleet = user.pendingAttack.fleet;
        const isEmpty = await this.planetService.isCoordinateEmpty(targetCoord);
        const planetCount = await this.planetService.getPlanetCount(userId);
        let colonized = false;
        let planetId;
        let planetName;
        let message;
        if (!isEmpty) {
            message = `${targetCoord} 좌표에 이미 다른 행성이 존재합니다. 식민에 실패했습니다.`;
        }
        else if (planetCount >= planet_service_1.MAX_PLANETS) {
            message = `최대 행성 수(${planet_service_1.MAX_PLANETS}개)에 도달하여 식민에 실패했습니다.`;
        }
        else {
            planetName = `식민지 ${planetCount + 1}`;
            try {
                const newPlanet = await this.planetService.createPlanet(userId, targetCoord, planetName, false);
                planetId = newPlanet._id.toString();
                colonized = true;
                message = `${targetCoord}에 새로운 식민지 "${planetName}"이(가) 건설되었습니다!`;
                fleet.colonyShip = Math.max(0, (fleet.colonyShip || 1) - 1);
            }
            catch (error) {
                message = `식민 중 오류가 발생했습니다: ${error.message}`;
            }
        }
        const returnFleet = { ...fleet };
        const hasReturnFleet = Object.values(returnFleet).some(count => count > 0);
        if (hasReturnFleet) {
            const returnTime = new Date(Date.now() + user.pendingAttack.travelTime * 1000);
            user.pendingReturn = {
                fleet: returnFleet,
                loot: { metal: 0, crystal: 0, deuterium: 0 },
                returnTime,
                startTime: new Date(),
                missionType: 'colonize',
            };
        }
        user.pendingAttack = null;
        await user.save();
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '함대 사령부',
            title: colonized ? `식민 성공: ${targetCoord}` : `식민 실패: ${targetCoord}`,
            content: message,
            type: 'system',
        });
        return { success: true, colonized, message, planetId, planetName };
    }
    async completeReturn(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingReturn) {
            return { success: false, message: '귀환 중인 함대가 없습니다.' };
        }
        if (user.pendingReturn.returnTime.getTime() > Date.now()) {
            return { success: false, message: '아직 귀환하지 않았습니다.' };
        }
        for (const [shipType, count] of Object.entries(user.pendingReturn.fleet)) {
            if (count > 0) {
                user.fleet[shipType] = (user.fleet[shipType] || 0) + count;
            }
        }
        user.pendingReturn = null;
        await user.save();
        return { success: true, message: '함대가 귀환했습니다.' };
    }
    calculateCargoCapacity(fleet) {
        let totalCapacity = 0;
        for (const [shipType, count] of Object.entries(fleet)) {
            if (count > 0) {
                const shipData = game_data_1.FLEET_DATA[shipType];
                if (shipData) {
                    totalCapacity += (shipData.stats.cargo || 0) * count;
                }
            }
        }
        return totalCapacity;
    }
    async recallColonization(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingAttack) {
            throw new common_1.BadRequestException('진행 중인 미션이 없습니다.');
        }
        if (user.pendingAttack.targetUserId !== '') {
            throw new common_1.BadRequestException('식민 미션이 아닙니다.');
        }
        const now = new Date();
        const elapsedTime = now.getTime() - user.pendingAttack.startTime.getTime();
        const returnTime = new Date(now.getTime() + elapsedTime);
        user.pendingReturn = {
            fleet: user.pendingAttack.fleet,
            loot: { metal: 0, crystal: 0, deuterium: 0 },
            returnTime,
            startTime: now,
            missionType: 'colonize',
        };
        user.pendingAttack = null;
        await user.save();
        return { success: true, message: '식민 함대가 귀환합니다.' };
    }
};
exports.ColonyService = ColonyService;
exports.ColonyService = ColonyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => planet_service_1.PlanetService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        planet_service_1.PlanetService,
        message_service_1.MessageService])
], ColonyService);
//# sourceMappingURL=colony.service.js.map