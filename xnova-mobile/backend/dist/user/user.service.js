"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const bcrypt = __importStar(require("bcrypt"));
const PLANET_FIELD_RANGES = {
    min: [40, 50, 55, 100, 95, 80, 115, 120, 125, 75, 80, 85, 60, 40, 50],
    max: [90, 95, 95, 240, 240, 230, 180, 180, 190, 125, 120, 130, 160, 300, 150]
};
const PLANET_TEMP_RANGES = {
    min: [40, 40, 40, 15, 15, 15, -10, -10, -10, -35, -35, -35, -60, -60, -60],
    max: [140, 140, 140, 115, 115, 115, 90, 90, 90, 65, 65, 65, 50, 50, 50]
};
const PLANET_TYPES = [
    'trocken', 'trocken', 'trocken',
    'dschjungel', 'dschjungel', 'dschjungel',
    'normaltemp', 'normaltemp', 'normaltemp',
    'wasser', 'wasser', 'wasser',
    'eis', 'eis', 'eis'
];
let UserService = class UserService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    generatePlanetInfo(position, isHomeWorld = true) {
        const posIndex = Math.max(0, Math.min(14, position - 1));
        if (isHomeWorld) {
            return {
                maxFields: 163,
                temperature: 50,
                planetType: 'normaltemp',
                diameter: Math.floor(Math.sqrt(163) * 1000)
            };
        }
        const minFields = PLANET_FIELD_RANGES.min[posIndex];
        const maxFields = PLANET_FIELD_RANGES.max[posIndex];
        const randomFields = Math.floor(Math.random() * (maxFields - minFields + 1)) + minFields;
        const minTemp = PLANET_TEMP_RANGES.min[posIndex];
        const maxTemp = PLANET_TEMP_RANGES.max[posIndex];
        const randomTemp = Math.floor(Math.random() * (maxTemp - minTemp + 1)) + minTemp;
        const diameter = Math.floor(Math.sqrt(randomFields) * 1000);
        return {
            maxFields: randomFields,
            temperature: randomTemp,
            planetType: PLANET_TYPES[posIndex],
            diameter
        };
    }
    async create(email, password, playerName) {
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new common_1.ConflictException('이미 등록된 이메일입니다.');
        }
        const existingPlayerName = await this.userModel.findOne({ playerName }).exec();
        if (existingPlayerName) {
            throw new common_1.ConflictException('이미 사용 중인 플레이어 이름입니다.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const coordinate = await this.generateUniqueCoordinate();
        const position = parseInt(coordinate.split(':')[2], 10) || 7;
        const planetInfo = this.generatePlanetInfo(position, true);
        const user = new this.userModel({
            email,
            password: hashedPassword,
            playerName,
            coordinate,
            resources: {
                metal: 5000,
                crystal: 2500,
                deuterium: 1500,
                energy: 0,
            },
            mines: {
                metalMine: 0,
                crystalMine: 0,
                deuteriumMine: 0,
                solarPlant: 0,
                fusionReactor: 0,
            },
            facilities: {
                robotFactory: 0,
                shipyard: 0,
                researchLab: 0,
                nanoFactory: 0,
                terraformer: 0,
                allianceDepot: 0,
                missileSilo: 0,
                metalStorage: 0,
                crystalStorage: 0,
                deuteriumTank: 0,
                lunarBase: 0,
                sensorPhalanx: 0,
                jumpGate: 0,
            },
            planetInfo: {
                maxFields: planetInfo.maxFields,
                usedFields: 0,
                temperature: planetInfo.temperature,
                planetType: planetInfo.planetType,
                isMoon: false,
                planetName: playerName,
                diameter: planetInfo.diameter,
            },
        });
        return user.save();
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).exec();
    }
    async findById(id) {
        return this.userModel.findById(id).exec();
    }
    async findByCoordinate(coordinate) {
        return this.userModel.findOne({ coordinate }).exec();
    }
    async findAll() {
        return this.userModel.find().exec();
    }
    async update(id, updateData) {
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }
    async generateUniqueCoordinate() {
        let coordinate = '';
        let isUnique = false;
        while (!isUnique) {
            const galaxy = 1;
            const system = Math.floor(Math.random() * 99) + 1;
            const position = Math.floor(Math.random() * 15) + 1;
            coordinate = `${galaxy}:${system}:${position}`;
            const existing = await this.userModel.findOne({ coordinate }).exec();
            if (!existing) {
                isUnique = true;
            }
        }
        return coordinate;
    }
    async getPlayersBySystem(galaxy, system) {
        const pattern = new RegExp(`^${galaxy}:${system}:\\d+$`);
        return this.userModel.find({ coordinate: pattern }).exec();
    }
    async validatePassword(user, password) {
        if (!user.password)
            return false;
        return bcrypt.compare(password, user.password);
    }
    async findByGoogleId(googleId) {
        return this.userModel.findOne({ googleId }).exec();
    }
    async createGoogleUser(email, googleId, playerName) {
        const existingPlayerName = await this.userModel.findOne({ playerName }).exec();
        if (existingPlayerName) {
            throw new common_1.ConflictException('이미 사용 중인 플레이어 이름입니다.');
        }
        const coordinate = await this.generateUniqueCoordinate();
        const position = parseInt(coordinate.split(':')[2], 10) || 7;
        const planetInfo = this.generatePlanetInfo(position, true);
        const user = new this.userModel({
            email,
            googleId,
            playerName,
            coordinate,
            resources: {
                metal: 5000,
                crystal: 2500,
                deuterium: 1500,
                energy: 0,
            },
            mines: {
                metalMine: 0,
                crystalMine: 0,
                deuteriumMine: 0,
                solarPlant: 0,
                fusionReactor: 0,
            },
            facilities: {
                robotFactory: 0,
                shipyard: 0,
                researchLab: 0,
                nanoFactory: 0,
                terraformer: 0,
                allianceDepot: 0,
                missileSilo: 0,
                metalStorage: 0,
                crystalStorage: 0,
                deuteriumTank: 0,
                lunarBase: 0,
                sensorPhalanx: 0,
                jumpGate: 0,
            },
            planetInfo: {
                maxFields: planetInfo.maxFields,
                usedFields: 0,
                temperature: planetInfo.temperature,
                planetType: planetInfo.planetType,
                isMoon: false,
                planetName: playerName,
                diameter: planetInfo.diameter,
            },
        });
        return user.save();
    }
    async linkGoogleAccount(userId, googleId) {
        return this.userModel.findByIdAndUpdate(userId, { googleId }, { new: true }).exec();
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
//# sourceMappingURL=user.service.js.map