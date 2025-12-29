import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

export interface PlanetInfo {
  position: number;
  coordinate: string;
  playerName: string | null;
  playerId: string | null;
  isOwnPlanet: boolean;
  hasDebris: boolean;
  hasMoon: boolean;
}

@Injectable()
export class GalaxyService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // 특정 시스템의 은하 지도 조회
  async getGalaxyMap(galaxy: number, system: number, currentUserId: string): Promise<PlanetInfo[]> {
    // 해당 시스템의 모든 플레이어 조회
    const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
    const players = await this.userModel.find({ coordinate: pattern }).exec();

    // 행성 포인트 1~15 초기화
    const planets: PlanetInfo[] = [];

    for (let position = 1; position <= 15; position++) {
      const coord = `${galaxy}:${system}:${position}`;
      const player = players.find(p => p.coordinate === coord);

      if (player) {
        planets.push({
          position,
          coordinate: coord,
          playerName: player.playerName,
          playerId: player._id.toString(),
          isOwnPlanet: player._id.toString() === currentUserId,
          hasDebris: false, // TODO: 파편 시스템 구현 시 추가
          hasMoon: false, // TODO: 달 시스템 구현 시 추가
        });
      } else {
        planets.push({
          position,
          coordinate: coord,
          playerName: null,
          playerId: null,
          isOwnPlanet: false,
          hasDebris: false,
          hasMoon: false,
        });
      }
    }

    return planets;
  }

  // 플레이어 정보 조회 (은하지도에서 클릭 시)
  async getPlayerInfo(targetUserId: string, currentUserId: string) {
    const target = await this.userModel.findById(targetUserId).exec();
    if (!target) return null;

    const isOwn = targetUserId === currentUserId;

    // 기본 정보만 반환 (자세한 정보는 정탐을 통해)
    return {
      playerName: target.playerName,
      coordinate: target.coordinate,
      isOwnPlanet: isOwn,
      // 자신의 행성이면 상세 정보 표시
      ...(isOwn && {
        resources: target.resources,
        mines: target.mines,
        facilities: target.facilities,
      }),
    };
  }

  // 좌표로 플레이어 검색
  async findPlayerByCoordinate(coordinate: string) {
    return this.userModel.findOne({ coordinate }).exec();
  }

  // 특정 은하의 모든 시스템 목록 (활성화된 시스템만)
  async getActiveSystems(galaxy: number): Promise<number[]> {
    const pattern = new RegExp(`^${galaxy}:\\d+:\\d+$`);
    const players = await this.userModel.find({ coordinate: pattern }).select('coordinate').exec();

    const systems = new Set<number>();
    for (const player of players) {
      const parts = player.coordinate.split(':');
      systems.add(parseInt(parts[1]));
    }

    return Array.from(systems).sort((a, b) => a - b);
  }
}
