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
exports.BattleService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../user/schemas/user.schema");
const planet_schema_1 = require("../../planet/schemas/planet.schema");
const resources_service_1 = require("./resources.service");
const fleet_service_1 = require("./fleet.service");
const ranking_service_1 = require("./ranking.service");
const game_data_1 = require("../constants/game-data");
const message_service_1 = require("../../message/message.service");
const galaxy_service_1 = require("../../galaxy/galaxy.service");
const battle_report_service_1 = require("./battle-report.service");
const FLEET_IN_DEBRIS = 0.3;
const DEFENSE_IN_DEBRIS = 0;
let BattleService = class BattleService {
    userModel;
    planetModel;
    resourcesService;
    fleetService;
    rankingService;
    messageService;
    galaxyService;
    battleReportService;
    constructor(userModel, planetModel, resourcesService, fleetService, rankingService, messageService, galaxyService, battleReportService) {
        this.userModel = userModel;
        this.planetModel = planetModel;
        this.resourcesService = resourcesService;
        this.fleetService = fleetService;
        this.rankingService = rankingService;
        this.messageService = messageService;
        this.galaxyService = galaxyService;
        this.battleReportService = battleReportService;
    }
    async findPlanetByCoordinate(coordinate) {
        const user = await this.userModel.findOne({ coordinate }).exec();
        if (user) {
            return { user, planet: null, ownerId: user._id.toString() };
        }
        const planet = await this.planetModel.findOne({ coordinate }).exec();
        if (planet) {
            const owner = await this.userModel.findById(planet.ownerId).exec();
            return { user: owner, planet, ownerId: planet.ownerId };
        }
        return { user: null, planet: null, ownerId: null };
    }
    calculateAttackPower(baseAttack, weaponsTech) {
        return Math.floor(baseAttack * (10 + weaponsTech) / 10);
    }
    calculateMaxShield(baseShield, shieldTech) {
        return Math.floor(baseShield * (10 + shieldTech) / 10);
    }
    calculateHull(structure, armorTech) {
        return Math.floor(structure * 0.1 * (10 + armorTech) / 10);
    }
    performAttack(attacker, target) {
        const result = { absorbed: 0, hullDamage: 0 };
        if (target.exploded) {
            return result;
        }
        const attackPower = attacker.attack;
        if (target.shield === 0) {
            target.hull -= attackPower;
            result.hullDamage = attackPower;
            if (target.hull < 0)
                target.hull = 0;
            return result;
        }
        const shieldOnePercent = target.maxShield * 0.01;
        if (attackPower < shieldOnePercent) {
            return result;
        }
        const depleted = Math.floor(attackPower / shieldOnePercent);
        const shieldDamage = depleted * shieldOnePercent;
        if (target.shield >= shieldDamage) {
            target.shield -= shieldDamage;
            result.absorbed = attackPower;
            return result;
        }
        const remainingDamage = attackPower - target.shield;
        result.absorbed = target.shield;
        target.shield = 0;
        target.hull -= remainingDamage;
        result.hullDamage = remainingDamage;
        if (target.hull < 0)
            target.hull = 0;
        return result;
    }
    checkExploded(unit) {
        if (unit.exploded)
            return true;
        if (unit.hull <= 0)
            return true;
        if (unit.hull > unit.maxHull * 0.7) {
            return false;
        }
        if (unit.shield > 0) {
            return false;
        }
        const explosionChance = Math.floor((unit.hull * 100) / unit.maxHull);
        const random = Math.floor(Math.random() * 100);
        if (random >= explosionChance || unit.hull <= 0) {
            return true;
        }
        return false;
    }
    checkRapidFire(attackingUnit, targetUnit) {
        const rapidFireValue = attackingUnit.rapidFire[targetUnit.type];
        if (!rapidFireValue || rapidFireValue <= 1) {
            return false;
        }
        const threshold = Math.floor(1000 / rapidFireValue);
        const random = Math.floor(Math.random() * 1000) + 1;
        return random > threshold;
    }
    checkFastDraw(attackerUnits, defenderUnits) {
        for (const unit of attackerUnits) {
            if (unit.hull < unit.maxHull) {
                return false;
            }
        }
        for (const unit of defenderUnits) {
            if (unit.hull < unit.maxHull) {
                return false;
            }
        }
        return true;
    }
    simulateBattle(attackerFleet, defenderFleet, defenderDefense, attackerResearch = {}, defenderResearch = {}) {
        const attackerWeaponsTech = attackerResearch.weaponsTech || 0;
        const attackerShieldTech = attackerResearch.shieldTech || 0;
        const attackerArmorTech = attackerResearch.armorTech || 0;
        const defenderWeaponsTech = defenderResearch.weaponsTech || 0;
        const defenderShieldTech = defenderResearch.shieldTech || 0;
        const defenderArmorTech = defenderResearch.armorTech || 0;
        const result = {
            attackerWon: false,
            defenderWon: false,
            draw: false,
            initialAttackerFleet: { ...attackerFleet },
            initialDefenderFleet: { ...defenderFleet },
            initialDefenderDefense: { ...defenderDefense },
            survivingAttackerFleet: {},
            survivingDefenderFleet: {},
            survivingDefenderDefense: {},
            restoredDefenses: {},
            rounds: [],
            attackerLosses: { metal: 0, crystal: 0, deuterium: 0 },
            defenderLosses: { metal: 0, crystal: 0, deuterium: 0 },
            debris: { metal: 0, crystal: 0 },
            loot: { metal: 0, crystal: 0, deuterium: 0 },
            moonChance: 0,
            moonCreated: false,
        };
        let attackerUnits = [];
        for (const type in attackerFleet) {
            if (attackerFleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const fleetStats = game_data_1.FLEET_DATA[type].stats;
                const rapidFire = game_data_1.FLEET_DATA[type].rapidFire || {};
                const structure = fleetStats.hull;
                const attack = this.calculateAttackPower(fleetStats.attack, attackerWeaponsTech);
                const maxShield = this.calculateMaxShield(fleetStats.shield, attackerShieldTech);
                const maxHull = this.calculateHull(structure, attackerArmorTech);
                for (let i = 0; i < attackerFleet[type]; i++) {
                    attackerUnits.push({
                        id: `attacker_${type}_${i}`,
                        type,
                        side: 'attacker',
                        attack,
                        baseAttack: fleetStats.attack,
                        shield: maxShield,
                        maxShield,
                        hull: maxHull,
                        maxHull,
                        structure,
                        rapidFire,
                        isDefense: false,
                        exploded: false,
                    });
                }
            }
        }
        let defenderUnits = [];
        for (const type in defenderFleet) {
            if (defenderFleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const fleetStats = game_data_1.FLEET_DATA[type].stats;
                const rapidFire = game_data_1.FLEET_DATA[type].rapidFire || {};
                const structure = fleetStats.hull;
                const attack = this.calculateAttackPower(fleetStats.attack, defenderWeaponsTech);
                const maxShield = this.calculateMaxShield(fleetStats.shield, defenderShieldTech);
                const maxHull = this.calculateHull(structure, defenderArmorTech);
                for (let i = 0; i < defenderFleet[type]; i++) {
                    defenderUnits.push({
                        id: `defender_${type}_${i}`,
                        type,
                        side: 'defender',
                        attack,
                        baseAttack: fleetStats.attack,
                        shield: maxShield,
                        maxShield,
                        hull: maxHull,
                        maxHull,
                        structure,
                        rapidFire,
                        isDefense: false,
                        exploded: false,
                    });
                }
            }
        }
        for (const type in defenderDefense) {
            if (defenderDefense[type] > 0 && game_data_1.DEFENSE_DATA[type]) {
                const defenseStats = game_data_1.DEFENSE_DATA[type].stats;
                const structure = defenseStats.hull;
                const attack = this.calculateAttackPower(defenseStats.attack, defenderWeaponsTech);
                const maxShield = this.calculateMaxShield(defenseStats.shield, defenderShieldTech);
                const maxHull = this.calculateHull(structure, defenderArmorTech);
                for (let i = 0; i < defenderDefense[type]; i++) {
                    defenderUnits.push({
                        id: `defense_${type}_${i}`,
                        type,
                        side: 'defender',
                        attack,
                        baseAttack: defenseStats.attack,
                        shield: maxShield,
                        maxShield,
                        hull: maxHull,
                        maxHull,
                        structure,
                        rapidFire: {},
                        isDefense: true,
                        exploded: false,
                    });
                }
            }
        }
        const MAX_ROUNDS = 6;
        for (let round = 0; round < MAX_ROUNDS; round++) {
            if (attackerUnits.length === 0 || defenderUnits.length === 0) {
                break;
            }
            const roundInfo = {
                round: round + 1,
                ashoot: 0,
                apower: 0,
                dabsorb: 0,
                dshoot: 0,
                dpower: 0,
                aabsorb: 0,
                attackers: [],
                defenders: [],
                destroyedAttackerShips: {},
                destroyedDefenderShips: {},
                rapidFireCount: 0,
            };
            for (const unit of attackerUnits) {
                unit.shield = unit.maxShield;
            }
            for (const unit of defenderUnits) {
                unit.shield = unit.maxShield;
            }
            const attackerHullsBefore = attackerUnits.map(u => u.hull);
            const defenderHullsBefore = defenderUnits.map(u => u.hull);
            for (const attackingUnit of attackerUnits) {
                if (attackingUnit.exploded || attackingUnit.hull <= 0)
                    continue;
                if (defenderUnits.filter(u => !u.exploded && u.hull > 0).length === 0)
                    break;
                let fireCount = 1;
                while (fireCount > 0) {
                    const aliveTargets = defenderUnits.filter(u => !u.exploded && u.hull > 0);
                    if (aliveTargets.length === 0)
                        break;
                    const targetIndex = Math.floor(Math.random() * aliveTargets.length);
                    const targetUnit = aliveTargets[targetIndex];
                    roundInfo.ashoot++;
                    roundInfo.apower += attackingUnit.attack;
                    const damageResult = this.performAttack(attackingUnit, targetUnit);
                    roundInfo.dabsorb += damageResult.absorbed;
                    if (targetUnit.hull > 0 && this.checkExploded(targetUnit)) {
                        targetUnit.exploded = true;
                        targetUnit.hull = 0;
                        roundInfo.destroyedDefenderShips[targetUnit.type] =
                            (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;
                        const data = targetUnit.isDefense ? game_data_1.DEFENSE_DATA[targetUnit.type] : game_data_1.FLEET_DATA[targetUnit.type];
                        if (data) {
                            const cost = data.cost;
                            if (!targetUnit.isDefense) {
                                result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
                                result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
                            }
                            else {
                                result.debris.metal += Math.floor((cost.metal || 0) * DEFENSE_IN_DEBRIS);
                                result.debris.crystal += Math.floor((cost.crystal || 0) * DEFENSE_IN_DEBRIS);
                            }
                            result.defenderLosses.metal += (cost.metal || 0);
                            result.defenderLosses.crystal += (cost.crystal || 0);
                            result.defenderLosses.deuterium += (cost.deuterium || 0);
                        }
                    }
                    else if (targetUnit.hull <= 0) {
                        targetUnit.exploded = true;
                        roundInfo.destroyedDefenderShips[targetUnit.type] =
                            (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;
                        const data = targetUnit.isDefense ? game_data_1.DEFENSE_DATA[targetUnit.type] : game_data_1.FLEET_DATA[targetUnit.type];
                        if (data) {
                            const cost = data.cost;
                            if (!targetUnit.isDefense) {
                                result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
                                result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
                            }
                            else {
                                result.debris.metal += Math.floor((cost.metal || 0) * DEFENSE_IN_DEBRIS);
                                result.debris.crystal += Math.floor((cost.crystal || 0) * DEFENSE_IN_DEBRIS);
                            }
                            result.defenderLosses.metal += (cost.metal || 0);
                            result.defenderLosses.crystal += (cost.crystal || 0);
                            result.defenderLosses.deuterium += (cost.deuterium || 0);
                        }
                    }
                    if (this.checkRapidFire(attackingUnit, targetUnit)) {
                        fireCount++;
                        roundInfo.rapidFireCount++;
                    }
                    fireCount--;
                }
            }
            for (const attackingUnit of defenderUnits) {
                if (attackingUnit.exploded || attackingUnit.hull <= 0)
                    continue;
                if (attackerUnits.filter(u => !u.exploded && u.hull > 0).length === 0)
                    break;
                let fireCount = 1;
                while (fireCount > 0) {
                    const aliveTargets = attackerUnits.filter(u => !u.exploded && u.hull > 0);
                    if (aliveTargets.length === 0)
                        break;
                    const targetIndex = Math.floor(Math.random() * aliveTargets.length);
                    const targetUnit = aliveTargets[targetIndex];
                    roundInfo.dshoot++;
                    roundInfo.dpower += attackingUnit.attack;
                    const damageResult = this.performAttack(attackingUnit, targetUnit);
                    roundInfo.aabsorb += damageResult.absorbed;
                    if (targetUnit.hull > 0 && this.checkExploded(targetUnit)) {
                        targetUnit.exploded = true;
                        targetUnit.hull = 0;
                        roundInfo.destroyedAttackerShips[targetUnit.type] =
                            (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;
                        const data = game_data_1.FLEET_DATA[targetUnit.type];
                        if (data) {
                            const cost = data.cost;
                            result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
                            result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
                            result.attackerLosses.metal += (cost.metal || 0);
                            result.attackerLosses.crystal += (cost.crystal || 0);
                            result.attackerLosses.deuterium += (cost.deuterium || 0);
                        }
                    }
                    else if (targetUnit.hull <= 0) {
                        targetUnit.exploded = true;
                        roundInfo.destroyedAttackerShips[targetUnit.type] =
                            (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;
                        const data = game_data_1.FLEET_DATA[targetUnit.type];
                        if (data) {
                            const cost = data.cost;
                            result.debris.metal += Math.floor((cost.metal || 0) * FLEET_IN_DEBRIS);
                            result.debris.crystal += Math.floor((cost.crystal || 0) * FLEET_IN_DEBRIS);
                            result.attackerLosses.metal += (cost.metal || 0);
                            result.attackerLosses.crystal += (cost.crystal || 0);
                            result.attackerLosses.deuterium += (cost.deuterium || 0);
                        }
                    }
                    if (this.checkRapidFire(attackingUnit, targetUnit)) {
                        fireCount++;
                        roundInfo.rapidFireCount++;
                    }
                    fireCount--;
                }
            }
            attackerUnits = attackerUnits.filter(unit => !unit.exploded && unit.hull > 0);
            defenderUnits = defenderUnits.filter(unit => !unit.exploded && unit.hull > 0);
            roundInfo.attackers = this.createParticipantSnapshot(attackerUnits, attackerWeaponsTech, attackerShieldTech, attackerArmorTech, 'attacker');
            roundInfo.defenders = this.createParticipantSnapshot(defenderUnits, defenderWeaponsTech, defenderShieldTech, defenderArmorTech, 'defender');
            result.rounds.push(roundInfo);
            let noDamageDealt = true;
            for (let i = 0; i < attackerUnits.length && i < attackerHullsBefore.length; i++) {
                if (attackerUnits[i].hull < attackerHullsBefore[i]) {
                    noDamageDealt = false;
                    break;
                }
            }
            if (noDamageDealt) {
                for (let i = 0; i < defenderUnits.length && i < defenderHullsBefore.length; i++) {
                    if (defenderUnits[i].hull < defenderHullsBefore[i]) {
                        noDamageDealt = false;
                        break;
                    }
                }
            }
            if (noDamageDealt && attackerUnits.length > 0 && defenderUnits.length > 0) {
                break;
            }
        }
        const finalAttackerFleet = {};
        const finalDefenderFleet = {};
        const finalDefenderDefense = {};
        for (const unit of attackerUnits) {
            finalAttackerFleet[unit.type] = (finalAttackerFleet[unit.type] || 0) + 1;
        }
        for (const unit of defenderUnits) {
            if (unit.isDefense) {
                finalDefenderDefense[unit.type] = (finalDefenderDefense[unit.type] || 0) + 1;
            }
            else {
                finalDefenderFleet[unit.type] = (finalDefenderFleet[unit.type] || 0) + 1;
            }
        }
        for (const type in result.initialAttackerFleet) {
            if (finalAttackerFleet[type] === undefined) {
                finalAttackerFleet[type] = 0;
            }
        }
        for (const type in result.initialDefenderFleet) {
            if (finalDefenderFleet[type] === undefined) {
                finalDefenderFleet[type] = 0;
            }
        }
        for (const type in result.initialDefenderDefense) {
            if (finalDefenderDefense[type] === undefined) {
                finalDefenderDefense[type] = 0;
            }
        }
        result.survivingAttackerFleet = finalAttackerFleet;
        result.survivingDefenderFleet = finalDefenderFleet;
        result.survivingDefenderDefense = { ...finalDefenderDefense };
        const attackerSurvives = attackerUnits.length > 0;
        const defenderSurvives = defenderUnits.length > 0;
        const defenderFleetSurvives = defenderUnits.some(unit => !unit.isDefense);
        if (attackerSurvives && !defenderSurvives) {
            result.attackerWon = true;
        }
        else if (!attackerSurvives && defenderSurvives) {
            result.defenderWon = true;
        }
        else if (attackerSurvives && defenderSurvives && !defenderFleetSurvives) {
            result.attackerWon = true;
        }
        else {
            result.draw = true;
        }
        for (const type in result.initialDefenderDefense) {
            const initialCount = result.initialDefenderDefense[type] || 0;
            const surviveCount = finalDefenderDefense[type] || 0;
            const destroyedCount = initialCount - surviveCount;
            if (destroyedCount > 0) {
                let restoredCount = 0;
                if (destroyedCount < 10) {
                    for (let i = 0; i < destroyedCount; i++) {
                        if (Math.floor(Math.random() * 100) < 70) {
                            restoredCount++;
                        }
                    }
                }
                else {
                    const restorePercent = Math.floor(Math.random() * 21) + 60;
                    restoredCount = Math.floor(destroyedCount * restorePercent / 100);
                }
                if (restoredCount > 0) {
                    result.restoredDefenses[type] = restoredCount;
                    result.survivingDefenderDefense[type] = (result.survivingDefenderDefense[type] || 0) + restoredCount;
                    const defenseData = game_data_1.DEFENSE_DATA[type];
                    if (defenseData) {
                        result.defenderLosses.metal -= (defenseData.cost.metal || 0) * restoredCount;
                        result.defenderLosses.crystal -= (defenseData.cost.crystal || 0) * restoredCount;
                        result.defenderLosses.deuterium -= (defenseData.cost.deuterium || 0) * restoredCount;
                    }
                }
            }
        }
        result.defenderLosses.metal = Math.max(0, result.defenderLosses.metal);
        result.defenderLosses.crystal = Math.max(0, result.defenderLosses.crystal);
        result.defenderLosses.deuterium = Math.max(0, result.defenderLosses.deuterium);
        const totalDebris = result.debris.metal + result.debris.crystal;
        result.moonChance = Math.min(20, Math.floor(totalDebris / 100000));
        result.moonCreated = Math.random() < (result.moonChance / 100);
        result.battleSeed = Math.floor(Math.random() * 1000000000);
        result.battleTime = new Date();
        return result;
    }
    createParticipantSnapshot(units, weaponsTech, shieldTech, armorTech, side) {
        const fleetCount = {};
        const defenseCount = {};
        for (const unit of units) {
            if (!unit.exploded && unit.hull > 0) {
                if (unit.isDefense) {
                    defenseCount[unit.type] = (defenseCount[unit.type] || 0) + 1;
                }
                else {
                    fleetCount[unit.type] = (fleetCount[unit.type] || 0) + 1;
                }
            }
        }
        const participant = {
            name: side === 'attacker' ? '공격자' : '방어자',
            id: side,
            coordinate: '',
            weaponsTech,
            shieldTech,
            armorTech,
            fleet: fleetCount,
            defense: side === 'defender' ? defenseCount : undefined,
        };
        return [participant];
    }
    countRemainingUnits(attackerUnits, defenderUnits, roundInfo) {
        const attackerCount = {};
        for (const unit of attackerUnits) {
            if (!unit.exploded && unit.hull > 0) {
                attackerCount[unit.type] = (attackerCount[unit.type] || 0) + 1;
            }
        }
        const defenderFleetCount = {};
        const defenderDefenseCount = {};
        for (const unit of defenderUnits) {
            if (!unit.exploded && unit.hull > 0) {
                if (unit.isDefense) {
                    defenderDefenseCount[unit.type] = (defenderDefenseCount[unit.type] || 0) + 1;
                }
                else {
                    defenderFleetCount[unit.type] = (defenderFleetCount[unit.type] || 0) + 1;
                }
            }
        }
        roundInfo.remainingAttackerFleet = { ...attackerCount };
        roundInfo.remainingDefenderFleet = { ...defenderFleetCount };
        roundInfo.remainingDefenderDefense = { ...defenderDefenseCount };
    }
    calculateDistance(coordA, coordB) {
        const partsA = coordA.split(':').map(Number);
        const partsB = coordB.split(':').map(Number);
        const [galaxyA, systemA, planetA] = partsA;
        const [galaxyB, systemB, planetB] = partsB;
        if (galaxyA !== galaxyB) {
            return 20000 * Math.abs(galaxyA - galaxyB);
        }
        if (systemA !== systemB) {
            return 2700 + (95 * Math.abs(systemA - systemB));
        }
        if (planetA !== planetB) {
            return 1000 + (5 * Math.abs(planetA - planetB));
        }
        return 5;
    }
    calculateLoot(resources, battleResult, capacity) {
        if (!battleResult.attackerWon) {
            return { metal: 0, crystal: 0, deuterium: 0 };
        }
        if (capacity <= 0) {
            return { metal: 0, crystal: 0, deuterium: 0 };
        }
        const lootableMetal = Math.floor(resources.metal / 2);
        const lootableCrystal = Math.floor(resources.crystal / 2);
        const lootableDeuterium = Math.floor(resources.deuterium / 2);
        let remainingCapacity = capacity;
        let lootedMetal;
        if (lootableMetal > Math.floor(remainingCapacity / 3)) {
            lootedMetal = Math.floor(remainingCapacity / 3);
        }
        else {
            lootedMetal = lootableMetal;
        }
        remainingCapacity -= lootedMetal;
        let lootedCrystal;
        if (lootableCrystal > Math.floor(remainingCapacity / 2)) {
            lootedCrystal = Math.floor(remainingCapacity / 2);
        }
        else {
            lootedCrystal = lootableCrystal;
        }
        remainingCapacity -= lootedCrystal;
        let lootedDeuterium;
        if (lootableDeuterium > remainingCapacity) {
            lootedDeuterium = remainingCapacity;
        }
        else {
            lootedDeuterium = lootableDeuterium;
        }
        return {
            metal: lootedMetal,
            crystal: lootedCrystal,
            deuterium: lootedDeuterium,
        };
    }
    async startAttack(attackerId, targetCoord, fleet) {
        const attacker = await this.resourcesService.updateResources(attackerId);
        if (!attacker) {
            throw new common_1.BadRequestException('공격자를 찾을 수 없습니다.');
        }
        if (attacker.pendingAttack) {
            throw new common_1.BadRequestException('이미 함대가 출격 중입니다.');
        }
        const targetResult = await this.findPlanetByCoordinate(targetCoord);
        if (!targetResult.ownerId) {
            throw new common_1.BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
        }
        if (targetResult.ownerId === attackerId) {
            throw new common_1.BadRequestException('자신의 행성은 공격할 수 없습니다.');
        }
        const target = targetResult.user;
        if (!target) {
            throw new common_1.BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
        }
        const attackerScore = this.rankingService.calculatePlayerScores(attacker).totalScore;
        const defenderScore = this.rankingService.calculatePlayerScores(target).totalScore;
        if (attackerScore > defenderScore * 5) {
            throw new common_1.BadRequestException(`상대방보다 점수가 5배 이상 높아 공격할 수 없습니다. (내 점수: ${attackerScore.toLocaleString()}, 상대 점수: ${defenderScore.toLocaleString()})`);
        }
        if (defenderScore > attackerScore * 5) {
            throw new common_1.BadRequestException(`상대방보다 점수가 5배 이상 낮아 공격할 수 없습니다. (내 점수: ${attackerScore.toLocaleString()}, 상대 점수: ${defenderScore.toLocaleString()})`);
        }
        for (const type in fleet) {
            const count = fleet[type];
            if (!Number.isInteger(count) || count < 0) {
                throw new common_1.BadRequestException('잘못된 함대 수량입니다.');
            }
            if (count > 0) {
                if (!game_data_1.FLEET_DATA[type]) {
                    throw new common_1.BadRequestException(`알 수 없는 함대 유형: ${type}`);
                }
                if (type === 'solarSatellite') {
                    throw new common_1.BadRequestException('태양광인공위성은 공격에 참여할 수 없습니다.');
                }
                if (!attacker.fleet[type] || attacker.fleet[type] < count) {
                    throw new common_1.BadRequestException(`${game_data_1.NAME_MAPPING[type] || type}을(를) ${count}대 보유하고 있지 않습니다.`);
                }
            }
        }
        const distance = this.calculateDistance(attacker.coordinate, targetCoord);
        const minSpeed = this.fleetService.getFleetSpeed(fleet);
        const travelTime = (distance / minSpeed) * 3600;
        const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
        if (attacker.resources.deuterium < fuelConsumption) {
            throw new common_1.BadRequestException(`듀테륨이 부족합니다. 필요: ${fuelConsumption}, 보유: ${Math.floor(attacker.resources.deuterium)}`);
        }
        attacker.resources.deuterium -= fuelConsumption;
        for (const type in fleet) {
            if (fleet[type] > 0) {
                attacker.fleet[type] -= fleet[type];
            }
        }
        const capacity = this.fleetService.calculateTotalCapacity(fleet);
        const startTime = new Date();
        const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);
        attacker.pendingAttack = {
            targetCoord,
            targetUserId: target._id.toString(),
            fleet,
            capacity,
            travelTime,
            startTime,
            arrivalTime,
            battleCompleted: false,
        };
        target.incomingAttack = {
            targetCoord: attacker.coordinate,
            targetUserId: attackerId,
            fleet: {},
            capacity: 0,
            travelTime,
            startTime,
            arrivalTime,
            battleCompleted: false,
        };
        await attacker.save();
        await target.save();
        return {
            message: `${targetCoord} 좌표로 함대가 출격했습니다.`,
            fleet,
            capacity,
            fuelConsumption,
            travelTime,
            arrivalTime,
            distance,
        };
    }
    async getAttackStatus(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            return null;
        const result = {
            pendingAttack: null,
            pendingReturn: null,
            incomingAttack: null,
        };
        if (user.pendingAttack) {
            const remaining = Math.max(0, (user.pendingAttack.arrivalTime.getTime() - Date.now()) / 1000);
            let missionType = user.pendingAttack.missionType || 'attack';
            if (!missionType || missionType === 'attack') {
                if (user.pendingAttack.targetUserId === 'transport') {
                    missionType = 'transport';
                }
                else if (user.pendingAttack.targetUserId === 'deploy') {
                    missionType = 'deploy';
                }
                else if (user.pendingAttack.targetUserId === 'debris') {
                    missionType = 'recycle';
                }
                else if (user.pendingAttack.targetUserId === '') {
                    missionType = 'colony';
                }
            }
            result.pendingAttack = {
                targetCoord: user.pendingAttack.targetCoord,
                fleet: user.pendingAttack.fleet,
                remainingTime: remaining,
                battleCompleted: user.pendingAttack.battleCompleted,
                missionType,
            };
        }
        if (user.pendingReturn) {
            const remaining = Math.max(0, (user.pendingReturn.returnTime.getTime() - Date.now()) / 1000);
            result.pendingReturn = {
                fleet: user.pendingReturn.fleet,
                loot: user.pendingReturn.loot,
                remainingTime: remaining,
                missionType: user.pendingReturn.missionType || 'attack',
            };
        }
        if (user.incomingAttack) {
            const remaining = Math.max(0, (user.incomingAttack.arrivalTime.getTime() - Date.now()) / 1000);
            result.incomingAttack = {
                attackerCoord: user.incomingAttack.targetCoord,
                remainingTime: remaining,
            };
        }
        return result;
    }
    async startRecycle(attackerId, targetCoord, fleet) {
        for (const type in fleet) {
            const count = fleet[type];
            if (!Number.isInteger(count) || count < 0) {
                throw new common_1.BadRequestException('잘못된 함대 수량입니다.');
            }
            if (count > 0 && type !== 'recycler') {
                throw new common_1.BadRequestException('수확 임무에는 수확선만 보낼 수 있습니다.');
            }
        }
        if (!fleet.recycler || fleet.recycler <= 0) {
            throw new common_1.BadRequestException('수확선을 선택해주세요.');
        }
        const attacker = await this.resourcesService.updateResources(attackerId);
        if (!attacker) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (attacker.pendingAttack || attacker.pendingReturn) {
            throw new common_1.BadRequestException('이미 함대가 활동 중입니다.');
        }
        if (!attacker.fleet.recycler || attacker.fleet.recycler < fleet.recycler) {
            throw new common_1.BadRequestException(`수확선을 ${fleet.recycler}대 보유하고 있지 않습니다.`);
        }
        const distance = this.calculateDistance(attacker.coordinate, targetCoord);
        const minSpeed = this.fleetService.getFleetSpeed(fleet);
        const travelTime = (distance / minSpeed) * 3600;
        const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
        if (attacker.resources.deuterium < fuelConsumption) {
            throw new common_1.BadRequestException(`듀테륨이 부족합니다. 필요: ${fuelConsumption}, 보유: ${Math.floor(attacker.resources.deuterium)}`);
        }
        const debris = await this.galaxyService.getDebris(targetCoord);
        if (!debris || (debris.metal <= 0 && debris.crystal <= 0)) {
            throw new common_1.BadRequestException('해당 좌표에 수확할 데브리가 없습니다.');
        }
        attacker.resources.deuterium -= fuelConsumption;
        attacker.fleet.recycler -= fleet.recycler;
        const startTime = new Date();
        const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);
        attacker.pendingAttack = {
            targetCoord,
            targetUserId: 'debris',
            fleet,
            capacity: this.fleetService.calculateTotalCapacity(fleet),
            travelTime,
            startTime,
            arrivalTime,
            battleCompleted: false,
        };
        attacker.markModified('fleet');
        attacker.markModified('resources');
        attacker.markModified('pendingAttack');
        await attacker.save();
        return {
            message: `${targetCoord} 좌표로 수확선이 출격했습니다.`,
            travelTime,
            arrivalTime,
        };
    }
    async processRecycleArrival(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingAttack || user.pendingAttack.targetUserId !== 'debris') {
            return null;
        }
        if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
            return null;
        }
        const targetCoord = user.pendingAttack.targetCoord;
        const debris = await this.galaxyService.getDebris(targetCoord);
        const capacity = user.pendingAttack.capacity;
        let metalLoot = 0;
        let crystalLoot = 0;
        if (debris) {
            const totalDebris = debris.metal + debris.crystal;
            if (totalDebris <= capacity) {
                metalLoot = debris.metal;
                crystalLoot = debris.crystal;
            }
            else {
                const ratio = capacity / totalDebris;
                metalLoot = Math.floor(debris.metal * ratio);
                crystalLoot = Math.floor(debris.crystal * ratio);
            }
            await this.galaxyService.consumeDebris(targetCoord, metalLoot, crystalLoot);
        }
        const travelTime = user.pendingAttack.travelTime;
        const returnTime = new Date(Date.now() + travelTime * 1000);
        user.pendingReturn = {
            fleet: user.pendingAttack.fleet,
            loot: { metal: metalLoot, crystal: crystalLoot, deuterium: 0 },
            returnTime,
            startTime: new Date(),
            missionType: 'recycle',
        };
        user.pendingAttack = null;
        user.markModified('pendingReturn');
        user.markModified('pendingAttack');
        await user.save();
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '수확 사령부',
            title: `${targetCoord} 수확 보고서`,
            content: `데브리 수확을 완료했습니다. 획득 자원: 메탈 ${metalLoot}, 크리스탈 ${crystalLoot}`,
            type: 'system',
            metadata: { loot: { metal: metalLoot, crystal: crystalLoot } },
        });
        return { metalLoot, crystalLoot };
    }
    async processAttackArrival(attackerId) {
        const attacker = await this.userModel.findById(attackerId).exec();
        if (!attacker || !attacker.pendingAttack || attacker.pendingAttack.battleCompleted) {
            return null;
        }
        const missionType = attacker.pendingAttack.missionType;
        if (missionType === 'colony' || missionType === 'transport' || missionType === 'deploy' || !attacker.pendingAttack.targetUserId) {
            return null;
        }
        const pa = attacker.pendingAttack;
        if (pa.fleet && pa.fleet.capacity !== undefined) {
            const fleetObj = pa.fleet;
            if (pa.capacity === undefined)
                pa.capacity = fleetObj.capacity;
            if (pa.travelTime === undefined)
                pa.travelTime = fleetObj.travelTime;
            if (pa.startTime === undefined && fleetObj.startTime)
                pa.startTime = new Date(fleetObj.startTime);
            if (pa.arrivalTime === undefined && fleetObj.arrivalTime)
                pa.arrivalTime = new Date(fleetObj.arrivalTime);
            const cleanFleet = {};
            for (const key in fleetObj) {
                if (game_data_1.FLEET_DATA[key]) {
                    cleanFleet[key] = fleetObj[key];
                }
            }
            pa.fleet = cleanFleet;
            attacker.markModified('pendingAttack');
        }
        const arrivalTime = pa.arrivalTime instanceof Date ? pa.arrivalTime : new Date(pa.arrivalTime);
        if (arrivalTime.getTime() > Date.now()) {
            return null;
        }
        const target = await this.userModel.findById(pa.targetUserId).exec();
        if (!target) {
            return null;
        }
        await this.resourcesService.updateResources(attackerId);
        await this.resourcesService.updateResources(target._id.toString());
        const updatedAttacker = await this.userModel.findById(attackerId).exec();
        const updatedTarget = await this.userModel.findById(target._id.toString()).exec();
        if (!updatedAttacker || !updatedTarget || !updatedAttacker.pendingAttack)
            return null;
        const attackerResearch = {
            weaponsTech: updatedAttacker.researchLevels.weaponsTech || 0,
            shieldTech: updatedAttacker.researchLevels.shieldTech || 0,
            armorTech: updatedAttacker.researchLevels.armorTech || 0,
        };
        const defenderResearch = {
            weaponsTech: updatedTarget.researchLevels.weaponsTech || 0,
            shieldTech: updatedTarget.researchLevels.shieldTech || 0,
            armorTech: updatedTarget.researchLevels.armorTech || 0,
        };
        const defenderFleet = {};
        const targetFleetObj = updatedTarget.fleet.toObject ? updatedTarget.fleet.toObject() : updatedTarget.fleet;
        for (const key in targetFleetObj) {
            if (game_data_1.FLEET_DATA[key]) {
                defenderFleet[key] = targetFleetObj[key] || 0;
            }
        }
        const defenderDefense = {};
        const targetDefenseObj = updatedTarget.defense.toObject ? updatedTarget.defense.toObject() : updatedTarget.defense;
        for (const key in targetDefenseObj) {
            if (game_data_1.DEFENSE_DATA[key]) {
                defenderDefense[key] = targetDefenseObj[key] || 0;
            }
        }
        const battleResult = this.simulateBattle(updatedAttacker.pendingAttack.fleet, defenderFleet, defenderDefense, attackerResearch, defenderResearch);
        battleResult.before = {
            attackers: [{
                    name: updatedAttacker.playerName,
                    id: attackerId,
                    coordinate: updatedAttacker.coordinate,
                    weaponsTech: attackerResearch.weaponsTech,
                    shieldTech: attackerResearch.shieldTech,
                    armorTech: attackerResearch.armorTech,
                    fleet: { ...updatedAttacker.pendingAttack.fleet },
                }],
            defenders: [{
                    name: updatedTarget.playerName,
                    id: updatedTarget._id.toString(),
                    coordinate: updatedTarget.coordinate,
                    weaponsTech: defenderResearch.weaponsTech,
                    shieldTech: defenderResearch.shieldTech,
                    armorTech: defenderResearch.armorTech,
                    fleet: defenderFleet,
                    defense: defenderDefense,
                }],
        };
        const loot = this.calculateLoot({
            metal: updatedTarget.resources.metal,
            crystal: updatedTarget.resources.crystal,
            deuterium: updatedTarget.resources.deuterium,
        }, battleResult, updatedAttacker.pendingAttack.capacity);
        battleResult.loot = loot;
        if (battleResult.attackerWon) {
            for (const key in battleResult.survivingDefenderFleet) {
                if (game_data_1.FLEET_DATA[key]) {
                    updatedTarget.fleet[key] = battleResult.survivingDefenderFleet[key];
                }
                if (game_data_1.DEFENSE_DATA[key]) {
                    updatedTarget.defense[key] = battleResult.survivingDefenderDefense[key];
                }
            }
            updatedTarget.resources.metal = Math.max(0, updatedTarget.resources.metal - loot.metal);
            updatedTarget.resources.crystal = Math.max(0, updatedTarget.resources.crystal - loot.crystal);
            updatedTarget.resources.deuterium = Math.max(0, updatedTarget.resources.deuterium - loot.deuterium);
        }
        else {
            for (const key in battleResult.survivingDefenderFleet) {
                if (game_data_1.FLEET_DATA[key]) {
                    updatedTarget.fleet[key] = battleResult.survivingDefenderFleet[key];
                }
            }
            for (const key in battleResult.survivingDefenderDefense) {
                if (game_data_1.DEFENSE_DATA[key]) {
                    updatedTarget.defense[key] = battleResult.survivingDefenderDefense[key];
                }
            }
        }
        const travelTime = updatedAttacker.pendingAttack.travelTime || 0;
        const returnTime = new Date(Date.now() + travelTime * 1000);
        if (battleResult.debris.metal > 0 || battleResult.debris.crystal > 0) {
            await this.galaxyService.updateDebris(updatedTarget.coordinate, battleResult.debris.metal, battleResult.debris.crystal);
        }
        const hasSurvivingFleet = Object.values(battleResult.survivingAttackerFleet).some(count => count > 0);
        if (hasSurvivingFleet) {
            updatedAttacker.pendingReturn = {
                fleet: battleResult.survivingAttackerFleet,
                loot,
                returnTime,
                startTime: new Date(),
                missionType: 'attack',
            };
            updatedAttacker.markModified('pendingReturn');
        }
        else {
            updatedAttacker.pendingReturn = null;
            updatedAttacker.markModified('pendingReturn');
        }
        updatedAttacker.pendingAttack = null;
        updatedAttacker.markModified('pendingAttack');
        updatedTarget.incomingAttack = null;
        updatedTarget.markModified('incomingAttack');
        updatedTarget.markModified('fleet');
        updatedTarget.markModified('defense');
        updatedTarget.markModified('resources');
        await updatedTarget.save();
        await updatedAttacker.save();
        try {
            const htmlReport = this.battleReportService.generateBattleReport(battleResult, loot, battleResult.restoredDefenses);
            const shortReport = this.battleReportService.generateShortReport(battleResult);
            const attackerTotalLoss = battleResult.attackerLosses.metal +
                battleResult.attackerLosses.crystal +
                battleResult.attackerLosses.deuterium;
            const defenderTotalLoss = battleResult.defenderLosses.metal +
                battleResult.defenderLosses.crystal +
                battleResult.defenderLosses.deuterium;
            const attackerContent = shortReport || htmlReport;
            const attackerResultText = battleResult.attackerWon
                ? '승리'
                : battleResult.draw
                    ? '무승부'
                    : '패배';
            await this.messageService.createMessage({
                receiverId: attackerId,
                senderName: '전투 지휘부',
                title: `전투 보고서 [${updatedTarget.coordinate}] (방어자 손실: ${defenderTotalLoss.toLocaleString()}, 공격자 손실: ${attackerTotalLoss.toLocaleString()})`,
                content: attackerContent,
                type: 'battle',
                metadata: {
                    battleResult: this.battleReportService.formatBattleResultForApi(battleResult, battleResult.before.attackers[0], battleResult.before.defenders[0]),
                    resultType: attackerResultText,
                    isAttacker: true,
                    defender: {
                        playerName: updatedTarget.playerName,
                        coordinate: updatedTarget.coordinate,
                    },
                },
            });
            const defenderResultText = battleResult.defenderWon
                ? '승리'
                : battleResult.draw
                    ? '무승부'
                    : '패배';
            await this.messageService.createMessage({
                receiverId: updatedTarget._id.toString(),
                senderName: '방어 사령부',
                title: `전투 보고서 [${updatedAttacker.coordinate}] (방어자 손실: ${defenderTotalLoss.toLocaleString()}, 공격자 손실: ${attackerTotalLoss.toLocaleString()})`,
                content: htmlReport,
                type: 'battle',
                metadata: {
                    battleResult: this.battleReportService.formatBattleResultForApi(battleResult, battleResult.before.attackers[0], battleResult.before.defenders[0]),
                    resultType: defenderResultText,
                    isAttacker: false,
                    attacker: {
                        playerName: updatedAttacker.playerName,
                        coordinate: updatedAttacker.coordinate,
                    },
                },
            });
        }
        catch (msgError) {
            console.error('전투 보고서 생성 실패:', msgError);
        }
        return {
            battleResult,
            attacker: {
                id: attackerId,
                coordinate: updatedAttacker.coordinate,
                playerName: updatedAttacker.playerName,
            },
            defender: {
                id: updatedTarget._id.toString(),
                coordinate: updatedTarget.coordinate,
                playerName: updatedTarget.playerName,
            },
        };
    }
    async processIncomingAttacks(userId) {
        const attackers = await this.userModel.find({
            'pendingAttack.targetUserId': userId,
            'pendingAttack.battleCompleted': false,
            'pendingAttack.arrivalTime': { $lte: new Date() }
        }).exec();
        const results = [];
        for (const attacker of attackers) {
            const result = await this.processAttackArrival(attacker._id.toString());
            if (result) {
                results.push(result);
            }
        }
        return results;
    }
    async recallFleet(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (user.pendingReturn) {
            throw new common_1.BadRequestException('이미 함대가 귀환 중입니다.');
        }
        if (!user.pendingAttack) {
            throw new common_1.BadRequestException('귀환시킬 함대가 없습니다.');
        }
        if (user.pendingAttack.battleCompleted) {
            throw new common_1.BadRequestException('전투가 이미 완료되어 귀환 중입니다.');
        }
        const elapsedTime = (Date.now() - user.pendingAttack.startTime.getTime()) / 1000;
        if (Date.now() >= user.pendingAttack.arrivalTime.getTime()) {
            throw new common_1.BadRequestException('함대가 이미 목표에 도착했습니다. 전투 결과를 확인하세요.');
        }
        const returnTime = new Date(Date.now() + elapsedTime * 1000);
        const targetUserId = user.pendingAttack.targetUserId;
        if (targetUserId && targetUserId !== 'debris' && targetUserId !== 'transport' && targetUserId !== 'deploy') {
            const target = await this.userModel.findById(targetUserId).exec();
            if (target && target.incomingAttack) {
                target.incomingAttack = null;
                target.markModified('incomingAttack');
                await target.save();
            }
        }
        const returningFleet = { ...user.pendingAttack.fleet };
        let missionType = 'attack';
        if (user.pendingAttack.targetUserId === 'transport') {
            missionType = 'transport';
        }
        else if (user.pendingAttack.targetUserId === 'deploy') {
            missionType = 'deploy';
        }
        else if (user.pendingAttack.targetUserId === 'debris') {
            missionType = 'recycle';
        }
        let returnLoot = { metal: 0, crystal: 0, deuterium: 0 };
        if (missionType === 'transport' || missionType === 'deploy') {
            const transportResources = user.pendingAttack.transportResources;
            if (transportResources) {
                returnLoot = {
                    metal: transportResources.metal || 0,
                    crystal: transportResources.crystal || 0,
                    deuterium: transportResources.deuterium || 0,
                };
            }
        }
        user.pendingReturn = {
            fleet: returningFleet,
            loot: returnLoot,
            returnTime,
            startTime: new Date(),
            missionType,
        };
        user.pendingAttack = null;
        user.markModified('pendingAttack');
        user.markModified('pendingReturn');
        await user.save();
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '함대 사령부',
            title: '함대 귀환 명령',
            content: `함대가 귀환 명령을 받았습니다. 예상 귀환 시간: ${Math.ceil(elapsedTime)}초`,
            type: 'system',
            metadata: { fleet: returningFleet },
        });
        return {
            message: '함대가 귀환 중입니다.',
            fleet: returningFleet,
            returnTime: elapsedTime,
        };
    }
    async processFleetReturn(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingReturn) {
            return null;
        }
        if (user.pendingReturn.returnTime.getTime() > Date.now()) {
            return null;
        }
        const returnedFleet = user.pendingReturn.fleet;
        for (const type in returnedFleet) {
            user.fleet[type] = (user.fleet[type] || 0) + returnedFleet[type];
        }
        const loot = user.pendingReturn.loot;
        user.resources.metal += (loot.metal || 0);
        user.resources.crystal += (loot.crystal || 0);
        user.resources.deuterium += (loot.deuterium || 0);
        user.pendingReturn = null;
        user.pendingAttack = null;
        user.markModified('pendingReturn');
        user.markModified('pendingAttack');
        user.markModified('fleet');
        user.markModified('resources');
        await user.save();
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '함대 사령부',
            title: '함대 귀환 보고',
            content: `함대가 무사히 귀환했습니다. 약탈한 자원: 메탈 ${loot.metal}, 크리스탈 ${loot.crystal}, 듀테륨 ${loot.deuterium}`,
            type: 'system',
            metadata: { returnedFleet, loot },
        });
        return {
            returnedFleet,
            loot,
        };
    }
    async startTransport(userId, targetCoord, fleet, resources) {
        const sender = await this.resourcesService.updateResources(userId);
        if (!sender) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (sender.pendingAttack || sender.pendingReturn) {
            throw new common_1.BadRequestException('이미 함대가 활동 중입니다.');
        }
        const targetResult = await this.findPlanetByCoordinate(targetCoord);
        if (!targetResult.ownerId) {
            throw new common_1.BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
        }
        const targetOwnerId = targetResult.ownerId;
        for (const type in fleet) {
            if (fleet[type] > 0) {
                if (!game_data_1.FLEET_DATA[type]) {
                    throw new common_1.BadRequestException(`알 수 없는 함대 유형: ${type}`);
                }
                if (type === 'solarSatellite') {
                    throw new common_1.BadRequestException('태양광인공위성은 수송에 참여할 수 없습니다.');
                }
                if (!sender.fleet[type] || sender.fleet[type] < fleet[type]) {
                    throw new common_1.BadRequestException(`${game_data_1.NAME_MAPPING[type] || type}을(를) ${fleet[type]}대 보유하고 있지 않습니다.`);
                }
            }
        }
        const distance = this.calculateDistance(sender.coordinate, targetCoord);
        const minSpeed = this.fleetService.getFleetSpeed(fleet);
        const travelTime = (distance / minSpeed) * 3600;
        const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
        const totalCapacity = this.fleetService.calculateTotalCapacity(fleet);
        const availableCapacity = totalCapacity - fuelConsumption;
        if (availableCapacity < 0) {
            throw new common_1.BadRequestException('적재 공간이 연료 소비량보다 적습니다.');
        }
        const totalResources = resources.metal + resources.crystal + resources.deuterium;
        if (totalResources > availableCapacity) {
            throw new common_1.BadRequestException(`적재 공간이 부족합니다. 가용: ${availableCapacity}, 요청: ${totalResources}`);
        }
        if (sender.resources.metal < resources.metal) {
            throw new common_1.BadRequestException(`메탈이 부족합니다. 필요: ${resources.metal}, 보유: ${Math.floor(sender.resources.metal)}`);
        }
        if (sender.resources.crystal < resources.crystal) {
            throw new common_1.BadRequestException(`크리스탈이 부족합니다. 필요: ${resources.crystal}, 보유: ${Math.floor(sender.resources.crystal)}`);
        }
        if (sender.resources.deuterium < resources.deuterium + fuelConsumption) {
            throw new common_1.BadRequestException(`듀테륨이 부족합니다. 필요: ${resources.deuterium + fuelConsumption}, 보유: ${Math.floor(sender.resources.deuterium)}`);
        }
        sender.resources.metal -= resources.metal;
        sender.resources.crystal -= resources.crystal;
        sender.resources.deuterium -= resources.deuterium + fuelConsumption;
        for (const type in fleet) {
            if (fleet[type] > 0) {
                sender.fleet[type] -= fleet[type];
            }
        }
        const startTime = new Date();
        const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);
        sender.pendingAttack = {
            targetCoord,
            targetUserId: targetOwnerId,
            fleet,
            capacity: totalCapacity,
            travelTime,
            startTime,
            arrivalTime,
            battleCompleted: false,
            missionType: 'transport',
            transportResources: resources,
        };
        sender.markModified('fleet');
        sender.markModified('resources');
        sender.markModified('pendingAttack');
        await sender.save();
        return {
            message: `${targetCoord} 좌표로 수송 함대가 출격했습니다.`,
            travelTime,
            arrivalTime,
            fuelConsumption,
            resources,
        };
    }
    async processTransportArrival(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingAttack)
            return null;
        const isTransport = user.pendingAttack.missionType === 'transport' || user.pendingAttack.targetUserId === 'transport';
        if (!isTransport)
            return null;
        if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
            return null;
        }
        const targetCoord = user.pendingAttack.targetCoord;
        const transportResources = user.pendingAttack.transportResources || { metal: 0, crystal: 0, deuterium: 0 };
        const targetResult = await this.findPlanetByCoordinate(targetCoord);
        if (targetResult.user && !targetResult.planet) {
            targetResult.user.resources.metal += transportResources.metal;
            targetResult.user.resources.crystal += transportResources.crystal;
            targetResult.user.resources.deuterium += transportResources.deuterium;
            targetResult.user.markModified('resources');
            await targetResult.user.save();
            await this.messageService.createMessage({
                receiverId: targetResult.user._id.toString(),
                senderName: '수송 사령부',
                title: `${user.coordinate}에서 자원 도착`,
                content: `자원이 도착했습니다! 수신된 자원: 메탈 ${transportResources.metal}, 크리스탈 ${transportResources.crystal}, 듀테륨 ${transportResources.deuterium}`,
                type: 'system',
                metadata: { resources: transportResources, from: user.coordinate },
            });
        }
        else if (targetResult.planet) {
            targetResult.planet.resources.metal += transportResources.metal;
            targetResult.planet.resources.crystal += transportResources.crystal;
            targetResult.planet.resources.deuterium += transportResources.deuterium;
            targetResult.planet.markModified('resources');
            await targetResult.planet.save();
            if (targetResult.ownerId) {
                await this.messageService.createMessage({
                    receiverId: targetResult.ownerId,
                    senderName: '수송 사령부',
                    title: `${user.coordinate}에서 자원 도착 (${targetCoord})`,
                    content: `식민지 ${targetCoord}에 자원이 도착했습니다! 수신된 자원: 메탈 ${transportResources.metal}, 크리스탈 ${transportResources.crystal}, 듀테륨 ${transportResources.deuterium}`,
                    type: 'system',
                    metadata: { resources: transportResources, from: user.coordinate },
                });
            }
        }
        const travelTime = user.pendingAttack.travelTime;
        const returnTime = new Date(Date.now() + travelTime * 1000);
        user.pendingReturn = {
            fleet: user.pendingAttack.fleet,
            loot: { metal: 0, crystal: 0, deuterium: 0 },
            returnTime,
            startTime: new Date(),
            missionType: 'transport',
        };
        user.pendingAttack = null;
        user.markModified('pendingReturn');
        user.markModified('pendingAttack');
        await user.save();
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '수송 사령부',
            title: `${targetCoord} 수송 완료`,
            content: `자원 수송이 완료되었습니다. 전달된 자원: 메탈 ${transportResources.metal}, 크리스탈 ${transportResources.crystal}, 듀테륨 ${transportResources.deuterium}. 함대가 귀환 중입니다.`,
            type: 'system',
            metadata: { resources: transportResources },
        });
        return { delivered: transportResources };
    }
    async startDeploy(userId, targetCoord, fleet, resources) {
        const sender = await this.resourcesService.updateResources(userId);
        if (!sender) {
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        }
        if (sender.pendingAttack || sender.pendingReturn) {
            throw new common_1.BadRequestException('이미 함대가 활동 중입니다.');
        }
        const targetResult = await this.findPlanetByCoordinate(targetCoord);
        if (!targetResult.ownerId) {
            throw new common_1.BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
        }
        if (targetResult.ownerId !== userId) {
            throw new common_1.BadRequestException('배치 미션은 본인 소유의 행성에만 가능합니다.');
        }
        if (sender.coordinate === targetCoord) {
            throw new common_1.BadRequestException('같은 행성에는 배치할 수 없습니다.');
        }
        for (const type in fleet) {
            if (fleet[type] > 0) {
                if (!game_data_1.FLEET_DATA[type]) {
                    throw new common_1.BadRequestException(`알 수 없는 함대 유형: ${type}`);
                }
                if (type === 'solarSatellite') {
                    throw new common_1.BadRequestException('태양광인공위성은 배치에 참여할 수 없습니다.');
                }
                if (!sender.fleet[type] || sender.fleet[type] < fleet[type]) {
                    throw new common_1.BadRequestException(`${game_data_1.NAME_MAPPING[type] || type}을(를) ${fleet[type]}대 보유하고 있지 않습니다.`);
                }
            }
        }
        const distance = this.calculateDistance(sender.coordinate, targetCoord);
        const minSpeed = this.fleetService.getFleetSpeed(fleet);
        const travelTime = (distance / minSpeed) * 3600;
        const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
        const totalCapacity = this.fleetService.calculateTotalCapacity(fleet);
        const availableCapacity = totalCapacity - fuelConsumption;
        if (availableCapacity < 0) {
            throw new common_1.BadRequestException('적재 공간이 연료 소비량보다 적습니다.');
        }
        const totalResources = resources.metal + resources.crystal + resources.deuterium;
        if (totalResources > availableCapacity) {
            throw new common_1.BadRequestException(`적재 공간이 부족합니다. 가용: ${availableCapacity}, 요청: ${totalResources}`);
        }
        if (sender.resources.metal < resources.metal) {
            throw new common_1.BadRequestException(`메탈이 부족합니다. 필요: ${resources.metal}, 보유: ${Math.floor(sender.resources.metal)}`);
        }
        if (sender.resources.crystal < resources.crystal) {
            throw new common_1.BadRequestException(`크리스탈이 부족합니다. 필요: ${resources.crystal}, 보유: ${Math.floor(sender.resources.crystal)}`);
        }
        if (sender.resources.deuterium < resources.deuterium + fuelConsumption) {
            throw new common_1.BadRequestException(`듀테륨이 부족합니다. 필요: ${resources.deuterium + fuelConsumption}, 보유: ${Math.floor(sender.resources.deuterium)}`);
        }
        sender.resources.metal -= resources.metal;
        sender.resources.crystal -= resources.crystal;
        sender.resources.deuterium -= resources.deuterium + fuelConsumption;
        for (const type in fleet) {
            if (fleet[type] > 0) {
                sender.fleet[type] -= fleet[type];
            }
        }
        const startTime = new Date();
        const arrivalTime = new Date(startTime.getTime() + travelTime * 1000);
        sender.pendingAttack = {
            targetCoord,
            targetUserId: targetResult.ownerId,
            fleet,
            capacity: totalCapacity,
            travelTime,
            startTime,
            arrivalTime,
            battleCompleted: false,
            missionType: 'deploy',
            transportResources: resources,
        };
        sender.markModified('fleet');
        sender.markModified('resources');
        sender.markModified('pendingAttack');
        await sender.save();
        return {
            message: `${targetCoord} 좌표로 배치 함대가 출격했습니다.`,
            travelTime,
            arrivalTime,
            fuelConsumption,
            resources,
        };
    }
    async processDeployArrival(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.pendingAttack)
            return null;
        const isDeploy = user.pendingAttack.missionType === 'deploy' || user.pendingAttack.targetUserId === 'deploy';
        if (!isDeploy)
            return null;
        if (user.pendingAttack.arrivalTime.getTime() > Date.now()) {
            return null;
        }
        const targetCoord = user.pendingAttack.targetCoord;
        const deployFleet = user.pendingAttack.fleet;
        const deployResources = user.pendingAttack.transportResources || { metal: 0, crystal: 0, deuterium: 0 };
        const targetResult = await this.findPlanetByCoordinate(targetCoord);
        if (targetResult.user && !targetResult.planet) {
            for (const type in deployFleet) {
                if (deployFleet[type] > 0) {
                    targetResult.user.fleet[type] = (targetResult.user.fleet[type] || 0) + deployFleet[type];
                }
            }
            targetResult.user.resources.metal += deployResources.metal;
            targetResult.user.resources.crystal += deployResources.crystal;
            targetResult.user.resources.deuterium += deployResources.deuterium;
            targetResult.user.markModified('fleet');
            targetResult.user.markModified('resources');
            await targetResult.user.save();
        }
        else if (targetResult.planet) {
            for (const type in deployFleet) {
                if (deployFleet[type] > 0) {
                    if (!targetResult.planet.fleet)
                        targetResult.planet.fleet = {};
                    targetResult.planet.fleet[type] = (targetResult.planet.fleet[type] || 0) + deployFleet[type];
                }
            }
            if (!targetResult.planet.resources) {
                targetResult.planet.resources = { metal: 0, crystal: 0, deuterium: 0, energy: 0 };
            }
            targetResult.planet.resources.metal += deployResources.metal;
            targetResult.planet.resources.crystal += deployResources.crystal;
            targetResult.planet.resources.deuterium += deployResources.deuterium;
            targetResult.planet.markModified('fleet');
            targetResult.planet.markModified('resources');
            await targetResult.planet.save();
        }
        user.pendingAttack = null;
        user.pendingReturn = null;
        user.markModified('pendingAttack');
        user.markModified('pendingReturn');
        await user.save();
        const fleetList = Object.entries(deployFleet)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => `${game_data_1.NAME_MAPPING[type] || type}: ${count}`)
            .join(', ');
        await this.messageService.createMessage({
            receiverId: userId,
            senderName: '배치 사령부',
            title: `${targetCoord} 배치 완료`,
            content: `함대와 자원이 배치되었습니다.\n함대: ${fleetList}\n자원: 메탈 ${deployResources.metal}, 크리스탈 ${deployResources.crystal}, 듀테륨 ${deployResources.deuterium}`,
            type: 'system',
            metadata: { fleet: deployFleet, resources: deployResources },
        });
        return {
            fleet: deployFleet,
            resources: deployResources,
        };
    }
    calculateAvailableCapacity(fleet, distance) {
        const minSpeed = this.fleetService.getFleetSpeed(fleet);
        const travelTime = (distance / minSpeed) * 3600;
        const fuelConsumption = this.fleetService.calculateFuelConsumption(fleet, distance, travelTime);
        const totalCapacity = this.fleetService.calculateTotalCapacity(fleet);
        const availableCapacity = Math.max(0, totalCapacity - fuelConsumption);
        return {
            totalCapacity,
            fuelConsumption,
            availableCapacity,
        };
    }
};
exports.BattleService = BattleService;
exports.BattleService = BattleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(planet_schema_1.Planet.name)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => ranking_service_1.RankingService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        resources_service_1.ResourcesService,
        fleet_service_1.FleetService,
        ranking_service_1.RankingService,
        message_service_1.MessageService,
        galaxy_service_1.GalaxyService,
        battle_report_service_1.BattleReportService])
], BattleService);
//# sourceMappingURL=battle.service.js.map