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
exports.PlanetSchema = exports.Planet = exports.ProgressInfo = exports.PlanetInfo = exports.PlanetDefense = exports.PlanetFleet = exports.PlanetFacilities = exports.PlanetMines = exports.PlanetResources = void 0;
exports.generatePlanetCharacteristics = generatePlanetCharacteristics;
const mongoose_1 = require("@nestjs/mongoose");
let PlanetResources = class PlanetResources {
    metal;
    crystal;
    deuterium;
    energy;
};
exports.PlanetResources = PlanetResources;
__decorate([
    (0, mongoose_1.Prop)({ default: 500 }),
    __metadata("design:type", Number)
], PlanetResources.prototype, "metal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 500 }),
    __metadata("design:type", Number)
], PlanetResources.prototype, "crystal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetResources.prototype, "deuterium", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetResources.prototype, "energy", void 0);
exports.PlanetResources = PlanetResources = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetResources);
let PlanetMines = class PlanetMines {
    metalMine;
    crystalMine;
    deuteriumMine;
    solarPlant;
    fusionReactor;
};
exports.PlanetMines = PlanetMines;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetMines.prototype, "metalMine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetMines.prototype, "crystalMine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetMines.prototype, "deuteriumMine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetMines.prototype, "solarPlant", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetMines.prototype, "fusionReactor", void 0);
exports.PlanetMines = PlanetMines = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetMines);
let PlanetFacilities = class PlanetFacilities {
    robotFactory;
    shipyard;
    researchLab;
    nanoFactory;
    terraformer;
    allianceDepot;
    missileSilo;
    metalStorage;
    crystalStorage;
    deuteriumTank;
    lunarBase;
    sensorPhalanx;
    jumpGate;
};
exports.PlanetFacilities = PlanetFacilities;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "robotFactory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "shipyard", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "researchLab", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "nanoFactory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "terraformer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "allianceDepot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "missileSilo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "metalStorage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "crystalStorage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "deuteriumTank", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "lunarBase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "sensorPhalanx", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFacilities.prototype, "jumpGate", void 0);
exports.PlanetFacilities = PlanetFacilities = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetFacilities);
let PlanetFleet = class PlanetFleet {
    smallCargo;
    largeCargo;
    lightFighter;
    heavyFighter;
    cruiser;
    battleship;
    battlecruiser;
    bomber;
    destroyer;
    deathstar;
    recycler;
    espionageProbe;
    solarSatellite;
    colonyShip;
};
exports.PlanetFleet = PlanetFleet;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "smallCargo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "largeCargo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "lightFighter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "heavyFighter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "cruiser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "battleship", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "battlecruiser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "bomber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "destroyer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "deathstar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "recycler", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "espionageProbe", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "solarSatellite", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetFleet.prototype, "colonyShip", void 0);
exports.PlanetFleet = PlanetFleet = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetFleet);
let PlanetDefense = class PlanetDefense {
    rocketLauncher;
    lightLaser;
    heavyLaser;
    gaussCannon;
    ionCannon;
    plasmaTurret;
    smallShieldDome;
    largeShieldDome;
    antiBallisticMissile;
    interplanetaryMissile;
};
exports.PlanetDefense = PlanetDefense;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "rocketLauncher", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "lightLaser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "heavyLaser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "gaussCannon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "ionCannon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "plasmaTurret", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "smallShieldDome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "largeShieldDome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "antiBallisticMissile", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetDefense.prototype, "interplanetaryMissile", void 0);
exports.PlanetDefense = PlanetDefense = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetDefense);
let PlanetInfo = class PlanetInfo {
    maxFields;
    usedFields;
    tempMin;
    tempMax;
    planetType;
    diameter;
};
exports.PlanetInfo = PlanetInfo;
__decorate([
    (0, mongoose_1.Prop)({ default: 163 }),
    __metadata("design:type", Number)
], PlanetInfo.prototype, "maxFields", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PlanetInfo.prototype, "usedFields", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 50 }),
    __metadata("design:type", Number)
], PlanetInfo.prototype, "tempMin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 90 }),
    __metadata("design:type", Number)
], PlanetInfo.prototype, "tempMax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'normaltemp' }),
    __metadata("design:type", String)
], PlanetInfo.prototype, "planetType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 12800 }),
    __metadata("design:type", Number)
], PlanetInfo.prototype, "diameter", void 0);
exports.PlanetInfo = PlanetInfo = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetInfo);
let ProgressInfo = class ProgressInfo {
    type;
    name;
    quantity;
    builtCount;
    singleUnitBuildTime;
    startTime;
    finishTime;
};
exports.ProgressInfo = ProgressInfo;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ProgressInfo.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ProgressInfo.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ProgressInfo.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ProgressInfo.prototype, "builtCount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ProgressInfo.prototype, "singleUnitBuildTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ProgressInfo.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ProgressInfo.prototype, "finishTime", void 0);
exports.ProgressInfo = ProgressInfo = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ProgressInfo);
let Planet = class Planet {
    ownerId;
    coordinate;
    name;
    isHomeworld;
    type;
    resources;
    mines;
    facilities;
    fleet;
    defense;
    planetInfo;
    constructionProgress;
    fleetProgress;
    defenseProgress;
    lastResourceUpdate;
};
exports.Planet = Planet;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Planet.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Planet.prototype, "coordinate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Planet.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Planet.prototype, "isHomeworld", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'planet' }),
    __metadata("design:type", String)
], Planet.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetResources, default: () => ({}) }),
    __metadata("design:type", PlanetResources)
], Planet.prototype, "resources", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetMines, default: () => ({}) }),
    __metadata("design:type", PlanetMines)
], Planet.prototype, "mines", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetFacilities, default: () => ({}) }),
    __metadata("design:type", PlanetFacilities)
], Planet.prototype, "facilities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetFleet, default: () => ({}) }),
    __metadata("design:type", PlanetFleet)
], Planet.prototype, "fleet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetDefense, default: () => ({}) }),
    __metadata("design:type", PlanetDefense)
], Planet.prototype, "defense", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetInfo, default: () => ({}) }),
    __metadata("design:type", PlanetInfo)
], Planet.prototype, "planetInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], Planet.prototype, "constructionProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], Planet.prototype, "fleetProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], Planet.prototype, "defenseProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Planet.prototype, "lastResourceUpdate", void 0);
exports.Planet = Planet = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Planet);
exports.PlanetSchema = mongoose_1.SchemaFactory.createForClass(Planet);
function generatePlanetCharacteristics(position) {
    const fieldRanges = {
        1: { min: 40, max: 90 },
        2: { min: 50, max: 95 },
        3: { min: 55, max: 95 },
        4: { min: 100, max: 240 },
        5: { min: 95, max: 240 },
        6: { min: 80, max: 230 },
        7: { min: 115, max: 180 },
        8: { min: 120, max: 180 },
        9: { min: 125, max: 190 },
        10: { min: 75, max: 125 },
        11: { min: 80, max: 120 },
        12: { min: 85, max: 130 },
        13: { min: 60, max: 160 },
        14: { min: 40, max: 300 },
        15: { min: 50, max: 150 },
    };
    let planetType;
    let tempMin;
    let tempMax;
    if (position >= 1 && position <= 3) {
        planetType = 'trocken';
        tempMin = Math.floor(Math.random() * 101);
        tempMax = tempMin + 40;
    }
    else if (position >= 4 && position <= 6) {
        planetType = 'dschjungel';
        tempMin = Math.floor(Math.random() * 101) - 25;
        tempMax = tempMin + 40;
    }
    else if (position >= 7 && position <= 9) {
        planetType = 'normaltemp';
        tempMin = Math.floor(Math.random() * 101) - 50;
        tempMax = tempMin + 40;
    }
    else if (position >= 10 && position <= 12) {
        planetType = 'wasser';
        tempMin = Math.floor(Math.random() * 101) - 75;
        tempMax = tempMin + 40;
    }
    else {
        planetType = 'eis';
        tempMin = Math.floor(Math.random() * 111) - 100;
        tempMax = tempMin + 40;
    }
    const range = fieldRanges[position] || { min: 100, max: 200 };
    const baseFields = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const addon = Math.floor(Math.random() * 111) - Math.floor(Math.random() * 101);
    const maxFields = Math.max(40, baseFields + addon);
    const diameter = Math.floor(Math.sqrt(maxFields) * 1000);
    return { planetType, tempMin, tempMax, maxFields, diameter };
}
//# sourceMappingURL=planet.schema.js.map