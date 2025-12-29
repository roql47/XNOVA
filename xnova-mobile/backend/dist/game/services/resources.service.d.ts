import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
export declare class ResourcesService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    getResourceProduction(level: number, type: 'metal' | 'crystal' | 'deuterium'): number;
    getEnergyProduction(solarPlantLevel: number): number;
    getFusionEnergyProduction(fusionLevel: number): number;
    getEnergyConsumption(level: number, type: 'metal' | 'crystal' | 'deuterium'): number;
    getFusionDeuteriumConsumption(fusionLevel: number): number;
    updateResources(userId: string): Promise<UserDocument | null>;
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
}
