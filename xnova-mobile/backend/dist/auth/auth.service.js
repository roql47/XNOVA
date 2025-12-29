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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
let AuthService = class AuthService {
    userService;
    jwtService;
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const user = await this.userService.findByEmail(email);
        if (user && await this.userService.validatePassword(user, password)) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }
    async register(registerDto) {
        try {
            const user = await this.userService.create(registerDto.email, registerDto.password, registerDto.playerName);
            const payload = { email: user.email, sub: user._id };
            return {
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: user._id,
                    email: user.email,
                    playerName: user.playerName,
                    coordinate: user.coordinate,
                },
                accessToken: this.jwtService.sign(payload),
            };
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.ConflictException('회원가입 중 오류가 발생했습니다.');
        }
    }
    async login(user) {
        const payload = { email: user.email, sub: user._id };
        return {
            message: '로그인 성공',
            user: {
                id: user._id,
                email: user.email,
                playerName: user.playerName,
                coordinate: user.coordinate,
            },
            accessToken: this.jwtService.sign(payload),
        };
    }
    async getProfile(userId) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('사용자를 찾을 수 없습니다.');
        }
        const { password, ...result } = user.toObject();
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map