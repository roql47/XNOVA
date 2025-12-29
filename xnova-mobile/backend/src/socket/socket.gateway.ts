import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface ConnectedUser {
  odId: string;
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/game',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const userId = payload.sub;
      
      // 사용자를 자신의 room에 조인
      client.join(`user:${userId}`);
      
      this.connectedUsers.set(client.id, {
        odId: client.id,
        userId,
      });

      console.log(`User connected: ${userId} (socket: ${client.id})`);
      
      // 연결 성공 알림
      client.emit('connected', { message: '연결되었습니다.' });
    } catch (error) {
      console.log('Socket authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      console.log(`User disconnected: ${user.userId} (socket: ${client.id})`);
      this.connectedUsers.delete(client.id);
    }
  }

  // 특정 사용자에게 알림 전송
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // 건설 완료 알림
  notifyConstructionComplete(userId: string, building: string, newLevel: number) {
    this.sendToUser(userId, 'construction_complete', {
      type: 'construction',
      building,
      newLevel,
      message: `${building} 건설이 완료되었습니다. (Lv.${newLevel})`,
      timestamp: new Date().toISOString(),
    });
  }

  // 연구 완료 알림
  notifyResearchComplete(userId: string, research: string, newLevel: number) {
    this.sendToUser(userId, 'research_complete', {
      type: 'research',
      research,
      newLevel,
      message: `${research} 연구가 완료되었습니다. (Lv.${newLevel})`,
      timestamp: new Date().toISOString(),
    });
  }

  // 함대 건조 완료 알림
  notifyFleetComplete(userId: string, fleet: string, quantity: number) {
    this.sendToUser(userId, 'fleet_complete', {
      type: 'fleet',
      fleet,
      quantity,
      message: `${fleet} ${quantity}대 건조가 완료되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }

  // 방어시설 건조 완료 알림
  notifyDefenseComplete(userId: string, defense: string, quantity: number) {
    this.sendToUser(userId, 'defense_complete', {
      type: 'defense',
      defense,
      quantity,
      message: `${defense} ${quantity}대 건조가 완료되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }

  // 공격 수신 알림
  notifyAttackIncoming(userId: string, attackerName: string, arrivalTime: Date) {
    this.sendToUser(userId, 'attack_incoming', {
      type: 'attack_incoming',
      attackerName,
      arrivalTime: arrivalTime.toISOString(),
      message: `${attackerName}님이 공격을 시작했습니다!`,
      timestamp: new Date().toISOString(),
    });
  }

  // 전투 결과 알림
  notifyBattleResult(userId: string, result: any) {
    this.sendToUser(userId, 'battle_result', {
      type: 'battle_result',
      result,
      message: '전투가 완료되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }

  // 함대 귀환 알림
  notifyFleetReturn(userId: string, fleet: Record<string, number>, loot: any) {
    this.sendToUser(userId, 'fleet_return', {
      type: 'fleet_return',
      fleet,
      loot,
      message: '함대가 귀환했습니다.',
      timestamp: new Date().toISOString(),
    });
  }

  // 클라이언트에서 ping 메시지 처리
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  // 게임 상태 요청 처리
  @SubscribeMessage('request_status')
  handleStatusRequest(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      client.emit('status_response', {
        connected: true,
        userId: user.userId,
        timestamp: Date.now(),
      });
    }
  }
}

