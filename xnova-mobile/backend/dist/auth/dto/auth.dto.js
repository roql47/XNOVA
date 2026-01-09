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
exports.KakaoLinkVerifyDto = exports.LogoutDto = exports.RefreshTokenDto = exports.GoogleCompleteDto = exports.GoogleAuthDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
    email;
    password;
    playerName;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: '올바른 이메일 형식이 아닙니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '이메일은 필수입니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '비밀번호는 필수입니다.' }),
    (0, class_validator_1.MinLength)(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(100, { message: '비밀번호는 최대 100자까지 가능합니다.' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, { message: '비밀번호는 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 각각 1개 이상 포함해야 합니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '플레이어 이름은 필수입니다.' }),
    (0, class_validator_1.MinLength)(2, { message: '플레이어 이름은 최소 2자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(20, { message: '플레이어 이름은 최대 20자까지 가능합니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "playerName", void 0);
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: '올바른 이메일 형식이 아닙니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '이메일은 필수입니다.' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '비밀번호는 필수입니다.' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class GoogleAuthDto {
    idToken;
}
exports.GoogleAuthDto = GoogleAuthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Google ID 토큰은 필수입니다.' }),
    __metadata("design:type", String)
], GoogleAuthDto.prototype, "idToken", void 0);
class GoogleCompleteDto {
    idToken;
    playerName;
}
exports.GoogleCompleteDto = GoogleCompleteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Google ID 토큰은 필수입니다.' }),
    __metadata("design:type", String)
], GoogleCompleteDto.prototype, "idToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '플레이어 이름은 필수입니다.' }),
    (0, class_validator_1.MinLength)(2, { message: '플레이어 이름은 최소 2자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(20, { message: '플레이어 이름은 최대 20자까지 가능합니다.' }),
    __metadata("design:type", String)
], GoogleCompleteDto.prototype, "playerName", void 0);
class RefreshTokenDto {
    refreshToken;
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Refresh Token은 필수입니다.' }),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class LogoutDto {
    refreshToken;
}
exports.LogoutDto = LogoutDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Refresh Token은 필수입니다.' }),
    __metadata("design:type", String)
], LogoutDto.prototype, "refreshToken", void 0);
class KakaoLinkVerifyDto {
    code;
}
exports.KakaoLinkVerifyDto = KakaoLinkVerifyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '인증코드는 필수입니다.' }),
    (0, class_validator_1.MinLength)(6, { message: '인증코드는 6자리입니다.' }),
    (0, class_validator_1.MaxLength)(6, { message: '인증코드는 6자리입니다.' }),
    __metadata("design:type", String)
], KakaoLinkVerifyDto.prototype, "code", void 0);
//# sourceMappingURL=auth.dto.js.map