import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetDocument } from '../../planet/schemas/planet.schema';
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
    production?: number;
    consumption?: number;
    nextProduction?: number;
    nextConsumption?: number;
}
export declare class BuildingsService {
    private userModel;
    private planetModel;
    private resourcesService;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>, resourcesService: ResourcesService);
    isHomePlanet(activePlanetId: string | null, userId: string): boolean;
    extractPlanetPosition(coordinate: string): number;
    generatePlanetFields(position: number, isHomeWorld?: boolean): {
        maxFields: number;
        temperature: number;
        planetType: string;
    };
    calculateUsedFields(user: UserDocument): number;
    getTerraformerBonus(terraformerLevel: number): number;
    getMaxFields(user: UserDocument): number;
    isFieldsFull(user: UserDocument): boolean;
    getFieldInfo(user: UserDocument): {
        used: number;
        max: number;
        remaining: number;
        percentage: number;
    };
    getUpgradeCost(buildingType: string, currentLevel: number): {
        metal: number;
        crystal: number;
        deuterium?: number;
    } | null;
    getConstructionTime(buildingType: string, currentLevel: number, robotFactoryLevel: number, nanoFactoryLevel?: number): number;
    calculateColonyUsedFields(planet: PlanetDocument): number;
    getColonyMaxFields(planet: PlanetDocument): number;
    getColonyFieldInfo(planet: PlanetDocument): {
        used: number;
        max: number;
        remaining: number;
        percentage: number;
    };
    getBuildings(userId: string): Promise<{
        buildings: BuildingInfo[];
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
    startDowngrade(userId: string, buildingType: string): Promise<{
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
    completeConstructionWithDowngrade(userId: string): Promise<{
        completed: boolean;
        building?: string;
        newLevel?: number;
        isDowngrade?: boolean;
    }>;
}
