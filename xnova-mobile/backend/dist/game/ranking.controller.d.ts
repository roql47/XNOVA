import { RankingService } from './services/ranking.service';
export declare class RankingController {
    private rankingService;
    constructor(rankingService: RankingService);
    getRanking(type?: 'total' | 'building' | 'research' | 'fleet' | 'defense', page?: string, limit?: string): Promise<{
        ranking: import("./services/ranking.service").PlayerRanking[];
        totalPlayers: number;
        page: number;
        totalPages: number;
    }>;
    getMyScores(req: any): Promise<import("./services/ranking.service").PlayerScores | null>;
    getMyRanking(req: any): Promise<{
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
