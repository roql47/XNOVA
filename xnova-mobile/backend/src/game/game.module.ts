import { Module, forwardRef } from '@nestjs/common';
import { GameController } from './game.controller';
import { RankingController } from './ranking.controller';
import { ResourcesService } from './services/resources.service';
import { BuildingsService } from './services/buildings.service';
import { ResearchService } from './services/research.service';
import { FleetService } from './services/fleet.service';
import { DefenseService } from './services/defense.service';
import { BattleService } from './services/battle.service';
import { BattleReportService } from './services/battle-report.service';
import { BattleSimulatorService } from './services/battle-simulator.service';
import { RankingService } from './services/ranking.service';
import { ColonyService } from './services/colony.service';
import { FleetSchedulerService } from './services/fleet-scheduler.service';
import { BuildSchedulerService } from './services/build-scheduler.service';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { GalaxyModule } from '../galaxy/galaxy.module';
import { PlanetModule } from '../planet/planet.module';

@Module({
  imports: [UserModule, MessageModule, GalaxyModule, forwardRef(() => PlanetModule)],
  controllers: [GameController, RankingController],
  providers: [
    ResourcesService,
    BuildingsService,
    ResearchService,
    FleetService,
    DefenseService,
    BattleService,
    BattleReportService,
    BattleSimulatorService,
    RankingService,
    ColonyService,
    FleetSchedulerService,
    BuildSchedulerService,
  ],
  exports: [
    ResourcesService,
    BuildingsService,
    ResearchService,
    FleetService,
    DefenseService,
    BattleService,
    BattleReportService,
    BattleSimulatorService,
    RankingService,
    ColonyService,
    FleetSchedulerService,
    BuildSchedulerService,
  ],
})
export class GameModule {}

