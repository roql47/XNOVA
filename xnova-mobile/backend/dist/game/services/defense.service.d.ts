import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetDocument } from '../../planet/schemas/planet.schema';
import { ResourcesService } from './resources.service';
export interface DefenseInfo {
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
    maxCount: number | null;
    requirementsMet: boolean;
    missingRequirements: string[];
}
export declare class DefenseService {
    private userModel;
    private planetModel;
    private resourcesService;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>, resourcesService: ResourcesService);
    isHomePlanet(activePlanetId: string | null, userId: string): boolean;
    checkRequirements(facilities: any, researchLevels: any, defenseType: string): {
        met: boolean;
        missing: string[];
    };
    getSingleBuildTime(defenseType: string, robotFactoryLevel: number, nanoFactoryLevel: number): number;
    getBuildTime(defenseType: string, quantity: number, robotFactoryLevel: number, nanoFactoryLevel: number): number;
    getDefense(userId: string): Promise<{
        defense: DefenseInfo[];
        defenseProgress: any;
        robotFactoryLevel: any;
        isHomePlanet: boolean;
    } | null>;
    startBuild(userId: string, defenseType: string, quantity: number): Promise<{
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
    completeBuild(userId: string): Promise<{
        completed: boolean;
        defense?: string;
        quantity?: number;
        remaining?: number;
    }>;
}
