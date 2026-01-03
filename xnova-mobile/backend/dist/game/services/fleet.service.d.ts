import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetDocument } from '../../planet/schemas/planet.schema';
import { ResourcesService } from './resources.service';
export interface FleetInfo {
    type: string;
    name: string;
    count: number;
    cost: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    stats: any;
    buildTime: number;
    requirementsMet: boolean;
    missingRequirements: string[];
}
export declare class FleetService {
    private userModel;
    private planetModel;
    private resourcesService;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>, resourcesService: ResourcesService);
    isHomePlanet(activePlanetId: string | null, userId: string): boolean;
    checkRequirements(facilities: any, researchLevels: any, fleetType: string): {
        met: boolean;
        missing: string[];
    };
    getSingleBuildTime(fleetType: string, shipyardLevel: number, nanoFactoryLevel: number): number;
    getBuildTime(fleetType: string, quantity: number, shipyardLevel: number, nanoFactoryLevel: number): number;
    getFleet(userId: string): Promise<{
        fleet: FleetInfo[];
        fleetProgress: any;
        shipyardLevel: any;
        isHomePlanet: boolean;
    } | null>;
    startBuild(userId: string, fleetType: string, quantity: number): Promise<{
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
    completeBuild(userId: string): Promise<{
        completed: boolean;
        fleet?: string;
        quantity?: number;
        remaining?: number;
    }>;
    calculateTotalCapacity(fleet: Record<string, number>): number;
    calculateFuelConsumption(fleet: Record<string, number>, distance: number, duration: number): number;
    getFleetSpeed(fleet: Record<string, number>): number;
}
