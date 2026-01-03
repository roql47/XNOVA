import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetService } from '../../planet/planet.service';
import { MessageService } from '../../message/message.service';
export interface ColonyProgress {
    targetCoord: string;
    fleet: Record<string, number>;
    travelTime: number;
    startTime: Date;
    arrivalTime: Date;
}
export declare class ColonyService {
    private userModel;
    private planetService;
    private messageService;
    constructor(userModel: Model<UserDocument>, planetService: PlanetService, messageService: MessageService);
    private calculateDistance;
    private calculateTravelTime;
    private getFleetMinSpeed;
    private calculateFuelConsumption;
    startColonization(userId: string, targetCoord: string, fleet: Record<string, number>): Promise<{
        success: boolean;
        message: string;
        arrivalTime?: Date;
    }>;
    completeColonization(userId: string): Promise<{
        success: boolean;
        colonized: boolean;
        message: string;
        planetId?: string;
        planetName?: string;
    }>;
    completeReturn(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private calculateCargoCapacity;
    recallColonization(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
