import { Document, Types } from 'mongoose';
export type UserDocument = User & Document;
export declare class Resources {
    metal: number;
    crystal: number;
    deuterium: number;
    energy: number;
}
export declare class Mines {
    metalMine: number;
    crystalMine: number;
    deuteriumMine: number;
    solarPlant: number;
    fusionReactor: number;
}
export declare class OperationRates {
    metalMine: number;
    crystalMine: number;
    deuteriumMine: number;
    solarPlant: number;
    fusionReactor: number;
    solarSatellite: number;
}
export declare class Facilities {
    robotFactory: number;
    shipyard: number;
    researchLab: number;
    nanoFactory: number;
    terraformer: number;
    allianceDepot: number;
    missileSilo: number;
    metalStorage: number;
    crystalStorage: number;
    deuteriumTank: number;
    lunarBase: number;
    sensorPhalanx: number;
    jumpGate: number;
}
export declare class PlanetInfo {
    maxFields: number;
    usedFields: number;
    temperature: number;
    planetType: string;
    isMoon: boolean;
    planetName: string;
    diameter: number;
}
export declare class ResearchLevels {
    energyTech: number;
    laserTech: number;
    ionTech: number;
    hyperspaceTech: number;
    plasmaTech: number;
    combustionDrive: number;
    impulseDrive: number;
    hyperspaceDrive: number;
    espionageTech: number;
    computerTech: number;
    astrophysics: number;
    intergalacticResearch: number;
    gravitonTech: number;
    weaponsTech: number;
    shieldTech: number;
    armorTech: number;
}
export declare class Fleet {
    smallCargo: number;
    largeCargo: number;
    lightFighter: number;
    heavyFighter: number;
    cruiser: number;
    battleship: number;
    battlecruiser: number;
    bomber: number;
    destroyer: number;
    deathstar: number;
    recycler: number;
    espionageProbe: number;
    solarSatellite: number;
    colonyShip: number;
    reaper: number;
}
export declare class Defense {
    rocketLauncher: number;
    lightLaser: number;
    heavyLaser: number;
    gaussCannon: number;
    ionCannon: number;
    plasmaTurret: number;
    smallShieldDome: number;
    largeShieldDome: number;
    antiBallisticMissile: number;
    interplanetaryMissile: number;
}
export declare class ProgressInfo {
    type: string;
    name: string;
    quantity?: number;
    startTime: Date;
    finishTime: Date;
    isDowngrade?: boolean;
}
export declare class AttackProgress {
    targetCoord: string;
    targetUserId: string;
    fleet: Record<string, number>;
    capacity: number;
    travelTime: number;
    startTime: Date;
    arrivalTime: Date;
    battleCompleted: boolean;
    transportResources?: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    missionType?: string;
    originCoord?: string;
    originPlanetId?: string;
}
export declare class IncomingAttackProgress {
    targetCoord: string;
    targetUserId: string;
    defendingCoord?: string;
    fleet: Record<string, number | string>;
    fleetVisibility?: 'full' | 'composition' | 'hidden';
    capacity: number;
    travelTime: number;
    startTime: Date;
    arrivalTime: Date;
    battleCompleted: boolean;
}
export declare class ReturnProgress {
    fleet: Record<string, number>;
    loot: Record<string, number>;
    returnTime: Date;
    startTime: Date;
    missionType: string;
    originPlanetId?: string;
}
export declare class FleetMission {
    missionId: string;
    phase: string;
    missionType: string;
    targetCoord: string;
    targetUserId?: string;
    fleet: Record<string, number>;
    capacity: number;
    travelTime: number;
    startTime: Date;
    arrivalTime: Date;
    returnTime?: Date;
    returnStartTime?: Date;
    loot?: Record<string, number>;
    transportResources?: {
        metal: number;
        crystal: number;
        deuterium: number;
    };
    originCoord?: string;
    originPlanetId?: string;
    battleCompleted?: boolean;
}
export declare class VacationMode {
    isActive: boolean;
    startTime: Date;
    minEndTime: Date;
}
export declare class CheckInInfo {
    lastCheckInDate: string | null;
    checkInStreak: number;
    weekStartDate: string | null;
}
export declare class User {
    email: string;
    password?: string;
    googleId?: string;
    playerName: string;
    coordinate: string;
    homePlanetId: string | null;
    activePlanetId: string | null;
    isAdmin: boolean;
    allianceId: Types.ObjectId | null;
    vacationMode: VacationMode;
    checkIn: CheckInInfo;
    resources: Resources;
    mines: Mines;
    operationRates: OperationRates;
    facilities: Facilities;
    planetInfo: PlanetInfo;
    researchLevels: ResearchLevels;
    fleet: Fleet;
    defense: Defense;
    constructionProgress: ProgressInfo | null;
    researchProgress: ProgressInfo | null;
    fleetProgress: ProgressInfo | null;
    defenseProgress: ProgressInfo | null;
    pendingAttack: AttackProgress | null;
    pendingReturn: ReturnProgress | null;
    incomingAttack: IncomingAttackProgress | null;
    fleetMissions: FleetMission[];
    lastResourceUpdate: Date;
    lastActivity: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, import("mongoose").DefaultSchemaOptions> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, User>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, User, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    email?: import("mongoose").SchemaDefinitionProperty<string, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    password?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    googleId?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    playerName?: import("mongoose").SchemaDefinitionProperty<string, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    coordinate?: import("mongoose").SchemaDefinitionProperty<string, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    homePlanetId?: import("mongoose").SchemaDefinitionProperty<string | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    activePlanetId?: import("mongoose").SchemaDefinitionProperty<string | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isAdmin?: import("mongoose").SchemaDefinitionProperty<boolean, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    allianceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vacationMode?: import("mongoose").SchemaDefinitionProperty<VacationMode, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    checkIn?: import("mongoose").SchemaDefinitionProperty<CheckInInfo, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    resources?: import("mongoose").SchemaDefinitionProperty<Resources, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mines?: import("mongoose").SchemaDefinitionProperty<Mines, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    operationRates?: import("mongoose").SchemaDefinitionProperty<OperationRates, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    facilities?: import("mongoose").SchemaDefinitionProperty<Facilities, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    planetInfo?: import("mongoose").SchemaDefinitionProperty<PlanetInfo, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    researchLevels?: import("mongoose").SchemaDefinitionProperty<ResearchLevels, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fleet?: import("mongoose").SchemaDefinitionProperty<Fleet, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    defense?: import("mongoose").SchemaDefinitionProperty<Defense, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    constructionProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    researchProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fleetProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    defenseProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pendingAttack?: import("mongoose").SchemaDefinitionProperty<AttackProgress | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pendingReturn?: import("mongoose").SchemaDefinitionProperty<ReturnProgress | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    incomingAttack?: import("mongoose").SchemaDefinitionProperty<IncomingAttackProgress | null, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fleetMissions?: import("mongoose").SchemaDefinitionProperty<FleetMission[], User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastResourceUpdate?: import("mongoose").SchemaDefinitionProperty<Date, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastActivity?: import("mongoose").SchemaDefinitionProperty<Date, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, User>;
