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
const user_schema_1 = require("../user/schemas/user.schema");
const game_data_1 = require("../game/constants/game-data");
let RankingService = class RankingService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    calculateConstructionScore(user) {
        let score = 0;
        const mines = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'];
        for (const mine of mines) {
            const level = user.mines[mine] || 0;
            for (let i = 0; i < level; i++) {
                const data = game_data_1.BUILDING_COSTS[mine];
                if (data) {
                    const metal = Math.floor((data.base.metal || 0) * Math.pow(data.factor, i));
                    const crystal = Math.floor((data.base.crystal || 0) * Math.pow(data.factor, i));
                    score += (metal + crystal) / 1000;
                }
            }
        }
        const facilities = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'];
        for (const facility of facilities) {
            const level = user.facilities[facility] || 0;
            for (let i = 0; i < level; i++) {
                const data = game_data_1.BUILDING_COSTS[facility];
                if (data) {
                    const metal = Math.floor((data.base.metal || 0) * Math.pow(data.factor, i));
                    const crystal = Math.floor((data.base.crystal || 0) * Math.pow(data.factor, i));
                    score += (metal + crystal) / 1000;
                }
            }
        }
        for (const defense in user.defense) {
            const quantity = user.defense[defense] || 0;
            const data = game_data_1.DEFENSE_DATA[defense];
            if (data && quantity > 0) {
                score += quantity * ((data.cost.metal || 0) + (data.cost.crystal || 0)) / 1000;
            }
        }
        return Math.floor(score);
    }
    calculateResearchScore(user) {
        let score = 0;
        for (const research in user.researchLevels) {
            const level = user.researchLevels[research] || 0;
            const data = game_data_1.RESEARCH_DATA[research];
            if (data && level > 0) {
                for (let i = 0; i < level; i++) {
                    const metal = Math.floor((data.cost.metal || 0) * Math.pow(2, i));
                    const crystal = Math.floor((data.cost.crystal || 0) * Math.pow(2, i));
                    score += (metal + crystal) / 1000;
                }
            }
        }
        return Math.floor(score);
    }
    calculateFleetScore(user) {
        let score = 0;
        for (const fleet in user.fleet) {
            const quantity = user.fleet[fleet] || 0;
            const data = game_data_1.FLEET_DATA[fleet];
            if (data && quantity > 0) {
                score += quantity * ((data.cost.metal || 0) + (data.cost.crystal || 0)) / 1000;
            }
        }
        return Math.floor(score);
    }
    calculatePlayerScore(user) {
        const constructionScore = this.calculateConstructionScore(user);
        const researchScore = this.calculateResearchScore(user);
        const fleetScore = this.calculateFleetScore(user);
        const totalScore = constructionScore + researchScore + fleetScore;
        return {
            totalScore,
            constructionScore,
            researchScore,
            fleetScore,
        };
    }
    async getRanking(type = 'total', limit = 100) {
        const users = await this.userModel.find().exec();
        const scores = users.map((user, index) => {
            const scoreData = this.calculatePlayerScore(user);
            return {
                rank: 0,
                playerId: user._id.toString(),
                playerName: user.playerName,
                coordinate: user.coordinate,
                totalScore: scoreData.totalScore,
                constructionScore: scoreData.constructionScore,
                researchScore: scoreData.researchScore,
                fleetScore: scoreData.fleetScore,
            };
        });
        let sortKey;
        switch (type) {
            case 'construction':
                sortKey = 'constructionScore';
                break;
            case 'research':
                sortKey = 'researchScore';
                break;
            case 'fleet':
                sortKey = 'fleetScore';
                break;
            default:
                sortKey = 'totalScore';
        }
        scores.sort((a, b) => b[sortKey] - a[sortKey]);
        scores.forEach((score, index) => {
            score.rank = index + 1;
        });
        return scores.slice(0, limit);
    }
    async getPlayerRank(userId) {
        const totalRanking = await this.getRanking('total', 1000);
        const constructionRanking = await this.getRanking('construction', 1000);
        const researchRanking = await this.getRanking('research', 1000);
        const fleetRanking = await this.getRanking('fleet', 1000);
        const findRank = (ranking, userId) => {
            const player = ranking.find(p => p.playerId === userId);
            return player ? { rank: player.rank, score: player.totalScore } : { rank: -1, score: 0 };
        };
        const totalRank = totalRanking.find(p => p.playerId === userId);
        const constructionRank = constructionRanking.find(p => p.playerId === userId);
        const researchRank = researchRanking.find(p => p.playerId === userId);
        const fleetRank = fleetRanking.find(p => p.playerId === userId);
        return {
            total: totalRank ? { rank: totalRank.rank, score: totalRank.totalScore } : { rank: -1, score: 0 },
            construction: constructionRank ? { rank: constructionRank.rank, score: constructionRank.constructionScore } : { rank: -1, score: 0 },
            research: researchRank ? { rank: researchRank.rank, score: researchRank.researchScore } : { rank: -1, score: 0 },
            fleet: fleetRank ? { rank: fleetRank.rank, score: fleetRank.fleetScore } : { rank: -1, score: 0 },
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