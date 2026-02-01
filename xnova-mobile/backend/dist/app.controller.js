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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
let AppController = class AppController {
    MIN_REQUIRED_VERSION = '0.31.0';
    LATEST_VERSION = '0.31.0';
    getHello() {
        return {
            name: 'XNOVA API',
            version: '1.0.0',
            description: 'XNOVA 모바일 게임 백엔드 서버',
            endpoints: {
                auth: '/api/auth',
                game: '/api/game',
                galaxy: '/api/galaxy',
                ranking: '/api/ranking',
            },
        };
    }
    healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    checkVersion(currentVersion) {
        const forceUpdate = this.compareVersions(currentVersion || '0.0.0', this.MIN_REQUIRED_VERSION) < 0;
        return {
            minRequiredVersion: this.MIN_REQUIRED_VERSION,
            latestVersion: this.LATEST_VERSION,
            forceUpdate,
            updateUrl: 'https://play.google.com/store/apps/details?id=com.xnova.game',
            message: forceUpdate
                ? '새로운 버전이 출시되었습니다. 업데이트가 필요합니다.'
                : null,
        };
    }
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 < num2)
                return -1;
            if (num1 > num2)
                return 1;
        }
        return 0;
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Get)('version-check'),
    __param(0, (0, common_1.Query)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "checkVersion", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map