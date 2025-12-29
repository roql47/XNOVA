export declare const BUILDING_COSTS: {
    metalMine: {
        base: {
            metal: number;
            crystal: number;
        };
        factor: number;
    };
    crystalMine: {
        base: {
            metal: number;
            crystal: number;
        };
        factor: number;
    };
    deuteriumMine: {
        base: {
            metal: number;
            crystal: number;
        };
        factor: number;
    };
    solarPlant: {
        base: {
            metal: number;
            crystal: number;
        };
        factor: number;
    };
    fusionReactor: {
        base: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        factor: number;
    };
    robotFactory: {
        base: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        factor: number;
    };
    shipyard: {
        base: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        factor: number;
    };
    researchLab: {
        base: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        factor: number;
    };
    nanoFactory: {
        base: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        factor: number;
    };
};
export declare const FLEET_DATA: {
    smallCargo: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
        };
        requirements: {
            shipyard: number;
            combustionDrive: number;
        };
    };
    largeCargo: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
        };
        requirements: {
            shipyard: number;
            combustionDrive: number;
        };
    };
    lightFighter: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
        };
        requirements: {
            shipyard: number;
            combustionDrive: number;
        };
    };
    heavyFighter: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
            smallCargo: number;
        };
        requirements: {
            shipyard: number;
            impulseDrive: number;
            armorTech: number;
        };
    };
    cruiser: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
            lightFighter: number;
            rocketLauncher: number;
        };
        requirements: {
            shipyard: number;
            impulseDrive: number;
            ionTech: number;
        };
    };
    battleship: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
        };
        requirements: {
            shipyard: number;
            hyperspaceDrive: number;
        };
    };
    battlecruiser: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
            smallCargo: number;
            largeCargo: number;
            heavyFighter: number;
            cruiser: number;
            battleship: number;
        };
        requirements: {
            shipyard: number;
            hyperspaceTech: number;
            hyperspaceDrive: number;
            laserTech: number;
        };
    };
    bomber: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
            rocketLauncher: number;
            lightLaser: number;
            heavyLaser: number;
            ionCannon: number;
            gaussCannon: number;
            plasmaTurret: number;
        };
        requirements: {
            shipyard: number;
            impulseDrive: number;
            plasmaTech: number;
        };
    };
    destroyer: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
            lightLaser: number;
            battlecruiser: number;
        };
        requirements: {
            shipyard: number;
            hyperspaceDrive: number;
            hyperspaceTech: number;
        };
    };
    deathstar: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {
            espionageProbe: number;
            solarSatellite: number;
            smallCargo: number;
            largeCargo: number;
            lightFighter: number;
            heavyFighter: number;
            cruiser: number;
            battleship: number;
            battlecruiser: number;
            bomber: number;
            destroyer: number;
            recycler: number;
            rocketLauncher: number;
            lightLaser: number;
            heavyLaser: number;
            gaussCannon: number;
            ionCannon: number;
        };
        requirements: {
            shipyard: number;
            hyperspaceDrive: number;
            hyperspaceTech: number;
            gravitonTech: number;
        };
    };
    recycler: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {};
        requirements: {
            shipyard: number;
            combustionDrive: number;
            shieldTech: number;
        };
    };
    espionageProbe: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {};
        requirements: {
            shipyard: number;
            combustionDrive: number;
            espionageTech: number;
        };
    };
    solarSatellite: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
            speed: number;
            cargo: number;
            fuelConsumption: number;
        };
        rapidFire: {};
        requirements: {
            shipyard: number;
        };
    };
};
export declare const DEFENSE_DATA: {
    rocketLauncher: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
        };
    };
    lightLaser: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            energyTech: number;
            laserTech: number;
        };
    };
    heavyLaser: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            energyTech: number;
            laserTech: number;
        };
    };
    gaussCannon: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            energyTech: number;
            weaponsTech: number;
            shieldTech: number;
        };
    };
    ionCannon: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            ionTech: number;
        };
    };
    plasmaTurret: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            plasmaTech: number;
        };
    };
    smallShieldDome: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            shieldTech: number;
        };
        maxCount: number;
    };
    largeShieldDome: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            shieldTech: number;
        };
        maxCount: number;
    };
    antiBallisticMissile: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
        };
    };
    interplanetaryMissile: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        stats: {
            attack: number;
            shield: number;
            hull: number;
        };
        requirements: {
            shipyard: number;
            impulseDrive: number;
        };
    };
};
export declare const RESEARCH_DATA: {
    energyTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
        };
    };
    laserTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
        };
    };
    ionTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
            laserTech: number;
        };
    };
    hyperspaceTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
            shieldTech: number;
        };
    };
    plasmaTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
            laserTech: number;
            ionTech: number;
        };
    };
    combustionDrive: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
        };
    };
    impulseDrive: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
        };
    };
    hyperspaceDrive: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            hyperspaceTech: number;
        };
    };
    espionageTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
        };
    };
    computerTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
        };
    };
    astrophysics: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            espionageTech: number;
            impulseDrive: number;
        };
    };
    intergalacticResearch: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            computerTech: number;
            hyperspaceTech: number;
        };
    };
    gravitonTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        energyRequired: number;
        requirements: {
            researchLab: number;
        };
    };
    weaponsTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
        };
    };
    shieldTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
            energyTech: number;
        };
    };
    armorTech: {
        cost: {
            metal: number;
            crystal: number;
            deuterium: number;
        };
        requirements: {
            researchLab: number;
        };
    };
};
export declare const NAME_MAPPING: {
    metalMine: string;
    crystalMine: string;
    deuteriumMine: string;
    solarPlant: string;
    fusionReactor: string;
    robotFactory: string;
    shipyard: string;
    researchLab: string;
    nanoFactory: string;
    smallCargo: string;
    largeCargo: string;
    lightFighter: string;
    heavyFighter: string;
    cruiser: string;
    battleship: string;
    battlecruiser: string;
    bomber: string;
    destroyer: string;
    deathstar: string;
    recycler: string;
    espionageProbe: string;
    solarSatellite: string;
    rocketLauncher: string;
    lightLaser: string;
    heavyLaser: string;
    gaussCannon: string;
    ionCannon: string;
    plasmaTurret: string;
    smallShieldDome: string;
    largeShieldDome: string;
    antiBallisticMissile: string;
    interplanetaryMissile: string;
    energyTech: string;
    laserTech: string;
    ionTech: string;
    hyperspaceTech: string;
    plasmaTech: string;
    combustionDrive: string;
    impulseDrive: string;
    hyperspaceDrive: string;
    espionageTech: string;
    computerTech: string;
    astrophysics: string;
    intergalacticResearch: string;
    gravitonTech: string;
    weaponsTech: string;
    shieldTech: string;
    armorTech: string;
};
