import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_constants.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart';
import '../../../widgets/game_panel.dart';

class FleetMovementTab extends ConsumerStatefulWidget {
  const FleetMovementTab({super.key});

  @override
  ConsumerState<FleetMovementTab> createState() => _FleetMovementTabState();
}

// 미션 타입
enum MissionType { attack, transport, deploy, colony }

class _FleetMovementTabState extends ConsumerState<FleetMovementTab> {
  late final TextEditingController _targetController;
  late final TextEditingController _metalController;
  late final TextEditingController _crystalController;
  late final TextEditingController _deuteriumController;
  
  final Map<String, int> _selectedFleet = {};
  String? _targetCoord;
  MissionType _missionType = MissionType.attack;

  @override
  void initState() {
    super.initState();
    final navState = ref.read(navigationProvider);
    _targetController = TextEditingController(text: navState.targetCoordinate);
    _targetCoord = navState.targetCoordinate;
    
    // 미션 타입 설정
    if (navState.missionType == 'transport') {
      _missionType = MissionType.transport;
    } else if (navState.missionType == 'deploy') {
      _missionType = MissionType.deploy;
    } else if (navState.missionType == 'colony') {
      _missionType = MissionType.colony;
      // 식민 미션은 식민선 1대만 자동 선택
      _selectedFleet['colonyShip'] = 1;
    } else {
      _missionType = MissionType.attack;
    }
    
    _metalController = TextEditingController(text: '0');
    _crystalController = TextEditingController(text: '0');
    _deuteriumController = TextEditingController(text: '0');
    
    _targetController.addListener(_onTargetChanged);
    
    if (navState.targetCoordinate != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(navigationProvider.notifier).clearAttackTarget();
      });
    }
  }

  void _onTargetChanged() {
    setState(() {
      _targetCoord = _targetController.text;
    });
  }

  // 좌표 형식 유효성 검사
  bool _isValidCoordinate(String coord) {
    final parts = coord.split(':');
    if (parts.length != 3) return false;
    for (final part in parts) {
      if (int.tryParse(part) == null) return false;
    }
    return true;
  }

  // 출격 정보 계산
  Map<String, dynamic>? _calculateMissionInfo() {
    final gameState = ref.read(gameProvider);
    final myCoord = gameState.coordinate;
    
    if (myCoord == null || _targetCoord == null || _targetCoord!.isEmpty) return null;
    if (!_isValidCoordinate(_targetCoord!)) return null;
    
    final fleet = Map<String, int>.from(_selectedFleet)
      ..removeWhere((key, value) => value == 0);
    if (fleet.isEmpty) return null;

    try {
      final distance = GameConstants.calculateDistance(myCoord, _targetCoord!);
      final minSpeed = GameConstants.getMinFleetSpeed(fleet);
      final travelTime = GameConstants.calculateTravelTime(distance, minSpeed);
      final fuelConsumption = GameConstants.calculateFleetFuelConsumption(fleet, distance, travelTime);

      return {
        'distance': distance,
        'speed': minSpeed,
        'travelTime': travelTime,
        'fuel': fuelConsumption,
      };
    } catch (e) {
      return null;
    }
  }

  String _formatTime(double seconds) {
    if (seconds <= 0) return '즉시';
    final totalSeconds = seconds.toInt();
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final secs = totalSeconds % 60;
    if (hours > 0) {
      return '${hours}시간 ${minutes}분 ${secs}초';
    } else if (minutes > 0) {
      return '${minutes}분 ${secs}초';
    }
    return '${secs}초';
  }

  String _formatNumber(int num) {
    if (num >= 1000000) return '${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return '${(num / 1000).toStringAsFixed(1)}K';
    return num.toString();
  }

  @override
  void dispose() {
    _targetController.removeListener(_onTargetChanged);
    _targetController.dispose();
    _metalController.dispose();
    _crystalController.dispose();
    _deuteriumController.dispose();
    super.dispose();
  }

  // 적재 가능량 계산
  int _calculateAvailableCapacity() {
    final fleet = Map<String, int>.from(_selectedFleet)
      ..removeWhere((key, value) => value == 0);
    
    if (fleet.isEmpty) return 0;
    
    int totalCapacity = 0;
    for (final entry in fleet.entries) {
      final cargo = GameConstants.fleetCargo[entry.key] ?? 0;
      totalCapacity += cargo * entry.value;
    }

    // 연료 소비량 차감
    final missionInfo = _calculateMissionInfo();
    if (missionInfo != null) {
      final fuelConsumption = missionInfo['fuel'] as int;
      return totalCapacity - fuelConsumption;
    }
    
    return totalCapacity;
  }

  // 현재 적재 자원량
  int _getCurrentLoadedResources() {
    final metal = int.tryParse(_metalController.text) ?? 0;
    final crystal = int.tryParse(_crystalController.text) ?? 0;
    final deuterium = int.tryParse(_deuteriumController.text) ?? 0;
    return metal + crystal + deuterium;
  }

  Future<void> _executeMission() async {
    if (_targetController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('목표 좌표를 입력해주세요.')),
      );
      return;
    }
    if (_selectedFleet.isEmpty || _selectedFleet.values.every((v) => v == 0)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('출격할 함선을 선택해주세요.')),
      );
      return;
    }
    
    final fleet = Map<String, int>.from(_selectedFleet)
      ..removeWhere((key, value) => value == 0);
    final targetCoord = _targetController.text;

    bool success = false;
    String missionName = '';

    switch (_missionType) {
      case MissionType.attack:
        missionName = '공격';
        try {
          await ref.read(gameProvider.notifier).attack(targetCoord, fleet);
          success = true;
        } catch (e) {
          success = false;
        }
        break;
      case MissionType.transport:
        missionName = '수송';
        final resources = {
          'metal': int.tryParse(_metalController.text) ?? 0,
          'crystal': int.tryParse(_crystalController.text) ?? 0,
          'deuterium': int.tryParse(_deuteriumController.text) ?? 0,
        };
        success = await ref.read(gameProvider.notifier).transport(targetCoord, fleet, resources);
        break;
      case MissionType.deploy:
        missionName = '배치';
        final resources = {
          'metal': int.tryParse(_metalController.text) ?? 0,
          'crystal': int.tryParse(_crystalController.text) ?? 0,
          'deuterium': int.tryParse(_deuteriumController.text) ?? 0,
        };
        success = await ref.read(gameProvider.notifier).deploy(targetCoord, fleet, resources);
        break;
      case MissionType.colony:
        missionName = '식민';
        // 식민 미션은 식민선이 반드시 필요
        if ((fleet['colonyShip'] ?? 0) < 1) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('식민 미션에는 식민선이 필요합니다.')),
          );
          return;
        }
        success = await ref.read(gameProvider.notifier).colonize(targetCoord, fleet);
        break;
    }

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$targetCoord로 $missionName 함대가 출격했습니다!'),
            backgroundColor: AppColors.positive,
          ),
        );
        
        _targetController.clear();
        _metalController.text = '0';
        _crystalController.text = '0';
        _deuteriumController.text = '0';
        setState(() {
          _selectedFleet.clear();
          _missionType = MissionType.attack;
        });
      } else {
        final error = ref.read(gameProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? '$missionName에 실패했습니다.'),
            backgroundColor: AppColors.negative,
          ),
        );
      }
    }
  }

  void _attack() {
    _executeMission();
  }

  void _showRecallConfirmDialog(BuildContext context, WidgetRef ref) {
    _showRecallConfirmDialogForMission(context, ref, null);
  }

  void _showRecallConfirmDialogForMission(BuildContext context, WidgetRef ref, String? missionId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber, color: AppColors.warning, size: 20),
            SizedBox(width: 8),
            Text('함대 귀환', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
          ],
        ),
        content: const Text(
          '함대를 귀환시키시겠습니까?\n\n귀환 시간은 현재까지 진행된 비행 시간과 동일합니다.\n약탈 자원 없이 귀환합니다.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ref.read(gameProvider.notifier).recallFleet(missionId: missionId);
              if (context.mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('함대가 귀환을 시작했습니다.'),
                      backgroundColor: AppColors.positive,
                    ),
                  );
                } else {
                  final error = ref.read(gameProvider).error;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(error ?? '함대 귀환에 실패했습니다.'),
                      backgroundColor: AppColors.negative,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.warning,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('귀환'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);
    final availableShips = gameState.fleet.where((f) => f.count > 0).toList();

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(gameProvider.notifier).loadFleet();
        await ref.read(gameProvider.notifier).loadBattleStatus();
      },
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 함대 슬롯 정보 표시
          if (gameState.battleStatus != null) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.panelBorder),
              ),
              child: Row(
                children: [
                  Icon(Icons.rocket, size: 16, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text(
                    '함대 슬롯',
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
                  ),
                  const Spacer(),
                  Text(
                    '${gameState.battleStatus!.fleetSlots.used} / ${gameState.battleStatus!.fleetSlots.max}',
                    style: TextStyle(
                      color: gameState.battleStatus!.fleetSlots.used >= gameState.battleStatus!.fleetSlots.max
                          ? AppColors.negative
                          : AppColors.positive,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            // 다중 함대 미션 표시 (새로운 fleetMissions 배열)
            ...gameState.battleStatus!.fleetMissions.map((mission) => _FleetMissionCard(
              mission: mission,
              onComplete: () => ref.read(gameProvider.notifier).processBattle(),
              onRecall: mission.phase == 'outbound' 
                  ? () => _showRecallConfirmDialogForMission(context, ref, mission.missionId)
                  : null,
            )),

            // 하위 호환성: 기존 pendingAttack/pendingReturn (fleetMissions가 비어있을 때만)
            if (gameState.battleStatus!.fleetMissions.isEmpty) ...[
              if (gameState.battleStatus!.pendingAttack != null)
                _BattleCard(
                  icon: gameState.battleStatus!.pendingAttack!.missionType == 'transport'
                      ? Icons.local_shipping
                      : gameState.battleStatus!.pendingAttack!.missionType == 'deploy'
                          ? Icons.home_work
                          : gameState.battleStatus!.pendingAttack!.missionType == 'recycle'
                              ? Icons.blur_on
                              : gameState.battleStatus!.pendingAttack!.missionType == 'colony'
                                  ? Icons.rocket_launch
                                  : Icons.flight_takeoff,
                  title: gameState.battleStatus!.pendingAttack!.missionTitle,
                  target: gameState.battleStatus!.pendingAttack!.targetCoord,
                  fleet: gameState.battleStatus!.pendingAttack!.fleet,
                  finishTime: gameState.battleStatus!.pendingAttack!.finishDateTime,
                  onComplete: () => ref.read(gameProvider.notifier).processBattle(),
                  showRecallButton: !gameState.battleStatus!.pendingAttack!.battleCompleted,
                  onRecall: () => _showRecallConfirmDialog(context, ref),
                ),
              if (gameState.battleStatus!.pendingReturn != null)
                _BattleCard(
                  icon: Icons.flight_land,
                  title: gameState.battleStatus!.pendingReturn!.returnTitle,
                  target: '본행성',
                  fleet: gameState.battleStatus!.pendingReturn!.fleet,
                  finishTime: gameState.battleStatus!.pendingReturn!.finishDateTime,
                  onComplete: () => ref.read(gameProvider.notifier).processBattle(),
                  loot: gameState.battleStatus!.pendingReturn!.loot,
                ),
            ],

            if (gameState.battleStatus!.incomingAttack != null)
              _IncomingAttackCard(
                attackerCoord: gameState.battleStatus!.incomingAttack!.attackerCoord,
                finishTime: gameState.battleStatus!.incomingAttack!.finishDateTime,
                onComplete: () => ref.read(gameProvider.notifier).processBattle(),
              ),
          ],
          
          GamePanel(
            icon: Icons.gps_fixed,
            title: '함대 출격',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _targetController,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: '목표 좌표',
                    labelStyle: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    hintText: '예: 1:100:5',
                    hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.5)),
                    prefixIcon: Icon(Icons.location_on, color: AppColors.textMuted, size: 18),
                    filled: true,
                    fillColor: AppColors.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: AppColors.panelBorder),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: AppColors.panelBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide(color: AppColors.accent),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                ),
                const SizedBox(height: 14),
                
                if (availableShips.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      '출격 가능한 함선이 없습니다.\n조선소에서 함선을 건조하세요.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  )
                else
                  ...availableShips.map((ship) => _ShipSelector(
                    ship: ship,
                    selectedCount: _selectedFleet[ship.type] ?? 0,
                    onChanged: (count) {
                      setState(() => _selectedFleet[ship.type] = count);
                    },
                  )),
                
                const SizedBox(height: 14),

                // 미션 타입 선택
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.panelBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '미션 선택',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _MissionButton(
                              icon: Icons.gps_fixed,
                              label: '공격',
                              isSelected: _missionType == MissionType.attack,
                              color: AppColors.negative,
                              onTap: () => setState(() => _missionType = MissionType.attack),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _MissionButton(
                              icon: Icons.local_shipping,
                              label: '수송',
                              isSelected: _missionType == MissionType.transport,
                              color: AppColors.accent,
                              onTap: () => setState(() => _missionType = MissionType.transport),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _MissionButton(
                              icon: Icons.rocket_launch,
                              label: '식민',
                              isSelected: _missionType == MissionType.colony,
                              color: AppColors.positive,
                              onTap: () {
                                setState(() {
                                  _missionType = MissionType.colony;
                                  // 식민 미션 선택 시 식민선 1대 자동 선택
                                  _selectedFleet.clear();
                                  _selectedFleet['colonyShip'] = 1;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _missionType == MissionType.attack
                            ? '적 행성을 공격하여 자원을 약탈합니다.'
                            : _missionType == MissionType.transport
                                ? '자원을 목표 행성에 전달하고, 함대만 귀환합니다.'
                                : _missionType == MissionType.colony
                                    ? '빈 좌표에 새로운 식민지를 건설합니다. (식민선 1대 소모)'
                                    : '함대와 자원을 모두 목표 행성에 배치합니다. (귀환 없음)',
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // 자원 적재 (수송/배치 미션일 때만 표시, 식민 미션은 제외)
                if (_missionType == MissionType.transport || _missionType == MissionType.deploy) ...[
                  const SizedBox(height: 14),
                  _ResourceLoadingPanel(
                    metalController: _metalController,
                    crystalController: _crystalController,
                    deuteriumController: _deuteriumController,
                    availableCapacity: _calculateAvailableCapacity(),
                    currentLoaded: _getCurrentLoadedResources(),
                    currentMetal: gameState.resources.metal.toInt(),
                    currentCrystal: gameState.resources.crystal.toInt(),
                    currentDeuterium: gameState.resources.deuterium.toInt(),
                    onChanged: () => setState(() {}),
                  ),
                ],
                
                const SizedBox(height: 14),
                
                // 예상 출격 정보 패널
                Builder(
                  builder: (context) {
                    final missionInfo = _calculateMissionInfo();
                    final hasEnoughFuel = missionInfo != null && 
                        gameState.resources.deuterium >= missionInfo['fuel'];
                    
                    if (missionInfo != null) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: hasEnoughFuel 
                              ? AppColors.accent.withOpacity(0.08) 
                              : AppColors.negative.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: hasEnoughFuel 
                                ? AppColors.accent.withOpacity(0.3) 
                                : AppColors.negative.withOpacity(0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.info_outline, 
                                  size: 14, 
                                  color: hasEnoughFuel ? AppColors.accent : AppColors.negative,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '출격 예상 정보',
                                  style: TextStyle(
                                    color: hasEnoughFuel ? AppColors.accent : AppColors.negative,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: _MissionInfoItem(
                                    icon: Icons.straighten,
                                    label: '거리',
                                    value: _formatNumber(missionInfo['distance']),
                                  ),
                                ),
                                Expanded(
                                  child: _MissionInfoItem(
                                    icon: Icons.speed,
                                    label: '속도',
                                    value: _formatNumber(missionInfo['speed']),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _MissionInfoItem(
                                    icon: Icons.schedule,
                                    label: '편도 시간',
                                    value: _formatTime(missionInfo['travelTime']),
                                  ),
                                ),
                                Expanded(
                                  child: _MissionInfoItem(
                                    icon: Icons.local_gas_station,
                                    label: '듀테륨 소비',
                                    value: _formatNumber(missionInfo['fuel']),
                                    valueColor: hasEnoughFuel 
                                        ? AppColors.deuteriumColor 
                                        : AppColors.negative,
                                    isHighlighted: true,
                                  ),
                                ),
                              ],
                            ),
                            if (!hasEnoughFuel) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.negative.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.warning_amber, size: 14, color: AppColors.negative),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        '듀테륨이 부족합니다! (보유: ${_formatNumber(gameState.resources.deuterium.toInt())})',
                                        style: const TextStyle(
                                          color: AppColors.negative,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                
                Material(
                  color: availableShips.isNotEmpty 
                      ? (_missionType == MissionType.attack 
                          ? AppColors.negative 
                          : _missionType == MissionType.transport 
                              ? AppColors.accent 
                              : AppColors.positive)
                      : AppColors.surface,
                  borderRadius: BorderRadius.circular(6),
                  child: InkWell(
                    onTap: availableShips.isNotEmpty ? _executeMission : null,
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _missionType == MissionType.attack 
                                ? Icons.gps_fixed 
                                : _missionType == MissionType.transport 
                                    ? Icons.local_shipping 
                                    : _missionType == MissionType.colony
                                        ? Icons.rocket_launch
                                        : Icons.home_work,
                            size: 18, 
                            color: Colors.white.withOpacity(availableShips.isNotEmpty ? 1 : 0.5),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _missionType == MissionType.attack 
                                ? '공격' 
                                : _missionType == MissionType.transport 
                                    ? '수송' 
                                    : _missionType == MissionType.colony
                                        ? '식민'
                                        : '배치',
                            style: TextStyle(
                              color: Colors.white.withOpacity(availableShips.isNotEmpty ? 1 : 0.5),
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BattleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String target;
  final Map<String, int> fleet;
  final DateTime finishTime;
  final VoidCallback onComplete;
  final Map<String, int>? loot;
  final bool showRecallButton;
  final VoidCallback? onRecall;

  const _BattleCard({
    required this.icon,
    required this.title,
    required this.target,
    required this.fleet,
    required this.finishTime,
    required this.onComplete,
    this.loot,
    this.showRecallButton = false,
    this.onRecall,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.panelBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.panelBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: AppColors.accent),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              '목표: $target',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: fleet.entries.where((e) => e.value > 0).map((e) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${GameConstants.getName(e.key)}: ${e.value}',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 10,
                  ),
                ),
              )).toList(),
            ),
            if (loot != null && loot!.values.any((v) => v > 0)) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.positive.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.positive.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '약탈한 자원:',
                      style: TextStyle(
                        color: AppColors.positive,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _LootItem(label: '메탈', value: loot!['metal'] ?? 0, color: AppColors.metalColor),
                        const SizedBox(width: 12),
                        _LootItem(label: '크리스탈', value: loot!['crystal'] ?? 0, color: AppColors.crystalColor),
                        const SizedBox(width: 12),
                        _LootItem(label: '중수소', value: loot!['deuterium'] ?? 0, color: AppColors.deuteriumColor),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Expanded(
                  child: ProgressTimer(
                    finishTime: finishTime,
                    onComplete: onComplete,
                  ),
                ),
                if (showRecallButton && onRecall != null)
                  Material(
                    color: AppColors.warning,
                    borderRadius: BorderRadius.circular(4),
                    child: InkWell(
                      onTap: onRecall,
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.u_turn_left, size: 14, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              '귀환',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// 다중 함대 미션 카드
class _FleetMissionCard extends StatelessWidget {
  final FleetMission mission;
  final VoidCallback onComplete;
  final VoidCallback? onRecall;

  const _FleetMissionCard({
    required this.mission,
    required this.onComplete,
    this.onRecall,
  });

  IconData get _missionIcon {
    if (mission.isReturning) return Icons.flight_land;
    switch (mission.missionType) {
      case 'transport':
        return Icons.local_shipping;
      case 'deploy':
        return Icons.home_work;
      case 'recycle':
        return Icons.blur_on;
      case 'colony':
        return Icons.rocket_launch;
      default:
        return Icons.flight_takeoff;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: mission.isReturning 
              ? AppColors.positive.withOpacity(0.05)
              : AppColors.panelBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: mission.isReturning 
                ? AppColors.positive.withOpacity(0.3)
                : AppColors.panelBorder,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_missionIcon, size: 16, color: AppColors.accent),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    mission.missionTitle,
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: mission.isReturning 
                        ? AppColors.positive.withOpacity(0.1)
                        : AppColors.accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    mission.isReturning ? '귀환' : '출격',
                    style: TextStyle(
                      color: mission.isReturning ? AppColors.positive : AppColors.accent,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              '목표: ${mission.targetCoord}',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
            if (mission.originCoord != null) ...[
              const SizedBox(height: 4),
              Text(
                '출발: ${mission.originCoord}',
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: mission.fleet.entries.where((e) => e.value > 0).map((e) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${GameConstants.getName(e.key)}: ${e.value}',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 10,
                  ),
                ),
              )).toList(),
            ),
            if (mission.loot != null && mission.loot!.values.any((v) => v > 0)) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.positive.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.positive.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '획득 자원:',
                      style: TextStyle(
                        color: AppColors.positive,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _LootItem(label: '메탈', value: mission.loot!['metal'] ?? 0, color: AppColors.metalColor),
                        const SizedBox(width: 12),
                        _LootItem(label: '크리스탈', value: mission.loot!['crystal'] ?? 0, color: AppColors.crystalColor),
                        const SizedBox(width: 12),
                        _LootItem(label: '중수소', value: mission.loot!['deuterium'] ?? 0, color: AppColors.deuteriumColor),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Expanded(
                  child: ProgressTimer(
                    finishTime: mission.finishDateTime,
                    onComplete: onComplete,
                  ),
                ),
                if (onRecall != null)
                  Material(
                    color: AppColors.warning,
                    borderRadius: BorderRadius.circular(4),
                    child: InkWell(
                      onTap: onRecall,
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.u_turn_left, size: 14, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              '귀환',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LootItem extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _LootItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 9),
        ),
        Text(
          _formatNumber(value),
          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  String _formatNumber(int num) {
    if (num >= 1000000) {
      return '${(num / 1000000).toStringAsFixed(1)}M';
    } else if (num >= 1000) {
      return '${(num / 1000).toStringAsFixed(1)}K';
    }
    return num.toString();
  }
}

class _IncomingAttackCard extends StatelessWidget {
  final String attackerCoord;
  final DateTime finishTime;
  final VoidCallback onComplete;

  const _IncomingAttackCard({
    required this.attackerCoord,
    required this.finishTime,
    required this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.negative.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.negative.withOpacity(0.3)),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning_amber, color: AppColors.negative, size: 18),
                const SizedBox(width: 8),
                Text(
                  '적 공격 감지',
                  style: TextStyle(
                    color: AppColors.negative,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              '공격자: $attackerCoord',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: AppColors.negative),
                const SizedBox(width: 6),
                ProgressTimer(
                  finishTime: finishTime,
                  onComplete: onComplete,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ShipSelector extends StatelessWidget {
  final FleetInfo ship;
  final int selectedCount;
  final ValueChanged<int> onChanged;

  const _ShipSelector({
    required this.ship,
    required this.selectedCount,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: selectedCount > 0 ? AppColors.accent.withOpacity(0.4) : AppColors.panelBorder,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ship.name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    '보유: ${ship.count}',
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove, size: 16),
                  onPressed: selectedCount > 0 
                      ? () => onChanged(selectedCount - 1)
                      : null,
                  color: AppColors.textMuted,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
                Container(
                  width: 40,
                  alignment: Alignment.center,
                  child: Text(
                    '$selectedCount',
                    style: TextStyle(
                      color: selectedCount > 0 ? AppColors.accent : AppColors.textMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add, size: 16),
                  onPressed: selectedCount < ship.count 
                      ? () => onChanged(selectedCount + 1)
                      : null,
                  color: AppColors.textMuted,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
                GestureDetector(
                  onTap: () => onChanged(ship.count),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Text(
                      '전체',
                      style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// 출격 정보 표시 아이템
class _MissionInfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  final bool isHighlighted;

  const _MissionInfoItem({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
    this.isHighlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 10,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  color: valueColor ?? AppColors.textPrimary,
                  fontSize: isHighlighted ? 13 : 12,
                  fontWeight: isHighlighted ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// 미션 선택 버튼
class _MissionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;

  const _MissionButton({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? color : AppColors.panelBackground,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? color : AppColors.panelBorder,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? Colors.white : AppColors.textMuted,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textMuted,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// 자원 적재 패널
class _ResourceLoadingPanel extends StatelessWidget {
  final TextEditingController metalController;
  final TextEditingController crystalController;
  final TextEditingController deuteriumController;
  final int availableCapacity;
  final int currentLoaded;
  final int currentMetal;
  final int currentCrystal;
  final int currentDeuterium;
  final VoidCallback onChanged;

  const _ResourceLoadingPanel({
    required this.metalController,
    required this.crystalController,
    required this.deuteriumController,
    required this.availableCapacity,
    required this.currentLoaded,
    required this.currentMetal,
    required this.currentCrystal,
    required this.currentDeuterium,
    required this.onChanged,
  });

  String _formatNumber(int num) {
    if (num >= 1000000) return '${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return '${(num / 1000).toStringAsFixed(1)}K';
    return num.toString();
  }

  @override
  Widget build(BuildContext context) {
    final remainingCapacity = availableCapacity - currentLoaded;
    final isOverloaded = currentLoaded > availableCapacity;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isOverloaded ? AppColors.negative : AppColors.panelBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '자원 적재',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isOverloaded 
                      ? AppColors.negative.withOpacity(0.1) 
                      : AppColors.accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${_formatNumber(currentLoaded)} / ${_formatNumber(availableCapacity)}',
                  style: TextStyle(
                    color: isOverloaded ? AppColors.negative : AppColors.accent,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // 메탈
          _ResourceInputRow(
            label: '메탈',
            color: AppColors.metalColor,
            controller: metalController,
            available: currentMetal,
            remainingCapacity: remainingCapacity,
            onChanged: onChanged,
          ),
          const SizedBox(height: 8),
          
          // 크리스탈
          _ResourceInputRow(
            label: '크리스탈',
            color: AppColors.crystalColor,
            controller: crystalController,
            available: currentCrystal,
            remainingCapacity: remainingCapacity,
            onChanged: onChanged,
          ),
          const SizedBox(height: 8),
          
          // 듀테륨
          _ResourceInputRow(
            label: '듀테륨',
            color: AppColors.deuteriumColor,
            controller: deuteriumController,
            available: currentDeuterium,
            remainingCapacity: remainingCapacity,
            onChanged: onChanged,
          ),
          
          if (isOverloaded) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.negative.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber, size: 14, color: AppColors.negative),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '적재 공간 초과! ${_formatNumber(currentLoaded - availableCapacity)} 줄여주세요.',
                      style: const TextStyle(
                        color: AppColors.negative,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// 자원 입력 행
class _ResourceInputRow extends StatelessWidget {
  final String label;
  final Color color;
  final TextEditingController controller;
  final int available;
  final int remainingCapacity; // 남은 적재 용량
  final VoidCallback onChanged;

  const _ResourceInputRow({
    required this.label,
    required this.color,
    required this.controller,
    required this.available,
    required this.remainingCapacity,
    required this.onChanged,
  });

  String _formatNumber(int num) {
    if (num >= 1000000) return '${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return '${(num / 1000).toStringAsFixed(1)}K';
    return num.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 60,
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
            ),
          ),
        ),
        Expanded(
          child: Container(
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.panelBackground,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 8),
                isDense: true,
              ),
              onChanged: (_) => onChanged(),
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () {
            // 현재 입력된 값
            final currentValue = int.tryParse(controller.text) ?? 0;
            // 이 자원을 제외한 남은 용량 + 현재 입력값
            final maxLoadable = remainingCapacity + currentValue;
            // 보유량과 적재 가능량 중 작은 값
            final toLoad = available < maxLoadable ? available : maxLoadable;
            controller.text = toLoad > 0 ? toLoad.toString() : '0';
            onChanged();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '전체',
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          '(${_formatNumber(available)})',
          style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}
