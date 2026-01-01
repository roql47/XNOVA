import { ResourcesService } from './services/resources.service';
import { BuildingsService } from './services/buildings.service';
import { ResearchService } from './services/research.service';
import { FleetService } from './services/fleet.service';
import { DefenseService } from './services/defense.service';
import { BattleService } from './services/battle.service';
import type { BattleResult } from './services/battle.service';
import { BattleSimulatorService } from './services/battle-simulator.service';
import type { SimulationRequest, SimulationConfig, BattleSlot } from './services/battle-simulator.service';
export declare class GameController {
    private resourcesService;
    private buildingsService;
    private researchService;
    private fleetService;
    private defenseService;
    private battleService;
    private battleSimulatorService;
    constructor(resourcesService: ResourcesService, buildingsService: BuildingsService, researchService: ResearchService, fleetService: FleetService, defenseService: DefenseService, battleService: BattleService, battleSimulatorService: BattleSimulatorService);
    getResources(req: any): Promise<{
        resources: {
            metal: number;
            crystal: number;
            deuterium: number;
            energy: number;
        };
        production: {
            metal: number;
            crystal: number;
            deuterium: number;
            energyProduction: number;
            energyConsumption: number;
        };
        energyRatio: number;
    } | null>;
    getBuildings(req: any): Promise<{
        buildings: import("./services/buildings.service").BuildingInfo[];
        constructionProgress: import("../user/schemas/user.schema").ProgressInfo | null;
        fieldInfo: {
            used: number;
            max: number;
            remaining: number;
            percentage: number;
        };
        planetInfo: {
            temperature: number;
            planetType: string;
            planetName: string;
            diameter: number;
        };
    } | null>;
    upgradeBuilding(req: any, body: {
        buildingType: string;
    }): Promise<{
        message: string;
        building: string;
        currentLevel: any;
        targetLevel: any;
        cost: {
            metal: number;
            crystal: number;
            deuterium?: number;
        };
        constructionTime: number;
        finishTime: Date;
    }>;
    completeBuilding(req: any): Promise<{
        completed: boolean;
        building?: string;
        newLevel?: number;
    }>;
    cancelBuilding(req: any): Promise<{
        message: string;
        refund: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
    }>;
    getResearch(req: any): Promise<{
        research: import("./services/research.service").ResearchInfo[];
        researchProgress: import("../user/schemas/user.schema").ProgressInfo | null;
        labLevel: number;
    } | null>;
    startResearch(req: any, body: {
        researchType: string;
    }): Promise<{
        message: string;
        research: string;
        currentLevel: any;
        targetLevel: any;
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        researchTime: number;
        finishTime: Date;
    }>;
    completeResearch(req: any): Promise<{
        completed: boolean;
        research?: string;
        newLevel?: number;
    }>;
    cancelResearch(req: any): Promise<{
        message: string;
        refund: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
    }>;
    getFleet(req: any): Promise<{
        fleet: import("./services/fleet.service").FleetInfo[];
        fleetProgress: import("../user/schemas/user.schema").ProgressInfo | null;
        shipyardLevel: number;
    } | null>;
    buildFleet(req: any, body: {
        fleetType: string;
        quantity: number;
    }): Promise<{
        message: string;
        fleet: string;
        quantity: number;
        totalCost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        buildTime: number;
        finishTime: Date;
    }>;
    completeFleet(req: any): Promise<{
        completed: boolean;
        fleet?: string;
        quantity?: number;
    }>;
    getDefense(req: any): Promise<{
        defense: import("./services/defense.service").DefenseInfo[];
        defenseProgress: import("../user/schemas/user.schema").ProgressInfo | null;
        robotFactoryLevel: number;
    } | null>;
    buildDefense(req: any, body: {
        defenseType: string;
        quantity: number;
    }): Promise<{
        message: string;
        defense: string;
        quantity: number;
        totalCost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        buildTime: number;
        finishTime: Date;
    }>;
    completeDefense(req: any): Promise<{
        completed: boolean;
        defense?: string;
        quantity?: number;
    }>;
    attack(req: any, body: {
        targetCoord: string;
        fleet: Record<string, number>;
    }): Promise<{
        message: string;
        fleet: Record<string, number>;
        capacity: number;
        fuelConsumption: number;
        travelTime: number;
        arrivalTime: Date;
        distance: number;
    }>;
    recycle(req: any, body: {
        targetCoord: string;
        fleet: Record<string, number>;
    }): Promise<{
        message: string;
        travelTime: number;
        arrivalTime: Date;
    }>;
    getAttackStatus(req: any): Promise<any>;
    processBattle(req: any): Promise<{
        attackProcessed: boolean;
        attackResult: {
            battleResult: BattleResult;
            attacker: any;
            defender: any;
        } | null;
        recycleProcessed: boolean;
        recycleResult: {
            metalLoot: number;
            crystalLoot: number;
        } | null;
        incomingProcessed: boolean;
        incomingResults: any[];
        returnProcessed: boolean;
        returnResult: {
            returnedFleet: Record<string, number>;
            loot: Record<string, number>;
        } | null;
    }>;
    simulate(body: SimulationRequest): Promise<import("./services/battle-simulator.service").SimulationResult>;
    simulateSimple(body: {
        attackerFleet: Record<string, number>;
        attackerTech: {
            weaponsTech: number;
            shieldTech: number;
            armorTech: number;
        };
        defenderFleet: Record<string, number>;
        defenderDefense: Record<string, number>;
        defenderTech: {
            weaponsTech: number;
            shieldTech: number;
            armorTech: number;
        };
        config?: Partial<SimulationConfig>;
    }): Promise<import("./services/battle-simulator.service").SimulationResult>;
    simulateMultiple(body: {
        request: SimulationRequest;
        iterations?: number;
    }): Promise<{
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
    }>;
    parseSourceData(body: {
        sourceData: string;
    }): Promise<{
        attackers: BattleSlot[];
        defenders: BattleSlot[];
    }>;
    generateSourceData(body: {
        attackers: BattleSlot[];
        defenders: BattleSlot[];
        config?: Partial<SimulationConfig>;
    }): Promise<{
        sourceData: string;
    }>;
}
