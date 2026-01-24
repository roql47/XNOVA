import { Document, Types } from 'mongoose';
export type AllianceDocument = Alliance & Document;
export declare class AllianceRank {
    name: string;
    delete: boolean;
    kick: boolean;
    applications: boolean;
    memberlist: boolean;
    manageApplications: boolean;
    administrate: boolean;
    onlineStatus: boolean;
    mails: boolean;
    rightHand: boolean;
}
export declare const AllianceRankSchema: import("mongoose").Schema<AllianceRank, import("mongoose").Model<AllianceRank, any, any, any, Document<unknown, any, AllianceRank, any, import("mongoose").DefaultSchemaOptions> & AllianceRank & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, AllianceRank>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AllianceRank, Document<unknown, {}, AllianceRank, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    delete?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    kick?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    applications?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    memberlist?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    manageApplications?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    administrate?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    onlineStatus?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mails?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rightHand?: import("mongoose").SchemaDefinitionProperty<boolean, AllianceRank, Document<unknown, {}, AllianceRank, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceRank & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AllianceRank>;
export declare class AllianceMember {
    userId: Types.ObjectId;
    playerName: string;
    coordinate: string;
    rankName: string | null;
    joinedAt: Date;
}
export declare const AllianceMemberSchema: import("mongoose").Schema<AllianceMember, import("mongoose").Model<AllianceMember, any, any, any, Document<unknown, any, AllianceMember, any, import("mongoose").DefaultSchemaOptions> & AllianceMember & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, AllianceMember>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AllianceMember, Document<unknown, {}, AllianceMember, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceMember & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, AllianceMember, Document<unknown, {}, AllianceMember, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceMember & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    playerName?: import("mongoose").SchemaDefinitionProperty<string, AllianceMember, Document<unknown, {}, AllianceMember, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceMember & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    coordinate?: import("mongoose").SchemaDefinitionProperty<string, AllianceMember, Document<unknown, {}, AllianceMember, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceMember & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rankName?: import("mongoose").SchemaDefinitionProperty<string | null, AllianceMember, Document<unknown, {}, AllianceMember, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceMember & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    joinedAt?: import("mongoose").SchemaDefinitionProperty<Date, AllianceMember, Document<unknown, {}, AllianceMember, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceMember & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AllianceMember>;
export declare class AllianceApplication {
    userId: Types.ObjectId;
    playerName: string;
    coordinate: string;
    message: string;
    appliedAt: Date;
}
export declare const AllianceApplicationSchema: import("mongoose").Schema<AllianceApplication, import("mongoose").Model<AllianceApplication, any, any, any, Document<unknown, any, AllianceApplication, any, import("mongoose").DefaultSchemaOptions> & AllianceApplication & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, AllianceApplication>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AllianceApplication, Document<unknown, {}, AllianceApplication, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceApplication & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, AllianceApplication, Document<unknown, {}, AllianceApplication, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceApplication & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    playerName?: import("mongoose").SchemaDefinitionProperty<string, AllianceApplication, Document<unknown, {}, AllianceApplication, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceApplication & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    coordinate?: import("mongoose").SchemaDefinitionProperty<string, AllianceApplication, Document<unknown, {}, AllianceApplication, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceApplication & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    message?: import("mongoose").SchemaDefinitionProperty<string, AllianceApplication, Document<unknown, {}, AllianceApplication, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceApplication & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appliedAt?: import("mongoose").SchemaDefinitionProperty<Date, AllianceApplication, Document<unknown, {}, AllianceApplication, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<AllianceApplication & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AllianceApplication>;
export declare class Alliance {
    tag: string;
    name: string;
    ownerId: Types.ObjectId;
    ownerTitle: string;
    externalText: string;
    internalText: string;
    logo: string;
    website: string;
    isOpen: boolean;
    ranks: AllianceRank[];
    members: AllianceMember[];
    applications: AllianceApplication[];
}
export declare const AllianceSchema: import("mongoose").Schema<Alliance, import("mongoose").Model<Alliance, any, any, any, Document<unknown, any, Alliance, any, import("mongoose").DefaultSchemaOptions> & Alliance & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, Alliance>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Alliance, Document<unknown, {}, Alliance, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    tag?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownerTitle?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    externalText?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    internalText?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    logo?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    website?: import("mongoose").SchemaDefinitionProperty<string, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isOpen?: import("mongoose").SchemaDefinitionProperty<boolean, Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ranks?: import("mongoose").SchemaDefinitionProperty<AllianceRank[], Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    members?: import("mongoose").SchemaDefinitionProperty<AllianceMember[], Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    applications?: import("mongoose").SchemaDefinitionProperty<AllianceApplication[], Alliance, Document<unknown, {}, Alliance, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Alliance & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Alliance>;
