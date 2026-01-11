import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetDocument } from '../../planet/schemas/planet.schema';
export declare class ResourcesService {
    private userModel;
    private planetModel;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>);
    isHomePlanet(activePlanetId: string | null, userId: string): boolean;
    getSatelliteEnergy(satelliteCount: number, temperature: number): number;
    getResourceProduction(level: number, type: 'metal' | 'crystal' | 'deuterium'): number;
    getEnergyProduction(solarPlantLevel: number): number;
    getFusionEnergyProduction(fusionLevel: number): number;
    getEnergyConsumption(level: number, type: 'metal' | 'crystal' | 'deuterium'): number;
    getFusionDeuteriumConsumption(fusionLevel: number): number;
    updateResources(userId: string): Promise<UserDocument | null>;
    updateResourcesWithPlanet(userId: string): Promise<{
        user: UserDocument;
        planet?: PlanetDocument;
    } | null>;
    private updateHomePlanetResources;
    private updateColonyResources;
    getResources(userId: string): Promise<{
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
    deductResources(userId: string, cost: {
        metal?: number;
        crystal?: number;
        deuterium?: number;
    }): Promise<boolean>;
    addResources(userId: string, resources: {
        metal?: number;
        crystal?: number;
        deuterium?: number;
    }): Promise<boolean>;
    addResourcesToHomePlanet(userId: string, resources: {
        metal?: number;
        crystal?: number;
        deuterium?: number;
    }): Promise<boolean>;
    setOperationRates(userId: string, rates: {
        metalMine?: number;
        crystalMine?: number;
        deuteriumMine?: number;
        solarPlant?: number;
        fusionReactor?: number;
        solarSatellite?: number;
    }): Promise<any>;
    getDetailedResources(userId: string): Promise<any>;
}
