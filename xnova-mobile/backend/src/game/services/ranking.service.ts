import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { BUILDING_COSTS, FLEET_DATA, DEFENSE_DATA, RESEARCH_DATA } from '../constants/game-data';

// 점수 계산 기준 (1000 자원 = 1 포인트)
const STAT_SETTINGS = 1000;

// 자원별 가중치 (메탈=1, 크리스탈=2, 듀테륨=3)
const RESOURCE_WEIGHTS = {
  metal: 1,
  crystal: 2,
  deuterium: 3,
};

// 연구 비용 증가 배수 (기본값 2)
const RESEARCH_FACTOR = 2;

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

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ===== 점수 계산 함수들 =====

  // 건물 점수 계산 (누적 비용 기반)
  calculateBuildingScore(user: UserDocument): number {
    let totalCost = 0;

    // 광산
    const mines = user.mines || {};
    for (const [type, level] of Object.entries(mines)) {
      if (level > 0 && BUILDING_COSTS[type]) {
        totalCost += this.calculateLeveledCost(BUILDING_COSTS[type], level);
      }
    }

    // 시설
    const facilities = user.facilities || {};
    for (const [type, level] of Object.entries(facilities)) {
      if (level > 0 && BUILDING_COSTS[type]) {
        totalCost += this.calculateLeveledCost(BUILDING_COSTS[type], level);
      }
    }

    return Math.floor(totalCost / STAT_SETTINGS);
  }

  // 레벨 기반 누적 비용 계산 (가중치 적용)
  private calculateLeveledCost(buildingData: any, currentLevel: number): number {
    // 가중치 적용: 메탈×1 + 크리스탈×2 + 듀테륨×3
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

  // 연구 점수 계산 (누적 비용 기반, 가중치 적용)
  calculateResearchScore(user: UserDocument): number {
    let totalCost = 0;
    const researchLevels = user.researchLevels || {};

    for (const [type, level] of Object.entries(researchLevels)) {
      if (level > 0 && RESEARCH_DATA[type]) {
        const research = RESEARCH_DATA[type];
        // 가중치 적용: 메탈×1 + 크리스탈×2 + 듀테륨×3
        const baseCost = (research.cost.metal || 0) * RESOURCE_WEIGHTS.metal + 
                         (research.cost.crystal || 0) * RESOURCE_WEIGHTS.crystal + 
                         (research.cost.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
        
        // 각 레벨까지 소비한 비용 합산
        for (let l = 0; l < level; l++) {
          totalCost += baseCost * Math.pow(RESEARCH_FACTOR, l);
        }
      }
    }

    return Math.floor(totalCost / STAT_SETTINGS);
  }

  // 함대 점수 계산 (현재 보유 함대 기반, 가중치 적용)
  calculateFleetScore(user: UserDocument): number {
    let totalCost = 0;
    const fleet = user.fleet || {};

    for (const [type, count] of Object.entries(fleet)) {
      if (count > 0 && FLEET_DATA[type]) {
        const fleetData = FLEET_DATA[type];
        // 가중치 적용: 메탈×1 + 크리스탈×2 + 듀테륨×3
        const unitCost = (fleetData.cost.metal || 0) * RESOURCE_WEIGHTS.metal + 
                         (fleetData.cost.crystal || 0) * RESOURCE_WEIGHTS.crystal + 
                         (fleetData.cost.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
        totalCost += unitCost * count;
      }
    }

    return Math.floor(totalCost / STAT_SETTINGS);
  }

  // 방어시설 점수 계산 (현재 보유 방어시설 기반, 가중치 적용)
  calculateDefenseScore(user: UserDocument): number {
    let totalCost = 0;
    const defense = user.defense || {};

    for (const [type, count] of Object.entries(defense)) {
      if (count > 0 && DEFENSE_DATA[type]) {
        const defenseData = DEFENSE_DATA[type];
        // 가중치 적용: 메탈×1 + 크리스탈×2 + 듀테륨×3
        const unitCost = (defenseData.cost.metal || 0) * RESOURCE_WEIGHTS.metal + 
                         (defenseData.cost.crystal || 0) * RESOURCE_WEIGHTS.crystal + 
                         (defenseData.cost.deuterium || 0) * RESOURCE_WEIGHTS.deuterium;
        totalCost += unitCost * count;
      }
    }

    return Math.floor(totalCost / STAT_SETTINGS);
  }

  // 플레이어 전체 점수 계산
  calculatePlayerScores(user: UserDocument): PlayerScores {
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

  // ===== 랭킹 조회 API =====

  // 특정 유저의 점수 조회
  async getPlayerScores(userId: string): Promise<PlayerScores | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;
    return this.calculatePlayerScores(user);
  }

  // 전체 랭킹 조회 (점수 유형별)
  async getRanking(
    type: 'total' | 'building' | 'research' | 'fleet' | 'defense' = 'total',
    page: number = 1,
    limit: number = 100,
  ): Promise<{ ranking: PlayerRanking[]; totalPlayers: number; page: number; totalPages: number }> {
    // 모든 유저 조회
    const users = await this.userModel.find().exec();
    const totalPlayers = users.length;

    // 점수 계산 및 정렬
    const playerScores: Array<{
      user: UserDocument;
      scores: PlayerScores;
    }> = users.map(user => ({
      user,
      scores: this.calculatePlayerScores(user),
    }));

    // 점수 유형에 따라 정렬
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

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedScores = playerScores.slice(startIndex, endIndex);

    // 랭킹 데이터 생성
    const ranking: PlayerRanking[] = paginatedScores.map((item, index) => {
      let score: number;
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

  // 내 순위 조회
  async getMyRanking(userId: string): Promise<{
    total: { rank: number; score: number };
    building: { rank: number; score: number };
    research: { rank: number; score: number };
    fleet: { rank: number; score: number };
    defense: { rank: number; score: number };
  } | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const myScores = this.calculatePlayerScores(user);
    
    // 모든 유저 점수 계산
    const users = await this.userModel.find().exec();
    const allScores = users.map(u => ({
      id: u._id.toString(),
      scores: this.calculatePlayerScores(u),
    }));

    // 각 카테고리별 순위 계산
    const getRank = (scoreType: keyof PlayerScores): number => {
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
}

