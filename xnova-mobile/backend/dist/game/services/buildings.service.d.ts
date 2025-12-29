import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
export interface BuildingInfo {
    type: string;
    name: string;
    level: number;
    category: string;
    upgradeCost: {
        metal: number;
        crystal: number;
        deuterium?: number;
    } | null;
    upgradeTime: number;
}
export declare class BuildingsService {
    private userModel;
    private resourcesService;
    constructor(userModel: Model<UserDocument>, resourcesService: ResourcesService);
    getUpgradeCost(buildingType: string, currentLevel: number): {
        metal: number;
        crystal: number;
        deuterium?: number;
    } | null;
    getConstructionTime(buildingType: string, currentLevel: number, robotFactoryLevel: number, nanoFactoryLevel?: number): number;
    getBuildings(userId: string): Promise<{
        buildings: BuildingInfo[];
        constructionProgress: import("../../user/schemas/user.schema").ProgressInfo | null;
    } | null>;
    startUpgrade(userId: string, buildingType: string): Promise<{
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
    completeConstruction(userId: string): Promise<{
        completed: boolean;
        building?: string;
        newLevel?: number;
    }>;
    cancelConstruction(userId: string): Promise<{
        message: string;
        refund: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
    }>;
}
