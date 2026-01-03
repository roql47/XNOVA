import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createMessage(data: {
    receiverId: string;
    senderName: string;
    title: string;
    content: string;
    type: 'battle' | 'system' | 'player';
    metadata?: any;
  }) {
    const newMessage = new this.messageModel({
      ...data,
      receiverId: new Types.ObjectId(data.receiverId),
    });
    return newMessage.save();
  }

  async getMessages(userId: string, limit = 50) {
    return this.messageModel
      .find({ receiverId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markAsRead(messageId: string, userId: string) {
    return this.messageModel.updateOne(
      { _id: new Types.ObjectId(messageId), receiverId: new Types.ObjectId(userId) },
      { isRead: true },
    );
  }

  async deleteMessage(messageId: string, userId: string) {
    return this.messageModel.deleteOne({
      _id: new Types.ObjectId(messageId),
      receiverId: new Types.ObjectId(userId),
    });
  }

  // 관리자 권한 체크 (좌표 1:1:1 & 행성명 admin)
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return false;
    return user.coordinate === '1:1:1' && user.playerName?.toLowerCase() === 'admin';
  }

  // 전체 메시지 발송
  async broadcastMessage(data: {
    senderId: string;
    senderName: string;
    title: string;
    content: string;
  }): Promise<{ success: boolean; count: number }> {
    // 모든 유저 조회 (발신자 제외)
    const allUsers = await this.userModel.find({ 
      _id: { $ne: new Types.ObjectId(data.senderId) } 
    }).exec();

    // 각 유저에게 메시지 생성
    const messages = allUsers.map(user => ({
      receiverId: user._id,
      senderName: `[공지] ${data.senderName}`,
      title: data.title,
      content: data.content,
      type: 'system' as const,
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
}

