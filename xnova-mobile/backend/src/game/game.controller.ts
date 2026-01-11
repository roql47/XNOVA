import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './services/resources.service';
import { BuildingsService } from './services/buildings.service';
import { ResearchService } from './services/research.service';
import { FleetService } from './services/fleet.service';
import { DefenseService } from './services/defense.service';
import { BattleService } from './services/battle.service';
import type { BattleResult } from './services/battle.service';
import { BattleSimulatorService } from './services/battle-simulator.service';
import type { SimulationRequest, SimulationConfig, BattleSlot } from './services/battle-simulator.service';
import { ColonyService } from './services/colony.service';

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
    private battleSimulatorService: BattleSimulatorService,
    private colonyService: ColonyService,
  ) {}

  // ===== 자원 =====
  @Get('resources')
  async getResources(@Request() req) {
    return this.resourcesService.getResources(req.user.userId);
  }

  @Get('resources/detailed')
  async getDetailedResources(@Request() req) {
    return this.resourcesService.getDetailedResources(req.user.userId);
  }

  @Post('resources/operation-rates')
  async setOperationRates(@Request() req, @Body() body: {
    metalMine?: number;
    crystalMine?: number;
    deuteriumMine?: number;
    solarPlant?: number;
    fusionReactor?: number;
    solarSatellite?: number;
  }) {
    return this.resourcesService.setOperationRates(req.user.userId, body);
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

  @Post('buildings/downgrade')
  async downgradeBuilding(@Request() req, @Body() body: { buildingType: string }) {
    return this.buildingsService.startDowngrade(req.user.userId, body.buildingType);
  }

  @Post('buildings/complete')
  async completeBuilding(@Request() req) {
    return this.buildingsService.completeConstructionWithDowngrade(req.user.userId);
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

  @Post('battle/recycle')
  async recycle(@Request() req, @Body() body: { targetCoord: string; fleet: Record<string, number> }) {
    return this.battleService.startRecycle(req.user.userId, body.targetCoord, body.fleet);
  }

  @Post('battle/transport')
  async transport(@Request() req, @Body() body: { 
    targetCoord: string; 
    fleet: Record<string, number>;
    resources: { metal: number; crystal: number; deuterium: number };
  }) {
    return this.battleService.startTransport(req.user.userId, body.targetCoord, body.fleet, body.resources);
  }

  @Post('battle/deploy')
  async deploy(@Request() req, @Body() body: { 
    targetCoord: string; 
    fleet: Record<string, number>;
    resources: { metal: number; crystal: number; deuterium: number };
  }) {
    return this.battleService.startDeploy(req.user.userId, body.targetCoord, body.fleet, body.resources);
  }

  @Post('battle/recall')
  async recallFleet(@Request() req, @Body() body?: { missionId?: string }) {
    return this.battleService.recallFleet(req.user.userId, body?.missionId);
  }

  @Get('battle/status')
  async getAttackStatus(@Request() req) {
    return this.battleService.getAttackStatus(req.user.userId);
  }

  @Post('battle/process')
  async processBattle(@Request() req): Promise<{
    attackProcessed: boolean;
    attackResult: { battleResult: BattleResult; attacker: any; defender: any } | null;
    recycleProcessed: boolean;
    recycleResult: { metalLoot: number; crystalLoot: number } | null;
    incomingProcessed: boolean;
    incomingResults: any[];
    returnProcessed: boolean;
    returnResult: { returnedFleet: Record<string, number>; loot: Record<string, number> } | null;
    transportProcessed: boolean;
    transportResult: any;
    deployProcessed: boolean;
    deployResult: any;
    colonyProcessed: boolean;
    colonyResult: any;
  }> {
    // 내가 보낸 공격 처리
    const attackResult = await this.battleService.processAttackArrival(req.user.userId);
    // 데브리 수확 처리
    const recycleResult = await this.battleService.processRecycleArrival(req.user.userId);
    // 나에게 오는 공격 처리
    const incomingResults = await this.battleService.processIncomingAttacks(req.user.userId);
    // 내 함대 귀환 처리
    const returnResult = await this.battleService.processFleetReturn(req.user.userId);
    // 수송 도착 처리
    const transportResult = await this.battleService.processTransportArrival(req.user.userId);
    // 배치 도착 처리
    const deployResult = await this.battleService.processDeployArrival(req.user.userId);
    // 식민 미션 완료 처리
    const colonyResult = await this.colonyService.completeColonization(req.user.userId);
    
    return {
      attackProcessed: attackResult !== null,
      attackResult,
      recycleProcessed: recycleResult !== null,
      recycleResult,
      incomingProcessed: incomingResults.length > 0,
      incomingResults,
      returnProcessed: returnResult !== null,
      returnResult,
      transportProcessed: transportResult !== null,
      transportResult,
      deployProcessed: deployResult !== null,
      deployResult,
      colonyProcessed: colonyResult !== null && colonyResult.success,
      colonyResult,
    };
  }

  // ===== 전투 시뮬레이터 =====

  /**
   * 전투 시뮬레이션 실행
   * ACS(연합 공격) 지원, 다중 슬롯 지원
   */
  @Post('simulator/simulate')
  async simulate(@Body() body: SimulationRequest) {
    return this.battleSimulatorService.simulate(body);
  }

  /**
   * 단순 전투 시뮬레이션 (싱글 슬롯)
   */
  @Post('simulator/simple')
  async simulateSimple(@Body() body: {
    attackerFleet: Record<string, number>;
    attackerTech: { weaponsTech: number; shieldTech: number; armorTech: number };
    defenderFleet: Record<string, number>;
    defenderDefense: Record<string, number>;
    defenderTech: { weaponsTech: number; shieldTech: number; armorTech: number };
    config?: Partial<SimulationConfig>;
  }) {
    return this.battleSimulatorService.simulateSimple(
      body.attackerFleet,
      body.attackerTech,
      body.defenderFleet,
      body.defenderDefense,
      body.defenderTech,
      body.config,
    );
  }

  /**
   * 여러 번 시뮬레이션 실행 (통계용)
   */
  @Post('simulator/multiple')
  async simulateMultiple(@Body() body: {
    request: SimulationRequest;
    iterations?: number;
  }) {
    return this.battleSimulatorService.simulateMultiple(
      body.request,
      body.iterations || 100,
    );
  }

  /**
   * 전투 소스 데이터 파싱
   */
  @Post('simulator/parse')
  async parseSourceData(@Body() body: { sourceData: string }) {
    return this.battleSimulatorService.parseBattleSourceData(body.sourceData);
  }

  /**
   * 전투 소스 데이터 생성
   */
  @Post('simulator/generate-source')
  async generateSourceData(@Body() body: {
    attackers: BattleSlot[];
    defenders: BattleSlot[];
    config?: Partial<SimulationConfig>;
  }) {
    const config = {
      rapidFire: true,
      fleetInDebris: 30,
      defenseInDebris: 0,
      debug: false,
      ...body.config,
    };
    return {
      sourceData: this.battleSimulatorService.generateBattleSourceData(
        body.attackers,
        body.defenders,
        config,
      ),
    };
  }

  // ===== 식민지 =====

  /**
   * 식민 미션 시작
   */
  @Post('colony/start')
  async startColonization(@Request() req, @Body() body: { 
    targetCoord: string; 
    fleet: Record<string, number>;
  }) {
    return this.colonyService.startColonization(req.user.userId, body.targetCoord, body.fleet);
  }

  /**
   * 식민 미션 완료 처리
   */
  @Post('colony/complete')
  async completeColonization(@Request() req) {
    return this.colonyService.completeColonization(req.user.userId);
  }

  /**
   * 식민 미션 귀환 (취소)
   */
  @Post('colony/recall')
  async recallColonization(@Request() req) {
    return this.colonyService.recallColonization(req.user.userId);
  }

  /**
   * 함대 귀환 처리
   */
  @Post('colony/return')
  async completeReturn(@Request() req) {
    return this.colonyService.completeReturn(req.user.userId);
  }
}
