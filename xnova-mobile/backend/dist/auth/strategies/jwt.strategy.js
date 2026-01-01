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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const blacklisted_token_schema_1 = require("../schemas/blacklisted-token.schema");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    blacklistedTokenModel;
    constructor(configService, blacklistedTokenModel) {
        const secret = configService.get('jwt.secret');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true,
        });
        this.configService = configService;
        this.blacklistedTokenModel = blacklistedTokenModel;
    }
    hashString(str) {
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    async validate(req, payload) {
        if (!payload.sub || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid token payload');
        }
        const token = passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token) {
            const isBlacklisted = await this.blacklistedTokenModel.findOne({
                token: this.hashString(token),
            });
            if (isBlacklisted) {
                throw new common_1.UnauthorizedException('Token has been revoked');
            }
        }
        const currentUserAgent = req.headers['user-agent'] || 'unknown';
        const hashedCurrentUserAgent = this.hashString(currentUserAgent);
        if (payload.userAgent && payload.userAgent !== hashedCurrentUserAgent) {
            throw new common_1.UnauthorizedException('Token validation failed: device mismatch');
        }
        return {
            userId: payload.sub,
            email: payload.email,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(blacklisted_token_schema_1.BlacklistedToken.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map