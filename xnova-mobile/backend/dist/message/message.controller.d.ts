import { MessageService } from './message.service';
import { UserService } from '../user/user.service';
declare class SendMessageDto {
    receiverCoordinate: string;
    title: string;
    content: string;
}
declare class BroadcastMessageDto {
    title: string;
    content: string;
}
export declare class MessageController {
    private readonly messageService;
    private readonly userService;
    constructor(messageService: MessageService, userService: UserService);
    getMessages(req: any, limit: number): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/message.schema").MessageDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/message.schema").Message & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    sendMessage(req: any, dto: SendMessageDto): Promise<{
        success: boolean;
        message: string;
    }>;
    markAsRead(req: any, id: string): Promise<import("mongoose").UpdateWriteOpResult>;
    deleteMessage(req: any, id: string): Promise<import("mongodb").DeleteResult>;
    checkAdmin(req: any): Promise<{
        isAdmin: boolean;
    }>;
    broadcastMessage(req: any, dto: BroadcastMessageDto): Promise<{
        success: boolean;
        message: string;
        count?: undefined;
    } | {
        success: boolean;
        message: string;
        count: number;
    }>;
}
export {};
