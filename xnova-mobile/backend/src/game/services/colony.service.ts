import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { PlanetService, MAX_PLANETS } from '../../planet/planet.service';
import { MessageService } from '../../message/message.service';
import { FLEET_DATA, calculateShipSpeed } from '../constants/game-data';

// 식민 미션 진행 상태
export interface ColonyProgress {
  targetCoord: string;
  fleet: Record<string, number>;
  travelTime: number;
  startTime: Date;
  arrivalTime: Date;
}

@Injectable()
export class ColonyService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => PlanetService)) private planetService: PlanetService,
    private messageService: MessageService,
  ) {}

  /**
   * 이동 거리 계산
   */
  private calculateDistance(coord1: string, coord2: string): number {
    const [g1, s1, p1] = coord1.split(':').map(Number);
    const [g2, s2, p2] = coord2.split(':').map(Number);

    if (g1 !== g2) {
      return Math.abs(g1 - g2) * 20000;
    }
    if (s1 !== s2) {
      return Math.abs(s1 - s2) * 95 + 2700;
    }
    return Math.abs(p1 - p2) * 5 + 1000;
  }

  /**
   * 이동 시간 계산 (초)
   */
  private calculateTravelTime(distance: number, fleetSpeed: number): number {
    // OGame 공식: 시간(초) = (35000 / 속도비율 × sqrt(거리×10/최저속도) + 10)
    const speedPercent = 100; // 100% 속도
    return Math.round((35000 / speedPercent * Math.sqrt(distance * 10 / fleetSpeed) + 10));
  }

  /**
   * 함대의 최저 속도 계산
   */
  private getFleetMinSpeed(fleet: Record<string, number>, researchLevels: any): number {
    let minSpeed = Infinity;
    
    for (const [shipType, count] of Object.entries(fleet)) {
      if (count > 0) {
        const shipData = FLEET_DATA[shipType];
        if (shipData && shipData.stats.speed > 0) {
          const speed = calculateShipSpeed(shipType, researchLevels);
          if (speed < minSpeed) {
            minSpeed = speed;
          }
        }
      }
    }
    
    return minSpeed === Infinity ? 1 : minSpeed;
  }

  /**
   * 연료 소비량 계산
   */
  private calculateFuelConsumption(fleet: Record<string, number>, distance: number, travelTime: number): number {
    let totalFuel = 0;
    
    for (const [shipType, count] of Object.entries(fleet)) {
      if (count > 0) {
        const shipData = FLEET_DATA[shipType];
        if (shipData) {
          // 간단한 연료 계산 (실제 OGame 공식은 더 복잡)
          const baseFuel = shipData.stats.fuelConsumption || 0;
          totalFuel += baseFuel * count * (1 + distance / 35000);
        }
      }
    }
    
    return Math.ceil(totalFuel);
  }

  /**
   * 식민 미션 시작
   */
  async startColonization(
    userId: string,
    targetCoord: string,
    fleet: Record<string, number>,
  ): Promise<{ success: boolean; message: string; arrivalTime?: Date }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 이미 진행 중인 미션이 있는지 확인
    if (user.pendingAttack) {
      throw new BadRequestException('이미 진행 중인 함대 미션이 있습니다.');
    }

    // 식민선 확인
    const colonyShipCount = fleet.colonyShip || 0;
    if (colonyShipCount < 1) {
      throw new BadRequestException('식민선이 최소 1대 이상 필요합니다.');
    }

    // 보유 함대 확인
    for (const [shipType, count] of Object.entries(fleet)) {
      if (count > 0) {
        const available = (user.fleet as any)[shipType] || 0;
        if (available < count) {
          throw new BadRequestException(`${shipType} 보유량이 부족합니다. (보유: ${available}, 필요: ${count})`);
        }
      }
    }

    // 좌표 유효성 검사
    const [galaxy, system, position] = targetCoord.split(':').map(Number);
    if (!galaxy || !system || !position || position < 1 || position > 15) {
      throw new BadRequestException('유효하지 않은 좌표입니다.');
    }

    // 목표 좌표가 비어있는지 확인
    const isEmpty = await this.planetService.isCoordinateEmpty(targetCoord);
    if (!isEmpty) {
      throw new BadRequestException('해당 좌표에 이미 행성이 존재합니다.');
    }

    // 현재 행성 수 확인
    const planetCount = await this.planetService.getPlanetCount(userId);
    if (planetCount >= MAX_PLANETS) {
      throw new BadRequestException(`최대 행성 수(${MAX_PLANETS}개)에 도달했습니다.`);
    }

    // 이동 시간 계산
    const distance = this.calculateDistance(user.coordinate, targetCoord);
    const fleetSpeed = this.getFleetMinSpeed(fleet, user.researchLevels);
    const travelTime = this.calculateTravelTime(distance, fleetSpeed);

    // 연료 계산
    const fuelNeeded = this.calculateFuelConsumption(fleet, distance, travelTime);
    if ((user.resources?.deuterium || 0) < fuelNeeded) {
      throw new BadRequestException(`듀테륨이 부족합니다. (필요: ${fuelNeeded}, 보유: ${user.resources?.deuterium || 0})`);
    }

    // 함대 차감
    for (const [shipType, count] of Object.entries(fleet)) {
      if (count > 0) {
        (user.fleet as any)[shipType] -= count;
      }
    }

    // 연료 차감
    user.resources.deuterium -= fuelNeeded;

    // 미션 정보 저장 (pendingAttack 구조 활용)
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + travelTime * 1000);
    
    user.pendingAttack = {
      targetCoord,
      targetUserId: '', // 빈 문자열 = 식민 미션
      fleet,
      capacity: this.calculateCargoCapacity(fleet),
      travelTime,
      startTime: now,
      arrivalTime,
      battleCompleted: false,
      transportResources: undefined,
      missionType: 'colony',
    };

    await user.save();

    return {
      success: true,
      message: `식민 함대가 ${targetCoord}를 향해 출발했습니다.`,
      arrivalTime,
    };
  }

  /**
   * 식민 미션 완료 처리
   */
  async completeColonization(userId: string): Promise<{
    success: boolean;
    colonized: boolean;
    message: string;
    planetId?: string;
    planetName?: string;
  }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingAttack) {
      return { success: false, colonized: false, message: '진행 중인 미션이 없습니다.' };
    }

    // 식민 미션인지 확인 (targetUserId가 빈 문자열)
    if (user.pendingAttack.targetUserId !== '') {
      return { success: false, colonized: false, message: '식민 미션이 아닙니다.' };
    }

    // 도착 시간 확인
    if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
      return { success: false, colonized: false, message: '아직 도착하지 않았습니다.' };
    }

    const targetCoord = user.pendingAttack.targetCoord;
    const fleet = user.pendingAttack.fleet;

    // 목표 좌표가 여전히 비어있는지 확인
    const isEmpty = await this.planetService.isCoordinateEmpty(targetCoord);
    
    // 현재 행성 수 확인
    const planetCount = await this.planetService.getPlanetCount(userId);

    let colonized = false;
    let planetId: string | undefined;
    let planetName: string | undefined;
    let message: string;

    if (!isEmpty) {
      // 이미 점령됨 - 실패
      message = `${targetCoord} 좌표에 이미 다른 행성이 존재합니다. 식민에 실패했습니다.`;
    } else if (planetCount >= MAX_PLANETS) {
      // 최대 행성 수 초과 - 실패
      message = `최대 행성 수(${MAX_PLANETS}개)에 도달하여 식민에 실패했습니다.`;
    } else {
      // 식민 성공!
      planetName = `식민지 ${planetCount + 1}`;
      
      try {
        const newPlanet = await this.planetService.createPlanet(
          userId,
          targetCoord,
          planetName,
          false, // 식민지
        );
        
        planetId = newPlanet._id.toString();
        colonized = true;
        message = `${targetCoord}에 새로운 식민지 "${planetName}"이(가) 건설되었습니다!`;
        
        // 식민선 1대 소모 (나머지는 귀환)
        fleet.colonyShip = Math.max(0, (fleet.colonyShip || 1) - 1);
      } catch (error) {
        message = `식민 중 오류가 발생했습니다: ${error.message}`;
      }
    }

    // 남은 함대 귀환 설정
    const returnFleet = { ...fleet };
    const hasReturnFleet = Object.values(returnFleet).some(count => count > 0);

    if (hasReturnFleet) {
      const returnTime = new Date(Date.now() + user.pendingAttack.travelTime * 1000);
      user.pendingReturn = {
        fleet: returnFleet,
        loot: { metal: 0, crystal: 0, deuterium: 0 },
        returnTime,
        startTime: new Date(),
        missionType: 'colony',
      };
    }

    user.pendingAttack = null;
    await user.save();

    // 메시지 전송
    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '함대 사령부',
      title: colonized ? `식민 성공: ${targetCoord}` : `식민 실패: ${targetCoord}`,
      content: message,
      type: 'system',
    });

    return { success: true, colonized, message, planetId, planetName };
  }

  /**
   * 함대 귀환 처리
   */
  async completeReturn(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingReturn) {
      return { success: false, message: '귀환 중인 함대가 없습니다.' };
    }

    if (user.pendingReturn.returnTime.getTime() > Date.now()) {
      return { success: false, message: '아직 귀환하지 않았습니다.' };
    }

    // 함대 복귀
    for (const [shipType, count] of Object.entries(user.pendingReturn.fleet)) {
      if (count > 0) {
        (user.fleet as any)[shipType] = ((user.fleet as any)[shipType] || 0) + count;
      }
    }

    user.pendingReturn = null;
    await user.save();

    return { success: true, message: '함대가 귀환했습니다.' };
  }

  /**
   * 화물 용량 계산
   */
  private calculateCargoCapacity(fleet: Record<string, number>): number {
    let totalCapacity = 0;
    
    for (const [shipType, count] of Object.entries(fleet)) {
      if (count > 0) {
        const shipData = FLEET_DATA[shipType];
        if (shipData) {
          totalCapacity += (shipData.stats.cargo || 0) * count;
        }
      }
    }
    
    return totalCapacity;
  }

  /**
   * 식민 미션 귀환 (취소)
   */
  async recallColonization(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.pendingAttack) {
      throw new BadRequestException('진행 중인 미션이 없습니다.');
    }

    // 식민 미션인지 확인
    if (user.pendingAttack.targetUserId !== '') {
      throw new BadRequestException('식민 미션이 아닙니다.');
    }

    // 경과 시간 계산
    const now = new Date();
    const elapsedTime = now.getTime() - user.pendingAttack.startTime.getTime();
    const returnTime = new Date(now.getTime() + elapsedTime);

    // 귀환 설정
    user.pendingReturn = {
      fleet: user.pendingAttack.fleet,
      loot: { metal: 0, crystal: 0, deuterium: 0 },
      returnTime,
      startTime: now,
      missionType: 'colonize',
    };

    user.pendingAttack = null;
    await user.save();

    return { success: true, message: '식민 함대가 귀환합니다.' };
  }
}

