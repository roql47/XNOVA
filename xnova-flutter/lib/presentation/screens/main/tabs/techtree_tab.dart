import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

// 이미지 경로 매핑
const Map<String, String> techImages = {
  // 건물
  'metalMine': 'assets/images/metalmine.webp',
  'crystalMine': 'assets/images/crystalmine.webp',
  'deuteriumSynthesizer': 'assets/images/deuterium_synthesizer.webp',
  'solarPlant': 'assets/images/solarplant.webp',
  'fusionReactor': 'assets/images/fusion_reactor.webp',
  'roboticsFactory': 'assets/images/robotics_factory.webp',
  'naniteFactory': 'assets/images/nanite_factory.webp',
  'shipyard': 'assets/images/shipyard.webp',
  'metalStorage': 'assets/images/metal_storage.webp',
  'crystalStorage': 'assets/images/crystal_storage.webp',
  'deuteriumTank': 'assets/images/deuterium_tank.webp',
  'researchLab': 'assets/images/research_rab.webp',
  'allianceDepot': 'assets/images/alliance_depot.webp',
  'missileSilo': 'assets/images/missile_silo.webp',
  'terraformer': 'assets/images/terraformer.webp',
  'spaceDock': 'assets/images/space_dock.webp',
  'lunarBase': 'assets/images/lunar_base.webp',
  'sensorPhalanx': 'assets/images/sensor_phalanx.webp',
  'jumpGate': 'assets/images/jump_gate.webp',
  // 연구
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
  'intergalacticResearchNetwork': 'assets/images/intergalactic_research_network.webp',
  'gravitonTech': 'assets/images/graviton_technology.webp',
  'weaponsTech': 'assets/images/weapons_technology.webp',
  'shieldTech': 'assets/images/shielding_technology.webp',
  'armorTech': 'assets/images/armor_technology.webp',
  // 함선
  'smallCargo': 'assets/images/small_cargo_ship.webp',
  'largeCargo': 'assets/images/large_cargo_ship.webp',
  'lightFighter': 'assets/images/light_fighter.webp',
  'heavyFighter': 'assets/images/heavy_fighter.webp',
  'cruiser': 'assets/images/cruiser.webp',
  'battleship': 'assets/images/battleship.webp',
  'colonyShip': 'assets/images/colony_ship.webp',
  'recycler': 'assets/images/recycler.webp',
  'espionageProbe': 'assets/images/espionage_probe.webp',
  'bomber': 'assets/images/bomber.webp',
  'solarSatellite': 'assets/images/solar_satellite.webp',
  'destroyer': 'assets/images/destroyer.webp',
  'deathstar': 'assets/images/deathstar.webp',
  'battlecruiser': 'assets/images/battlecruiser.jpg',
  // 방어시설
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

// 건물 테크트리 데이터
const Map<String, Map<String, dynamic>> buildingTechTree = {
  'metalMine': {'name': '금속 광산', 'requirements': {}},
  'crystalMine': {'name': '크리스탈 광산', 'requirements': {}},
  'deuteriumSynthesizer': {'name': '듀테륨 합성기', 'requirements': {}},
  'solarPlant': {'name': '태양광 발전소', 'requirements': {}},
  'fusionReactor': {'name': '핵융합 발전소', 'requirements': {
    'deuteriumSynthesizer': 5, 'energyTech': 3,
  }},
  'roboticsFactory': {'name': '로봇 공장', 'requirements': {}},
  'naniteFactory': {'name': '나노봇 공장', 'requirements': {
    'roboticsFactory': 10, 'computerTech': 10,
  }},
  'shipyard': {'name': '조선소', 'requirements': {
    'roboticsFactory': 2,
  }},
  'metalStorage': {'name': '금속 저장소', 'requirements': {}},
  'crystalStorage': {'name': '크리스탈 저장소', 'requirements': {}},
  'deuteriumTank': {'name': '듀테륨 탱크', 'requirements': {}},
  'researchLab': {'name': '연구소', 'requirements': {}},
  'allianceDepot': {'name': '동맹 창고', 'requirements': {}},
  'missileSilo': {'name': '미사일 기지', 'requirements': {
    'shipyard': 1,
  }},
  'terraformer': {'name': '테라포머', 'requirements': {
    'naniteFactory': 1, 'energyTech': 12,
  }},
  'spaceDock': {'name': '우주 정거장', 'requirements': {
    'shipyard': 2,
  }},
  'lunarBase': {'name': '달 기지', 'requirements': {}},
  'sensorPhalanx': {'name': '센서 팔랑크스', 'requirements': {
    'lunarBase': 1,
  }},
  'jumpGate': {'name': '점프 게이트', 'requirements': {
    'lunarBase': 1, 'hyperspaceTech': 7,
  }},
};

// 연구 테크트리 데이터
const Map<String, Map<String, dynamic>> researchTechTree = {
  'energyTech': {'name': '에너지 공학', 'requirements': {
    'researchLab': 1,
  }},
  'laserTech': {'name': '레이저 공학', 'requirements': {
    'researchLab': 1, 'energyTech': 2,
  }},
  'ionTech': {'name': '이온 공학', 'requirements': {
    'researchLab': 4, 'energyTech': 4, 'laserTech': 5,
  }},
  'hyperspaceTech': {'name': '초공간 기술', 'requirements': {
    'researchLab': 7, 'energyTech': 5, 'shieldTech': 5,
  }},
  'plasmaTech': {'name': '플라즈마 공학', 'requirements': {
    'researchLab': 4, 'energyTech': 8, 'laserTech': 10, 'ionTech': 5,
  }},
  'combustionDrive': {'name': '연소 엔진', 'requirements': {
    'researchLab': 1, 'energyTech': 1,
  }},
  'impulseDrive': {'name': '핵추진 엔진', 'requirements': {
    'researchLab': 2, 'energyTech': 1,
  }},
  'hyperspaceDrive': {'name': '초공간 엔진', 'requirements': {
    'researchLab': 7, 'hyperspaceTech': 3,
  }},
  'espionageTech': {'name': '정탐 기술', 'requirements': {
    'researchLab': 3,
  }},
  'computerTech': {'name': '컴퓨터 공학', 'requirements': {
    'researchLab': 1,
  }},
  'astrophysics': {'name': '천체물리학', 'requirements': {
    'researchLab': 3, 'espionageTech': 4, 'impulseDrive': 3,
  }},
  'intergalacticResearchNetwork': {'name': '은하간 연구 네트워크', 'requirements': {
    'researchLab': 10, 'computerTech': 8, 'hyperspaceTech': 8,
  }},
  'gravitonTech': {'name': '중력자 기술', 'requirements': {
    'researchLab': 12,
  }},
  'weaponsTech': {'name': '무기 기술', 'requirements': {
    'researchLab': 4,
  }},
  'shieldTech': {'name': '보호막 기술', 'requirements': {
    'researchLab': 6, 'energyTech': 3,
  }},
  'armorTech': {'name': '장갑 기술', 'requirements': {
    'researchLab': 2,
  }},
};

// 함선 테크트리 데이터
const Map<String, Map<String, dynamic>> shipTechTree = {
  'smallCargo': {'name': '소형 화물선', 'requirements': {
    'shipyard': 2, 'combustionDrive': 2,
  }},
  'largeCargo': {'name': '대형 화물선', 'requirements': {
    'shipyard': 4, 'combustionDrive': 6,
  }},
  'lightFighter': {'name': '전투기', 'requirements': {
    'shipyard': 1, 'combustionDrive': 1,
  }},
  'heavyFighter': {'name': '공격기', 'requirements': {
    'shipyard': 3, 'impulseDrive': 2, 'armorTech': 2,
  }},
  'cruiser': {'name': '구축함', 'requirements': {
    'shipyard': 5, 'impulseDrive': 4, 'ionTech': 2,
  }},
  'battleship': {'name': '순양함', 'requirements': {
    'shipyard': 7, 'hyperspaceDrive': 4,
  }},
  'colonyShip': {'name': '이민선', 'requirements': {
    'shipyard': 4, 'impulseDrive': 3,
  }},
  'recycler': {'name': '수확선', 'requirements': {
    'shipyard': 4, 'combustionDrive': 6, 'shieldTech': 2,
  }},
  'espionageProbe': {'name': '무인 정찰기', 'requirements': {
    'shipyard': 3, 'combustionDrive': 3, 'espionageTech': 2,
  }},
  'bomber': {'name': '폭격기', 'requirements': {
    'shipyard': 8, 'impulseDrive': 6, 'plasmaTech': 5,
  }},
  'solarSatellite': {'name': '태양광 인공위성', 'requirements': {
    'shipyard': 1,
  }},
  'destroyer': {'name': '전함', 'requirements': {
    'shipyard': 9, 'hyperspaceDrive': 6, 'hyperspaceTech': 5,
  }},
  'deathstar': {'name': '죽음의 별', 'requirements': {
    'shipyard': 12, 'hyperspaceDrive': 7, 'hyperspaceTech': 6, 'gravitonTech': 1,
  }},
  'battlecruiser': {'name': '순양전함', 'requirements': {
    'shipyard': 8, 'hyperspaceTech': 5, 'hyperspaceDrive': 5, 'laserTech': 12,
  }},
};

// 방어시설 테크트리 데이터
const Map<String, Map<String, dynamic>> defenseTechTree = {
  'rocketLauncher': {'name': '로켓 발사대', 'requirements': {
    'shipyard': 1,
  }},
  'lightLaser': {'name': '레이저 포(약)', 'requirements': {
    'shipyard': 2, 'energyTech': 1, 'laserTech': 3,
  }},
  'heavyLaser': {'name': '레이저 포(강)', 'requirements': {
    'shipyard': 4, 'energyTech': 3, 'laserTech': 6,
  }},
  'gaussCannon': {'name': '가우스 캐논', 'requirements': {
    'shipyard': 6, 'energyTech': 6, 'weaponsTech': 3, 'shieldTech': 1,
  }},
  'ionCannon': {'name': '이온 캐논', 'requirements': {
    'shipyard': 4, 'ionTech': 4,
  }},
  'plasmaTurret': {'name': '플라즈마 터렛', 'requirements': {
    'shipyard': 8, 'plasmaTech': 7,
  }},
  'smallShieldDome': {'name': '소형 보호막 돔', 'requirements': {
    'shipyard': 1, 'shieldTech': 2,
  }},
  'largeShieldDome': {'name': '대형 보호막 돔', 'requirements': {
    'shipyard': 6, 'shieldTech': 6,
  }},
  'antiBallisticMissile': {'name': '요격 미사일', 'requirements': {
    'missileSilo': 2,
  }},
  'interplanetaryMissile': {'name': '행성간 미사일', 'requirements': {
    'missileSilo': 4, 'impulseDrive': 1,
  }},
};

class TechtreeTab extends StatefulWidget {
  const TechtreeTab({super.key});

  @override
  State<TechtreeTab> createState() => _TechtreeTabState();
}

class _TechtreeTabState extends State<TechtreeTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: AppColors.surface,
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: AppColors.accent,
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textSecondary,
            labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            tabs: const [
              Tab(text: '건물'),
              Tab(text: '연구'),
              Tab(text: '함선'),
              Tab(text: '방어시설'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTechTreeList(buildingTechTree, '건물'),
              _buildTechTreeList(researchTechTree, '연구'),
              _buildTechTreeList(shipTechTree, '함선'),
              _buildTechTreeList(defenseTechTree, '방어시설'),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildTechTreeList(Map<String, Map<String, dynamic>> techTree, String category) {
    final items = techTree.entries.toList();
    
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final entry = items[index];
        final key = entry.key;
        final data = entry.value;
        final rawRequirements = data['requirements'];
        final requirements = Map<String, dynamic>.from(rawRequirements as Map);
        
        return _buildTechTreeCard(
          techKey: key,
          name: data['name'] as String,
          requirements: requirements,
        );
      },
    );
  }
  
  Widget _buildTechTreeCard({
    required String techKey,
    required String name,
    required Map<String, dynamic> requirements,
  }) {
    final hasRequirements = requirements.isNotEmpty;
    final imagePath = techImages[techKey];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder, width: 0.5),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: imagePath != null
                ? Image.asset(
                    imagePath,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 44,
                        height: 44,
                        color: AppColors.panelHeader,
                        child: const Icon(Icons.image_not_supported, color: AppColors.textMuted, size: 20),
                      );
                    },
                  )
                : Container(
                    width: 44,
                    height: 44,
                    color: AppColors.panelHeader,
                    child: const Icon(Icons.help_outline, color: AppColors.textMuted, size: 20),
                  ),
          ),
          title: Text(
            name,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          subtitle: Text(
            hasRequirements ? '요구사항 ${requirements.length}개' : '요구사항 없음',
            style: TextStyle(
              color: hasRequirements ? AppColors.textSecondary : AppColors.positive,
              fontSize: 12,
            ),
          ),
          trailing: const Icon(
            Icons.expand_more,
            color: AppColors.textSecondary,
          ),
          children: [
            if (hasRequirements)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Divider(color: AppColors.panelBorder),
                    const SizedBox(height: 8),
                    const Text(
                      '요구 조건',
                      style: TextStyle(
                        color: AppColors.accent,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: requirements.entries.map((req) {
                        return _buildRequirementChip(req.key, req.value);
                      }).toList(),
                    ),
                  ],
                ),
              )
            else
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, color: AppColors.positive, size: 16),
                    SizedBox(width: 6),
                    Text(
                      '기본 건설 가능',
                      style: TextStyle(color: AppColors.positive, fontSize: 12),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildRequirementChip(String key, dynamic level) {
    final name = _getRequirementName(key);
    final imagePath = techImages[key];
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.panelHeader,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (imagePath != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Image.asset(
                imagePath,
                width: 18,
                height: 18,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(Icons.help_outline, size: 14, color: AppColors.textMuted);
                },
              ),
            )
          else
            const Icon(Icons.help_outline, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            '$name Lv.$level',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
  
  String _getRequirementName(String key) {
    // 건물에서 찾기
    if (buildingTechTree.containsKey(key)) {
      return buildingTechTree[key]!['name'] as String;
    }
    // 연구에서 찾기
    if (researchTechTree.containsKey(key)) {
      return researchTechTree[key]!['name'] as String;
    }
    // 함선에서 찾기
    if (shipTechTree.containsKey(key)) {
      return shipTechTree[key]!['name'] as String;
    }
    // 방어시설에서 찾기
    if (defenseTechTree.containsKey(key)) {
      return defenseTechTree[key]!['name'] as String;
    }
    
    return key.replaceAllMapped(
      RegExp(r'([A-Z])'),
      (match) => ' ${match.group(0)}',
    ).trim();
  }
}
