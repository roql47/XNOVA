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
exports.GalaxyController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const galaxy_service_1 = require("./galaxy.service");
let GalaxyController = class GalaxyController {
    galaxyService;
    constructor(galaxyService) {
        this.galaxyService = galaxyService;
    }
    async getGalaxyMap(galaxy, system, req) {
        const galaxyNum = parseInt(galaxy);
        const systemNum = parseInt(system);
        if (isNaN(galaxyNum) || isNaN(systemNum)) {
            return { error: '잘못된 좌표 형식입니다.' };
        }
        if (galaxyNum < 1 || galaxyNum > 9) {
            return { error: '은하 번호는 1~9 사이여야 합니다.' };
        }
        if (systemNum < 1 || systemNum > 499) {
            return { error: '시스템 번호는 1~499 사이여야 합니다.' };
        }
        const planets = await this.galaxyService.getGalaxyMap(galaxyNum, systemNum, req.user.userId);
        return {
            galaxy: galaxyNum,
            system: systemNum,
            planets,
        };
    }
    async getPlayerInfo(playerId, req) {
        return this.galaxyService.getPlayerInfo(playerId, req.user.userId);
    }
    async getActiveSystems(galaxy) {
        const galaxyNum = parseInt(galaxy);
        if (isNaN(galaxyNum) || galaxyNum < 1 || galaxyNum > 9) {
            return { error: '잘못된 은하 번호입니다.' };
        }
        const systems = await this.galaxyService.getActiveSystems(galaxyNum);
        return {
            galaxy: galaxyNum,
            activeSystems: systems,
            totalActive: systems.length,
        };
    }
};
exports.GalaxyController = GalaxyController;
__decorate([
    (0, common_1.Get)(':galaxy/:system'),
    __param(0, (0, common_1.Param)('galaxy')),
    __param(1, (0, common_1.Param)('system')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GalaxyController.prototype, "getGalaxyMap", null);
__decorate([
    (0, common_1.Get)('player/:playerId'),
    __param(0, (0, common_1.Param)('playerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GalaxyController.prototype, "getPlayerInfo", null);
__decorate([
    (0, common_1.Get)(':galaxy/systems'),
    __param(0, (0, common_1.Param)('galaxy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalaxyController.prototype, "getActiveSystems", null);
exports.GalaxyController = GalaxyController = __decorate([
    (0, common_1.Controller)('galaxy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [galaxy_service_1.GalaxyService])
], GalaxyController);
//# sourceMappingURL=galaxy.controller.js.map