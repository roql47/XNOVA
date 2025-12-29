import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
import { FleetService } from './fleet.service';
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
}
export declare class BattleService {
    private userModel;
    private resourcesService;
    private fleetService;
    constructor(userModel: Model<UserDocument>, resourcesService: ResourcesService, fleetService: FleetService);
    private performAttack;
    private checkExploded;
    private checkRapidFire;
    simulateBattle(attackerFleet: Record<string, number>, defenderFleet: Record<string, number>, defenderDefense: Record<string, number>, attackerResearch?: Record<string, number>, defenderResearch?: Record<string, number>): BattleResult;
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
    processAttackArrival(attackerId: string): Promise<{
        battleResult: BattleResult;
        attacker: any;
        defender: any;
    } | null>;
    processFleetReturn(userId: string): Promise<{
        returnedFleet: Record<string, number>;
        loot: Record<string, number>;
    } | null>;
}
