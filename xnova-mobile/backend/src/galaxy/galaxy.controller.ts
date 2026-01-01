import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { IsString, IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GalaxyService } from './galaxy.service';

class SpyRequestDto {
  @IsString()
  targetCoord: string;

  @IsNumber()
  @Min(1)
  probeCount: number;
}

@Controller('galaxy')
@UseGuards(JwtAuthGuard)
export class GalaxyController {
  constructor(private galaxyService: GalaxyService) {}

  // 특정 시스템의 은하 지도 조회
  @Get(':galaxy/:system')
  async getGalaxyMap(
    @Param('galaxy') galaxy: string,
    @Param('system') system: string,
    @Request() req,
  ) {
    const galaxyNum = parseInt(galaxy);
    const systemNum = parseInt(system);

    if (isNaN(galaxyNum) || isNaN(systemNum)) {
      return { error: '잘못된 좌표 형식입니다.' };
    }

    if (galaxyNum < 1 || galaxyNum > 9) {
      return { error: '은하 번호는 1~9 사이여야 합니다.' };
    }

    if (systemNum < 1 || systemNum > 499) {
      return { error: '시스템 번호는 1~499 사이여야 합니다.' };
    }

    const planets = await this.galaxyService.getGalaxyMap(galaxyNum, systemNum, req.user.userId);
    
    return {
      galaxy: galaxyNum,
      system: systemNum,
      planets,
    };
  }

  // 플레이어 정보 조회
  @Get('player/:playerId')
  async getPlayerInfo(@Param('playerId') playerId: string, @Request() req) {
    return this.galaxyService.getPlayerInfo(playerId, req.user.userId);
  }

  // 활성화된 시스템 목록
  @Get(':galaxy/systems')
  async getActiveSystems(@Param('galaxy') galaxy: string) {
    const galaxyNum = parseInt(galaxy);
    
    if (isNaN(galaxyNum) || galaxyNum < 1 || galaxyNum > 9) {
      return { error: '잘못된 은하 번호입니다.' };
    }

    const systems = await this.galaxyService.getActiveSystems(galaxyNum);
    
    return {
      galaxy: galaxyNum,
      activeSystems: systems,
      totalActive: systems.length,
    };
  }

  // 정찰 요청
  @Post('spy')
  async spyOnPlanet(@Body() body: SpyRequestDto, @Request() req) {
    const { targetCoord, probeCount } = body;

    if (!targetCoord || !probeCount || probeCount < 1) {
      return { success: false, error: '잘못된 요청입니다.' };
    }

    return this.galaxyService.spyOnPlanet(req.user.userId, targetCoord, probeCount);
  }
}

