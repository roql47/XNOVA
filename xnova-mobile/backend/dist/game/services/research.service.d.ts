import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
export interface ResearchInfo {
    type: string;
    name: string;
    level: number;
    cost: {
        metal: number;
        crystal: number;
        deuterium: number;
    } | null;
    researchTime: number;
    requirementsMet: boolean;
    missingRequirements: string[];
}
export declare class ResearchService {
    private userModel;
    private resourcesService;
    constructor(userModel: Model<UserDocument>, resourcesService: ResourcesService);
    getResearchCost(researchType: string, currentLevel: number): {
        metal: number;
        crystal: number;
        deuterium: number;
    } | null;
    getResearchTime(metal: number, crystal: number, labLevel: number): number;
    checkRequirements(user: UserDocument, researchType: string): {
        met: boolean;
        missing: string[];
    };
    getResearch(userId: string): Promise<{
        research: ResearchInfo[];
        researchProgress: import("../../user/schemas/user.schema").ProgressInfo | null;
        labLevel: number;
    } | null>;
    startResearch(userId: string, researchType: string): Promise<{
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
    completeResearch(userId: string): Promise<{
        completed: boolean;
        research?: string;
        newLevel?: number;
    }>;
    cancelResearch(userId: string): Promise<{
        message: string;
        refund: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
    }>;
}
