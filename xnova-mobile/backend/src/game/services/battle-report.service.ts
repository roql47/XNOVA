import { Injectable } from '@nestjs/common';
import { FLEET_DATA, DEFENSE_DATA, NAME_MAPPING } from '../constants/game-data';
import { BattleResult } from './battle.service';

/**
 * OGame 전투 보고서 생성 서비스
 * 원본 battle.php의 BattleReport() 및 GenSlot() 함수 기반
 */

// 유닛 타입 매핑 (OGame GID 형식)
const UNIT_GID_MAP: Record<string, number> = {
  // 함선
  smallCargo: 202,
  largeCargo: 203,
  lightFighter: 204,
  heavyFighter: 205,
  cruiser: 206,
  battleship: 207,
  battlecruiser: 215,
  bomber: 211,
  destroyer: 213,
  deathstar: 214,
  recycler: 209,
  espionageProbe: 210,
  solarSatellite: 212,
  // 방어시설
  rocketLauncher: 401,
  lightLaser: 402,
  heavyLaser: 403,
  gaussCannon: 404,
  ionCannon: 405,
  plasmaTurret: 406,
  smallShieldDome: 407,
  largeShieldDome: 408,
};

// 유닛 약어 (전투 보고서용)
const UNIT_SHORT_NAMES: Record<string, string> = {
  smallCargo: '소화물',
  largeCargo: '대화물',
  lightFighter: '전투기',
  heavyFighter: '공격기',
  cruiser: '순양함',
  battleship: '전함',
  battlecruiser: '전순',
  bomber: '폭격기',
  destroyer: '구축함',
  deathstar: '죽별',
  recycler: '수확선',
  espionageProbe: '정찰기',
  solarSatellite: '위성',
  rocketLauncher: '미발',
  lightLaser: '경레',
  heavyLaser: '중레',
  gaussCannon: '가우스',
  ionCannon: '이온',
  plasmaTurret: '플라즈마',
  smallShieldDome: '소돔',
  largeShieldDome: '대돔',
};

// 전투 결과 CSS 클래스
const BATTLE_RESULT_CLASSES = {
  attacker: {
    won: 'combatreport_ididattack_iwon',
    lost: 'combatreport_ididattack_ilost',
    draw: 'combatreport_ididattack_draw',
  },
  defender: {
    won: 'combatreport_igotattacked_iwon',
    lost: 'combatreport_igotattacked_ilost',
    draw: 'combatreport_igotattacked_draw',
  },
};

// 전투 참가자 정보
export interface BattleParticipant {
  name: string;
  id: string;
  coordinate: string;
  weaponsTech: number;
  shieldTech: number;
  armorTech: number;
  fleet: Record<string, number>;
  defense?: Record<string, number>;
}

// 확장된 라운드 정보 (OGame 형식)
export interface OGameRoundInfo {
  round: number;
  // 공격측 통계
  ashoot: number;          // 공격측 발사 횟수
  apower: number;          // 공격측 총 화력
  dabsorb: number;         // 방어측 쉴드 흡수량
  // 방어측 통계
  dshoot: number;          // 방어측 발사 횟수
  dpower: number;          // 방어측 총 화력
  aabsorb: number;         // 공격측 쉴드 흡수량
  // 라운드 후 남은 유닛
  attackers: BattleParticipant[];
  defenders: BattleParticipant[];
  // 기존 호환성 필드 (내부 추적용)
  destroyedAttackerShips: Record<string, number>;
  destroyedDefenderShips: Record<string, number>;
  rapidFireCount: number;
}

// 확장된 전투 결과 (OGame 형식)
export interface OGameBattleResult extends BattleResult {
  battleSeed: number;
  battleTime: Date;
  before: {
    attackers: BattleParticipant[];
    defenders: BattleParticipant[];
  };
  rounds: OGameRoundInfo[];
}

@Injectable()
export class BattleReportService {
  /**
   * 숫자를 포맷팅 (천 단위 콤마)
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('ko-KR');
  }

  /**
   * 유닛 통계 계산 (공격력, 쉴드, 장갑)
   */
  private getUnitStats(type: string, weaponsTech: number, shieldTech: number, armorTech: number) {
    const data = FLEET_DATA[type] || DEFENSE_DATA[type];
    if (!data) return null;

    const stats = data.stats;
    return {
      attack: Math.floor(stats.attack * (10 + weaponsTech) / 10),
      shield: Math.floor(stats.shield * (10 + shieldTech) / 10),
      armor: Math.floor(stats.hull * 0.1 * (10 + armorTech) / 10),
    };
  }

  /**
   * 개별 슬롯 HTML 생성 (GenSlot 함수)
   * @param participant 참가자 정보
   * @param showTechs 기술 레벨 표시 여부
   * @param isAttacker 공격자 여부
   */
  private generateSlotHtml(
    participant: BattleParticipant,
    showTechs: boolean,
    isAttacker: boolean,
  ): string {
    const [galaxy, system, planet] = participant.coordinate.split(':');
    const roleLabel = isAttacker ? '공격자' : '방어자';
    const roleClass = isAttacker ? 'attacker' : 'defender';

    let html = `<div class="battle-slot ${roleClass}">`;
    html += `<div class="slot-header">`;
    html += `<span class="role-label">${roleLabel}</span> `;
    html += `<span class="player-name">${participant.name}</span> `;
    html += `<span class="coordinates">[${participant.coordinate}]</span>`;
    html += `</div>`;

    // 기술 레벨 표시
    if (showTechs) {
      html += `<div class="tech-levels">`;
      html += `무기: ${participant.weaponsTech * 10}% `;
      html += `쉴드: ${participant.shieldTech * 10}% `;
      html += `장갑: ${participant.armorTech * 10}%`;
      html += `</div>`;
    }

    // 유닛 테이블 생성
    const allUnits = { ...participant.fleet, ...(participant.defense || {}) };
    const activeUnits = Object.entries(allUnits).filter(([, count]) => count > 0);

    if (activeUnits.length > 0) {
      html += `<table class="unit-table">`;

      // 헤더 행
      html += `<tr><th>유닛</th>`;
      for (const [type] of activeUnits) {
        const shortName = UNIT_SHORT_NAMES[type] || NAME_MAPPING[type] || type;
        html += `<th>${shortName}</th>`;
      }
      html += `</tr>`;

      // 수량 행
      html += `<tr><td>수량</td>`;
      for (const [, count] of activeUnits) {
        html += `<td>${this.formatNumber(count)}</td>`;
      }
      html += `</tr>`;

      // 공격력 행
      html += `<tr><td>공격력</td>`;
      for (const [type] of activeUnits) {
        const stats = this.getUnitStats(
          type,
          participant.weaponsTech,
          participant.shieldTech,
          participant.armorTech,
        );
        html += `<td>${stats ? this.formatNumber(stats.attack) : '-'}</td>`;
      }
      html += `</tr>`;

      // 쉴드 행
      html += `<tr><td>쉴드</td>`;
      for (const [type] of activeUnits) {
        const stats = this.getUnitStats(
          type,
          participant.weaponsTech,
          participant.shieldTech,
          participant.armorTech,
        );
        html += `<td>${stats ? this.formatNumber(stats.shield) : '-'}</td>`;
      }
      html += `</tr>`;

      // 장갑 행
      html += `<tr><td>장갑</td>`;
      for (const [type] of activeUnits) {
        const stats = this.getUnitStats(
          type,
          participant.weaponsTech,
          participant.shieldTech,
          participant.armorTech,
        );
        html += `<td>${stats ? this.formatNumber(stats.armor) : '-'}</td>`;
      }
      html += `</tr>`;

      html += `</table>`;
    } else {
      html += `<div class="destroyed">파괴됨</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * 라운드 통계 HTML 생성
   */
  private generateRoundStatsHtml(round: OGameRoundInfo): string {
    let html = `<div class="round-stats">`;
    html += `<div class="round-header">라운드 ${round.round}</div>`;

    // 공격측 발사 통계
    html += `<div class="attacker-stats">`;
    html += `공격 함대가 ${this.formatNumber(round.ashoot)}회 발사하여 `;
    html += `총 ${this.formatNumber(round.apower)}의 화력으로 방어자를 공격합니다. `;
    html += `방어측 쉴드가 ${this.formatNumber(round.dabsorb)}의 데미지를 흡수했습니다.`;
    html += `</div>`;

    // 방어측 발사 통계
    html += `<div class="defender-stats">`;
    html += `방어 함대가 ${this.formatNumber(round.dshoot)}회 발사하여 `;
    html += `총 ${this.formatNumber(round.dpower)}의 화력으로 공격자를 공격합니다. `;
    html += `공격측 쉴드가 ${this.formatNumber(round.aabsorb)}의 데미지를 흡수했습니다.`;
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  /**
   * 전투 보고서 HTML 생성 (BattleReport 함수)
   */
  generateBattleReport(
    battleResult: OGameBattleResult,
    loot: { metal: number; crystal: number; deuterium: number },
    repaired: Record<string, number>,
  ): string {
    const battleTime = battleResult.battleTime || new Date();
    const timeStr = battleTime.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    let html = `<div class="battle-report">`;

    // 1. 보고서 제목 (날짜/시간)
    html += `<div class="report-header">`;
    html += `${timeStr}에 다음 함대들이 전투를 벌였습니다:`;
    html += `</div>`;

    // 2. 전투 전 함대 정보
    html += `<div class="before-battle">`;
    html += `<div class="section-title">전투 전 상황</div>`;

    // 공격측
    for (const attacker of battleResult.before.attackers) {
      html += this.generateSlotHtml(attacker, true, true);
    }

    // 방어측
    for (const defender of battleResult.before.defenders) {
      html += this.generateSlotHtml(defender, true, false);
    }

    html += `</div>`;

    // 3. 라운드별 결과
    html += `<div class="battle-rounds">`;
    for (const round of battleResult.rounds) {
      // 라운드 통계
      html += this.generateRoundStatsHtml(round);

      // 라운드 후 남은 유닛
      html += `<div class="after-round">`;

      // 공격측 남은 유닛
      for (const attacker of round.attackers) {
        html += this.generateSlotHtml(attacker, false, true);
      }

      // 방어측 남은 유닛
      for (const defender of round.defenders) {
        html += this.generateSlotHtml(defender, false, false);
      }

      html += `</div>`;
    }
    html += `</div>`;

    // 4. 전투 결과
    html += `<div class="battle-result">`;
    if (battleResult.attackerWon) {
      html += `<div class="result-text attacker-won">공격자가 전투에서 승리했습니다!</div>`;
      html += `<div class="plunder">`;
      html += `약탈한 자원: `;
      html += `<span class="metal">${this.formatNumber(loot.metal)} 메탈</span>, `;
      html += `<span class="crystal">${this.formatNumber(loot.crystal)} 크리스탈</span>, `;
      html += `<span class="deuterium">${this.formatNumber(loot.deuterium)} 듀테륨</span>`;
      html += `</div>`;
    } else if (battleResult.defenderWon) {
      html += `<div class="result-text defender-won">방어자가 전투에서 승리했습니다!</div>`;
    } else {
      html += `<div class="result-text draw">전투가 무승부로 끝났습니다. 양측 함대가 각자의 행성으로 귀환합니다.</div>`;
    }
    html += `</div>`;

    // 5. 손실 정보
    const attackerTotalLoss =
      battleResult.attackerLosses.metal +
      battleResult.attackerLosses.crystal +
      battleResult.attackerLosses.deuterium;
    const defenderTotalLoss =
      battleResult.defenderLosses.metal +
      battleResult.defenderLosses.crystal +
      battleResult.defenderLosses.deuterium;

    html += `<div class="losses">`;
    html += `<div class="attacker-loss">공격자 총 손실: ${this.formatNumber(attackerTotalLoss)} 유닛</div>`;
    html += `<div class="defender-loss">방어자 총 손실: ${this.formatNumber(defenderTotalLoss)} 유닛</div>`;
    html += `</div>`;

    // 6. 잔해 필드
    html += `<div class="debris-field">`;
    html += `이 좌표에 ${this.formatNumber(battleResult.debris.metal)} 메탈과 `;
    html += `${this.formatNumber(battleResult.debris.crystal)} 크리스탈이 떠다니고 있습니다.`;
    html += `</div>`;

    // 7. 달 생성 확률 & 결과
    if (battleResult.moonChance > 0) {
      html += `<div class="moon-chance">달 생성 확률: ${battleResult.moonChance}%</div>`;
      if (battleResult.moonCreated) {
        html += `<div class="moon-created">거대한 양의 메탈과 크리스탈이 모여 행성 주위에 달을 형성했습니다!</div>`;
      }
    }

    // 8. 복구된 방어시설
    const repairedEntries = Object.entries(repaired).filter(([, count]) => count > 0);
    if (repairedEntries.length > 0) {
      html += `<div class="repaired-defenses">`;
      const repairedList = repairedEntries
        .map(([type, count]) => `${count} ${NAME_MAPPING[type] || type}`)
        .join(', ');
      html += `${repairedList} 복구되었습니다.`;
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * 짧은 전투 보고서 생성 (1~2라운드 내 패배 시)
   */
  generateShortReport(battleResult: BattleResult): string | null {
    if (battleResult.rounds.length <= 2 && battleResult.defenderWon) {
      const attackerLoss =
        battleResult.attackerLosses.metal +
        battleResult.attackerLosses.crystal +
        battleResult.attackerLosses.deuterium;
      const defenderLoss =
        battleResult.defenderLosses.metal +
        battleResult.defenderLosses.crystal +
        battleResult.defenderLosses.deuterium;

      return `<div class="short-report">
        <div class="lost-contact">공격 함대와의 연락이 끊어졌습니다.</div>
        <div class="explanation">(이는 함대가 첫 번째 라운드에 전멸했음을 의미합니다.)</div>
        <!-- A:${attackerLoss},D:${defenderLoss} -->
      </div>`;
    }
    return null;
  }

  /**
   * 메시지 목록용 전투 보고서 링크 생성
   */
  generateReportLink(
    reportId: string,
    coordinate: string,
    attackerLoss: number,
    defenderLoss: number,
    result: 'won' | 'lost' | 'draw',
    isAttacker: boolean,
  ): string {
    const resultClass = isAttacker
      ? BATTLE_RESULT_CLASSES.attacker[result]
      : BATTLE_RESULT_CLASSES.defender[result];

    return `<a href="#" class="battle-report-link ${resultClass}" data-report-id="${reportId}">
      전투 보고서 [${coordinate}] (방어자 손실: ${this.formatNumber(defenderLoss)}, 공격자 손실: ${this.formatNumber(attackerLoss)})
    </a>`;
  }

  /**
   * 전투 보고서 JSON 형식으로 변환 (API 응답용)
   */
  formatBattleResultForApi(
    battleResult: OGameBattleResult,
    attacker: BattleParticipant,
    defender: BattleParticipant,
  ): any {
    return {
      battleSeed: battleResult.battleSeed,
      battleTime: battleResult.battleTime,
      result: battleResult.attackerWon ? 'awon' : battleResult.defenderWon ? 'dwon' : 'draw',
      dm: battleResult.debris.metal,
      dk: battleResult.debris.crystal,
      before: {
        attackers: [
          {
            name: attacker.name,
            id: attacker.id,
            coordinate: attacker.coordinate,
            weap: attacker.weaponsTech,
            shld: attacker.shieldTech,
            armr: attacker.armorTech,
            fleet: attacker.fleet,
          },
        ],
        defenders: [
          {
            name: defender.name,
            id: defender.id,
            coordinate: defender.coordinate,
            weap: defender.weaponsTech,
            shld: defender.shieldTech,
            armr: defender.armorTech,
            fleet: defender.fleet,
            defense: defender.defense,
          },
        ],
      },
      rounds: battleResult.rounds.map((round) => ({
        ashoot: round.ashoot,
        apower: round.apower,
        dabsorb: round.dabsorb,
        dshoot: round.dshoot,
        dpower: round.dpower,
        aabsorb: round.aabsorb,
        attackers: round.attackers,
        defenders: round.defenders,
      })),
      attackerLosses: battleResult.attackerLosses,
      defenderLosses: battleResult.defenderLosses,
      loot: battleResult.loot,
      moonChance: battleResult.moonChance,
      moonCreated: battleResult.moonCreated,
      restoredDefenses: battleResult.restoredDefenses,
    };
  }
}

