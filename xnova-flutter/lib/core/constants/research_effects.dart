// 연구 효과 데이터 (OGame 레퍼런스)

class ResearchEffect {
  final String type;
  final String effect;
  final double bonus;
  final String description;
  final String? formula;
  final String? currentEffect; // 현재 레벨 효과

  const ResearchEffect({
    required this.type,
    this.effect = '',
    this.bonus = 0,
    required this.description,
    this.formula,
    this.currentEffect,
  });

  // 현재 레벨에서의 효과 문자열 반환
  String getEffectAtLevel(int level) {
    switch (effect) {
      case 'attack':
      case 'shield':
      case 'armor':
        return '+${(bonus * level * 100).toInt()}%';
      case 'speed_combustion':
        return '속도 +${(bonus * level * 100).toInt()}%';
      case 'speed_impulse':
        return '속도 +${(bonus * level * 100).toInt()}%';
      case 'speed_hyperspace':
        return '속도 +${(bonus * level * 100).toInt()}%';
      case 'fleetSlots':
        return '${1 + level}개 슬롯';
      default:
        return '';
    }
  }
}

const Map<String, ResearchEffect> researchEffects = {
  // ===== 전투 기술 =====
  'weaponsTech': ResearchEffect(
    type: 'combat',
    effect: 'attack',
    bonus: 0.1,
    description: '모든 유닛 공격력 +10%/레벨',
    formula: '공격력 = 기본공격력 × (1 + 0.1 × 레벨)',
  ),
  'shieldTech': ResearchEffect(
    type: 'combat',
    effect: 'shield',
    bonus: 0.1,
    description: '모든 유닛 실드 +10%/레벨',
    formula: '실드 = 기본실드 × (1 + 0.1 × 레벨)',
  ),
  'armorTech': ResearchEffect(
    type: 'combat',
    effect: 'armor',
    bonus: 0.1,
    description: '모든 유닛 구조력 +10%/레벨',
    formula: '구조력 = 기본구조력 × (1 + 0.1 × 레벨)',
  ),

  // ===== 엔진 기술 =====
  'combustionDrive': ResearchEffect(
    type: 'engine',
    effect: 'speed_combustion',
    bonus: 0.1,
    description: '연소 엔진 함선 속도 +10%/레벨',
    formula: '속도 = 기본속도 × (1 + 0.1 × 레벨)',
  ),
  'impulseDrive': ResearchEffect(
    type: 'engine',
    effect: 'speed_impulse',
    bonus: 0.2,
    description: '임펄스 엔진 함선 속도 +20%/레벨',
    formula: '속도 = 기본속도 × (1 + 0.2 × 레벨)',
  ),
  'hyperspaceDrive': ResearchEffect(
    type: 'engine',
    effect: 'speed_hyperspace',
    bonus: 0.3,
    description: '초공간 엔진 함선 속도 +30%/레벨',
    formula: '속도 = 기본속도 × (1 + 0.3 × 레벨)',
  ),

  // ===== 유틸리티 기술 =====
  'computerTech': ResearchEffect(
    type: 'utility',
    effect: 'fleetSlots',
    bonus: 1,
    description: '최대 함대 슬롯 +1/레벨',
    formula: '함대슬롯 = 1 + 레벨',
  ),
  'espionageTech': ResearchEffect(
    type: 'utility',
    effect: 'espionage',
    description: '정찰 보고서 정보량 증가\n역정찰 방어력 증가',
    formula: 'ST = 위성수 ± (레벨차이)²',
  ),
  'astrophysics': ResearchEffect(
    type: 'utility',
    effect: 'expedition',
    description: '탐사 미션 가능',
  ),
  'intergalacticResearch': ResearchEffect(
    type: 'utility',
    effect: 'researchNetwork',
    description: '다른 행성의 연구소 레벨 합산',
    formula: '총 연구소 = 상위 N개 합 (N=레벨)',
  ),

  // ===== 선행 기술 =====
  'energyTech': ResearchEffect(
    type: 'prerequisite',
    description: '다른 기술의 선행 조건',
  ),
  'laserTech': ResearchEffect(
    type: 'prerequisite',
    description: '레이저 무기의 선행 조건',
  ),
  'ionTech': ResearchEffect(
    type: 'prerequisite',
    description: '이온 무기의 선행 조건',
  ),
  'plasmaTech': ResearchEffect(
    type: 'prerequisite',
    description: '플라즈마 무기의 선행 조건',
  ),
  'hyperspaceTech': ResearchEffect(
    type: 'prerequisite',
    description: '고급 함선/건물의 선행 조건',
  ),
  'gravitonTech': ResearchEffect(
    type: 'prerequisite',
    description: '죽음의 별 건조 가능',
  ),
};

// 엔진 적용 함선
const Map<String, List<String>> engineShips = {
  'combustion': ['소형화물선*', '대형화물선', '전투기', '수확선', '무인정찰기'],
  'impulse': ['공격기', '순양함', '폭격기*'],
  'hyperspace': ['전함', '구축함', '죽음의별', '전투순양함'],
};

// 엔진 업그레이드 조건
const Map<String, String> engineUpgrades = {
  '소형화물선': '임펄스 엔진 5 → 임펄스 엔진으로 업그레이드',
  '폭격기': '초공간 엔진 8 → 초공간 엔진으로 업그레이드',
};


