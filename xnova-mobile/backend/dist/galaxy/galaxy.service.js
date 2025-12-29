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
exports.GalaxyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../user/schemas/user.schema");
let GalaxyService = class GalaxyService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async getGalaxyMap(galaxy, system, currentUserId) {
        const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
        const players = await this.userModel.find({ coordinate: pattern }).exec();
        const planets = [];
        for (let position = 1; position <= 15; position++) {
            const coord = `${galaxy}:${system}:${position}`;
            const player = players.find(p => p.coordinate === coord);
            if (player) {
                planets.push({
                    position,
                    coordinate: coord,
                    playerName: player.playerName,
                    playerId: player._id.toString(),
                    isOwnPlanet: player._id.toString() === currentUserId,
                    hasDebris: false,
                    hasMoon: false,
                });
            }
            else {
                planets.push({
                    position,
                    coordinate: coord,
                    playerName: null,
                    playerId: null,
                    isOwnPlanet: false,
                    hasDebris: false,
                    hasMoon: false,
                });
            }
        }
        return planets;
    }
    async getPlayerInfo(targetUserId, currentUserId) {
        const target = await this.userModel.findById(targetUserId).exec();
        if (!target)
            return null;
        const isOwn = targetUserId === currentUserId;
        return {
            playerName: target.playerName,
            coordinate: target.coordinate,
            isOwnPlanet: isOwn,
            ...(isOwn && {
                resources: target.resources,
                mines: target.mines,
                facilities: target.facilities,
            }),
        };
    }
    async findPlayerByCoordinate(coordinate) {
        return this.userModel.findOne({ coordinate }).exec();
    }
    async getActiveSystems(galaxy) {
        const pattern = new RegExp(`^${galaxy}:\\d+:\\d+$`);
        const players = await this.userModel.find({ coordinate: pattern }).select('coordinate').exec();
        const systems = new Set();
        for (const player of players) {
            const parts = player.coordinate.split(':');
            systems.add(parseInt(parts[1]));
        }
        return Array.from(systems).sort((a, b) => a - b);
    }
};
exports.GalaxyService = GalaxyService;
exports.GalaxyService = GalaxyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], GalaxyService);
//# sourceMappingURL=galaxy.service.js.map