import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../planet/schemas/planet.schema';
import { Debris, DebrisDocument } from './schemas/debris.schema';
import { MessageService } from '../message/message.service';
import { NAME_MAPPING } from '../game/constants/game-data';

export interface PlanetInfo {
  position: number;
  coordinate: string;
  playerName: string | null;
  playerId: string | null;
  isOwnPlanet: boolean;
  isColony: boolean;  // 식민지 여부
  ownerName?: string | null;  // 식민지인 경우 소유자 이름 (모행성인 경우 null)
  hasDebris: boolean;
  debrisAmount?: { metal: number; crystal: number };
  hasMoon: boolean;
  lastActivity: string | null;  // ISO 날짜 문자열
}

export interface SpyReport {
  targetCoord: string;
  targetName: string;
  resources?: { metal: number; crystal: number; deuterium: number; energy: number };
  fleet?: Record<string, number>;
  defense?: Record<string, number>;
  buildings?: Record<string, number>;
  research?: Record<string, number>;
  probesLost: number;
  probesSurvived: number;
  stScore: number;
  mySpyLevel: number;
  targetSpyLevel: number;
}

// 데브리 만료 시간: 3일 (밀리초)
const DEBRIS_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;

@Injectable()
export class GalaxyService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
    @InjectModel(Debris.name) private debrisModel: Model<DebrisDocument>,
    private messageService: MessageService,
  ) {}

  /**
   * 만료된 데브리 정리 (3일 이상 경과한 데브리 삭제)
   */
  async cleanupExpiredDebris(): Promise<number> {
    const expiryDate = new Date(Date.now() - DEBRIS_EXPIRY_MS);
    const result = await this.debrisModel.deleteMany({
      createdAt: { $lt: expiryDate },
    }).exec();
    return result.deletedCount || 0;
  }

  /**
   * 데브리가 만료되었는지 확인
   */
  private isDebrisExpired(debris: DebrisDocument): boolean {
    if (!debris.createdAt) return false;
    const createdAt = debris.createdAt as Date;
    return Date.now() - createdAt.getTime() > DEBRIS_EXPIRY_MS;
  }

  // 특정 시스템의 은하 지도 조회
  async getGalaxyMap(galaxy: number, system: number, currentUserId: string): Promise<PlanetInfo[]> {
    // 해당 시스템의 모든 플레이어 및 식민지 조회
    const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
    const expiryDate = new Date(Date.now() - DEBRIS_EXPIRY_MS);
    
    const [players, colonies, debrisFields] = await Promise.all([
      this.userModel.find({ coordinate: pattern }).exec(),
      this.planetModel.find({ coordinate: pattern }).exec(),
      // 만료되지 않은 데브리만 조회
      this.debrisModel.find({ 
        coordinate: pattern,
        createdAt: { $gte: expiryDate },
      }).exec(),
      // 현재 사용자 활동 시간 업데이트
      this.userModel.findByIdAndUpdate(currentUserId, { lastActivity: new Date() }).exec(),
      // 백그라운드에서 만료된 데브리 정리
      this.cleanupExpiredDebris(),
    ]);

    // 식민지 소유자들의 playerName 조회
    const colonyOwnerIds = [...new Set(colonies.map(c => c.ownerId))];
    const colonyOwners = await this.userModel.find({ 
      _id: { $in: colonyOwnerIds } 
    }).select('_id playerName').exec();
    const ownerNameMap = new Map(colonyOwners.map(o => [o._id.toString(), o.playerName]));

    // 행성 포인트 1~15 초기화
    const planets: PlanetInfo[] = [];

    for (let position = 1; position <= 15; position++) {
      const coord = `${galaxy}:${system}:${position}`;
      const player = players.find(p => p.coordinate === coord);
      const colony = colonies.find(c => c.coordinate === coord);
      const debris = debrisFields.find(d => d.coordinate === coord);

      let info: PlanetInfo;

      if (player) {
        // 모행성 (User 기반)
        info = {
          position,
          coordinate: coord,
          playerName: player.playerName,
          playerId: player._id.toString(),
          isOwnPlanet: player._id.toString() === currentUserId,
          isColony: false,
          ownerName: null,
          hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
          debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
          hasMoon: false,
          lastActivity: player?.lastActivity ? player.lastActivity.toISOString() : null,
        };
      } else if (colony) {
        // 식민지 (Planet 기반)
        const ownerId = colony.ownerId;
        const ownerName = ownerNameMap.get(ownerId) || null;
        
        info = {
          position,
          coordinate: coord,
          playerName: ownerName || colony.name || '식민지',
          playerId: ownerId,
          isOwnPlanet: ownerId === currentUserId,
          isColony: true,
          ownerName: ownerName,  // 식민지 소유자 이름
          hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
          debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
          hasMoon: false,
          lastActivity: null,
        };
      } else {
        // 빈 좌표
        info = {
          position,
          coordinate: coord,
          playerName: null,
          playerId: null,
          isOwnPlanet: false,
          isColony: false,
          ownerName: null,
          hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
          debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
          hasMoon: false,
          lastActivity: null,
        };
      }

      planets.push(info);
    }

    return planets;
  }

  // 데브리 업데이트
  async updateDebris(coordinate: string, metal: number, crystal: number) {
    let debris = await this.debrisModel.findOne({ coordinate }).exec();
    if (debris) {
      debris.metal += metal;
      debris.crystal += crystal;
      await debris.save();
    } else if (metal > 0 || crystal > 0) {
      debris = new this.debrisModel({
        coordinate,
        metal,
        crystal,
      });
      await debris.save();
    }
  }

  // 데브리 조회 (만료된 데브리는 삭제 후 null 반환)
  async getDebris(coordinate: string) {
    const debris = await this.debrisModel.findOne({ coordinate }).exec();
    if (!debris) return null;
    
    // 만료된 데브리면 삭제하고 null 반환
    if (this.isDebrisExpired(debris)) {
      await this.debrisModel.deleteOne({ coordinate }).exec();
      return null;
    }
    
    return debris;
  }

  // 데브리 삭제 또는 감소
  async consumeDebris(coordinate: string, metal: number, crystal: number) {
    const debris = await this.debrisModel.findOne({ coordinate }).exec();
    if (debris) {
      debris.metal = Math.max(0, debris.metal - metal);
      debris.crystal = Math.max(0, debris.crystal - crystal);
      if (debris.metal === 0 && debris.crystal === 0) {
        await this.debrisModel.deleteOne({ coordinate }).exec();
      } else {
        await debris.save();
      }
    }
  }

  // 플레이어 정보 조회 (은하지도에서 클릭 시)
  async getPlayerInfo(targetUserId: string, currentUserId: string) {
    const target = await this.userModel.findById(targetUserId).exec();
    if (!target) return null;

    const isOwn = targetUserId === currentUserId;

    // 기본 정보만 반환 (자세한 정보는 정탐을 통해)
    return {
      playerName: target.playerName,
      coordinate: target.coordinate,
      isOwnPlanet: isOwn,
      // 자신의 행성이면 상세 정보 표시
      ...(isOwn && {
        resources: target.resources,
        mines: target.mines,
        facilities: target.facilities,
      }),
    };
  }

  // 좌표로 플레이어 검색
  async findPlayerByCoordinate(coordinate: string) {
    return this.userModel.findOne({ coordinate }).exec();
  }

  // 특정 은하의 모든 시스템 목록 (활성화된 시스템만)
  async getActiveSystems(galaxy: number): Promise<number[]> {
    const pattern = new RegExp(`^${galaxy}:\\d+:\\d+$`);
    const players = await this.userModel.find({ coordinate: pattern }).select('coordinate').exec();

    const systems = new Set<number>();
    for (const player of players) {
      const parts = player.coordinate.split(':');
      systems.add(parseInt(parts[1]));
    }

    return Array.from(systems).sort((a, b) => a - b);
  }

  /**
   * 좌표로 행성 찾기 (모행성 + 식민지)
   */
  private async findPlanetByCoordinate(coordinate: string): Promise<{ 
    user: UserDocument | null; 
    planet: PlanetDocument | null; 
    ownerId: string | null;
    isColony: boolean;
  }> {
    // 1. User 컬렉션에서 모행성 찾기
    const user = await this.userModel.findOne({ coordinate }).exec();
    if (user) {
      return { user, planet: null, ownerId: user._id.toString(), isColony: false };
    }

    // 2. Planet 컬렉션에서 식민지 찾기
    const planet = await this.planetModel.findOne({ coordinate }).exec();
    if (planet) {
      const owner = await this.userModel.findById(planet.ownerId).exec();
      return { user: owner, planet, ownerId: planet.ownerId, isColony: true };
    }

    return { user: null, planet: null, ownerId: null, isColony: false };
  }

  // 좌표 간 거리 계산
  private calculateDistance(coordA: string, coordB: string): number {
    const partsA = coordA.split(':').map(Number);
    const partsB = coordB.split(':').map(Number);

    const [galaxyA, systemA, planetA] = partsA;
    const [galaxyB, systemB, planetB] = partsB;

    // 다른 은하
    if (galaxyA !== galaxyB) {
      return 20000 * Math.abs(galaxyA - galaxyB);
    }

    // 같은 은하, 다른 시스템
    if (systemA !== systemB) {
      return 2700 + (95 * Math.abs(systemA - systemB));
    }

    // 같은 시스템, 다른 행성
    if (planetA !== planetB) {
      return 1000 + (5 * Math.abs(planetA - planetB));
    }

    return 0;
  }

  // 미션 ID 생성
  private generateMissionId(): string {
    return `spy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 정찰 미션 시작 (이동 시간 적용)
  async spyOnPlanet(attackerId: string, targetCoord: string, probeCount: number) {
    // 공격자 정보 조회
    const attacker = await this.userModel.findById(attackerId).exec();
    if (!attacker) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    // 정찰 위성 보유 확인
    const availableProbes = attacker.fleet?.espionageProbe || 0;
    if (availableProbes < probeCount) {
      return { success: false, error: `정찰 위성이 부족합니다. (보유: ${availableProbes})` };
    }

    // 대상 행성 조회 (모행성 + 식민지)
    const targetResult = await this.findPlanetByCoordinate(targetCoord);
    if (!targetResult.ownerId) {
      return { success: false, error: '해당 좌표에 행성이 없습니다.' };
    }

    // 자기 자신 정찰 불가
    if (targetResult.ownerId === attackerId) {
      return { success: false, error: '자신의 행성은 정찰할 수 없습니다.' };
    }

    // 거리 및 이동 시간 계산
    const attackerCoord = attacker.coordinate;
    const distance = this.calculateDistance(attackerCoord, targetCoord);
    
    // 정찰 위성 속도: 100,000,000 (게임 데이터 기준)
    const probeSpeed = 100000000;
    const travelTime = (distance / probeSpeed) * 3600; // 초 단위
    
    // 최소 이동 시간 30초 보장
    const actualTravelTime = Math.max(30, travelTime);

    const startTime = new Date();
    const arrivalTime = new Date(startTime.getTime() + actualTravelTime * 1000);

    // 정찰 위성 차감
    attacker.fleet.espionageProbe -= probeCount;
    attacker.markModified('fleet');

    // fleetMissions에 정탐 미션 추가
    const missionId = this.generateMissionId();
    const newMission = {
      missionId,
      phase: 'outbound',
      missionType: 'spy',
      targetCoord,
      targetUserId: targetResult.ownerId,
      fleet: { espionageProbe: probeCount },
      capacity: 0,
      travelTime: actualTravelTime,
      startTime,
      arrivalTime,
      originCoord: attackerCoord,
    };

    if (!attacker.fleetMissions) {
      attacker.fleetMissions = [];
    }
    attacker.fleetMissions.push(newMission as any);
    attacker.markModified('fleetMissions');

    await attacker.save();

    return {
      success: true,
      message: `정찰 위성 ${probeCount}대가 ${targetCoord}로 출발했습니다. 도착까지 ${Math.ceil(actualTravelTime)}초`,
      missionId,
      travelTime: actualTravelTime,
      arrivalTime,
    };
  }

  // 정찰 미션 도착 처리
  async processSpyArrival(attackerId: string, missionId?: string) {
    const attacker = await this.userModel.findById(attackerId).exec();
    if (!attacker) return null;

    // fleetMissions에서 도착한 spy 미션 찾기
    const now = Date.now();
    const mission = missionId
      ? attacker.fleetMissions?.find((m: any) => m.missionId === missionId && m.missionType === 'spy' && m.phase === 'outbound')
      : attacker.fleetMissions?.find((m: any) => {
          if (m.missionType !== 'spy' || m.phase !== 'outbound') return false;
          return new Date(m.arrivalTime).getTime() <= now;
        });

    if (!mission) return null;

    const m = mission as any;
    const targetCoord = m.targetCoord;
    const probeCount = m.fleet?.espionageProbe || 1;
    const currentMissionId = m.missionId;

    // 대상 행성 조회 (모행성 + 식민지)
    const targetResult = await this.findPlanetByCoordinate(targetCoord);
    if (!targetResult.ownerId) {
      // 미션 제거
      attacker.fleetMissions = attacker.fleetMissions?.filter((fm: any) => fm.missionId !== currentMissionId);
      attacker.markModified('fleetMissions');
      await attacker.save();
      return null;
    }

    const targetOwner = targetResult.user;
    const targetPlanet = targetResult.planet;
    const isColony = targetResult.isColony;

    if (!targetOwner) {
      attacker.fleetMissions = attacker.fleetMissions?.filter((fm: any) => fm.missionId !== currentMissionId);
      attacker.markModified('fleetMissions');
      await attacker.save();
      return null;
    }

    // 정탐 기술 레벨 (소유자 기준)
    const mySpyLevel = attacker.researchLevels?.espionageTech || 0;
    const targetSpyLevel = targetOwner.researchLevels?.espionageTech || 0;

    // ST 점수 계산 (OGame 공식)
    let stScore: number;
    if (targetSpyLevel > mySpyLevel) {
      const diff = targetSpyLevel - mySpyLevel;
      stScore = probeCount - Math.pow(diff, 2);
    } else if (mySpyLevel > targetSpyLevel) {
      const diff = mySpyLevel - targetSpyLevel;
      stScore = probeCount + Math.pow(diff, 2);
    } else {
      stScore = mySpyLevel;
    }

    // 적 함대 수 계산 (식민지면 식민지 함대, 모행성이면 모행성 함대)
    const targetFleet = isColony ? (targetPlanet?.fleet || {}) : (targetOwner.fleet || {});
    const targetFleetCount = this.getTotalFleetCount(targetFleet);

    // 정찰 위성 파괴 확률 계산
    let targetForce = (targetFleetCount * probeCount) / 4;
    if (targetForce > 100) targetForce = 100;

    const targetChance = Math.random() * targetForce;
    const spyerChance = Math.random() * 100;
    const probesDestroyed = targetChance >= spyerChance;

    // 파괴된 경우 데브리 생성
    let probesLost = 0;
    let probesSurvived = probeCount;
    if (probesDestroyed) {
      probesLost = probeCount;
      probesSurvived = 0;
      // 정찰 위성 1대당 300 크리스탈 잔해
      await this.updateDebris(targetCoord, 0, probeCount * 300);
    } else {
      // 파괴되지 않은 경우: 정찰 위성 귀환 (즉시 반환)
      attacker.fleet.espionageProbe = (attacker.fleet.espionageProbe || 0) + probeCount;
      attacker.markModified('fleet');
    }

    // 미션 제거
    attacker.fleetMissions = attacker.fleetMissions?.filter((fm: any) => fm.missionId !== currentMissionId);
    attacker.markModified('fleetMissions');
    await attacker.save();

    // 정찰 보고서 생성
    const report = this.generateSpyReport(
      targetOwner, 
      targetPlanet, 
      isColony,
      stScore, 
      probesLost, 
      probesSurvived, 
      targetCoord, 
      mySpyLevel, 
      targetSpyLevel,
    );

    // 공격자에게 정찰 보고서 메시지 전송
    await this.messageService.createMessage({
      receiverId: attackerId,
      senderName: '함대 사령부',
      title: `정찰 보고서: ${targetCoord} [${targetOwner.playerName}]${isColony ? ' (식민지)' : ''}`,
      content: this.formatSpyReportContent(report),
      type: 'battle',
      metadata: { type: 'spy', report },
    });

    // 대상자에게 정찰 알림 전송
    await this.messageService.createMessage({
      receiverId: targetResult.ownerId!,
      senderName: '방어 시스템',
      title: `정찰 감지: ${attacker.coordinate}`,
      content: `적 함대가 ${attacker.coordinate}에서 당신의 ${isColony ? '식민지' : '행성'}(${targetCoord})을 정찰했습니다.\n\n` +
        `정찰 위성 ${probeCount}대가 발견되었습니다.` +
        (probesDestroyed ? `\n방어 시스템에 의해 모든 정찰 위성이 파괴되었습니다.` : ''),
      type: 'battle',
      metadata: { type: 'spy_alert', attackerCoord: attacker.coordinate },
    });

    return {
      success: true,
      report,
      probesDestroyed,
      probesLost,
      probesSurvived,
    };
  }

  // 총 함대 수 계산
  private getTotalFleetCount(fleet: any): number {
    if (!fleet) return 0;
    return (
      (fleet.smallCargo || 0) +
      (fleet.largeCargo || 0) +
      (fleet.lightFighter || 0) +
      (fleet.heavyFighter || 0) +
      (fleet.cruiser || 0) +
      (fleet.battleship || 0) +
      (fleet.battlecruiser || 0) +
      (fleet.bomber || 0) +
      (fleet.destroyer || 0) +
      (fleet.deathstar || 0) +
      (fleet.recycler || 0) +
      (fleet.espionageProbe || 0) +
      (fleet.solarSatellite || 0)
    );
  }

  // 실시간 자원 계산 (정찰용) - 모행성/식민지 모두 지원
  private calculateCurrentResourcesForSpy(
    owner: UserDocument, 
    planet: PlanetDocument | null, 
    isColony: boolean
  ): { metal: number; crystal: number; deuterium: number; energy: number } {
    const now = new Date();
    
    // 식민지면 식민지 데이터, 아니면 모행성 데이터 사용
    const resources = isColony ? (planet?.resources || {}) : (owner.resources || {});
    const mines = isColony ? (planet?.mines || {}) : (owner.mines || {});
    const fleet = isColony ? (planet?.fleet || {}) : (owner.fleet || {});
    const lastUpdate = isColony ? (planet?.lastResourceUpdate || now) : (owner.lastResourceUpdate || now);
    const planetTemperature = isColony 
      ? (planet?.planetInfo?.tempMax ?? 50) 
      : (owner.planetInfo?.temperature ?? 50);

    const elapsedSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

    // 에너지 계산
    const solarPlantLevel = (mines as any).solarPlant || 0;
    const fusionLevel = (mines as any).fusionReactor || 0;
    const satelliteCount = (fleet as any).solarSatellite || 0;

    // 에너지 생산량
    const solarEnergy = solarPlantLevel > 0 ? Math.floor(20 * solarPlantLevel * Math.pow(1.1, solarPlantLevel)) : 0;
    const satelliteEnergy = satelliteCount > 0 ? Math.floor((planetTemperature / 4 + 20) * satelliteCount) : 0;
    const fusionEnergy = fusionLevel > 0 ? Math.floor(30 * fusionLevel * Math.pow(1.05, fusionLevel)) : 0;
    const energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

    // 에너지 소비량
    const metalMineLevel = (mines as any).metalMine || 0;
    const crystalMineLevel = (mines as any).crystalMine || 0;
    const deuteriumMineLevel = (mines as any).deuteriumMine || 0;
    
    let energyConsumption = 0;
    if (metalMineLevel > 0) energyConsumption += Math.floor(10 * metalMineLevel * Math.pow(1.1, metalMineLevel));
    if (crystalMineLevel > 0) energyConsumption += Math.floor(10 * crystalMineLevel * Math.pow(1.1, crystalMineLevel));
    if (deuteriumMineLevel > 0) energyConsumption += Math.floor(20 * deuteriumMineLevel * Math.pow(1.05, deuteriumMineLevel));

    // 에너지 비율
    let energyRatio = 1.0;
    if (energyProduction < energyConsumption) {
      energyRatio = Math.max(0.1, energyProduction / energyConsumption);
    }

    // 자원 생산량 (시간당) - 5배 속도 적용
    const SPEED_MULTIPLIER = 5;
    const metalProduction = Math.floor(90 * (metalMineLevel + 1) * Math.pow(1.1, metalMineLevel + 1) * SPEED_MULTIPLIER) * energyRatio;
    const crystalProduction = Math.floor(60 * (crystalMineLevel + 1) * Math.pow(1.1, crystalMineLevel + 1) * SPEED_MULTIPLIER) * energyRatio;
    const deuteriumProduction = Math.floor(30 * (deuteriumMineLevel + 1) * Math.pow(1.1, deuteriumMineLevel + 1) * SPEED_MULTIPLIER) * energyRatio;
    const fusionConsumption = fusionLevel > 0 ? Math.floor(10 * fusionLevel * Math.pow(1.1, fusionLevel)) : 0;

    // 경과 시간에 따른 자원 계산
    const hoursElapsed = elapsedSeconds / 3600;
    
    return {
      metal: ((resources as any).metal || 0) + metalProduction * hoursElapsed,
      crystal: ((resources as any).crystal || 0) + crystalProduction * hoursElapsed,
      deuterium: ((resources as any).deuterium || 0) + (deuteriumProduction - fusionConsumption) * hoursElapsed,
      energy: energyProduction - energyConsumption,
    };
  }

  // 정찰 보고서 생성 - 모행성/식민지 모두 지원
  private generateSpyReport(
    owner: UserDocument,
    planet: PlanetDocument | null,
    isColony: boolean,
    stScore: number,
    probesLost: number,
    probesSurvived: number,
    targetCoord: string,
    mySpyLevel: number,
    targetSpyLevel: number,
  ): SpyReport {
    const report: SpyReport = {
      targetCoord,
      targetName: owner.playerName + (isColony ? ' (식민지)' : ''),
      probesLost,
      probesSurvived,
      stScore,
      mySpyLevel,
      targetSpyLevel,
    };

    // 식민지면 식민지 데이터, 아니면 모행성 데이터 사용
    const targetFleet = isColony ? (planet?.fleet || {}) : (owner.fleet || {});
    const targetDefense = isColony ? (planet?.defense || {}) : (owner.defense || {});
    const targetMines = isColony ? (planet?.mines || {}) : (owner.mines || {});
    const targetFacilities = isColony ? (planet?.facilities || {}) : (owner.facilities || {});

    // ST ≤ 1: 자원만 (실시간 계산)
    if (stScore >= 1) {
      const currentResources = this.calculateCurrentResourcesForSpy(owner, planet, isColony);
      report.resources = {
        metal: currentResources.metal,
        crystal: currentResources.crystal,
        deuterium: currentResources.deuterium,
        energy: currentResources.energy,
      };
    }

    // ST = 2: 자원 + 함대
    if (stScore >= 2) {
      report.fleet = this.filterNonZero(targetFleet);
    }

    // ST 3~4: 자원 + 함대 + 방어시설
    if (stScore >= 3) {
      report.defense = this.filterNonZero(targetDefense);
    }

    // ST 5~6: 자원 + 함대 + 방어시설 + 건물
    if (stScore >= 5) {
      const buildings = {
        ...this.filterNonZero(targetMines),
        ...this.filterNonZero(targetFacilities),
      };
      // 빈 객체라도 섹션 표시 (모든 건물이 0레벨인 경우)
      report.buildings = Object.keys(buildings).length > 0 ? buildings : { _empty: 0 };
    }

    // ST ≥ 7: 모든 정보 + 연구 (연구는 항상 소유자 기준)
    if (stScore >= 7) {
      const research = this.filterNonZero(owner.researchLevels);
      // 빈 객체라도 섹션 표시 (모든 연구가 0레벨인 경우)
      report.research = Object.keys(research).length > 0 ? research : { _empty: 0 };
    }

    return report;
  }

  // 0이 아닌 값만 필터링 (Mongoose 문서 지원)
  private filterNonZero(obj: any): Record<string, number> {
    if (!obj) return {};
    // Mongoose 문서를 일반 객체로 변환
    const plainObj = obj.toObject ? obj.toObject() : obj;
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(plainObj)) {
      // _id, __v 등 메타 필드 제외
      if (key.startsWith('_') || key === '__v') continue;
      if (typeof value === 'number' && value > 0) {
        result[key] = value;
      }
    }
    return result;
  }

  // 정찰 보고서 내용 포맷팅
  private formatSpyReportContent(report: SpyReport): string {
    let content = `=== 정찰 보고서 ===\n`;
    content += `대상: ${report.targetName} [${report.targetCoord}]\n`;
    content += `정찰 위성: ${report.probesSurvived}대 귀환, ${report.probesLost}대 손실\n`;
    content += `ST 점수: ${report.stScore} (내 정탐기술: Lv.${report.mySpyLevel}, 상대 정탐기술: Lv.${report.targetSpyLevel})\n`;
    content += `※ ST≥2: 함대, ST≥3: 방어, ST≥5: 건물, ST≥7: 연구\n\n`;

    if (report.resources) {
      content += `【 자원 현황 】\n`;
      content += `메탈: ${Math.floor(report.resources.metal).toLocaleString()}\n`;
      content += `크리스탈: ${Math.floor(report.resources.crystal).toLocaleString()}\n`;
      content += `듀테륨: ${Math.floor(report.resources.deuterium).toLocaleString()}\n`;
      content += `에너지: ${Math.floor(report.resources.energy).toLocaleString()}\n\n`;
    }

    if (report.fleet) {
      content += `【 함대 】\n`;
      if (Object.keys(report.fleet).length === 0) {
        content += `함대 없음\n`;
      } else {
        for (const [key, value] of Object.entries(report.fleet)) {
          const name = NAME_MAPPING[key] || key;
          content += `${name}: ${value}\n`;
        }
      }
      content += `\n`;
    }

    if (report.defense) {
      content += `【 방어시설 】\n`;
      if (Object.keys(report.defense).length === 0) {
        content += `방어시설 없음\n`;
      } else {
        for (const [key, value] of Object.entries(report.defense)) {
          const name = NAME_MAPPING[key] || key;
          content += `${name}: ${value}\n`;
        }
      }
      content += `\n`;
    }

    if (report.buildings) {
      content += `【 건물 】\n`;
      if (Object.keys(report.buildings).length === 0) {
        content += `건물 정보 없음\n`;
      } else {
        for (const [key, value] of Object.entries(report.buildings)) {
          const name = NAME_MAPPING[key] || key;
          content += `${name}: Lv.${value}\n`;
        }
      }
      content += `\n`;
    }

    if (report.research) {
      content += `【 연구 】\n`;
      if (Object.keys(report.research).length === 0) {
        content += `연구 정보 없음\n`;
      } else {
        for (const [key, value] of Object.entries(report.research)) {
          const name = NAME_MAPPING[key] || key;
          content += `${name}: Lv.${value}\n`;
        }
      }
    }

    return content;
  }
}
