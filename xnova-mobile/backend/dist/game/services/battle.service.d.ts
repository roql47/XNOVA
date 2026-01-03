import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
import { FleetService } from './fleet.service';
import { MessageService } from '../../message/message.service';
import { GalaxyService } from '../../galaxy/galaxy.service';
import { BattleReportService, OGameRoundInfo, BattleParticipant } from './battle-report.service';
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
    attackerLosses: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    defenderLosses: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    debris: {
        metal: number;
        crystal: number;
    };
    loot: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    moonChance: number;
    moonCreated: boolean;
    battleSeed?: number;
    battleTime?: Date;
    before?: {
        attackers: BattleParticipant[];
        defenders: BattleParticipant[];
    };
}
export declare class BattleService {
    private userModel;
    private resourcesService;
    private fleetService;
    private messageService;
    private galaxyService;
    private battleReportService;
    constructor(userModel: Model<UserDocument>, resourcesService: ResourcesService, fleetService: FleetService, messageService: MessageService, galaxyService: GalaxyService, battleReportService: BattleReportService);
    private calculateAttackPower;
    private calculateMaxShield;
    private calculateHull;
    private performAttack;
    private checkExploded;
    private checkRapidFire;
    private checkFastDraw;
    simulateBattle(attackerFleet: Record<string, number>, defenderFleet: Record<string, number>, defenderDefense: Record<string, number>, attackerResearch?: Record<string, number>, defenderResearch?: Record<string, number>): BattleResult;
    private createParticipantSnapshot;
    private countRemainingUnits;
    calculateDistance(coordA: string, coordB: string): number;
    calculateLoot(resources: {
        metal: number;
        crystal: number;
        deuterium: number;
    }, battleResult: BattleResult, capacity: number): {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    startAttack(attackerId: string, targetCoord: string, fleet: Record<string, number>): Promise<{
        message: string;
        fleet: Record<string, number>;
        capacity: number;
        fuelConsumption: number;
        travelTime: number;
        arrivalTime: Date;
        distance: number;
    }>;
    getAttackStatus(userId: string): Promise<any>;
    startRecycle(attackerId: string, targetCoord: string, fleet: Record<string, number>): Promise<{
        message: string;
        travelTime: number;
        arrivalTime: Date;
    }>;
    processRecycleArrival(userId: string): Promise<{
        metalLoot: number;
        crystalLoot: number;
    } | null>;
    processAttackArrival(attackerId: string): Promise<{
        battleResult: BattleResult;
        attacker: any;
        defender: any;
    } | null>;
    processIncomingAttacks(userId: string): Promise<Array<{
        battleResult: BattleResult;
        attacker: any;
        defender: any;
    }>>;
    recallFleet(userId: string): Promise<{
        message: string;
        fleet: {
            [x: string]: number;
        };
        returnTime: number;
    }>;
    processFleetReturn(userId: string): Promise<{
        returnedFleet: Record<string, number>;
        loot: Record<string, number>;
    } | null>;
}
