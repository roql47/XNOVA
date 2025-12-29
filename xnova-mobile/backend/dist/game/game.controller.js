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
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const resources_service_1 = require("./services/resources.service");
const buildings_service_1 = require("./services/buildings.service");
const research_service_1 = require("./services/research.service");
const fleet_service_1 = require("./services/fleet.service");
const defense_service_1 = require("./services/defense.service");
const battle_service_1 = require("./services/battle.service");
let GameController = class GameController {
    resourcesService;
    buildingsService;
    researchService;
    fleetService;
    defenseService;
    battleService;
    constructor(resourcesService, buildingsService, researchService, fleetService, defenseService, battleService) {
        this.resourcesService = resourcesService;
        this.buildingsService = buildingsService;
        this.researchService = researchService;
        this.fleetService = fleetService;
        this.defenseService = defenseService;
        this.battleService = battleService;
    }
    async getResources(req) {
        return this.resourcesService.getResources(req.user.userId);
    }
    async getBuildings(req) {
        return this.buildingsService.getBuildings(req.user.userId);
    }
    async upgradeBuilding(req, body) {
        return this.buildingsService.startUpgrade(req.user.userId, body.buildingType);
    }
    async completeBuilding(req) {
        return this.buildingsService.completeConstruction(req.user.userId);
    }
    async cancelBuilding(req) {
        return this.buildingsService.cancelConstruction(req.user.userId);
    }
    async getResearch(req) {
        return this.researchService.getResearch(req.user.userId);
    }
    async startResearch(req, body) {
        return this.researchService.startResearch(req.user.userId, body.researchType);
    }
    async completeResearch(req) {
        return this.researchService.completeResearch(req.user.userId);
    }
    async cancelResearch(req) {
        return this.researchService.cancelResearch(req.user.userId);
    }
    async getFleet(req) {
        return this.fleetService.getFleet(req.user.userId);
    }
    async buildFleet(req, body) {
        return this.fleetService.startBuild(req.user.userId, body.fleetType, body.quantity);
    }
    async completeFleet(req) {
        return this.fleetService.completeBuild(req.user.userId);
    }
    async getDefense(req) {
        return this.defenseService.getDefense(req.user.userId);
    }
    async buildDefense(req, body) {
        return this.defenseService.startBuild(req.user.userId, body.defenseType, body.quantity);
    }
    async completeDefense(req) {
        return this.defenseService.completeBuild(req.user.userId);
    }
    async attack(req, body) {
        return this.battleService.startAttack(req.user.userId, body.targetCoord, body.fleet);
    }
    async getAttackStatus(req) {
        return this.battleService.getAttackStatus(req.user.userId);
    }
    async processBattle(req) {
        const attackResult = await this.battleService.processAttackArrival(req.user.userId);
        const returnResult = await this.battleService.processFleetReturn(req.user.userId);
        return {
            attackProcessed: attackResult !== null,
            attackResult,
            returnProcessed: returnResult !== null,
            returnResult,
        };
    }
};
exports.GameController = GameController;
__decorate([
    (0, common_1.Get)('resources'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getResources", null);
__decorate([
    (0, common_1.Get)('buildings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getBuildings", null);
__decorate([
    (0, common_1.Post)('buildings/upgrade'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "upgradeBuilding", null);
__decorate([
    (0, common_1.Post)('buildings/complete'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "completeBuilding", null);
__decorate([
    (0, common_1.Post)('buildings/cancel'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "cancelBuilding", null);
__decorate([
    (0, common_1.Get)('research'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getResearch", null);
__decorate([
    (0, common_1.Post)('research/start'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "startResearch", null);
__decorate([
    (0, common_1.Post)('research/complete'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "completeResearch", null);
__decorate([
    (0, common_1.Post)('research/cancel'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "cancelResearch", null);
__decorate([
    (0, common_1.Get)('fleet'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getFleet", null);
__decorate([
    (0, common_1.Post)('fleet/build'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "buildFleet", null);
__decorate([
    (0, common_1.Post)('fleet/complete'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "completeFleet", null);
__decorate([
    (0, common_1.Get)('defense'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getDefense", null);
__decorate([
    (0, common_1.Post)('defense/build'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "buildDefense", null);
__decorate([
    (0, common_1.Post)('defense/complete'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "completeDefense", null);
__decorate([
    (0, common_1.Post)('battle/attack'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "attack", null);
__decorate([
    (0, common_1.Get)('battle/status'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getAttackStatus", null);
__decorate([
    (0, common_1.Post)('battle/process'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "processBattle", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('game'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService,
        buildings_service_1.BuildingsService,
        research_service_1.ResearchService,
        fleet_service_1.FleetService,
        defense_service_1.DefenseService,
        battle_service_1.BattleService])
], GameController);
//# sourceMappingURL=game.controller.js.map