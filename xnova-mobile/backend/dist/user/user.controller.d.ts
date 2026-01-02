import { UserService } from './user.service';
declare class UpdatePlanetNameDto {
    planetName: string;
}
declare class UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
}
declare class ConfirmPasswordDto {
    password: string;
}
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getProfile(req: any): Promise<any>;
    updatePlanetName(req: any, dto: UpdatePlanetNameDto): Promise<{
        success: boolean;
        message: string;
        planetName?: undefined;
    } | {
        success: boolean;
        message: string;
        planetName: string;
    }>;
    updatePassword(req: any, dto: UpdatePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getVacationStatus(req: any): Promise<{
        error: string;
        isActive?: undefined;
        startTime?: undefined;
        minEndTime?: undefined;
        canActivate?: undefined;
        canActivateReason?: undefined;
    } | {
        isActive: boolean;
        startTime: Date | null;
        minEndTime: Date | null;
        canActivate: boolean;
        canActivateReason: string | undefined;
        error?: undefined;
    }>;
    activateVacation(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deactivateVacation(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    resetAccount(req: any, dto: ConfirmPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(req: any, dto: ConfirmPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
