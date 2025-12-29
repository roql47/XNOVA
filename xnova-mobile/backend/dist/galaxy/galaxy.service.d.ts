import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
export interface PlanetInfo {
    position: number;
    coordinate: string;
    playerName: string | null;
    playerId: string | null;
    isOwnPlanet: boolean;
    hasDebris: boolean;
    hasMoon: boolean;
}
export declare class GalaxyService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    getGalaxyMap(galaxy: number, system: number, currentUserId: string): Promise<PlanetInfo[]>;
    getPlayerInfo(targetUserId: string, currentUserId: string): Promise<{
        resources?: import("../user/schemas/user.schema").Resources | undefined;
        mines?: import("../user/schemas/user.schema").Mines | undefined;
        facilities?: import("../user/schemas/user.schema").Facilities | undefined;
        playerName: string;
        coordinate: string;
        isOwnPlanet: boolean;
    } | null>;
    findPlayerByCoordinate(coordinate: string): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    getActiveSystems(galaxy: number): Promise<number[]>;
}
