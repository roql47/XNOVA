import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class DefenseTab extends ConsumerStatefulWidget {
  const DefenseTab({super.key});

  @override
  ConsumerState<DefenseTab> createState() => _DefenseTabState();
}

class _DefenseTabState extends ConsumerState<DefenseTab> {
  final Map<String, int> _quantities = {};

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadDefense(),
      color: AppColors.ogameGreen,
      backgroundColor: AppColors.panelBackground,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 건설 진행 중
          if (gameState.defenseProgress != null)
            _DefenseProgressCard(
              progress: gameState.defenseProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeDefense(),
            ),
          
          // 방어시설 목록
          ...gameState.defense.map((defense) => _DefenseCard(
            defense: defense,
            resources: gameState.resources,
            isBuilding: gameState.defenseProgress != null,
            quantity: _quantities[defense.type] ?? 1,
            onQuantityChanged: (qty) {
              setState(() => _quantities[defense.type] = qty);
            },
            onBuild: () {
              final qty = _quantities[defense.type] ?? 1;
              ref.read(gameProvider.notifier).buildDefense(defense.type, qty);
            },
          )),
        ],
      ),
    );
  }
}

class _DefenseProgressCard extends StatelessWidget {
  final ProgressInfo progress;
  final VoidCallback onComplete;

  const _DefenseProgressCard({
    required this.progress,
    required this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.successGreen.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.successGreen.withOpacity(0.3)),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.shield, color: AppColors.successGreen, size: 20),
                const SizedBox(width: 8),
                const Text(
                  '방어시설 건설 중',
                  style: TextStyle(
                    color: AppColors.successGreen,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${progress.name} x${progress.quantity ?? 1}',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.timer, size: 16, color: AppColors.warningOrange),
                const SizedBox(width: 8),
                if (progress.finishDateTime != null)
                  ProgressTimer(
                    finishTime: progress.finishDateTime!,
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

class _DefenseCard extends StatelessWidget {
  final DefenseInfo defense;
  final GameResources resources;
  final bool isBuilding;
  final int quantity;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onBuild;

  const _DefenseCard({
    required this.defense,
    required this.resources,
    required this.isBuilding,
    required this.quantity,
    required this.onQuantityChanged,
    required this.onBuild,
  });

  bool get canAfford {
    return resources.metal >= defense.cost.metal * quantity &&
           resources.crystal >= defense.cost.crystal * quantity &&
           resources.deuterium >= defense.cost.deuterium * quantity;
  }

  bool get isMaxed {
    if (defense.maxCount == null) return false;
    return defense.count >= defense.maxCount!;
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = !defense.requirementsMet || isMaxed;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Opacity(
        opacity: isDisabled ? 0.6 : 1.0,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.panelBackground,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isDisabled ? AppColors.textDisabled : AppColors.panelBorder,
            ),
          ),
          child: Column(
            children: [
              // 헤더
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: const BoxDecoration(
                  color: AppColors.panelHeader,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(7),
                    topRight: Radius.circular(7),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        defense.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.successGreen.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        defense.maxCount != null 
                            ? '${defense.count}/${defense.maxCount}'
                            : '보유: ${defense.count}',
                        style: const TextStyle(
                          color: AppColors.successGreen,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // 컨텐츠
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 스탯
                    Wrap(
                      spacing: 16,
                      runSpacing: 4,
                      children: [
                        _StatChip(icon: Icons.gps_fixed, label: '공격', value: defense.stats.attack),
                        _StatChip(icon: Icons.shield, label: '방어', value: defense.stats.shield),
                        _StatChip(icon: Icons.favorite, label: '내구', value: defense.stats.hull),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // 요구사항 미충족 시
                    if (!defense.requirementsMet && defense.missingRequirements.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.errorRed.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.lock, size: 14, color: AppColors.errorRed),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                defense.missingRequirements.join(', '),
                                style: const TextStyle(
                                  color: AppColors.errorRed,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (isMaxed) ...[
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.warningOrange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle, size: 14, color: AppColors.warningOrange),
                            SizedBox(width: 8),
                            Text(
                              '최대 보유 수량에 도달했습니다',
                              style: TextStyle(
                                color: AppColors.warningOrange,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '건설 비용 (x$quantity)',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 4),
                              CostDisplay(
                                metal: defense.cost.metal * quantity,
                                crystal: defense.cost.crystal * quantity,
                                deuterium: defense.cost.deuterium * quantity,
                                currentMetal: resources.metal,
                                currentCrystal: resources.crystal,
                                currentDeuterium: resources.deuterium,
                              ),
                            ],
                          ),
                        ),
                        // 수량 조절
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: quantity > 1 
                                  ? () => onQuantityChanged(quantity - 1)
                                  : null,
                              color: AppColors.textSecondary,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                            Container(
                              width: 40,
                              alignment: Alignment.center,
                              child: Text(
                                '$quantity',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: () => onQuantityChanged(quantity + 1),
                              color: AppColors.textSecondary,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 8),
                        GameButton(
                          text: '건설',
                          onPressed: (!isBuilding && canAfford && defense.requirementsMet && !isMaxed) 
                              ? onBuild 
                              : null,
                          icon: Icons.build,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final int value;

  const _StatChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.textSecondary),
        const SizedBox(width: 2),
        Text(
          '$value',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

