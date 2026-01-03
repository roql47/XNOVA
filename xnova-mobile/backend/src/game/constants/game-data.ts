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
    rapidFire: { espionageProbe: 5, solarSatellite: 5 },
    requirements: { shipyard: 5, impulseDrive: 4, ionTech: 2 },
  },
  battleship: {
    cost: { metal: 45000, crystal: 15000, deuterium: 0 },
    stats: { attack: 1000, shield: 200, hull: 60000, speed: 10000, cargo: 1500, fuelConsumption: 500 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, battlecruiser: 2, lightLaser: 10 },
    requirements: { shipyard: 7, hyperspaceDrive: 4 },
  },
  battlecruiser: {
    cost: { metal: 30000, crystal: 40000, deuterium: 15000 },
    stats: { attack: 700, shield: 400, hull: 70000, speed: 10000, cargo: 750, fuelConsumption: 250 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5, smallCargo: 3, largeCargo: 3, heavyFighter: 4, destroyer: 4, cruiser: 7 },
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
    rapidFire: { espionageProbe: 5, solarSatellite: 5, lightFighter: 6, rocketLauncher: 10 },
    requirements: { shipyard: 9, hyperspaceDrive: 6, hyperspaceTech: 5 },
  },
  deathstar: {
    cost: { metal: 5000000, crystal: 4000000, deuterium: 1000000 },
    stats: { attack: 200000, shield: 50000, hull: 9000000, speed: 100, cargo: 1000000, fuelConsumption: 1 },
    rapidFire: {
      espionageProbe: 1250, solarSatellite: 1250, smallCargo: 250, largeCargo: 250,
      lightFighter: 200, heavyFighter: 100, cruiser: 30, battleship: 5, battlecruiser: 15,
      destroyer: 33, recycler: 250, rocketLauncher: 200, lightLaser: 200,
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
    stats: { attack: 0, shield: 0, hull: 1000, speed: 1000000, cargo: 0, fuelConsumption: 1 },
    rapidFire: {},
    requirements: { shipyard: 3, combustionDrive: 3, espionageTech: 2 },
  },
  solarSatellite: {
    cost: { metal: 0, crystal: 2000, deuterium: 500 },
    stats: { attack: 1, shield: 1, hull: 2000, speed: 0, cargo: 0, fuelConsumption: 0 },
    rapidFire: {},
    requirements: { shipyard: 1 },
  },
  colonyShip: {
    cost: { metal: 10000, crystal: 20000, deuterium: 10000 },
    stats: { attack: 50, shield: 100, hull: 30000, speed: 2500, cargo: 7500, fuelConsumption: 1000 },
    rapidFire: { espionageProbe: 5, solarSatellite: 5 },
    requirements: { shipyard: 4, impulseDrive: 3 },
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

// ===== 연구 효과 시스템 =====

// 연구 효과 정의
export const RESEARCH_EFFECTS = {
  // 전투 기술 - 10%/레벨
  weaponsTech: {
    type: 'combat',
    effect: 'attack',
    bonus: 0.1, // 10% per level
    description: '모든 유닛 공격력 +10%/레벨',
    formula: '공격력 = 기본공격력 × (1 + 0.1 × 레벨)',
  },
  shieldTech: {
    type: 'combat',
    effect: 'shield',
    bonus: 0.1,
    description: '모든 유닛 실드 +10%/레벨',
    formula: '실드 = 기본실드 × (1 + 0.1 × 레벨)',
  },
  armorTech: {
    type: 'combat',
    effect: 'armor',
    bonus: 0.1,
    description: '모든 유닛 구조력 +10%/레벨',
    formula: '구조력 = 기본구조력 × (1 + 0.1 × 레벨)',
  },
  
  // 엔진 기술
  combustionDrive: {
    type: 'engine',
    effect: 'speed',
    bonus: 0.1, // 10% per level
    description: '연소 엔진 함선 속도 +10%/레벨',
    formula: '속도 = 기본속도 × (1 + 0.1 × 레벨)',
  },
  impulseDrive: {
    type: 'engine',
    effect: 'speed',
    bonus: 0.2, // 20% per level
    description: '임펄스 엔진 함선 속도 +20%/레벨',
    formula: '속도 = 기본속도 × (1 + 0.2 × 레벨)',
  },
  hyperspaceDrive: {
    type: 'engine',
    effect: 'speed',
    bonus: 0.3, // 30% per level
    description: '초공간 엔진 함선 속도 +30%/레벨',
    formula: '속도 = 기본속도 × (1 + 0.3 × 레벨)',
  },
  
  // 컴퓨터 기술
  computerTech: {
    type: 'utility',
    effect: 'fleetSlots',
    bonus: 1, // +1 slot per level
    description: '최대 함대 슬롯 +1/레벨',
    formula: '함대슬롯 = 1 + 레벨',
  },
  
  // 정탐 기술
  espionageTech: {
    type: 'utility',
    effect: 'espionage',
    description: '정찰 보고서 정보량 증가, 역정찰 방어력 증가',
    formula: 'ST = 위성수 ± (레벨차이)²',
  },
  
  // 선행 기술 (효과 없음, 요구조건용)
  energyTech: { type: 'prerequisite', description: '다른 기술의 선행 조건' },
  laserTech: { type: 'prerequisite', description: '레이저 무기의 선행 조건' },
  ionTech: { type: 'prerequisite', description: '이온 무기의 선행 조건' },
  plasmaTech: { type: 'prerequisite', description: '플라즈마 무기의 선행 조건' },
  hyperspaceTech: { type: 'prerequisite', description: '고급 함선/건물의 선행 조건' },
  astrophysics: { type: 'utility', description: '탐사 미션 가능' },
  intergalacticResearch: { 
    type: 'utility', 
    effect: 'researchNetwork',
    description: '다른 행성의 연구소 레벨 합산',
    formula: '총 연구소 레벨 = 레벨 개수만큼의 가장 높은 연구소들의 합',
  },
  gravitonTech: { type: 'prerequisite', description: '데스스타 건조 가능' },
};

// 함선별 엔진 타입 정의
export const SHIP_ENGINE_DATA = {
  // 연소 엔진 함선
  smallCargo: { 
    defaultEngine: 'combustion', 
    baseSpeed: 5000,
    upgradeCondition: { impulseDrive: 5 },
    upgradedEngine: 'impulse',
    upgradedBaseSpeed: 10000,
  },
  largeCargo: { defaultEngine: 'combustion', baseSpeed: 7500 },
  lightFighter: { defaultEngine: 'combustion', baseSpeed: 12500 },
  recycler: { defaultEngine: 'combustion', baseSpeed: 2000 },
  espionageProbe: { defaultEngine: 'combustion', baseSpeed: 100000000 },
  
  // 임펄스 엔진 함선
  heavyFighter: { defaultEngine: 'impulse', baseSpeed: 10000 },
  cruiser: { defaultEngine: 'impulse', baseSpeed: 15000 },
  bomber: { 
    defaultEngine: 'impulse', 
    baseSpeed: 4000,
    upgradeCondition: { hyperspaceDrive: 8 },
    upgradedEngine: 'hyperspace',
    upgradedBaseSpeed: 5000,
  },
  
  // 초공간 엔진 함선
  battleship: { defaultEngine: 'hyperspace', baseSpeed: 10000 },
  destroyer: { defaultEngine: 'hyperspace', baseSpeed: 5000 },
  deathstar: { defaultEngine: 'hyperspace', baseSpeed: 100 },
  battlecruiser: { defaultEngine: 'hyperspace', baseSpeed: 10000 },
  
  // 기타
  solarSatellite: { defaultEngine: 'none', baseSpeed: 0 },
  colonyShip: { defaultEngine: 'impulse', baseSpeed: 2500 },
};

// 정탐 기술 정보 레벨
export const ESPIONAGE_INFO_LEVELS = {
  1: ['resources'],           // 자원만
  2: ['resources', 'fleet'],  // +함대
  3: ['resources', 'fleet', 'defense'],        // +방어시설
  5: ['resources', 'fleet', 'defense', 'buildings'], // +건물
  7: ['resources', 'fleet', 'defense', 'buildings', 'research'], // +연구
};

// 함선 속도 계산 함수
export function calculateShipSpeed(
  shipType: string,
  researchLevels: { combustionDrive?: number; impulseDrive?: number; hyperspaceDrive?: number }
): number {
  const shipData = SHIP_ENGINE_DATA[shipType];
  if (!shipData) return 0;
  
  const combustionLevel = researchLevels.combustionDrive || 0;
  const impulseLevel = researchLevels.impulseDrive || 0;
  const hyperspaceLevel = researchLevels.hyperspaceDrive || 0;
  
  // 엔진 업그레이드 확인
  let engine = shipData.defaultEngine;
  let baseSpeed = shipData.baseSpeed;
  
  if (shipData.upgradeCondition) {
    const [techType, requiredLevel] = Object.entries(shipData.upgradeCondition)[0] as [string, number];
    const currentTechLevel = researchLevels[techType] || 0;
    
    if (currentTechLevel >= requiredLevel) {
      engine = shipData.upgradedEngine;
      baseSpeed = shipData.upgradedBaseSpeed;
    }
  }
  
  // 엔진 보너스 적용
  let bonus = 0;
  switch (engine) {
    case 'combustion':
      bonus = combustionLevel * 0.1; // 10% per level
      break;
    case 'impulse':
      bonus = impulseLevel * 0.2; // 20% per level
      break;
    case 'hyperspace':
      bonus = hyperspaceLevel * 0.3; // 30% per level
      break;
  }
  
  return Math.floor(baseSpeed * (1 + bonus));
}

// 함대 슬롯 계산 함수
export function calculateFleetSlots(computerTechLevel: number): number {
  return 1 + computerTechLevel;
}

// 전투 스탯 계산 함수
export function calculateCombatStats(
  baseAttack: number,
  baseShield: number,
  baseHull: number,
  weaponsTech: number,
  shieldTech: number,
  armorTech: number
): { attack: number; shield: number; hull: number } {
  return {
    attack: Math.floor(baseAttack * (1 + 0.1 * weaponsTech)),
    shield: Math.floor(baseShield * (1 + 0.1 * shieldTech)),
    hull: Math.floor(baseHull * (1 + 0.1 * armorTech)),
  };
}

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
  colonyShip: '식민선',
  
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

