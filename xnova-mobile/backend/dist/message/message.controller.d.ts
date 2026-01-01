import { MessageService } from './message.service';
export declare class MessageController {
    private readonly messageService;
    constructor(messageService: MessageService);
    getMessages(req: any, limit: number): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/message.schema").MessageDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/message.schema").Message & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    markAsRead(req: any, id: string): Promise<import("mongoose").UpdateWriteOpResult>;
    deleteMessage(req: any, id: string): Promise<import("mongodb").DeleteResult>;
}
