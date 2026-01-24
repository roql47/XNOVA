import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingService } from './ranking.service';

@Controller('ranking')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(private rankingService: RankingService) {}

  // 전체 랭킹 조회
  @Get()
  async getRanking(
    @Query('type') type: 'total' | 'construction' | 'research' | 'fleet' = 'total',
    @Query('limit') limit: string = '100',
  ) {
    const limitNum = parseInt(limit) || 100;
    const ranking = await this.rankingService.getRanking(type, limitNum);
    
    return {
      type,
      ranking,
      totalPlayers: ranking.length,
    };
  }

  // 내 랭킹 정보
  @Get('me')
  async getMyRank(@Request() req) {
    return this.rankingService.getPlayerRank(req.user.userId);
  }

  // 연합 랭킹 조회
  @Get('alliance')
  async getAllianceRanking(@Query('limit') limit: string = '100') {
    const limitNum = parseInt(limit) || 100;
    const ranking = await this.rankingService.getAllianceRanking(limitNum);
    
    return {
      type: 'alliance',
      ranking,
      totalAlliances: ranking.length,
    };
  }

  // 특정 타입의 랭킹
  @Get(':type')
  async getRankingByType(
    @Param('type') type: string,
    @Query('limit') limit: string = '100',
  ) {
    const validTypes = ['total', 'construction', 'research', 'fleet'];
    const rankingType = validTypes.includes(type) ? type as any : 'total';
    const limitNum = parseInt(limit) || 100;

    const ranking = await this.rankingService.getRanking(rankingType, limitNum);
    
    return {
      type: rankingType,
      ranking,
      totalPlayers: ranking.length,
    };
  }
}

