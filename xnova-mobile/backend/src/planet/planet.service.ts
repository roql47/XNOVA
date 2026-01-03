import { Injectable, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Planet, PlanetDocument, generatePlanetCharacteristics } from './schemas/planet.schema';
import { UserService } from '../user/user.service';
import { MessageService } from '../message/message.service';

// 최대 행성 수 (모행성 1 + 식민지 8)
export const MAX_PLANETS = 9;

// 식민지 초기 자원
const COLONY_INITIAL_RESOURCES = {
  metal: 500,
  crystal: 500,
  deuterium: 0,
};

@Injectable()
export class PlanetService {
  constructor(
    @InjectModel(Planet.name) private planetModel: Model<PlanetDocument>,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    private messageService: MessageService,
  ) {}

  /**
   * 새 행성 생성 (모행성 또는 식민지)
   */
  async createPlanet(
    ownerId: string,
    coordinate: string,
    name: string,
    isHomeworld: boolean = false,
  ): Promise<PlanetDocument> {
    // 좌표 파싱
    const [galaxy, system, position] = coordinate.split(':').map(Number);
    
    // 좌표 유효성 검사
    if (!galaxy || !system || !position || position < 1 || position > 15) {
      throw new BadRequestException('유효하지 않은 좌표입니다.');
    }

    // 해당 좌표에 이미 행성이 있는지 확인
    const existingPlanet = await this.planetModel.findOne({ coordinate }).exec();
    if (existingPlanet) {
      throw new BadRequestException('해당 좌표에 이미 행성이 존재합니다.');
    }

    // 위치별 행성 특성 생성
    const characteristics = generatePlanetCharacteristics(position);

    // 행성 생성
    const planet = new this.planetModel({
      ownerId,
      coordinate,
      name,
      isHomeworld,
      type: 'planet',
      resources: isHomeworld 
        ? { metal: 5000, crystal: 2500, deuterium: 1500, energy: 0 }
        : { ...COLONY_INITIAL_RESOURCES, energy: 0 },
      planetInfo: {
        maxFields: characteristics.maxFields,
        usedFields: 0,
        tempMin: characteristics.tempMin,
        tempMax: characteristics.tempMax,
        planetType: characteristics.planetType,
        diameter: characteristics.diameter,
      },
    });

    return planet.save();
  }

  /**
   * 유저의 모든 행성 조회
   */
  async getPlanetsByOwner(ownerId: string): Promise<PlanetDocument[]> {
    return this.planetModel.find({ ownerId }).sort({ isHomeworld: -1, createdAt: 1 }).exec();
  }

  /**
   * 특정 행성 조회
   */
  async getPlanetById(planetId: string): Promise<PlanetDocument> {
    const planet = await this.planetModel.findById(planetId).exec();
    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }
    return planet;
  }

  /**
   * 좌표로 행성 조회
   */
  async getPlanetByCoordinate(coordinate: string): Promise<PlanetDocument | null> {
    return this.planetModel.findOne({ coordinate }).exec();
  }

  /**
   * 유저의 행성 수 조회
   */
  async getPlanetCount(ownerId: string): Promise<number> {
    return this.planetModel.countDocuments({ ownerId, type: 'planet' }).exec();
  }

  /**
   * 활성 행성 전환
   */
  async switchActivePlanet(userId: string, planetId: string): Promise<PlanetDocument> {
    const planet = await this.planetModel.findById(planetId).exec();
    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }

    if (planet.ownerId !== userId) {
      throw new BadRequestException('이 행성의 소유자가 아닙니다.');
    }

    // User의 activePlanetId 업데이트
    await this.userService.updateActivePlanet(userId, planetId);

    return planet;
  }

  /**
   * 행성 포기
   */
  async abandonPlanet(userId: string, planetId: string): Promise<{ success: boolean; message: string }> {
    const planet = await this.planetModel.findById(planetId).exec();
    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }

    if (planet.ownerId !== userId) {
      throw new BadRequestException('이 행성의 소유자가 아닙니다.');
    }

    if (planet.isHomeworld) {
      throw new BadRequestException('모행성은 포기할 수 없습니다.');
    }

    // TODO: 해당 행성 관련 함대 이동 중인지 확인
    // 함대가 이동 중이면 포기 불가

    // 행성 삭제
    await this.planetModel.findByIdAndDelete(planetId).exec();

    // 유저의 행성 목록 업데이트
    const user = await this.userService.findById(userId);
    if (user) {
      // 활성 행성이 삭제된 행성이면 모행성으로 전환
      if (user.activePlanetId === planetId && user.homePlanetId) {
        await this.userService.updateActivePlanet(userId, user.homePlanetId);
      }
    }

    // 메시지 전송
    await this.messageService.createMessage({
      receiverId: userId,
      senderName: '행성 관리국',
      title: `식민지 포기: ${planet.name}`,
      content: `${planet.coordinate} 좌표의 식민지 "${planet.name}"이(가) 성공적으로 포기되었습니다.`,
      type: 'system',
    });

    return { success: true, message: `식민지 "${planet.name}"이(가) 포기되었습니다.` };
  }

  /**
   * 행성 이름 변경
   */
  async renamePlanet(userId: string, planetId: string, newName: string): Promise<PlanetDocument> {
    const planet = await this.planetModel.findById(planetId).exec();
    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }

    if (planet.ownerId !== userId) {
      throw new BadRequestException('이 행성의 소유자가 아닙니다.');
    }

    if (!newName || newName.trim().length === 0) {
      throw new BadRequestException('행성 이름을 입력해주세요.');
    }

    if (newName.length > 20) {
      throw new BadRequestException('행성 이름은 20자 이내로 입력해주세요.');
    }

    planet.name = newName.trim();
    return planet.save();
  }

  /**
   * 행성 자원 업데이트 (저장)
   */
  async updatePlanetResources(
    planetId: string,
    resources: { metal?: number; crystal?: number; deuterium?: number; energy?: number },
  ): Promise<void> {
    await this.planetModel.findByIdAndUpdate(planetId, {
      $set: {
        'resources.metal': resources.metal,
        'resources.crystal': resources.crystal,
        'resources.deuterium': resources.deuterium,
        'resources.energy': resources.energy,
        lastResourceUpdate: new Date(),
      },
    }).exec();
  }

  /**
   * 좌표가 비어있는지 확인
   */
  async isCoordinateEmpty(coordinate: string): Promise<boolean> {
    const planet = await this.planetModel.findOne({ coordinate }).exec();
    return !planet;
  }

  /**
   * 행성 데이터 직접 저장
   */
  async savePlanet(planet: PlanetDocument): Promise<PlanetDocument> {
    return planet.save();
  }

  /**
   * 유저의 활성 행성 ID 조회
   */
  async getUserActivePlanetId(userId: string): Promise<{ activePlanetId: string | null } | null> {
    const user = await this.userService.findById(userId);
    if (!user) return null;
    return { activePlanetId: user.activePlanetId };
  }
}

