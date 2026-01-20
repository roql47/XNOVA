import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Planet, PlanetDocument } from '../../planet/schemas/planet.schema';
import { FleetService } from './fleet.service';
import { DefenseService } from './defense.service';
import { ResearchService } from './research.service';
import { BuildingsService } from './buildings.service';

@Injectable()
export class BuildSchedulerService {
  private readonly logger = new Logger(BuildSchedulerService.name);
  private isProcessing = false;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
    private readonly fleetService: FleetService,
    private readonly defenseService: DefenseService,
    private readonly researchService: ResearchService,
    private readonly buildingsService: BuildingsService,
  ) {}

  /**
   * 30초마다 모든 유저의 건조/연구/건설 완료 자동 처리
   * - 접속하지 않은 유저도 완료 시간이 지나면 자동으로 처리됨
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleBuildProgress() {
    // 이미 처리 중이면 스킵
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const now = Date.now();

    try {
      // 진행 중인 건조/연구/건설이 있는 유저들 찾기
      const usersWithProgress = await this.userModel.find({
        $or: [
          { fleetProgress: { $ne: null } },
          { defenseProgress: { $ne: null } },
          { researchProgress: { $ne: null } },
          { constructionProgress: { $ne: null } },
        ]
      }).select('_id fleetProgress defenseProgress researchProgress constructionProgress activePlanetId').exec();

      let processedCount = 0;

      for (const user of usersWithProgress) {
        try {
          let processed = false;

          // 함대 건조 완료 처리 (1대씩 반복 처리)
          if (user.fleetProgress) {
            const finishTime = new Date(user.fleetProgress.finishTime).getTime();
            if (finishTime <= now) {
              // 완료된 건조를 모두 처리 (큐 시스템)
              let result = await this.fleetService.completeBuild(user._id.toString());
              while (result.completed) {
                this.logger.debug(`Fleet build completed for user ${user._id}: ${result.fleet}`);
                // 다음 건조가 즉시 완료되는지 확인
                const updatedUser = await this.userModel.findById(user._id).select('fleetProgress').exec();
                if (!updatedUser?.fleetProgress) break;
                if (new Date(updatedUser.fleetProgress.finishTime).getTime() > now) break;
                result = await this.fleetService.completeBuild(user._id.toString());
              }
              processed = true;
            }
          }

          // 방어시설 건조 완료 처리 (1대씩 반복 처리)
          if (user.defenseProgress) {
            const finishTime = new Date(user.defenseProgress.finishTime).getTime();
            if (finishTime <= now) {
              let result = await this.defenseService.completeBuild(user._id.toString());
              while (result.completed) {
                this.logger.debug(`Defense build completed for user ${user._id}: ${result.defense}`);
                const updatedUser = await this.userModel.findById(user._id).select('defenseProgress').exec();
                if (!updatedUser?.defenseProgress) break;
                if (new Date(updatedUser.defenseProgress.finishTime).getTime() > now) break;
                result = await this.defenseService.completeBuild(user._id.toString());
              }
              processed = true;
            }
          }

          // 연구 완료 처리
          if (user.researchProgress) {
            const finishTime = new Date(user.researchProgress.finishTime).getTime();
            if (finishTime <= now) {
              const result = await this.researchService.completeResearch(user._id.toString());
              if (result.completed) {
                this.logger.debug(`Research completed for user ${user._id}: ${result.research}`);
              }
              processed = true;
            }
          }

          // 시설 건설 완료 처리
          if (user.constructionProgress) {
            const finishTime = new Date(user.constructionProgress.finishTime).getTime();
            if (finishTime <= now) {
              const result = await this.buildingsService.completeConstruction(user._id.toString());
              if (result.completed) {
                this.logger.debug(`Construction completed for user ${user._id}: ${result.building}`);
              }
              processed = true;
            }
          }

          if (processed) {
            processedCount++;
          }
        } catch (e) {
          this.logger.warn(`Failed to process build for user ${user._id}: ${e.message}`);
        }
      }

      // 식민지의 건조/건설 완료 처리
      const planetsWithProgress = await this.planetModel.find({
        $or: [
          { fleetProgress: { $ne: null } },
          { defenseProgress: { $ne: null } },
          { constructionProgress: { $ne: null } },
        ]
      }).select('_id ownerId fleetProgress defenseProgress constructionProgress').exec();

      for (const planet of planetsWithProgress) {
        try {
          // 식민지 함대 건조 완료
          if (planet.fleetProgress) {
            const finishTime = new Date(planet.fleetProgress.finishTime).getTime();
            if (finishTime <= now) {
              await this.completePlanetFleetBuild(planet, now);
              processedCount++;
            }
          }

          // 식민지 방어시설 건조 완료
          if (planet.defenseProgress) {
            const finishTime = new Date(planet.defenseProgress.finishTime).getTime();
            if (finishTime <= now) {
              await this.completePlanetDefenseBuild(planet, now);
              processedCount++;
            }
          }

          // 식민지 시설 건설 완료
          if (planet.constructionProgress) {
            const finishTime = new Date(planet.constructionProgress.finishTime).getTime();
            if (finishTime <= now) {
              await this.completePlanetConstruction(planet);
              processedCount++;
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to process build for planet ${planet._id}: ${e.message}`);
        }
      }

      if (processedCount > 0) {
        this.logger.log(`Processed ${processedCount} build completions`);
      }
    } catch (e) {
      this.logger.error(`Build scheduler error: ${e.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 식민지 함대 건조 완료 처리
   */
  private async completePlanetFleetBuild(planet: PlanetDocument, now: number): Promise<void> {
    if (!planet.fleetProgress) return;

    const fleetType = planet.fleetProgress.name;
    const remainingQuantity = (planet.fleetProgress as any).quantity || 1;

    // 함대 추가
    if (!planet.fleet) planet.fleet = {} as any;
    (planet.fleet as any)[fleetType] = ((planet.fleet as any)[fleetType] || 0) + 1;
    planet.markModified('fleet');

    const newRemaining = remainingQuantity - 1;

    if (newRemaining > 0) {
      // 다음 건조 설정
      const shipyardLevel = planet.facilities?.shipyard || 0;
      const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
      const singleBuildTime = this.fleetService.getSingleBuildTime(fleetType, shipyardLevel, nanoFactoryLevel);

      planet.fleetProgress = {
        type: 'fleet',
        name: fleetType,
        quantity: newRemaining,
        startTime: new Date(),
        finishTime: new Date(Date.now() + singleBuildTime * 1000),
      } as any;

      // 다음 건조도 완료됐으면 재귀 처리
      if (planet.fleetProgress && new Date(planet.fleetProgress.finishTime).getTime() <= now) {
        planet.markModified('fleetProgress');
        await planet.save();
        await this.completePlanetFleetBuild(planet, now);
        return;
      }
    } else {
      planet.fleetProgress = null;
    }

    planet.markModified('fleetProgress');
    await planet.save();
    this.logger.debug(`Planet fleet build completed: ${planet._id} - ${fleetType}`);
  }

  /**
   * 식민지 방어시설 건조 완료 처리
   */
  private async completePlanetDefenseBuild(planet: PlanetDocument, now: number): Promise<void> {
    if (!planet.defenseProgress) return;

    const defenseType = planet.defenseProgress.name;
    const remainingQuantity = (planet.defenseProgress as any).quantity || 1;

    // 방어시설 추가
    if (!planet.defense) planet.defense = {} as any;
    (planet.defense as any)[defenseType] = ((planet.defense as any)[defenseType] || 0) + 1;
    planet.markModified('defense');

    const newRemaining = remainingQuantity - 1;

    if (newRemaining > 0) {
      // 다음 건조 설정
      const robotFactoryLevel = planet.facilities?.robotFactory || 0;
      const nanoFactoryLevel = planet.facilities?.nanoFactory || 0;
      const singleBuildTime = this.defenseService.getSingleBuildTime(defenseType, robotFactoryLevel, nanoFactoryLevel);

      planet.defenseProgress = {
        type: 'defense',
        name: defenseType,
        quantity: newRemaining,
        startTime: new Date(),
        finishTime: new Date(Date.now() + singleBuildTime * 1000),
      } as any;

      // 다음 건조도 완료됐으면 재귀 처리
      if (planet.defenseProgress && new Date(planet.defenseProgress.finishTime).getTime() <= now) {
        planet.markModified('defenseProgress');
        await planet.save();
        await this.completePlanetDefenseBuild(planet, now);
        return;
      }
    } else {
      planet.defenseProgress = null;
    }

    planet.markModified('defenseProgress');
    await planet.save();
    this.logger.debug(`Planet defense build completed: ${planet._id} - ${defenseType}`);
  }

  /**
   * 식민지 시설 건설 완료 처리
   */
  private async completePlanetConstruction(planet: PlanetDocument): Promise<void> {
    if (!planet.constructionProgress) return;

    const buildingType = planet.constructionProgress.name;
    const isDowngrade = (planet.constructionProgress as any).isDowngrade || false;

    if (!planet.facilities) planet.facilities = {} as any;

    if (isDowngrade) {
      (planet.facilities as any)[buildingType] = Math.max(0, ((planet.facilities as any)[buildingType] || 0) - 1);
    } else {
      (planet.facilities as any)[buildingType] = ((planet.facilities as any)[buildingType] || 0) + 1;
    }

    planet.constructionProgress = null;
    planet.markModified('facilities');
    planet.markModified('constructionProgress');
    await planet.save();
    this.logger.debug(`Planet construction completed: ${planet._id} - ${buildingType}`);
  }
}
