import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

// 위치별 행성 필드 범위 (1~15 위치)
const PLANET_FIELD_RANGES = {
  min: [40, 50, 55, 100, 95, 80, 115, 120, 125, 75, 80, 85, 60, 40, 50],
  max: [90, 95, 95, 240, 240, 230, 180, 180, 190, 125, 120, 130, 160, 300, 150]
};

// 위치별 온도 범위
const PLANET_TEMP_RANGES = {
  min: [40, 40, 40, 15, 15, 15, -10, -10, -10, -35, -35, -35, -60, -60, -60],
  max: [140, 140, 140, 115, 115, 115, 90, 90, 90, 65, 65, 65, 50, 50, 50]
};

// 위치별 행성 타입
const PLANET_TYPES = [
  'trocken', 'trocken', 'trocken',       // 1-3: 건조
  'dschjungel', 'dschjungel', 'dschjungel', // 4-6: 정글
  'normaltemp', 'normaltemp', 'normaltemp', // 7-9: 온대
  'wasser', 'wasser', 'wasser',           // 10-12: 물
  'eis', 'eis', 'eis'                     // 13-15: 얼음
];

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // 행성 정보 생성 (위치 기반)
  generatePlanetInfo(position: number, isHomeWorld: boolean = true): {
    maxFields: number;
    temperature: number;
    planetType: string;
    diameter: number;
  } {
    const posIndex = Math.max(0, Math.min(14, position - 1));

    if (isHomeWorld) {
      // 모행성은 기본 163 필드, 지름 = sqrt(163) × 1000 ≈ 12,767 km
      return {
        maxFields: 163,
        temperature: 50,
        planetType: 'normaltemp',
        diameter: Math.floor(Math.sqrt(163) * 1000)  // ~12,767 km
      };
    }

    // 랜덤 필드 수 결정
    const minFields = PLANET_FIELD_RANGES.min[posIndex];
    const maxFields = PLANET_FIELD_RANGES.max[posIndex];
    const randomFields = Math.floor(Math.random() * (maxFields - minFields + 1)) + minFields;

    // 랜덤 온도 결정
    const minTemp = PLANET_TEMP_RANGES.min[posIndex];
    const maxTemp = PLANET_TEMP_RANGES.max[posIndex];
    const randomTemp = Math.floor(Math.random() * (maxTemp - minTemp + 1)) + minTemp;

    // 지름 계산: sqrt(필드 수) × 1000
    const diameter = Math.floor(Math.sqrt(randomFields) * 1000);

    return {
      maxFields: randomFields,
      temperature: randomTemp,
      planetType: PLANET_TYPES[posIndex],
      diameter
    };
  }

  async create(email: string, password: string, playerName: string): Promise<UserDocument> {
    // 이메일 중복 체크
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }

    // 닉네임 중복 체크
    const existingPlayerName = await this.userModel.findOne({ playerName }).exec();
    if (existingPlayerName) {
      throw new ConflictException('이미 사용 중인 플레이어 이름입니다.');
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 유니크 좌표 생성
    const coordinate = await this.generateUniqueCoordinate();
    
    // 좌표에서 위치 추출
    const position = parseInt(coordinate.split(':')[2], 10) || 7;
    
    // 행성 정보 생성 (모행성)
    const planetInfo = this.generatePlanetInfo(position, true);

    const user = new this.userModel({
      email,
      password: hashedPassword,
      playerName,
      coordinate,
      resources: {
        metal: 5000,
        crystal: 2500,
        deuterium: 1500,
        energy: 0,
      },
      mines: {
        metalMine: 0,
        crystalMine: 0,
        deuteriumMine: 0,
        solarPlant: 0,
        fusionReactor: 0,
      },
      facilities: {
        robotFactory: 0,
        shipyard: 0,
        researchLab: 0,
        nanoFactory: 0,
        terraformer: 0,
        allianceDepot: 0,
        missileSilo: 0,
        metalStorage: 0,
        crystalStorage: 0,
        deuteriumTank: 0,
        lunarBase: 0,
        sensorPhalanx: 0,
        jumpGate: 0,
      },
      planetInfo: {
        maxFields: planetInfo.maxFields,
        usedFields: 0,
        temperature: planetInfo.temperature,
        planetType: planetInfo.planetType,
        isMoon: false,
        planetName: playerName,
        diameter: planetInfo.diameter,
      },
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByCoordinate(coordinate: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ coordinate }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async update(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async generateUniqueCoordinate(): Promise<string> {
    let coordinate = '';
    let isUnique = false;

    while (!isUnique) {
      const galaxy = 1;
      const system = Math.floor(Math.random() * 99) + 1;
      const position = Math.floor(Math.random() * 15) + 1;
      coordinate = `${galaxy}:${system}:${position}`;

      const existing = await this.userModel.findOne({ coordinate }).exec();
      if (!existing) {
        isUnique = true;
      }
    }

    return coordinate;
  }

  async getPlayersBySystem(galaxy: number, system: number): Promise<UserDocument[]> {
    const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
    return this.userModel.find({ coordinate: pattern }).exec();
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async createGoogleUser(email: string, googleId: string, playerName: string): Promise<UserDocument> {
    // 닉네임 중복 체크
    const existingPlayerName = await this.userModel.findOne({ playerName }).exec();
    if (existingPlayerName) {
      throw new ConflictException('이미 사용 중인 플레이어 이름입니다.');
    }

    // 유니크 좌표 생성
    const coordinate = await this.generateUniqueCoordinate();
    
    // 좌표에서 위치 추출
    const position = parseInt(coordinate.split(':')[2], 10) || 7;
    
    // 행성 정보 생성 (모행성)
    const planetInfo = this.generatePlanetInfo(position, true);

    const user = new this.userModel({
      email,
      googleId,
      playerName,
      coordinate,
      resources: {
        metal: 5000,
        crystal: 2500,
        deuterium: 1500,
        energy: 0,
      },
      mines: {
        metalMine: 0,
        crystalMine: 0,
        deuteriumMine: 0,
        solarPlant: 0,
        fusionReactor: 0,
      },
      facilities: {
        robotFactory: 0,
        shipyard: 0,
        researchLab: 0,
        nanoFactory: 0,
        terraformer: 0,
        allianceDepot: 0,
        missileSilo: 0,
        metalStorage: 0,
        crystalStorage: 0,
        deuteriumTank: 0,
        lunarBase: 0,
        sensorPhalanx: 0,
        jumpGate: 0,
      },
      planetInfo: {
        maxFields: planetInfo.maxFields,
        usedFields: 0,
        temperature: planetInfo.temperature,
        planetType: planetInfo.planetType,
        isMoon: false,
        planetName: playerName,
        diameter: planetInfo.diameter,
      },
    });

    return user.save();
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { googleId },
      { new: true }
    ).exec();
  }

  // 최근 활동 시간 업데이트
  async updateLastActivity(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastActivity: new Date() }).exec();
  }

  // 행성 이름 변경
  async updatePlanetName(userId: string, newPlanetName: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { 'planetInfo.planetName': newPlanetName },
      { new: true }
    ).exec();
  }

  // 비밀번호 변경
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    // Google 계정인 경우 비밀번호 변경 불가
    if (user.googleId && !user.password) {
      return { success: false, message: 'Google 계정은 비밀번호를 변경할 수 없습니다.' };
    }

    // 현재 비밀번호 확인
    const isValid = await this.validatePassword(user, currentPassword);
    if (!isValid) {
      return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    }

    // 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }).exec();

    return { success: true, message: '비밀번호가 변경되었습니다.' };
  }

  // 휴가 모드 활성화 가능 여부 확인
  async canActivateVacation(userId: string): Promise<{ canActivate: boolean; reason?: string }> {
    const user = await this.findById(userId);
    if (!user) {
      return { canActivate: false, reason: '사용자를 찾을 수 없습니다.' };
    }

    // 이미 휴가 모드인 경우
    if (user.vacationMode?.isActive) {
      return { canActivate: false, reason: '이미 휴가 모드입니다.' };
    }

    // 진행 중인 건설이 있는지 확인
    if (user.constructionProgress) {
      return { canActivate: false, reason: '진행 중인 건설이 있습니다.' };
    }

    // 진행 중인 연구가 있는지 확인
    if (user.researchProgress) {
      return { canActivate: false, reason: '진행 중인 연구가 있습니다.' };
    }

    // 진행 중인 함대 건조가 있는지 확인
    if (user.fleetProgress) {
      return { canActivate: false, reason: '진행 중인 함대 건조가 있습니다.' };
    }

    // 진행 중인 방어시설 건설이 있는지 확인
    if (user.defenseProgress) {
      return { canActivate: false, reason: '진행 중인 방어시설 건설이 있습니다.' };
    }

    // 진행 중인 공격이 있는지 확인
    if (user.pendingAttack) {
      return { canActivate: false, reason: '진행 중인 공격 미션이 있습니다.' };
    }

    // 귀환 중인 함대가 있는지 확인
    if (user.pendingReturn) {
      return { canActivate: false, reason: '귀환 중인 함대가 있습니다.' };
    }

    return { canActivate: true };
  }

  // 휴가 모드 활성화
  async activateVacation(userId: string): Promise<{ success: boolean; message: string }> {
    const canActivate = await this.canActivateVacation(userId);
    if (!canActivate.canActivate) {
      return { success: false, message: canActivate.reason || '휴가 모드를 활성화할 수 없습니다.' };
    }

    const now = new Date();
    const minEndTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48시간 후

    await this.userModel.findByIdAndUpdate(userId, {
      vacationMode: {
        isActive: true,
        startTime: now,
        minEndTime: minEndTime,
      }
    }).exec();

    return { success: true, message: '휴가 모드가 활성화되었습니다. 최소 48시간 후에 해제할 수 있습니다.' };
  }

  // 휴가 모드 해제
  async deactivateVacation(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    if (!user.vacationMode?.isActive) {
      return { success: false, message: '휴가 모드가 활성화되어 있지 않습니다.' };
    }

    const now = new Date();
    if (user.vacationMode.minEndTime && now < user.vacationMode.minEndTime) {
      const remaining = Math.ceil((user.vacationMode.minEndTime.getTime() - now.getTime()) / (60 * 60 * 1000));
      return { success: false, message: `최소 기간이 지나지 않았습니다. ${remaining}시간 후에 해제할 수 있습니다.` };
    }

    await this.userModel.findByIdAndUpdate(userId, {
      vacationMode: {
        isActive: false,
        startTime: null,
        minEndTime: null,
      },
      lastResourceUpdate: now, // 자원 업데이트 시간 리셋
    }).exec();

    return { success: true, message: '휴가 모드가 해제되었습니다.' };
  }

  // 계정 초기화
  async resetAccount(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    // 비밀번호 확인 (Google 계정은 비밀번호 없이 진행)
    if (user.password) {
      const isValid = await this.validatePassword(user, password);
      if (!isValid) {
        return { success: false, message: '비밀번호가 일치하지 않습니다.' };
      }
    }

    // 새 좌표 생성
    const newCoordinate = await this.generateUniqueCoordinate();
    const position = parseInt(newCoordinate.split(':')[2], 10) || 7;
    const planetInfo = this.generatePlanetInfo(position, true);

    // 계정 초기화
    await this.userModel.findByIdAndUpdate(userId, {
      coordinate: newCoordinate,
      resources: {
        metal: 5000,
        crystal: 2500,
        deuterium: 1500,
        energy: 0,
      },
      mines: {
        metalMine: 0,
        crystalMine: 0,
        deuteriumMine: 0,
        solarPlant: 0,
        fusionReactor: 0,
      },
      facilities: {
        robotFactory: 0,
        shipyard: 0,
        researchLab: 0,
        nanoFactory: 0,
        terraformer: 0,
        allianceDepot: 0,
        missileSilo: 0,
        metalStorage: 0,
        crystalStorage: 0,
        deuteriumTank: 0,
        lunarBase: 0,
        sensorPhalanx: 0,
        jumpGate: 0,
      },
      planetInfo: {
        maxFields: planetInfo.maxFields,
        usedFields: 0,
        temperature: planetInfo.temperature,
        planetType: planetInfo.planetType,
        isMoon: false,
        planetName: user.playerName,
        diameter: planetInfo.diameter,
      },
      researchLevels: {
        energyTech: 0,
        laserTech: 0,
        ionTech: 0,
        hyperspaceTech: 0,
        plasmaTech: 0,
        combustionDrive: 0,
        impulseDrive: 0,
        hyperspaceDrive: 0,
        espionageTech: 0,
        computerTech: 0,
        astrophysics: 0,
        intergalacticResearch: 0,
        gravitonTech: 0,
        weaponsTech: 0,
        shieldTech: 0,
        armorTech: 0,
      },
      fleet: {
        smallCargo: 0,
        largeCargo: 0,
        lightFighter: 0,
        heavyFighter: 0,
        cruiser: 0,
        battleship: 0,
        battlecruiser: 0,
        bomber: 0,
        destroyer: 0,
        deathstar: 0,
        recycler: 0,
        espionageProbe: 0,
        solarSatellite: 0,
        colonyShip: 0,
      },
      defense: {
        rocketLauncher: 0,
        lightLaser: 0,
        heavyLaser: 0,
        gaussCannon: 0,
        ionCannon: 0,
        plasmaTurret: 0,
        smallShieldDome: 0,
        largeShieldDome: 0,
        antiBallisticMissile: 0,
        interplanetaryMissile: 0,
      },
      constructionProgress: null,
      researchProgress: null,
      fleetProgress: null,
      defenseProgress: null,
      pendingAttack: null,
      pendingReturn: null,
      incomingAttack: null,
      vacationMode: {
        isActive: false,
        startTime: null,
        minEndTime: null,
      },
      lastResourceUpdate: new Date(),
    }).exec();

    return { success: true, message: '계정이 초기화되었습니다.' };
  }

  // 계정 탈퇴
  async deleteAccount(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    // 비밀번호 확인 (Google 계정은 비밀번호 없이 진행)
    if (user.password) {
      const isValid = await this.validatePassword(user, password);
      if (!isValid) {
        return { success: false, message: '비밀번호가 일치하지 않습니다.' };
      }
    }

    await this.userModel.findByIdAndDelete(userId).exec();

    return { success: true, message: '계정이 삭제되었습니다.' };
  }

  // 활성 행성 업데이트 (다중 행성 시스템)
  async updateActivePlanet(userId: string, planetId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      activePlanetId: planetId,
    }).exec();
  }

  // 모행성 ID 설정
  async setHomePlanet(userId: string, planetId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      homePlanetId: planetId,
      activePlanetId: planetId,
    }).exec();
  }

  // 유저 좌표 업데이트 (활성 행성 변경 시 동기화용)
  async updateUserCoordinate(userId: string, coordinate: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { coordinate }).exec();
  }
}
