import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { ResourcesService } from './services/resources.service';
import { BuildingsService } from './services/buildings.service';
import { ResearchService } from './services/research.service';
import { FleetService } from './services/fleet.service';
import { DefenseService } from './services/defense.service';
import { BattleService } from './services/battle.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [GameController],
  providers: [
    ResourcesService,
    BuildingsService,
    ResearchService,
    FleetService,
    DefenseService,
    BattleService,
  ],
  exports: [
    ResourcesService,
    BuildingsService,
    ResearchService,
    FleetService,
    DefenseService,
    BattleService,
  ],
})
export class GameModule {}

