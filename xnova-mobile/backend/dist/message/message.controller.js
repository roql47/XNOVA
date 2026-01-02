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
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const message_service_1 = require("./message.service");
const user_service_1 = require("../user/user.service");
class SendMessageDto {
    receiverCoordinate;
    title;
    content;
}
let MessageController = class MessageController {
    messageService;
    userService;
    constructor(messageService, userService) {
        this.messageService = messageService;
        this.userService = userService;
    }
    async getMessages(req, limit) {
        return this.messageService.getMessages(req.user.userId, limit);
    }
    async sendMessage(req, dto) {
        const sender = await this.userService.findById(req.user.userId);
        if (!sender) {
            return { success: false, message: '발신자를 찾을 수 없습니다.' };
        }
        const receiver = await this.userService.findByCoordinate(dto.receiverCoordinate);
        if (!receiver) {
            return { success: false, message: '해당 좌표에 플레이어가 없습니다.' };
        }
        if (receiver._id.toString() === req.user.userId) {
            return { success: false, message: '자신에게 메시지를 보낼 수 없습니다.' };
        }
        if (!dto.title || dto.title.trim().length === 0) {
            return { success: false, message: '제목을 입력해주세요.' };
        }
        if (!dto.content || dto.content.trim().length === 0) {
            return { success: false, message: '내용을 입력해주세요.' };
        }
        if (dto.title.length > 100) {
            return { success: false, message: '제목은 100자 이하여야 합니다.' };
        }
        if (dto.content.length > 2000) {
            return { success: false, message: '내용은 2000자 이하여야 합니다.' };
        }
        await this.messageService.createMessage({
            receiverId: receiver._id.toString(),
            senderName: sender.playerName,
            title: dto.title.trim(),
            content: dto.content.trim(),
            type: 'player',
            metadata: {
                senderCoordinate: sender.coordinate,
                senderId: sender._id.toString(),
            },
        });
        return { success: true, message: '메시지를 보냈습니다.' };
    }
    async markAsRead(req, id) {
        return this.messageService.markAsRead(id, req.user.userId);
    }
    async deleteMessage(req, id) {
        return this.messageService.deleteMessage(id, req.user.userId);
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SendMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "deleteMessage", null);
exports.MessageController = MessageController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [message_service_1.MessageService,
        user_service_1.UserService])
], MessageController);
//# sourceMappingURL=message.controller.js.map