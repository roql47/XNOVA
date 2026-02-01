// 게임 요소 한글 이름 및 이미지 경로

// 건물 한글 이름
const Map<String, String> buildingNames = {
  'metalMine': '메탈광산',
  'crystalMine': '크리스탈광산',
  'deuteriumMine': '듀테륨광산',
  'solarPlant': '태양광발전소',
  'fusionReactor': '핵융합로',
  'robotFactory': '로봇공장',
  'shipyard': '조선소',
  'researchLab': '연구소',
  'nanoFactory': '나노공장',
};

// 건물 이미지 경로
const Map<String, String> buildingImages = {
  'metalMine': 'assets/images/metalmine.webp',
  'crystalMine': 'assets/images/crystalmine.webp',
  'deuteriumMine': 'assets/images/deuterium_synthesizer.webp',
  'solarPlant': 'assets/images/solarplant.webp',
  'fusionReactor': 'assets/images/fusion_reactor.webp',
  'robotFactory': 'assets/images/robotics_factory.webp',
  'shipyard': 'assets/images/shipyard.webp',
  'researchLab': 'assets/images/research_rab.webp',
  'nanoFactory': 'assets/images/nanite_factory.webp',
};

// 연구 한글 이름
const Map<String, String> researchNames = {
  'energyTech': '에너지공학',
  'laserTech': '레이저공학',
  'ionTech': '이온공학',
  'hyperspaceTech': '초공간기술',
  'plasmaTech': '플라즈마공학',
  'combustionDrive': '연소엔진',
  'impulseDrive': '핵추진엔진',
  'hyperspaceDrive': '초공간엔진',
  'espionageTech': '정탐기술',
  'computerTech': '컴퓨터공학',
  'astrophysics': '원정기술',
  'intergalacticResearch': '은하망네트워크',
  'gravitonTech': '중력자기술',
  'weaponsTech': '무기공학',
  'shieldTech': '보호막연구',
  'armorTech': '장갑기술',
};

// 연구 이미지 경로
const Map<String, String> researchImages = {
  'energyTech': 'assets/images/engery_technology.webp',
  'laserTech': 'assets/images/laser_technology.webp',
  'ionTech': 'assets/images/ion_technology.webp',
  'hyperspaceTech': 'assets/images/hyperspace_technology.webp',
  'plasmaTech': 'assets/images/plasma_technology.webp',
  'combustionDrive': 'assets/images/combustion_drive.webp',
  'impulseDrive': 'assets/images/impulse_drive.webp',
  'hyperspaceDrive': 'assets/images/hyperspace_drive.webp',
  'espionageTech': 'assets/images/espionage_technology.webp',
  'computerTech': 'assets/images/computer_technology.webp',
  'astrophysics': 'assets/images/astrophysics.webp',
  'intergalacticResearch': 'assets/images/intergalactic_research_network.webp',
  'gravitonTech': 'assets/images/graviton_technology.webp',
  'weaponsTech': 'assets/images/weapons_technology.webp',
  'shieldTech': 'assets/images/shielding_technology.webp',
  'armorTech': 'assets/images/armor_technology.webp',
};

// 함대 한글 이름
const Map<String, String> fleetNames = {
  'smallCargo': '소형화물선',
  'largeCargo': '대형화물선',
  'lightFighter': '전투기',
  'heavyFighter': '공격기',
  'cruiser': '구축함',
  'battleship': '순양함',
  'battlecruiser': '전투순양함',
  'bomber': '폭격기',
  'destroyer': '전함',
  'deathstar': '죽음의별',
  'recycler': '수확선',
  'espionageProbe': '무인정찰기',
  'solarSatellite': '태양광위성',
  'colonyShip': '식민선',
  'reaper': '리퍼',
};

// 함대 이미지 경로
const Map<String, String> fleetImages = {
  'smallCargo': 'assets/images/small_cargo_ship.webp',
  'largeCargo': 'assets/images/large_cargo_ship.webp',
  'lightFighter': 'assets/images/light_fighter.webp',
  'heavyFighter': 'assets/images/heavy_fighter.webp',
  'cruiser': 'assets/images/cruiser.webp',
  'battleship': 'assets/images/battleship.webp',
  'battlecruiser': 'assets/images/battlecruiser.jpg',
  'bomber': 'assets/images/bomber.webp',
  'destroyer': 'assets/images/destroyer.webp',
  'deathstar': 'assets/images/deathstar.webp',
  'recycler': 'assets/images/recycler.webp',
  'espionageProbe': 'assets/images/espionage_probe.webp',
  'solarSatellite': 'assets/images/solar_satellite.webp',
  'colonyShip': 'assets/images/colony_ship.webp',
  'reaper': 'assets/images/reaper.webp',
};

// 방어시설 한글 이름
const Map<String, String> defenseNames = {
  'rocketLauncher': '미사일발사대',
  'lightLaser': '경레이저포탑',
  'heavyLaser': '중레이저포탑',
  'gaussCannon': '가우스포',
  'ionCannon': '이온포',
  'plasmaTurret': '플라즈마포탑',
  'smallShieldDome': '소형보호막돔',
  'largeShieldDome': '대형보호막돔',
  'antiBallisticMissile': '대탄도미사일',
  'interplanetaryMissile': '대륙간미사일',
};

// 방어시설 이미지 경로
const Map<String, String> defenseImages = {
  'rocketLauncher': 'assets/images/rocket_launcher.webp',
  'lightLaser': 'assets/images/light_laser.webp',
  'heavyLaser': 'assets/images/heavy_laser.webp',
  'gaussCannon': 'assets/images/gauss_cannon.webp',
  'ionCannon': 'assets/images/ion_cannon.webp',
  'plasmaTurret': 'assets/images/plasma_turret.webp',
  'smallShieldDome': 'assets/images/small_shield_dome.webp',
  'largeShieldDome': 'assets/images/large_shield_dome.webp',
  'antiBallisticMissile': 'assets/images/anti-ballistic_missile.webp',
  'interplanetaryMissile': 'assets/images/interplanetary_missile.jpg',
};

// 모든 이름을 통합 검색
String getKoreanName(String key) {
  return buildingNames[key] ?? 
         researchNames[key] ?? 
         fleetNames[key] ?? 
         defenseNames[key] ?? 
         key;
}

// 모든 이미지 경로를 통합 검색
String? getImagePath(String key) {
  return buildingImages[key] ?? 
         researchImages[key] ?? 
         fleetImages[key] ?? 
         defenseImages[key];
}

