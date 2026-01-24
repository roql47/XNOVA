import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Alliance, AllianceDocument } from '../alliance/schemas/alliance.schema';
import { BUILDING_COSTS, FLEET_DATA, DEFENSE_DATA, RESEARCH_DATA } from '../game/constants/game-data';

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

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Alliance.name) private allianceModel: Model<AllianceDocument>,
  ) {}

  // 건설 점수 계산 - XNOVA.js calculateConstructionScore 마이그레이션
  private calculateConstructionScore(user: UserDocument): number {
    let score = 0;

    // 광산 점수
    const mines = ['metalMine', 'crystalMine', 'deuteriumMine', 'solarPlant', 'fusionReactor'];
    for (const mine of mines) {
      const level = user.mines[mine] || 0;
      for (let i = 0; i < level; i++) {
        const data = BUILDING_COSTS[mine];
        if (data) {
          const metal = Math.floor((data.base.metal || 0) * Math.pow(data.factor, i));
          const crystal = Math.floor((data.base.crystal || 0) * Math.pow(data.factor, i));
          score += (metal + crystal) / 1000;
        }
      }
    }

    // 시설 점수
    const facilities = ['robotFactory', 'shipyard', 'researchLab', 'nanoFactory'];
    for (const facility of facilities) {
      const level = user.facilities[facility] || 0;
      for (let i = 0; i < level; i++) {
        const data = BUILDING_COSTS[facility];
        if (data) {
          const metal = Math.floor((data.base.metal || 0) * Math.pow(data.factor, i));
          const crystal = Math.floor((data.base.crystal || 0) * Math.pow(data.factor, i));
          score += (metal + crystal) / 1000;
        }
      }
    }

    // 방어시설 점수
    for (const defense in user.defense) {
      const quantity = user.defense[defense] || 0;
      const data = DEFENSE_DATA[defense];
      if (data && quantity > 0) {
        score += quantity * ((data.cost.metal || 0) + (data.cost.crystal || 0)) / 1000;
      }
    }

    return Math.floor(score);
  }

  // 연구 점수 계산 - XNOVA.js calculateResearchScore 마이그레이션
  private calculateResearchScore(user: UserDocument): number {
    let score = 0;

    for (const research in user.researchLevels) {
      const level = user.researchLevels[research] || 0;
      const data = RESEARCH_DATA[research];
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

  // 함대 점수 계산 - XNOVA.js calculateFleetScore 마이그레이션
  private calculateFleetScore(user: UserDocument): number {
    let score = 0;

    for (const fleet in user.fleet) {
      const quantity = user.fleet[fleet] || 0;
      const data = FLEET_DATA[fleet];
      if (data && quantity > 0) {
        score += quantity * ((data.cost.metal || 0) + (data.cost.crystal || 0)) / 1000;
      }
    }

    return Math.floor(score);
  }

  // 플레이어 점수 계산
  calculatePlayerScore(user: UserDocument): {
    totalScore: number;
    constructionScore: number;
    researchScore: number;
    fleetScore: number;
  } {
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

  // 랭킹 조회
  async getRanking(type: 'total' | 'construction' | 'research' | 'fleet' = 'total', limit: number = 100): Promise<PlayerScore[]> {
    const users = await this.userModel.find().exec();

    const scores: PlayerScore[] = users.map((user, index) => {
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

    // 정렬
    let sortKey: keyof PlayerScore;
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

    scores.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));

    // 순위 부여
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });

    return scores.slice(0, limit);
  }

  // 특정 플레이어의 랭킹 정보
  async getPlayerRank(userId: string): Promise<{
    total: { rank: number; score: number };
    construction: { rank: number; score: number };
    research: { rank: number; score: number };
    fleet: { rank: number; score: number };
  }> {
    const totalRanking = await this.getRanking('total', 1000);
    const constructionRanking = await this.getRanking('construction', 1000);
    const researchRanking = await this.getRanking('research', 1000);
    const fleetRanking = await this.getRanking('fleet', 1000);

    const findRank = (ranking: PlayerScore[], userId: string) => {
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

  // ===== 연합 랭킹 =====

  // 연합 랭킹 조회 (멤버들의 총점수 합)
  async getAllianceRanking(limit: number = 100): Promise<AllianceScore[]> {
    const alliances = await this.allianceModel.find().exec();
    const users = await this.userModel.find().exec();

    // 유저별 점수 맵 생성
    const userScoreMap = new Map<string, number>();
    for (const user of users) {
      const scoreData = this.calculatePlayerScore(user);
      userScoreMap.set(user._id.toString(), scoreData.totalScore);
    }

    // 연합별 점수 계산
    const allianceScores: AllianceScore[] = alliances.map(alliance => {
      let totalScore = 0;
      
      // 모든 멤버의 점수 합산
      for (const member of alliance.members) {
        const userId = member.userId.toString();
        const memberScore = userScoreMap.get(userId) || 0;
        totalScore += memberScore;
      }

      return {
        rank: 0,
        allianceId: alliance._id.toString(),
        tag: alliance.tag,
        name: alliance.name,
        memberCount: alliance.members.length,
        totalScore,
      };
    });

    // 점수로 정렬
    allianceScores.sort((a, b) => b.totalScore - a.totalScore);

    // 순위 부여
    allianceScores.forEach((score, index) => {
      score.rank = index + 1;
    });

    return allianceScores.slice(0, limit);
  }

  // 특정 연합의 랭킹 정보
  async getAllianceRank(allianceId: string): Promise<{ rank: number; score: number; memberCount: number } | null> {
    const ranking = await this.getAllianceRanking(1000);
    const alliance = ranking.find(a => a.allianceId === allianceId);
    
    if (!alliance) return null;
    
    return {
      rank: alliance.rank,
      score: alliance.totalScore,
      memberCount: alliance.memberCount,
    };
  }

  // 외부에서 플레이어 점수 계산에 사용
  calculatePlayerScores(user: UserDocument): {
    totalScore: number;
    constructionScore: number;
    researchScore: number;
    fleetScore: number;
  } {
    return this.calculatePlayerScore(user);
  }
}

