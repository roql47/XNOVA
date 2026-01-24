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
exports.CircularMessageDto = exports.TransferAllianceDto = exports.UpdateMemberRankDto = exports.UpdateRankDto = exports.CreateRankDto = exports.UpdateAllianceTagDto = exports.UpdateAllianceNameDto = exports.UpdateAllianceSettingsDto = exports.RejectApplicationDto = exports.ApplyAllianceDto = exports.SearchAllianceDto = exports.CreateAllianceDto = void 0;
const class_validator_1 = require("class-validator");
class CreateAllianceDto {
    tag;
    name;
}
exports.CreateAllianceDto = CreateAllianceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3, { message: '연합 태그는 최소 3자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(8, { message: '연합 태그는 최대 8자까지 가능합니다.' }),
    __metadata("design:type", String)
], CreateAllianceDto.prototype, "tag", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(35, { message: '연합 이름은 최대 35자까지 가능합니다.' }),
    __metadata("design:type", String)
], CreateAllianceDto.prototype, "name", void 0);
class SearchAllianceDto {
    query;
}
exports.SearchAllianceDto = SearchAllianceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchAllianceDto.prototype, "query", void 0);
class ApplyAllianceDto {
    message;
}
exports.ApplyAllianceDto = ApplyAllianceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500, { message: '가입 신청 메시지는 최대 500자까지 가능합니다.' }),
    __metadata("design:type", String)
], ApplyAllianceDto.prototype, "message", void 0);
class RejectApplicationDto {
    reason;
}
exports.RejectApplicationDto = RejectApplicationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RejectApplicationDto.prototype, "reason", void 0);
class UpdateAllianceSettingsDto {
    externalText;
    internalText;
    logo;
    website;
    isOpen;
    ownerTitle;
}
exports.UpdateAllianceSettingsDto = UpdateAllianceSettingsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateAllianceSettingsDto.prototype, "externalText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateAllianceSettingsDto.prototype, "internalText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateAllianceSettingsDto.prototype, "logo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateAllianceSettingsDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateAllianceSettingsDto.prototype, "isOpen", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateAllianceSettingsDto.prototype, "ownerTitle", void 0);
class UpdateAllianceNameDto {
    name;
}
exports.UpdateAllianceNameDto = UpdateAllianceNameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(35),
    __metadata("design:type", String)
], UpdateAllianceNameDto.prototype, "name", void 0);
class UpdateAllianceTagDto {
    tag;
}
exports.UpdateAllianceTagDto = UpdateAllianceTagDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], UpdateAllianceTagDto.prototype, "tag", void 0);
class CreateRankDto {
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
}
exports.CreateRankDto = CreateRankDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateRankDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "delete", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "kick", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "applications", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "memberlist", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "manageApplications", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "administrate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "onlineStatus", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "mails", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRankDto.prototype, "rightHand", void 0);
class UpdateRankDto {
    newName;
    delete;
    kick;
    applications;
    memberlist;
    manageApplications;
    administrate;
    onlineStatus;
    mails;
    rightHand;
}
exports.UpdateRankDto = UpdateRankDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateRankDto.prototype, "newName", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "delete", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "kick", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "applications", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "memberlist", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "manageApplications", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "administrate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "onlineStatus", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "mails", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRankDto.prototype, "rightHand", void 0);
class UpdateMemberRankDto {
    rankName;
}
exports.UpdateMemberRankDto = UpdateMemberRankDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateMemberRankDto.prototype, "rankName", void 0);
class TransferAllianceDto {
    newOwnerId;
}
exports.TransferAllianceDto = TransferAllianceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferAllianceDto.prototype, "newOwnerId", void 0);
class CircularMessageDto {
    title;
    content;
}
exports.CircularMessageDto = CircularMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CircularMessageDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CircularMessageDto.prototype, "content", void 0);
//# sourceMappingURL=alliance.dto.js.map