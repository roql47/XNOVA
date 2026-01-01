import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UserService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    generatePlanetInfo(position: number, isHomeWorld?: boolean): {
        maxFields: number;
        temperature: number;
        planetType: string;
        diameter: number;
    };
    create(email: string, password: string, playerName: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    findByCoordinate(coordinate: string): Promise<UserDocument | null>;
    findAll(): Promise<UserDocument[]>;
    update(id: string, updateData: Partial<User>): Promise<UserDocument | null>;
    generateUniqueCoordinate(): Promise<string>;
    getPlayersBySystem(galaxy: number, system: number): Promise<UserDocument[]>;
    validatePassword(user: UserDocument, password: string): Promise<boolean>;
    findByGoogleId(googleId: string): Promise<UserDocument | null>;
    createGoogleUser(email: string, googleId: string, playerName: string): Promise<UserDocument>;
    linkGoogleAccount(userId: string, googleId: string): Promise<UserDocument | null>;
}
