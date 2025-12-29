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
let SocketGateway = class SocketGateway {
    jwtService;
    configService;
    server;
    connectedUsers = new Map();
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
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
            client.join(`user:${userId}`);
            this.connectedUsers.set(client.id, {
                odId: client.id,
                userId,
            });
            console.log(`User connected: ${userId} (socket: ${client.id})`);
            client.emit('connected', { message: '연결되었습니다.' });
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
        }
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
        config_1.ConfigService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map