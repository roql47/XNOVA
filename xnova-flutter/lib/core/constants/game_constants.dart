class GameConstants {
  static const Map<String, String> nameMapping = {
    // 건물
    'metalMine': '메탈광산',
    'crystalMine': '크리스탈광산',
    'deuteriumMine': '듀테륨광산',
    'solarPlant': '태양광발전소',
    'fusionReactor': '핵융합로',
    'robotFactory': '로봇공장',
    'shipyard': '조선소',
    'researchLab': '연구소',
    'nanoFactory': '나노공장',
    
    // 함대
    'smallCargo': '소형화물선',
    'largeCargo': '대형화물선',
    'lightFighter': '전투기',
    'heavyFighter': '공격기',
    'cruiser': '순양함',
    'battleship': '전함',
    'battlecruiser': '전투순양함',
    'bomber': '폭격기',
    'destroyer': '구축함',
    'deathstar': '죽음의별',
    'recycler': '수확선',
    'espionageProbe': '무인정찰기',
    'solarSatellite': '태양광인공위성',
    
    // 방어시설
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
    
    // 연구
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

  // 함선/방어시설 기본 스탯 (공격력, 쉴드, 장갑)
  static const Map<String, Map<String, int>> unitStats = {
    // 함선
    'smallCargo': {'attack': 5, 'shield': 10, 'hull': 4000},
    'largeCargo': {'attack': 5, 'shield': 25, 'hull': 12000},
    'lightFighter': {'attack': 50, 'shield': 10, 'hull': 4000},
    'heavyFighter': {'attack': 150, 'shield': 25, 'hull': 10000},
    'cruiser': {'attack': 400, 'shield': 50, 'hull': 27000},
    'battleship': {'attack': 1000, 'shield': 200, 'hull': 60000},
    'battlecruiser': {'attack': 700, 'shield': 400, 'hull': 70000},
    'bomber': {'attack': 1000, 'shield': 500, 'hull': 75000},
    'destroyer': {'attack': 2000, 'shield': 500, 'hull': 110000},
    'deathstar': {'attack': 200000, 'shield': 50000, 'hull': 9000000},
    'recycler': {'attack': 1, 'shield': 10, 'hull': 16000},
    'espionageProbe': {'attack': 0, 'shield': 0, 'hull': 1000},
    'solarSatellite': {'attack': 1, 'shield': 1, 'hull': 2000},
    
    // 방어시설
    'rocketLauncher': {'attack': 80, 'shield': 20, 'hull': 2000},
    'lightLaser': {'attack': 100, 'shield': 25, 'hull': 2000},
    'heavyLaser': {'attack': 250, 'shield': 100, 'hull': 8000},
    'gaussCannon': {'attack': 1100, 'shield': 200, 'hull': 35000},
    'ionCannon': {'attack': 150, 'shield': 500, 'hull': 8000},
    'plasmaTurret': {'attack': 3000, 'shield': 300, 'hull': 100000},
    'smallShieldDome': {'attack': 1, 'shield': 2000, 'hull': 20000},
    'largeShieldDome': {'attack': 1, 'shield': 10000, 'hull': 100000},
  };

  static String getName(String type) {
    return nameMapping[type] ?? type;
  }

  static int getBaseAttack(String type) {
    return unitStats[type]?['attack'] ?? 0;
  }

  static int getBaseShield(String type) {
    return unitStats[type]?['shield'] ?? 0;
  }

  static int getBaseHull(String type) {
    return unitStats[type]?['hull'] ?? 0;
  }
}
