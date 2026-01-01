import { Document } from 'mongoose';
export type BlacklistedTokenDocument = BlacklistedToken & Document;
export declare class BlacklistedToken {
    token: string;
    expiresAt: Date;
    reason: string;
}
export declare const BlacklistedTokenSchema: import("mongoose").Schema<BlacklistedToken, import("mongoose").Model<BlacklistedToken, any, any, any, Document<unknown, any, BlacklistedToken, any, import("mongoose").DefaultSchemaOptions> & BlacklistedToken & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, BlacklistedToken>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BlacklistedToken, Document<unknown, {}, BlacklistedToken, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<BlacklistedToken & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    token?: import("mongoose").SchemaDefinitionProperty<string, BlacklistedToken, Document<unknown, {}, BlacklistedToken, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<BlacklistedToken & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, BlacklistedToken, Document<unknown, {}, BlacklistedToken, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<BlacklistedToken & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<string, BlacklistedToken, Document<unknown, {}, BlacklistedToken, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<BlacklistedToken & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, BlacklistedToken>;
