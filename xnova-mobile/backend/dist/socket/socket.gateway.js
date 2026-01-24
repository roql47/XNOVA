"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const chat_service_1 = require("../chat/chat.service");
const user_service_1 = require("../user/user.service");
const alliance_service_1 = require("../alliance/alliance.service");
let SocketGateway = class SocketGateway {
    jwtService;
    configService;
    chatService;
    userService;
    allianceService;
    server;
    connectedUsers = new Map();
    chatUsers = new Set();
    allianceChatUsers = new Map();
    constructor(jwtService, configService, chatService, userService, allianceService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.chatService = chatService;
        this.userService = userService;
        this.allianceService = allianceService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.secret'),
            });
            const userId = payload.sub;
            const user = await this.userService.findById(userId);
            const playerName = user?.playerName || 'Unknown';
            const allianceId = user?.allianceId?.toString() || undefined;
            client.join(`user:${userId}`);
            if (allianceId) {
                client.join(`alliance:${allianceId}`);
            }
            this.connectedUsers.set(client.id, {
                odId: client.id,
                userId,
                playerName,
                allianceId,
            });
            console.log(`User connected: ${playerName} (${userId}, socket: ${client.id})`);
            client.emit('connected', { message: '연결되었습니다.', playerName });
        }
        catch (error) {
            console.log('Socket authentication failed:', error.message);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            console.log(`User disconnected: ${user.userId} (socket: ${client.id})`);
            this.connectedUsers.delete(client.id);
            this.chatUsers.delete(client.id);
            this.broadcastChatUserCount();
        }
    }
    async handleJoinChat(client) {
        const user = this.connectedUsers.get(client.id);
        if (!user) {
            client.emit('error', { message: '인증이 필요합니다.' });
            return;
        }
        client.join('global_chat');
        this.chatUsers.add(client.id);
        console.log(`User ${user.playerName} joined global chat`);
        const recentMessages = await this.chatService.getRecentMessages(50);
        client.emit('chat_history', recentMessages);
        this.broadcastChatUserCount();
        client.emit('chat_joined', {
            message: '채팅방에 입장했습니다.',
            userCount: this.chatUsers.size,
        });
    }
    handleLeaveChat(client) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            client.leave('global_chat');
            this.chatUsers.delete(client.id);
            console.log(`User ${user.playerName} left global chat`);
            this.broadcastChatUserCount();
        }
    }
    async handleSendChat(client, data) {
        const user = this.connectedUsers.get(client.id);
        if (!user) {
            client.emit('error', { message: '인증이 필요합니다.' });
            return;
        }
        if (!data.message || data.message.trim().length === 0) {
            return;
        }
        const message = data.message.trim().substring(0, 200);
        const savedMessage = await this.chatService.saveMessage(user.userId, user.playerName || 'Unknown', message);
        this.server.to('global_chat').emit('new_chat_message', {
            senderId: user.userId,
            senderName: user.playerName,
            message: message,
            timestamp: savedMessage.timestamp,
        });
        this.chatService.cleanupOldMessages().catch(err => {
            console.error('Failed to cleanup old messages:', err);
        });
    }
    broadcastChatUserCount() {
        this.server.to('global_chat').emit('chat_user_count', {
            count: this.chatUsers.size,
        });
    }
    async handleJoinAllianceChat(client) {
        const user = this.connectedUsers.get(client.id);
        if (!user) {
            client.emit('alliance_chat_error', { message: '인증이 필요합니다.' });
            return;
        }
        if (!user.allianceId) {
            client.emit('alliance_chat_error', { message: '연합에 가입되어 있지 않습니다.' });
            return;
        }
        let allianceTag = '';
        try {
            const alliance = await this.allianceService.findById(user.allianceId);
            allianceTag = alliance?.tag || '';
        }
        catch (e) {
        }
        const allianceRoom = `alliance_chat:${user.allianceId}`;
        client.join(allianceRoom);
        if (!this.allianceChatUsers.has(user.allianceId)) {
            this.allianceChatUsers.set(user.allianceId, new Set());
        }
        this.allianceChatUsers.get(user.allianceId).add(client.id);
        console.log(`User ${user.playerName} joined alliance chat (${allianceTag})`);
        const recentMessages = await this.chatService.getRecentAllianceMessages(user.allianceId, 50);
        client.emit('alliance_chat_history', recentMessages);
        this.broadcastAllianceChatUserCount(user.allianceId);
        client.emit('alliance_chat_joined', {
            message: '연합 채팅방에 입장했습니다.',
            userCount: this.allianceChatUsers.get(user.allianceId)?.size || 0,
            allianceTag: allianceTag,
        });
    }
    handleLeaveAllianceChat(client) {
        const user = this.connectedUsers.get(client.id);
        if (user && user.allianceId) {
            const allianceRoom = `alliance_chat:${user.allianceId}`;
            client.leave(allianceRoom);
            if (this.allianceChatUsers.has(user.allianceId)) {
                this.allianceChatUsers.get(user.allianceId).delete(client.id);
            }
            console.log(`User ${user.playerName} left alliance chat`);
            this.broadcastAllianceChatUserCount(user.allianceId);
        }
    }
    async handleSendAllianceChat(client, data) {
        const user = this.connectedUsers.get(client.id);
        if (!user) {
            client.emit('alliance_chat_error', { message: '인증이 필요합니다.' });
            return;
        }
        if (!user.allianceId) {
            client.emit('alliance_chat_error', { message: '연합에 가입되어 있지 않습니다.' });
            return;
        }
        if (!data.message || data.message.trim().length === 0) {
            return;
        }
        const message = data.message.trim().substring(0, 200);
        const savedMessage = await this.chatService.saveAllianceMessage(user.allianceId, user.userId, user.playerName || 'Unknown', message);
        const allianceRoom = `alliance_chat:${user.allianceId}`;
        this.server.to(allianceRoom).emit('new_alliance_chat_message', {
            senderId: user.userId,
            senderName: user.playerName,
            message: message,
            timestamp: savedMessage.timestamp,
        });
        this.chatService.cleanupOldAllianceMessages(user.allianceId).catch(err => {
            console.error('Failed to cleanup old alliance messages:', err);
        });
    }
    broadcastAllianceChatUserCount(allianceId) {
        const allianceRoom = `alliance_chat:${allianceId}`;
        const userCount = this.allianceChatUsers.get(allianceId)?.size || 0;
        this.server.to(allianceRoom).emit('alliance_chat_user_count', {
            count: userCount,
        });
    }
    sendToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    notifyConstructionComplete(userId, building, newLevel) {
        this.sendToUser(userId, 'construction_complete', {
            type: 'construction',
            building,
            newLevel,
            message: `${building} 건설이 완료되었습니다. (Lv.${newLevel})`,
            timestamp: new Date().toISOString(),
        });
    }
    notifyResearchComplete(userId, research, newLevel) {
        this.sendToUser(userId, 'research_complete', {
            type: 'research',
            research,
            newLevel,
            message: `${research} 연구가 완료되었습니다. (Lv.${newLevel})`,
            timestamp: new Date().toISOString(),
        });
    }
    notifyFleetComplete(userId, fleet, quantity) {
        this.sendToUser(userId, 'fleet_complete', {
            type: 'fleet',
            fleet,
            quantity,
            message: `${fleet} ${quantity}대 건조가 완료되었습니다.`,
            timestamp: new Date().toISOString(),
        });
    }
    notifyDefenseComplete(userId, defense, quantity) {
        this.sendToUser(userId, 'defense_complete', {
            type: 'defense',
            defense,
            quantity,
            message: `${defense} ${quantity}대 건조가 완료되었습니다.`,
            timestamp: new Date().toISOString(),
        });
    }
    notifyAttackIncoming(userId, attackerName, arrivalTime) {
        this.sendToUser(userId, 'attack_incoming', {
            type: 'attack_incoming',
            attackerName,
            arrivalTime: arrivalTime.toISOString(),
            message: `${attackerName}님이 공격을 시작했습니다!`,
            timestamp: new Date().toISOString(),
        });
    }
    notifyBattleResult(userId, result) {
        this.sendToUser(userId, 'battle_result', {
            type: 'battle_result',
            result,
            message: '전투가 완료되었습니다.',
            timestamp: new Date().toISOString(),
        });
    }
    notifyFleetReturn(userId, fleet, loot) {
        this.sendToUser(userId, 'fleet_return', {
            type: 'fleet_return',
            fleet,
            loot,
            message: '함대가 귀환했습니다.',
            timestamp: new Date().toISOString(),
        });
    }
    handlePing(client) {
        client.emit('pong', { timestamp: Date.now() });
    }
    handleStatusRequest(client) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            client.emit('status_response', {
                connected: true,
                userId: user.userId,
                timestamp: Date.now(),
            });
        }
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleSendChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_alliance_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinAllianceChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_alliance_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "handleLeaveAllianceChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_alliance_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleSendAllianceChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_status'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "handleStatusRequest", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/game',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        chat_service_1.ChatService,
        user_service_1.UserService,
        alliance_service_1.AllianceService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map