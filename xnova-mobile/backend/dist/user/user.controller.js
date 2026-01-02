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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_service_1 = require("./user.service");
class UpdatePlanetNameDto {
    planetName;
}
class UpdatePasswordDto {
    currentPassword;
    newPassword;
}
class ConfirmPasswordDto {
    password;
}
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async getProfile(req) {
        const user = await this.userService.findById(req.user.userId);
        if (!user) {
            return { error: '사용자를 찾을 수 없습니다.' };
        }
        const { password, ...result } = user.toObject();
        return result;
    }
    async updatePlanetName(req, dto) {
        if (!dto.planetName || dto.planetName.trim().length < 2) {
            return { success: false, message: '행성 이름은 2자 이상이어야 합니다.' };
        }
        if (dto.planetName.trim().length > 20) {
            return { success: false, message: '행성 이름은 20자 이하여야 합니다.' };
        }
        const user = await this.userService.updatePlanetName(req.user.userId, dto.planetName.trim());
        if (!user) {
            return { success: false, message: '행성 이름 변경에 실패했습니다.' };
        }
        return { success: true, message: '행성 이름이 변경되었습니다.', planetName: dto.planetName.trim() };
    }
    async updatePassword(req, dto) {
        if (!dto.newPassword || dto.newPassword.length < 6) {
            return { success: false, message: '새 비밀번호는 6자 이상이어야 합니다.' };
        }
        return this.userService.updatePassword(req.user.userId, dto.currentPassword, dto.newPassword);
    }
    async getVacationStatus(req) {
        const user = await this.userService.findById(req.user.userId);
        if (!user) {
            return { error: '사용자를 찾을 수 없습니다.' };
        }
        const canActivate = await this.userService.canActivateVacation(req.user.userId);
        return {
            isActive: user.vacationMode?.isActive || false,
            startTime: user.vacationMode?.startTime || null,
            minEndTime: user.vacationMode?.minEndTime || null,
            canActivate: canActivate.canActivate,
            canActivateReason: canActivate.reason,
        };
    }
    async activateVacation(req) {
        return this.userService.activateVacation(req.user.userId);
    }
    async deactivateVacation(req) {
        return this.userService.deactivateVacation(req.user.userId);
    }
    async resetAccount(req, dto) {
        return this.userService.resetAccount(req.user.userId, dto.password || '');
    }
    async deleteAccount(req, dto) {
        return this.userService.deleteAccount(req.user.userId, dto.password || '');
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('planet-name'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdatePlanetNameDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePlanetName", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('password'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('vacation'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getVacationStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('vacation'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "activateVacation", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('vacation'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deactivateVacation", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('reset'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ConfirmPasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "resetAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('account'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ConfirmPasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteAccount", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map