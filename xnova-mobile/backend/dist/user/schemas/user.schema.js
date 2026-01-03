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
exports.UserSchema = exports.User = exports.VacationMode = exports.ReturnProgress = exports.AttackProgress = exports.ProgressInfo = exports.Defense = exports.Fleet = exports.ResearchLevels = exports.PlanetInfo = exports.Facilities = exports.Mines = exports.Resources = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Resources = class Resources {
    metal;
    crystal;
    deuterium;
    energy;
};
exports.Resources = Resources;
__decorate([
    (0, mongoose_1.Prop)({ default: 5000 }),
    __metadata("design:type", Number)
], Resources.prototype, "metal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 2500 }),
    __metadata("design:type", Number)
], Resources.prototype, "crystal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1500 }),
    __metadata("design:type", Number)
], Resources.prototype, "deuterium", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Resources.prototype, "energy", void 0);
exports.Resources = Resources = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Resources);
let Mines = class Mines {
    metalMine;
    crystalMine;
    deuteriumMine;
    solarPlant;
    fusionReactor;
};
exports.Mines = Mines;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Mines.prototype, "metalMine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Mines.prototype, "crystalMine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Mines.prototype, "deuteriumMine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Mines.prototype, "solarPlant", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Mines.prototype, "fusionReactor", void 0);
exports.Mines = Mines = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Mines);
let Facilities = class Facilities {
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
exports.Facilities = Facilities;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "robotFactory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "shipyard", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "researchLab", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "nanoFactory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "terraformer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "allianceDepot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "missileSilo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "metalStorage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "crystalStorage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "deuteriumTank", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "lunarBase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "sensorPhalanx", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Facilities.prototype, "jumpGate", void 0);
exports.Facilities = Facilities = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Facilities);
let PlanetInfo = class PlanetInfo {
    maxFields;
    usedFields;
    temperature;
    planetType;
    isMoon;
    planetName;
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
], PlanetInfo.prototype, "temperature", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'normaltemp' }),
    __metadata("design:type", String)
], PlanetInfo.prototype, "planetType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PlanetInfo.prototype, "isMoon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], PlanetInfo.prototype, "planetName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 12800 }),
    __metadata("design:type", Number)
], PlanetInfo.prototype, "diameter", void 0);
exports.PlanetInfo = PlanetInfo = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PlanetInfo);
let ResearchLevels = class ResearchLevels {
    energyTech;
    laserTech;
    ionTech;
    hyperspaceTech;
    plasmaTech;
    combustionDrive;
    impulseDrive;
    hyperspaceDrive;
    espionageTech;
    computerTech;
    astrophysics;
    intergalacticResearch;
    gravitonTech;
    weaponsTech;
    shieldTech;
    armorTech;
};
exports.ResearchLevels = ResearchLevels;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "energyTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "laserTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "ionTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "hyperspaceTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "plasmaTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "combustionDrive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "impulseDrive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "hyperspaceDrive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "espionageTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "computerTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "astrophysics", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "intergalacticResearch", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "gravitonTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "weaponsTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "shieldTech", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ResearchLevels.prototype, "armorTech", void 0);
exports.ResearchLevels = ResearchLevels = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ResearchLevels);
let Fleet = class Fleet {
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
};
exports.Fleet = Fleet;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "smallCargo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "largeCargo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "lightFighter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "heavyFighter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "cruiser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "battleship", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "battlecruiser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "bomber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "destroyer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "deathstar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "recycler", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "espionageProbe", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Fleet.prototype, "solarSatellite", void 0);
exports.Fleet = Fleet = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Fleet);
let Defense = class Defense {
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
exports.Defense = Defense;
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "rocketLauncher", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "lightLaser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "heavyLaser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "gaussCannon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "ionCannon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "plasmaTurret", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "smallShieldDome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "largeShieldDome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "antiBallisticMissile", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Defense.prototype, "interplanetaryMissile", void 0);
exports.Defense = Defense = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Defense);
let ProgressInfo = class ProgressInfo {
    type;
    name;
    quantity;
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
    __metadata("design:type", Date)
], ProgressInfo.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ProgressInfo.prototype, "finishTime", void 0);
exports.ProgressInfo = ProgressInfo = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ProgressInfo);
let AttackProgress = class AttackProgress {
    targetCoord;
    targetUserId;
    fleet;
    capacity;
    travelTime;
    startTime;
    arrivalTime;
    battleCompleted;
    transportResources;
};
exports.AttackProgress = AttackProgress;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AttackProgress.prototype, "targetCoord", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AttackProgress.prototype, "targetUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], AttackProgress.prototype, "fleet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AttackProgress.prototype, "capacity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AttackProgress.prototype, "travelTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AttackProgress.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AttackProgress.prototype, "arrivalTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AttackProgress.prototype, "battleCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], AttackProgress.prototype, "transportResources", void 0);
exports.AttackProgress = AttackProgress = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AttackProgress);
let ReturnProgress = class ReturnProgress {
    fleet;
    loot;
    returnTime;
    startTime;
};
exports.ReturnProgress = ReturnProgress;
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], ReturnProgress.prototype, "fleet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], ReturnProgress.prototype, "loot", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ReturnProgress.prototype, "returnTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ReturnProgress.prototype, "startTime", void 0);
exports.ReturnProgress = ReturnProgress = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ReturnProgress);
let VacationMode = class VacationMode {
    isActive;
    startTime;
    minEndTime;
};
exports.VacationMode = VacationMode;
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], VacationMode.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], VacationMode.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], VacationMode.prototype, "minEndTime", void 0);
exports.VacationMode = VacationMode = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], VacationMode);
let User = class User {
    email;
    password;
    googleId;
    playerName;
    coordinate;
    vacationMode;
    resources;
    mines;
    facilities;
    planetInfo;
    researchLevels;
    fleet;
    defense;
    constructionProgress;
    researchProgress;
    fleetProgress;
    defenseProgress;
    pendingAttack;
    pendingReturn;
    incomingAttack;
    lastResourceUpdate;
    lastActivity;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ unique: true, sparse: true }),
    __metadata("design:type", String)
], User.prototype, "googleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "playerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "coordinate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: VacationMode, default: () => ({ isActive: false, startTime: null, minEndTime: null }) }),
    __metadata("design:type", VacationMode)
], User.prototype, "vacationMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Resources, default: () => ({}) }),
    __metadata("design:type", Resources)
], User.prototype, "resources", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Mines, default: () => ({}) }),
    __metadata("design:type", Mines)
], User.prototype, "mines", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Facilities, default: () => ({}) }),
    __metadata("design:type", Facilities)
], User.prototype, "facilities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PlanetInfo, default: () => ({}) }),
    __metadata("design:type", PlanetInfo)
], User.prototype, "planetInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ResearchLevels, default: () => ({}) }),
    __metadata("design:type", ResearchLevels)
], User.prototype, "researchLevels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Fleet, default: () => ({}) }),
    __metadata("design:type", Fleet)
], User.prototype, "fleet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Defense, default: () => ({}) }),
    __metadata("design:type", Defense)
], User.prototype, "defense", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], User.prototype, "constructionProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], User.prototype, "researchProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], User.prototype, "fleetProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ProgressInfo, default: null }),
    __metadata("design:type", Object)
], User.prototype, "defenseProgress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AttackProgress, default: null }),
    __metadata("design:type", Object)
], User.prototype, "pendingAttack", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ReturnProgress, default: null }),
    __metadata("design:type", Object)
], User.prototype, "pendingReturn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AttackProgress, default: null }),
    __metadata("design:type", Object)
], User.prototype, "incomingAttack", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], User.prototype, "lastResourceUpdate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], User.prototype, "lastActivity", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
//# sourceMappingURL=user.schema.js.map