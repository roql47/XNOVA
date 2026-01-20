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
exports.GalaxyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../user/schemas/user.schema");
const planet_schema_1 = require("../planet/schemas/planet.schema");
const debris_schema_1 = require("./schemas/debris.schema");
const message_service_1 = require("../message/message.service");
const game_data_1 = require("../game/constants/game-data");
const DEBRIS_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;
let GalaxyService = class GalaxyService {
    userModel;
    planetModel;
    debrisModel;
    messageService;
    constructor(userModel, planetModel, debrisModel, messageService) {
        this.userModel = userModel;
        this.planetModel = planetModel;
        this.debrisModel = debrisModel;
        this.messageService = messageService;
    }
    async cleanupExpiredDebris() {
        const expiryDate = new Date(Date.now() - DEBRIS_EXPIRY_MS);
        const result = await this.debrisModel.deleteMany({
            createdAt: { $lt: expiryDate },
        }).exec();
        return result.deletedCount || 0;
    }
    isDebrisExpired(debris) {
        if (!debris.createdAt)
            return false;
        const createdAt = debris.createdAt;
        return Date.now() - createdAt.getTime() > DEBRIS_EXPIRY_MS;
    }
    async getGalaxyMap(galaxy, system, currentUserId) {
        const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
        const expiryDate = new Date(Date.now() - DEBRIS_EXPIRY_MS);
        const [players, colonies, debrisFields] = await Promise.all([
            this.userModel.find({ coordinate: pattern }).exec(),
            this.planetModel.find({ coordinate: pattern }).populate('ownerId').exec(),
            this.debrisModel.find({
                coordinate: pattern,
                createdAt: { $gte: expiryDate },
            }).exec(),
            this.userModel.findByIdAndUpdate(currentUserId, { lastActivity: new Date() }).exec(),
            this.cleanupExpiredDebris(),
        ]);
        const planets = [];
        for (let position = 1; position <= 15; position++) {
            const coord = `${galaxy}:${system}:${position}`;
            const player = players.find(p => p.coordinate === coord);
            const colony = colonies.find(c => c.coordinate === coord);
            const debris = debrisFields.find(d => d.coordinate === coord);
            let info;
            if (player) {
                info = {
                    position,
                    coordinate: coord,
                    playerName: player.playerName,
                    playerId: player._id.toString(),
                    isOwnPlanet: player._id.toString() === currentUserId,
                    isColony: false,
                    ownerName: null,
                    hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
                    debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
                    hasMoon: false,
                    lastActivity: player?.lastActivity ? player.lastActivity.toISOString() : null,
                };
            }
            else if (colony) {
                const owner = colony.ownerId;
                const ownerId = typeof owner === 'string' ? owner : owner?._id?.toString() || owner?.toString();
                const ownerName = typeof owner === 'object' ? owner?.playerName : null;
                info = {
                    position,
                    coordinate: coord,
                    playerName: ownerName || colony.name || '식민지',
                    playerId: ownerId,
                    isOwnPlanet: ownerId === currentUserId,
                    isColony: true,
                    ownerName: ownerName || null,
                    hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
                    debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
                    hasMoon: false,
                    lastActivity: null,
                };
            }
            else {
                info = {
                    position,
                    coordinate: coord,
                    playerName: null,
                    playerId: null,
                    isOwnPlanet: false,
                    isColony: false,
                    ownerName: null,
                    hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
                    debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
                    hasMoon: false,
                    lastActivity: null,
                };
            }
            planets.push(info);
        }
        return planets;
    }
    async updateDebris(coordinate, metal, crystal) {
        let debris = await this.debrisModel.findOne({ coordinate }).exec();
        if (debris) {
            debris.metal += metal;
            debris.crystal += crystal;
            await debris.save();
        }
        else if (metal > 0 || crystal > 0) {
            debris = new this.debrisModel({
                coordinate,
                metal,
                crystal,
            });
            await debris.save();
        }
    }
    async getDebris(coordinate) {
        const debris = await this.debrisModel.findOne({ coordinate }).exec();
        if (!debris)
            return null;
        if (this.isDebrisExpired(debris)) {
            await this.debrisModel.deleteOne({ coordinate }).exec();
            return null;
        }
        return debris;
    }
    async consumeDebris(coordinate, metal, crystal) {
        const debris = await this.debrisModel.findOne({ coordinate }).exec();
        if (debris) {
            debris.metal = Math.max(0, debris.metal - metal);
            debris.crystal = Math.max(0, debris.crystal - crystal);
            if (debris.metal === 0 && debris.crystal === 0) {
                await this.debrisModel.deleteOne({ coordinate }).exec();
            }
            else {
                await debris.save();
            }
        }
    }
    async getPlayerInfo(targetUserId, currentUserId) {
        const target = await this.userModel.findById(targetUserId).exec();
        if (!target)
            return null;
        const isOwn = targetUserId === currentUserId;
        return {
            playerName: target.playerName,
            coordinate: target.coordinate,
            isOwnPlanet: isOwn,
            ...(isOwn && {
                resources: target.resources,
                mines: target.mines,
                facilities: target.facilities,
            }),
        };
    }
    async findPlayerByCoordinate(coordinate) {
        return this.userModel.findOne({ coordinate }).exec();
    }
    async getActiveSystems(galaxy) {
        const pattern = new RegExp(`^${galaxy}:\\d+:\\d+$`);
        const players = await this.userModel.find({ coordinate: pattern }).select('coordinate').exec();
        const systems = new Set();
        for (const player of players) {
            const parts = player.coordinate.split(':');
            systems.add(parseInt(parts[1]));
        }
        return Array.from(systems).sort((a, b) => a - b);
    }
    async findPlanetByCoordinate(coordinate) {
        const user = await this.userModel.findOne({ coordinate }).exec();
        if (user) {
            return { user, planet: null, ownerId: user._id.toString(), isColony: false };
        }
        const planet = await this.planetModel.findOne({ coordinate }).exec();
        if (planet) {
            const owner = await this.userModel.findById(planet.ownerId).exec();
            return { user: owner, planet, ownerId: planet.ownerId, isColony: true };
        }
        return { user: null, planet: null, ownerId: null, isColony: false };
    }
    async spyOnPlanet(attackerId, targetCoord, probeCount) {
        const attacker = await this.userModel.findById(attackerId).exec();
        if (!attacker) {
            return { success: false, error: '사용자를 찾을 수 없습니다.' };
        }
        const availableProbes = attacker.fleet?.espionageProbe || 0;
        if (availableProbes < probeCount) {
            return { success: false, error: `정찰 위성이 부족합니다. (보유: ${availableProbes})` };
        }
        const targetResult = await this.findPlanetByCoordinate(targetCoord);
        if (!targetResult.ownerId) {
            return { success: false, error: '해당 좌표에 행성이 없습니다.' };
        }
        const targetOwner = targetResult.user;
        const targetPlanet = targetResult.planet;
        const isColony = targetResult.isColony;
        if (targetResult.ownerId === attackerId) {
            return { success: false, error: '자신의 행성은 정찰할 수 없습니다.' };
        }
        if (!targetOwner) {
            return { success: false, error: '대상 행성의 소유자를 찾을 수 없습니다.' };
        }
        const mySpyLevel = attacker.researchLevels?.espionageTech || 0;
        const targetSpyLevel = targetOwner.researchLevels?.espionageTech || 0;
        let stScore;
        if (targetSpyLevel > mySpyLevel) {
            const diff = targetSpyLevel - mySpyLevel;
            stScore = probeCount - Math.pow(diff, 2);
        }
        else if (mySpyLevel > targetSpyLevel) {
            const diff = mySpyLevel - targetSpyLevel;
            stScore = probeCount + Math.pow(diff, 2);
        }
        else {
            stScore = mySpyLevel;
        }
        const targetFleet = isColony ? (targetPlanet?.fleet || {}) : (targetOwner.fleet || {});
        const targetFleetCount = this.getTotalFleetCount(targetFleet);
        let targetForce = (targetFleetCount * probeCount) / 4;
        if (targetForce > 100)
            targetForce = 100;
        const targetChance = Math.random() * targetForce;
        const spyerChance = Math.random() * 100;
        const probesDestroyed = targetChance >= spyerChance;
        let probesLost = 0;
        let probesSurvived = probeCount;
        if (probesDestroyed) {
            probesLost = probeCount;
            probesSurvived = 0;
            attacker.fleet.espionageProbe -= probeCount;
            await this.updateDebris(targetCoord, 0, probeCount * 300);
            await attacker.save();
        }
        const report = this.generateSpyReport(targetOwner, targetPlanet, isColony, stScore, probesLost, probesSurvived, targetCoord, mySpyLevel, targetSpyLevel);
        await this.messageService.createMessage({
            receiverId: attackerId,
            senderName: '함대 사령부',
            title: `정찰 보고서: ${targetCoord} [${targetOwner.playerName}]${isColony ? ' (식민지)' : ''}`,
            content: this.formatSpyReportContent(report),
            type: 'battle',
            metadata: { type: 'spy', report },
        });
        await this.messageService.createMessage({
            receiverId: targetResult.ownerId,
            senderName: '방어 시스템',
            title: `정찰 감지: ${attacker.coordinate}`,
            content: `적 함대가 ${attacker.coordinate}에서 당신의 ${isColony ? '식민지' : '행성'}(${targetCoord})을 정찰했습니다.\n\n` +
                `정찰 위성 ${probeCount}대가 발견되었습니다.` +
                (probesDestroyed ? `\n방어 시스템에 의해 모든 정찰 위성이 파괴되었습니다.` : ''),
            type: 'battle',
            metadata: { type: 'spy_alert', attackerCoord: attacker.coordinate },
        });
        return {
            success: true,
            report,
            message: probesDestroyed
                ? `정찰 완료. 정찰 위성 ${probesLost}대가 파괴되었습니다.`
                : `정찰 완료. 정찰 위성 ${probesSurvived}대가 귀환했습니다.`,
        };
    }
    getTotalFleetCount(fleet) {
        if (!fleet)
            return 0;
        return ((fleet.smallCargo || 0) +
            (fleet.largeCargo || 0) +
            (fleet.lightFighter || 0) +
            (fleet.heavyFighter || 0) +
            (fleet.cruiser || 0) +
            (fleet.battleship || 0) +
            (fleet.battlecruiser || 0) +
            (fleet.bomber || 0) +
            (fleet.destroyer || 0) +
            (fleet.deathstar || 0) +
            (fleet.recycler || 0) +
            (fleet.espionageProbe || 0) +
            (fleet.solarSatellite || 0));
    }
    calculateCurrentResourcesForSpy(owner, planet, isColony) {
        const now = new Date();
        const resources = isColony ? (planet?.resources || {}) : (owner.resources || {});
        const mines = isColony ? (planet?.mines || {}) : (owner.mines || {});
        const fleet = isColony ? (planet?.fleet || {}) : (owner.fleet || {});
        const lastUpdate = isColony ? (planet?.lastResourceUpdate || now) : (owner.lastResourceUpdate || now);
        const planetTemperature = isColony
            ? (planet?.planetInfo?.tempMax ?? 50)
            : (owner.planetInfo?.temperature ?? 50);
        const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
        const solarPlantLevel = mines.solarPlant || 0;
        const fusionLevel = mines.fusionReactor || 0;
        const satelliteCount = fleet.solarSatellite || 0;
        const solarEnergy = solarPlantLevel > 0 ? Math.floor(20 * solarPlantLevel * Math.pow(1.1, solarPlantLevel)) : 0;
        const satelliteEnergy = satelliteCount > 0 ? Math.floor((planetTemperature / 4 + 20) * satelliteCount) : 0;
        const fusionEnergy = fusionLevel > 0 ? Math.floor(30 * fusionLevel * Math.pow(1.05, fusionLevel)) : 0;
        const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;
        const metalMineLevel = mines.metalMine || 0;
        const crystalMineLevel = mines.crystalMine || 0;
        const deuteriumMineLevel = mines.deuteriumMine || 0;
        let energyConsumption = 0;
        if (metalMineLevel > 0)
            energyConsumption += Math.floor(10 * metalMineLevel * Math.pow(1.1, metalMineLevel));
        if (crystalMineLevel > 0)
            energyConsumption += Math.floor(10 * crystalMineLevel * Math.pow(1.1, crystalMineLevel));
        if (deuteriumMineLevel > 0)
            energyConsumption += Math.floor(20 * deuteriumMineLevel * Math.pow(1.05, deuteriumMineLevel));
        let energyRatio = 1.0;
        if (energyProduction < energyConsumption) {
            energyRatio = Math.max(0.1, energyProduction / energyConsumption);
        }
        const SPEED_MULTIPLIER = 5;
        const metalProduction = Math.floor(90 * (metalMineLevel + 1) * Math.pow(1.1, metalMineLevel + 1) * SPEED_MULTIPLIER) * energyRatio;
        const crystalProduction = Math.floor(60 * (crystalMineLevel + 1) * Math.pow(1.1, crystalMineLevel + 1) * SPEED_MULTIPLIER) * energyRatio;
        const deuteriumProduction = Math.floor(30 * (deuteriumMineLevel + 1) * Math.pow(1.1, deuteriumMineLevel + 1) * SPEED_MULTIPLIER) * energyRatio;
        const fusionConsumption = fusionLevel > 0 ? Math.floor(10 * fusionLevel * Math.pow(1.1, fusionLevel)) : 0;
        const hoursElapsed = elapsedSeconds / 3600;
        return {
            metal: (resources.metal || 0) + metalProduction * hoursElapsed,
            crystal: (resources.crystal || 0) + crystalProduction * hoursElapsed,
            deuterium: (resources.deuterium || 0) + (deuteriumProduction - fusionConsumption) * hoursElapsed,
            energy: energyProduction - energyConsumption,
        };
    }
    generateSpyReport(owner, planet, isColony, stScore, probesLost, probesSurvived, targetCoord, mySpyLevel, targetSpyLevel) {
        const report = {
            targetCoord,
            targetName: owner.playerName + (isColony ? ' (식민지)' : ''),
            probesLost,
            probesSurvived,
            stScore,
            mySpyLevel,
            targetSpyLevel,
        };
        const targetFleet = isColony ? (planet?.fleet || {}) : (owner.fleet || {});
        const targetDefense = isColony ? (planet?.defense || {}) : (owner.defense || {});
        const targetMines = isColony ? (planet?.mines || {}) : (owner.mines || {});
        const targetFacilities = isColony ? (planet?.facilities || {}) : (owner.facilities || {});
        if (stScore >= 1) {
            const currentResources = this.calculateCurrentResourcesForSpy(owner, planet, isColony);
            report.resources = {
                metal: currentResources.metal,
                crystal: currentResources.crystal,
                deuterium: currentResources.deuterium,
                energy: currentResources.energy,
            };
        }
        if (stScore >= 2) {
            report.fleet = this.filterNonZero(targetFleet);
        }
        if (stScore >= 3) {
            report.defense = this.filterNonZero(targetDefense);
        }
        if (stScore >= 5) {
            const buildings = {
                ...this.filterNonZero(targetMines),
                ...this.filterNonZero(targetFacilities),
            };
            report.buildings = Object.keys(buildings).length > 0 ? buildings : { _empty: 0 };
        }
        if (stScore >= 7) {
            const research = this.filterNonZero(owner.researchLevels);
            report.research = Object.keys(research).length > 0 ? research : { _empty: 0 };
        }
        return report;
    }
    filterNonZero(obj) {
        if (!obj)
            return {};
        const plainObj = obj.toObject ? obj.toObject() : obj;
        const result = {};
        for (const [key, value] of Object.entries(plainObj)) {
            if (key.startsWith('_') || key === '__v')
                continue;
            if (typeof value === 'number' && value > 0) {
                result[key] = value;
            }
        }
        return result;
    }
    formatSpyReportContent(report) {
        let content = `=== 정찰 보고서 ===\n`;
        content += `대상: ${report.targetName} [${report.targetCoord}]\n`;
        content += `정찰 위성: ${report.probesSurvived}대 귀환, ${report.probesLost}대 손실\n`;
        content += `ST 점수: ${report.stScore} (내 정탐기술: Lv.${report.mySpyLevel}, 상대 정탐기술: Lv.${report.targetSpyLevel})\n`;
        content += `※ ST≥2: 함대, ST≥3: 방어, ST≥5: 건물, ST≥7: 연구\n\n`;
        if (report.resources) {
            content += `【 자원 현황 】\n`;
            content += `메탈: ${Math.floor(report.resources.metal).toLocaleString()}\n`;
            content += `크리스탈: ${Math.floor(report.resources.crystal).toLocaleString()}\n`;
            content += `듀테륨: ${Math.floor(report.resources.deuterium).toLocaleString()}\n`;
            content += `에너지: ${Math.floor(report.resources.energy).toLocaleString()}\n\n`;
        }
        if (report.fleet) {
            content += `【 함대 】\n`;
            if (Object.keys(report.fleet).length === 0) {
                content += `함대 없음\n`;
            }
            else {
                for (const [key, value] of Object.entries(report.fleet)) {
                    const name = game_data_1.NAME_MAPPING[key] || key;
                    content += `${name}: ${value}\n`;
                }
            }
            content += `\n`;
        }
        if (report.defense) {
            content += `【 방어시설 】\n`;
            if (Object.keys(report.defense).length === 0) {
                content += `방어시설 없음\n`;
            }
            else {
                for (const [key, value] of Object.entries(report.defense)) {
                    const name = game_data_1.NAME_MAPPING[key] || key;
                    content += `${name}: ${value}\n`;
                }
            }
            content += `\n`;
        }
        if (report.buildings) {
            content += `【 건물 】\n`;
            if (Object.keys(report.buildings).length === 0) {
                content += `건물 정보 없음\n`;
            }
            else {
                for (const [key, value] of Object.entries(report.buildings)) {
                    const name = game_data_1.NAME_MAPPING[key] || key;
                    content += `${name}: Lv.${value}\n`;
                }
            }
            content += `\n`;
        }
        if (report.research) {
            content += `【 연구 】\n`;
            if (Object.keys(report.research).length === 0) {
                content += `연구 정보 없음\n`;
            }
            else {
                for (const [key, value] of Object.entries(report.research)) {
                    const name = game_data_1.NAME_MAPPING[key] || key;
                    content += `${name}: Lv.${value}\n`;
                }
            }
        }
        return content;
    }
};
exports.GalaxyService = GalaxyService;
exports.GalaxyService = GalaxyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __param(2, (0, mongoose_1.InjectModel)(debris_schema_1.Debris.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        message_service_1.MessageService])
], GalaxyService);
//# sourceMappingURL=galaxy.service.js.map