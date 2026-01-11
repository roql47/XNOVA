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
exports.PlanetController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const planet_service_1 = require("./planet.service");
let PlanetController = class PlanetController {
    planetService;
    constructor(planetService) {
        this.planetService = planetService;
    }
    async getMyPlanets(req) {
        const result = await this.planetService.getAllPlanetsWithHomeworld(req.user.userId);
        return {
            success: true,
            activePlanetId: result.activePlanetId,
            planets: result.planets.map(p => ({
                _id: p.id,
                id: p.id,
                name: p.name,
                coordinate: p.coordinate,
                isHomePlanet: p.isHomePlanet,
                isHomeworld: p.isHomePlanet,
                type: p.type || 'planet',
                planetInfo: {
                    planetName: p.name,
                    maxFields: p.maxFields || 300,
                    usedFields: p.usedFields || 0,
                    temperature: p.temperature || 50,
                    planetType: p.planetType || 'normaltemp',
                },
                resources: p.resources,
            })),
        };
    }
    async getPlanetDetail(req, planetId) {
        const planet = await this.planetService.getPlanetById(planetId);
        if (planet.ownerId !== req.user.userId) {
            return { success: false, error: '이 행성의 소유자가 아닙니다.' };
        }
        return {
            success: true,
            planet: {
                id: planet._id.toString(),
                name: planet.name,
                coordinate: planet.coordinate,
                isHomeworld: planet.isHomeworld,
                type: planet.type,
                resources: planet.resources,
                mines: planet.mines,
                facilities: planet.facilities,
                fleet: planet.fleet,
                defense: planet.defense,
                planetInfo: planet.planetInfo,
                constructionProgress: planet.constructionProgress,
                fleetProgress: planet.fleetProgress,
                defenseProgress: planet.defenseProgress,
                lastResourceUpdate: planet.lastResourceUpdate,
            },
        };
    }
    async switchPlanet(req, body) {
        const planet = await this.planetService.switchActivePlanet(req.user.userId, body.planetId);
        return {
            success: true,
            message: `${planet.name}으로 전환되었습니다.`,
            planet: {
                id: planet._id.toString(),
                name: planet.name,
                coordinate: planet.coordinate,
            },
        };
    }
    async abandonPlanet(req, body) {
        const result = await this.planetService.abandonPlanet(req.user.userId, body.planetId);
        return result;
    }
    async renamePlanet(req, body) {
        const planet = await this.planetService.renamePlanet(req.user.userId, body.planetId, body.newName);
        return {
            success: true,
            message: '행성 이름이 변경되었습니다.',
            planet: {
                id: planet._id.toString(),
                name: planet.name,
                coordinate: planet.coordinate,
            },
        };
    }
};
exports.PlanetController = PlanetController;
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlanetController.prototype, "getMyPlanets", null);
__decorate([
    (0, common_1.Get)(':planetId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('planetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PlanetController.prototype, "getPlanetDetail", null);
__decorate([
    (0, common_1.Post)('switch'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlanetController.prototype, "switchPlanet", null);
__decorate([
    (0, common_1.Post)('abandon'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlanetController.prototype, "abandonPlanet", null);
__decorate([
    (0, common_1.Post)('rename'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlanetController.prototype, "renamePlanet", null);
exports.PlanetController = PlanetController = __decorate([
    (0, common_1.Controller)('planet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [planet_service_1.PlanetService])
], PlanetController);
//# sourceMappingURL=planet.controller.js.map