import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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
    return bcrypt.compare(password, user.password);
  }
}
