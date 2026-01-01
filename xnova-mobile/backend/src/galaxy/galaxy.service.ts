import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Debris, DebrisDocument } from './schemas/debris.schema';
import { MessageService } from '../message/message.service';
import { NAME_MAPPING } from '../game/constants/game-data';

export interface PlanetInfo {
  position: number;
  coordinate: string;
  playerName: string | null;
  playerId: string | null;
  isOwnPlanet: boolean;
  hasDebris: boolean;
  debrisAmount?: { metal: number; crystal: number };
  hasMoon: boolean;
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
}

@Injectable()
export class GalaxyService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Debris.name) private debrisModel: Model<DebrisDocument>,
    private messageService: MessageService,
  ) {}

  // 특정 시스템의 은하 지도 조회
  async getGalaxyMap(galaxy: number, system: number, currentUserId: string): Promise<PlanetInfo[]> {
    // 해당 시스템의 모든 플레이어 조회
    const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
    const [players, debrisFields] = await Promise.all([
      this.userModel.find({ coordinate: pattern }).exec(),
      this.debrisModel.find({ coordinate: pattern }).exec(),
    ]);

    // 행성 포인트 1~15 초기화
    const planets: PlanetInfo[] = [];

    for (let position = 1; position <= 15; position++) {
      const coord = `${galaxy}:${system}:${position}`;
      const player = players.find(p => p.coordinate === coord);
      const debris = debrisFields.find(d => d.coordinate === coord);

      const info: PlanetInfo = {
        position,
        coordinate: coord,
        playerName: player ? player.playerName : null,
        playerId: player ? player._id.toString() : null,
        isOwnPlanet: player ? player._id.toString() === currentUserId : false,
        hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
        debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
        hasMoon: false, // TODO: 달 시스템 구현 시 추가
      };

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

  // 데브리 조회
  async getDebris(coordinate: string) {
    return this.debrisModel.findOne({ coordinate }).exec();
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

  // 정찰 미션 수행
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

    // 대상 행성 조회
    const target = await this.userModel.findOne({ coordinate: targetCoord }).exec();
    if (!target) {
      return { success: false, error: '해당 좌표에 행성이 없습니다.' };
    }

    // 자기 자신 정찰 불가
    if (target._id.toString() === attackerId) {
      return { success: false, error: '자신의 행성은 정찰할 수 없습니다.' };
    }

    // 정탐 기술 레벨
    const mySpyLevel = attacker.researchLevels?.espionageTech || 0;
    const targetSpyLevel = target.researchLevels?.espionageTech || 0;

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

    // 적 함대 수 계산
    const targetFleetCount = this.getTotalFleetCount(target.fleet);

    // 정찰 위성 파괴 확률 계산
    let targetForce = (targetFleetCount * probeCount) / 4;
    if (targetForce > 100) targetForce = 100;

    const targetChance = Math.random() * targetForce;
    const spyerChance = Math.random() * 100;
    const probesDestroyed = targetChance >= spyerChance;

    // 정찰 위성 소모
    attacker.fleet.espionageProbe -= probeCount;

    // 파괴된 경우 데브리 생성
    let probesLost = 0;
    let probesSurvived = probeCount;
    if (probesDestroyed) {
      probesLost = probeCount;
      probesSurvived = 0;
      // 정찰 위성 1대당 300 크리스탈 잔해
      await this.updateDebris(targetCoord, 0, probeCount * 300);
    }

    await attacker.save();

    // 정찰 보고서 생성
    const report = this.generateSpyReport(target, stScore, probesLost, probesSurvived, targetCoord);

    // 공격자에게 정찰 보고서 메시지 전송
    await this.messageService.createMessage({
      receiverId: attackerId,
      senderName: '함대 사령부',
      title: `정찰 보고서: ${targetCoord} [${target.playerName}]`,
      content: this.formatSpyReportContent(report),
      type: 'battle',
      metadata: { type: 'spy', report },
    });

    // 대상자에게 정찰 알림 전송
    await this.messageService.createMessage({
      receiverId: target._id.toString(),
      senderName: '방어 시스템',
      title: `정찰 감지: ${attacker.coordinate}`,
      content: `적 함대가 ${attacker.coordinate}에서 당신의 행성을 정찰했습니다.\n\n` +
        `정찰 위성 ${probeCount}대가 발견되었습니다.` +
        (probesDestroyed ? `\n방어 시스템에 의해 모든 정찰 위성이 파괴되었습니다.` : ''),
      type: 'battle',
      metadata: { type: 'spy_alert', attackerCoord: attacker.coordinate },
    });

    return {
      success: true,
      report,
      message: probesDestroyed 
        ? `정찰 완료. 정찰 위성 ${probesLost}대가 파괴되었습니다.`
        : `정찰 완료. 정찰 위성 ${probesSurvived}대가 귀환했습니다.`,
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

  // 정찰 보고서 생성
  private generateSpyReport(
    target: UserDocument,
    stScore: number,
    probesLost: number,
    probesSurvived: number,
    targetCoord: string,
  ): SpyReport {
    const report: SpyReport = {
      targetCoord,
      targetName: target.playerName,
      probesLost,
      probesSurvived,
    };

    // ST ≤ 1: 자원만
    if (stScore >= 1) {
      report.resources = {
        metal: target.resources?.metal || 0,
        crystal: target.resources?.crystal || 0,
        deuterium: target.resources?.deuterium || 0,
        energy: target.resources?.energy || 0,
      };
    }

    // ST = 2: 자원 + 함대
    if (stScore >= 2) {
      report.fleet = this.filterNonZero(target.fleet);
    }

    // ST 3~4: 자원 + 함대 + 방어시설
    if (stScore >= 3) {
      report.defense = this.filterNonZero(target.defense);
    }

    // ST 5~6: 자원 + 함대 + 방어시설 + 건물
    if (stScore >= 5) {
      report.buildings = {
        ...this.filterNonZero(target.mines),
        ...this.filterNonZero(target.facilities),
      };
    }

    // ST ≥ 7: 모든 정보 + 연구
    if (stScore >= 7) {
      report.research = this.filterNonZero(target.researchLevels);
    }

    return report;
  }

  // 0이 아닌 값만 필터링
  private filterNonZero(obj: any): Record<string, number> {
    if (!obj) return {};
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(obj)) {
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
    content += `정찰 위성: ${report.probesSurvived}대 귀환, ${report.probesLost}대 손실\n\n`;

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
