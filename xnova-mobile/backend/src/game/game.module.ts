import { Module } from '@nestjs/common';
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
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { GalaxyModule } from '../galaxy/galaxy.module';

@Module({
  imports: [UserModule, MessageModule, GalaxyModule],
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
  ],
})
export class GameModule {}

