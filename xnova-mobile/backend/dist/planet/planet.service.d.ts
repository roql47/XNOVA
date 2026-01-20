import { Model } from 'mongoose';
import { PlanetDocument } from './schemas/planet.schema';
import { UserService } from '../user/user.service';
import { MessageService } from '../message/message.service';
export declare const MAX_PLANETS = 9;
export declare class PlanetService {
    private planetModel;
    private userService;
    private messageService;
    constructor(planetModel: Model<PlanetDocument>, userService: UserService, messageService: MessageService);
    createPlanet(ownerId: string, coordinate: string, name: string, isHomeworld?: boolean): Promise<PlanetDocument>;
    getPlanetsByOwner(ownerId: string): Promise<PlanetDocument[]>;
    getPlanetById(planetId: string): Promise<PlanetDocument>;
    getPlanetByCoordinate(coordinate: string): Promise<PlanetDocument | null>;
    getPlanetCount(ownerId: string): Promise<number>;
    switchActivePlanet(userId: string, planetId: string): Promise<any>;
    abandonPlanet(userId: string, planetId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    renamePlanet(userId: string, planetId: string, newName: string): Promise<PlanetDocument>;
    updatePlanetResources(planetId: string, resources: {
        metal?: number;
        crystal?: number;
        deuterium?: number;
        energy?: number;
    }): Promise<void>;
    isCoordinateEmpty(coordinate: string): Promise<boolean>;
    savePlanet(planet: PlanetDocument): Promise<PlanetDocument>;
    getUserActivePlanetId(userId: string): Promise<{
        activePlanetId: string | null;
    } | null>;
    getAllPlanetsWithHomeworld(userId: string): Promise<{
        activePlanetId: string;
        planets: Array<{
            id: string;
            name: string;
            coordinate: string;
            isHomePlanet: boolean;
            type: string;
            maxFields: number;
            usedFields: number;
            temperature: number;
            planetType: string;
            resources: any;
        }>;
    }>;
    private calculateUsedFieldsForUser;
    private calculateUsedFieldsForPlanet;
}
