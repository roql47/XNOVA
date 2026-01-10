import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';

export interface ChatMessageDto {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  // 메시지 저장
  async saveMessage(senderId: string, senderName: string, message: string): Promise<ChatMessageDocument> {
    const chatMessage = new this.chatMessageModel({
      senderId,
      senderName,
      message,
      timestamp: new Date(),
    });
    return chatMessage.save();
  }

  // 최근 메시지 조회 (기본 50개)
  async getRecentMessages(limit: number = 50): Promise<ChatMessageDto[]> {
    const messages = await this.chatMessageModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    // 시간순 정렬 (오래된 것이 먼저)
    return messages.reverse().map(msg => ({
      senderId: msg.senderId,
      senderName: msg.senderName,
      message: msg.message,
      timestamp: msg.timestamp,
    }));
  }

  // 오래된 메시지 삭제 (최근 50개만 유지)
  async cleanupOldMessages(): Promise<void> {
    const count = await this.chatMessageModel.countDocuments();
    if (count > 50) {
      const messagesToDelete = count - 50;
      const oldMessages = await this.chatMessageModel
        .find()
        .sort({ timestamp: 1 })
        .limit(messagesToDelete)
        .exec();

      const idsToDelete = oldMessages.map(msg => msg._id);
      await this.chatMessageModel.deleteMany({ _id: { $in: idsToDelete } });
    }
  }
}






