import { Model } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';
import { PlanetDocument } from '../../planet/schemas/planet.schema';
import { FleetService } from './fleet.service';
import { DefenseService } from './defense.service';
import { ResearchService } from './research.service';
import { BuildingsService } from './buildings.service';
export declare class BuildSchedulerService {
    private userModel;
    private planetModel;
    private readonly fleetService;
    private readonly defenseService;
    private readonly researchService;
    private readonly buildingsService;
    private readonly logger;
    private isProcessing;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>, fleetService: FleetService, defenseService: DefenseService, researchService: ResearchService, buildingsService: BuildingsService);
    handleBuildProgress(): Promise<void>;
    private completePlanetFleetBuild;
    private completePlanetDefenseBuild;
    private completePlanetConstruction;
}
