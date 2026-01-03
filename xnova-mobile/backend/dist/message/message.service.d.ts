import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { UserDocument } from '../user/schemas/user.schema';
export declare class MessageService {
    private messageModel;
    private userModel;
    constructor(messageModel: Model<MessageDocument>, userModel: Model<UserDocument>);
    createMessage(data: {
        receiverId: string;
        senderName: string;
        title: string;
        content: string;
        type: 'battle' | 'system' | 'player';
        metadata?: any;
    }): Promise<import("mongoose").Document<unknown, {}, MessageDocument, {}, import("mongoose").DefaultSchemaOptions> & Message & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getMessages(userId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, MessageDocument, {}, import("mongoose").DefaultSchemaOptions> & Message & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    markAsRead(messageId: string, userId: string): Promise<import("mongoose").UpdateWriteOpResult>;
    deleteMessage(messageId: string, userId: string): Promise<import("mongodb").DeleteResult>;
    isAdmin(userId: string): Promise<boolean>;
    broadcastMessage(data: {
        senderId: string;
        senderName: string;
        title: string;
        content: string;
    }): Promise<{
        success: boolean;
        count: number;
    }>;
}
