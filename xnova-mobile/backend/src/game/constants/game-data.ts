// XNOVA.js에서 마이그레이션된 게임 데이터

// 건물 업그레이드 비용
export const BUILDING_COSTS = {
  metalMine: {
    base: { metal: 60, crystal: 15 },
    factor: 1.5,
  },
  crystalMine: {
    base: { metal: 48, crystal: 24 },
    factor: 1.6,
  },
  deuteriumMine: {
    base: { metal: 225, crystal: 75 },
    factor: 1.5,
  },
  solarPlant: {
    base: { metal: 75, crystal: 30 },
    factor: 1.5,
  },
  fusionReactor: {
    base: { metal: 900, crystal: 360, deuterium: 180 },
    factor: 1.8,
  },
  robotFactory: {
    base: { metal: 400, crystal: 120, deuterium: 200 },
    factor: 2,
  },
  shipyard: {
    base: { metal: 400, crystal: 200, deuterium: 100 },
    factor: 2,
  },
  researchLab: {
    base: { metal: 200, crystal: 400, deuterium: 200 },
    factor: 2,
  },
  nanoFactory: {
    base: { metal: 1000000, crystal: 500000, deuterium: 100000 },
    factor: 2,
  },
};

// 함대 데이터
export const FLEET_DATA = {
  smallCargo: {
    cost: { metal: 2000, crystal: 2000, deuterium: 0 },
    stats: { attack: 5, shield: 10, hull: 4000, speed: 5000, cargo: 5000, fuelConsumption: 10 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5 },
    requirements: { shipyard: 2, combustionDrive: 2 },
  },
  largeCargo: {
    cost: { metal: 6000, crystal: 6000, deuterium: 0 },
    stats: { attack: 5, shield: 25, hull: 12000, speed: 7500, cargo: 25000, fuelConsumption: 50 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5 },
    requirements: { shipyard: 4, combustionDrive: 6 },
  },
  lightFighter: {
    cost: { metal: 3000, crystal: 1000, deuterium: 0 },
    stats: { attack: 50, shield: 10, hull: 4000, speed: 12500, cargo: 50, fuelConsumption: 20 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5 },
    requirements: { shipyard: 1, combustionDrive: 1 },
  },
  heavyFighter: {
    cost: { metal: 6000, crystal: 4000, deuterium: 0 },
    stats: { attack: 150, shield: 25, hull: 10000, speed: 10000, cargo: 100, fuelConsumption: 75 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, smallCargo: 3 },
    requirements: { shipyard: 3, impulseDrive: 2, armorTech: 2 },
  },
  cruiser: {
    cost: { metal: 20000, crystal: 7000, deuterium: 2000 },
    stats: { attack: 400, shield: 50, hull: 27000, speed: 15000, cargo: 800, fuelConsumption: 300 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, lightFighter: 6, rocketLauncher: 10 },
    requirements: { shipyard: 5, impulseDrive: 4, ionTech: 2 },
  },
  battleship: {
    cost: { metal: 45000, crystal: 15000, deuterium: 0 },
    stats: { attack: 1000, shield: 200, hull: 60000, speed: 10000, cargo: 1500, fuelConsumption: 500 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5 },
    requirements: { shipyard: 7, hyperspaceDrive: 4 },
  },
  battlecruiser: {
    cost: { metal: 30000, crystal: 40000, deuterium: 15000 },
    stats: { attack: 700, shield: 400, hull: 70000, speed: 10000, cargo: 750, fuelConsumption: 250 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, smallCargo: 3, largeCargo: 3, heavyFighter: 4, cruiser: 4, battleship: 7 },
    requirements: { shipyard: 8, hyperspaceTech: 5, hyperspaceDrive: 5, laserTech: 12 },
  },
  bomber: {
    cost: { metal: 50000, crystal: 25000, deuterium: 15000 },
    stats: { attack: 1000, shield: 500, hull: 75000, speed: 4000, cargo: 500, fuelConsumption: 1000 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, rocketLauncher: 20, lightLaser: 20, heavyLaser: 10, ionCannon: 10, gaussCannon: 5, plasmaTurret: 5 },
    requirements: { shipyard: 8, impulseDrive: 6, plasmaTech: 5 },
  },
  destroyer: {
    cost: { metal: 60000, crystal: 50000, deuterium: 15000 },
    stats: { attack: 2000, shield: 500, hull: 110000, speed: 5000, cargo: 2000, fuelConsumption: 1000 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, lightLaser: 10, battlecruiser: 2 },
    requirements: { shipyard: 9, hyperspaceDrive: 6, hyperspaceTech: 5 },
  },
  deathstar: {
    cost: { metal: 5000000, crystal: 4000000, deuterium: 1000000 },
    stats: { attack: 200000, shield: 50000, hull: 9000000, speed: 100, cargo: 1000000, fuelConsumption: 1 },
    rapidFire: {
      espionageProbe: 1250, solarSatellite: 1250, smallCargo: 250, largeCargo: 250,
      lightFighter: 200, heavyFighter: 100, cruiser: 33, battleship: 30, battlecruiser: 15,
      bomber: 25, destroyer: 5, recycler: 250, rocketLauncher: 200, lightLaser: 200,
      heavyLaser: 100, gaussCannon: 50, ionCannon: 100,
    },
    requirements: { shipyard: 12, hyperspaceDrive: 7, hyperspaceTech: 6, gravitonTech: 1 },
  },
  recycler: {
    cost: { metal: 10000, crystal: 6000, deuterium: 2000 },
    stats: { attack: 1, shield: 10, hull: 16000, speed: 2000, cargo: 20000, fuelConsumption: 300 },
    rapidFire: {},
    requirements: { shipyard: 4, combustionDrive: 6, shieldTech: 2 },
  },
  espionageProbe: {
    cost: { metal: 0, crystal: 1000, deuterium: 0 },
    stats: { attack: 0, shield: 0, hull: 1000, speed: 10000000, cargo: 0, fuelConsumption: 1 },
    rapidFire: {},
    requirements: { shipyard: 3, combustionDrive: 3, espionageTech: 2 },
  },
  solarSatellite: {
    cost: { metal: 0, crystal: 2000, deuterium: 500 },
    stats: { attack: 1, shield: 1, hull: 2000, speed: 0, cargo: 0, fuelConsumption: 0 },
    rapidFire: {},
    requirements: { shipyard: 1 },
  },
};

// 방어시설 데이터
export const DEFENSE_DATA = {
  rocketLauncher: {
    cost: { metal: 2000, crystal: 0, deuterium: 0 },
    stats: { attack: 80, shield: 20, hull: 2000 },
    requirements: { shipyard: 1 },
  },
  lightLaser: {
    cost: { metal: 1500, crystal: 500, deuterium: 0 },
    stats: { attack: 100, shield: 25, hull: 2000 },
    requirements: { shipyard: 2, energyTech: 1, laserTech: 3 },
  },
  heavyLaser: {
    cost: { metal: 6000, crystal: 2000, deuterium: 0 },
    stats: { attack: 250, shield: 100, hull: 8000 },
    requirements: { shipyard: 4, energyTech: 3, laserTech: 6 },
  },
  gaussCannon: {
    cost: { metal: 20000, crystal: 15000, deuterium: 2000 },
    stats: { attack: 1100, shield: 200, hull: 35000 },
    requirements: { shipyard: 6, energyTech: 6, weaponsTech: 3, shieldTech: 1 },
  },
  ionCannon: {
    cost: { metal: 5000, crystal: 3000, deuterium: 0 },
    stats: { attack: 150, shield: 500, hull: 8000 },
    requirements: { shipyard: 4, ionTech: 4 },
  },
  plasmaTurret: {
    cost: { metal: 50000, crystal: 50000, deuterium: 30000 },
    stats: { attack: 3000, shield: 300, hull: 100000 },
    requirements: { shipyard: 8, plasmaTech: 7 },
  },
  smallShieldDome: {
    cost: { metal: 10000, crystal: 10000, deuterium: 0 },
    stats: { attack: 1, shield: 2000, hull: 20000 },
    requirements: { shipyard: 1, shieldTech: 2 },
    maxCount: 1,
  },
  largeShieldDome: {
    cost: { metal: 50000, crystal: 50000, deuterium: 0 },
    stats: { attack: 1, shield: 10000, hull: 100000 },
    requirements: { shipyard: 6, shieldTech: 6 },
    maxCount: 1,
  },
  antiBallisticMissile: {
    cost: { metal: 8000, crystal: 0, deuterium: 2000 },
    stats: { attack: 1, shield: 1, hull: 8000 },
    requirements: { shipyard: 1 },
  },
  interplanetaryMissile: {
    cost: { metal: 12500, crystal: 2500, deuterium: 10000 },
    stats: { attack: 12000, shield: 1, hull: 15000 },
    requirements: { shipyard: 1, impulseDrive: 1 },
  },
};

// 연구 데이터
export const RESEARCH_DATA = {
  energyTech: {
    cost: { metal: 0, crystal: 800, deuterium: 400 },
    requirements: { researchLab: 1 },
  },
  laserTech: {
    cost: { metal: 200, crystal: 100, deuterium: 0 },
    requirements: { researchLab: 1, energyTech: 2 },
  },
  ionTech: {
    cost: { metal: 1000, crystal: 300, deuterium: 100 },
    requirements: { researchLab: 4, energyTech: 4, laserTech: 5 },
  },
  hyperspaceTech: {
    cost: { metal: 0, crystal: 4000, deuterium: 2000 },
    requirements: { researchLab: 7, energyTech: 5, shieldTech: 5 },
  },
  plasmaTech: {
    cost: { metal: 2000, crystal: 4000, deuterium: 1000 },
    requirements: { researchLab: 4, energyTech: 8, laserTech: 10, ionTech: 5 },
  },
  combustionDrive: {
    cost: { metal: 400, crystal: 0, deuterium: 600 },
    requirements: { researchLab: 1, energyTech: 1 },
  },
  impulseDrive: {
    cost: { metal: 2000, crystal: 4000, deuterium: 600 },
    requirements: { researchLab: 2, energyTech: 1 },
  },
  hyperspaceDrive: {
    cost: { metal: 10000, crystal: 20000, deuterium: 6000 },
    requirements: { researchLab: 7, hyperspaceTech: 3 },
  },
  espionageTech: {
    cost: { metal: 200, crystal: 1000, deuterium: 200 },
    requirements: { researchLab: 3 },
  },
  computerTech: {
    cost: { metal: 0, crystal: 400, deuterium: 600 },
    requirements: { researchLab: 1 },
  },
  astrophysics: {
    cost: { metal: 4000, crystal: 8000, deuterium: 4000 },
    requirements: { researchLab: 3, espionageTech: 4, impulseDrive: 3 },
  },
  intergalacticResearch: {
    cost: { metal: 240000, crystal: 400000, deuterium: 160000 },
    requirements: { researchLab: 10, computerTech: 8, hyperspaceTech: 8 },
  },
  gravitonTech: {
    cost: { metal: 0, crystal: 0, deuterium: 0 },
    energyRequired: 300000,
    requirements: { researchLab: 12 },
  },
  weaponsTech: {
    cost: { metal: 800, crystal: 200, deuterium: 0 },
    requirements: { researchLab: 4 },
  },
  shieldTech: {
    cost: { metal: 200, crystal: 600, deuterium: 0 },
    requirements: { researchLab: 6, energyTech: 3 },
  },
  armorTech: {
    cost: { metal: 1000, crystal: 0, deuterium: 0 },
    requirements: { researchLab: 2 },
  },
};

// 한글 이름 매핑
export const NAME_MAPPING = {
  // 건물
  metalMine: '메탈광산',
  crystalMine: '크리스탈광산',
  deuteriumMine: '듀테륨광산',
  solarPlant: '태양광발전소',
  fusionReactor: '핵융합로',
  robotFactory: '로봇공장',
  shipyard: '조선소',
  researchLab: '연구소',
  nanoFactory: '나노공장',
  
  // 함대
  smallCargo: '소형화물선',
  largeCargo: '대형화물선',
  lightFighter: '전투기',
  heavyFighter: '공격기',
  cruiser: '순양함',
  battleship: '전함',
  battlecruiser: '전투순양함',
  bomber: '폭격기',
  destroyer: '구축함',
  deathstar: '죽음의별',
  recycler: '수확선',
  espionageProbe: '무인정찰기',
  solarSatellite: '태양광인공위성',
  
  // 방어시설
  rocketLauncher: '미사일발사대',
  lightLaser: '경레이저포탑',
  heavyLaser: '중레이저포탑',
  gaussCannon: '가우스포',
  ionCannon: '이온포',
  plasmaTurret: '플라즈마포탑',
  smallShieldDome: '소형보호막돔',
  largeShieldDome: '대형보호막돔',
  antiBallisticMissile: '대탄도미사일',
  interplanetaryMissile: '대륙간미사일',
  
  // 연구
  energyTech: '에너지공학',
  laserTech: '레이저공학',
  ionTech: '이온공학',
  hyperspaceTech: '초공간기술',
  plasmaTech: '플라즈마공학',
  combustionDrive: '연소엔진',
  impulseDrive: '핵추진엔진',
  hyperspaceDrive: '초공간엔진',
  espionageTech: '정탐기술',
  computerTech: '컴퓨터공학',
  astrophysics: '원정기술',
  intergalacticResearch: '은하망네트워크',
  gravitonTech: '중력자기술',
  weaponsTech: '무기공학',
  shieldTech: '보호막연구',
  armorTech: '장갑기술',
};

