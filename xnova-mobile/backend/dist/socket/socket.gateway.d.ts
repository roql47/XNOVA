import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat/chat.service';
export declare class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private configService;
    private chatService;
    server: Server;
    private connectedUsers;
    private chatUsers;
    constructor(jwtService: JwtService, configService: ConfigService, chatService: ChatService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinChat(client: Socket): Promise<void>;
    handleLeaveChat(client: Socket): void;
    handleSendChat(client: Socket, data: {
        message: string;
    }): Promise<void>;
    private broadcastChatUserCount;
    sendToUser(userId: string, event: string, data: any): void;
    notifyConstructionComplete(userId: string, building: string, newLevel: number): void;
    notifyResearchComplete(userId: string, research: string, newLevel: number): void;
    notifyFleetComplete(userId: string, fleet: string, quantity: number): void;
    notifyDefenseComplete(userId: string, defense: string, quantity: number): void;
    notifyAttackIncoming(userId: string, attackerName: string, arrivalTime: Date): void;
    notifyBattleResult(userId: string, result: any): void;
    notifyFleetReturn(userId: string, fleet: Record<string, number>, loot: any): void;
    handlePing(client: Socket): void;
    handleStatusRequest(client: Socket): void;
}
