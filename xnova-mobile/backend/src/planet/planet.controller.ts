import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanetService } from './planet.service';

@Controller('planet')
@UseGuards(JwtAuthGuard)
export class PlanetController {
  constructor(private planetService: PlanetService) {}

  /**
   * 내 행성 목록 조회
   */
  @Get('list')
  async getMyPlanets(@Request() req) {
    const planets = await this.planetService.getPlanetsByOwner(req.user.userId);
    const user = await this.planetService.getUserActivePlanetId(req.user.userId);
    
    return {
      success: true,
      activePlanetId: user?.activePlanetId || planets[0]?._id.toString(),
      planets: planets.map(p => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        name: p.name,
        coordinate: p.coordinate,
        isHomePlanet: p.isHomeworld,
        isHomeworld: p.isHomeworld,
        type: p.type,
        planetInfo: {
          planetName: p.name,
          maxFields: p.planetInfo?.maxFields || 163,
          usedFields: p.planetInfo?.usedFields || 0,
          temperature: p.planetInfo?.tempMax || 50,
          planetType: p.planetInfo?.planetType || 'normaltemp',
        },
        resources: p.resources,
      })),
    };
  }

  /**
   * 특정 행성 상세 조회
   */
  @Get(':planetId')
  async getPlanetDetail(@Request() req, @Param('planetId') planetId: string) {
    const planet = await this.planetService.getPlanetById(planetId);
    
    // 본인 행성인지 확인
    if (planet.ownerId !== req.user.userId) {
      return { success: false, error: '이 행성의 소유자가 아닙니다.' };
    }

    return {
      success: true,
      planet: {
        id: planet._id.toString(),
        name: planet.name,
        coordinate: planet.coordinate,
        isHomeworld: planet.isHomeworld,
        type: planet.type,
        resources: planet.resources,
        mines: planet.mines,
        facilities: planet.facilities,
        fleet: planet.fleet,
        defense: planet.defense,
        planetInfo: planet.planetInfo,
        constructionProgress: planet.constructionProgress,
        fleetProgress: planet.fleetProgress,
        defenseProgress: planet.defenseProgress,
        lastResourceUpdate: planet.lastResourceUpdate,
      },
    };
  }

  /**
   * 활성 행성 전환
   */
  @Post('switch')
  async switchPlanet(@Request() req, @Body() body: { planetId: string }) {
    const planet = await this.planetService.switchActivePlanet(req.user.userId, body.planetId);
    return {
      success: true,
      message: `${planet.name}으로 전환되었습니다.`,
      planet: {
        id: planet._id.toString(),
        name: planet.name,
        coordinate: planet.coordinate,
      },
    };
  }

  /**
   * 행성 포기
   */
  @Post('abandon')
  async abandonPlanet(@Request() req, @Body() body: { planetId: string }) {
    const result = await this.planetService.abandonPlanet(req.user.userId, body.planetId);
    return result;
  }

  /**
   * 행성 이름 변경
   */
  @Post('rename')
  async renamePlanet(@Request() req, @Body() body: { planetId: string; newName: string }) {
    const planet = await this.planetService.renamePlanet(req.user.userId, body.planetId, body.newName);
    return {
      success: true,
      message: '행성 이름이 변경되었습니다.',
      planet: {
        id: planet._id.toString(),
        name: planet.name,
        coordinate: planet.coordinate,
      },
    };
  }
}

