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
exports.RankingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const game_data_1 = require("../constants/game-data");
const STAT_SETTINGS = 1000;
const RESOURCE_WEIGHTS = {
    metal: 1,
    crystal: 2,
    deuterium: 3,
};
const RESEARCH_FACTOR = 2;
let RankingService = class RankingService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    calculateBuildingScore(user) {
        let totalCost = 0;
        const mines = user.mines || {};
        for (const [type, level] of Object.entries(mines)) {
            if (level > 0 && game_data_1.BUILDING_COSTS[type]) {
                totalCost += this.calculateLeveledCost(game_data_1.BUILDING_COSTS[type], level);
            }
        }
        const facilities = user.facilities || {};
        for (const [type, level] of Object.entries(facilities)) {
            if (level > 0 && game_data_1.BUILDING_COSTS[type]) {
                totalCost += this.calculateLeveledCost(game_data_1.BUILDING_COSTS[type], level);
            }
        }
        return Math.floor(totalCost / STAT_SETTINGS);
    }
    calculateLeveledCost(buildingData, currentLevel) {
        const baseCost = (buildingData.base.metal || 0) * RESOURCE_WEIGHTS.metal +
            (buildingData.base.crystal || 0) * RESOURCE_WEIGHTS.crystal +
            (buildingData.base.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
        const factor = buildingData.factor || 1.5;
        let totalCost = 0;
        for (let level = 0; level < currentLevel; level++) {
            totalCost += baseCost * Math.pow(factor, level);
        }
        return totalCost;
    }
    calculateResearchScore(user) {
        let totalCost = 0;
        const researchLevels = user.researchLevels || {};
        for (const [type, level] of Object.entries(researchLevels)) {
            if (level > 0 && game_data_1.RESEARCH_DATA[type]) {
                const research = game_data_1.RESEARCH_DATA[type];
                const baseCost = (research.cost.metal || 0) * RESOURCE_WEIGHTS.metal +
                    (research.cost.crystal || 0) * RESOURCE_WEIGHTS.crystal +
                    (research.cost.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
                for (let l = 0; l < level; l++) {
                    totalCost += baseCost * Math.pow(RESEARCH_FACTOR, l);
                }
            }
        }
        return Math.floor(totalCost / STAT_SETTINGS);
    }
    calculateFleetScore(user) {
        let totalCost = 0;
        const fleet = user.fleet || {};
        for (const [type, count] of Object.entries(fleet)) {
            if (count > 0 && game_data_1.FLEET_DATA[type]) {
                const fleetData = game_data_1.FLEET_DATA[type];
                const unitCost = (fleetData.cost.metal || 0) * RESOURCE_WEIGHTS.metal +
                    (fleetData.cost.crystal || 0) * RESOURCE_WEIGHTS.crystal +
                    (fleetData.cost.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
                totalCost += unitCost * count;
            }
        }
        return Math.floor(totalCost / STAT_SETTINGS);
    }
    calculateDefenseScore(user) {
        let totalCost = 0;
        const defense = user.defense || {};
        for (const [type, count] of Object.entries(defense)) {
            if (count > 0 && game_data_1.DEFENSE_DATA[type]) {
                const defenseData = game_data_1.DEFENSE_DATA[type];
                const unitCost = (defenseData.cost.metal || 0) * RESOURCE_WEIGHTS.metal +
                    (defenseData.cost.crystal || 0) * RESOURCE_WEIGHTS.crystal +
                    (defenseData.cost.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
                totalCost += unitCost * count;
            }
        }
        return Math.floor(totalCost / STAT_SETTINGS);
    }
    calculatePlayerScores(user) {
        const buildingScore = this.calculateBuildingScore(user);
        const researchScore = this.calculateResearchScore(user);
        const fleetScore = this.calculateFleetScore(user);
        const defenseScore = this.calculateDefenseScore(user);
        const totalScore = buildingScore + researchScore + fleetScore + defenseScore;
        return {
            buildingScore,
            researchScore,
            fleetScore,
            defenseScore,
            totalScore,
        };
    }
    async getPlayerScores(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        return this.calculatePlayerScores(user);
    }
    async getRanking(type = 'total', page = 1, limit = 100) {
        const users = await this.userModel.find().exec();
        const totalPlayers = users.length;
        const playerScores = users.map(user => ({
            user,
            scores: this.calculatePlayerScores(user),
        }));
        playerScores.sort((a, b) => {
            switch (type) {
                case 'building':
                    return b.scores.buildingScore - a.scores.buildingScore;
                case 'research':
                    return b.scores.researchScore - a.scores.researchScore;
                case 'fleet':
                    return b.scores.fleetScore - a.scores.fleetScore;
                case 'defense':
                    return b.scores.defenseScore - a.scores.defenseScore;
                default:
                    return b.scores.totalScore - a.scores.totalScore;
            }
        });
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedScores = playerScores.slice(startIndex, endIndex);
        const ranking = paginatedScores.map((item, index) => {
            let score;
            switch (type) {
                case 'building':
                    score = item.scores.buildingScore;
                    break;
                case 'research':
                    score = item.scores.researchScore;
                    break;
                case 'fleet':
                    score = item.scores.fleetScore;
                    break;
                case 'defense':
                    score = item.scores.defenseScore;
                    break;
                default:
                    score = item.scores.totalScore;
            }
            return {
                rank: startIndex + index + 1,
                playerId: item.user._id.toString(),
                playerName: item.user.playerName,
                coordinate: item.user.coordinate,
                score,
            };
        });
        return {
            ranking,
            totalPlayers,
            page,
            totalPages: Math.ceil(totalPlayers / limit),
        };
    }
    async getMyRanking(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const myScores = this.calculatePlayerScores(user);
        const users = await this.userModel.find().exec();
        const allScores = users.map(u => ({
            id: u._id.toString(),
            scores: this.calculatePlayerScores(u),
        }));
        const getRank = (scoreType) => {
            const sorted = [...allScores].sort((a, b) => b.scores[scoreType] - a.scores[scoreType]);
            return sorted.findIndex(s => s.id === userId) + 1;
        };
        return {
            total: { rank: getRank('totalScore'), score: myScores.totalScore },
            building: { rank: getRank('buildingScore'), score: myScores.buildingScore },
            research: { rank: getRank('researchScore'), score: myScores.researchScore },
            fleet: { rank: getRank('fleetScore'), score: myScores.fleetScore },
            defense: { rank: getRank('defenseScore'), score: myScores.defenseScore },
        };
    }
};
exports.RankingService = RankingService;
exports.RankingService = RankingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RankingService);
//# sourceMappingURL=ranking.service.js.map