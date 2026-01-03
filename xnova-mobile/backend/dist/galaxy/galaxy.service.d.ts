import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { PlanetDocument } from '../planet/schemas/planet.schema';
import { Debris, DebrisDocument } from './schemas/debris.schema';
import { MessageService } from '../message/message.service';
export interface PlanetInfo {
    position: number;
    coordinate: string;
    playerName: string | null;
    playerId: string | null;
    isOwnPlanet: boolean;
    hasDebris: boolean;
    debrisAmount?: {
        metal: number;
        crystal: number;
    };
    hasMoon: boolean;
    lastActivity: string | null;
}
export interface SpyReport {
    targetCoord: string;
    targetName: string;
    resources?: {
        metal: number;
        crystal: number;
        deuterium: number;
        energy: number;
    };
    fleet?: Record<string, number>;
    defense?: Record<string, number>;
    buildings?: Record<string, number>;
    research?: Record<string, number>;
    probesLost: number;
    probesSurvived: number;
    stScore: number;
    mySpyLevel: number;
    targetSpyLevel: number;
}
export declare class GalaxyService {
    private userModel;
    private planetModel;
    private debrisModel;
    private messageService;
    constructor(userModel: Model<UserDocument>, planetModel: Model<PlanetDocument>, debrisModel: Model<DebrisDocument>, messageService: MessageService);
    getGalaxyMap(galaxy: number, system: number, currentUserId: string): Promise<PlanetInfo[]>;
    updateDebris(coordinate: string, metal: number, crystal: number): Promise<void>;
    getDebris(coordinate: string): Promise<(import("mongoose").Document<unknown, {}, DebrisDocument, {}, import("mongoose").DefaultSchemaOptions> & Debris & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    consumeDebris(coordinate: string, metal: number, crystal: number): Promise<void>;
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
    spyOnPlanet(attackerId: string, targetCoord: string, probeCount: number): Promise<{
        success: boolean;
        error: string;
        report?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        report: SpyReport;
        message: string;
        error?: undefined;
    }>;
    private getTotalFleetCount;
    private calculateCurrentResources;
    private generateSpyReport;
    private filterNonZero;
    private formatSpyReportContent;
}
