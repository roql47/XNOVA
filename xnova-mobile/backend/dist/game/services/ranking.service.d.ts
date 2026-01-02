import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
export interface PlayerRanking {
    rank: number;
    playerId: string;
    playerName: string;
    coordinate: string;
    score: number;
    previousRank?: number;
    rankChange?: number;
}
export interface PlayerScores {
    buildingScore: number;
    researchScore: number;
    fleetScore: number;
    defenseScore: number;
    totalScore: number;
}
export declare class RankingService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    calculateBuildingScore(user: UserDocument): number;
    private calculateLeveledCost;
    calculateResearchScore(user: UserDocument): number;
    calculateFleetScore(user: UserDocument): number;
    calculateDefenseScore(user: UserDocument): number;
    calculatePlayerScores(user: UserDocument): PlayerScores;
    getPlayerScores(userId: string): Promise<PlayerScores | null>;
    getRanking(type?: 'total' | 'building' | 'research' | 'fleet' | 'defense', page?: number, limit?: number): Promise<{
        ranking: PlayerRanking[];
        totalPlayers: number;
        page: number;
        totalPages: number;
    }>;
    getMyRanking(userId: string): Promise<{
        total: {
            rank: number;
            score: number;
        };
        building: {
            rank: number;
            score: number;
        };
        research: {
            rank: number;
            score: number;
        };
        fleet: {
            rank: number;
            score: number;
        };
        defense: {
            rank: number;
            score: number;
        };
    } | null>;
}
