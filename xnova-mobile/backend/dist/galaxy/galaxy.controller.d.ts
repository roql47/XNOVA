import { GalaxyService } from './galaxy.service';
declare class SpyRequestDto {
    targetCoord: string;
    probeCount: number;
}
export declare class GalaxyController {
    private galaxyService;
    constructor(galaxyService: GalaxyService);
    getGalaxyMap(galaxy: string, system: string, req: any): Promise<{
        error: string;
        galaxy?: undefined;
        system?: undefined;
        planets?: undefined;
    } | {
        galaxy: number;
        system: number;
        planets: import("./galaxy.service").PlanetInfo[];
        error?: undefined;
    }>;
    getPlayerInfo(playerId: string, req: any): Promise<{
        resources?: import("../user/schemas/user.schema").Resources | undefined;
        mines?: import("../user/schemas/user.schema").Mines | undefined;
        facilities?: import("../user/schemas/user.schema").Facilities | undefined;
        playerName: string;
        coordinate: string;
        isOwnPlanet: boolean;
    } | null>;
    getActiveSystems(galaxy: string): Promise<{
        error: string;
        galaxy?: undefined;
        activeSystems?: undefined;
        totalActive?: undefined;
    } | {
        galaxy: number;
        activeSystems: number[];
        totalActive: number;
        error?: undefined;
    }>;
    spyOnPlanet(body: SpyRequestDto, req: any): Promise<{
        success: boolean;
        message: string;
        missionId: string;
        travelTime: number;
        arrivalTime: Date;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
export {};
