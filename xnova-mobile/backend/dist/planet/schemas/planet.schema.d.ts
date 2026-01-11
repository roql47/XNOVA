import { Document } from 'mongoose';
export type PlanetDocument = Planet & Document;
export declare class PlanetResources {
    metal: number;
    crystal: number;
    deuterium: number;
    energy: number;
}
export declare class PlanetMines {
    metalMine: number;
    crystalMine: number;
    deuteriumMine: number;
    solarPlant: number;
    fusionReactor: number;
}
export declare class PlanetFacilities {
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
export declare class PlanetFleet {
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
}
export declare class PlanetDefense {
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
export declare class PlanetInfo {
    maxFields: number;
    usedFields: number;
    tempMin: number;
    tempMax: number;
    planetType: string;
    diameter: number;
}
export declare class ProgressInfo {
    type: string;
    name: string;
    quantity?: number;
    builtCount?: number;
    singleUnitBuildTime?: number;
    startTime: Date;
    finishTime: Date;
    isDowngrade?: boolean;
}
export declare class Planet {
    ownerId: string;
    coordinate: string;
    name: string;
    isHomeworld: boolean;
    type: string;
    resources: PlanetResources;
    mines: PlanetMines;
    facilities: PlanetFacilities;
    fleet: PlanetFleet;
    defense: PlanetDefense;
    planetInfo: PlanetInfo;
    constructionProgress: ProgressInfo | null;
    fleetProgress: ProgressInfo | null;
    defenseProgress: ProgressInfo | null;
    lastResourceUpdate: Date;
}
export declare const PlanetSchema: import("mongoose").Schema<Planet, import("mongoose").Model<Planet, any, any, any, Document<unknown, any, Planet, any, import("mongoose").DefaultSchemaOptions> & Planet & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, Planet>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Planet, Document<unknown, {}, Planet, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    ownerId?: import("mongoose").SchemaDefinitionProperty<string, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    coordinate?: import("mongoose").SchemaDefinitionProperty<string, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isHomeworld?: import("mongoose").SchemaDefinitionProperty<boolean, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    resources?: import("mongoose").SchemaDefinitionProperty<PlanetResources, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mines?: import("mongoose").SchemaDefinitionProperty<PlanetMines, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    facilities?: import("mongoose").SchemaDefinitionProperty<PlanetFacilities, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fleet?: import("mongoose").SchemaDefinitionProperty<PlanetFleet, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    defense?: import("mongoose").SchemaDefinitionProperty<PlanetDefense, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    planetInfo?: import("mongoose").SchemaDefinitionProperty<PlanetInfo, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    constructionProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fleetProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    defenseProgress?: import("mongoose").SchemaDefinitionProperty<ProgressInfo | null, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastResourceUpdate?: import("mongoose").SchemaDefinitionProperty<Date, Planet, Document<unknown, {}, Planet, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Planet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Planet>;
export declare function generatePlanetCharacteristics(position: number): {
    planetType: string;
    tempMin: number;
    tempMax: number;
    maxFields: number;
    diameter: number;
};
