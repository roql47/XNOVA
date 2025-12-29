import { Model } from 'mongoose';
import { UserDocument } from '../user/schemas/user.schema';
export interface PlayerScore {
    rank: number;
    playerId: string;
    playerName: string;
    coordinate: string;
    totalScore: number;
    constructionScore: number;
    researchScore: number;
    fleetScore: number;
}
export declare class RankingService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    private calculateConstructionScore;
    private calculateResearchScore;
    private calculateFleetScore;
    calculatePlayerScore(user: UserDocument): {
        totalScore: number;
        constructionScore: number;
        researchScore: number;
        fleetScore: number;
    };
    getRanking(type?: 'total' | 'construction' | 'research' | 'fleet', limit?: number): Promise<PlayerScore[]>;
    getPlayerRank(userId: string): Promise<{
        total: {
            rank: number;
            score: number;
        };
        construction: {
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
    }>;
}
