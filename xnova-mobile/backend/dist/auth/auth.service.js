"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const google_auth_library_1 = require("google-auth-library");
const crypto = __importStar(require("crypto"));
const user_service_1 = require("../user/user.service");
const refresh_token_schema_1 = require("./schemas/refresh-token.schema");
const blacklisted_token_schema_1 = require("./schemas/blacklisted-token.schema");
let AuthService = class AuthService {
    userService;
    jwtService;
    configService;
    refreshTokenModel;
    blacklistedTokenModel;
    googleClient;
    REFRESH_TOKEN_EXPIRY_DAYS = 30;
    ACCESS_TOKEN_EXPIRY_DAYS = 7;
    constructor(userService, jwtService, configService, refreshTokenModel, blacklistedTokenModel) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.refreshTokenModel = refreshTokenModel;
        this.blacklistedTokenModel = blacklistedTokenModel;
        this.googleClient = new google_auth_library_1.OAuth2Client();
    }
    generateAccessToken(user, clientInfo) {
        const payload = {
            email: user.email,
            sub: user._id.toString(),
            userAgent: this.hashString(clientInfo.userAgent),
            ipAddress: this.hashString(clientInfo.ipAddress),
        };
        return this.jwtService.sign(payload);
    }
    async generateRefreshToken(userId, clientInfo) {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);
        await this.refreshTokenModel.updateMany({
            userId: new mongoose_2.Types.ObjectId(userId),
            userAgent: clientInfo.userAgent,
            isRevoked: false,
        }, { isRevoked: true });
        await this.refreshTokenModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
            token: this.hashString(token),
            userAgent: clientInfo.userAgent,
            ipAddress: clientInfo.ipAddress,
            expiresAt,
            isRevoked: false,
        });
        return token;
    }
    hashString(str) {
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    async isTokenBlacklisted(token) {
        const blacklisted = await this.blacklistedTokenModel.findOne({
            token: this.hashString(token),
        });
        return !!blacklisted;
    }
    async validateRefreshToken(refreshToken, clientInfo) {
        const hashedToken = this.hashString(refreshToken);
        const storedToken = await this.refreshTokenModel.findOne({
            token: hashedToken,
            isRevoked: false,
            expiresAt: { $gt: new Date() },
        });
        if (!storedToken) {
            return null;
        }
        if (storedToken.userAgent !== clientInfo.userAgent) {
            await this.revokeRefreshToken(refreshToken);
            return null;
        }
        return storedToken;
    }
    async refreshTokens(refreshToken, clientInfo) {
        const storedToken = await this.validateRefreshToken(refreshToken, clientInfo);
        if (!storedToken) {
            throw new common_1.UnauthorizedException('유효하지 않거나 만료된 Refresh Token입니다.');
        }
        const user = await this.userService.findById(storedToken.userId.toString());
        if (!user) {
            throw new common_1.UnauthorizedException('사용자를 찾을 수 없습니다.');
        }
        await this.revokeRefreshToken(refreshToken);
        const newAccessToken = this.generateAccessToken(user, clientInfo);
        const newRefreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        };
    }
    async revokeRefreshToken(refreshToken) {
        const hashedToken = this.hashString(refreshToken);
        await this.refreshTokenModel.updateOne({ token: hashedToken }, { isRevoked: true });
    }
    async blacklistAccessToken(accessToken, reason = 'logout') {
        try {
            const decoded = this.jwtService.decode(accessToken);
            if (!decoded || !decoded.exp) {
                return;
            }
            const expiresAt = new Date(decoded.exp * 1000);
            if (expiresAt < new Date()) {
                return;
            }
            await this.blacklistedTokenModel.create({
                token: this.hashString(accessToken),
                expiresAt,
                reason,
            });
        }
        catch {
        }
    }
    async revokeAllUserTokens(userId) {
        await this.refreshTokenModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId), isRevoked: false }, { isRevoked: true });
    }
    async logout(accessToken, refreshToken) {
        await this.blacklistAccessToken(accessToken, 'logout');
        await this.revokeRefreshToken(refreshToken);
    }
    async logoutAllDevices(userId, currentAccessToken) {
        await this.blacklistAccessToken(currentAccessToken, 'logout_all');
        await this.revokeAllUserTokens(userId);
    }
    async verifyGoogleToken(idToken) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.configService.get('google.clientId'),
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email || !payload.sub) {
                throw new common_1.BadRequestException('유효하지 않은 Google 토큰입니다.');
            }
            return {
                email: payload.email,
                googleId: payload.sub,
                name: payload.name,
            };
        }
        catch {
            throw new common_1.BadRequestException('Google 토큰 검증에 실패했습니다.');
        }
    }
    async googleAuth(googleAuthDto, clientInfo) {
        const googleUser = await this.verifyGoogleToken(googleAuthDto.idToken);
        let user = await this.userService.findByGoogleId(googleUser.googleId);
        if (user) {
            return this.login(user, clientInfo);
        }
        user = await this.userService.findByEmail(googleUser.email);
        if (user) {
            await this.userService.linkGoogleAccount(user._id.toString(), googleUser.googleId);
            return this.login(user, clientInfo);
        }
        return {
            needsNickname: true,
            email: googleUser.email,
            suggestedName: googleUser.name || '',
        };
    }
    async completeGoogleSignup(googleCompleteDto, clientInfo) {
        const googleUser = await this.verifyGoogleToken(googleCompleteDto.idToken);
        const existingUser = await this.userService.findByGoogleId(googleUser.googleId);
        if (existingUser) {
            return this.login(existingUser, clientInfo);
        }
        const existingEmailUser = await this.userService.findByEmail(googleUser.email);
        if (existingEmailUser) {
            await this.userService.linkGoogleAccount(existingEmailUser._id.toString(), googleUser.googleId);
            return this.login(existingEmailUser, clientInfo);
        }
        try {
            const user = await this.userService.createGoogleUser(googleUser.email, googleUser.googleId, googleCompleteDto.playerName);
            const accessToken = this.generateAccessToken(user, clientInfo);
            const refreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
            return {
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: user._id,
                    email: user.email,
                    playerName: user.playerName,
                    coordinate: user.coordinate,
                },
                accessToken,
                refreshToken,
                expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
            };
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.ConflictException('회원가입 중 오류가 발생했습니다.');
        }
    }
    async validateUser(email, password) {
        const user = await this.userService.findByEmail(email);
        if (user && await this.userService.validatePassword(user, password)) {
            const { password: _, ...result } = user.toObject();
            return result;
        }
        return null;
    }
    async register(registerDto, clientInfo) {
        try {
            const user = await this.userService.create(registerDto.email, registerDto.password, registerDto.playerName);
            const accessToken = this.generateAccessToken(user, clientInfo);
            const refreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
            return {
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: user._id,
                    email: user.email,
                    playerName: user.playerName,
                    coordinate: user.coordinate,
                },
                accessToken,
                refreshToken,
                expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
            };
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.ConflictException('회원가입 중 오류가 발생했습니다.');
        }
    }
    async login(user, clientInfo) {
        const accessToken = this.generateAccessToken(user, clientInfo);
        const refreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
        return {
            message: '로그인 성공',
            user: {
                id: user._id,
                email: user.email,
                playerName: user.playerName,
                coordinate: user.coordinate,
            },
            accessToken,
            refreshToken,
            expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        };
    }
    async getProfile(userId) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('사용자를 찾을 수 없습니다.');
        }
        const { password: _, ...result } = user.toObject();
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, mongoose_1.InjectModel)(refresh_token_schema_1.RefreshToken.name)),
    __param(4, (0, mongoose_1.InjectModel)(blacklisted_token_schema_1.BlacklistedToken.name)),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map