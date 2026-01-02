import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingService } from './services/ranking.service';

@Controller('ranking')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(private rankingService: RankingService) {}

  // 전체 랭킹 조회
  @Get()
  async getRanking(
    @Query('type') type: 'total' | 'building' | 'research' | 'fleet' | 'defense' = 'total',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 100));
    
    return this.rankingService.getRanking(type, pageNum, limitNum);
  }

  // 내 점수 조회
  @Get('my-scores')
  async getMyScores(@Request() req) {
    return this.rankingService.getPlayerScores(req.user.userId);
  }

  // 내 순위 조회
  @Get('my-rank')
  async getMyRanking(@Request() req) {
    return this.rankingService.getMyRanking(req.user.userId);
  }
}

