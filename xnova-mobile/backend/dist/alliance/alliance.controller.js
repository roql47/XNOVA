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
exports.AllianceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const alliance_service_1 = require("./alliance.service");
const alliance_dto_1 = require("./dto/alliance.dto");
let AllianceController = class AllianceController {
    allianceService;
    constructor(allianceService) {
        this.allianceService = allianceService;
    }
    async createAlliance(req, dto) {
        return this.allianceService.createAlliance(req.user.userId, dto);
    }
    async searchAlliances(query) {
        return this.allianceService.searchAlliances(query?.trim() || '');
    }
    async getAlliancePublic(id) {
        return this.allianceService.getAlliancePublic(id);
    }
    async applyToAlliance(req, allianceId, dto) {
        return this.allianceService.applyToAlliance(req.user.userId, allianceId, dto);
    }
    async cancelApplication(req) {
        return this.allianceService.cancelApplication(req.user.userId);
    }
    async getMyAlliance(req) {
        return this.allianceService.getMyAlliance(req.user.userId);
    }
    async leaveAlliance(req) {
        return this.allianceService.leaveAlliance(req.user.userId);
    }
    async getMembers(req) {
        return this.allianceService.getMembers(req.user.userId);
    }
    async updateMemberRank(req, memberId, dto) {
        return this.allianceService.updateMemberRank(req.user.userId, memberId, dto);
    }
    async kickMember(req, memberId) {
        return this.allianceService.kickMember(req.user.userId, memberId);
    }
    async getApplications(req) {
        return this.allianceService.getApplications(req.user.userId);
    }
    async acceptApplication(req, applicantId) {
        return this.allianceService.acceptApplication(req.user.userId, applicantId);
    }
    async rejectApplication(req, applicantId, dto) {
        return this.allianceService.rejectApplication(req.user.userId, applicantId, dto);
    }
    async updateSettings(req, dto) {
        return this.allianceService.updateSettings(req.user.userId, dto);
    }
    async updateName(req, dto) {
        return this.allianceService.updateName(req.user.userId, dto.name);
    }
    async updateTag(req, dto) {
        return this.allianceService.updateTag(req.user.userId, dto.tag);
    }
    async getRanks(req) {
        return this.allianceService.getRanks(req.user.userId);
    }
    async createRank(req, dto) {
        return this.allianceService.createRank(req.user.userId, dto);
    }
    async updateRank(req, rankName, dto) {
        return this.allianceService.updateRank(req.user.userId, rankName, dto);
    }
    async deleteRank(req, rankName) {
        return this.allianceService.deleteRank(req.user.userId, rankName);
    }
    async transferAlliance(req, dto) {
        return this.allianceService.transferAlliance(req.user.userId, dto.newOwnerId);
    }
    async dissolveAlliance(req) {
        return this.allianceService.dissolveAlliance(req.user.userId);
    }
    async sendCircularMessage(req, dto) {
        return this.allianceService.sendCircularMessage(req.user.userId, dto);
    }
};
exports.AllianceController = AllianceController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.CreateAllianceDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "createAlliance", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "searchAlliances", null);
__decorate([
    (0, common_1.Get)('info/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "getAlliancePublic", null);
__decorate([
    (0, common_1.Post)(':id/apply'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, alliance_dto_1.ApplyAllianceDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "applyToAlliance", null);
__decorate([
    (0, common_1.Delete)('application'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "cancelApplication", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "getMyAlliance", null);
__decorate([
    (0, common_1.Post)('leave'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "leaveAlliance", null);
__decorate([
    (0, common_1.Get)('members'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Put)('member/:id/rank'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, alliance_dto_1.UpdateMemberRankDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "updateMemberRank", null);
__decorate([
    (0, common_1.Delete)('member/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "kickMember", null);
__decorate([
    (0, common_1.Get)('applications'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Post)('application/:id/accept'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "acceptApplication", null);
__decorate([
    (0, common_1.Post)('application/:id/reject'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, alliance_dto_1.RejectApplicationDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "rejectApplication", null);
__decorate([
    (0, common_1.Put)('settings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.UpdateAllianceSettingsDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Put)('name'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.UpdateAllianceNameDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "updateName", null);
__decorate([
    (0, common_1.Put)('tag'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.UpdateAllianceTagDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "updateTag", null);
__decorate([
    (0, common_1.Get)('ranks'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "getRanks", null);
__decorate([
    (0, common_1.Post)('ranks'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.CreateRankDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "createRank", null);
__decorate([
    (0, common_1.Put)('ranks/:name'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('name')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, alliance_dto_1.UpdateRankDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "updateRank", null);
__decorate([
    (0, common_1.Delete)('ranks/:name'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "deleteRank", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.TransferAllianceDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "transferAlliance", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "dissolveAlliance", null);
__decorate([
    (0, common_1.Post)('circular'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, alliance_dto_1.CircularMessageDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "sendCircularMessage", null);
exports.AllianceController = AllianceController = __decorate([
    (0, common_1.Controller)('alliance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [alliance_service_1.AllianceService])
], AllianceController);
//# sourceMappingURL=alliance.controller.js.map