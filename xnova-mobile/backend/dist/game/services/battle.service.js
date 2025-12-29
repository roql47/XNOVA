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
const resources_service_1 = require("./resources.service");
const fleet_service_1 = require("./fleet.service");
const game_data_1 = require("../constants/game-data");
let BattleService = class BattleService {
    userModel;
    resourcesService;
    fleetService;
    constructor(userModel, resourcesService, fleetService) {
        this.userModel = userModel;
        this.resourcesService = resourcesService;
        this.fleetService = fleetService;
    }
    performAttack(attackingUnit, targetUnit) {
        const attackPower = attackingUnit.attack;
        const shieldStrength = targetUnit.shield;
        if (attackPower < (shieldStrength / 100)) {
            return;
        }
        if (attackPower <= shieldStrength) {
            targetUnit.shield -= attackPower;
            return;
        }
        else {
            const remainingDamage = attackPower - shieldStrength;
            targetUnit.shield = 0;
            targetUnit.hp -= remainingDamage;
            if (targetUnit.hp < 0) {
                targetUnit.hp = 0;
            }
        }
    }
    checkExploded(unit) {
        if (unit.hp <= 0) {
            return true;
        }
        if (unit.hp <= unit.maxHP * 0.7) {
            const explosionProbability = 1 - (unit.hp / unit.maxHP);
            return Math.random() < explosionProbability;
        }
        return false;
    }
    checkRapidFire(attackingUnit, targetUnit) {
        const rapidFireValue = attackingUnit.rapidFire[targetUnit.type];
        if (!rapidFireValue || rapidFireValue <= 1) {
            return false;
        }
        const rapidFireProbability = (rapidFireValue - 1) / rapidFireValue;
        return Math.random() < rapidFireProbability;
    }
    simulateBattle(attackerFleet, defenderFleet, defenderDefense, attackerResearch = {}, defenderResearch = {}) {
        const attackerWeaponBonus = 1 + (attackerResearch.weaponsTech || 0) * 0.1;
        const attackerShieldBonus = 1 + (attackerResearch.shieldTech || 0) * 0.1;
        const attackerArmorBonus = 1 + (attackerResearch.armorTech || 0) * 0.1;
        const defenderWeaponBonus = 1 + (defenderResearch.weaponsTech || 0) * 0.1;
        const defenderShieldBonus = 1 + (defenderResearch.shieldTech || 0) * 0.1;
        const defenderArmorBonus = 1 + (defenderResearch.armorTech || 0) * 0.1;
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
        };
        let attackerUnits = [];
        for (const type in attackerFleet) {
            if (attackerFleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const fleetStats = game_data_1.FLEET_DATA[type].stats;
                const rapidFire = game_data_1.FLEET_DATA[type].rapidFire || {};
                const attack = Math.floor(fleetStats.attack * attackerWeaponBonus);
                const shield = Math.floor(fleetStats.shield * attackerShieldBonus);
                const hp = Math.floor(fleetStats.hull * attackerArmorBonus);
                for (let i = 0; i < attackerFleet[type]; i++) {
                    attackerUnits.push({
                        id: `attacker_${type}_${i}`,
                        type,
                        side: 'attacker',
                        attack,
                        shield,
                        maxShield: shield,
                        hp,
                        maxHP: hp,
                        rapidFire,
                        isDefense: false,
                    });
                }
            }
        }
        let defenderUnits = [];
        for (const type in defenderFleet) {
            if (defenderFleet[type] > 0 && game_data_1.FLEET_DATA[type]) {
                const fleetStats = game_data_1.FLEET_DATA[type].stats;
                const rapidFire = game_data_1.FLEET_DATA[type].rapidFire || {};
                const attack = Math.floor(fleetStats.attack * defenderWeaponBonus);
                const shield = Math.floor(fleetStats.shield * defenderShieldBonus);
                const hp = Math.floor(fleetStats.hull * defenderArmorBonus);
                for (let i = 0; i < defenderFleet[type]; i++) {
                    defenderUnits.push({
                        id: `defender_${type}_${i}`,
                        type,
                        side: 'defender',
                        attack,
                        shield,
                        maxShield: shield,
                        hp,
                        maxHP: hp,
                        rapidFire,
                        isDefense: false,
                    });
                }
            }
        }
        for (const type in defenderDefense) {
            if (defenderDefense[type] > 0 && game_data_1.DEFENSE_DATA[type]) {
                const defenseStats = game_data_1.DEFENSE_DATA[type].stats;
                const attack = Math.floor(defenseStats.attack * defenderWeaponBonus);
                const shield = Math.floor(defenseStats.shield * defenderShieldBonus);
                const hp = Math.floor(defenseStats.hull * defenderArmorBonus);
                for (let i = 0; i < defenderDefense[type]; i++) {
                    defenderUnits.push({
                        id: `defense_${type}_${i}`,
                        type,
                        side: 'defender',
                        attack,
                        shield,
                        maxShield: shield,
                        hp,
                        maxHP: hp,
                        rapidFire: {},
                        isDefense: true,
                    });
                }
            }
        }
        const MAX_ROUNDS = 6;
        for (let round = 0; round < MAX_ROUNDS; round++) {
            const roundInfo = {
                round: round + 1,
                attackerTotalDamage: 0,
                defenderTotalDamage: 0,
                attackerShieldAbsorbed: 0,
                defenderShieldAbsorbed: 0,
                attackerHullDamage: 0,
                defenderHullDamage: 0,
                destroyedAttackerShips: {},
                destroyedDefenderShips: {},
                remainingAttackerFleet: {},
                remainingDefenderFleet: {},
                remainingDefenderDefense: {},
                rapidFireCount: 0,
            };
            if (attackerUnits.length === 0 || defenderUnits.length === 0) {
                this.countRemainingUnits(attackerUnits, defenderUnits, roundInfo);
                result.rounds.push(roundInfo);
                break;
            }
            const allUnits = [...attackerUnits.map(u => ({ ...u })), ...defenderUnits.map(u => ({ ...u }))];
            for (let i = allUnits.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allUnits[i], allUnits[j]] = [allUnits[j], allUnits[i]];
            }
            for (const attackingUnit of allUnits) {
                const targetUnits = attackingUnit.side === 'attacker' ? defenderUnits : attackerUnits;
                if (targetUnits.length === 0)
                    continue;
                if (attackingUnit.hp <= 0)
                    continue;
                let fireCount = 1;
                while (fireCount > 0 && targetUnits.length > 0) {
                    const targetIndex = Math.floor(Math.random() * targetUnits.length);
                    if (targetIndex < 0 || targetIndex >= targetUnits.length)
                        continue;
                    const targetUnit = targetUnits[targetIndex];
                    if (!targetUnit || targetUnit.hp <= 0) {
                        targetUnits.splice(targetIndex, 1);
                        continue;
                    }
                    const initialShield = targetUnit.shield;
                    const initialHp = targetUnit.hp;
                    this.performAttack(attackingUnit, targetUnit);
                    const shieldDamage = Math.max(0, initialShield - targetUnit.shield);
                    const hullDamage = Math.max(0, initialHp - targetUnit.hp);
                    if (attackingUnit.side === 'attacker') {
                        roundInfo.attackerTotalDamage += (shieldDamage + hullDamage);
                        roundInfo.defenderShieldAbsorbed += shieldDamage;
                        roundInfo.defenderHullDamage += hullDamage;
                    }
                    else {
                        roundInfo.defenderTotalDamage += (shieldDamage + hullDamage);
                        roundInfo.attackerShieldAbsorbed += shieldDamage;
                        roundInfo.attackerHullDamage += hullDamage;
                    }
                    if (targetUnit.hp > 0 && this.checkExploded(targetUnit)) {
                        targetUnit.hp = 0;
                        if (attackingUnit.side === 'attacker') {
                            roundInfo.destroyedDefenderShips[targetUnit.type] = (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;
                            if (!targetUnit.isDefense && game_data_1.FLEET_DATA[targetUnit.type]) {
                                const cost = game_data_1.FLEET_DATA[targetUnit.type].cost;
                                result.debris.metal += Math.floor((cost.metal || 0) * 0.3);
                                result.debris.crystal += Math.floor((cost.crystal || 0) * 0.3);
                                result.defenderLosses.metal += (cost.metal || 0);
                                result.defenderLosses.crystal += (cost.crystal || 0);
                                result.defenderLosses.deuterium += (cost.deuterium || 0);
                            }
                            else if (game_data_1.DEFENSE_DATA[targetUnit.type]) {
                                const cost = game_data_1.DEFENSE_DATA[targetUnit.type].cost;
                                result.defenderLosses.metal += (cost.metal || 0);
                                result.defenderLosses.crystal += (cost.crystal || 0);
                                result.defenderLosses.deuterium += (cost.deuterium || 0);
                            }
                        }
                        else {
                            roundInfo.destroyedAttackerShips[targetUnit.type] = (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;
                            if (game_data_1.FLEET_DATA[targetUnit.type]) {
                                const cost = game_data_1.FLEET_DATA[targetUnit.type].cost;
                                result.debris.metal += Math.floor((cost.metal || 0) * 0.3);
                                result.debris.crystal += Math.floor((cost.crystal || 0) * 0.3);
                                result.attackerLosses.metal += (cost.metal || 0);
                                result.attackerLosses.crystal += (cost.crystal || 0);
                                result.attackerLosses.deuterium += (cost.deuterium || 0);
                            }
                        }
                    }
                    if (targetUnit.hp <= 0 || this.checkRapidFire(attackingUnit, targetUnit)) {
                        fireCount++;
                        roundInfo.rapidFireCount++;
                    }
                    if (targetUnit.hp <= 0) {
                        targetUnits.splice(targetIndex, 1);
                    }
                    fireCount--;
                }
            }
            attackerUnits = attackerUnits.filter(unit => unit.hp > 0);
            defenderUnits = defenderUnits.filter(unit => unit.hp > 0);
            this.countRemainingUnits(attackerUnits, defenderUnits, roundInfo);
            result.rounds.push(roundInfo);
            for (const unit of attackerUnits) {
                unit.shield = unit.maxShield;
            }
            for (const unit of defenderUnits) {
                unit.shield = unit.maxShield;
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
        result.survivingDefenderDefense = finalDefenderDefense;
        const attackerSurvives = attackerUnits.length > 0;
        const defenderSurvives = defenderUnits.some(unit => !unit.isDefense);
        const onlyDefenseSurvives = defenderUnits.length > 0 && defenderUnits.every(unit => unit.isDefense);
        if (!attackerSurvives && defenderSurvives) {
            result.defenderWon = true;
        }
        else if (attackerSurvives && (!defenderSurvives || onlyDefenseSurvives)) {
            result.attackerWon = true;
            for (const type in result.initialDefenderDefense) {
                const initialCount = result.initialDefenderDefense[type] || 0;
                const surviveCount = finalDefenderDefense[type] || 0;
                const destroyedCount = initialCount - surviveCount;
                if (destroyedCount > 0) {
                    let restoredCount = 0;
                    for (let i = 0; i < destroyedCount; i++) {
                        if (Math.random() < 0.7) {
                            restoredCount++;
                        }
                    }
                    if (restoredCount > 0) {
                        result.restoredDefenses[type] = restoredCount;
                        result.survivingDefenderDefense[type] += restoredCount;
                    }
                }
            }
        }
        else if (!attackerSurvives && !defenderSurvives) {
            result.draw = true;
        }
        return result;
    }
    countRemainingUnits(attackerUnits, defenderUnits, roundInfo) {
        const attackerCount = {};
        for (const unit of attackerUnits) {
            attackerCount[unit.type] = (attackerCount[unit.type] || 0) + 1;
        }
        const defenderFleetCount = {};
        const defenderDefenseCount = {};
        for (const unit of defenderUnits) {
            if (unit.isDefense) {
                defenderDefenseCount[unit.type] = (defenderDefenseCount[unit.type] || 0) + 1;
            }
            else {
                defenderFleetCount[unit.type] = (defenderFleetCount[unit.type] || 0) + 1;
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
        const lootRatio = 0.3;
        const loot = {
            metal: Math.floor(resources.metal * lootRatio),
            crystal: Math.floor(resources.crystal * lootRatio),
            deuterium: Math.floor(resources.deuterium * lootRatio),
        };
        const totalLoot = loot.metal + loot.crystal + loot.deuterium;
        if (totalLoot > capacity) {
            const ratio = capacity / totalLoot;
            loot.metal = Math.floor(loot.metal * ratio);
            loot.crystal = Math.floor(loot.crystal * ratio);
            loot.deuterium = Math.floor(loot.deuterium * ratio);
        }
        return loot;
    }
    async startAttack(attackerId, targetCoord, fleet) {
        const attacker = await this.resourcesService.updateResources(attackerId);
        if (!attacker) {
            throw new common_1.BadRequestException('공격자를 찾을 수 없습니다.');
        }
        if (attacker.pendingAttack) {
            throw new common_1.BadRequestException('이미 함대가 출격 중입니다.');
        }
        const target = await this.userModel.findOne({ coordinate: targetCoord }).exec();
        if (!target) {
            throw new common_1.BadRequestException('해당 좌표에 행성이 존재하지 않습니다.');
        }
        if (target._id.toString() === attackerId) {
            throw new common_1.BadRequestException('자신의 행성은 공격할 수 없습니다.');
        }
        for (const type in fleet) {
            if (fleet[type] > 0) {
                if (type === 'solarSatellite') {
                    throw new common_1.BadRequestException('태양광인공위성은 공격에 참여할 수 없습니다.');
                }
                if (!attacker.fleet[type] || attacker.fleet[type] < fleet[type]) {
                    throw new common_1.BadRequestException(`${game_data_1.NAME_MAPPING[type] || type}을(를) ${fleet[type]}대 보유하고 있지 않습니다.`);
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
            result.pendingAttack = {
                targetCoord: user.pendingAttack.targetCoord,
                fleet: user.pendingAttack.fleet,
                remainingTime: remaining,
                battleCompleted: user.pendingAttack.battleCompleted,
            };
        }
        if (user.pendingReturn) {
            const remaining = Math.max(0, (user.pendingReturn.returnTime.getTime() - Date.now()) / 1000);
            result.pendingReturn = {
                fleet: user.pendingReturn.fleet,
                loot: user.pendingReturn.loot,
                remainingTime: remaining,
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
    async processAttackArrival(attackerId) {
        const attacker = await this.userModel.findById(attackerId).exec();
        if (!attacker || !attacker.pendingAttack || attacker.pendingAttack.battleCompleted) {
            return null;
        }
        if (attacker.pendingAttack.arrivalTime.getTime() > Date.now()) {
            return null;
        }
        const target = await this.userModel.findById(attacker.pendingAttack.targetUserId).exec();
        if (!target) {
            return null;
        }
        await this.resourcesService.updateResources(target._id.toString());
        const attackerResearch = {
            weaponsTech: attacker.researchLevels.weaponsTech || 0,
            shieldTech: attacker.researchLevels.shieldTech || 0,
            armorTech: attacker.researchLevels.armorTech || 0,
        };
        const defenderResearch = {
            weaponsTech: target.researchLevels.weaponsTech || 0,
            shieldTech: target.researchLevels.shieldTech || 0,
            armorTech: target.researchLevels.armorTech || 0,
        };
        const defenderFleet = {};
        for (const key in target.fleet) {
            defenderFleet[key] = target.fleet[key] || 0;
        }
        const defenderDefense = {};
        for (const key in target.defense) {
            defenderDefense[key] = target.defense[key] || 0;
        }
        const battleResult = this.simulateBattle(attacker.pendingAttack.fleet, defenderFleet, defenderDefense, attackerResearch, defenderResearch);
        const loot = this.calculateLoot({
            metal: target.resources.metal,
            crystal: target.resources.crystal,
            deuterium: target.resources.deuterium,
        }, battleResult, attacker.pendingAttack.capacity);
        battleResult.loot = loot;
        if (battleResult.attackerWon) {
            for (const key in battleResult.survivingDefenderFleet) {
                target.fleet[key] = battleResult.survivingDefenderFleet[key];
            }
            for (const key in battleResult.survivingDefenderDefense) {
                target.defense[key] = battleResult.survivingDefenderDefense[key];
            }
            target.resources.metal = Math.max(0, target.resources.metal - loot.metal);
            target.resources.crystal = Math.max(0, target.resources.crystal - loot.crystal);
            target.resources.deuterium = Math.max(0, target.resources.deuterium - loot.deuterium);
        }
        else {
            for (const key in battleResult.survivingDefenderFleet) {
                target.fleet[key] = battleResult.survivingDefenderFleet[key];
            }
            for (const key in battleResult.survivingDefenderDefense) {
                target.defense[key] = battleResult.survivingDefenderDefense[key];
            }
        }
        const returnTime = new Date(Date.now() + attacker.pendingAttack.travelTime * 1000);
        attacker.pendingAttack.battleCompleted = true;
        attacker.pendingReturn = {
            fleet: battleResult.survivingAttackerFleet,
            loot,
            returnTime,
        };
        target.incomingAttack = null;
        await attacker.save();
        await target.save();
        return {
            battleResult,
            attacker: {
                id: attackerId,
                coordinate: attacker.coordinate,
                playerName: attacker.playerName,
            },
            defender: {
                id: target._id.toString(),
                coordinate: target.coordinate,
                playerName: target.playerName,
            },
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
        await user.save();
        return {
            returnedFleet,
            loot,
        };
    }
};
exports.BattleService = BattleService;
exports.BattleService = BattleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        resources_service_1.ResourcesService,
        fleet_service_1.FleetService])
], BattleService);
//# sourceMappingURL=battle.service.js.map