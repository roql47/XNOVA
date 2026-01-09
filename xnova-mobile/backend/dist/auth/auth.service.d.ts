import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { RegisterDto, GoogleAuthDto, GoogleCompleteDto } from './dto/auth.dto';
import { RefreshTokenDocument } from './schemas/refresh-token.schema';
import { BlacklistedTokenDocument } from './schemas/blacklisted-token.schema';
import { KakaoLinkCodeDocument } from './schemas/kakao-link-code.schema';
interface ClientInfo {
    userAgent: string;
    ipAddress: string;
}
export declare class AuthService {
    private userService;
    private jwtService;
    private configService;
    private refreshTokenModel;
    private blacklistedTokenModel;
    private kakaoLinkCodeModel;
    private googleClient;
    private readonly REFRESH_TOKEN_EXPIRY_DAYS;
    private readonly ACCESS_TOKEN_EXPIRY_DAYS;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService, refreshTokenModel: Model<RefreshTokenDocument>, blacklistedTokenModel: Model<BlacklistedTokenDocument>, kakaoLinkCodeModel: Model<KakaoLinkCodeDocument>);
    private generateAccessToken;
    private generateRefreshToken;
    private hashString;
    isTokenBlacklisted(token: string): Promise<boolean>;
    validateRefreshToken(refreshToken: string, clientInfo: ClientInfo): Promise<RefreshTokenDocument | null>;
    refreshTokens(refreshToken: string, clientInfo: ClientInfo): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    blacklistAccessToken(accessToken: string, reason?: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    logout(accessToken: string, refreshToken: string): Promise<void>;
    logoutAllDevices(userId: string, currentAccessToken: string): Promise<void>;
    verifyGoogleToken(idToken: string): Promise<{
        email: string;
        googleId: string;
        name?: string;
    }>;
    googleAuth(googleAuthDto: GoogleAuthDto, clientInfo: ClientInfo): Promise<{
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
    completeGoogleSignup(googleCompleteDto: GoogleCompleteDto, clientInfo: ClientInfo): Promise<{
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
    validateUser(email: string, password: string): Promise<any>;
    register(registerDto: RegisterDto, clientInfo: ClientInfo): Promise<{
        message: string;
        user: {
            id: Types.ObjectId;
            email: string;
            playerName: string;
            coordinate: string;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    login(user: any, clientInfo: ClientInfo): Promise<{
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
    getProfile(userId: string): Promise<any>;
    generateKakaoLinkCode(userId: string): Promise<{
        code: string;
        expiresAt: Date;
    }>;
    verifyKakaoLinkCode(code: string, clientInfo: ClientInfo): Promise<{
        accessToken: string;
        refreshToken: string;
        username: string;
    }>;
    private generateRandomCode;
}
export {};
