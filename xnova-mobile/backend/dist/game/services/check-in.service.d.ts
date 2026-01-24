import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';
export interface CheckInStatusResponse {
    streak: number;
    canCheckIn: boolean;
    weekDays: boolean[];
    rewardHours: number;
    nextReward: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    todayCheckedIn: boolean;
}
export interface CheckInResult {
    success: boolean;
    streak: number;
    rewardHours: number;
    reward: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    message: string;
}
export declare class CheckInService {
    private userModel;
    private readonly resourcesService;
    constructor(userModel: Model<UserDocument>, resourcesService: ResourcesService);
    private getTodayDateKST;
    private getYesterdayDateKST;
    private getWeekStartDateKST;
    private getDaysDifference;
    private getRewardHours;
    private calculateHourlyProduction;
    private calculateWeekDays;
    getCheckInStatus(userId: string): Promise<CheckInStatusResponse>;
    checkIn(userId: string): Promise<CheckInResult>;
}
