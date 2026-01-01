import { BattleResult } from './battle.service';
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
export interface OGameRoundInfo {
    round: number;
    ashoot: number;
    apower: number;
    dabsorb: number;
    dshoot: number;
    dpower: number;
    aabsorb: number;
    attackers: BattleParticipant[];
    defenders: BattleParticipant[];
    destroyedAttackerShips: Record<string, number>;
    destroyedDefenderShips: Record<string, number>;
    rapidFireCount: number;
}
export interface OGameBattleResult extends BattleResult {
    battleSeed: number;
    battleTime: Date;
    before: {
        attackers: BattleParticipant[];
        defenders: BattleParticipant[];
    };
    rounds: OGameRoundInfo[];
}
export declare class BattleReportService {
    private formatNumber;
    private getUnitStats;
    private generateSlotHtml;
    private generateRoundStatsHtml;
    generateBattleReport(battleResult: OGameBattleResult, loot: {
        metal: number;
        crystal: number;
        deuterium: number;
    }, repaired: Record<string, number>): string;
    generateShortReport(battleResult: BattleResult): string | null;
    generateReportLink(reportId: string, coordinate: string, attackerLoss: number, defenderLoss: number, result: 'won' | 'lost' | 'draw', isAttacker: boolean): string;
    formatBattleResultForApi(battleResult: OGameBattleResult, attacker: BattleParticipant, defender: BattleParticipant): any;
}
