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
}
