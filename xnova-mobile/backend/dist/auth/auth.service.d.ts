import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
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
    login(user: any): Promise<{
        message: string;
        user: {
            id: any;
            email: any;
            playerName: any;
            coordinate: any;
        };
        accessToken: string;
    }>;
    getProfile(userId: string): Promise<any>;
}
