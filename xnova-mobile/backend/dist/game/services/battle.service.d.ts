import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetDocument } from '../../planet/schemas/planet.schema';
import { ResourcesService } from './resources.service';
import { FleetService } from './fleet.service';
import { RankingService } from './ranking.service';
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
    private planetModel;
    private resourcesService;
    private fleetService;
    private rankingService;
    private messageService;
    private galaxyService;
    private battleReportService;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>, resourcesService: ResourcesService, fleetService: FleetService, rankingService: RankingService, messageService: MessageService, galaxyService: GalaxyService, battleReportService: BattleReportService);
    private findPlanetByCoordinate;
    private isHomePlanet;
    private getMaxFleetSlots;
    private getActiveFleetCount;
    private generateMissionId;
    private hasAvailableFleetSlot;
    private findMission;
    private setMissionReturning;
    private removeMission;
    private syncLegacyFields;
    private getActivePlanetData;
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
        missionId: string;
        fleetSlots: {
            used: number;
            max: number;
        };
    }>;
    getAttackStatus(userId: string): Promise<any>;
    startRecycle(attackerId: string, targetCoord: string, fleet: Record<string, number>): Promise<{
        message: string;
        travelTime: number;
        arrivalTime: Date;
        missionId: string;
        fleetSlots: {
            used: number;
            max: number;
        };
    }>;
    processRecycleArrival(userId: string, missionId?: string): Promise<{
        metalLoot: number;
        crystalLoot: number;
        missionId: any;
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
    recallFleet(userId: string, missionId?: string): Promise<{
        message: string;
        fleet: {
            [x: string]: number;
        };
        returnTime: number;
        missionId?: undefined;
    } | {
        message: string;
        fleet: any;
        returnTime: number;
        missionId: any;
    }>;
    processFleetReturn(userId: string, missionId?: string): Promise<{
        returnedFleet: any;
        loot: any;
        missionId: any;
    } | null>;
    startTransport(userId: string, targetCoord: string, fleet: Record<string, number>, resources: {
        metal: number;
        crystal: number;
        deuterium: number;
    }): Promise<{
        message: string;
        travelTime: number;
        arrivalTime: Date;
        fuelConsumption: number;
        resources: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        missionId: string;
        fleetSlots: {
            used: number;
            max: number;
        };
    }>;
    processTransportArrival(userId: string, missionId?: string): Promise<{
        delivered: any;
        missionId: any;
    } | null>;
    startDeploy(userId: string, targetCoord: string, fleet: Record<string, number>, resources: {
        metal: number;
        crystal: number;
        deuterium: number;
    }): Promise<{
        message: string;
        travelTime: number;
        arrivalTime: Date;
        fuelConsumption: number;
        resources: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        missionId: string;
        fleetSlots: {
            used: number;
            max: number;
        };
    }>;
    processDeployArrival(userId: string, missionId?: string): Promise<{
        fleet: any;
        resources: any;
        missionId: any;
    } | null>;
    calculateAvailableCapacity(fleet: Record<string, number>, distance: number): {
        totalCapacity: number;
        fuelConsumption: number;
        availableCapacity: number;
    };
}
