"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const game_controller_1 = require("./game.controller");
const resources_service_1 = require("./services/resources.service");
const buildings_service_1 = require("./services/buildings.service");
const research_service_1 = require("./services/research.service");
const fleet_service_1 = require("./services/fleet.service");
const defense_service_1 = require("./services/defense.service");
const battle_service_1 = require("./services/battle.service");
const battle_report_service_1 = require("./services/battle-report.service");
const battle_simulator_service_1 = require("./services/battle-simulator.service");
const user_module_1 = require("../user/user.module");
const message_module_1 = require("../message/message.module");
const galaxy_module_1 = require("../galaxy/galaxy.module");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [user_module_1.UserModule, message_module_1.MessageModule, galaxy_module_1.GalaxyModule],
        controllers: [game_controller_1.GameController],
        providers: [
            resources_service_1.ResourcesService,
            buildings_service_1.BuildingsService,
            research_service_1.ResearchService,
            fleet_service_1.FleetService,
            defense_service_1.DefenseService,
            battle_service_1.BattleService,
            battle_report_service_1.BattleReportService,
            battle_simulator_service_1.BattleSimulatorService,
        ],
        exports: [
            resources_service_1.ResourcesService,
            buildings_service_1.BuildingsService,
            research_service_1.ResearchService,
            fleet_service_1.FleetService,
            defense_service_1.DefenseService,
            battle_service_1.BattleService,
            battle_report_service_1.BattleReportService,
            battle_simulator_service_1.BattleSimulatorService,
        ],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map