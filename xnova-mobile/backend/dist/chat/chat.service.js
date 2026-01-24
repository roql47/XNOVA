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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_message_schema_1 = require("./schemas/chat-message.schema");
let ChatService = class ChatService {
    chatMessageModel;
    constructor(chatMessageModel) {
        this.chatMessageModel = chatMessageModel;
    }
    async saveMessage(senderId, senderName, message) {
        const chatMessage = new this.chatMessageModel({
            senderId,
            senderName,
            message,
            timestamp: new Date(),
        });
        return chatMessage.save();
    }
    async getRecentMessages(limit = 50) {
        const messages = await this.chatMessageModel
            .find({ allianceId: null })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
        return messages.reverse().map(msg => ({
            senderId: msg.senderId,
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.timestamp,
        }));
    }
    async cleanupOldMessages() {
        const count = await this.chatMessageModel.countDocuments({ allianceId: null });
        if (count > 50) {
            const messagesToDelete = count - 50;
            const oldMessages = await this.chatMessageModel
                .find({ allianceId: null })
                .sort({ timestamp: 1 })
                .limit(messagesToDelete)
                .exec();
            const idsToDelete = oldMessages.map(msg => msg._id);
            await this.chatMessageModel.deleteMany({ _id: { $in: idsToDelete } });
        }
    }
    async saveAllianceMessage(allianceId, senderId, senderName, message) {
        const chatMessage = new this.chatMessageModel({
            allianceId,
            senderId,
            senderName,
            message,
            timestamp: new Date(),
        });
        return chatMessage.save();
    }
    async getRecentAllianceMessages(allianceId, limit = 50) {
        const messages = await this.chatMessageModel
            .find({ allianceId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
        return messages.reverse().map(msg => ({
            senderId: msg.senderId,
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.timestamp,
        }));
    }
    async cleanupOldAllianceMessages(allianceId) {
        const count = await this.chatMessageModel.countDocuments({ allianceId });
        if (count > 50) {
            const messagesToDelete = count - 50;
            const oldMessages = await this.chatMessageModel
                .find({ allianceId })
                .sort({ timestamp: 1 })
                .limit(messagesToDelete)
                .exec();
            const idsToDelete = oldMessages.map(msg => msg._id);
            await this.chatMessageModel.deleteMany({ _id: { $in: idsToDelete } });
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_message_schema_1.ChatMessage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ChatService);
//# sourceMappingURL=chat.service.js.map