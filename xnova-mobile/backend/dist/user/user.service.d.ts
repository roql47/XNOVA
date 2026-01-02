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
    updateLastActivity(userId: string): Promise<void>;
    updatePlanetName(userId: string, newPlanetName: string): Promise<UserDocument | null>;
    updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    canActivateVacation(userId: string): Promise<{
        canActivate: boolean;
        reason?: string;
    }>;
    activateVacation(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deactivateVacation(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetAccount(userId: string, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(userId: string, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
