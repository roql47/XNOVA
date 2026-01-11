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
    'cruiser': '구축함',
    'battleship': '순양함',
    'battlecruiser': '전투순양함',
    'bomber': '폭격기',
    'destroyer': '전함',
    'deathstar': '죽음의별',
    'recycler': '수확선',
    'espionageProbe': '무인정찰기',
    'solarSatellite': '태양광인공위성',
    'colonyShip': '식민선',
    
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

  // 함선 속도
  static const Map<String, int> fleetSpeed = {
    'smallCargo': 5000,
    'largeCargo': 7500,
    'lightFighter': 12500,
    'heavyFighter': 10000,
    'cruiser': 15000,
    'battleship': 10000,
    'battlecruiser': 10000,
    'bomber': 4000,
    'destroyer': 5000,
    'deathstar': 100,
    'recycler': 2000,
    'espionageProbe': 1000000,
    'solarSatellite': 0,
    'colonyShip': 2500,
  };

  // 함선 적재량
  static const Map<String, int> fleetCargo = {
    'smallCargo': 5000,
    'largeCargo': 25000,
    'lightFighter': 50,
    'heavyFighter': 100,
    'cruiser': 800,
    'battleship': 1500,
    'battlecruiser': 750,
    'bomber': 500,
    'destroyer': 2000,
    'deathstar': 1000000,
    'recycler': 20000,
    'espionageProbe': 5,
    'solarSatellite': 0,
    'colonyShip': 7500,
  };

  // 함선 연료 소비량
  static const Map<String, int> fleetFuelConsumption = {
    'smallCargo': 10,
    'largeCargo': 50,
    'lightFighter': 20,
    'heavyFighter': 75,
    'cruiser': 300,
    'battleship': 500,
    'battlecruiser': 250,
    'bomber': 1000,
    'destroyer': 1000,
    'deathstar': 1,
    'recycler': 300,
    'espionageProbe': 1,
    'solarSatellite': 0,
    'colonyShip': 1000,
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
    'colonyShip': {'attack': 50, 'shield': 100, 'hull': 30000},
    
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

  // 함선 속도 조회
  static int getFleetSpeed(String type) {
    return fleetSpeed[type] ?? 10000;
  }

  // 함선 연료 소비량 조회
  static int getFuelConsumption(String type) {
    return fleetFuelConsumption[type] ?? 0;
  }

  // 함대의 최소 속도 계산 (가장 느린 함선 기준)
  static int getMinFleetSpeed(Map<String, int> fleet) {
    int minSpeed = 999999999;
    for (final entry in fleet.entries) {
      if (entry.value > 0) {
        final speed = fleetSpeed[entry.key] ?? 10000;
        if (speed > 0 && speed < minSpeed) {
          minSpeed = speed;
        }
      }
    }
    return minSpeed == 999999999 ? 10000 : minSpeed;
  }

  // 좌표 간 거리 계산
  static int calculateDistance(String coordA, String coordB) {
    final partsA = coordA.split(':').map(int.parse).toList();
    final partsB = coordB.split(':').map(int.parse).toList();

    if (partsA.length < 3 || partsB.length < 3) return 0;

    final galaxyA = partsA[0];
    final systemA = partsA[1];
    final planetA = partsA[2];

    final galaxyB = partsB[0];
    final systemB = partsB[1];
    final planetB = partsB[2];

    // 다른 은하
    if (galaxyA != galaxyB) {
      return 20000 * (galaxyA - galaxyB).abs();
    }

    // 같은 은하, 다른 시스템
    if (systemA != systemB) {
      return 2700 + (95 * (systemA - systemB).abs());
    }

    // 같은 시스템, 다른 행성
    if (planetA != planetB) {
      return 1000 + (5 * (planetA - planetB).abs());
    }

    // 같은 행성
    return 5;
  }

  // 이동 시간 계산 (초 단위)
  static double calculateTravelTime(int distance, int speed) {
    if (speed <= 0) return 0;
    return (distance / speed) * 3600;
  }

  // 함대 연료 소비량 계산
  static int calculateFleetFuelConsumption(Map<String, int> fleet, int distance, double duration) {
    int totalConsumption = 0;

    for (final entry in fleet.entries) {
      final type = entry.key;
      final count = entry.value;
      
      if (count > 0) {
        final basicConsumption = fleetFuelConsumption[type] ?? 0;
        final shipSpeed = fleetSpeed[type] ?? 0;

        if (basicConsumption > 0 && shipSpeed > 0) {
          // 임시속도 계산
          double tmpSpeed = 0;
          if (duration > 0 && shipSpeed > 0) {
            final sqrtTerm = (distance * 10 / shipSpeed);
            final denominator = duration - 10;
            if (denominator > 0 && sqrtTerm > 0) {
              tmpSpeed = (35000 / denominator) * (sqrtTerm > 0 ? sqrtTerm.abs() : 1);
              // 간소화된 근사값 사용
              tmpSpeed = tmpSpeed.clamp(0, 100);
            }
          }

          // 실제 소비량 공식
          final speedFactor = ((tmpSpeed / 10) + 1) * ((tmpSpeed / 10) + 1);
          double consumption = (basicConsumption * count * distance) / 35000 * speedFactor;

          // 소비량 조정 (게임 밸런스) - 10배 증가
          consumption = consumption / 50;
          consumption = consumption < 1 ? 1 : consumption;

          totalConsumption += consumption.round();
        }
      }
    }

    return totalConsumption > 0 ? totalConsumption : 1;
  }
}
