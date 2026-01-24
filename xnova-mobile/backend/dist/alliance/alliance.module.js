"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllianceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const alliance_controller_1 = require("./alliance.controller");
const alliance_service_1 = require("./alliance.service");
const alliance_schema_1 = require("./schemas/alliance.schema");
const user_schema_1 = require("../user/schemas/user.schema");
const message_schema_1 = require("../message/schemas/message.schema");
let AllianceModule = class AllianceModule {
};
exports.AllianceModule = AllianceModule;
exports.AllianceModule = AllianceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: alliance_schema_1.Alliance.name, schema: alliance_schema_1.AllianceSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: message_schema_1.Message.name, schema: message_schema_1.MessageSchema },
            ]),
        ],
        controllers: [alliance_controller_1.AllianceController],
        providers: [alliance_service_1.AllianceService],
        exports: [alliance_service_1.AllianceService],
    })
], AllianceModule);
//# sourceMappingURL=alliance.module.js.map