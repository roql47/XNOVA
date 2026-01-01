import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
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
}

