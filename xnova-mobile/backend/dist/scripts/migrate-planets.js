"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../user/schemas/user.schema");
const planet_schema_1 = require("../planet/schemas/planet.schema");
async function migrate() {
    console.log('Starting migration...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const planetModel = app.get((0, mongoose_1.getModelToken)(planet_schema_1.Planet.name));
    const users = await userModel.find().exec();
    console.log(`Found ${users.length} users to migrate`);
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    for (const user of users) {
        try {
            if (user.homePlanetId) {
                console.log(`User ${user.playerName} already has homePlanetId, skipping...`);
                skipped++;
                continue;
            }
            const existingPlanet = await planetModel.findOne({ coordinate: user.coordinate }).exec();
            if (existingPlanet) {
                console.log(`Planet already exists at ${user.coordinate}, linking to user ${user.playerName}...`);
                await userModel.findByIdAndUpdate(user._id, {
                    homePlanetId: existingPlanet._id.toString(),
                    activePlanetId: existingPlanet._id.toString(),
                }).exec();
                skipped++;
                continue;
            }
            const planet = new planetModel({
                ownerId: user._id.toString(),
                coordinate: user.coordinate,
                name: user.planetInfo?.planetName || user.playerName,
                isHomeworld: true,
                type: 'planet',
                resources: {
                    metal: user.resources?.metal || 5000,
                    crystal: user.resources?.crystal || 2500,
                    deuterium: user.resources?.deuterium || 1500,
                    energy: user.resources?.energy || 0,
                },
                mines: {
                    metalMine: user.mines?.metalMine || 0,
                    crystalMine: user.mines?.crystalMine || 0,
                    deuteriumMine: user.mines?.deuteriumMine || 0,
                    solarPlant: user.mines?.solarPlant || 0,
                    fusionReactor: user.mines?.fusionReactor || 0,
                },
                facilities: {
                    robotFactory: user.facilities?.robotFactory || 0,
                    shipyard: user.facilities?.shipyard || 0,
                    researchLab: user.facilities?.researchLab || 0,
                    nanoFactory: user.facilities?.nanoFactory || 0,
                    terraformer: user.facilities?.terraformer || 0,
                    allianceDepot: user.facilities?.allianceDepot || 0,
                    missileSilo: user.facilities?.missileSilo || 0,
                    metalStorage: user.facilities?.metalStorage || 0,
                    crystalStorage: user.facilities?.crystalStorage || 0,
                    deuteriumTank: user.facilities?.deuteriumTank || 0,
                    lunarBase: user.facilities?.lunarBase || 0,
                    sensorPhalanx: user.facilities?.sensorPhalanx || 0,
                    jumpGate: user.facilities?.jumpGate || 0,
                },
                fleet: {
                    smallCargo: user.fleet?.smallCargo || 0,
                    largeCargo: user.fleet?.largeCargo || 0,
                    lightFighter: user.fleet?.lightFighter || 0,
                    heavyFighter: user.fleet?.heavyFighter || 0,
                    cruiser: user.fleet?.cruiser || 0,
                    battleship: user.fleet?.battleship || 0,
                    battlecruiser: user.fleet?.battlecruiser || 0,
                    bomber: user.fleet?.bomber || 0,
                    destroyer: user.fleet?.destroyer || 0,
                    deathstar: user.fleet?.deathstar || 0,
                    recycler: user.fleet?.recycler || 0,
                    espionageProbe: user.fleet?.espionageProbe || 0,
                    solarSatellite: user.fleet?.solarSatellite || 0,
                    colonyShip: user.fleet?.colonyShip || 0,
                },
                defense: {
                    rocketLauncher: user.defense?.rocketLauncher || 0,
                    lightLaser: user.defense?.lightLaser || 0,
                    heavyLaser: user.defense?.heavyLaser || 0,
                    gaussCannon: user.defense?.gaussCannon || 0,
                    ionCannon: user.defense?.ionCannon || 0,
                    plasmaTurret: user.defense?.plasmaTurret || 0,
                    smallShieldDome: user.defense?.smallShieldDome || 0,
                    largeShieldDome: user.defense?.largeShieldDome || 0,
                    antiBallisticMissile: user.defense?.antiBallisticMissile || 0,
                    interplanetaryMissile: user.defense?.interplanetaryMissile || 0,
                },
                planetInfo: {
                    maxFields: user.planetInfo?.maxFields || 300,
                    usedFields: user.planetInfo?.usedFields || 0,
                    tempMin: (user.planetInfo?.temperature || 50) - 40,
                    tempMax: user.planetInfo?.temperature || 50,
                    planetType: user.planetInfo?.planetType || 'normaltemp',
                    diameter: user.planetInfo?.diameter || 12800,
                },
                constructionProgress: user.constructionProgress,
                fleetProgress: user.fleetProgress,
                defenseProgress: user.defenseProgress,
                lastResourceUpdate: user.lastResourceUpdate || new Date(),
            });
            const savedPlanet = await planet.save();
            await userModel.findByIdAndUpdate(user._id, {
                homePlanetId: savedPlanet._id.toString(),
                activePlanetId: savedPlanet._id.toString(),
            }).exec();
            console.log(`Migrated user ${user.playerName} -> Planet ${savedPlanet._id}`);
            migrated++;
        }
        catch (error) {
            console.error(`Error migrating user ${user.playerName}:`, error.message);
            errors++;
        }
    }
    console.log('\n=== Migration Complete ===');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    await app.close();
}
migrate().catch(console.error);
//# sourceMappingURL=migrate-planets.js.map