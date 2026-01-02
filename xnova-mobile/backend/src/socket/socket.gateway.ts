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
import { ChatService } from '../chat/chat.service';
import { UserService } from '../user/user.service';

interface ConnectedUser {
  odId: string;
  userId: string;
  playerName?: string;
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
  private chatUsers: Set<string> = new Set(); // 채팅방에 있는 소켓 ID

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private chatService: ChatService,
    private userService: UserService,
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
      
      // DB에서 사용자 정보 조회
      const user = await this.userService.findById(userId);
      const playerName = user?.playerName || 'Unknown';
      
      // 사용자를 자신의 room에 조인
      client.join(`user:${userId}`);
      
      this.connectedUsers.set(client.id, {
        odId: client.id,
        userId,
        playerName,
      });

      console.log(`User connected: ${playerName} (${userId}, socket: ${client.id})`);
      
      // 연결 성공 알림
      client.emit('connected', { message: '연결되었습니다.', playerName });
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
      this.chatUsers.delete(client.id);
      
      // 채팅 유저 수 업데이트 브로드캐스트
      this.broadcastChatUserCount();
    }
  }

  // ===== 채팅 관련 =====

  // 채팅방 입장
  @SubscribeMessage('join_chat')
  async handleJoinChat(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      client.emit('error', { message: '인증이 필요합니다.' });
      return;
    }

    // 전체 채팅방에 조인
    client.join('global_chat');
    this.chatUsers.add(client.id);

    console.log(`User ${user.playerName} joined global chat`);

    // 최근 50개 메시지 전송
    const recentMessages = await this.chatService.getRecentMessages(50);
    client.emit('chat_history', recentMessages);

    // 채팅 유저 수 브로드캐스트
    this.broadcastChatUserCount();

    // 입장 알림
    client.emit('chat_joined', { 
      message: '채팅방에 입장했습니다.',
      userCount: this.chatUsers.size,
    });
  }

  // 채팅방 퇴장
  @SubscribeMessage('leave_chat')
  handleLeaveChat(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      client.leave('global_chat');
      this.chatUsers.delete(client.id);
      console.log(`User ${user.playerName} left global chat`);
      
      // 채팅 유저 수 브로드캐스트
      this.broadcastChatUserCount();
    }
  }

  // 메시지 전송
  @SubscribeMessage('send_chat')
  async handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      client.emit('error', { message: '인증이 필요합니다.' });
      return;
    }

    if (!data.message || data.message.trim().length === 0) {
      return;
    }

    // 메시지 길이 제한 (200자)
    const message = data.message.trim().substring(0, 200);

    // 메시지 저장
    const savedMessage = await this.chatService.saveMessage(
      user.userId,
      user.playerName || 'Unknown',
      message,
    );

    // 전체 채팅방에 브로드캐스트
    this.server.to('global_chat').emit('new_chat_message', {
      senderId: user.userId,
      senderName: user.playerName,
      message: message,
      timestamp: savedMessage.timestamp,
    });

    // 오래된 메시지 정리 (비동기로 처리)
    this.chatService.cleanupOldMessages().catch(err => {
      console.error('Failed to cleanup old messages:', err);
    });
  }

  // 채팅 유저 수 브로드캐스트
  private broadcastChatUserCount() {
    this.server.to('global_chat').emit('chat_user_count', {
      count: this.chatUsers.size,
    });
  }

  // ===== 기존 기능들 =====

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
