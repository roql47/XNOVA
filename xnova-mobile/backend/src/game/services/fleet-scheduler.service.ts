import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { BattleService } from './battle.service';
import { ColonyService } from './colony.service';

@Injectable()
export class FleetSchedulerService {
  private readonly logger = new Logger(FleetSchedulerService.name);
  private isProcessing = false;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly battleService: BattleService,
    private readonly colonyService: ColonyService,
  ) {}

  /**
   * 30초마다 모든 유저의 함대 미션을 자동 처리
   * - 접속하지 않은 유저도 미션이 완료되면 자동으로 처리됨
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleFleetMissions() {
    // 이미 처리 중이면 스킵
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const now = Date.now();

    try {
      // 활성 함대 미션이 있는 유저들 찾기
      const usersWithMissions = await this.userModel.find({
        $or: [
          // fleetMissions 배열에 미션이 있는 유저
          { 'fleetMissions.0': { $exists: true } },
          // 레거시: pendingAttack이 있는 유저
          { pendingAttack: { $ne: null } },
          // 레거시: pendingReturn이 있는 유저
          { pendingReturn: { $ne: null } },
        ]
      }).select('_id fleetMissions pendingAttack pendingReturn').exec();

      let processedCount = 0;

      for (const user of usersWithMissions) {
        try {
          // 완료된 미션이 있는지 확인
          const hasCompletedMission = this.hasCompletedMission(user, now);
          
          if (hasCompletedMission) {
            // 각 미션 타입별 처리
            await this.battleService.processAttackArrival(user._id.toString());
            await this.battleService.processRecycleArrival(user._id.toString());
            await this.battleService.processIncomingAttacks(user._id.toString());
            await this.battleService.processFleetReturn(user._id.toString());
            await this.battleService.processTransportArrival(user._id.toString());
            await this.battleService.processDeployArrival(user._id.toString());
            await this.colonyService.completeColonization(user._id.toString());
            
            processedCount++;
          }
        } catch (e) {
          // 개별 유저 처리 실패 시 다른 유저는 계속 처리
          this.logger.warn(`Failed to process missions for user ${user._id}: ${e.message}`);
        }
      }

      if (processedCount > 0) {
        this.logger.log(`Processed ${processedCount} users' fleet missions`);
      }
    } catch (e) {
      this.logger.error(`Fleet scheduler error: ${e.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 완료된 미션이 있는지 확인
   */
  private hasCompletedMission(user: any, now: number): boolean {
    // fleetMissions 배열 확인
    if (user.fleetMissions && user.fleetMissions.length > 0) {
      for (const mission of user.fleetMissions) {
        if (mission.phase === 'outbound') {
          const arrivalTime = new Date(mission.arrivalTime).getTime();
          if (arrivalTime <= now) return true;
        } else if (mission.phase === 'returning') {
          const returnTime = new Date(mission.returnTime).getTime();
          if (returnTime && returnTime <= now) return true;
        }
      }
    }

    // 레거시 pendingAttack 확인
    if (user.pendingAttack && !user.pendingAttack.battleCompleted) {
      const arrivalTime = new Date(user.pendingAttack.arrivalTime).getTime();
      if (arrivalTime <= now) return true;
    }

    // 레거시 pendingReturn 확인
    if (user.pendingReturn) {
      const returnTime = new Date(user.pendingReturn.returnTime).getTime();
      if (returnTime <= now) return true;
    }

    return false;
  }
}

