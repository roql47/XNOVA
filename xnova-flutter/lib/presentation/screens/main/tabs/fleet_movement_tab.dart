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

class _FleetMovementTabState extends ConsumerState<FleetMovementTab> {
  late final TextEditingController _targetController;
  final Map<String, int> _selectedFleet = {};

  @override
  void initState() {
    super.initState();
    final navState = ref.read(navigationProvider);
    _targetController = TextEditingController(text: navState.targetCoordinate);
    
    if (navState.targetCoordinate != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(navigationProvider.notifier).clearAttackTarget();
      });
    }
  }

  @override
  void dispose() {
    _targetController.dispose();
    super.dispose();
  }

  void _attack() {
    if (_targetController.text.isEmpty) return;
    if (_selectedFleet.isEmpty || _selectedFleet.values.every((v) => v == 0)) return;
    
    final fleet = Map<String, int>.from(_selectedFleet)
      ..removeWhere((key, value) => value == 0);
    
    ref.read(gameProvider.notifier).attack(_targetController.text, fleet);
    
    _targetController.clear();
    setState(() => _selectedFleet.clear());
  }

  void _showRecallConfirmDialog(BuildContext context, WidgetRef ref) {
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
              final success = await ref.read(gameProvider.notifier).recallFleet();
              if (success && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('함대가 귀환을 시작했습니다.')),
                );
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
          if (gameState.battleStatus != null) ...[
            if (gameState.battleStatus!.pendingAttack != null)
              _BattleCard(
                icon: Icons.flight_takeoff,
                title: '공격 진행 중',
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
                title: '귀환 중',
                target: '본행성',
                fleet: gameState.battleStatus!.pendingReturn!.fleet,
                finishTime: gameState.battleStatus!.pendingReturn!.finishDateTime,
                onComplete: () => ref.read(gameProvider.notifier).processBattle(),
                loot: gameState.battleStatus!.pendingReturn!.loot,
              ),
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
                
                Material(
                  color: availableShips.isNotEmpty ? AppColors.negative : AppColors.surface,
                  borderRadius: BorderRadius.circular(6),
                  child: InkWell(
                    onTap: availableShips.isNotEmpty ? _attack : null,
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.rocket_launch, size: 18, color: Colors.white.withOpacity(availableShips.isNotEmpty ? 1 : 0.5)),
                          const SizedBox(width: 8),
                          Text(
                            '출격',
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
