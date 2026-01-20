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
exports.PlanetService = exports.MAX_PLANETS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const planet_schema_1 = require("./schemas/planet.schema");
const user_service_1 = require("../user/user.service");
const message_service_1 = require("../message/message.service");
exports.MAX_PLANETS = 9;
const COLONY_INITIAL_RESOURCES = {
    metal: 500,
    crystal: 500,
    deuterium: 0,
};
let PlanetService = class PlanetService {
    planetModel;
    userService;
    messageService;
    constructor(planetModel, userService, messageService) {
        this.planetModel = planetModel;
        this.userService = userService;
        this.messageService = messageService;
    }
    async createPlanet(ownerId, coordinate, name, isHomeworld = false) {
        const [galaxy, system, position] = coordinate.split(':').map(Number);
        if (!galaxy || !system || !position || position < 1 || position > 15) {
            throw new common_1.BadRequestException('유효하지 않은 좌표입니다.');
        }
        const existingPlanet = await this.planetModel.findOne({ coordinate }).exec();
        if (existingPlanet) {
            throw new common_1.BadRequestException('해당 좌표에 이미 행성이 존재합니다.');
        }
        const characteristics = (0, planet_schema_1.generatePlanetCharacteristics)(position);
        const planet = new this.planetModel({
            ownerId,
            coordinate,
            name,
            isHomeworld,
            type: 'planet',
            resources: isHomeworld
                ? { metal: 5000, crystal: 2500, deuterium: 1500, energy: 0 }
                : { ...COLONY_INITIAL_RESOURCES, energy: 0 },
            planetInfo: {
                maxFields: characteristics.maxFields,
                usedFields: 0,
                tempMin: characteristics.tempMin,
                tempMax: characteristics.tempMax,
                planetType: characteristics.planetType,
                diameter: characteristics.diameter,
            },
        });
        return planet.save();
    }
    async getPlanetsByOwner(ownerId) {
        return this.planetModel.find({ ownerId }).sort({ isHomeworld: -1, createdAt: 1 }).exec();
    }
    async getPlanetById(planetId) {
        const planet = await this.planetModel.findById(planetId).exec();
        if (!planet) {
            throw new common_1.NotFoundException('행성을 찾을 수 없습니다.');
        }
        return planet;
    }
    async getPlanetByCoordinate(coordinate) {
        return this.planetModel.findOne({ coordinate }).exec();
    }
    async getPlanetCount(ownerId) {
        return this.planetModel.countDocuments({ ownerId, type: 'planet' }).exec();
    }
    async switchActivePlanet(userId, planetId) {
        if (planetId.startsWith('home_')) {
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
            }
            await this.userService.updateActivePlanet(userId, planetId);
            return {
                _id: planetId,
                name: user.playerName || '모행성',
                coordinate: user.coordinate,
                isHomeworld: true,
            };
        }
        const planet = await this.planetModel.findById(planetId).exec();
        if (!planet) {
            throw new common_1.NotFoundException('행성을 찾을 수 없습니다.');
        }
        if (planet.ownerId !== userId) {
            throw new common_1.BadRequestException('이 행성의 소유자가 아닙니다.');
        }
        await this.userService.updateActivePlanet(userId, planetId);
        return planet;
    }
    async abandonPlanet(userId, planetId) {
        const planet = await this.planetModel.findById(planetId).exec();
        if (!planet) {
            throw new common_1.NotFoundException('행성을 찾을 수 없습니다.');
        }
        if (planet.ownerId !== userId) {
            throw new common_1.BadRequestException('이 행성의 소유자가 아닙니다.');
        }
        if (planet.isHomeworld) {
            throw new common_1.BadRequestException('모행성은 포기할 수 없습니다.');
        }
        await this.planetModel.findByIdAndDelete(planetId).exec();
        const user = await this.userService.findById(userId);
        if (user) {
            if (user.activePlanetId === planetId && user.homePlanetId) {
                await this.userService.updateActivePlanet(userId, user.homePlanetId);
            }
        }
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '행성 관리국',
            title: `식민지 포기: ${planet.name}`,
            content: `${planet.coordinate} 좌표의 식민지 "${planet.name}"이(가) 성공적으로 포기되었습니다.`,
            type: 'system',
        });
        return { success: true, message: `식민지 "${planet.name}"이(가) 포기되었습니다.` };
    }
    async renamePlanet(userId, planetId, newName) {
        const planet = await this.planetModel.findById(planetId).exec();
        if (!planet) {
            throw new common_1.NotFoundException('행성을 찾을 수 없습니다.');
        }
        if (planet.ownerId !== userId) {
            throw new common_1.BadRequestException('이 행성의 소유자가 아닙니다.');
        }
        if (!newName || newName.trim().length === 0) {
            throw new common_1.BadRequestException('행성 이름을 입력해주세요.');
        }
        if (newName.length > 20) {
            throw new common_1.BadRequestException('행성 이름은 20자 이내로 입력해주세요.');
        }
        planet.name = newName.trim();
        return planet.save();
    }
    async updatePlanetResources(planetId, resources) {
        await this.planetModel.findByIdAndUpdate(planetId, {
            $set: {
                'resources.metal': resources.metal,
                'resources.crystal': resources.crystal,
                'resources.deuterium': resources.deuterium,
                'resources.energy': resources.energy,
                lastResourceUpdate: new Date(),
            },
        }).exec();
    }
    async isCoordinateEmpty(coordinate) {
        const planet = await this.planetModel.findOne({ coordinate }).exec();
        return !planet;
    }
    async savePlanet(planet) {
        return planet.save();
    }
    async getUserActivePlanetId(userId) {
        const user = await this.userService.findById(userId);
        if (!user)
            return null;
        return { activePlanetId: user.activePlanetId };
    }
    async getAllPlanetsWithHomeworld(userId) {
        const user = await this.userService.findById(userId);
        if (!user) {
            return { activePlanetId: '', planets: [] };
        }
        const planets = [];
        const homeUsedFields = this.calculateUsedFieldsForUser(user);
        const homeTerraformerBonus = (user.facilities?.terraformer || 0) * 5;
        const homeMaxFields = (user.planetInfo?.maxFields || 300) + homeTerraformerBonus;
        planets.push({
            id: `home_${userId}`,
            name: user.playerName || '모행성',
            coordinate: user.coordinate,
            isHomePlanet: true,
            type: 'planet',
            maxFields: homeMaxFields,
            usedFields: homeUsedFields,
            temperature: user.planetInfo?.temperature || 50,
            planetType: user.planetInfo?.planetType || 'normaltemp',
            resources: user.resources,
        });
        const colonies = await this.planetModel.find({ ownerId: userId, isHomeworld: false }).exec();
        for (const colony of colonies) {
            const colonyUsedFields = this.calculateUsedFieldsForPlanet(colony);
            const colonyTerraformerBonus = (colony.facilities?.terraformer || 0) * 5;
            const colonyMaxFields = (colony.planetInfo?.maxFields || 300) + colonyTerraformerBonus;
            planets.push({
                id: colony._id.toString(),
                name: colony.name || '식민지',
                coordinate: colony.coordinate,
                isHomePlanet: false,
                type: colony.type || 'planet',
                maxFields: colonyMaxFields,
                usedFields: colonyUsedFields,
                temperature: colony.planetInfo?.tempMax || 50,
                planetType: colony.planetInfo?.planetType || 'normaltemp',
                resources: colony.resources,
            });
        }
        let activePlanetId = user.activePlanetId;
        if (!activePlanetId || activePlanetId === `home_${userId}`) {
            activePlanetId = `home_${userId}`;
        }
        return { activePlanetId, planets };
    }
    calculateUsedFieldsForUser(user) {
        let usedFields = 0;
        if (user.mines) {
            usedFields += user.mines.metalMine || 0;
            usedFields += user.mines.crystalMine || 0;
            usedFields += user.mines.deuteriumMine || 0;
            usedFields += user.mines.solarPlant || 0;
            usedFields += user.mines.fusionReactor || 0;
        }
        if (user.facilities) {
            usedFields += user.facilities.robotFactory || 0;
            usedFields += user.facilities.nanoFactory || 0;
            usedFields += user.facilities.shipyard || 0;
            usedFields += user.facilities.researchLab || 0;
            usedFields += user.facilities.terraformer || 0;
            usedFields += user.facilities.allianceDepot || 0;
            usedFields += user.facilities.missileSilo || 0;
            usedFields += user.facilities.lunarBase || 0;
            usedFields += user.facilities.sensorPhalanx || 0;
            usedFields += user.facilities.jumpGate || 0;
        }
        return usedFields;
    }
    calculateUsedFieldsForPlanet(planet) {
        let usedFields = 0;
        if (planet.mines) {
            usedFields += planet.mines.metalMine || 0;
            usedFields += planet.mines.crystalMine || 0;
            usedFields += planet.mines.deuteriumMine || 0;
            usedFields += planet.mines.solarPlant || 0;
            usedFields += planet.mines.fusionReactor || 0;
        }
        if (planet.facilities) {
            usedFields += planet.facilities.robotFactory || 0;
            usedFields += planet.facilities.nanoFactory || 0;
            usedFields += planet.facilities.shipyard || 0;
            usedFields += planet.facilities.researchLab || 0;
            usedFields += planet.facilities.terraformer || 0;
            usedFields += planet.facilities.allianceDepot || 0;
            usedFields += planet.facilities.missileSilo || 0;
        }
        return usedFields;
    }
};
exports.PlanetService = PlanetService;
exports.PlanetService = PlanetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        user_service_1.UserService,
        message_service_1.MessageService])
], PlanetService);
//# sourceMappingURL=planet.service.js.map