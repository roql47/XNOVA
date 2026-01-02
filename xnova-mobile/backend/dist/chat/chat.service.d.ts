import { Model } from 'mongoose';
import { ChatMessageDocument } from './schemas/chat-message.schema';
export interface ChatMessageDto {
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
}
export declare class ChatService {
    private chatMessageModel;
    constructor(chatMessageModel: Model<ChatMessageDocument>);
    saveMessage(senderId: string, senderName: string, message: string): Promise<ChatMessageDocument>;
    getRecentMessages(limit?: number): Promise<ChatMessageDto[]>;
    cleanupOldMessages(): Promise<void>;
}
