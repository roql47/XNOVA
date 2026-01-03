import { PlanetService } from './planet.service';
export declare class PlanetController {
    private planetService;
    constructor(planetService: PlanetService);
    getMyPlanets(req: any): Promise<{
        success: boolean;
        activePlanetId: string;
        planets: {
            _id: string;
            id: string;
            name: string;
            coordinate: string;
            isHomePlanet: boolean;
            isHomeworld: boolean;
            type: string;
            planetInfo: {
                planetName: string;
                maxFields: number;
                usedFields: number;
                temperature: number;
                planetType: string;
            };
            resources: any;
        }[];
    }>;
    getPlanetDetail(req: any, planetId: string): Promise<{
        success: boolean;
        error: string;
        planet?: undefined;
    } | {
        success: boolean;
        planet: {
            id: string;
            name: string;
            coordinate: string;
            isHomeworld: boolean;
            type: string;
            resources: import("./schemas/planet.schema").PlanetResources;
            mines: import("./schemas/planet.schema").PlanetMines;
            facilities: import("./schemas/planet.schema").PlanetFacilities;
            fleet: import("./schemas/planet.schema").PlanetFleet;
            defense: import("./schemas/planet.schema").PlanetDefense;
            planetInfo: import("./schemas/planet.schema").PlanetInfo;
            constructionProgress: import("./schemas/planet.schema").ProgressInfo | null;
            fleetProgress: import("./schemas/planet.schema").ProgressInfo | null;
            defenseProgress: import("./schemas/planet.schema").ProgressInfo | null;
            lastResourceUpdate: Date;
        };
        error?: undefined;
    }>;
    switchPlanet(req: any, body: {
        planetId: string;
    }): Promise<{
        success: boolean;
        message: string;
        planet: {
            id: any;
            name: any;
            coordinate: any;
        };
    }>;
    abandonPlanet(req: any, body: {
        planetId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    renamePlanet(req: any, body: {
        planetId: string;
        newName: string;
    }): Promise<{
        success: boolean;
        message: string;
        planet: {
            id: string;
            name: string;
            coordinate: string;
        };
    }>;
}
