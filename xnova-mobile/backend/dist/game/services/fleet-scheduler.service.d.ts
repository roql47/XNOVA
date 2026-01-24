import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { BattleService } from './battle.service';
import { ColonyService } from './colony.service';
import { GalaxyService } from '../../galaxy/galaxy.service';
export declare class FleetSchedulerService {
    private userModel;
    private readonly battleService;
    private readonly colonyService;
    private readonly galaxyService;
    private readonly logger;
    private isProcessing;
    constructor(userModel: Model<UserDocument>, battleService: BattleService, colonyService: ColonyService, galaxyService: GalaxyService);
    handleFleetMissions(): Promise<void>;
    private getCompletedMissionIds;
    private hasLegacyCompletedMission;
    private hasCompletedMission;
}
