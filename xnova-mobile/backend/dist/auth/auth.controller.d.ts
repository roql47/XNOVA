import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            playerName: string;
            coordinate: string;
        };
        accessToken: string;
    }>;
    login(req: any): Promise<{
        message: string;
        user: {
            id: any;
            email: any;
            playerName: any;
            coordinate: any;
        };
        accessToken: string;
    }>;
    getProfile(req: any): Promise<any>;
}
