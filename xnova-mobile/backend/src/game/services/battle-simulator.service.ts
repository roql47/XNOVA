import { Injectable } from '@nestjs/common';
import { BattleService, BattleResult } from './battle.service';
import { BattleReportService, BattleParticipant, OGameBattleResult, OGameRoundInfo } from './battle-report.service';
import { FLEET_DATA, DEFENSE_DATA, NAME_MAPPING } from '../constants/game-data';

/**
 * OGame 전투 시뮬레이터 서비스
 * 원본 admin_sim.php 기반
 */

// 전투 슬롯 인터페이스 (ACS 지원)
export interface BattleSlot {
  name: string;              // 플레이어 이름
  id: string;                // 플레이어 ID
  coordinate: string;        // 좌표 (g:s:p 형식)
  weaponsTech: number;       // 무기 기술 레벨
  shieldTech: number;        // 쉴드 기술 레벨
  armorTech: number;         // 장갑 기술 레벨
  fleet: Record<string, number>;      // 함대
  defense?: Record<string, number>;   // 방어시설 (방어측만)
}

// 시뮬레이션 설정 인터페이스
export interface SimulationConfig {
  rapidFire: boolean;        // 연사 활성화 (기본: true)
  fleetInDebris: number;     // 함선 잔해 비율 (기본: 30)
  defenseInDebris: number;   // 방어시설 잔해 비율 (기본: 0)
  debug: boolean;            // 디버그 모드
}

// 시뮬레이션 요청 인터페이스
export interface SimulationRequest {
  attackers: BattleSlot[];   // 공격측 슬롯들 (ACS)
  defenders: BattleSlot[];   // 방어측 슬롯들
  config?: Partial<SimulationConfig>;
  battleSource?: string;     // 외부 전투 소스 데이터 (선택적)
}

// 시뮬레이션 결과 인터페이스
export interface SimulationResult {
  battleResult: OGameBattleResult;
  htmlReport: string;
  attackerLosses: { metal: number; crystal: number; deuterium: number; total: number };
  defenderLosses: { metal: number; crystal: number; deuterium: number; total: number };
  debris: { metal: number; crystal: number };
  moonChance: number;
  moonCreated: boolean;
  restoredDefenses: Record<string, number>;
  resultType: 'awon' | 'dwon' | 'draw';
  sourceData?: string;       // 디버그용 소스 데이터
}

// 유닛 GID 매핑 (OGame 형식)
const FLEET_GID_MAP: Record<number, string> = {
  202: 'smallCargo',
  203: 'largeCargo',
  204: 'lightFighter',
  205: 'heavyFighter',
  206: 'cruiser',
  207: 'battleship',
  208: 'colonyShip',
  209: 'recycler',
  210: 'espionageProbe',
  211: 'bomber',
  212: 'solarSatellite',
  213: 'destroyer',
  214: 'deathstar',
  215: 'battlecruiser',
};

const DEFENSE_GID_MAP: Record<number, string> = {
  401: 'rocketLauncher',
  402: 'lightLaser',
  403: 'heavyLaser',
  404: 'gaussCannon',
  405: 'ionCannon',
  406: 'plasmaTurret',
  407: 'smallShieldDome',
  408: 'largeShieldDome',
};

const REVERSE_FLEET_GID_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(FLEET_GID_MAP).map(([k, v]) => [v, parseInt(k)])
);

const REVERSE_DEFENSE_GID_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(DEFENSE_GID_MAP).map(([k, v]) => [v, parseInt(k)])
);

@Injectable()
export class BattleSimulatorService {
  constructor(
    private battleService: BattleService,
    private battleReportService: BattleReportService,
  ) {}

  /**
   * 기본 시뮬레이션 설정
   */
  private getDefaultConfig(): SimulationConfig {
    return {
      rapidFire: true,
      fleetInDebris: 30,
      defenseInDebris: 0,
      debug: false,
    };
  }

  /**
   * 전투 소스 데이터 생성 (GenBattleSourceData)
   * OGame 형식의 텍스트 데이터 생성
   */
  generateBattleSourceData(
    attackers: BattleSlot[],
    defenders: BattleSlot[],
    config: SimulationConfig,
  ): string {
    let source = '';
    
    // 설정
    source += `Rapidfire = ${config.rapidFire ? 1 : 0}\n`;
    source += `FID = ${config.fleetInDebris}\n`;
    source += `DID = ${config.defenseInDebris}\n`;
    source += `Attackers = ${attackers.length}\n`;
    source += `Defenders = ${defenders.length}\n`;

    // 공격측 슬롯 데이터
    for (let n = 0; n < attackers.length; n++) {
      const a = attackers[n];
      const [g, s, p] = a.coordinate.split(':');
      
      source += `Attacker${n} = ({${a.name}} ${a.id} ${g} ${s} ${p} `;
      source += `${a.weaponsTech} ${a.shieldTech} ${a.armorTech} `;
      
      // 함대 (GID 순서대로)
      for (let gid = 202; gid <= 215; gid++) {
        const type = FLEET_GID_MAP[gid];
        if (type) {
          source += `${a.fleet[type] || 0} `;
        }
      }
      source += ')\n';
    }

    // 방어측 슬롯 데이터
    for (let n = 0; n < defenders.length; n++) {
      const d = defenders[n];
      const [g, s, p] = d.coordinate.split(':');
      
      source += `Defender${n} = ({${d.name}} ${d.id} ${g} ${s} ${p} `;
      source += `${d.weaponsTech} ${d.shieldTech} ${d.armorTech} `;
      
      // 함대
      for (let gid = 202; gid <= 215; gid++) {
        const type = FLEET_GID_MAP[gid];
        if (type) {
          source += `${d.fleet[type] || 0} `;
        }
      }
      
      // 방어시설
      for (let gid = 401; gid <= 408; gid++) {
        const type = DEFENSE_GID_MAP[gid];
        if (type && d.defense) {
          source += `${d.defense[type] || 0} `;
        } else {
          source += '0 ';
        }
      }
      source += ')\n';
    }

    return source;
  }

  /**
   * 전투 소스 데이터 파싱 (ParseBattleDataSource)
   * OGame 형식의 텍스트 데이터를 슬롯 배열로 변환
   */
  parseBattleSourceData(source: string): { attackers: BattleSlot[]; defenders: BattleSlot[] } {
    const attackers: BattleSlot[] = [];
    const defenders: BattleSlot[] = [];
    
    const lines = source.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 공격측 파싱
      if (trimmedLine.startsWith('Attacker')) {
        const match = trimmedLine.match(/Attacker(\d+)\s*=\s*\((.+)\)/);
        if (match) {
          const index = parseInt(match[1]);
          const data = match[2];
          
          // 이름 추출: {NAME}
          const nameMatch = data.match(/\{([^}]+)\}/);
          const name = nameMatch ? nameMatch[1] : 'Unknown';
          
          // 나머지 값들 파싱
          const valuesStr = data.substring(data.indexOf('}') + 1).trim();
          const values = valuesStr.split(/\s+/).map(v => parseInt(v) || 0);
          
          const fleet: Record<string, number> = {};
          let fleetIndex = 7; // 함대 시작 인덱스
          
          for (let gid = 202; gid <= 215; gid++) {
            const type = FLEET_GID_MAP[gid];
            if (type && values[fleetIndex] !== undefined) {
              fleet[type] = values[fleetIndex];
            }
            fleetIndex++;
          }
          
          attackers[index] = {
            name,
            id: values[0]?.toString() || '0',
            coordinate: `${values[1]}:${values[2]}:${values[3]}`,
            weaponsTech: values[4] || 0,
            shieldTech: values[5] || 0,
            armorTech: values[6] || 0,
            fleet,
          };
        }
      }
      
      // 방어측 파싱
      else if (trimmedLine.startsWith('Defender')) {
        const match = trimmedLine.match(/Defender(\d+)\s*=\s*\((.+)\)/);
        if (match) {
          const index = parseInt(match[1]);
          const data = match[2];
          
          const nameMatch = data.match(/\{([^}]+)\}/);
          const name = nameMatch ? nameMatch[1] : 'Unknown';
          
          const valuesStr = data.substring(data.indexOf('}') + 1).trim();
          const values = valuesStr.split(/\s+/).map(v => parseInt(v) || 0);
          
          const fleet: Record<string, number> = {};
          const defense: Record<string, number> = {};
          
          let valueIndex = 7;
          
          // 함대
          for (let gid = 202; gid <= 215; gid++) {
            const type = FLEET_GID_MAP[gid];
            if (type && values[valueIndex] !== undefined) {
              fleet[type] = values[valueIndex];
            }
            valueIndex++;
          }
          
          // 방어시설
          for (let gid = 401; gid <= 408; gid++) {
            const type = DEFENSE_GID_MAP[gid];
            if (type && values[valueIndex] !== undefined) {
              defense[type] = values[valueIndex];
            }
            valueIndex++;
          }
          
          defenders[index] = {
            name,
            id: values[0]?.toString() || '0',
            coordinate: `${values[1]}:${values[2]}:${values[3]}`,
            weaponsTech: values[4] || 0,
            shieldTech: values[5] || 0,
            armorTech: values[6] || 0,
            fleet,
            defense,
          };
        }
      }
    }
    
    return { attackers, defenders };
  }

  /**
   * 손실 계산 (CalcLosses)
   * 전투 결과에서 손실량 계산
   */
  calculateLosses(
    attackers: BattleSlot[],
    defenders: BattleSlot[],
    battleResult: BattleResult,
    repaired: Record<string, number>,
  ): { 
    attackerLosses: { metal: number; crystal: number; deuterium: number; total: number };
    defenderLosses: { metal: number; crystal: number; deuterium: number; total: number };
  } {
    // 공격측 손실
    const attackerLosses = {
      metal: battleResult.attackerLosses.metal,
      crystal: battleResult.attackerLosses.crystal,
      deuterium: battleResult.attackerLosses.deuterium,
      total: 0,
    };
    attackerLosses.total = attackerLosses.metal + attackerLosses.crystal + attackerLosses.deuterium;

    // 방어측 손실 (복구된 방어시설 비용 차감)
    const defenderLosses = {
      metal: battleResult.defenderLosses.metal,
      crystal: battleResult.defenderLosses.crystal,
      deuterium: battleResult.defenderLosses.deuterium,
      total: 0,
    };

    // 복구된 방어시설 비용 차감
    for (const [type, count] of Object.entries(repaired)) {
      if (count > 0 && DEFENSE_DATA[type]) {
        const cost = DEFENSE_DATA[type].cost;
        defenderLosses.metal -= (cost.metal || 0) * count;
        defenderLosses.crystal -= (cost.crystal || 0) * count;
        defenderLosses.deuterium -= (cost.deuterium || 0) * count;
      }
    }

    // 음수 방지
    defenderLosses.metal = Math.max(0, defenderLosses.metal);
    defenderLosses.crystal = Math.max(0, defenderLosses.crystal);
    defenderLosses.deuterium = Math.max(0, defenderLosses.deuterium);
    defenderLosses.total = defenderLosses.metal + defenderLosses.crystal + defenderLosses.deuterium;

    return { attackerLosses, defenderLosses };
  }

  /**
   * ACS 함대 병합
   * 여러 공격자의 함대를 하나로 병합
   */
  private mergeFleets(slots: BattleSlot[]): {
    fleet: Record<string, number>;
    avgWeaponsTech: number;
    avgShieldTech: number;
    avgArmorTech: number;
  } {
    const mergedFleet: Record<string, number> = {};
    let totalWeaponsTech = 0;
    let totalShieldTech = 0;
    let totalArmorTech = 0;
    let totalUnits = 0;

    for (const slot of slots) {
      // 함대 병합
      for (const [type, count] of Object.entries(slot.fleet)) {
        if (count > 0) {
          mergedFleet[type] = (mergedFleet[type] || 0) + count;
          
          // 가중 평균 기술 레벨 계산용
          totalWeaponsTech += slot.weaponsTech * count;
          totalShieldTech += slot.shieldTech * count;
          totalArmorTech += slot.armorTech * count;
          totalUnits += count;
        }
      }
    }

    // 가중 평균 기술 레벨
    const avgWeaponsTech = totalUnits > 0 ? Math.floor(totalWeaponsTech / totalUnits) : 0;
    const avgShieldTech = totalUnits > 0 ? Math.floor(totalShieldTech / totalUnits) : 0;
    const avgArmorTech = totalUnits > 0 ? Math.floor(totalArmorTech / totalUnits) : 0;

    return { fleet: mergedFleet, avgWeaponsTech, avgShieldTech, avgArmorTech };
  }

  /**
   * 방어측 함대 + 방어시설 병합
   */
  private mergeDefenders(slots: BattleSlot[]): {
    fleet: Record<string, number>;
    defense: Record<string, number>;
    avgWeaponsTech: number;
    avgShieldTech: number;
    avgArmorTech: number;
  } {
    const mergedFleet: Record<string, number> = {};
    const mergedDefense: Record<string, number> = {};
    let totalWeaponsTech = 0;
    let totalShieldTech = 0;
    let totalArmorTech = 0;
    let totalUnits = 0;

    for (const slot of slots) {
      // 함대 병합
      for (const [type, count] of Object.entries(slot.fleet)) {
        if (count > 0) {
          mergedFleet[type] = (mergedFleet[type] || 0) + count;
          totalWeaponsTech += slot.weaponsTech * count;
          totalShieldTech += slot.shieldTech * count;
          totalArmorTech += slot.armorTech * count;
          totalUnits += count;
        }
      }

      // 방어시설 병합
      if (slot.defense) {
        for (const [type, count] of Object.entries(slot.defense)) {
          if (count > 0) {
            mergedDefense[type] = (mergedDefense[type] || 0) + count;
            totalWeaponsTech += slot.weaponsTech * count;
            totalShieldTech += slot.shieldTech * count;
            totalArmorTech += slot.armorTech * count;
            totalUnits += count;
          }
        }
      }
    }

    const avgWeaponsTech = totalUnits > 0 ? Math.floor(totalWeaponsTech / totalUnits) : 0;
    const avgShieldTech = totalUnits > 0 ? Math.floor(totalShieldTech / totalUnits) : 0;
    const avgArmorTech = totalUnits > 0 ? Math.floor(totalArmorTech / totalUnits) : 0;

    return { fleet: mergedFleet, defense: mergedDefense, avgWeaponsTech, avgShieldTech, avgArmorTech };
  }

  /**
   * 전투 시뮬레이션 실행 (SimBattle)
   */
  simulate(request: SimulationRequest): SimulationResult {
    const config = { ...this.getDefaultConfig(), ...request.config };
    
    let attackers = request.attackers;
    let defenders = request.defenders;

    // 외부 전투 소스 데이터가 있으면 파싱
    if (request.battleSource) {
      const parsed = this.parseBattleSourceData(request.battleSource);
      attackers = parsed.attackers;
      defenders = parsed.defenders;
    }

    // 전투 소스 데이터 생성 (디버그용)
    const sourceData = config.debug 
      ? this.generateBattleSourceData(attackers, defenders, config)
      : undefined;

    // ACS 함대 병합
    const mergedAttacker = this.mergeFleets(attackers);
    const mergedDefender = this.mergeDefenders(defenders);

    // 전투 시뮬레이션 실행
    // 참고: 현재 battleService.simulateBattle은 연사/잔해비율 커스터마이징을 지원하지 않음
    // TODO: battleService에 config 파라미터 추가 필요
    const battleResult = this.battleService.simulateBattle(
      mergedAttacker.fleet,
      mergedDefender.fleet,
      mergedDefender.defense,
      {
        weaponsTech: mergedAttacker.avgWeaponsTech,
        shieldTech: mergedAttacker.avgShieldTech,
        armorTech: mergedAttacker.avgArmorTech,
      },
      {
        weaponsTech: mergedDefender.avgWeaponsTech,
        shieldTech: mergedDefender.avgShieldTech,
        armorTech: mergedDefender.avgArmorTech,
      },
    );

    // OGame 확장 필드 추가
    battleResult.before = {
      attackers: attackers.map(a => ({
        name: a.name,
        id: a.id,
        coordinate: a.coordinate,
        weaponsTech: a.weaponsTech,
        shieldTech: a.shieldTech,
        armorTech: a.armorTech,
        fleet: a.fleet,
      })),
      defenders: defenders.map(d => ({
        name: d.name,
        id: d.id,
        coordinate: d.coordinate,
        weaponsTech: d.weaponsTech,
        shieldTech: d.shieldTech,
        armorTech: d.armorTech,
        fleet: d.fleet,
        defense: d.defense,
      })),
    };

    // 손실 계산
    const { attackerLosses, defenderLosses } = this.calculateLosses(
      attackers,
      defenders,
      battleResult,
      battleResult.restoredDefenses,
    );

    // HTML 보고서 생성
    const htmlReport = this.battleReportService.generateBattleReport(
      battleResult as OGameBattleResult,
      { metal: 0, crystal: 0, deuterium: 0 }, // 시뮬레이터에서는 약탈 없음
      battleResult.restoredDefenses,
    );

    // 결과 타입 결정
    let resultType: 'awon' | 'dwon' | 'draw';
    if (battleResult.attackerWon) {
      resultType = 'awon';
    } else if (battleResult.defenderWon) {
      resultType = 'dwon';
    } else {
      resultType = 'draw';
    }

    return {
      battleResult: battleResult as OGameBattleResult,
      htmlReport,
      attackerLosses,
      defenderLosses,
      debris: battleResult.debris,
      moonChance: battleResult.moonChance,
      moonCreated: battleResult.moonCreated,
      restoredDefenses: battleResult.restoredDefenses,
      resultType,
      sourceData,
    };
  }

  /**
   * 단순화된 시뮬레이션 (싱글 슬롯)
   */
  simulateSimple(
    attackerFleet: Record<string, number>,
    attackerTech: { weaponsTech: number; shieldTech: number; armorTech: number },
    defenderFleet: Record<string, number>,
    defenderDefense: Record<string, number>,
    defenderTech: { weaponsTech: number; shieldTech: number; armorTech: number },
    config?: Partial<SimulationConfig>,
  ): SimulationResult {
    return this.simulate({
      attackers: [{
        name: '공격자',
        id: 'attacker',
        coordinate: '1:1:1',
        weaponsTech: attackerTech.weaponsTech,
        shieldTech: attackerTech.shieldTech,
        armorTech: attackerTech.armorTech,
        fleet: attackerFleet,
      }],
      defenders: [{
        name: '방어자',
        id: 'defender',
        coordinate: '1:1:2',
        weaponsTech: defenderTech.weaponsTech,
        shieldTech: defenderTech.shieldTech,
        armorTech: defenderTech.armorTech,
        fleet: defenderFleet,
        defense: defenderDefense,
      }],
      config,
    });
  }

  /**
   * 여러 번 시뮬레이션 실행 (통계용)
   */
  simulateMultiple(
    request: SimulationRequest,
    iterations: number = 100,
  ): {
    attackerWinRate: number;
    defenderWinRate: number;
    drawRate: number;
    avgAttackerLosses: { metal: number; crystal: number; deuterium: number };
    avgDefenderLosses: { metal: number; crystal: number; deuterium: number };
    avgDebris: { metal: number; crystal: number };
    iterations: number;
  } {
    let attackerWins = 0;
    let defenderWins = 0;
    let draws = 0;

    const totalAttackerLosses = { metal: 0, crystal: 0, deuterium: 0 };
    const totalDefenderLosses = { metal: 0, crystal: 0, deuterium: 0 };
    const totalDebris = { metal: 0, crystal: 0 };

    for (let i = 0; i < iterations; i++) {
      const result = this.simulate(request);

      if (result.resultType === 'awon') attackerWins++;
      else if (result.resultType === 'dwon') defenderWins++;
      else draws++;

      totalAttackerLosses.metal += result.attackerLosses.metal;
      totalAttackerLosses.crystal += result.attackerLosses.crystal;
      totalAttackerLosses.deuterium += result.attackerLosses.deuterium;

      totalDefenderLosses.metal += result.defenderLosses.metal;
      totalDefenderLosses.crystal += result.defenderLosses.crystal;
      totalDefenderLosses.deuterium += result.defenderLosses.deuterium;

      totalDebris.metal += result.debris.metal;
      totalDebris.crystal += result.debris.crystal;
    }

    return {
      attackerWinRate: (attackerWins / iterations) * 100,
      defenderWinRate: (defenderWins / iterations) * 100,
      drawRate: (draws / iterations) * 100,
      avgAttackerLosses: {
        metal: Math.floor(totalAttackerLosses.metal / iterations),
        crystal: Math.floor(totalAttackerLosses.crystal / iterations),
        deuterium: Math.floor(totalAttackerLosses.deuterium / iterations),
      },
      avgDefenderLosses: {
        metal: Math.floor(totalDefenderLosses.metal / iterations),
        crystal: Math.floor(totalDefenderLosses.crystal / iterations),
        deuterium: Math.floor(totalDefenderLosses.deuterium / iterations),
      },
      avgDebris: {
        metal: Math.floor(totalDebris.metal / iterations),
        crystal: Math.floor(totalDebris.crystal / iterations),
      },
      iterations,
    };
  }
}

