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
exports.KakaoLinkCodeSchema = exports.KakaoLinkCode = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let KakaoLinkCode = class KakaoLinkCode {
    userId;
    code;
    expiresAt;
    used;
};
exports.KakaoLinkCode = KakaoLinkCode;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], KakaoLinkCode.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], KakaoLinkCode.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], KakaoLinkCode.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], KakaoLinkCode.prototype, "used", void 0);
exports.KakaoLinkCode = KakaoLinkCode = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], KakaoLinkCode);
exports.KakaoLinkCodeSchema = mongoose_1.SchemaFactory.createForClass(KakaoLinkCode);
exports.KakaoLinkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.KakaoLinkCodeSchema.index({ code: 1 });
exports.KakaoLinkCodeSchema.index({ userId: 1 });
//# sourceMappingURL=kakao-link-code.schema.js.map