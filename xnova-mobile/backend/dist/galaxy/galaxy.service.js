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
const debris_schema_1 = require("./schemas/debris.schema");
let GalaxyService = class GalaxyService {
    userModel;
    debrisModel;
    constructor(userModel, debrisModel) {
        this.userModel = userModel;
        this.debrisModel = debrisModel;
    }
    async getGalaxyMap(galaxy, system, currentUserId) {
        const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
        const [players, debrisFields] = await Promise.all([
            this.userModel.find({ coordinate: pattern }).exec(),
            this.debrisModel.find({ coordinate: pattern }).exec(),
        ]);
        const planets = [];
        for (let position = 1; position <= 15; position++) {
            const coord = `${galaxy}:${system}:${position}`;
            const player = players.find(p => p.coordinate === coord);
            const debris = debrisFields.find(d => d.coordinate === coord);
            const info = {
                position,
                coordinate: coord,
                playerName: player ? player.playerName : null,
                playerId: player ? player._id.toString() : null,
                isOwnPlanet: player ? player._id.toString() === currentUserId : false,
                hasDebris: !!debris && (debris.metal > 0 || debris.crystal > 0),
                debrisAmount: debris ? { metal: debris.metal, crystal: debris.crystal } : undefined,
                hasMoon: false,
            };
            planets.push(info);
        }
        return planets;
    }
    async updateDebris(coordinate, metal, crystal) {
        let debris = await this.debrisModel.findOne({ coordinate }).exec();
        if (debris) {
            debris.metal += metal;
            debris.crystal += crystal;
            await debris.save();
        }
        else if (metal > 0 || crystal > 0) {
            debris = new this.debrisModel({
                coordinate,
                metal,
                crystal,
            });
            await debris.save();
        }
    }
    async getDebris(coordinate) {
        return this.debrisModel.findOne({ coordinate }).exec();
    }
    async consumeDebris(coordinate, metal, crystal) {
        const debris = await this.debrisModel.findOne({ coordinate }).exec();
        if (debris) {
            debris.metal = Math.max(0, debris.metal - metal);
            debris.crystal = Math.max(0, debris.crystal - crystal);
            if (debris.metal === 0 && debris.crystal === 0) {
                await this.debrisModel.deleteOne({ coordinate }).exec();
            }
            else {
                await debris.save();
            }
        }
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
    __param(1, (0, mongoose_1.InjectModel)(debris_schema_1.Debris.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], GalaxyService);
//# sourceMappingURL=galaxy.service.js.map