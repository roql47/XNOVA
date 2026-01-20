import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { BattleService } from './battle.service';
import { ColonyService } from './colony.service';
export declare class FleetSchedulerService {
    private userModel;
    private readonly battleService;
    private readonly colonyService;
    private readonly logger;
    private isProcessing;
    constructor(userModel: Model<UserDocument>, battleService: BattleService, colonyService: ColonyService);
    handleFleetMissions(): Promise<void>;
    private getCompletedMissionIds;
    private hasLegacyCompletedMission;
    private hasCompletedMission;
}
