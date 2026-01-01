import { BattleService, BattleResult } from './battle.service';
import { BattleReportService, OGameBattleResult } from './battle-report.service';
export interface BattleSlot {
    name: string;
    id: string;
    coordinate: string;
    weaponsTech: number;
    shieldTech: number;
    armorTech: number;
    fleet: Record<string, number>;
    defense?: Record<string, number>;
}
export interface SimulationConfig {
    rapidFire: boolean;
    fleetInDebris: number;
    defenseInDebris: number;
    debug: boolean;
}
export interface SimulationRequest {
    attackers: BattleSlot[];
    defenders: BattleSlot[];
    config?: Partial<SimulationConfig>;
    battleSource?: string;
}
export interface SimulationResult {
    battleResult: OGameBattleResult;
    htmlReport: string;
    attackerLosses: {
        metal: number;
        crystal: number;
        deuterium: number;
        total: number;
    };
    defenderLosses: {
        metal: number;
        crystal: number;
        deuterium: number;
        total: number;
    };
    debris: {
        metal: number;
        crystal: number;
    };
    moonChance: number;
    moonCreated: boolean;
    restoredDefenses: Record<string, number>;
    resultType: 'awon' | 'dwon' | 'draw';
    sourceData?: string;
}
export declare class BattleSimulatorService {
    private battleService;
    private battleReportService;
    constructor(battleService: BattleService, battleReportService: BattleReportService);
    private getDefaultConfig;
    generateBattleSourceData(attackers: BattleSlot[], defenders: BattleSlot[], config: SimulationConfig): string;
    parseBattleSourceData(source: string): {
        attackers: BattleSlot[];
        defenders: BattleSlot[];
    };
    calculateLosses(attackers: BattleSlot[], defenders: BattleSlot[], battleResult: BattleResult, repaired: Record<string, number>): {
        attackerLosses: {
            metal: number;
            crystal: number;
            deuterium: number;
            total: number;
        };
        defenderLosses: {
            metal: number;
            crystal: number;
            deuterium: number;
            total: number;
        };
    };
    private mergeFleets;
    private mergeDefenders;
    simulate(request: SimulationRequest): SimulationResult;
    simulateSimple(attackerFleet: Record<string, number>, attackerTech: {
        weaponsTech: number;
        shieldTech: number;
        armorTech: number;
    }, defenderFleet: Record<string, number>, defenderDefense: Record<string, number>, defenderTech: {
        weaponsTech: number;
        shieldTech: number;
        armorTech: number;
    }, config?: Partial<SimulationConfig>): SimulationResult;
    simulateMultiple(request: SimulationRequest, iterations?: number): {
        attackerWinRate: number;
        defenderWinRate: number;
        drawRate: number;
        avgAttackerLosses: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        avgDefenderLosses: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        avgDebris: {
            metal: number;
            crystal: number;
        };
        iterations: number;
    };
}
