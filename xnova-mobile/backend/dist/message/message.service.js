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
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("./schemas/message.schema");
const user_schema_1 = require("../user/schemas/user.schema");
let MessageService = class MessageService {
    messageModel;
    userModel;
    constructor(messageModel, userModel) {
        this.messageModel = messageModel;
        this.userModel = userModel;
    }
    async createMessage(data) {
        const newMessage = new this.messageModel({
            ...data,
            receiverId: new mongoose_2.Types.ObjectId(data.receiverId),
        });
        return newMessage.save();
    }
    async getMessages(userId, limit = 50) {
        return this.messageModel
            .find({ receiverId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    async markAsRead(messageId, userId) {
        return this.messageModel.updateOne({ _id: new mongoose_2.Types.ObjectId(messageId), receiverId: new mongoose_2.Types.ObjectId(userId) }, { isRead: true });
    }
    async deleteMessage(messageId, userId) {
        return this.messageModel.deleteOne({
            _id: new mongoose_2.Types.ObjectId(messageId),
            receiverId: new mongoose_2.Types.ObjectId(userId),
        });
    }
    async isAdmin(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return false;
        return user.coordinate === '1:1:1' && user.playerName?.toLowerCase() === 'admin';
    }
    async broadcastMessage(data) {
        const allUsers = await this.userModel.find({
            _id: { $ne: new mongoose_2.Types.ObjectId(data.senderId) }
        }).exec();
        const messages = allUsers.map(user => ({
            receiverId: user._id,
            senderName: `[공지] ${data.senderName}`,
            title: data.title,
            content: data.content,
            type: 'system',
            metadata: {
                isAnnouncement: true,
                senderId: data.senderId,
            },
        }));
        if (messages.length > 0) {
            await this.messageModel.insertMany(messages);
        }
        return { success: true, count: messages.length };
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], MessageService);
//# sourceMappingURL=message.service.js.map