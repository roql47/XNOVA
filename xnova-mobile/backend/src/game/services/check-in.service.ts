import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResourcesService } from './resources.service';

export interface CheckInStatusResponse {
  streak: number;           // 현재 연속 출석일수 (1-7)
  canCheckIn: boolean;      // 오늘 출석 가능 여부
  weekDays: boolean[];      // 이번 주 출석 현황 [일~토] (7개)
  rewardHours: number;      // 다음 보상 시간
  nextReward: {             // 다음 보상 예상 자원
    metal: number;
    crystal: number;
    deuterium: number;
  };
  todayCheckedIn: boolean;  // 오늘 이미 출석했는지
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

@Injectable()
export class CheckInService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly resourcesService: ResourcesService,
  ) {}

  /**
   * 한국 시간(KST) 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환
   */
  private getTodayDateKST(): string {
    const now = new Date();
    // KST = UTC + 9시간
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    return kstDate.toISOString().split('T')[0];
  }

  /**
   * 어제 날짜를 'YYYY-MM-DD' 형식으로 반환 (KST 기준)
   */
  private getYesterdayDateKST(): string {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset - 24 * 60 * 60 * 1000);
    return kstDate.toISOString().split('T')[0];
  }

  /**
   * 이번 주 시작일 (월요일) 반환 (KST 기준)
   */
  private getWeekStartDateKST(): string {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    
    // 요일 계산 (0=일, 1=월, ..., 6=토)
    const dayOfWeek = kstDate.getUTCDay();
    // 월요일로 이동 (일요일이면 -6, 그 외에는 -(dayOfWeek - 1))
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    
    const monday = new Date(kstDate.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
    return monday.toISOString().split('T')[0];
  }

  /**
   * 날짜 차이 계산 (일 단위)
   */
  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d1.getTime() - d2.getTime();
    return Math.floor(diffTime / (24 * 60 * 60 * 1000));
  }

  /**
   * 보상 시간 계산
   * - 1~2일차: 2시간
   * - 3일차: 3시간
   * - 4~6일차: 3시간
   * - 7일차: 5시간
   */
  private getRewardHours(streak: number): number {
    if (streak <= 2) return 2;
    if (streak <= 6) return 3;
    return 5; // 7일차
  }

  /**
   * 모행성 시간당 생산량 계산
   */
  private calculateHourlyProduction(user: UserDocument): { metal: number; crystal: number; deuterium: number } {
    const mines = user.mines;
    const facilities = user.facilities;
    const fleet = user.fleet;
    const operationRates = user.operationRates || {
      metalMine: 100,
      crystalMine: 100,
      deuteriumMine: 100,
      solarPlant: 100,
      fusionReactor: 100,
      solarSatellite: 100,
    };

    // 에너지 계산
    const solarPlantEnergy = this.resourcesService.getEnergyProduction(mines?.solarPlant || 0) * ((operationRates.solarPlant || 100) / 100);
    const fusionEnergy = this.resourcesService.getFusionEnergyProduction(mines?.fusionReactor || 0) * ((operationRates.fusionReactor || 100) / 100);
    const satelliteCount = fleet?.solarSatellite || 0;
    const planetTemperature = user.planetInfo?.temperature ?? 50;
    const satelliteEnergy = this.resourcesService.getSatelliteEnergy(satelliteCount, planetTemperature) * ((operationRates.solarSatellite || 100) / 100);
    const totalEnergyProduction = solarPlantEnergy + fusionEnergy + satelliteEnergy;

    // 에너지 소비 계산
    const metalEnergyConsumption = this.resourcesService.getEnergyConsumption(mines?.metalMine || 0, 'metal') * ((operationRates.metalMine || 100) / 100);
    const crystalEnergyConsumption = this.resourcesService.getEnergyConsumption(mines?.crystalMine || 0, 'crystal') * ((operationRates.crystalMine || 100) / 100);
    const deuteriumEnergyConsumption = this.resourcesService.getEnergyConsumption(mines?.deuteriumMine || 0, 'deuterium') * ((operationRates.deuteriumMine || 100) / 100);
    const totalEnergyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deuteriumEnergyConsumption;

    // 에너지 비율
    let energyRatio = 1.0;
    if (totalEnergyProduction < totalEnergyConsumption) {
      energyRatio = Math.max(0.1, totalEnergyProduction / totalEnergyConsumption);
    }

    // 시간당 자원 생산량
    const metalProduction = this.resourcesService.getResourceProduction(mines?.metalMine || 0, 'metal') * ((operationRates.metalMine || 100) / 100) * energyRatio;
    const crystalProduction = this.resourcesService.getResourceProduction(mines?.crystalMine || 0, 'crystal') * ((operationRates.crystalMine || 100) / 100) * energyRatio;
    const deuteriumProduction = this.resourcesService.getResourceProduction(mines?.deuteriumMine || 0, 'deuterium') * ((operationRates.deuteriumMine || 100) / 100) * energyRatio;
    const fusionDeuteriumConsumption = this.resourcesService.getFusionDeuteriumConsumption(mines?.fusionReactor || 0) * ((operationRates.fusionReactor || 100) / 100);

    return {
      metal: Math.floor(metalProduction),
      crystal: Math.floor(crystalProduction),
      deuterium: Math.floor(deuteriumProduction - fusionDeuteriumConsumption),
    };
  }

  /**
   * 이번 주 출석 현황 계산
   */
  private calculateWeekDays(lastCheckInDate: string | null, streak: number, weekStartDate: string | null): boolean[] {
    const weekDays = [false, false, false, false, false, false, false]; // 월~일
    const currentWeekStart = this.getWeekStartDateKST();
    
    // 주간 시작일이 다르면 (새로운 주) 모두 false
    if (!weekStartDate || weekStartDate !== currentWeekStart) {
      return weekDays;
    }

    if (!lastCheckInDate) return weekDays;

    const today = this.getTodayDateKST();
    const todayDate = new Date(today);
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstTodayDate = new Date(todayDate.getTime() + kstOffset);
    const todayDayOfWeek = kstTodayDate.getUTCDay(); // 0=일, 1=월, ..., 6=토
    
    // 월요일 기준 인덱스로 변환 (월=0, 화=1, ..., 일=6)
    const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

    // streak 만큼 역순으로 체크 표시
    for (let i = 0; i < streak && i <= todayIndex; i++) {
      const dayIndex = todayIndex - i;
      if (dayIndex >= 0 && dayIndex < 7) {
        weekDays[dayIndex] = true;
      }
    }

    return weekDays;
  }

  /**
   * 출석체크 상태 조회
   */
  async getCheckInStatus(userId: string): Promise<CheckInStatusResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const checkIn = user.checkIn || { lastCheckInDate: null, checkInStreak: 0, weekStartDate: null };
    const today = this.getTodayDateKST();
    const yesterday = this.getYesterdayDateKST();
    const currentWeekStart = this.getWeekStartDateKST();

    // 오늘 이미 출석했는지 확인
    const todayCheckedIn = checkIn.lastCheckInDate === today;
    
    // 연속 출석 계산
    let currentStreak = checkIn.checkInStreak || 0;
    
    // 주간이 바뀌면 streak 리셋
    if (checkIn.weekStartDate !== currentWeekStart) {
      currentStreak = 0;
    } else if (!todayCheckedIn && checkIn.lastCheckInDate !== yesterday) {
      // 어제 출석 안 했으면 streak 리셋
      currentStreak = 0;
    }

    // 다음 보상 streak (출석 시 받을 streak)
    const nextStreak = todayCheckedIn ? currentStreak : Math.min(currentStreak + 1, 7);
    if (nextStreak === 0) {
      // 처음 출석이면 1일차
    }
    const rewardStreak = todayCheckedIn ? currentStreak : (currentStreak === 0 ? 1 : Math.min(currentStreak + 1, 7));
    const rewardHours = this.getRewardHours(rewardStreak);

    // 예상 보상 계산
    const hourlyProduction = this.calculateHourlyProduction(user);
    const nextReward = {
      metal: Math.floor(hourlyProduction.metal * rewardHours),
      crystal: Math.floor(hourlyProduction.crystal * rewardHours),
      deuterium: Math.floor(hourlyProduction.deuterium * rewardHours),
    };

    // 이번 주 출석 현황
    const weekDays = this.calculateWeekDays(
      checkIn.lastCheckInDate,
      currentStreak,
      checkIn.weekStartDate,
    );

    return {
      streak: currentStreak,
      canCheckIn: !todayCheckedIn,
      weekDays,
      rewardHours,
      nextReward,
      todayCheckedIn,
    };
  }

  /**
   * 출석체크 수행
   */
  async checkIn(userId: string): Promise<CheckInResult> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const checkIn = user.checkIn || { lastCheckInDate: null, checkInStreak: 0, weekStartDate: null };
    const today = this.getTodayDateKST();
    const yesterday = this.getYesterdayDateKST();
    const currentWeekStart = this.getWeekStartDateKST();

    // 오늘 이미 출석했는지 확인
    if (checkIn.lastCheckInDate === today) {
      return {
        success: false,
        streak: checkIn.checkInStreak,
        rewardHours: 0,
        reward: { metal: 0, crystal: 0, deuterium: 0 },
        message: '오늘은 이미 출석했습니다.',
      };
    }

    // 연속 출석 계산
    let newStreak = 1;

    // 주간이 바뀌면 streak 리셋
    if (checkIn.weekStartDate !== currentWeekStart) {
      newStreak = 1;
    } else if (checkIn.lastCheckInDate === yesterday) {
      // 어제 출석했으면 streak 증가
      newStreak = Math.min((checkIn.checkInStreak || 0) + 1, 7);
    } else {
      // 어제 출석 안 했으면 리셋
      newStreak = 1;
    }

    // 7일 초과시 리셋
    if (newStreak > 7) {
      newStreak = 1;
    }

    // 보상 계산
    const rewardHours = this.getRewardHours(newStreak);
    const hourlyProduction = this.calculateHourlyProduction(user);
    const reward = {
      metal: Math.floor(hourlyProduction.metal * rewardHours),
      crystal: Math.floor(hourlyProduction.crystal * rewardHours),
      deuterium: Math.floor(hourlyProduction.deuterium * rewardHours),
    };

    // 자원 지급 및 출석 정보 업데이트
    user.resources.metal = (user.resources.metal || 0) + reward.metal;
    user.resources.crystal = (user.resources.crystal || 0) + reward.crystal;
    user.resources.deuterium = (user.resources.deuterium || 0) + reward.deuterium;

    user.checkIn = {
      lastCheckInDate: today,
      checkInStreak: newStreak,
      weekStartDate: currentWeekStart,
    };

    user.markModified('resources');
    user.markModified('checkIn');
    await user.save();

    return {
      success: true,
      streak: newStreak,
      rewardHours,
      reward,
      message: `${newStreak}일차 출석 완료! ${rewardHours}시간 분량의 자원을 받았습니다.`,
    };
  }
}
