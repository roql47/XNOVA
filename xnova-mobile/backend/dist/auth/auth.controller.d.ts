import { AuthService } from './auth.service';
import { RegisterDto, GoogleAuthDto, GoogleCompleteDto, RefreshTokenDto, LogoutDto, KakaoLinkVerifyDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private getClientInfo;
    register(registerDto: RegisterDto, req: any, userAgent: string, ip: string): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            playerName: string;
            coordinate: string;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    login(req: any, userAgent: string, ip: string): Promise<{
        message: string;
        user: {
            id: any;
            email: any;
            playerName: any;
            coordinate: any;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    googleAuth(googleAuthDto: GoogleAuthDto, req: any, userAgent: string, ip: string): Promise<{
        message: string;
        user: {
            id: any;
            email: any;
            playerName: any;
            coordinate: any;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    } | {
        needsNickname: boolean;
        email: string;
        suggestedName: string;
    }>;
    completeGoogleSignup(googleCompleteDto: GoogleCompleteDto, req: any, userAgent: string, ip: string): Promise<{
        message: string;
        user: {
            id: any;
            email: any;
            playerName: any;
            coordinate: any;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    refreshToken(refreshTokenDto: RefreshTokenDto, req: any, userAgent: string, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(req: any, logoutDto: LogoutDto, authHeader: string): Promise<{
        message: string;
    }>;
    logoutAllDevices(req: any, authHeader: string): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<any>;
    generateKakaoLinkCode(req: any): Promise<{
        success: boolean;
        code: string;
        expiresAt: Date;
        message: string;
    }>;
    verifyKakaoLinkCode(kakaoLinkVerifyDto: KakaoLinkVerifyDto, req: any, userAgent: string, ip: string): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        username: string;
    }>;
}
