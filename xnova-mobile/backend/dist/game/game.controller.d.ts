import { ResourcesService } from './services/resources.service';
import { BuildingsService } from './services/buildings.service';
import { ResearchService } from './services/research.service';
import { FleetService } from './services/fleet.service';
import { DefenseService } from './services/defense.service';
import { BattleService } from './services/battle.service';
import type { BattleResult } from './services/battle.service';
import { BattleSimulatorService } from './services/battle-simulator.service';
import type { SimulationRequest, SimulationConfig, BattleSlot } from './services/battle-simulator.service';
import { ColonyService } from './services/colony.service';
import { GalaxyService } from '../galaxy/galaxy.service';
import { CheckInService } from './services/check-in.service';
export declare class GameController {
    private resourcesService;
    private buildingsService;
    private researchService;
    private fleetService;
    private defenseService;
    private battleService;
    private battleSimulatorService;
    private colonyService;
    private galaxyService;
    private checkInService;
    constructor(resourcesService: ResourcesService, buildingsService: BuildingsService, researchService: ResearchService, fleetService: FleetService, defenseService: DefenseService, battleService: BattleService, battleSimulatorService: BattleSimulatorService, colonyService: ColonyService, galaxyService: GalaxyService, checkInService: CheckInService);
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
        activePlanetId: string | null;
        isHomePlanet: boolean;
    } | null>;
    getDetailedResources(req: any): Promise<any>;
    setOperationRates(req: any, body: {
        metalMine?: number;
        crystalMine?: number;
        deuteriumMine?: number;
        solarPlant?: number;
        fusionReactor?: number;
        solarSatellite?: number;
    }): Promise<any>;
    getBuildings(req: any): Promise<{
        buildings: import("./services/buildings.service").BuildingInfo[];
        constructionProgress: any;
        fieldInfo: {
            used: any;
            max: any;
            remaining: any;
            percentage: any;
        };
        planetInfo: any;
        isHomePlanet: boolean;
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
    downgradeBuilding(req: any, body: {
        buildingType: string;
    }): Promise<{
        message: string;
        building: string;
        currentLevel: any;
        targetLevel: number;
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        constructionTime: number;
        finishTime: Date;
    }>;
    completeBuilding(req: any): Promise<{
        completed: boolean;
        building?: string;
        newLevel?: number;
        isDowngrade?: boolean;
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
        fleetProgress: any;
        shipyardLevel: any;
        isHomePlanet: boolean;
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
        totalBuildTime: number;
        finishTime: Date;
    }>;
    completeFleet(req: any): Promise<{
        completed: boolean;
        fleet?: string;
        quantity?: number;
        remaining?: number;
    }>;
    getDefense(req: any): Promise<{
        defense: import("./services/defense.service").DefenseInfo[];
        defenseProgress: any;
        robotFactoryLevel: any;
        isHomePlanet: boolean;
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
        totalBuildTime: number;
        finishTime: Date;
    }>;
    completeDefense(req: any): Promise<{
        completed: boolean;
        defense?: string;
        quantity?: number;
        remaining?: number;
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
        missionId: string;
        fleetSlots: {
            used: number;
            max: number;
        };
    }>;
    recycle(req: any, body: {
        targetCoord: string;
        fleet: Record<string, number>;
    }): Promise<{
        message: string;
        travelTime: number;
        arrivalTime: Date;
        missionId: string;
        fleetSlots: {
            used: number;
            max: number;
        };
    }>;
    transport(req: any, body: {
        targetCoord: string;
        fleet: Record<string, number>;
        resources: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
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
    deploy(req: any, body: {
        targetCoord: string;
        fleet: Record<string, number>;
        resources: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
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
    recallFleet(req: any, body?: {
        missionId?: string;
    }): Promise<{
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
        transportProcessed: boolean;
        transportResult: any;
        deployProcessed: boolean;
        deployResult: any;
        colonyProcessed: boolean;
        colonyResult: any;
        spyProcessed: boolean;
        spyResult: any;
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
    startColonization(req: any, body: {
        targetCoord: string;
        fleet: Record<string, number>;
    }): Promise<{
        success: boolean;
        message: string;
        arrivalTime?: Date;
    }>;
    completeColonization(req: any): Promise<{
        success: boolean;
        colonized: boolean;
        message: string;
        planetId?: string;
        planetName?: string;
    }>;
    recallColonization(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    completeReturn(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getCheckInStatus(req: any): Promise<import("./services/check-in.service").CheckInStatusResponse>;
    checkIn(req: any): Promise<import("./services/check-in.service").CheckInResult>;
}
