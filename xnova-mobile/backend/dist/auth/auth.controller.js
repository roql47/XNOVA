"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const throttler_1 = require("@nestjs/throttler");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    getClientInfo(req, userAgent, ip) {
        return {
            userAgent: userAgent || req.headers['user-agent'] || 'unknown',
            ipAddress: ip || req.ip || req.connection?.remoteAddress || 'unknown',
        };
    }
    async register(registerDto, req, userAgent, ip) {
        const clientInfo = this.getClientInfo(req, userAgent, ip);
        return this.authService.register(registerDto, clientInfo);
    }
    async login(req, userAgent, ip) {
        const clientInfo = this.getClientInfo(req, userAgent, ip);
        return this.authService.login(req.user, clientInfo);
    }
    async googleAuth(googleAuthDto, req, userAgent, ip) {
        const clientInfo = this.getClientInfo(req, userAgent, ip);
        return this.authService.googleAuth(googleAuthDto, clientInfo);
    }
    async completeGoogleSignup(googleCompleteDto, req, userAgent, ip) {
        const clientInfo = this.getClientInfo(req, userAgent, ip);
        return this.authService.completeGoogleSignup(googleCompleteDto, clientInfo);
    }
    async refreshToken(refreshTokenDto, req, userAgent, ip) {
        const clientInfo = this.getClientInfo(req, userAgent, ip);
        return this.authService.refreshTokens(refreshTokenDto.refreshToken, clientInfo);
    }
    async logout(req, logoutDto, authHeader) {
        const accessToken = authHeader?.replace('Bearer ', '') || '';
        await this.authService.logout(accessToken, logoutDto.refreshToken);
        return { message: '로그아웃 되었습니다.' };
    }
    async logoutAllDevices(req, authHeader) {
        const accessToken = authHeader?.replace('Bearer ', '') || '';
        await this.authService.logoutAllDevices(req.user.userId, accessToken);
        return { message: '모든 기기에서 로그아웃 되었습니다.' };
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.userId);
    }
    async generateKakaoLinkCode(req) {
        const result = await this.authService.generateKakaoLinkCode(req.user.userId);
        return {
            success: true,
            code: result.code,
            expiresAt: result.expiresAt,
            message: '카카오톡에서 "!인증 ' + result.code + '" 를 입력하세요.',
        };
    }
    async verifyKakaoLinkCode(kakaoLinkVerifyDto, req, userAgent, ip) {
        const clientInfo = this.getClientInfo(req, userAgent, ip);
        const result = await this.authService.verifyKakaoLinkCode(kakaoLinkVerifyDto.code, clientInfo);
        return {
            success: true,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            username: result.username,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('user-agent')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.GoogleAuthDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    (0, common_1.Post)('google/complete'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.GoogleCompleteDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeGoogleSignup", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RefreshTokenDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.LogoutDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout/all'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAllDevices", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('kakao-link/generate'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateKakaoLinkCode", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('kakao-link/verify'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.KakaoLinkVerifyDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyKakaoLinkCode", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map