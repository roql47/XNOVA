import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart';
import '../../../widgets/game_panel.dart';

class FleetMovementTab extends ConsumerStatefulWidget {
  const FleetMovementTab({super.key});

  @override
  ConsumerState<FleetMovementTab> createState() => _FleetMovementTabState();
}

class _FleetMovementTabState extends ConsumerState<FleetMovementTab> {
  final _targetController = TextEditingController();
  final Map<String, int> _selectedFleet = {};

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
    
    // 초기화
    _targetController.clear();
    setState(() => _selectedFleet.clear());
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
      color: AppColors.ogameGreen,
      backgroundColor: AppColors.panelBackground,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 전투 상태
          if (gameState.battleStatus != null) ...[
            if (gameState.battleStatus!.pendingAttack != null)
              _BattleCard(
                emoji: '⚔️',
                title: '공격 진행 중',
                target: gameState.battleStatus!.pendingAttack!.targetCoord,
                fleet: gameState.battleStatus!.pendingAttack!.fleet,
                remainingTime: gameState.battleStatus!.pendingAttack!.remainingTime,
              ),
            if (gameState.battleStatus!.pendingReturn != null)
              _BattleCard(
                emoji: '🔙',
                title: '귀환 중',
                target: '본행성',
                fleet: gameState.battleStatus!.pendingReturn!.fleet,
                remainingTime: gameState.battleStatus!.pendingReturn!.remainingTime,
                loot: gameState.battleStatus!.pendingReturn!.loot,
              ),
            if (gameState.battleStatus!.incomingAttack != null)
              _IncomingAttackCard(
                attackerCoord: gameState.battleStatus!.incomingAttack!.attackerCoord,
                remainingTime: gameState.battleStatus!.incomingAttack!.remainingTime,
              ),
          ],
          
          // 공격 폼
          GamePanel(
            emoji: '🎯',
            title: '함대 출격',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 목표 좌표
                TextField(
                  controller: _targetController,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    labelText: '목표 좌표',
                    hintText: '예: 1:100:5',
                    prefixIcon: const Icon(Icons.location_on, color: AppColors.textSecondary),
                    filled: true,
                    fillColor: AppColors.ogameBlack,
                  ),
                ),
                const SizedBox(height: 16),
                
                // 함선 선택
                if (availableShips.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.ogameBlack,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      '출격 가능한 함선이 없습니다.\n조선소에서 함선을 건조해주세요.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary),
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
                
                const SizedBox(height: 16),
                
                // 공격 버튼
                ElevatedButton.icon(
                  onPressed: availableShips.isNotEmpty ? _attack : null,
                  icon: const Icon(Icons.rocket_launch),
                  label: const Text('출격'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.errorRed,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
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
  final String emoji;
  final String title;
  final String target;
  final Map<String, int> fleet;
  final double remainingTime;
  final Map<String, int>? loot;

  const _BattleCard({
    required this.emoji,
    required this.title,
    required this.target,
    required this.fleet,
    required this.remainingTime,
    this.loot,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GamePanel(
        emoji: emoji,
        title: title,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '목표: $target',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            // 함대 정보
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: fleet.entries.map((e) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.ogameBlack,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${e.key}: ${e.value}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              )).toList(),
            ),
            // 전리품
            if (loot != null && loot!.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Text(
                '전리품:',
                style: TextStyle(
                  color: AppColors.successGreen,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Wrap(
                spacing: 8,
                children: loot!.entries.map((e) => Text(
                  '${_getResourceName(e.key)}: ${e.value}',
                  style: const TextStyle(
                    color: AppColors.successGreen,
                    fontSize: 11,
                  ),
                )).toList(),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.timer, size: 16, color: AppColors.warningOrange),
                const SizedBox(width: 8),
                Text(
                  _formatTime(remainingTime),
                  style: const TextStyle(
                    color: AppColors.warningOrange,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getResourceName(String key) {
    switch (key) {
      case 'metal': return '금속';
      case 'crystal': return '크리스탈';
      case 'deuterium': return '중수소';
      default: return key;
    }
  }

  String _formatTime(double seconds) {
    final duration = Duration(seconds: seconds.toInt());
    final h = duration.inHours;
    final m = duration.inMinutes % 60;
    final s = duration.inSeconds % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}

class _IncomingAttackCard extends StatelessWidget {
  final String attackerCoord;
  final double remainingTime;

  const _IncomingAttackCard({
    required this.attackerCoord,
    required this.remainingTime,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.errorRed.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.errorRed),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.warning, color: AppColors.errorRed),
                const SizedBox(width: 8),
                const Text(
                  '🚨 적 공격 감지!',
                  style: TextStyle(
                    color: AppColors.errorRed,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '공격자: $attackerCoord',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.timer, size: 16, color: AppColors.errorRed),
                const SizedBox(width: 8),
                Text(
                  _formatTime(remainingTime),
                  style: const TextStyle(
                    color: AppColors.errorRed,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(double seconds) {
    final duration = Duration(seconds: seconds.toInt());
    final h = duration.inHours;
    final m = duration.inMinutes % 60;
    final s = duration.inSeconds % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
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
          color: AppColors.ogameBlack,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selectedCount > 0 ? AppColors.ogameGreen : AppColors.panelBorder,
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
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '보유: ${ship.count}',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            // 수량 조절
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove, size: 18),
                  onPressed: selectedCount > 0 
                      ? () => onChanged(selectedCount - 1)
                      : null,
                  color: AppColors.textSecondary,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
                Container(
                  width: 50,
                  alignment: Alignment.center,
                  child: Text(
                    '$selectedCount',
                    style: TextStyle(
                      color: selectedCount > 0 ? AppColors.ogameGreen : AppColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add, size: 18),
                  onPressed: selectedCount < ship.count 
                      ? () => onChanged(selectedCount + 1)
                      : null,
                  color: AppColors.textSecondary,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
                TextButton(
                  onPressed: () => onChanged(ship.count),
                  child: const Text(
                    '전체',
                    style: TextStyle(
                      color: AppColors.ogameGreen,
                      fontSize: 12,
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

