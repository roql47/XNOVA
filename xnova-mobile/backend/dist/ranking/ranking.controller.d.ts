import { RankingService } from './ranking.service';
export declare class RankingController {
    private rankingService;
    constructor(rankingService: RankingService);
    getRanking(type?: 'total' | 'construction' | 'research' | 'fleet', limit?: string): Promise<{
        type: "fleet" | "research" | "total" | "construction";
        ranking: import("./ranking.service").PlayerScore[];
        totalPlayers: number;
    }>;
    getMyRank(req: any): Promise<{
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
    getRankingByType(type: string, limit?: string): Promise<{
        type: any;
        ranking: import("./ranking.service").PlayerScore[];
        totalPlayers: number;
    }>;
}
