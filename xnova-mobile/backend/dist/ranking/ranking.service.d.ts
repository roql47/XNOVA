import { Model } from 'mongoose';
import { UserDocument } from '../user/schemas/user.schema';
import { AllianceDocument } from '../alliance/schemas/alliance.schema';
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
export interface AllianceScore {
    rank: number;
    allianceId: string;
    tag: string;
    name: string;
    memberCount: number;
    totalScore: number;
}
export declare class RankingService {
    private userModel;
    private allianceModel;
    constructor(userModel: Model<UserDocument>, allianceModel: Model<AllianceDocument>);
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
    getAllianceRanking(limit?: number): Promise<AllianceScore[]>;
    getAllianceRank(allianceId: string): Promise<{
        rank: number;
        score: number;
        memberCount: number;
    } | null>;
    calculatePlayerScores(user: UserDocument): {
        totalScore: number;
        constructionScore: number;
        researchScore: number;
        fleetScore: number;
    };
}
