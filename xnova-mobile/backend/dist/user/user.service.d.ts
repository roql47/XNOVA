import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UserService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(email: string, password: string, playerName: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    findByCoordinate(coordinate: string): Promise<UserDocument | null>;
    findAll(): Promise<UserDocument[]>;
    update(id: string, updateData: Partial<User>): Promise<UserDocument | null>;
    generateUniqueCoordinate(): Promise<string>;
    getPlayersBySystem(galaxy: number, system: number): Promise<UserDocument[]>;
    validatePassword(user: UserDocument, password: string): Promise<boolean>;
}
