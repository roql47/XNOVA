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
exports.AllianceSchema = exports.Alliance = exports.AllianceApplicationSchema = exports.AllianceApplication = exports.AllianceMemberSchema = exports.AllianceMember = exports.AllianceRankSchema = exports.AllianceRank = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AllianceRank = class AllianceRank {
    name;
    delete;
    kick;
    applications;
    memberlist;
    manageApplications;
    administrate;
    onlineStatus;
    mails;
    rightHand;
};
exports.AllianceRank = AllianceRank;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AllianceRank.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "delete", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "kick", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "applications", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "memberlist", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "manageApplications", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "administrate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "onlineStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "mails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AllianceRank.prototype, "rightHand", void 0);
exports.AllianceRank = AllianceRank = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AllianceRank);
exports.AllianceRankSchema = mongoose_1.SchemaFactory.createForClass(AllianceRank);
let AllianceMember = class AllianceMember {
    userId;
    playerName;
    coordinate;
    rankName;
    joinedAt;
};
exports.AllianceMember = AllianceMember;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AllianceMember.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AllianceMember.prototype, "playerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AllianceMember.prototype, "coordinate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Object)
], AllianceMember.prototype, "rankName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], AllianceMember.prototype, "joinedAt", void 0);
exports.AllianceMember = AllianceMember = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AllianceMember);
exports.AllianceMemberSchema = mongoose_1.SchemaFactory.createForClass(AllianceMember);
let AllianceApplication = class AllianceApplication {
    userId;
    playerName;
    coordinate;
    message;
    appliedAt;
};
exports.AllianceApplication = AllianceApplication;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AllianceApplication.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AllianceApplication.prototype, "playerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AllianceApplication.prototype, "coordinate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], AllianceApplication.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], AllianceApplication.prototype, "appliedAt", void 0);
exports.AllianceApplication = AllianceApplication = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AllianceApplication);
exports.AllianceApplicationSchema = mongoose_1.SchemaFactory.createForClass(AllianceApplication);
let Alliance = class Alliance {
    tag;
    name;
    ownerId;
    ownerTitle;
    externalText;
    internalText;
    logo;
    website;
    isOpen;
    ranks;
    members;
    applications;
};
exports.Alliance = Alliance;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, minlength: 3, maxlength: 8 }),
    __metadata("design:type", String)
], Alliance.prototype, "tag", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, maxlength: 35 }),
    __metadata("design:type", String)
], Alliance.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Alliance.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '창립자' }),
    __metadata("design:type", String)
], Alliance.prototype, "ownerTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Alliance.prototype, "externalText", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Alliance.prototype, "internalText", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Alliance.prototype, "logo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Alliance.prototype, "website", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Alliance.prototype, "isOpen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.AllianceRankSchema], default: [] }),
    __metadata("design:type", Array)
], Alliance.prototype, "ranks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.AllianceMemberSchema], default: [] }),
    __metadata("design:type", Array)
], Alliance.prototype, "members", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.AllianceApplicationSchema], default: [] }),
    __metadata("design:type", Array)
], Alliance.prototype, "applications", void 0);
exports.Alliance = Alliance = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Alliance);
exports.AllianceSchema = mongoose_1.SchemaFactory.createForClass(Alliance);
exports.AllianceSchema.index({ tag: 1 }, { unique: true });
exports.AllianceSchema.index({ name: 1 }, { unique: true });
exports.AllianceSchema.index({ ownerId: 1 });
exports.AllianceSchema.index({ 'members.userId': 1 });
//# sourceMappingURL=alliance.schema.js.map