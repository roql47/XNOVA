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
exports.BattleSimulatorService = void 0;
const common_1 = require("@nestjs/common");
const battle_service_1 = require("./battle.service");
const battle_report_service_1 = require("./battle-report.service");
const game_data_1 = require("../constants/game-data");
const FLEET_GID_MAP = {
    202: 'smallCargo',
    203: 'largeCargo',
    204: 'lightFighter',
    205: 'heavyFighter',
    206: 'cruiser',
    207: 'battleship',
    208: 'colonyShip',
    209: 'recycler',
    210: 'espionageProbe',
    211: 'bomber',
    212: 'solarSatellite',
    213: 'destroyer',
    214: 'deathstar',
    215: 'battlecruiser',
};
const DEFENSE_GID_MAP = {
    401: 'rocketLauncher',
    402: 'lightLaser',
    403: 'heavyLaser',
    404: 'gaussCannon',
    405: 'ionCannon',
    406: 'plasmaTurret',
    407: 'smallShieldDome',
    408: 'largeShieldDome',
};
const REVERSE_FLEET_GID_MAP = Object.fromEntries(Object.entries(FLEET_GID_MAP).map(([k, v]) => [v, parseInt(k)]));
const REVERSE_DEFENSE_GID_MAP = Object.fromEntries(Object.entries(DEFENSE_GID_MAP).map(([k, v]) => [v, parseInt(k)]));
let BattleSimulatorService = class BattleSimulatorService {
    battleService;
    battleReportService;
    constructor(battleService, battleReportService) {
        this.battleService = battleService;
        this.battleReportService = battleReportService;
    }
    getDefaultConfig() {
        return {
            rapidFire: true,
            fleetInDebris: 30,
            defenseInDebris: 0,
            debug: false,
        };
    }
    generateBattleSourceData(attackers, defenders, config) {
        let source = '';
        source += `Rapidfire = ${config.rapidFire ? 1 : 0}\n`;
        source += `FID = ${config.fleetInDebris}\n`;
        source += `DID = ${config.defenseInDebris}\n`;
        source += `Attackers = ${attackers.length}\n`;
        source += `Defenders = ${defenders.length}\n`;
        for (let n = 0; n < attackers.length; n++) {
            const a = attackers[n];
            const [g, s, p] = a.coordinate.split(':');
            source += `Attacker${n} = ({${a.name}} ${a.id} ${g} ${s} ${p} `;
            source += `${a.weaponsTech} ${a.shieldTech} ${a.armorTech} `;
            for (let gid = 202; gid <= 215; gid++) {
                const type = FLEET_GID_MAP[gid];
                if (type) {
                    source += `${a.fleet[type] || 0} `;
                }
            }
            source += ')\n';
        }
        for (let n = 0; n < defenders.length; n++) {
            const d = defenders[n];
            const [g, s, p] = d.coordinate.split(':');
            source += `Defender${n} = ({${d.name}} ${d.id} ${g} ${s} ${p} `;
            source += `${d.weaponsTech} ${d.shieldTech} ${d.armorTech} `;
            for (let gid = 202; gid <= 215; gid++) {
                const type = FLEET_GID_MAP[gid];
                if (type) {
                    source += `${d.fleet[type] || 0} `;
                }
            }
            for (let gid = 401; gid <= 408; gid++) {
                const type = DEFENSE_GID_MAP[gid];
                if (type && d.defense) {
                    source += `${d.defense[type] || 0} `;
                }
                else {
                    source += '0 ';
                }
            }
            source += ')\n';
        }
        return source;
    }
    parseBattleSourceData(source) {
        const attackers = [];
        const defenders = [];
        const lines = source.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('Attacker')) {
                const match = trimmedLine.match(/Attacker(\d+)\s*=\s*\((.+)\)/);
                if (match) {
                    const index = parseInt(match[1]);
                    const data = match[2];
                    const nameMatch = data.match(/\{([^}]+)\}/);
                    const name = nameMatch ? nameMatch[1] : 'Unknown';
                    const valuesStr = data.substring(data.indexOf('}') + 1).trim();
                    const values = valuesStr.split(/\s+/).map(v => parseInt(v) || 0);
                    const fleet = {};
                    let fleetIndex = 7;
                    for (let gid = 202; gid <= 215; gid++) {
                        const type = FLEET_GID_MAP[gid];
                        if (type && values[fleetIndex] !== undefined) {
                            fleet[type] = values[fleetIndex];
                        }
                        fleetIndex++;
                    }
                    attackers[index] = {
                        name,
                        id: values[0]?.toString() || '0',
                        coordinate: `${values[1]}:${values[2]}:${values[3]}`,
                        weaponsTech: values[4] || 0,
                        shieldTech: values[5] || 0,
                        armorTech: values[6] || 0,
                        fleet,
                    };
                }
            }
            else if (trimmedLine.startsWith('Defender')) {
                const match = trimmedLine.match(/Defender(\d+)\s*=\s*\((.+)\)/);
                if (match) {
                    const index = parseInt(match[1]);
                    const data = match[2];
                    const nameMatch = data.match(/\{([^}]+)\}/);
                    const name = nameMatch ? nameMatch[1] : 'Unknown';
                    const valuesStr = data.substring(data.indexOf('}') + 1).trim();
                    const values = valuesStr.split(/\s+/).map(v => parseInt(v) || 0);
                    const fleet = {};
                    const defense = {};
                    let valueIndex = 7;
                    for (let gid = 202; gid <= 215; gid++) {
                        const type = FLEET_GID_MAP[gid];
                        if (type && values[valueIndex] !== undefined) {
                            fleet[type] = values[valueIndex];
                        }
                        valueIndex++;
                    }
                    for (let gid = 401; gid <= 408; gid++) {
                        const type = DEFENSE_GID_MAP[gid];
                        if (type && values[valueIndex] !== undefined) {
                            defense[type] = values[valueIndex];
                        }
                        valueIndex++;
                    }
                    defenders[index] = {
                        name,
                        id: values[0]?.toString() || '0',
                        coordinate: `${values[1]}:${values[2]}:${values[3]}`,
                        weaponsTech: values[4] || 0,
                        shieldTech: values[5] || 0,
                        armorTech: values[6] || 0,
                        fleet,
                        defense,
                    };
                }
            }
        }
        return { attackers, defenders };
    }
    calculateLosses(attackers, defenders, battleResult, repaired) {
        const attackerLosses = {
            metal: battleResult.attackerLosses.metal,
            crystal: battleResult.attackerLosses.crystal,
            deuterium: battleResult.attackerLosses.deuterium,
            total: 0,
        };
        attackerLosses.total = attackerLosses.metal + attackerLosses.crystal + attackerLosses.deuterium;
        const defenderLosses = {
            metal: battleResult.defenderLosses.metal,
            crystal: battleResult.defenderLosses.crystal,
            deuterium: battleResult.defenderLosses.deuterium,
            total: 0,
        };
        for (const [type, count] of Object.entries(repaired)) {
            if (count > 0 && game_data_1.DEFENSE_DATA[type]) {
                const cost = game_data_1.DEFENSE_DATA[type].cost;
                defenderLosses.metal -= (cost.metal || 0) * count;
                defenderLosses.crystal -= (cost.crystal || 0) * count;
                defenderLosses.deuterium -= (cost.deuterium || 0) * count;
            }
        }
        defenderLosses.metal = Math.max(0, defenderLosses.metal);
        defenderLosses.crystal = Math.max(0, defenderLosses.crystal);
        defenderLosses.deuterium = Math.max(0, defenderLosses.deuterium);
        defenderLosses.total = defenderLosses.metal + defenderLosses.crystal + defenderLosses.deuterium;
        return { attackerLosses, defenderLosses };
    }
    mergeFleets(slots) {
        const mergedFleet = {};
        let totalWeaponsTech = 0;
        let totalShieldTech = 0;
        let totalArmorTech = 0;
        let totalUnits = 0;
        for (const slot of slots) {
            for (const [type, count] of Object.entries(slot.fleet)) {
                if (count > 0) {
                    mergedFleet[type] = (mergedFleet[type] || 0) + count;
                    totalWeaponsTech += slot.weaponsTech * count;
                    totalShieldTech += slot.shieldTech * count;
                    totalArmorTech += slot.armorTech * count;
                    totalUnits += count;
                }
            }
        }
        const avgWeaponsTech = totalUnits > 0 ? Math.floor(totalWeaponsTech / totalUnits) : 0;
        const avgShieldTech = totalUnits > 0 ? Math.floor(totalShieldTech / totalUnits) : 0;
        const avgArmorTech = totalUnits > 0 ? Math.floor(totalArmorTech / totalUnits) : 0;
        return { fleet: mergedFleet, avgWeaponsTech, avgShieldTech, avgArmorTech };
    }
    mergeDefenders(slots) {
        const mergedFleet = {};
        const mergedDefense = {};
        let totalWeaponsTech = 0;
        let totalShieldTech = 0;
        let totalArmorTech = 0;
        let totalUnits = 0;
        for (const slot of slots) {
            for (const [type, count] of Object.entries(slot.fleet)) {
                if (count > 0) {
                    mergedFleet[type] = (mergedFleet[type] || 0) + count;
                    totalWeaponsTech += slot.weaponsTech * count;
                    totalShieldTech += slot.shieldTech * count;
                    totalArmorTech += slot.armorTech * count;
                    totalUnits += count;
                }
            }
            if (slot.defense) {
                for (const [type, count] of Object.entries(slot.defense)) {
                    if (count > 0) {
                        mergedDefense[type] = (mergedDefense[type] || 0) + count;
                        totalWeaponsTech += slot.weaponsTech * count;
                        totalShieldTech += slot.shieldTech * count;
                        totalArmorTech += slot.armorTech * count;
                        totalUnits += count;
                    }
                }
            }
        }
        const avgWeaponsTech = totalUnits > 0 ? Math.floor(totalWeaponsTech / totalUnits) : 0;
        const avgShieldTech = totalUnits > 0 ? Math.floor(totalShieldTech / totalUnits) : 0;
        const avgArmorTech = totalUnits > 0 ? Math.floor(totalArmorTech / totalUnits) : 0;
        return { fleet: mergedFleet, defense: mergedDefense, avgWeaponsTech, avgShieldTech, avgArmorTech };
    }
    simulate(request) {
        const config = { ...this.getDefaultConfig(), ...request.config };
        let attackers = request.attackers;
        let defenders = request.defenders;
        if (request.battleSource) {
            const parsed = this.parseBattleSourceData(request.battleSource);
            attackers = parsed.attackers;
            defenders = parsed.defenders;
        }
        const sourceData = config.debug
            ? this.generateBattleSourceData(attackers, defenders, config)
            : undefined;
        const mergedAttacker = this.mergeFleets(attackers);
        const mergedDefender = this.mergeDefenders(defenders);
        const battleResult = this.battleService.simulateBattle(mergedAttacker.fleet, mergedDefender.fleet, mergedDefender.defense, {
            weaponsTech: mergedAttacker.avgWeaponsTech,
            shieldTech: mergedAttacker.avgShieldTech,
            armorTech: mergedAttacker.avgArmorTech,
        }, {
            weaponsTech: mergedDefender.avgWeaponsTech,
            shieldTech: mergedDefender.avgShieldTech,
            armorTech: mergedDefender.avgArmorTech,
        });
        battleResult.before = {
            attackers: attackers.map(a => ({
                name: a.name,
                id: a.id,
                coordinate: a.coordinate,
                weaponsTech: a.weaponsTech,
                shieldTech: a.shieldTech,
                armorTech: a.armorTech,
                fleet: a.fleet,
            })),
            defenders: defenders.map(d => ({
                name: d.name,
                id: d.id,
                coordinate: d.coordinate,
                weaponsTech: d.weaponsTech,
                shieldTech: d.shieldTech,
                armorTech: d.armorTech,
                fleet: d.fleet,
                defense: d.defense,
            })),
        };
        const { attackerLosses, defenderLosses } = this.calculateLosses(attackers, defenders, battleResult, battleResult.restoredDefenses);
        const htmlReport = this.battleReportService.generateBattleReport(battleResult, { metal: 0, crystal: 0, deuterium: 0 }, battleResult.restoredDefenses);
        let resultType;
        if (battleResult.attackerWon) {
            resultType = 'awon';
        }
        else if (battleResult.defenderWon) {
            resultType = 'dwon';
        }
        else {
            resultType = 'draw';
        }
        return {
            battleResult: battleResult,
            htmlReport,
            attackerLosses,
            defenderLosses,
            debris: battleResult.debris,
            moonChance: battleResult.moonChance,
            moonCreated: battleResult.moonCreated,
            restoredDefenses: battleResult.restoredDefenses,
            resultType,
            sourceData,
        };
    }
    simulateSimple(attackerFleet, attackerTech, defenderFleet, defenderDefense, defenderTech, config) {
        return this.simulate({
            attackers: [{
                    name: '공격자',
                    id: 'attacker',
                    coordinate: '1:1:1',
                    weaponsTech: attackerTech.weaponsTech,
                    shieldTech: attackerTech.shieldTech,
                    armorTech: attackerTech.armorTech,
                    fleet: attackerFleet,
                }],
            defenders: [{
                    name: '방어자',
                    id: 'defender',
                    coordinate: '1:1:2',
                    weaponsTech: defenderTech.weaponsTech,
                    shieldTech: defenderTech.shieldTech,
                    armorTech: defenderTech.armorTech,
                    fleet: defenderFleet,
                    defense: defenderDefense,
                }],
            config,
        });
    }
    simulateMultiple(request, iterations = 100) {
        let attackerWins = 0;
        let defenderWins = 0;
        let draws = 0;
        const totalAttackerLosses = { metal: 0, crystal: 0, deuterium: 0 };
        const totalDefenderLosses = { metal: 0, crystal: 0, deuterium: 0 };
        const totalDebris = { metal: 0, crystal: 0 };
        for (let i = 0; i < iterations; i++) {
            const result = this.simulate(request);
            if (result.resultType === 'awon')
                attackerWins++;
            else if (result.resultType === 'dwon')
                defenderWins++;
            else
                draws++;
            totalAttackerLosses.metal += result.attackerLosses.metal;
            totalAttackerLosses.crystal += result.attackerLosses.crystal;
            totalAttackerLosses.deuterium += result.attackerLosses.deuterium;
            totalDefenderLosses.metal += result.defenderLosses.metal;
            totalDefenderLosses.crystal += result.defenderLosses.crystal;
            totalDefenderLosses.deuterium += result.defenderLosses.deuterium;
            totalDebris.metal += result.debris.metal;
            totalDebris.crystal += result.debris.crystal;
        }
        return {
            attackerWinRate: (attackerWins / iterations) * 100,
            defenderWinRate: (defenderWins / iterations) * 100,
            drawRate: (draws / iterations) * 100,
            avgAttackerLosses: {
                metal: Math.floor(totalAttackerLosses.metal / iterations),
                crystal: Math.floor(totalAttackerLosses.crystal / iterations),
                deuterium: Math.floor(totalAttackerLosses.deuterium / iterations),
            },
            avgDefenderLosses: {
                metal: Math.floor(totalDefenderLosses.metal / iterations),
                crystal: Math.floor(totalDefenderLosses.crystal / iterations),
                deuterium: Math.floor(totalDefenderLosses.deuterium / iterations),
            },
            avgDebris: {
                metal: Math.floor(totalDebris.metal / iterations),
                crystal: Math.floor(totalDebris.crystal / iterations),
            },
            iterations,
        };
    }
};
exports.BattleSimulatorService = BattleSimulatorService;
exports.BattleSimulatorService = BattleSimulatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [battle_service_1.BattleService,
        battle_report_service_1.BattleReportService])
], BattleSimulatorService);
//# sourceMappingURL=battle-simulator.service.js.map