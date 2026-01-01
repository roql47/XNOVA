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
const debris_schema_1 = require("./schemas/debris.schema");
const message_service_1 = require("../message/message.service");
const game_data_1 = require("../game/constants/game-data");
let GalaxyService = class GalaxyService {
    userModel;
    debrisModel;
    messageService;
    constructor(userModel, debrisModel, messageService) {
        this.userModel = userModel;
        this.debrisModel = debrisModel;
        this.messageService = messageService;
    }
    async getGalaxyMap(galaxy, system, currentUserId) {
        const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
        const [players, debrisFields] = await Promise.all([
            this.userModel.find({ coordinate: pattern }).exec(),
            this.debrisModel.find({ coordinate: pattern }).exec(),
        ]);
        const planets = [];
        for (let position = 1; position <= 15; position++) {
            const coord = `${galaxy}:${system}:${position}`;
            const player = players.find(p => p.coordinate === coord);
            const debris = debrisFields.find(d => d.coordinate === coord);
            const info = {
                position,
                coordinate: coord,
                playerName: player ? player.playerName : null,
                playerId: player ? player._id.toString() : null,
                isOwnPlanet: player ? player._id.toString() === currentUserId : false,
                hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
                debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
                hasMoon: false,
            };
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
        return this.debrisModel.findOne({ coordinate }).exec();
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
    async spyOnPlanet(attackerId, targetCoord, probeCount) {
        const attacker = await this.userModel.findById(attackerId).exec();
        if (!attacker) {
            return { success: false, error: '사용자를 찾을 수 없습니다.' };
        }
        const availableProbes = attacker.fleet?.espionageProbe || 0;
        if (availableProbes < probeCount) {
            return { success: false, error: `정찰 위성이 부족합니다. (보유: ${availableProbes})` };
        }
        const target = await this.userModel.findOne({ coordinate: targetCoord }).exec();
        if (!target) {
            return { success: false, error: '해당 좌표에 행성이 없습니다.' };
        }
        if (target._id.toString() === attackerId) {
            return { success: false, error: '자신의 행성은 정찰할 수 없습니다.' };
        }
        const mySpyLevel = attacker.researchLevels?.espionageTech || 0;
        const targetSpyLevel = target.researchLevels?.espionageTech || 0;
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
        const targetFleetCount = this.getTotalFleetCount(target.fleet);
        let targetForce = (targetFleetCount * probeCount) / 4;
        if (targetForce > 100)
            targetForce = 100;
        const targetChance = Math.random() * targetForce;
        const spyerChance = Math.random() * 100;
        const probesDestroyed = targetChance >= spyerChance;
        attacker.fleet.espionageProbe -= probeCount;
        let probesLost = 0;
        let probesSurvived = probeCount;
        if (probesDestroyed) {
            probesLost = probeCount;
            probesSurvived = 0;
            await this.updateDebris(targetCoord, 0, probeCount * 300);
        }
        await attacker.save();
        const report = this.generateSpyReport(target, stScore, probesLost, probesSurvived, targetCoord);
        await this.messageService.createMessage({
            receiverId: attackerId,
            senderName: '함대 사령부',
            title: `정찰 보고서: ${targetCoord} [${target.playerName}]`,
            content: this.formatSpyReportContent(report),
            type: 'battle',
            metadata: { type: 'spy', report },
        });
        await this.messageService.createMessage({
            receiverId: target._id.toString(),
            senderName: '방어 시스템',
            title: `정찰 감지: ${attacker.coordinate}`,
            content: `적 함대가 ${attacker.coordinate}에서 당신의 행성을 정찰했습니다.\n\n` +
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
    generateSpyReport(target, stScore, probesLost, probesSurvived, targetCoord) {
        const report = {
            targetCoord,
            targetName: target.playerName,
            probesLost,
            probesSurvived,
        };
        if (stScore >= 1) {
            report.resources = {
                metal: target.resources?.metal || 0,
                crystal: target.resources?.crystal || 0,
                deuterium: target.resources?.deuterium || 0,
                energy: target.resources?.energy || 0,
            };
        }
        if (stScore >= 2) {
            report.fleet = this.filterNonZero(target.fleet);
        }
        if (stScore >= 3) {
            report.defense = this.filterNonZero(target.defense);
        }
        if (stScore >= 5) {
            report.buildings = {
                ...this.filterNonZero(target.mines),
                ...this.filterNonZero(target.facilities),
            };
        }
        if (stScore >= 7) {
            report.research = this.filterNonZero(target.researchLevels);
        }
        return report;
    }
    filterNonZero(obj) {
        if (!obj)
            return {};
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'number' && value > 0) {
                result[key] = value;
            }
        }
        return result;
    }
    formatSpyReportContent(report) {
        let content = `=== 정찰 보고서 ===\n`;
        content += `대상: ${report.targetName} [${report.targetCoord}]\n`;
        content += `정찰 위성: ${report.probesSurvived}대 귀환, ${report.probesLost}대 손실\n\n`;
        if (report.resources) {
            content += `【 자원 현황 】\n`;
            content += `메탈: ${report.resources.metal.toLocaleString()}\n`;
            content += `크리스탈: ${report.resources.crystal.toLocaleString()}\n`;
            content += `듀테륨: ${report.resources.deuterium.toLocaleString()}\n`;
            content += `에너지: ${report.resources.energy.toLocaleString()}\n\n`;
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
            for (const [key, value] of Object.entries(report.buildings)) {
                const name = game_data_1.NAME_MAPPING[key] || key;
                content += `${name}: Lv.${value}\n`;
            }
            content += `\n`;
        }
        if (report.research) {
            content += `【 연구 】\n`;
            for (const [key, value] of Object.entries(report.research)) {
                const name = game_data_1.NAME_MAPPING[key] || key;
                content += `${name}: Lv.${value}\n`;
            }
        }
        return content;
    }
};
exports.GalaxyService = GalaxyService;
exports.GalaxyService = GalaxyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(debris_schema_1.Debris.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        message_service_1.MessageService])
], GalaxyService);
//# sourceMappingURL=galaxy.service.js.map