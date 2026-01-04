import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';
import { ResourcesService } from './resources.service';
import { FleetService } from './fleet.service';
import { RankingService } from './ranking.service';
import { FLEET_DATA, DEFENSE_DATA, NAME_MAPPING } from '../constants/game-data';
import { MessageService } from '../../message/message.service';
import { GalaxyService } from '../../galaxy/galaxy.service';
import { BattleReportService, OGameBattleResult, OGameRoundInfo, BattleParticipant } from './battle-report.service';

// 전투 유닛 인터페이스 - OGame 방식으로 확장
interface BattleUnit {
  id: string;
  type: string;
  side: 'attacker' | 'defender';
  attack: number;           // 계산된 공격력
  baseAttack: number;       // 기본 공격력
  shield: number;           // 현재 쉴드
  maxShield: number;        // 최대 쉴드
  hull: number;             // 현재 장갑 (HP)
  maxHull: number;          // 최대 장갑
  structure: number;        // 구조값 (원본 데이터)
  rapidFire: Record<string, number>;
  isDefense: boolean;
  exploded: boolean;        // 폭발 여부
}

// 전투 결과 인터페이스
export interface BattleResult {
  attackerWon: boolean;
  defenderWon: boolean;
  draw: boolean;
  initialAttackerFleet: Record<string, number>;
  initialDefenderFleet: Record<string, number>;
  initialDefenderDefense: Record<string, number>;
  survivingAttackerFleet: Record<string, number>;
  survivingDefenderFleet: Record<string, number>;
  survivingDefenderDefense: Record<string, number>;
  restoredDefenses: Record<string, number>;
  rounds: OGameRoundInfo[];
  attackerLosses: { metal: number; crystal: number; deuterium: number };
  defenderLosses: { metal: number; crystal: number; deuterium: number };
  debris: { metal: number; crystal: number };
  loot: { metal: number; crystal: number; deuterium: number };
  moonChance: number;
  moonCreated: boolean;
  // OGame 확장 필드
  battleSeed?: number;
  battleTime?: Date;
  before?: {
    attackers: BattleParticipant[];
    defenders: BattleParticipant[];
  };
}

// 잔해 비율 설정 (OGame 기본값)
const FLEET_IN_DEBRIS = 0.3;    // 함선 파괴 시 잔해 30%
const DEFENSE_IN_DEBRIS = 0;    // 방어시설 파괴 시 잔해 0%

@Injectable()
export class BattleService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
    private resourcesService: ResourcesService,
    private fleetService: FleetService,
    @Inject(forwardRef(() => RankingService)) private rankingService: RankingService,
    private messageService: MessageService,
    private galaxyService: GalaxyService,
    private battleReportService: BattleReportService,
  ) {}

  /**
   * 좌표로 행성 찾기 (모행성 + 식민지)
   */
  private async findPlanetByCoordinate(coordinate: string): Promise<{ user: UserDocument | null; planet: PlanetDocument | null; ownerId: string | null }> {
    // 1. User 컬렉션에서 모행성 찾기
    const user = await this.userModel.findOne({ coordinate }).exec();
    if (user) {
      return { user, planet: null, ownerId: user._id.toString() };
    }

    // 2. Planet 컬렉션에서 식민지 찾기
    const planet = await this.planetModel.findOne({ coordinate }).exec();
    if (planet) {
      const owner = await this.userModel.findById(planet.ownerId).exec();
      return { user: owner, planet, ownerId: planet.ownerId };
    }

    return { user: null, planet: null, ownerId: null };
  }

  /**
   * OGame 공식에 따른 공격력 계산
   * 공격력 = 기본 공격력 × (10 + 무기기술 레벨) / 10
   */
  private calculateAttackPower(baseAttack: number, weaponsTech: number): number {
    return Math.floor(baseAttack * (10 + weaponsTech) / 10);
  }

  /**
   * OGame 공식에 따른 쉴드 계산
   * 최대 쉴드 = 기본 쉴드 × (10 + 쉴드기술 레벨) / 10
   */
  private calculateMaxShield(baseShield: number, shieldTech: number): number {
    return Math.floor(baseShield * (10 + shieldTech) / 10);
  }

  /**
   * OGame 공식에 따른 장갑(Hull) 계산
   * 장갑 = 구조 × 0.1 × (10 + 장갑기술 레벨) / 10
   */
  private calculateHull(structure: number, armorTech: number): number {
    return Math.floor(structure * 0.1 * (10 + armorTech) / 10);
  }

  /**
   * OGame 방식의 공격 수행 (UnitShoot)
   * - 쉴드 1% 규칙: 공격력이 쉴드최대값의 1% 미만이면 데미지 완전 무시
   * - 쉴드 흡수: 쉴드가 1% 단위로 흡수
   * - 관통 데미지: 쉴드를 초과한 데미지는 장갑에 적용
   */
  private performAttack(attacker: BattleUnit, target: BattleUnit): { absorbed: number; hullDamage: number } {
    const result = { absorbed: 0, hullDamage: 0 };
    
    // 이미 폭발한 유닛이면 스킵
    if (target.exploded) {
      return result;
    }

    const attackPower = attacker.attack;

    // 쉴드가 없으면 바로 장갑에 데미지
    if (target.shield === 0) {
      target.hull -= attackPower;
      result.hullDamage = attackPower;
      if (target.hull < 0) target.hull = 0;
      return result;
    }

    // 쉴드 1% 규칙: 공격력이 쉴드 최대값의 1% 미만이면 데미지 완전 무시
    const shieldOnePercent = target.maxShield * 0.01;
    if (attackPower < shieldOnePercent) {
      // 데미지 완전 무시 (튕김)
      return result;
    }

    // 쉴드가 있는 경우: 1% 단위로 계산
    const depleted = Math.floor(attackPower / shieldOnePercent);
    const shieldDamage = depleted * shieldOnePercent;

    // 쉴드가 충분하면 흡수
    if (target.shield >= shieldDamage) {
      target.shield -= shieldDamage;
      result.absorbed = attackPower;
      return result;
    }

    // 쉴드가 부족하면 관통
    const remainingDamage = attackPower - target.shield;
    result.absorbed = target.shield;
    target.shield = 0;
    target.hull -= remainingDamage;
    result.hullDamage = remainingDamage;

    if (target.hull < 0) target.hull = 0;

    return result;
  }

  /**
   * OGame 방식의 폭발 판정
   * - 장갑이 최대값의 70% 이하이고 쉴드가 0일 때만 폭발 가능성
   * - 폭발확률 = (남은장갑 × 100) / 장갑최대값
   * - 랜덤(0~99) >= 폭발확률이면 폭발
   */
  private checkExploded(unit: BattleUnit): boolean {
    if (unit.exploded) return true;
    if (unit.hull <= 0) return true;

    // 장갑이 70% 초과면 폭발 불가
    if (unit.hull > unit.maxHull * 0.7) {
      return false;
    }

    // 쉴드가 남아있으면 폭발 불가 (OGame 규칙)
    if (unit.shield > 0) {
      return false;
    }

    // 폭발 확률 계산
    const explosionChance = Math.floor((unit.hull * 100) / unit.maxHull);
    const random = Math.floor(Math.random() * 100);

    // 랜덤 >= 폭발확률이면 폭발 (또는 장갑이 0이면 무조건 폭발)
    if (random >= explosionChance || unit.hull <= 0) {
      return true;
    }

    return false;
  }

  /**
   * OGame 방식의 급속사격 확률 계산
   * 재발사확률 = 1 - (1/연사값)
   * 예: 연사 6배 → 1 - (1/6) = 83.3%
   */
  private checkRapidFire(attackingUnit: BattleUnit, targetUnit: BattleUnit): boolean {
    const rapidFireValue = attackingUnit.rapidFire[targetUnit.type];

    if (!rapidFireValue || rapidFireValue <= 1) {
      return false;
    }

    // mt_rand(1, 1000) > (1000 / 연사값)이면 재발사
    const threshold = Math.floor(1000 / rapidFireValue);
    const random = Math.floor(Math.random() * 1000) + 1;
    
    return random > threshold;
  }

  /**
   * OGame 방식의 빠른 무승부 체크
   * 모든 공격측/방어측 유닛의 장갑이 최대값과 동일하면 (아무도 데미지를 받지 않았으면)
   * 전투 즉시 종료 → 무승부
   */
  private checkFastDraw(attackerUnits: BattleUnit[], defenderUnits: BattleUnit[]): boolean {
    // 공격측 유닛 모두 풀 HP인지 확인
    for (const unit of attackerUnits) {
      if (unit.hull < unit.maxHull) {
        return false;
      }
    }

    // 방어측 유닛 모두 풀 HP인지 확인
    for (const unit of defenderUnits) {
      if (unit.hull < unit.maxHull) {
        return false;
      }
    }

    return true;
  }

  /**
   * OGame 방식의 전투 시뮬레이션
   * 최대 6라운드, 매 라운드 시작 시 쉴드 충전
   */
  simulateBattle(
    attackerFleet: Record<string, number>,
    defenderFleet: Record<string, number>,
    defenderDefense: Record<string, number>,
    attackerResearch: Record<string, number> = {},
    defenderResearch: Record<string, number> = {},
  ): BattleResult {
    // 기술 레벨 추출
    const attackerWeaponsTech = attackerResearch.weaponsTech || 0;
    const attackerShieldTech = attackerResearch.shieldTech || 0;
    const attackerArmorTech = attackerResearch.armorTech || 0;

    const defenderWeaponsTech = defenderResearch.weaponsTech || 0;
    const defenderShieldTech = defenderResearch.shieldTech || 0;
    const defenderArmorTech = defenderResearch.armorTech || 0;

    // 전투 결과 초기화
    const result: BattleResult = {
      attackerWon: false,
      defenderWon: false,
      draw: false,
      initialAttackerFleet: { ...attackerFleet },
      initialDefenderFleet: { ...defenderFleet },
      initialDefenderDefense: { ...defenderDefense },
      survivingAttackerFleet: {},
      survivingDefenderFleet: {},
      survivingDefenderDefense: {},
      restoredDefenses: {},
      rounds: [],
      attackerLosses: { metal: 0, crystal: 0, deuterium: 0 },
      defenderLosses: { metal: 0, crystal: 0, deuterium: 0 },
      debris: { metal: 0, crystal: 0 },
      loot: { metal: 0, crystal: 0, deuterium: 0 },
      moonChance: 0,
      moonCreated: false,
    };

    // 공격자 유닛 생성
    let attackerUnits: BattleUnit[] = [];
    for (const type in attackerFleet) {
      if (attackerFleet[type] > 0 && FLEET_DATA[type]) {
        const fleetStats = FLEET_DATA[type].stats;
        const rapidFire = FLEET_DATA[type].rapidFire || {};
        const structure = fleetStats.hull; // 구조값

        const attack = this.calculateAttackPower(fleetStats.attack, attackerWeaponsTech);
        const maxShield = this.calculateMaxShield(fleetStats.shield, attackerShieldTech);
        const maxHull = this.calculateHull(structure, attackerArmorTech);

        for (let i = 0; i < attackerFleet[type]; i++) {
          attackerUnits.push({
            id: `attacker_${type}_${i}`,
            type,
            side: 'attacker',
            attack,
            baseAttack: fleetStats.attack,
            shield: maxShield,
            maxShield,
            hull: maxHull,
            maxHull,
            structure,
            rapidFire,
            isDefense: false,
            exploded: false,
          });
        }
      }
    }

    // 방어자 함대 유닛 생성
    let defenderUnits: BattleUnit[] = [];
    for (const type in defenderFleet) {
      if (defenderFleet[type] > 0 && FLEET_DATA[type]) {
        const fleetStats = FLEET_DATA[type].stats;
        const rapidFire = FLEET_DATA[type].rapidFire || {};
        const structure = fleetStats.hull;

        const attack = this.calculateAttackPower(fleetStats.attack, defenderWeaponsTech);
        const maxShield = this.calculateMaxShield(fleetStats.shield, defenderShieldTech);
        const maxHull = this.calculateHull(structure, defenderArmorTech);

        for (let i = 0; i < defenderFleet[type]; i++) {
          defenderUnits.push({
            id: `defender_${type}_${i}`,
            type,
            side: 'defender',
            attack,
            baseAttack: fleetStats.attack,
            shield: maxShield,
            maxShield,
            hull: maxHull,
            maxHull,
            structure,
            rapidFire,
            isDefense: false,
            exploded: false,
          });
        }
      }
    }

    // 방어자 방어시설 유닛 생성
    for (const type in defenderDefense) {
      if (defenderDefense[type] > 0 && DEFENSE_DATA[type]) {
        const defenseStats = DEFENSE_DATA[type].stats;
        const structure = defenseStats.hull;

        const attack = this.calculateAttackPower(defenseStats.attack, defenderWeaponsTech);
        const maxShield = this.calculateMaxShield(defenseStats.shield, defenderShieldTech);
        const maxHull = this.calculateHull(structure, defenderArmorTech);

        for (let i = 0; i < defenderDefense[type]; i++) {
          defenderUnits.push({
            id: `defense_${type}_${i}`,
            type,
            side: 'defender',
            attack,
            baseAttack: defenseStats.attack,
            shield: maxShield,
            maxShield,
            hull: maxHull,
            maxHull,
            structure,
            rapidFire: {}, // 방어시설은 연사 없음
            isDefense: true,
            exploded: false,
          });
        }
      }
    }

    // 전투 라운드 (최대 6라운드)
    const MAX_ROUNDS = 6;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      // 한쪽이 전멸하면 새 라운드 시작 전에 종료 (빈 라운드 추가하지 않음)
      if (attackerUnits.length === 0 || defenderUnits.length === 0) {
        break;
      }

      // OGame 형식의 라운드 정보
      const roundInfo: OGameRoundInfo = {
        round: round + 1,
        // 공격측 통계
        ashoot: 0,          // 공격측 발사 횟수
        apower: 0,          // 공격측 총 화력
        dabsorb: 0,         // 방어측 쉴드 흡수량
        // 방어측 통계
        dshoot: 0,          // 방어측 발사 횟수
        dpower: 0,          // 방어측 총 화력
        aabsorb: 0,         // 공격측 쉴드 흡수량
        // 라운드 후 남은 유닛 (나중에 채워짐)
        attackers: [],
        defenders: [],
        // 기존 호환성 필드
        destroyedAttackerShips: {},
        destroyedDefenderShips: {},
        rapidFireCount: 0,
      };

      // 매 라운드 시작 시 쉴드 충전
      for (const unit of attackerUnits) {
        unit.shield = unit.maxShield;
      }
      for (const unit of defenderUnits) {
        unit.shield = unit.maxShield;
      }

      // 라운드 시작 전 상태 저장 (빠른 무승부 체크용)
      const attackerHullsBefore = attackerUnits.map(u => u.hull);
      const defenderHullsBefore = defenderUnits.map(u => u.hull);

      // 모든 유닛의 공격 처리 (공격측 먼저, 그 다음 방어측 - OGame 방식)
      // 공격측 발사
      for (const attackingUnit of attackerUnits) {
        if (attackingUnit.exploded || attackingUnit.hull <= 0) continue;
        if (defenderUnits.filter(u => !u.exploded && u.hull > 0).length === 0) break;

        let fireCount = 1;
        while (fireCount > 0) {
          // 살아있는 타겟만 선택
          const aliveTargets = defenderUnits.filter(u => !u.exploded && u.hull > 0);
          if (aliveTargets.length === 0) break;

          // 랜덤 타겟 선택 (OGame: idx = MyRand(0, 적유닛수 - 1))
          const targetIndex = Math.floor(Math.random() * aliveTargets.length);
          const targetUnit = aliveTargets[targetIndex];

          // 발사 횟수 및 화력 기록 (OGame 형식)
          roundInfo.ashoot++;
          roundInfo.apower += attackingUnit.attack;

          // 공격 수행
          const damageResult = this.performAttack(attackingUnit, targetUnit);

          // 쉴드 흡수량 기록 (OGame 형식)
          roundInfo.dabsorb += damageResult.absorbed;

          // 폭발 판정
          if (targetUnit.hull > 0 && this.checkExploded(targetUnit)) {
            targetUnit.exploded = true;
            targetUnit.hull = 0;

            // 파괴 기록 및 잔해/손실 계산
            roundInfo.destroyedDefenderShips[targetUnit.type] = 
              (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;

            const data = targetUnit.isDefense ? DEFENSE_DATA[targetUnit.type] : FLEET_DATA[targetUnit.type];
            if (data) {
              const cost = data.cost;
              // 함선 잔해 (방어시설은 기본 0%)
              if (!targetUnit.isDefense) {
                result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
                result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
              } else {
                result.debris.metal += Math.floor((cost.metal || 0) * DEFENSE_IN_DEBRIS);
                result.debris.crystal += Math.floor((cost.crystal || 0) * DEFENSE_IN_DEBRIS);
              }
              // 손실 기록
              result.defenderLosses.metal += (cost.metal || 0);
              result.defenderLosses.crystal += (cost.crystal || 0);
              result.defenderLosses.deuterium += (cost.deuterium || 0);
            }
          } else if (targetUnit.hull <= 0) {
            targetUnit.exploded = true;
            
            roundInfo.destroyedDefenderShips[targetUnit.type] = 
              (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;

            const data = targetUnit.isDefense ? DEFENSE_DATA[targetUnit.type] : FLEET_DATA[targetUnit.type];
            if (data) {
              const cost = data.cost;
              if (!targetUnit.isDefense) {
                result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
                result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
              } else {
                result.debris.metal += Math.floor((cost.metal || 0) * DEFENSE_IN_DEBRIS);
                result.debris.crystal += Math.floor((cost.crystal || 0) * DEFENSE_IN_DEBRIS);
              }
              result.defenderLosses.metal += (cost.metal || 0);
              result.defenderLosses.crystal += (cost.crystal || 0);
              result.defenderLosses.deuterium += (cost.deuterium || 0);
            }
          }

          // 급속사격 확인
          if (this.checkRapidFire(attackingUnit, targetUnit)) {
            fireCount++;
            roundInfo.rapidFireCount++;
          }

          fireCount--;
        }
      }

      // 방어측 발사
      for (const attackingUnit of defenderUnits) {
        if (attackingUnit.exploded || attackingUnit.hull <= 0) continue;
        if (attackerUnits.filter(u => !u.exploded && u.hull > 0).length === 0) break;

        let fireCount = 1;
        while (fireCount > 0) {
          const aliveTargets = attackerUnits.filter(u => !u.exploded && u.hull > 0);
          if (aliveTargets.length === 0) break;

          const targetIndex = Math.floor(Math.random() * aliveTargets.length);
          const targetUnit = aliveTargets[targetIndex];

          // 발사 횟수 및 화력 기록 (OGame 형식)
          roundInfo.dshoot++;
          roundInfo.dpower += attackingUnit.attack;

          const damageResult = this.performAttack(attackingUnit, targetUnit);

          // 쉴드 흡수량 기록 (OGame 형식)
          roundInfo.aabsorb += damageResult.absorbed;

          if (targetUnit.hull > 0 && this.checkExploded(targetUnit)) {
            targetUnit.exploded = true;
            targetUnit.hull = 0;

            roundInfo.destroyedAttackerShips[targetUnit.type] = 
              (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;

            const data = FLEET_DATA[targetUnit.type];
            if (data) {
              const cost = data.cost;
              result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
              result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
              result.attackerLosses.metal += (cost.metal || 0);
              result.attackerLosses.crystal += (cost.crystal || 0);
              result.attackerLosses.deuterium += (cost.deuterium || 0);
            }
          } else if (targetUnit.hull <= 0) {
            targetUnit.exploded = true;
            
            roundInfo.destroyedAttackerShips[targetUnit.type] = 
              (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;

            const data = FLEET_DATA[targetUnit.type];
            if (data) {
              const cost = data.cost;
              result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
              result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
              result.attackerLosses.metal += (cost.metal || 0);
              result.attackerLosses.crystal += (cost.crystal || 0);
              result.attackerLosses.deuterium += (cost.deuterium || 0);
            }
          }

          if (this.checkRapidFire(attackingUnit, targetUnit)) {
            fireCount++;
            roundInfo.rapidFireCount++;
          }

          fireCount--;
        }
      }

      // 파괴된 유닛 제거
      attackerUnits = attackerUnits.filter(unit => !unit.exploded && unit.hull > 0);
      defenderUnits = defenderUnits.filter(unit => !unit.exploded && unit.hull > 0);

      // OGame 형식의 라운드 종료 유닛 정보 생성
      roundInfo.attackers = this.createParticipantSnapshot(
        attackerUnits,
        attackerWeaponsTech,
        attackerShieldTech,
        attackerArmorTech,
        'attacker',
      );
      roundInfo.defenders = this.createParticipantSnapshot(
        defenderUnits,
        defenderWeaponsTech,
        defenderShieldTech,
        defenderArmorTech,
        'defender',
      );

      result.rounds.push(roundInfo);

      // 빠른 무승부 체크 (양측 모두 데미지를 받지 않았으면 즉시 종료)
      let noDamageDealt = true;
      for (let i = 0; i < attackerUnits.length && i < attackerHullsBefore.length; i++) {
        if (attackerUnits[i].hull < attackerHullsBefore[i]) {
          noDamageDealt = false;
          break;
        }
      }
      if (noDamageDealt) {
        for (let i = 0; i < defenderUnits.length && i < defenderHullsBefore.length; i++) {
          if (defenderUnits[i].hull < defenderHullsBefore[i]) {
            noDamageDealt = false;
            break;
          }
        }
      }
      
      if (noDamageDealt && attackerUnits.length > 0 && defenderUnits.length > 0) {
        // 빠른 무승부: 양측 모두 데미지 없음 → 즉시 종료
        break;
      }
    }

    // 최종 결과 계산
    const finalAttackerFleet: Record<string, number> = {};
    const finalDefenderFleet: Record<string, number> = {};
    const finalDefenderDefense: Record<string, number> = {};

    for (const unit of attackerUnits) {
      finalAttackerFleet[unit.type] = (finalAttackerFleet[unit.type] || 0) + 1;
    }

    for (const unit of defenderUnits) {
      if (unit.isDefense) {
        finalDefenderDefense[unit.type] = (finalDefenderDefense[unit.type] || 0) + 1;
      } else {
        finalDefenderFleet[unit.type] = (finalDefenderFleet[unit.type] || 0) + 1;
      }
    }

    // 초기 함대에 없는 유닛은 0으로 설정
    for (const type in result.initialAttackerFleet) {
      if (finalAttackerFleet[type] === undefined) {
        finalAttackerFleet[type] = 0;
      }
    }
    for (const type in result.initialDefenderFleet) {
      if (finalDefenderFleet[type] === undefined) {
        finalDefenderFleet[type] = 0;
      }
    }
    for (const type in result.initialDefenderDefense) {
      if (finalDefenderDefense[type] === undefined) {
        finalDefenderDefense[type] = 0;
      }
    }

    result.survivingAttackerFleet = finalAttackerFleet;
    result.survivingDefenderFleet = finalDefenderFleet;
    result.survivingDefenderDefense = { ...finalDefenderDefense };

    // 승패 판정 (OGame 방식)
    const attackerSurvives = attackerUnits.length > 0;
    const defenderSurvives = defenderUnits.length > 0;
    const defenderFleetSurvives = defenderUnits.some(unit => !unit.isDefense);

    if (attackerSurvives && !defenderSurvives) {
      result.attackerWon = true;
    } else if (!attackerSurvives && defenderSurvives) {
      result.defenderWon = true;
    } else if (attackerSurvives && defenderSurvives && !defenderFleetSurvives) {
      // 공격측이 살아있고 방어측은 방어시설만 남은 경우 → 공격측 승리
      result.attackerWon = true;
    } else {
      // 둘 다 살아있거나 둘 다 전멸한 경우 → 무승부
      result.draw = true;
    }

    // 방어시설 복구 (전투 후 70% ±10%)
    for (const type in result.initialDefenderDefense) {
      const initialCount = result.initialDefenderDefense[type] || 0;
      const surviveCount = finalDefenderDefense[type] || 0;
      const destroyedCount = initialCount - surviveCount;

      if (destroyedCount > 0) {
        let restoredCount = 0;

        if (destroyedCount < 10) {
          // 10개 미만: 개별 70% 확률 판정
          for (let i = 0; i < destroyedCount; i++) {
            if (Math.floor(Math.random() * 100) < 70) {
              restoredCount++;
            }
          }
        } else {
          // 10개 이상: 60~80% 범위에서 일괄 복구
          const restorePercent = Math.floor(Math.random() * 21) + 60; // 60~80
          restoredCount = Math.floor(destroyedCount * restorePercent / 100);
        }

        if (restoredCount > 0) {
          result.restoredDefenses[type] = restoredCount;
          result.survivingDefenderDefense[type] = (result.survivingDefenderDefense[type] || 0) + restoredCount;
          
          // 복구된 방어시설의 손실 비용 차감
          const defenseData = DEFENSE_DATA[type];
          if (defenseData) {
            result.defenderLosses.metal -= (defenseData.cost.metal || 0) * restoredCount;
            result.defenderLosses.crystal -= (defenseData.cost.crystal || 0) * restoredCount;
            result.defenderLosses.deuterium -= (defenseData.cost.deuterium || 0) * restoredCount;
          }
        }
      }
    }

    // 손실이 음수가 되지 않도록 보정
    result.defenderLosses.metal = Math.max(0, result.defenderLosses.metal);
    result.defenderLosses.crystal = Math.max(0, result.defenderLosses.crystal);
    result.defenderLosses.deuterium = Math.max(0, result.defenderLosses.deuterium);

    // 달 생성 확률 계산 (오게임 공식: 잔해 100,000당 1%, 최대 20%)
    const totalDebris = result.debris.metal + result.debris.crystal;
    result.moonChance = Math.min(20, Math.floor(totalDebris / 100000));
    result.moonCreated = Math.random() < (result.moonChance / 100);

    // OGame 확장 필드 추가
    result.battleSeed = Math.floor(Math.random() * 1000000000);
    result.battleTime = new Date();

    return result;
  }

  /**
   * 유닛 배열에서 BattleParticipant 스냅샷 생성 (OGame 형식)
   */
  private createParticipantSnapshot(
    units: BattleUnit[],
    weaponsTech: number,
    shieldTech: number,
    armorTech: number,
    side: 'attacker' | 'defender',
  ): BattleParticipant[] {
    // 유닛 수 집계
    const fleetCount: Record<string, number> = {};
    const defenseCount: Record<string, number> = {};

    for (const unit of units) {
      if (!unit.exploded && unit.hull > 0) {
        if (unit.isDefense) {
          defenseCount[unit.type] = (defenseCount[unit.type] || 0) + 1;
        } else {
          fleetCount[unit.type] = (fleetCount[unit.type] || 0) + 1;
        }
      }
    }

    // 참가자 정보 생성
    const participant: BattleParticipant = {
      name: side === 'attacker' ? '공격자' : '방어자',
      id: side,
      coordinate: '',
      weaponsTech,
      shieldTech,
      armorTech,
      fleet: fleetCount,
      defense: side === 'defender' ? defenseCount : undefined,
    };

    return [participant];
  }

  // 남은 유닛 카운트 (기존 호환성 유지)
  private countRemainingUnits(attackerUnits: BattleUnit[], defenderUnits: BattleUnit[], roundInfo: any): void {
    const attackerCount: Record<string, number> = {};
    for (const unit of attackerUnits) {
      if (!unit.exploded && unit.hull > 0) {
        attackerCount[unit.type] = (attackerCount[unit.type] || 0) + 1;
      }
    }

    const defenderFleetCount: Record<string, number> = {};
    const defenderDefenseCount: Record<string, number> = {};

    for (const unit of defenderUnits) {
      if (!unit.exploded && unit.hull > 0) {
        if (unit.isDefense) {
          defenderDefenseCount[unit.type] = (defenderDefenseCount[unit.type] || 0) + 1;
        } else {
          defenderFleetCount[unit.type] = (defenderFleetCount[unit.type] || 0) + 1;
        }
      }
    }

    roundInfo.remainingAttackerFleet = { ...attackerCount };
    roundInfo.remainingDefenderFleet = { ...defenderFleetCount };
    roundInfo.remainingDefenderDefense = { ...defenderDefenseCount };
  }

  // 좌표 간 거리 계산 - XNOVA.js calculateDistance 마이그레이션
  calculateDistance(coordA: string, coordB: string): number {
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

    // 같은 행성
    return 5;
  }

  /**
   * OGame 방식의 약탈량 계산 (Plunder)
   * 
   * 📊 약탈 규칙:
   * - 약탈 조건: 공격자 승리 && 적재량 > 0
   * - 약탈 가능량 = 행성 자원의 50%
   * - 적재 순서: 메탈 → 크리스탈 → 듀테륨
   * 
   * 📈 적재 비율:
   * 1. 메탈: 적재량의 1/3 (또는 약탈 가능한 메탈량 중 작은 값)
   * 2. 크리스탈: 남은 적재량의 1/2 (또는 약탈 가능한 크리스탈량 중 작은 값)
   * 3. 듀테륨: 남은 적재량 전부 (또는 약탈 가능한 듀테륨량 중 작은 값)
   * 
   * 💡 자원 불균형 시: 메탈/크리스탈이 적으면 남은 공간에 듀테륨을 더 많이 적재
   * 
   * @example
   * // 적재량: 90,000 / 행성자원: 메탈 1,000,000, 크리스탈 600,000, 듀테륨 400,000
   * // 메탈: min(500,000, 30,000) = 30,000 → 남은 적재량: 60,000
   * // 크리스탈: min(300,000, 30,000) = 30,000 → 남은 적재량: 30,000
   * // 듀테륨: min(200,000, 30,000) = 30,000
   * // 총 약탈: 90,000 (메탈 30,000 + 크리스탈 30,000 + 듀테륨 30,000)
   */
  calculateLoot(
    resources: { metal: number; crystal: number; deuterium: number },
    battleResult: BattleResult,
    capacity: number,
  ): { metal: number; crystal: number; deuterium: number } {
    // 공격자 승리가 아니면 약탈 불가
    if (!battleResult.attackerWon) {
      return { metal: 0, crystal: 0, deuterium: 0 };
    }

    // 적재량이 0이면 약탈 불가
    if (capacity <= 0) {
      return { metal: 0, crystal: 0, deuterium: 0 };
    }

    // 약탈 가능량 = 행성 자원의 50%
    const lootableMetal = Math.floor(resources.metal / 2);
    const lootableCrystal = Math.floor(resources.crystal / 2);
    const lootableDeuterium = Math.floor(resources.deuterium / 2);

    let remainingCapacity = capacity;

    // 1단계: 메탈 약탈 (적재량의 1/3)
    let lootedMetal: number;
    if (lootableMetal > Math.floor(remainingCapacity / 3)) {
      lootedMetal = Math.floor(remainingCapacity / 3);
    } else {
      lootedMetal = lootableMetal;
    }
    remainingCapacity -= lootedMetal;

    // 2단계: 크리스탈 약탈 (남은 적재량의 1/2)
    let lootedCrystal: number;
    if (lootableCrystal > Math.floor(remainingCapacity / 2)) {
      lootedCrystal = Math.floor(remainingCapacity / 2);
    } else {
      lootedCrystal = lootableCrystal;
    }
    remainingCapacity -= lootedCrystal;

    // 3단계: 듀테륨 약탈 (남은 적재량 전부)
    let lootedDeuterium: number;
    if (lootableDeuterium > remainingCapacity) {
      lootedDeuterium = remainingCapacity;
    } else {
      lootedDeuterium = lootableDeuterium;
    }

    return {
      metal: lootedMetal,
      crystal: lootedCrystal,
      deuterium: lootedDeuterium,
    };
  }

  // 공격 시작
  async startAttack(
    attackerId: string,
    targetCoord: string,
    fleet: Record<string, number>,
  ) {
    const attacker = await this.resourcesService.updateResources(attackerId);
    if (!attacker) {
      throw new BadRequestException('공격자를 찾을 수 없습니다.');
    }

    // 이미 공격 중인지 확인
    if (attacker.pendingAttack) {
      throw new BadRequestException('이미 함대가 출격 중입니다.');
    }

    // 타겟 찾기
    const target = await this.userModel.findOne({ coordinate: targetCoord }).exec();
    if (!target) {
      throw new BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
    }

    if (target._id.toString() === attackerId) {
      throw new BadRequestException('자신의 행성은 공격할 수 없습니다.');
    }

    // 점수 차이 확인 (5배 이상 차이나면 공격 불가)
    const attackerScore = this.rankingService.calculatePlayerScores(attacker).totalScore;
    const defenderScore = this.rankingService.calculatePlayerScores(target).totalScore;
    
    if (attackerScore > defenderScore * 5) {
      throw new BadRequestException(
        `상대방보다 점수가 5배 이상 높아 공격할 수 없습니다. (내 점수: ${attackerScore.toLocaleString()}, 상대 점수: ${defenderScore.toLocaleString()})`
      );
    }
    
    if (defenderScore > attackerScore * 5) {
      throw new BadRequestException(
        `상대방보다 점수가 5배 이상 낮아 공격할 수 없습니다. (내 점수: ${attackerScore.toLocaleString()}, 상대 점수: ${defenderScore.toLocaleString()})`
      );
    }

    // 함대 확인
    for (const type in fleet) {
      const count = fleet[type];
      
      // 음수/비정상 값 검증
      if (!Number.isInteger(count) || count < 0) {
        throw new BadRequestException('잘못된 함대 수량입니다.');
      }
      
      if (count > 0) {
        // 유효한 함대 타입 검증
        if (!FLEET_DATA[type]) {
          throw new BadRequestException(`알 수 없는 함대 유형: ${type}`);
        }
        if (type === 'solarSatellite') {
          throw new BadRequestException('태양광인공위성은 공격에 참여할 수 없습니다.');
        }
        if (!(attacker.fleet as any)[type] || (attacker.fleet as any)[type] < count) {
          throw new BadRequestException(`${NAME_MAPPING[type] || type}을(를) ${count}대 보유하고 있지 않습니다.`);
        }
      }
    }

    // 거리 및 이동 시간 계산
    const distance = this.calculateDistance(attacker.coordinate, targetCoord);
    const minSpeed = this.fleetService.getFleetSpeed(fleet);
    const travelTime = (distance / minSpeed) * 3600;

    // 연료 소비량 계산
    const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);

    if (attacker.resources.deuterium < fuelConsumption) {
      throw new BadRequestException(`듀테륨이 부족합니다. 필요: ${fuelConsumption}, 보유: ${Math.floor(attacker.resources.deuterium)}`);
    }

    // 연료 차감
    attacker.resources.deuterium -= fuelConsumption;

    // 함대 차감
    for (const type in fleet) {
      if (fleet[type] > 0) {
        (attacker.fleet as any)[type] -= fleet[type];
      }
    }

    // 선적량 계산
    const capacity = this.fleetService.calculateTotalCapacity(fleet);

    // 공격 정보 저장
    const startTime = new Date();
    const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);

    attacker.pendingAttack = {
      targetCoord,
      targetUserId: target._id.toString(),
      fleet,
      capacity,
      travelTime,
      startTime,
      arrivalTime,
      battleCompleted: false,
    };

    // 방어자에게 공격 알림
    target.incomingAttack = {
      targetCoord: attacker.coordinate,
      targetUserId: attackerId,
      fleet: {}, // 적 함대 정보는 숨김
      capacity: 0,
      travelTime,
      startTime,
      arrivalTime,
      battleCompleted: false,
    };

    await attacker.save();
    await target.save();

    return {
      message: `${targetCoord} 좌표로 함대가 출격했습니다.`,
      fleet,
      capacity,
      fuelConsumption,
      travelTime,
      arrivalTime,
      distance,
    };
  }

  // 공격 상태 확인
  async getAttackStatus(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const result: any = {
      pendingAttack: null,
      pendingReturn: null,
      incomingAttack: null,
    };

    if (user.pendingAttack) {
      const remaining = Math.max(0, (user.pendingAttack.arrivalTime.getTime() - Date.now()) / 1000);
      // 미션 타입 결정 (새 missionType 필드 우선, 없으면 targetUserId로 판단)
      let missionType = (user.pendingAttack as any).missionType || 'attack';
      if (!missionType || missionType === 'attack') {
        if (user.pendingAttack.targetUserId === 'transport') {
          missionType = 'transport';
        } else if (user.pendingAttack.targetUserId === 'deploy') {
          missionType = 'deploy';
        } else if (user.pendingAttack.targetUserId === 'debris') {
          missionType = 'recycle';
        } else if (user.pendingAttack.targetUserId === '') {
          missionType = 'colony';
        }
      }
      
      result.pendingAttack = {
        targetCoord: user.pendingAttack.targetCoord,
        fleet: user.pendingAttack.fleet,
        remainingTime: remaining,
        battleCompleted: user.pendingAttack.battleCompleted,
        missionType,
      };
    }

    if (user.pendingReturn) {
      const remaining = Math.max(0, (user.pendingReturn.returnTime.getTime() - Date.now()) / 1000);
      result.pendingReturn = {
        fleet: user.pendingReturn.fleet,
        loot: user.pendingReturn.loot,
        remainingTime: remaining,
        missionType: (user.pendingReturn as any).missionType || 'attack',
      };
    }

    if (user.incomingAttack) {
      const remaining = Math.max(0, (user.incomingAttack.arrivalTime.getTime() - Date.now()) / 1000);
      result.incomingAttack = {
        attackerCoord: user.incomingAttack.targetCoord,
        remainingTime: remaining,
      };
    }

    return result;
  }

  // 데브리 수확 시작
  async startRecycle(
    attackerId: string,
    targetCoord: string,
    fleet: Record<string, number>,
  ) {
    // 수확선만 있는지 확인 + 음수 검증
    for (const type in fleet) {
      const count = fleet[type];
      
      // 음수/비정상 값 검증
      if (!Number.isInteger(count) || count < 0) {
        throw new BadRequestException('잘못된 함대 수량입니다.');
      }
      
      if (count > 0 && type !== 'recycler') {
        throw new BadRequestException('수확 임무에는 수확선만 보낼 수 있습니다.');
      }
    }

    if (!fleet.recycler || fleet.recycler <= 0) {
      throw new BadRequestException('수확선을 선택해주세요.');
    }

    const attacker = await this.resourcesService.updateResources(attackerId);
    if (!attacker) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 함대 활동 중인지 확인 (단순화: 공격/귀환 중이면 불가)
    if (attacker.pendingAttack || attacker.pendingReturn) {
      throw new BadRequestException('이미 함대가 활동 중입니다.');
    }

    // 함대 보유 확인
    if (!attacker.fleet.recycler || attacker.fleet.recycler < fleet.recycler) {
      throw new BadRequestException(`수확선을 ${fleet.recycler}대 보유하고 있지 않습니다.`);
    }

    // 거리 및 시간 계산
    const distance = this.calculateDistance(attacker.coordinate, targetCoord);
    const minSpeed = this.fleetService.getFleetSpeed(fleet);
    const travelTime = (distance / minSpeed) * 3600;

    // 연료 소비량
    const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
    if (attacker.resources.deuterium < fuelConsumption) {
      throw new BadRequestException(`듀테륨이 부족합니다. 필요: ${fuelConsumption}, 보유: ${Math.floor(attacker.resources.deuterium)}`);
    }

    // 데브리 존재 확인
    const debris = await this.galaxyService.getDebris(targetCoord);
    if (!debris || (debris.metal <= 0 && debris.crystal <= 0)) {
      throw new BadRequestException('해당 좌표에 수확할 데브리가 없습니다.');
    }

    // 차감 및 저장
    attacker.resources.deuterium -= fuelConsumption;
    attacker.fleet.recycler -= fleet.recycler;

    const startTime = new Date();
    const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);

    attacker.pendingAttack = {
      targetCoord,
      targetUserId: 'debris', // 특수 ID
      fleet,
      capacity: this.fleetService.calculateTotalCapacity(fleet),
      travelTime,
      startTime,
      arrivalTime,
      battleCompleted: false,
    };

    attacker.markModified('fleet');
    attacker.markModified('resources');
    attacker.markModified('pendingAttack');
    await attacker.save();

    return {
      message: `${targetCoord} 좌표로 수확선이 출격했습니다.`,
      travelTime,
      arrivalTime,
    };
  }

  // 수확선 도착 처리
  async processRecycleArrival(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingAttack || user.pendingAttack.targetUserId !== 'debris') {
      return null;
    }

    if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
      return null;
    }

    const targetCoord = user.pendingAttack.targetCoord;
    const debris = await this.galaxyService.getDebris(targetCoord);
    const capacity = user.pendingAttack.capacity;

    let metalLoot = 0;
    let crystalLoot = 0;

    if (debris) {
      const totalDebris = debris.metal + debris.crystal;
      if (totalDebris <= capacity) {
        metalLoot = debris.metal;
        crystalLoot = debris.crystal;
      } else {
        const ratio = capacity / totalDebris;
        metalLoot = Math.floor(debris.metal * ratio);
        crystalLoot = Math.floor(debris.crystal * ratio);
      }

      await this.galaxyService.consumeDebris(targetCoord, metalLoot, crystalLoot);
    }

    // 귀환 설정
    const travelTime = user.pendingAttack.travelTime;
    const returnTime = new Date(Date.now() + travelTime * 1000);

    user.pendingReturn = {
      fleet: user.pendingAttack.fleet,
      loot: { metal: metalLoot, crystal: crystalLoot, deuterium: 0 },
      returnTime,
      startTime: new Date(),
      missionType: 'recycle',
    };

    user.pendingAttack = null;
    user.markModified('pendingReturn');
    user.markModified('pendingAttack');
    await user.save();

    // 메시지
    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '수확 사령부',
      title: `${targetCoord} 수확 보고서`,
      content: `데브리 수확을 완료했습니다. 획득 자원: 메탈 ${metalLoot}, 크리스탈 ${crystalLoot}`,
      type: 'system',
      metadata: { loot: { metal: metalLoot, crystal: crystalLoot } },
    });

    return { metalLoot, crystalLoot };
  }

  // 공격 도착 처리
  async processAttackArrival(attackerId: string): Promise<{ battleResult: BattleResult; attacker: any; defender: any } | null> {
    const attacker = await this.userModel.findById(attackerId).exec();
    if (!attacker || !attacker.pendingAttack || attacker.pendingAttack.battleCompleted) {
      return null;
    }

    // 식민 미션은 여기서 처리하지 않음 (ColonyService에서 처리)
    // missionType이 'colony'이거나, targetUserId가 빈 문자열인 경우 (식민 미션의 특징)
    if (attacker.pendingAttack.missionType === 'colony' || !attacker.pendingAttack.targetUserId) {
      return null;
    }

    // 데이터 보정 (일부 데이터가 fleet 객체 안에 잘못 들어가 있는 경우 처리)
    const pa = attacker.pendingAttack;
    if (pa.fleet && (pa.fleet as any).capacity !== undefined) {
      const fleetObj = pa.fleet as any;
      if (pa.capacity === undefined) pa.capacity = fleetObj.capacity;
      if (pa.travelTime === undefined) pa.travelTime = fleetObj.travelTime;
      if (pa.startTime === undefined && fleetObj.startTime) pa.startTime = new Date(fleetObj.startTime);
      if (pa.arrivalTime === undefined && fleetObj.arrivalTime) pa.arrivalTime = new Date(fleetObj.arrivalTime);
      
      // fleet 객체에서 잘못된 필드 제거
      const cleanFleet: Record<string, number> = {};
      for (const key in fleetObj) {
        if (FLEET_DATA[key]) {
          cleanFleet[key] = fleetObj[key];
        }
      }
      pa.fleet = cleanFleet;
      attacker.markModified('pendingAttack');
    }

    // 도착 시간 확인
    const arrivalTime = pa.arrivalTime instanceof Date ? pa.arrivalTime : new Date(pa.arrivalTime);
    if (arrivalTime.getTime() > Date.now()) {
      return null;
    }

    const target = await this.userModel.findById(pa.targetUserId).exec();
    if (!target) {
      return null;
    }

    // 자원 업데이트 (둘 다 업데이트)
    await this.resourcesService.updateResources(attackerId);
    await this.resourcesService.updateResources(target._id.toString());
    
    // 업데이트된 데이터 다시 로드
    const updatedAttacker = await this.userModel.findById(attackerId).exec();
    const updatedTarget = await this.userModel.findById(target._id.toString()).exec();
    
    if (!updatedAttacker || !updatedTarget || !updatedAttacker.pendingAttack) return null;

    // 전투 시뮬레이션
    const attackerResearch = {
      weaponsTech: updatedAttacker.researchLevels.weaponsTech || 0,
      shieldTech: updatedAttacker.researchLevels.shieldTech || 0,
      armorTech: updatedAttacker.researchLevels.armorTech || 0,
    };

    const defenderResearch = {
      weaponsTech: updatedTarget.researchLevels.weaponsTech || 0,
      shieldTech: updatedTarget.researchLevels.shieldTech || 0,
      armorTech: updatedTarget.researchLevels.armorTech || 0,
    };

    const defenderFleet: Record<string, number> = {};
    const targetFleetObj = (updatedTarget.fleet as any).toObject ? (updatedTarget.fleet as any).toObject() : updatedTarget.fleet;
    for (const key in targetFleetObj) {
      if (FLEET_DATA[key]) {
        defenderFleet[key] = (targetFleetObj as any)[key] || 0;
      }
    }

    const defenderDefense: Record<string, number> = {};
    const targetDefenseObj = (updatedTarget.defense as any).toObject ? (updatedTarget.defense as any).toObject() : updatedTarget.defense;
    for (const key in targetDefenseObj) {
      if (DEFENSE_DATA[key]) {
        defenderDefense[key] = (targetDefenseObj as any)[key] || 0;
      }
    }

    const battleResult = this.simulateBattle(
      updatedAttacker.pendingAttack.fleet,
      defenderFleet,
      defenderDefense,
      attackerResearch,
      defenderResearch,
    );

    // OGame 형식의 전투 전 정보 추가
    battleResult.before = {
      attackers: [{
        name: updatedAttacker.playerName,
        id: attackerId,
        coordinate: updatedAttacker.coordinate,
        weaponsTech: attackerResearch.weaponsTech,
        shieldTech: attackerResearch.shieldTech,
        armorTech: attackerResearch.armorTech,
        fleet: { ...updatedAttacker.pendingAttack.fleet },
      }],
      defenders: [{
        name: updatedTarget.playerName,
        id: updatedTarget._id.toString(),
        coordinate: updatedTarget.coordinate,
        weaponsTech: defenderResearch.weaponsTech,
        shieldTech: defenderResearch.shieldTech,
        armorTech: defenderResearch.armorTech,
        fleet: defenderFleet,
        defense: defenderDefense,
      }],
    };

    // 약탈량 계산
    const loot = this.calculateLoot(
      {
        metal: updatedTarget.resources.metal,
        crystal: updatedTarget.resources.crystal,
        deuterium: updatedTarget.resources.deuterium,
      },
      battleResult,
      updatedAttacker.pendingAttack.capacity,
    );

    battleResult.loot = loot;

    // 결과 적용
    if (battleResult.attackerWon) {
      // 방어자 함대 및 방어시설 갱신
      for (const key in battleResult.survivingDefenderFleet) {
        if (FLEET_DATA[key]) {
          (updatedTarget.fleet as any)[key] = battleResult.survivingDefenderFleet[key];
        }
        if (DEFENSE_DATA[key]) {
          (updatedTarget.defense as any)[key] = battleResult.survivingDefenderDefense[key];
        }
      }

      // 자원 약탈
      updatedTarget.resources.metal = Math.max(0, updatedTarget.resources.metal - loot.metal);
      updatedTarget.resources.crystal = Math.max(0, updatedTarget.resources.crystal - loot.crystal);
      updatedTarget.resources.deuterium = Math.max(0, updatedTarget.resources.deuterium - loot.deuterium);
    } else {
      // 방어자 함대 및 방어시설 갱신
      for (const key in battleResult.survivingDefenderFleet) {
        if (FLEET_DATA[key]) {
          (updatedTarget.fleet as any)[key] = battleResult.survivingDefenderFleet[key];
        }
      }
      for (const key in battleResult.survivingDefenderDefense) {
        if (DEFENSE_DATA[key]) {
          (updatedTarget.defense as any)[key] = battleResult.survivingDefenderDefense[key];
        }
      }
    }

    // 귀환 정보 설정
    const travelTime = updatedAttacker.pendingAttack.travelTime || 0;
    const returnTime = new Date(Date.now() + travelTime * 1000);

    // 데브리 생성
    if (battleResult.debris.metal > 0 || battleResult.debris.crystal > 0) {
      await this.galaxyService.updateDebris(
        updatedTarget.coordinate,
        battleResult.debris.metal,
        battleResult.debris.crystal,
      );
    }

    // 생존 함대가 있는지 확인
    const hasSurvivingFleet = Object.values(battleResult.survivingAttackerFleet).some(count => count > 0);

    if (hasSurvivingFleet) {
      // 생존 함대가 있으면 귀환 정보 설정
      updatedAttacker.pendingReturn = {
        fleet: battleResult.survivingAttackerFleet,
        loot,
        returnTime,
        startTime: new Date(),
        missionType: 'attack',
      };
      updatedAttacker.markModified('pendingReturn');
    } else {
      // 함대 전멸 시 귀환 정보 없음
      updatedAttacker.pendingReturn = null;
      updatedAttacker.markModified('pendingReturn');
    }

    // 공격 정보 초기화
    updatedAttacker.pendingAttack = null;
    updatedAttacker.markModified('pendingAttack');

    // 방어자 공격 알림 제거
    updatedTarget.incomingAttack = null;
    updatedTarget.markModified('incomingAttack');
    
    // 명시적인 함대/방어시설/자원 업데이트 알림
    updatedTarget.markModified('fleet');
    updatedTarget.markModified('defense');
    updatedTarget.markModified('resources');

    await updatedTarget.save();
    await updatedAttacker.save();

    // 메시지 생성 (실패해도 전투 결과는 유지되도록 try-catch)
    try {
      // OGame 형식의 HTML 전투 보고서 생성
      const htmlReport = this.battleReportService.generateBattleReport(
        battleResult as OGameBattleResult,
        loot,
        battleResult.restoredDefenses,
      );

      // 짧은 보고서 확인 (1~2라운드 내 패배 시)
      const shortReport = this.battleReportService.generateShortReport(battleResult);

      // 손실 계산
      const attackerTotalLoss = 
        battleResult.attackerLosses.metal + 
        battleResult.attackerLosses.crystal + 
        battleResult.attackerLosses.deuterium;
      const defenderTotalLoss = 
        battleResult.defenderLosses.metal + 
        battleResult.defenderLosses.crystal + 
        battleResult.defenderLosses.deuterium;

      // 공격자에게 보고서 전송
      const attackerContent = shortReport || htmlReport;
      const attackerResultText = battleResult.attackerWon 
        ? '승리' 
        : battleResult.draw 
          ? '무승부' 
          : '패배';

      await this.messageService.createMessage({
        receiverId: attackerId,
        senderName: '전투 지휘부',
        title: `전투 보고서 [${updatedTarget.coordinate}] (방어자 손실: ${defenderTotalLoss.toLocaleString()}, 공격자 손실: ${attackerTotalLoss.toLocaleString()})`,
        content: attackerContent,
        type: 'battle',
        metadata: { 
          battleResult: this.battleReportService.formatBattleResultForApi(
            battleResult as OGameBattleResult,
            battleResult.before.attackers[0],
            battleResult.before.defenders[0],
          ),
          resultType: attackerResultText,
          isAttacker: true,
          defender: { 
            playerName: updatedTarget.playerName, 
            coordinate: updatedTarget.coordinate,
          },
        },
      });

      // 방어자에게 보고서 전송
      const defenderResultText = battleResult.defenderWon 
        ? '승리' 
        : battleResult.draw 
          ? '무승부' 
          : '패배';

      await this.messageService.createMessage({
        receiverId: updatedTarget._id.toString(),
        senderName: '방어 사령부',
        title: `전투 보고서 [${updatedAttacker.coordinate}] (방어자 손실: ${defenderTotalLoss.toLocaleString()}, 공격자 손실: ${attackerTotalLoss.toLocaleString()})`,
        content: htmlReport,
        type: 'battle',
        metadata: { 
          battleResult: this.battleReportService.formatBattleResultForApi(
            battleResult as OGameBattleResult,
            battleResult.before.attackers[0],
            battleResult.before.defenders[0],
          ),
          resultType: defenderResultText,
          isAttacker: false,
          attacker: { 
            playerName: updatedAttacker.playerName, 
            coordinate: updatedAttacker.coordinate,
          },
        },
      });
    } catch (msgError) {
      console.error('전투 보고서 생성 실패:', msgError);
    }

    return {
      battleResult,
      attacker: {
        id: attackerId,
        coordinate: updatedAttacker.coordinate,
        playerName: updatedAttacker.playerName,
      },
      defender: {
        id: updatedTarget._id.toString(),
        coordinate: updatedTarget.coordinate,
        playerName: updatedTarget.playerName,
      },
    };
  }

  // 사용자를 대상으로 하는 도착한 모든 공격 처리
  async processIncomingAttacks(userId: string): Promise<Array<{ battleResult: BattleResult; attacker: any; defender: any }>> {
    // 이 사용자를 타겟으로 하고 아직 완료되지 않은 공격들을 찾음
    const attackers = await this.userModel.find({
      'pendingAttack.targetUserId': userId,
      'pendingAttack.battleCompleted': false,
      'pendingAttack.arrivalTime': { $lte: new Date() }
    }).exec();

    const results: Array<{ battleResult: BattleResult; attacker: any; defender: any }> = [];
    for (const attacker of attackers) {
      const result = await this.processAttackArrival(attacker._id.toString());
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  /**
   * 함대 귀환 명령 (공격 도중 귀환)
   * - 공격 중인 함대를 귀환시킴
   * - 귀환 시간 = 현재까지 진행된 편도 비행 시간
   * - 전투가 시작된 후에는 귀환 불가
   */
  async recallFleet(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 귀환 중인 경우
    if (user.pendingReturn) {
      throw new BadRequestException('이미 함대가 귀환 중입니다.');
    }

    // 출격 중인 함대가 없는 경우
    if (!user.pendingAttack) {
      throw new BadRequestException('귀환시킬 함대가 없습니다.');
    }

    // 전투가 이미 완료된 경우
    if (user.pendingAttack.battleCompleted) {
      throw new BadRequestException('전투가 이미 완료되어 귀환 중입니다.');
    }

    // 현재까지 진행된 시간 계산 (초 단위)
    const elapsedTime = (Date.now() - user.pendingAttack.startTime.getTime()) / 1000;
    
    // 도착 예정 시간이 지났으면 귀환 불가 (전투 처리 필요)
    if (Date.now() >= user.pendingAttack.arrivalTime.getTime()) {
      throw new BadRequestException('함대가 이미 목표에 도착했습니다. 전투 결과를 확인하세요.');
    }

    // 귀환 시간 = 현재까지 진행된 편도 비행 시간
    const returnTime = new Date(Date.now() + elapsedTime * 1000);

    // 방어자의 incomingAttack 제거 (공격 미션일 때만)
    const targetUserId = user.pendingAttack.targetUserId;
    if (targetUserId && targetUserId !== 'debris' && targetUserId !== 'transport' && targetUserId !== 'deploy') {
      const target = await this.userModel.findById(targetUserId).exec();
      if (target && target.incomingAttack) {
        target.incomingAttack = null;
        target.markModified('incomingAttack');
        await target.save();
      }
    }

    // 귀환할 함대 정보 저장
    const returningFleet = { ...user.pendingAttack.fleet };

    // 미션 타입 결정
    let missionType = 'attack';
    if (user.pendingAttack.targetUserId === 'transport') {
      missionType = 'transport';
    } else if (user.pendingAttack.targetUserId === 'deploy') {
      missionType = 'deploy';
    } else if (user.pendingAttack.targetUserId === 'debris') {
      missionType = 'recycle';
    }

    // 수송/배치 미션인 경우 수송하려던 자원을 돌려받음
    let returnLoot = { metal: 0, crystal: 0, deuterium: 0 };
    if (missionType === 'transport' || missionType === 'deploy') {
      const transportResources = (user.pendingAttack as any).transportResources;
      if (transportResources) {
        returnLoot = {
          metal: transportResources.metal || 0,
          crystal: transportResources.crystal || 0,
          deuterium: transportResources.deuterium || 0,
        };
      }
    }

    // pendingReturn 설정
    user.pendingReturn = {
      fleet: returningFleet,
      loot: returnLoot,
      returnTime,
      startTime: new Date(),
      missionType,
    };

    // pendingAttack 초기화
    user.pendingAttack = null;
    
    user.markModified('pendingAttack');
    user.markModified('pendingReturn');
    await user.save();

    // 알림 메시지
    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '함대 사령부',
      title: '함대 귀환 명령',
      content: `함대가 귀환 명령을 받았습니다. 예상 귀환 시간: ${Math.ceil(elapsedTime)}초`,
      type: 'system',
      metadata: { fleet: returningFleet },
    });

    return {
      message: '함대가 귀환 중입니다.',
      fleet: returningFleet,
      returnTime: elapsedTime,
    };
  }

  // 함대 귀환 처리
  async processFleetReturn(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingReturn) {
      return null;
    }

    // 귀환 시간 확인
    if (user.pendingReturn.returnTime.getTime() > Date.now()) {
      return null;
    }

    // 함대 복구
    const returnedFleet = user.pendingReturn.fleet;
    for (const type in returnedFleet) {
      (user.fleet as any)[type] = ((user.fleet as any)[type] || 0) + returnedFleet[type];
    }

    // 약탈 자원 추가
    const loot = user.pendingReturn.loot;
    user.resources.metal += (loot.metal || 0);
    user.resources.crystal += (loot.crystal || 0);
    user.resources.deuterium += (loot.deuterium || 0);

    // 상태 초기화
    user.pendingReturn = null;
    user.pendingAttack = null;
    
    user.markModified('pendingReturn');
    user.markModified('pendingAttack');
    user.markModified('fleet');
    user.markModified('resources');

    await user.save();

    // 함대 귀환 메시지 전송
    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '함대 사령부',
      title: '함대 귀환 보고',
      content: `함대가 무사히 귀환했습니다. 약탈한 자원: 메탈 ${loot.metal}, 크리스탈 ${loot.crystal}, 듀테륨 ${loot.deuterium}`,
      type: 'system',
      metadata: { returnedFleet, loot },
    });

    return {
      returnedFleet,
      loot,
    };
  }

  // ===== 수송/배치 미션 =====

  /**
   * 미션 3: 수송 (Transport)
   * 자원을 목표 행성에 내리고, 함대만 귀환
   */
  async startTransport(
    userId: string,
    targetCoord: string,
    fleet: Record<string, number>,
    resources: { metal: number; crystal: number; deuterium: number },
  ) {
    const sender = await this.resourcesService.updateResources(userId);
    if (!sender) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 함대가 출격 중인지 확인
    if (sender.pendingAttack || sender.pendingReturn) {
      throw new BadRequestException('이미 함대가 활동 중입니다.');
    }

    // 목표 행성 확인 (모행성 + 식민지 모두 검색)
    const targetResult = await this.findPlanetByCoordinate(targetCoord);
    if (!targetResult.ownerId) {
      throw new BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
    }
    const targetOwnerId = targetResult.ownerId;

    // 함대 보유 확인
    for (const type in fleet) {
      if (fleet[type] > 0) {
        if (!FLEET_DATA[type]) {
          throw new BadRequestException(`알 수 없는 함대 유형: ${type}`);
        }
        if (type === 'solarSatellite') {
          throw new BadRequestException('태양광인공위성은 수송에 참여할 수 없습니다.');
        }
        if (!(sender.fleet as any)[type] || (sender.fleet as any)[type] < fleet[type]) {
          throw new BadRequestException(`${NAME_MAPPING[type] || type}을(를) ${fleet[type]}대 보유하고 있지 않습니다.`);
        }
      }
    }

    // 거리 및 이동 시간 계산
    const distance = this.calculateDistance(sender.coordinate, targetCoord);
    const minSpeed = this.fleetService.getFleetSpeed(fleet);
    const travelTime = (distance / minSpeed) * 3600;

    // 연료 소비량 계산
    const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);

    // 총 적재량 계산
    const totalCapacity = this.fleetService.calculateTotalCapacity(fleet);
    const availableCapacity = totalCapacity - fuelConsumption;

    if (availableCapacity < 0) {
      throw new BadRequestException('적재 공간이 연료 소비량보다 적습니다.');
    }

    // 적재할 자원 검증
    const totalResources = resources.metal + resources.crystal + resources.deuterium;
    if (totalResources > availableCapacity) {
      throw new BadRequestException(`적재 공간이 부족합니다. 가용: ${availableCapacity}, 요청: ${totalResources}`);
    }

    // 자원 보유량 확인 (듀테륨은 연료 제외)
    if (sender.resources.metal < resources.metal) {
      throw new BadRequestException(`메탈이 부족합니다. 필요: ${resources.metal}, 보유: ${Math.floor(sender.resources.metal)}`);
    }
    if (sender.resources.crystal < resources.crystal) {
      throw new BadRequestException(`크리스탈이 부족합니다. 필요: ${resources.crystal}, 보유: ${Math.floor(sender.resources.crystal)}`);
    }
    if (sender.resources.deuterium < resources.deuterium + fuelConsumption) {
      throw new BadRequestException(`듀테륨이 부족합니다. 필요: ${resources.deuterium + fuelConsumption}, 보유: ${Math.floor(sender.resources.deuterium)}`);
    }

    // 자원 및 함대 차감
    sender.resources.metal -= resources.metal;
    sender.resources.crystal -= resources.crystal;
    sender.resources.deuterium -= resources.deuterium + fuelConsumption;

    for (const type in fleet) {
      if (fleet[type] > 0) {
        (sender.fleet as any)[type] -= fleet[type];
      }
    }

    const startTime = new Date();
    const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);

    sender.pendingAttack = {
      targetCoord,
      targetUserId: targetOwnerId, // 목표 행성 소유자 ID
      fleet,
      capacity: totalCapacity,
      travelTime,
      startTime,
      arrivalTime,
      battleCompleted: false,
      missionType: 'transport',
      // 수송할 자원 저장
      transportResources: resources,
    };

    sender.markModified('fleet');
    sender.markModified('resources');
    sender.markModified('pendingAttack');
    await sender.save();

    return {
      message: `${targetCoord} 좌표로 수송 함대가 출격했습니다.`,
      travelTime,
      arrivalTime,
      fuelConsumption,
      resources,
    };
  }

  /**
   * 수송 도착 처리
   */
  async processTransportArrival(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingAttack) return null;
    
    // missionType 또는 targetUserId로 수송 미션 확인
    const isTransport = user.pendingAttack.missionType === 'transport' || user.pendingAttack.targetUserId === 'transport';
    if (!isTransport) return null;

    if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
      return null;
    }

    const targetCoord = user.pendingAttack.targetCoord;
    const transportResources = (user.pendingAttack as any).transportResources || { metal: 0, crystal: 0, deuterium: 0 };

    // 목표 행성 찾기 (모행성 + 식민지)
    const targetResult = await this.findPlanetByCoordinate(targetCoord);
    
    if (targetResult.user && !targetResult.planet) {
      // 모행성에 자원 추가
      targetResult.user.resources.metal += transportResources.metal;
      targetResult.user.resources.crystal += transportResources.crystal;
      targetResult.user.resources.deuterium += transportResources.deuterium;
      targetResult.user.markModified('resources');
      await targetResult.user.save();

      // 수신자에게 메시지 전송
      await this.messageService.createMessage({
        receiverId: targetResult.user._id.toString(),
        senderName: '수송 사령부',
        title: `${user.coordinate}에서 자원 도착`,
        content: `자원이 도착했습니다! 수신된 자원: 메탈 ${transportResources.metal}, 크리스탈 ${transportResources.crystal}, 듀테륨 ${transportResources.deuterium}`,
        type: 'system',
        metadata: { resources: transportResources, from: user.coordinate },
      });
    } else if (targetResult.planet) {
      // 식민지에 자원 추가
      targetResult.planet.resources.metal += transportResources.metal;
      targetResult.planet.resources.crystal += transportResources.crystal;
      targetResult.planet.resources.deuterium += transportResources.deuterium;
      targetResult.planet.markModified('resources');
      await targetResult.planet.save();

      // 수신자에게 메시지 전송
      if (targetResult.ownerId) {
        await this.messageService.createMessage({
          receiverId: targetResult.ownerId,
          senderName: '수송 사령부',
          title: `${user.coordinate}에서 자원 도착 (${targetCoord})`,
          content: `식민지 ${targetCoord}에 자원이 도착했습니다! 수신된 자원: 메탈 ${transportResources.metal}, 크리스탈 ${transportResources.crystal}, 듀테륨 ${transportResources.deuterium}`,
          type: 'system',
          metadata: { resources: transportResources, from: user.coordinate },
        });
      }
    }

    // 귀환 설정 (자원 없이)
    const travelTime = user.pendingAttack.travelTime;
    const returnTime = new Date(Date.now() + travelTime * 1000);

    user.pendingReturn = {
      fleet: user.pendingAttack.fleet,
      loot: { metal: 0, crystal: 0, deuterium: 0 },
      returnTime,
      startTime: new Date(),
      missionType: 'transport',
    };

    user.pendingAttack = null;
    user.markModified('pendingReturn');
    user.markModified('pendingAttack');
    await user.save();

    // 발신자에게 메시지 전송
    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '수송 사령부',
      title: `${targetCoord} 수송 완료`,
      content: `자원 수송이 완료되었습니다. 전달된 자원: 메탈 ${transportResources.metal}, 크리스탈 ${transportResources.crystal}, 듀테륨 ${transportResources.deuterium}. 함대가 귀환 중입니다.`,
      type: 'system',
      metadata: { resources: transportResources },
    });

    return { delivered: transportResources };
  }

  /**
   * 미션 4: 배치 (Deploy/Stay)
   * 함대와 자원을 모두 목표 행성에 배치 (귀환 없음)
   */
  async startDeploy(
    userId: string,
    targetCoord: string,
    fleet: Record<string, number>,
    resources: { metal: number; crystal: number; deuterium: number },
  ) {
    const sender = await this.resourcesService.updateResources(userId);
    if (!sender) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 함대가 출격 중인지 확인
    if (sender.pendingAttack || sender.pendingReturn) {
      throw new BadRequestException('이미 함대가 활동 중입니다.');
    }

    // 목표 행성 확인 (모행성 + 식민지 모두 검색)
    const targetResult = await this.findPlanetByCoordinate(targetCoord);
    if (!targetResult.ownerId) {
      throw new BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
    }

    // 자기 자신에게만 배치 가능
    if (targetResult.ownerId !== userId) {
      throw new BadRequestException('배치 미션은 본인 소유의 행성에만 가능합니다.');
    }

    // 같은 행성인지 확인
    if (sender.coordinate === targetCoord) {
      throw new BadRequestException('같은 행성에는 배치할 수 없습니다.');
    }

    // 함대 보유 확인
    for (const type in fleet) {
      if (fleet[type] > 0) {
        if (!FLEET_DATA[type]) {
          throw new BadRequestException(`알 수 없는 함대 유형: ${type}`);
        }
        if (type === 'solarSatellite') {
          throw new BadRequestException('태양광인공위성은 배치에 참여할 수 없습니다.');
        }
        if (!(sender.fleet as any)[type] || (sender.fleet as any)[type] < fleet[type]) {
          throw new BadRequestException(`${NAME_MAPPING[type] || type}을(를) ${fleet[type]}대 보유하고 있지 않습니다.`);
        }
      }
    }

    // 거리 및 이동 시간 계산
    const distance = this.calculateDistance(sender.coordinate, targetCoord);
    const minSpeed = this.fleetService.getFleetSpeed(fleet);
    const travelTime = (distance / minSpeed) * 3600;

    // 연료 소비량 계산
    const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);

    // 총 적재량 계산
    const totalCapacity = this.fleetService.calculateTotalCapacity(fleet);
    const availableCapacity = totalCapacity - fuelConsumption;

    if (availableCapacity < 0) {
      throw new BadRequestException('적재 공간이 연료 소비량보다 적습니다.');
    }

    // 적재할 자원 검증
    const totalResources = resources.metal + resources.crystal + resources.deuterium;
    if (totalResources > availableCapacity) {
      throw new BadRequestException(`적재 공간이 부족합니다. 가용: ${availableCapacity}, 요청: ${totalResources}`);
    }

    // 자원 보유량 확인
    if (sender.resources.metal < resources.metal) {
      throw new BadRequestException(`메탈이 부족합니다. 필요: ${resources.metal}, 보유: ${Math.floor(sender.resources.metal)}`);
    }
    if (sender.resources.crystal < resources.crystal) {
      throw new BadRequestException(`크리스탈이 부족합니다. 필요: ${resources.crystal}, 보유: ${Math.floor(sender.resources.crystal)}`);
    }
    if (sender.resources.deuterium < resources.deuterium + fuelConsumption) {
      throw new BadRequestException(`듀테륨이 부족합니다. 필요: ${resources.deuterium + fuelConsumption}, 보유: ${Math.floor(sender.resources.deuterium)}`);
    }

    // 자원 및 함대 차감
    sender.resources.metal -= resources.metal;
    sender.resources.crystal -= resources.crystal;
    sender.resources.deuterium -= resources.deuterium + fuelConsumption;

    for (const type in fleet) {
      if (fleet[type] > 0) {
        (sender.fleet as any)[type] -= fleet[type];
      }
    }

    const startTime = new Date();
    const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);

    sender.pendingAttack = {
      targetCoord,
      targetUserId: targetResult.ownerId, // 목표 행성 소유자 ID (본인)
      fleet,
      capacity: totalCapacity,
      travelTime,
      startTime,
      arrivalTime,
      battleCompleted: false,
      missionType: 'deploy',
      // 배치할 자원 저장
      transportResources: resources,
    };

    sender.markModified('fleet');
    sender.markModified('resources');
    sender.markModified('pendingAttack');
    await sender.save();

    return {
      message: `${targetCoord} 좌표로 배치 함대가 출격했습니다.`,
      travelTime,
      arrivalTime,
      fuelConsumption,
      resources,
    };
  }

  /**
   * 배치 도착 처리
   */
  async processDeployArrival(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingAttack) return null;
    
    // missionType 또는 targetUserId로 배치 미션 확인
    const isDeploy = user.pendingAttack.missionType === 'deploy' || user.pendingAttack.targetUserId === 'deploy';
    if (!isDeploy) return null;

    if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
      return null;
    }

    const targetCoord = user.pendingAttack.targetCoord;
    const deployFleet = user.pendingAttack.fleet;
    const deployResources = (user.pendingAttack as any).transportResources || { metal: 0, crystal: 0, deuterium: 0 };

    // 목표 행성 찾기 (모행성 + 식민지)
    const targetResult = await this.findPlanetByCoordinate(targetCoord);

    if (targetResult.user && !targetResult.planet) {
      // 모행성에 함대 + 자원 추가
      for (const type in deployFleet) {
        if (deployFleet[type] > 0) {
          (targetResult.user.fleet as any)[type] = ((targetResult.user.fleet as any)[type] || 0) + deployFleet[type];
        }
      }
      targetResult.user.resources.metal += deployResources.metal;
      targetResult.user.resources.crystal += deployResources.crystal;
      targetResult.user.resources.deuterium += deployResources.deuterium;
      targetResult.user.markModified('fleet');
      targetResult.user.markModified('resources');
      await targetResult.user.save();
    } else if (targetResult.planet) {
      // 식민지에 함대 + 자원 추가
      for (const type in deployFleet) {
        if (deployFleet[type] > 0) {
          if (!targetResult.planet.fleet) targetResult.planet.fleet = {} as any;
          (targetResult.planet.fleet as any)[type] = ((targetResult.planet.fleet as any)[type] || 0) + deployFleet[type];
        }
      }
      if (!targetResult.planet.resources) {
        targetResult.planet.resources = { metal: 0, crystal: 0, deuterium: 0, energy: 0 } as any;
      }
      targetResult.planet.resources.metal += deployResources.metal;
      targetResult.planet.resources.crystal += deployResources.crystal;
      targetResult.planet.resources.deuterium += deployResources.deuterium;
      targetResult.planet.markModified('fleet');
      targetResult.planet.markModified('resources');
      await targetResult.planet.save();
    }

    // 미션 완료 (귀환 없음)
    user.pendingAttack = null;
    user.pendingReturn = null;

    user.markModified('pendingAttack');
    user.markModified('pendingReturn');
    await user.save();

    // 메시지
    const fleetList = Object.entries(deployFleet)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${NAME_MAPPING[type] || type}: ${count}`)
      .join(', ');

    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '배치 사령부',
      title: `${targetCoord} 배치 완료`,
      content: `함대와 자원이 배치되었습니다.\n함대: ${fleetList}\n자원: 메탈 ${deployResources.metal}, 크리스탈 ${deployResources.crystal}, 듀테륨 ${deployResources.deuterium}`,
      type: 'system',
      metadata: { fleet: deployFleet, resources: deployResources },
    });

    return { 
      fleet: deployFleet, 
      resources: deployResources,
    };
  }

  /**
   * 적재 가능량 계산
   */
  calculateAvailableCapacity(
    fleet: Record<string, number>,
    distance: number,
  ): { totalCapacity: number; fuelConsumption: number; availableCapacity: number } {
    const minSpeed = this.fleetService.getFleetSpeed(fleet);
    const travelTime = (distance / minSpeed) * 3600;
    const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
    const totalCapacity = this.fleetService.calculateTotalCapacity(fleet);
    const availableCapacity = Math.max(0, totalCapacity - fuelConsumption);

    return {
      totalCapacity,
      fuelConsumption,
      availableCapacity,
    };
  }
}
