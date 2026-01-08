import { Document } from 'mongoose';
export type DebrisDocument = Debris & Document & {
    createdAt: Date;
    updatedAt: Date;
};
export declare class Debris {
    coordinate: string;
    metal: number;
    crystal: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const DebrisSchema: import("mongoose").Schema<Debris, import("mongoose").Model<Debris, any, any, any, Document<unknown, any, Debris, any, import("mongoose").DefaultSchemaOptions> & Debris & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, Debris>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Debris, Document<unknown, {}, Debris, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Debris & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    coordinate?: import("mongoose").SchemaDefinitionProperty<string, Debris, Document<unknown, {}, Debris, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Debris & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metal?: import("mongoose").SchemaDefinitionProperty<number, Debris, Document<unknown, {}, Debris, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Debris & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    crystal?: import("mongoose").SchemaDefinitionProperty<number, Debris, Document<unknown, {}, Debris, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Debris & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Debris, Document<unknown, {}, Debris, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Debris & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Debris, Document<unknown, {}, Debris, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Debris & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Debris>;
