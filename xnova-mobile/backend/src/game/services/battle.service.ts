import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
import { FleetService } from './fleet.service';
import { FLEET_DATA, DEFENSE_DATA, NAME_MAPPING } from '../constants/game-data';

// 전투 유닛 인터페이스
interface BattleUnit {
  id: string;
  type: string;
  side: 'attacker' | 'defender';
  attack: number;
  shield: number;
  maxShield: number;
  hp: number;
  maxHP: number;
  rapidFire: Record<string, number>;
  isDefense: boolean;
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
  rounds: any[];
  attackerLosses: { metal: number; crystal: number; deuterium: number };
  defenderLosses: { metal: number; crystal: number; deuterium: number };
  debris: { metal: number; crystal: number };
  loot: { metal: number; crystal: number; deuterium: number };
}

@Injectable()
export class BattleService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private resourcesService: ResourcesService,
    private fleetService: FleetService,
  ) {}

  // 공격 실행 함수 - XNOVA.js performAttack 마이그레이션
  private performAttack(attackingUnit: BattleUnit, targetUnit: BattleUnit): void {
    const attackPower = attackingUnit.attack;
    const shieldStrength = targetUnit.shield;

    // '튕김' 확인 - 공격력이 (보호막 강도 / 100)보다 작으면 튕겨나감
    if (attackPower < (shieldStrength / 100)) {
      return;
    }

    // 보호막 피해 계산
    if (attackPower <= shieldStrength) {
      targetUnit.shield -= attackPower;
      return;
    } else {
      const remainingDamage = attackPower - shieldStrength;
      targetUnit.shield = 0;
      targetUnit.hp -= remainingDamage;

      if (targetUnit.hp < 0) {
        targetUnit.hp = 0;
      }
    }
  }

  // 폭발 확인 함수 - XNOVA.js checkExploded 마이그레이션
  private checkExploded(unit: BattleUnit): boolean {
    if (unit.hp <= 0) {
      return true;
    }

    // 내구도가 70% 이하인 경우에만 폭발 가능성 있음
    if (unit.hp <= unit.maxHP * 0.7) {
      const explosionProbability = 1 - (unit.hp / unit.maxHP);
      return Math.random() < explosionProbability;
    }

    return false;
  }

  // 급속사격 발동 확인 - XNOVA.js checkRapidFire 마이그레이션
  private checkRapidFire(attackingUnit: BattleUnit, targetUnit: BattleUnit): boolean {
    const rapidFireValue = attackingUnit.rapidFire[targetUnit.type];

    if (!rapidFireValue || rapidFireValue <= 1) {
      return false;
    }

    const rapidFireProbability = (rapidFireValue - 1) / rapidFireValue;
    return Math.random() < rapidFireProbability;
  }

  // 전투 시뮬레이션 - XNOVA.js simulateBattle 마이그레이션
  simulateBattle(
    attackerFleet: Record<string, number>,
    defenderFleet: Record<string, number>,
    defenderDefense: Record<string, number>,
    attackerResearch: Record<string, number> = {},
    defenderResearch: Record<string, number> = {},
  ): BattleResult {
    // 기술 보너스 계산
    const attackerWeaponBonus = 1 + (attackerResearch.weaponsTech || 0) * 0.1;
    const attackerShieldBonus = 1 + (attackerResearch.shieldTech || 0) * 0.1;
    const attackerArmorBonus = 1 + (attackerResearch.armorTech || 0) * 0.1;

    const defenderWeaponBonus = 1 + (defenderResearch.weaponsTech || 0) * 0.1;
    const defenderShieldBonus = 1 + (defenderResearch.shieldTech || 0) * 0.1;
    const defenderArmorBonus = 1 + (defenderResearch.armorTech || 0) * 0.1;

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
    };

    // 공격자 유닛 준비
    let attackerUnits: BattleUnit[] = [];
    for (const type in attackerFleet) {
      if (attackerFleet[type] > 0 && FLEET_DATA[type]) {
        const fleetStats = FLEET_DATA[type].stats;
        const rapidFire = FLEET_DATA[type].rapidFire || {};

        const attack = Math.floor(fleetStats.attack * attackerWeaponBonus);
        const shield = Math.floor(fleetStats.shield * attackerShieldBonus);
        const hp = Math.floor(fleetStats.hull * attackerArmorBonus);

        for (let i = 0; i < attackerFleet[type]; i++) {
          attackerUnits.push({
            id: `attacker_${type}_${i}`,
            type,
            side: 'attacker',
            attack,
            shield,
            maxShield: shield,
            hp,
            maxHP: hp,
            rapidFire,
            isDefense: false,
          });
        }
      }
    }

    // 방어자 함대 유닛 준비
    let defenderUnits: BattleUnit[] = [];
    for (const type in defenderFleet) {
      if (defenderFleet[type] > 0 && FLEET_DATA[type]) {
        const fleetStats = FLEET_DATA[type].stats;
        const rapidFire = FLEET_DATA[type].rapidFire || {};

        const attack = Math.floor(fleetStats.attack * defenderWeaponBonus);
        const shield = Math.floor(fleetStats.shield * defenderShieldBonus);
        const hp = Math.floor(fleetStats.hull * defenderArmorBonus);

        for (let i = 0; i < defenderFleet[type]; i++) {
          defenderUnits.push({
            id: `defender_${type}_${i}`,
            type,
            side: 'defender',
            attack,
            shield,
            maxShield: shield,
            hp,
            maxHP: hp,
            rapidFire,
            isDefense: false,
          });
        }
      }
    }

    // 방어자 방어시설 유닛 준비
    for (const type in defenderDefense) {
      if (defenderDefense[type] > 0 && DEFENSE_DATA[type]) {
        const defenseStats = DEFENSE_DATA[type].stats;

        const attack = Math.floor(defenseStats.attack * defenderWeaponBonus);
        const shield = Math.floor(defenseStats.shield * defenderShieldBonus);
        const hp = Math.floor(defenseStats.hull * defenderArmorBonus);

        for (let i = 0; i < defenderDefense[type]; i++) {
          defenderUnits.push({
            id: `defense_${type}_${i}`,
            type,
            side: 'defender',
            attack,
            shield,
            maxShield: shield,
            hp,
            maxHP: hp,
            rapidFire: {},
            isDefense: true,
          });
        }
      }
    }

    // 전투 라운드 (최대 6라운드)
    const MAX_ROUNDS = 6;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const roundInfo: any = {
        round: round + 1,
        attackerTotalDamage: 0,
        defenderTotalDamage: 0,
        attackerShieldAbsorbed: 0,
        defenderShieldAbsorbed: 0,
        attackerHullDamage: 0,
        defenderHullDamage: 0,
        destroyedAttackerShips: {},
        destroyedDefenderShips: {},
        remainingAttackerFleet: {},
        remainingDefenderFleet: {},
        remainingDefenderDefense: {},
        rapidFireCount: 0,
      };

      if (attackerUnits.length === 0 || defenderUnits.length === 0) {
        this.countRemainingUnits(attackerUnits, defenderUnits, roundInfo);
        result.rounds.push(roundInfo);
        break;
      }

      // 모든 유닛 섞기
      const allUnits = [...attackerUnits.map(u => ({ ...u })), ...defenderUnits.map(u => ({ ...u }))];
      
      // Fisher-Yates 셔플
      for (let i = allUnits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allUnits[i], allUnits[j]] = [allUnits[j], allUnits[i]];
      }

      // 각 유닛 공격 처리
      for (const attackingUnit of allUnits) {
        const targetUnits = attackingUnit.side === 'attacker' ? defenderUnits : attackerUnits;

        if (targetUnits.length === 0) continue;
        if (attackingUnit.hp <= 0) continue;

        let fireCount = 1;

        while (fireCount > 0 && targetUnits.length > 0) {
          const targetIndex = Math.floor(Math.random() * targetUnits.length);
          if (targetIndex < 0 || targetIndex >= targetUnits.length) continue;

          const targetUnit = targetUnits[targetIndex];
          if (!targetUnit || targetUnit.hp <= 0) {
            targetUnits.splice(targetIndex, 1);
            continue;
          }

          const initialShield = targetUnit.shield;
          const initialHp = targetUnit.hp;

          this.performAttack(attackingUnit, targetUnit);

          const shieldDamage = Math.max(0, initialShield - targetUnit.shield);
          const hullDamage = Math.max(0, initialHp - targetUnit.hp);

          if (attackingUnit.side === 'attacker') {
            roundInfo.attackerTotalDamage += (shieldDamage + hullDamage);
            roundInfo.defenderShieldAbsorbed += shieldDamage;
            roundInfo.defenderHullDamage += hullDamage;
          } else {
            roundInfo.defenderTotalDamage += (shieldDamage + hullDamage);
            roundInfo.attackerShieldAbsorbed += shieldDamage;
            roundInfo.attackerHullDamage += hullDamage;
          }

          // 폭발 확인
          if (targetUnit.hp > 0 && this.checkExploded(targetUnit)) {
            targetUnit.hp = 0;

            if (attackingUnit.side === 'attacker') {
              roundInfo.destroyedDefenderShips[targetUnit.type] = (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;

              if (!targetUnit.isDefense && FLEET_DATA[targetUnit.type]) {
                const cost = FLEET_DATA[targetUnit.type].cost;
                result.debris.metal += Math.floor((cost.metal || 0) * 0.3);
                result.debris.crystal += Math.floor((cost.crystal || 0) * 0.3);
                result.defenderLosses.metal += (cost.metal || 0);
                result.defenderLosses.crystal += (cost.crystal || 0);
                result.defenderLosses.deuterium += (cost.deuterium || 0);
              } else if (DEFENSE_DATA[targetUnit.type]) {
                const cost = DEFENSE_DATA[targetUnit.type].cost;
                result.defenderLosses.metal += (cost.metal || 0);
                result.defenderLosses.crystal += (cost.crystal || 0);
                result.defenderLosses.deuterium += (cost.deuterium || 0);
              }
            } else {
              roundInfo.destroyedAttackerShips[targetUnit.type] = (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;

              if (FLEET_DATA[targetUnit.type]) {
                const cost = FLEET_DATA[targetUnit.type].cost;
                result.debris.metal += Math.floor((cost.metal || 0) * 0.3);
                result.debris.crystal += Math.floor((cost.crystal || 0) * 0.3);
                result.attackerLosses.metal += (cost.metal || 0);
                result.attackerLosses.crystal += (cost.crystal || 0);
                result.attackerLosses.deuterium += (cost.deuterium || 0);
              }
            }
          }

          // 급속사격 확인
          if (targetUnit.hp <= 0 || this.checkRapidFire(attackingUnit, targetUnit)) {
            fireCount++;
            roundInfo.rapidFireCount++;
          }

          if (targetUnit.hp <= 0) {
            targetUnits.splice(targetIndex, 1);
          }

          fireCount--;
        }
      }

      // 파괴된 유닛 제거
      attackerUnits = attackerUnits.filter(unit => unit.hp > 0);
      defenderUnits = defenderUnits.filter(unit => unit.hp > 0);

      this.countRemainingUnits(attackerUnits, defenderUnits, roundInfo);
      result.rounds.push(roundInfo);

      // 방패 복구
      for (const unit of attackerUnits) {
        unit.shield = unit.maxShield;
      }
      for (const unit of defenderUnits) {
        unit.shield = unit.maxShield;
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
    result.survivingDefenderDefense = finalDefenderDefense;

    // 승패 판정
    const attackerSurvives = attackerUnits.length > 0;
    const defenderSurvives = defenderUnits.some(unit => !unit.isDefense);
    const onlyDefenseSurvives = defenderUnits.length > 0 && defenderUnits.every(unit => unit.isDefense);

    if (!attackerSurvives && defenderSurvives) {
      result.defenderWon = true;
    } else if (attackerSurvives && (!defenderSurvives || onlyDefenseSurvives)) {
      result.attackerWon = true;

      // 방어시설 복구 (70% 확률)
      for (const type in result.initialDefenderDefense) {
        const initialCount = result.initialDefenderDefense[type] || 0;
        const surviveCount = finalDefenderDefense[type] || 0;
        const destroyedCount = initialCount - surviveCount;

        if (destroyedCount > 0) {
          let restoredCount = 0;
          for (let i = 0; i < destroyedCount; i++) {
            if (Math.random() < 0.7) {
              restoredCount++;
            }
          }

          if (restoredCount > 0) {
            result.restoredDefenses[type] = restoredCount;
            result.survivingDefenderDefense[type] += restoredCount;
          }
        }
      }
    } else if (!attackerSurvives && !defenderSurvives) {
      result.draw = true;
    }

    return result;
  }

  // 남은 유닛 카운트
  private countRemainingUnits(attackerUnits: BattleUnit[], defenderUnits: BattleUnit[], roundInfo: any): void {
    const attackerCount: Record<string, number> = {};
    for (const unit of attackerUnits) {
      attackerCount[unit.type] = (attackerCount[unit.type] || 0) + 1;
    }

    const defenderFleetCount: Record<string, number> = {};
    const defenderDefenseCount: Record<string, number> = {};

    for (const unit of defenderUnits) {
      if (unit.isDefense) {
        defenderDefenseCount[unit.type] = (defenderDefenseCount[unit.type] || 0) + 1;
      } else {
        defenderFleetCount[unit.type] = (defenderFleetCount[unit.type] || 0) + 1;
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

  // 약탈량 계산 - XNOVA.js calculateLoot 마이그레이션
  calculateLoot(
    resources: { metal: number; crystal: number; deuterium: number },
    battleResult: BattleResult,
    capacity: number,
  ): { metal: number; crystal: number; deuterium: number } {
    if (!battleResult.attackerWon) {
      return { metal: 0, crystal: 0, deuterium: 0 };
    }

    const lootRatio = 0.3;
    const loot = {
      metal: Math.floor(resources.metal * lootRatio),
      crystal: Math.floor(resources.crystal * lootRatio),
      deuterium: Math.floor(resources.deuterium * lootRatio),
    };

    const totalLoot = loot.metal + loot.crystal + loot.deuterium;

    if (totalLoot > capacity) {
      const ratio = capacity / totalLoot;
      loot.metal = Math.floor(loot.metal * ratio);
      loot.crystal = Math.floor(loot.crystal * ratio);
      loot.deuterium = Math.floor(loot.deuterium * ratio);
    }

    return loot;
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

    // 함대 확인
    for (const type in fleet) {
      if (fleet[type] > 0) {
        if (type === 'solarSatellite') {
          throw new BadRequestException('태양광인공위성은 공격에 참여할 수 없습니다.');
        }
        if (!(attacker.fleet as any)[type] || (attacker.fleet as any)[type] < fleet[type]) {
          throw new BadRequestException(`${NAME_MAPPING[type] || type}을(를) ${fleet[type]}대 보유하고 있지 않습니다.`);
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
      result.pendingAttack = {
        targetCoord: user.pendingAttack.targetCoord,
        fleet: user.pendingAttack.fleet,
        remainingTime: remaining,
        battleCompleted: user.pendingAttack.battleCompleted,
      };
    }

    if (user.pendingReturn) {
      const remaining = Math.max(0, (user.pendingReturn.returnTime.getTime() - Date.now()) / 1000);
      result.pendingReturn = {
        fleet: user.pendingReturn.fleet,
        loot: user.pendingReturn.loot,
        remainingTime: remaining,
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

  // 공격 도착 처리
  async processAttackArrival(attackerId: string): Promise<{ battleResult: BattleResult; attacker: any; defender: any } | null> {
    const attacker = await this.userModel.findById(attackerId).exec();
    if (!attacker || !attacker.pendingAttack || attacker.pendingAttack.battleCompleted) {
      return null;
    }

    // 도착 시간 확인
    if (attacker.pendingAttack.arrivalTime.getTime() > Date.now()) {
      return null;
    }

    const target = await this.userModel.findById(attacker.pendingAttack.targetUserId).exec();
    if (!target) {
      return null;
    }

    // 자원 업데이트
    await this.resourcesService.updateResources(target._id.toString());

    // 전투 시뮬레이션
    const attackerResearch = {
      weaponsTech: attacker.researchLevels.weaponsTech || 0,
      shieldTech: attacker.researchLevels.shieldTech || 0,
      armorTech: attacker.researchLevels.armorTech || 0,
    };

    const defenderResearch = {
      weaponsTech: target.researchLevels.weaponsTech || 0,
      shieldTech: target.researchLevels.shieldTech || 0,
      armorTech: target.researchLevels.armorTech || 0,
    };

    const defenderFleet: Record<string, number> = {};
    for (const key in target.fleet) {
      defenderFleet[key] = (target.fleet as any)[key] || 0;
    }

    const defenderDefense: Record<string, number> = {};
    for (const key in target.defense) {
      defenderDefense[key] = (target.defense as any)[key] || 0;
    }

    const battleResult = this.simulateBattle(
      attacker.pendingAttack.fleet,
      defenderFleet,
      defenderDefense,
      attackerResearch,
      defenderResearch,
    );

    // 약탈량 계산
    const loot = this.calculateLoot(
      {
        metal: target.resources.metal,
        crystal: target.resources.crystal,
        deuterium: target.resources.deuterium,
      },
      battleResult,
      attacker.pendingAttack.capacity,
    );

    battleResult.loot = loot;

    // 결과 적용
    if (battleResult.attackerWon) {
      // 방어자 함대 및 방어시설 갱신
      for (const key in battleResult.survivingDefenderFleet) {
        (target.fleet as any)[key] = battleResult.survivingDefenderFleet[key];
      }
      for (const key in battleResult.survivingDefenderDefense) {
        (target.defense as any)[key] = battleResult.survivingDefenderDefense[key];
      }

      // 자원 약탈
      target.resources.metal = Math.max(0, target.resources.metal - loot.metal);
      target.resources.crystal = Math.max(0, target.resources.crystal - loot.crystal);
      target.resources.deuterium = Math.max(0, target.resources.deuterium - loot.deuterium);
    } else {
      // 방어자 함대 및 방어시설 갱신
      for (const key in battleResult.survivingDefenderFleet) {
        (target.fleet as any)[key] = battleResult.survivingDefenderFleet[key];
      }
      for (const key in battleResult.survivingDefenderDefense) {
        (target.defense as any)[key] = battleResult.survivingDefenderDefense[key];
      }
    }

    // 귀환 정보 설정
    const returnTime = new Date(Date.now() + attacker.pendingAttack.travelTime * 1000);

    attacker.pendingAttack.battleCompleted = true;
    attacker.pendingReturn = {
      fleet: battleResult.survivingAttackerFleet,
      loot,
      returnTime,
    };

    // 방어자 공격 알림 제거
    target.incomingAttack = null;

    await attacker.save();
    await target.save();

    return {
      battleResult,
      attacker: {
        id: attackerId,
        coordinate: attacker.coordinate,
        playerName: attacker.playerName,
      },
      defender: {
        id: target._id.toString(),
        coordinate: target.coordinate,
        playerName: target.playerName,
      },
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

    await user.save();

    return {
      returnedFleet,
      loot,
    };
  }
}
