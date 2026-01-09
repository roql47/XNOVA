import { Document, Types } from 'mongoose';
export type KakaoLinkCodeDocument = KakaoLinkCode & Document;
export declare class KakaoLinkCode {
    userId: Types.ObjectId;
    code: string;
    expiresAt: Date;
    used: boolean;
}
export declare const KakaoLinkCodeSchema: import("mongoose").Schema<KakaoLinkCode, import("mongoose").Model<KakaoLinkCode, any, any, any, Document<unknown, any, KakaoLinkCode, any, import("mongoose").DefaultSchemaOptions> & KakaoLinkCode & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, KakaoLinkCode>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, KakaoLinkCode, Document<unknown, {}, KakaoLinkCode, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<KakaoLinkCode & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, KakaoLinkCode, Document<unknown, {}, KakaoLinkCode, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<KakaoLinkCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    code?: import("mongoose").SchemaDefinitionProperty<string, KakaoLinkCode, Document<unknown, {}, KakaoLinkCode, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<KakaoLinkCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, KakaoLinkCode, Document<unknown, {}, KakaoLinkCode, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<KakaoLinkCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    used?: import("mongoose").SchemaDefinitionProperty<boolean, KakaoLinkCode, Document<unknown, {}, KakaoLinkCode, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<KakaoLinkCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, KakaoLinkCode>;
