import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './services/resources.service';
import { BuildingsService } from './services/buildings.service';
import { ResearchService } from './services/research.service';
import { FleetService } from './services/fleet.service';
import { DefenseService } from './services/defense.service';
import { BattleService, BattleResult } from './services/battle.service';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(
    private resourcesService: ResourcesService,
    private buildingsService: BuildingsService,
    private researchService: ResearchService,
    private fleetService: FleetService,
    private defenseService: DefenseService,
    private battleService: BattleService,
  ) {}

  // ===== 자원 =====
  @Get('resources')
  async getResources(@Request() req) {
    return this.resourcesService.getResources(req.user.userId);
  }

  // ===== 건물 =====
  @Get('buildings')
  async getBuildings(@Request() req) {
    return this.buildingsService.getBuildings(req.user.userId);
  }

  @Post('buildings/upgrade')
  async upgradeBuilding(@Request() req, @Body() body: { buildingType: string }) {
    return this.buildingsService.startUpgrade(req.user.userId, body.buildingType);
  }

  @Post('buildings/complete')
  async completeBuilding(@Request() req) {
    return this.buildingsService.completeConstruction(req.user.userId);
  }

  @Post('buildings/cancel')
  async cancelBuilding(@Request() req) {
    return this.buildingsService.cancelConstruction(req.user.userId);
  }

  // ===== 연구 =====
  @Get('research')
  async getResearch(@Request() req) {
    return this.researchService.getResearch(req.user.userId);
  }

  @Post('research/start')
  async startResearch(@Request() req, @Body() body: { researchType: string }) {
    return this.researchService.startResearch(req.user.userId, body.researchType);
  }

  @Post('research/complete')
  async completeResearch(@Request() req) {
    return this.researchService.completeResearch(req.user.userId);
  }

  @Post('research/cancel')
  async cancelResearch(@Request() req) {
    return this.researchService.cancelResearch(req.user.userId);
  }

  // ===== 함대 =====
  @Get('fleet')
  async getFleet(@Request() req) {
    return this.fleetService.getFleet(req.user.userId);
  }

  @Post('fleet/build')
  async buildFleet(@Request() req, @Body() body: { fleetType: string; quantity: number }) {
    return this.fleetService.startBuild(req.user.userId, body.fleetType, body.quantity);
  }

  @Post('fleet/complete')
  async completeFleet(@Request() req) {
    return this.fleetService.completeBuild(req.user.userId);
  }

  // ===== 방어시설 =====
  @Get('defense')
  async getDefense(@Request() req) {
    return this.defenseService.getDefense(req.user.userId);
  }

  @Post('defense/build')
  async buildDefense(@Request() req, @Body() body: { defenseType: string; quantity: number }) {
    return this.defenseService.startBuild(req.user.userId, body.defenseType, body.quantity);
  }

  @Post('defense/complete')
  async completeDefense(@Request() req) {
    return this.defenseService.completeBuild(req.user.userId);
  }

  // ===== 전투 =====
  @Post('battle/attack')
  async attack(@Request() req, @Body() body: { targetCoord: string; fleet: Record<string, number> }) {
    return this.battleService.startAttack(req.user.userId, body.targetCoord, body.fleet);
  }

  @Get('battle/status')
  async getAttackStatus(@Request() req) {
    return this.battleService.getAttackStatus(req.user.userId);
  }

  @Post('battle/process')
  async processBattle(@Request() req): Promise<{
    attackProcessed: boolean;
    attackResult: { battleResult: BattleResult; attacker: any; defender: any } | null;
    returnProcessed: boolean;
    returnResult: { returnedFleet: Record<string, number>; loot: Record<string, number> } | null;
  }> {
    const attackResult = await this.battleService.processAttackArrival(req.user.userId);
    const returnResult = await this.battleService.processFleetReturn(req.user.userId);
    
    return {
      attackProcessed: attackResult !== null,
      attackResult,
      returnProcessed: returnResult !== null,
      returnResult,
    };
  }
}
