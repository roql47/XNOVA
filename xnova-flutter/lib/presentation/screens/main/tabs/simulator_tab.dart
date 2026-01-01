import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math';
import '../../../../core/theme/app_colors.dart';

// 함선 데이터 (namu.txt 기준, hull = 구조력/10)
const Map<String, Map<String, dynamic>> fleetData = {
  'smallCargo': {'name': '소형 화물선', 'attack': 5, 'shield': 10, 'hull': 400, 'speed': 5000, 'cargo': 5000, 'cost': {'metal': 2000, 'crystal': 2000}},
  'largeCargo': {'name': '대형 화물선', 'attack': 5, 'shield': 25, 'hull': 1200, 'speed': 7500, 'cargo': 25000, 'cost': {'metal': 6000, 'crystal': 6000}},
  'colonyShip': {'name': '이민선', 'attack': 50, 'shield': 100, 'hull': 3000, 'speed': 2500, 'cargo': 7500, 'cost': {'metal': 10000, 'crystal': 20000, 'deuterium': 10000}},
  'recycler': {'name': '수확선', 'attack': 1, 'shield': 10, 'hull': 1600, 'speed': 2000, 'cargo': 20000, 'cost': {'metal': 10000, 'crystal': 6000, 'deuterium': 2000}},
  'espionageProbe': {'name': '무인정찰기', 'attack': 0, 'shield': 0, 'hull': 100, 'speed': 100000000, 'cargo': 5, 'cost': {'crystal': 1000}},
  'solarSatellite': {'name': '태양광 인공위성', 'attack': 1, 'shield': 1, 'hull': 200, 'speed': 0, 'cargo': 0, 'cost': {'crystal': 2000, 'deuterium': 500}},
  'lightFighter': {'name': '전투기', 'attack': 50, 'shield': 10, 'hull': 400, 'speed': 12500, 'cargo': 50, 'cost': {'metal': 3000, 'crystal': 1000}},
  'heavyFighter': {'name': '공격기', 'attack': 150, 'shield': 25, 'hull': 1000, 'speed': 10000, 'cargo': 100, 'cost': {'metal': 6000, 'crystal': 4000}},
  'cruiser': {'name': '구축함', 'attack': 400, 'shield': 50, 'hull': 2700, 'speed': 15000, 'cargo': 800, 'cost': {'metal': 20000, 'crystal': 7000, 'deuterium': 2000}},
  'battleship': {'name': '순양함', 'attack': 1000, 'shield': 200, 'hull': 6000, 'speed': 10000, 'cargo': 1500, 'cost': {'metal': 45000, 'crystal': 15000}},
  'battlecruiser': {'name': '순양전함', 'attack': 700, 'shield': 400, 'hull': 7000, 'speed': 10000, 'cargo': 750, 'cost': {'metal': 30000, 'crystal': 40000, 'deuterium': 15000}},
  'bomber': {'name': '폭격기', 'attack': 1000, 'shield': 500, 'hull': 7500, 'speed': 4000, 'cargo': 500, 'cost': {'metal': 50000, 'crystal': 25000, 'deuterium': 15000}},
  'destroyer': {'name': '전함', 'attack': 2000, 'shield': 500, 'hull': 11000, 'speed': 5000, 'cargo': 2000, 'cost': {'metal': 60000, 'crystal': 50000, 'deuterium': 15000}},
  'deathstar': {'name': '죽음의 별', 'attack': 200000, 'shield': 50000, 'hull': 900000, 'speed': 100, 'cargo': 1000000, 'cost': {'metal': 5000000, 'crystal': 4000000, 'deuterium': 1000000}},
};

// 방어시설 데이터 (namu.txt 기준, hull = 구조력/10)
const Map<String, Map<String, dynamic>> defenseData = {
  'rocketLauncher': {'name': '로켓 발사대', 'attack': 80, 'shield': 20, 'hull': 200, 'cost': {'metal': 2000}},
  'lightLaser': {'name': '경 레이저', 'attack': 100, 'shield': 25, 'hull': 200, 'cost': {'metal': 1500, 'crystal': 500}},
  'heavyLaser': {'name': '중 레이저', 'attack': 250, 'shield': 100, 'hull': 800, 'cost': {'metal': 6000, 'crystal': 2000}},
  'gaussCannon': {'name': '가우스 캐논', 'attack': 1100, 'shield': 200, 'hull': 3500, 'cost': {'metal': 20000, 'crystal': 15000, 'deuterium': 2000}},
  'ionCannon': {'name': '이온 캐논', 'attack': 150, 'shield': 500, 'hull': 800, 'cost': {'metal': 5000, 'crystal': 3000}},
  'plasmaTurret': {'name': '플라즈마 터렛', 'attack': 3000, 'shield': 300, 'hull': 10000, 'cost': {'metal': 50000, 'crystal': 50000, 'deuterium': 30000}},
  'smallShieldDome': {'name': '소형 보호막 돔', 'attack': 1, 'shield': 2000, 'hull': 2000, 'cost': {'metal': 10000, 'crystal': 10000}},
  'largeShieldDome': {'name': '대형 보호막 돔', 'attack': 1, 'shield': 10000, 'hull': 10000, 'cost': {'metal': 50000, 'crystal': 50000}},
};

// 급속 사격 데이터 (namu.txt 기준)
const Map<String, Map<String, int>> rapidFireData = {
  // 화물선/유틸리티
  'smallCargo': {'espionageProbe': 5, 'solarSatellite': 5},
  'largeCargo': {'espionageProbe': 5, 'solarSatellite': 5},
  'colonyShip': {'espionageProbe': 5, 'solarSatellite': 5},
  'recycler': {'espionageProbe': 5, 'solarSatellite': 5},
  // 전투함선
  'lightFighter': {'espionageProbe': 5, 'solarSatellite': 5},
  'heavyFighter': {'espionageProbe': 5, 'solarSatellite': 5, 'smallCargo': 3},
  'cruiser': {'espionageProbe': 5, 'solarSatellite': 5, 'lightFighter': 6, 'rocketLauncher': 10},
  'battleship': {'espionageProbe': 5, 'solarSatellite': 5},
  'battlecruiser': {
    'espionageProbe': 5, 'solarSatellite': 5,
    'smallCargo': 3, 'largeCargo': 3, 'heavyFighter': 4, 'cruiser': 4, 'battleship': 7,
  },
  'bomber': {
    'espionageProbe': 5, 'solarSatellite': 5,
    'rocketLauncher': 20, 'lightLaser': 20, 'heavyLaser': 10, 'ionCannon': 10, 'gaussCannon': 5, 'plasmaTurret': 5,
  },
  'destroyer': {'espionageProbe': 5, 'solarSatellite': 5, 'battlecruiser': 2, 'lightLaser': 10},
  'deathstar': {
    'espionageProbe': 1250, 'solarSatellite': 1250,
    'smallCargo': 250, 'largeCargo': 250, 'colonyShip': 250, 'recycler': 250,
    'lightFighter': 200, 'heavyFighter': 100, 'cruiser': 33, 'battleship': 30,
    'battlecruiser': 15, 'destroyer': 5,
    'rocketLauncher': 200, 'lightLaser': 200, 'heavyLaser': 100, 'ionCannon': 100, 'gaussCannon': 50,
  },
};

class SimulatorTab extends StatefulWidget {
  const SimulatorTab({super.key});

  @override
  State<SimulatorTab> createState() => _SimulatorTabState();
}

class _SimulatorTabState extends State<SimulatorTab> {
  // 공격자 함대
  final Map<String, int> attackerFleet = {};
  // 방어자 함대
  final Map<String, int> defenderFleet = {};
  // 방어자 방어시설
  final Map<String, int> defenderDefense = {};
  
  // 연구 레벨
  int attackerWeaponTech = 0;
  int attackerShieldTech = 0;
  int attackerArmorTech = 0;
  int defenderWeaponTech = 0;
  int defenderShieldTech = 0;
  int defenderArmorTech = 0;
  
  // 공격자/방어자 정보
  String attackerName = '공격자';
  String defenderName = '방어자';
  String attackerCoord = '[1:1:1]';
  String defenderCoord = '[1:1:1]';
  
  // 전투 결과
  BattleResult? battleResult;
  bool isSimulating = false;
  
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // 헤더
        _buildHeader(),
        const SizedBox(height: 16),
        
        // 공격자 섹션
        _buildAttackerSection(),
        const SizedBox(height: 16),
        
        // 방어자 섹션
        _buildDefenderSection(),
        const SizedBox(height: 16),
        
        // 연구 레벨 섹션
        _buildResearchSection(),
        const SizedBox(height: 20),
        
        // 시뮬레이션 버튼
        _buildSimulateButton(),
        const SizedBox(height: 16),
        
        // 전투 결과
        if (battleResult != null) _buildDetailedBattleReport(),
      ],
    );
  }
  
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Row(
        children: [
          Icon(Icons.analytics, size: 28, color: AppColors.accent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '전투 시뮬레이터',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.accent,
                  ),
                ),
                Text(
                  '함대와 방어시설을 설정하고 전투 결과를 예측하세요',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.refresh, color: AppColors.warning, size: 20),
            onPressed: _resetAll,
            tooltip: '초기화',
          ),
        ],
      ),
    );
  }
  
  Widget _buildAttackerSection() {
    return _buildSection(
      title: '공격자 함대',
      icon: Icons.flight_takeoff,
      color: Colors.red,
      child: Column(
        children: fleetData.entries.map((e) {
          return _buildUnitInput(
            type: e.key,
            name: e.value['name'] as String,
            stats: e.value,
            value: attackerFleet[e.key] ?? 0,
            onChanged: (val) => setState(() => attackerFleet[e.key] = val),
          );
        }).toList(),
      ),
    );
  }
  
  Widget _buildDefenderSection() {
    return Column(
      children: [
        _buildSection(
          title: '방어자 함대',
          icon: Icons.flight_land,
          color: Colors.blue,
          child: Column(
            children: fleetData.entries.map((e) {
              return _buildUnitInput(
                type: e.key,
                name: e.value['name'] as String,
                stats: e.value,
                value: defenderFleet[e.key] ?? 0,
                onChanged: (val) => setState(() => defenderFleet[e.key] = val),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 12),
        _buildSection(
          title: '방어자 방어시설',
          icon: Icons.shield,
          color: Colors.cyan,
          child: Column(
            children: defenseData.entries.map((e) {
              return _buildUnitInput(
                type: e.key,
                name: e.value['name'] as String,
                stats: e.value,
                value: defenderDefense[e.key] ?? 0,
                onChanged: (val) => setState(() => defenderDefense[e.key] = val),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
  
  Widget _buildResearchSection() {
    return _buildSection(
      title: '연구 레벨',
      icon: Icons.science,
      color: Colors.purple,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('공격자', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
          _buildResearchRow('무기 공학', attackerWeaponTech, (v) => setState(() => attackerWeaponTech = v)),
          _buildResearchRow('보호막 기술', attackerShieldTech, (v) => setState(() => attackerShieldTech = v)),
          _buildResearchRow('장갑 기술', attackerArmorTech, (v) => setState(() => attackerArmorTech = v)),
          const Divider(color: AppColors.panelBorder),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('방어자', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
          ),
          _buildResearchRow('무기 공학', defenderWeaponTech, (v) => setState(() => defenderWeaponTech = v)),
          _buildResearchRow('보호막 기술', defenderShieldTech, (v) => setState(() => defenderShieldTech = v)),
          _buildResearchRow('장갑 기술', defenderArmorTech, (v) => setState(() => defenderArmorTech = v)),
        ],
      ),
    );
  }
  
  Widget _buildResearchRow(String label, int value, ValueChanged<int> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(color: AppColors.textSecondary))),
          IconButton(
            icon: const Icon(Icons.remove, size: 18),
            onPressed: value > 0 ? () => onChanged(value - 1) : null,
            color: AppColors.textSecondary,
          ),
          Container(
            width: 40,
            alignment: Alignment.center,
            child: Text('$value', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
          ),
          IconButton(
            icon: const Icon(Icons.add, size: 18),
            onPressed: value < 30 ? () => onChanged(value + 1) : null,
            color: AppColors.ogameGreen,
          ),
        ],
      ),
    );
  }
  
  Widget _buildSection({required String title, required IconData icon, required Color color, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: ExpansionTile(
        leading: Icon(icon, size: 18, color: color),
        title: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w500, fontSize: 13)),
        initiallyExpanded: false,
        collapsedIconColor: color,
        iconColor: color,
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: child,
          ),
        ],
      ),
    );
  }
  
  Widget _buildUnitInput({
    required String type,
    required String name,
    required Map<String, dynamic> stats,
    required int value,
    required ValueChanged<int> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13)),
                Text(
                  '공격: ${stats['attack']} | 방어: ${stats['shield']} | 내구: ${stats['hull']}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 100,
            child: TextFormField(
              initialValue: value > 0 ? value.toString() : '',
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                hintText: '0',
                hintStyle: TextStyle(color: AppColors.textSecondary.withOpacity(0.5)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                isDense: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(4),
                  borderSide: const BorderSide(color: AppColors.panelBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(4),
                  borderSide: const BorderSide(color: AppColors.panelBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(4),
                  borderSide: const BorderSide(color: AppColors.ogameGreen),
                ),
              ),
              onChanged: (val) => onChanged(int.tryParse(val) ?? 0),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSimulateButton() {
    final hasAttacker = attackerFleet.values.any((v) => v > 0);
    final hasDefender = defenderFleet.values.any((v) => v > 0) || defenderDefense.values.any((v) => v > 0);
    
    return ElevatedButton(
      onPressed: (hasAttacker && hasDefender && !isSimulating) ? _runSimulation : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.ogameGreen,
        foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: isSimulating
          ? const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2),
            )
          : const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.play_arrow, size: 24),
                SizedBox(width: 8),
                Text('전투 시뮬레이션 실행', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
    );
  }
  
  // =============================================
  // 상세 전투 보고서
  // =============================================
  
  Widget _buildDetailedBattleReport() {
    final result = battleResult!;
    
    return Container(
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        children: [
          // 전투 전 상태
          _buildPreBattleSection(result),
          
          // 각 라운드
          ...result.rounds.asMap().entries.map((entry) {
            final roundIdx = entry.key;
            final round = entry.value;
            final prevRound = roundIdx > 0 ? result.rounds[roundIdx - 1] : null;
            return _buildRoundSection(roundIdx + 1, round, prevRound, result);
          }),
          
          // 전투 결과
          _buildBattleResultSection(result),
        ],
      ),
    );
  }
  
  Widget _buildPreBattleSection(BattleResult result) {
    return Column(
      children: [
        // 공격측 전투 전 상태
        _buildPreBattleSide(
          title: '전투 전 - 공격측',
          color: Colors.red,
          playerName: attackerName,
          coord: attackerCoord,
          weaponTech: attackerWeaponTech,
          shieldTech: attackerShieldTech,
          armorTech: attackerArmorTech,
          fleet: result.initialAttackerFleet,
          defense: {},
          isAttacker: true,
        ),
        
        // 방어측 전투 전 상태
        _buildPreBattleSide(
          title: '전투 전 - 방어측',
          color: Colors.blue,
          playerName: defenderName,
          coord: defenderCoord,
          weaponTech: defenderWeaponTech,
          shieldTech: defenderShieldTech,
          armorTech: defenderArmorTech,
          fleet: result.initialDefenderFleet,
          defense: result.initialDefenderDefense,
          isAttacker: false,
        ),
      ],
    );
  }
  
  Widget _buildPreBattleSide({
    required String title,
    required Color color,
    required String playerName,
    required String coord,
    required int weaponTech,
    required int shieldTech,
    required int armorTech,
    required Map<String, int> fleet,
    required Map<String, int> defense,
    required bool isAttacker,
  }) {
    // 유닛 목록 (수량 > 0인 것만)
    final units = <MapEntry<String, int>>[];
    fleet.forEach((key, value) {
      if (value > 0) units.add(MapEntry(key, value));
    });
    defense.forEach((key, value) {
      if (value > 0) units.add(MapEntry(key, value));
    });
    
    if (units.isEmpty) return const SizedBox.shrink();
    
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.panelBorder.withOpacity(0.5))),
            ),
            child: Column(
              children: [
                Text(
                  '${isAttacker ? "공격자" : "방어자"} $playerName ($coord)',
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                ),
                const SizedBox(height: 4),
                Text(
                  '무기: ${weaponTech * 10}%  방어막: ${shieldTech * 10}%  장갑: ${armorTech * 10}%',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                ),
              ],
            ),
          ),
          _buildUnitTable(units, isAttacker, weaponTech, shieldTech, armorTech),
        ],
      ),
    );
  }
  
  Widget _buildUnitTable(List<MapEntry<String, int>> units, bool isAttacker, int weaponTech, int shieldTech, int armorTech, {Map<String, int>? changes}) {
    final weaponBonus = 1 + weaponTech * 0.1;
    final shieldBonus = 1 + shieldTech * 0.1;
    final armorBonus = 1 + armorTech * 0.1;
    
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Table(
          defaultColumnWidth: const IntrinsicColumnWidth(),
          border: TableBorder.all(color: AppColors.panelBorder, width: 1),
          children: [
            TableRow(
              decoration: BoxDecoration(color: AppColors.panelHeader),
              children: [
                _tableCell('유형', isHeader: true),
                ...units.map((e) => _tableCell(_getUnitName(e.key), isHeader: true)),
              ],
            ),
            TableRow(
              children: [
                _tableCell('수량', isHeader: true),
                ...units.map((e) {
                  final change = changes?[e.key] ?? 0;
                  if (change != 0) {
                    return _tableCellWithChange(_formatNumberFull(e.value), change);
                  }
                  return _tableCell(_formatNumberFull(e.value));
                }),
              ],
            ),
            TableRow(
              children: [
                _tableCell('공격력', isHeader: true),
                ...units.map((e) {
                  final data = fleetData[e.key] ?? defenseData[e.key];
                  final attack = ((data?['attack'] ?? 0) as int) * weaponBonus;
                  return _tableCell(_formatNumberFull(attack.round()));
                }),
              ],
            ),
            TableRow(
              children: [
                _tableCell('방어막', isHeader: true),
                ...units.map((e) {
                  final data = fleetData[e.key] ?? defenseData[e.key];
                  final shield = ((data?['shield'] ?? 0) as int) * shieldBonus;
                  return _tableCell(_formatNumberFull(shield.round()));
                }),
              ],
            ),
            TableRow(
              children: [
                _tableCell('장갑', isHeader: true),
                ...units.map((e) {
                  final data = fleetData[e.key] ?? defenseData[e.key];
                  final hull = ((data?['hull'] ?? 0) as int) * armorBonus ~/ 10;
                  return _tableCell(_formatNumberFull(hull));
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _tableCell(String text, {bool isHeader = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 10,
          fontWeight: isHeader ? FontWeight.bold : FontWeight.normal,
          color: isHeader ? AppColors.textPrimary : AppColors.textSecondary,
        ),
      ),
    );
  }
  
  Widget _tableCellWithChange(String text, int change) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      child: Column(
        children: [
          Text(text, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
          if (change != 0)
            Text(
              '(▼${change.abs()})',
              style: const TextStyle(fontSize: 9, color: AppColors.negative),
            ),
        ],
      ),
    );
  }
  
  Widget _buildRoundSection(int roundNum, RoundInfo round, RoundInfo? prevRound, BattleResult result) {
    Map<String, int> attackerChanges = {};
    Map<String, int> defenderChanges = {};
    
    final prevAttacker = prevRound?.remainingAttackerFleet ?? result.initialAttackerFleet;
    final prevDefender = prevRound != null 
        ? {...prevRound.remainingDefenderFleet, ...prevRound.remainingDefenderDefense}
        : {...result.initialDefenderFleet, ...result.initialDefenderDefense};
    
    for (final entry in prevAttacker.entries) {
      final current = round.remainingAttackerFleet[entry.key] ?? 0;
      final diff = entry.value - current;
      if (diff > 0) attackerChanges[entry.key] = diff;
    }
    
    for (final entry in prevDefender.entries) {
      final current = (round.remainingDefenderFleet[entry.key] ?? 0) + (round.remainingDefenderDefense[entry.key] ?? 0);
      final diff = entry.value - current;
      if (diff > 0) defenderChanges[entry.key] = diff;
    }
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: Column(
              children: [
                Text('라운드 $roundNum', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                if (round.rapidFireCount > 0) ...[
                  const SizedBox(height: 4),
                  Text('급속사격 ${round.rapidFireCount}회', style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                ],
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.panelHeader,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '공격 함대가 ${_formatNumberFull(round.ashoot)}번 발사하여 총 화력 ${_formatNumberFull(round.apower)}으로\n'
                    '방어측을 공격합니다. 방어측의 방어막이 ${_formatNumberFull(round.dabsorb)}의 피해를 흡수합니다.',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.panelHeader,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '방어 함대가 ${_formatNumberFull(round.dshoot)}번 발사하여 총 화력 ${_formatNumberFull(round.dpower)}으로\n'
                    '공격측을 공격합니다. 공격측의 방어막이 ${_formatNumberFull(round.aabsorb)}의 피해를 흡수합니다.',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          _buildRoundAfterSide(
            title: '라운드 $roundNum 후 - 공격측:',
            playerName: attackerName,
            coord: attackerCoord,
            fleet: round.remainingAttackerFleet,
            defense: {},
            changes: attackerChanges,
            weaponTech: attackerWeaponTech,
            shieldTech: attackerShieldTech,
            armorTech: attackerArmorTech,
            isAttacker: true,
          ),
          _buildRoundAfterSide(
            title: '라운드 $roundNum 후 - 방어측:',
            playerName: defenderName,
            coord: defenderCoord,
            fleet: round.remainingDefenderFleet,
            defense: round.remainingDefenderDefense,
            changes: defenderChanges,
            weaponTech: defenderWeaponTech,
            shieldTech: defenderShieldTech,
            armorTech: defenderArmorTech,
            isAttacker: false,
          ),
        ],
      ),
    );
  }
  
  Widget _buildRoundAfterSide({
    required String title,
    required String playerName,
    required String coord,
    required Map<String, int> fleet,
    required Map<String, int> defense,
    required Map<String, int> changes,
    required int weaponTech,
    required int shieldTech,
    required int armorTech,
    required bool isAttacker,
  }) {
    final allUnits = {...fleet, ...defense};
    final hasUnits = allUnits.values.any((v) => v > 0);
    
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Text(
              '${isAttacker ? "공격자" : "방어자"} $playerName ($coord)',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
            ),
          ),
          if (!hasUnits)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: Text('파괴됨', style: TextStyle(color: AppColors.negative, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            )
          else
            _buildRoundUnitTable(allUnits, changes, weaponTech, shieldTech, armorTech),
        ],
      ),
    );
  }
  
  Widget _buildRoundUnitTable(Map<String, int> units, Map<String, int> changes, int weaponTech, int shieldTech, int armorTech) {
    final nonZeroUnits = units.entries.where((e) => e.value > 0).toList();
    if (nonZeroUnits.isEmpty) return const SizedBox.shrink();
    
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Table(
          defaultColumnWidth: const IntrinsicColumnWidth(),
          border: TableBorder.all(color: AppColors.panelBorder, width: 1),
          children: [
            TableRow(
              decoration: BoxDecoration(color: AppColors.panelHeader),
              children: [
                _tableCell('유형', isHeader: true),
                ...nonZeroUnits.map((e) => _tableCell(_getUnitName(e.key), isHeader: true)),
              ],
            ),
            TableRow(
              children: [
                _tableCell('수량', isHeader: true),
                ...nonZeroUnits.map((e) {
                  final change = changes[e.key] ?? 0;
                  if (change > 0) {
                    return _tableCellWithChange(_formatNumberFull(e.value), change);
                  }
                  return _tableCell(_formatNumberFull(e.value));
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildBattleResultSection(BattleResult result) {
    final resultText = result.attackerWon ? '공격자가 전투에서 승리했습니다!' : (result.defenderWon ? '방어자가 전투에서 승리했습니다!' : '전투가 무승부로 끝났습니다.');
    
    final totalDebris = (result.debris['metal'] ?? 0) + (result.debris['crystal'] ?? 0);
    final moonChance = min(20, totalDebris ~/ 100000);
    
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: const Text(
              '전투 결과',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            child: Text(
              resultText,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (result.attackerWon) ...[
                  const Text('약탈한 자원:', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                  const SizedBox(height: 6),
                  _buildResourceRow('메탈', result.loot['metal'] ?? 0),
                  _buildResourceRow('크리스탈', result.loot['crystal'] ?? 0),
                  _buildResourceRow('중수소', result.loot['deuterium'] ?? 0),
                  const Divider(color: AppColors.panelBorder, height: 20),
                ],
                const Text('손실 통계', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 6),
                Text('공격자 총 손실: ${_formatNumberFull(_calculateTotalLoss(result.attackerLosses))} 유닛', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                Text('방어자 총 손실: ${_formatNumberFull(_calculateTotalLoss(result.defenderLosses))} 유닛', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                const SizedBox(height: 12),
                const Text('잔해 필드', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 4),
                Text(
                  '메탈 ${_formatNumberFull(result.debris['metal'] ?? 0)} | 크리스탈 ${_formatNumberFull(result.debris['crystal'] ?? 0)}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                ),
                const SizedBox(height: 8),
                Text('달 생성 확률: $moonChance%', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                if (result.restoredDefenses.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('방어시설 복구', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text(
                    result.restoredDefenses.entries
                        .where((e) => e.value > 0)
                        .map((e) => '${e.value} ${_getUnitName(e.key)}')
                        .join(', ') + ' 복구됨',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildResourceRow(String label, int value) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, top: 2),
      child: Text('$label: ${_formatNumberFull(value)}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
    );
  }
  
  int _calculateTotalLoss(Map<String, int> losses) {
    return (losses['metal'] ?? 0) + (losses['crystal'] ?? 0) + (losses['deuterium'] ?? 0);
  }
  
  
  int _countUnits(Map<String, int> units) {
    return units.values.fold(0, (sum, v) => sum + v);
  }
  
  String _getUnitName(String type) {
    return fleetData[type]?['name'] as String? ?? defenseData[type]?['name'] as String? ?? type;
  }
  
  String _getShortName(String type) {
    const shortNames = {
      'lightFighter': '전투',
      'heavyFighter': '공격',
      'cruiser': '순양',
      'battleship': '전함',
      'battlecruiser': '전순',
      'bomber': '폭격',
      'destroyer': '구축',
      'deathstar': '죽별',
      'smallCargo': '소화',
      'largeCargo': '대화',
      'recycler': '수확',
      'rocketLauncher': '미발',
      'lightLaser': '경레',
      'heavyLaser': '중레',
      'gaussCannon': '가우',
      'ionCannon': '이온',
      'plasmaTurret': '플라',
      'smallShieldDome': '소돔',
      'largeShieldDome': '대돔',
    };
    return shortNames[type] ?? type;
  }
  
  void _resetAll() {
    setState(() {
      attackerFleet.clear();
      defenderFleet.clear();
      defenderDefense.clear();
      attackerWeaponTech = 0;
      attackerShieldTech = 0;
      attackerArmorTech = 0;
      defenderWeaponTech = 0;
      defenderShieldTech = 0;
      defenderArmorTech = 0;
      battleResult = null;
    });
  }
  
  void _runSimulation() {
    setState(() => isSimulating = true);
    
    // 약간의 딜레이 후 시뮬레이션 실행 (UX 개선)
    Future.delayed(const Duration(milliseconds: 300), () {
      final result = _simulateBattle(
        attackerFleet: Map.from(attackerFleet),
        defenderFleet: Map.from(defenderFleet),
        defenderDefense: Map.from(defenderDefense),
        attackerResearch: {
          'weaponsTech': attackerWeaponTech,
          'shieldTech': attackerShieldTech,
          'armorTech': attackerArmorTech,
        },
        defenderResearch: {
          'weaponsTech': defenderWeaponTech,
          'shieldTech': defenderShieldTech,
          'armorTech': defenderArmorTech,
        },
      );
      
      setState(() {
        battleResult = result;
        isSimulating = false;
      });
    });
  }
  
  String _formatNumber(int num) {
    if (num >= 1000000) {
      return '${(num / 1000000).toStringAsFixed(1)}M';
    } else if (num >= 1000) {
      return '${(num / 1000).toStringAsFixed(1)}K';
    }
    return num.toString();
  }
  
  String _formatNumberFull(int num) {
    if (num == 0) return '0';
    final str = num.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) {
        buffer.write(',');
      }
    }
    return buffer.toString().split('').reversed.join();
  }
  
  // ===== 전투 시뮬레이션 로직 (OGame 오리지널 - 개별 랜덤 타겟팅) =====
  BattleResult _simulateBattle({
    required Map<String, int> attackerFleet,
    required Map<String, int> defenderFleet,
    required Map<String, int> defenderDefense,
    required Map<String, int> attackerResearch,
    required Map<String, int> defenderResearch,
  }) {
    final random = Random();
    
    // 기술 보너스 계산
    final attackerWeaponBonus = 1 + (attackerResearch['weaponsTech'] ?? 0) * 0.1;
    final attackerShieldBonus = 1 + (attackerResearch['shieldTech'] ?? 0) * 0.1;
    final attackerArmorBonus = 1 + (attackerResearch['armorTech'] ?? 0) * 0.1;
    
    final defenderWeaponBonus = 1 + (defenderResearch['weaponsTech'] ?? 0) * 0.1;
    final defenderShieldBonus = 1 + (defenderResearch['shieldTech'] ?? 0) * 0.1;
    final defenderArmorBonus = 1 + (defenderResearch['armorTech'] ?? 0) * 0.1;
    
    // 결과 초기화
    final result = BattleResult(
      initialAttackerFleet: Map.from(attackerFleet),
      initialDefenderFleet: Map.from(defenderFleet),
      initialDefenderDefense: Map.from(defenderDefense),
    );
    
    // 유닛 생성
    List<BattleUnit> attackerUnits = [];
    List<BattleUnit> defenderUnits = [];
    
    // 공격자 유닛 생성
    for (final entry in attackerFleet.entries) {
      final data = fleetData[entry.key];
      if (data == null || entry.value <= 0) continue;
      
      for (int i = 0; i < entry.value; i++) {
        attackerUnits.add(BattleUnit(
          type: entry.key,
          side: 'attacker',
          attack: ((data['attack'] as int) * attackerWeaponBonus).round(),
          maxShield: ((data['shield'] as int) * attackerShieldBonus).round(),
          shield: ((data['shield'] as int) * attackerShieldBonus).round(),
          maxHull: ((data['hull'] as int) * attackerArmorBonus).round(),
          hull: ((data['hull'] as int) * attackerArmorBonus).round(),
          rapidFire: rapidFireData[entry.key] ?? {},
        ));
      }
    }
    
    // 방어자 함대 유닛 생성
    for (final entry in defenderFleet.entries) {
      final data = fleetData[entry.key];
      if (data == null || entry.value <= 0) continue;
      
      for (int i = 0; i < entry.value; i++) {
        defenderUnits.add(BattleUnit(
          type: entry.key,
          side: 'defender',
          attack: ((data['attack'] as int) * defenderWeaponBonus).round(),
          maxShield: ((data['shield'] as int) * defenderShieldBonus).round(),
          shield: ((data['shield'] as int) * defenderShieldBonus).round(),
          maxHull: ((data['hull'] as int) * defenderArmorBonus).round(),
          hull: ((data['hull'] as int) * defenderArmorBonus).round(),
          rapidFire: rapidFireData[entry.key] ?? {},
        ));
      }
    }
    
    // 방어자 방어시설 유닛 생성
    for (final entry in defenderDefense.entries) {
      final data = defenseData[entry.key];
      if (data == null || entry.value <= 0) continue;
      
      for (int i = 0; i < entry.value; i++) {
        defenderUnits.add(BattleUnit(
          type: entry.key,
          side: 'defender',
          attack: ((data['attack'] as int) * defenderWeaponBonus).round(),
          maxShield: ((data['shield'] as int) * defenderShieldBonus).round(),
          shield: ((data['shield'] as int) * defenderShieldBonus).round(),
          maxHull: ((data['hull'] as int) * defenderArmorBonus).round(),
          hull: ((data['hull'] as int) * defenderArmorBonus).round(),
          rapidFire: {},
          isDefense: true,
        ));
      }
    }
    
    // 파괴된 방어시설 추적 (복구용)
    Map<String, int> destroyedDefenses = {};
    
    // 최대 6라운드 전투
    const maxRounds = 6;
    
    for (int round = 0; round < maxRounds; round++) {
      if (attackerUnits.isEmpty || defenderUnits.isEmpty) break;
      
      // 라운드 정보
      final roundInfo = RoundInfo();
      
      // 쉴드 재생
      for (final unit in [...attackerUnits, ...defenderUnits]) {
        unit.shield = unit.maxShield;
      }
      
      // 모든 유닛 섞기
      final allUnits = [...attackerUnits, ...defenderUnits]..shuffle(random);
      
      // 각 유닛의 공격 처리
      for (final attacker in allUnits) {
        if (attacker.hull <= 0) continue;
        
        final targets = attacker.side == 'attacker' ? defenderUnits : attackerUnits;
        if (targets.isEmpty) continue;
        
        int shots = 1;
        while (shots > 0 && targets.isNotEmpty) {
          shots--;
          
          final targetIdx = random.nextInt(targets.length);
          final target = targets[targetIdx];
          
          if (target.hull <= 0) {
            targets.removeAt(targetIdx);
            continue;
          }
          
          // OGame 형식: 발사 횟수 및 화력 기록
          if (attacker.side == 'attacker') {
            roundInfo.ashoot++;
            roundInfo.apower += attacker.attack;
          } else {
            roundInfo.dshoot++;
            roundInfo.dpower += attacker.attack;
          }
          
          // 공격 실행
          final initialShield = target.shield;
          final initialHull = target.hull;
          
          _performAttack(attacker, target);
          
          final shieldDamage = max(0, initialShield - target.shield);
          final hullDamage = max(0, initialHull - target.hull);
          
          // OGame 형식: 쉴드 흡수량 기록
          if (attacker.side == 'attacker') {
            roundInfo.dabsorb += shieldDamage;
            roundInfo.attackerTotalDamage += shieldDamage + hullDamage;
            roundInfo.defenderShieldAbsorbed += shieldDamage;
            roundInfo.defenderHullDamage += hullDamage;
          } else {
            roundInfo.aabsorb += shieldDamage;
            roundInfo.defenderTotalDamage += shieldDamage + hullDamage;
            roundInfo.attackerShieldAbsorbed += shieldDamage;
            roundInfo.attackerHullDamage += hullDamage;
          }
          
          // OGame 폭발 판정: 장갑 70% 이하 + 쉴드 0일 때만
          if (target.hull > 0 && target.hull <= target.maxHull * 0.7 && target.shield == 0) {
            final explosionChance = (target.hull * 100) ~/ target.maxHull;
            if (random.nextInt(100) >= explosionChance) {
              target.hull = 0;
            }
          }
          
          // 파괴 확인
          if (target.hull <= 0) {
            if (target.side == 'attacker') {
              roundInfo.destroyedAttackerShips[target.type] = (roundInfo.destroyedAttackerShips[target.type] ?? 0) + 1;
            } else {
              roundInfo.destroyedDefenderShips[target.type] = (roundInfo.destroyedDefenderShips[target.type] ?? 0) + 1;
              // 방어시설 파괴 추적
              if (target.isDefense) {
                destroyedDefenses[target.type] = (destroyedDefenses[target.type] ?? 0) + 1;
              }
            }
            targets.removeAt(targetIdx);
          }
          
          // OGame 급속 사격 확률: 1 - (1/연사값)
          final rapidFireValue = attacker.rapidFire[target.type] ?? 0;
          if (rapidFireValue > 1) {
            final threshold = (1000 / rapidFireValue).floor();
            if (random.nextInt(1000) + 1 > threshold) {
              shots++;
              roundInfo.rapidFireCount++;
            }
          }
        }
      }
      
      // 라운드 종료 시 잔존 병력 기록
      for (final unit in attackerUnits.where((u) => u.hull > 0)) {
        roundInfo.remainingAttackerFleet[unit.type] = 
          (roundInfo.remainingAttackerFleet[unit.type] ?? 0) + 1;
      }
      for (final unit in defenderUnits.where((u) => u.hull > 0)) {
        if (unit.isDefense) {
          roundInfo.remainingDefenderDefense[unit.type] = 
            (roundInfo.remainingDefenderDefense[unit.type] ?? 0) + 1;
        } else {
          roundInfo.remainingDefenderFleet[unit.type] = 
            (roundInfo.remainingDefenderFleet[unit.type] ?? 0) + 1;
        }
      }
      
      // 파괴된 유닛 제거
      attackerUnits.removeWhere((u) => u.hull <= 0);
      defenderUnits.removeWhere((u) => u.hull <= 0);
      
      result.rounds.add(roundInfo);
    }
    
    // 결과 계산
    result.attackerWon = defenderUnits.isEmpty && attackerUnits.isNotEmpty;
    result.defenderWon = attackerUnits.isEmpty && defenderUnits.isNotEmpty;
    result.draw = attackerUnits.isEmpty && defenderUnits.isEmpty;
    
    // 생존 함대 계산
    for (final unit in attackerUnits) {
      result.survivingAttackerFleet[unit.type] = (result.survivingAttackerFleet[unit.type] ?? 0) + 1;
    }
    for (final unit in defenderUnits) {
      if (unit.isDefense) {
        result.survivingDefenderDefense[unit.type] = (result.survivingDefenderDefense[unit.type] ?? 0) + 1;
      } else {
        result.survivingDefenderFleet[unit.type] = (result.survivingDefenderFleet[unit.type] ?? 0) + 1;
      }
    }
    
    // 손실 계산
    _calculateLosses(result, attackerFleet, defenderFleet, defenderDefense);
    
    // 데브리 계산 (손실의 30%)
    result.debris['metal'] = ((result.attackerLosses['metal']! + result.defenderLosses['metal']!) * 0.3).round();
    result.debris['crystal'] = ((result.attackerLosses['crystal']! + result.defenderLosses['crystal']!) * 0.3).round();
    
    // 약탈 계산 (공격자 승리 시, 간단하게 방어자 손실의 일부)
    if (result.attackerWon) {
      result.loot['metal'] = (result.defenderLosses['metal']! * 0.5).round();
      result.loot['crystal'] = (result.defenderLosses['crystal']! * 0.5).round();
      result.loot['deuterium'] = (result.defenderLosses['deuterium']! * 0.5).round();
    }
    
    // 방어시설 복구 (70% 확률로 복구)
    for (final entry in destroyedDefenses.entries) {
      final restored = (entry.value * 0.7).round();
      if (restored > 0) {
        result.restoredDefenses[entry.key] = restored;
      }
    }
    
    return result;
  }
  
  void _performAttack(BattleUnit attacker, BattleUnit target) {
    int damage = attacker.attack;
    
    // 쉴드가 데미지의 1% 미만이면 무시
    if (target.shield < damage * 0.01) {
      target.hull -= damage;
    } else if (target.shield >= damage) {
      // 쉴드가 데미지를 완전 흡수
      target.shield -= damage;
    } else {
      // 쉴드를 뚫고 내구도 데미지
      final remainingDamage = damage - target.shield;
      target.shield = 0;
      target.hull -= remainingDamage;
    }
  }
  
  void _calculateLosses(BattleResult result, Map<String, int> attackerFleet, Map<String, int> defenderFleet, Map<String, int> defenderDefense) {
    // 공격자 손실
    for (final entry in attackerFleet.entries) {
      final initial = entry.value;
      final surviving = result.survivingAttackerFleet[entry.key] ?? 0;
      final lost = initial - surviving;
      if (lost > 0) {
        final cost = fleetData[entry.key]?['cost'] as Map<String, dynamic>?;
        if (cost != null) {
          result.attackerLosses['metal'] = (result.attackerLosses['metal'] ?? 0) + ((cost['metal'] ?? 0) as int) * lost;
          result.attackerLosses['crystal'] = (result.attackerLosses['crystal'] ?? 0) + ((cost['crystal'] ?? 0) as int) * lost;
          result.attackerLosses['deuterium'] = (result.attackerLosses['deuterium'] ?? 0) + ((cost['deuterium'] ?? 0) as int) * lost;
        }
      }
    }
    
    // 방어자 함대 손실
    for (final entry in defenderFleet.entries) {
      final initial = entry.value;
      final surviving = result.survivingDefenderFleet[entry.key] ?? 0;
      final lost = initial - surviving;
      if (lost > 0) {
        final cost = fleetData[entry.key]?['cost'] as Map<String, dynamic>?;
        if (cost != null) {
          result.defenderLosses['metal'] = (result.defenderLosses['metal'] ?? 0) + ((cost['metal'] ?? 0) as int) * lost;
          result.defenderLosses['crystal'] = (result.defenderLosses['crystal'] ?? 0) + ((cost['crystal'] ?? 0) as int) * lost;
          result.defenderLosses['deuterium'] = (result.defenderLosses['deuterium'] ?? 0) + ((cost['deuterium'] ?? 0) as int) * lost;
        }
      }
    }
    
    // 방어자 방어시설 손실
    for (final entry in defenderDefense.entries) {
      final initial = entry.value;
      final surviving = result.survivingDefenderDefense[entry.key] ?? 0;
      final lost = initial - surviving;
      if (lost > 0) {
        final cost = defenseData[entry.key]?['cost'] as Map<String, dynamic>?;
        if (cost != null) {
          result.defenderLosses['metal'] = (result.defenderLosses['metal'] ?? 0) + ((cost['metal'] ?? 0) as int) * lost;
          result.defenderLosses['crystal'] = (result.defenderLosses['crystal'] ?? 0) + ((cost['crystal'] ?? 0) as int) * lost;
          result.defenderLosses['deuterium'] = (result.defenderLosses['deuterium'] ?? 0) + ((cost['deuterium'] ?? 0) as int) * lost;
        }
      }
    }
  }
}

// 전투 유닛 클래스
class BattleUnit {
  final String type;
  final String side;
  final int attack;
  final int maxShield;
  int shield;
  final int maxHull;
  int hull;
  final Map<String, int> rapidFire;
  final bool isDefense;
  
  BattleUnit({
    required this.type,
    required this.side,
    required this.attack,
    required this.maxShield,
    required this.shield,
    required this.maxHull,
    required this.hull,
    required this.rapidFire,
    this.isDefense = false,
  });
}

// 전투 결과 클래스
class BattleResult {
  bool attackerWon = false;
  bool defenderWon = false;
  bool draw = false;
  
  final Map<String, int> initialAttackerFleet;
  final Map<String, int> initialDefenderFleet;
  final Map<String, int> initialDefenderDefense;
  
  Map<String, int> survivingAttackerFleet = {};
  Map<String, int> survivingDefenderFleet = {};
  Map<String, int> survivingDefenderDefense = {};
  
  List<RoundInfo> rounds = [];
  
  Map<String, int> attackerLosses = {'metal': 0, 'crystal': 0, 'deuterium': 0};
  Map<String, int> defenderLosses = {'metal': 0, 'crystal': 0, 'deuterium': 0};
  Map<String, int> debris = {'metal': 0, 'crystal': 0};
  Map<String, int> loot = {'metal': 0, 'crystal': 0, 'deuterium': 0};
  Map<String, int> restoredDefenses = {};
  
  BattleResult({
    required this.initialAttackerFleet,
    required this.initialDefenderFleet,
    required this.initialDefenderDefense,
  });
}

// 라운드 정보 클래스 (OGame 형식)
class RoundInfo {
  // OGame 형식 통계
  int ashoot = 0;           // 공격측 발사 횟수
  int apower = 0;           // 공격측 총 화력
  int dabsorb = 0;          // 방어측 쉴드 흡수량
  int dshoot = 0;           // 방어측 발사 횟수
  int dpower = 0;           // 방어측 총 화력
  int aabsorb = 0;          // 공격측 쉴드 흡수량
  
  // 기존 호환성
  int attackerTotalDamage = 0;
  int defenderTotalDamage = 0;
  int attackerShieldAbsorbed = 0;
  int defenderShieldAbsorbed = 0;
  int attackerHullDamage = 0;
  int defenderHullDamage = 0;
  
  // 파괴된 유닛
  Map<String, int> destroyedAttackerShips = {};
  Map<String, int> destroyedDefenderShips = {};
  
  // 라운드 종료 시 잔존 병력
  Map<String, int> remainingAttackerFleet = {};
  Map<String, int> remainingDefenderFleet = {};
  Map<String, int> remainingDefenderDefense = {};
  
  // 급속사격 횟수
  int rapidFireCount = 0;
}
