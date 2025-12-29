import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class FleetTab extends ConsumerStatefulWidget {
  const FleetTab({super.key});

  @override
  ConsumerState<FleetTab> createState() => _FleetTabState();
}

class _FleetTabState extends ConsumerState<FleetTab> {
  final Map<String, int> _quantities = {};

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadFleet(),
      color: AppColors.ogameGreen,
      backgroundColor: AppColors.panelBackground,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 조선소 레벨
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.panelBackground,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.rocket, color: AppColors.warningOrange),
                const SizedBox(width: 8),
                Text(
                  '조선소 레벨: ${gameState.shipyardLevel}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          
          // 건조 진행 중
          if (gameState.fleetProgress != null)
            _FleetProgressCard(
              progress: gameState.fleetProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeFleet(),
            ),
          
          // 함선 목록
          ...gameState.fleet.map((ship) => _ShipCard(
            ship: ship,
            resources: gameState.resources,
            isBuilding: gameState.fleetProgress != null,
            quantity: _quantities[ship.type] ?? 1,
            onQuantityChanged: (qty) {
              setState(() => _quantities[ship.type] = qty);
            },
            onBuild: () {
              final qty = _quantities[ship.type] ?? 1;
              ref.read(gameProvider.notifier).buildFleet(ship.type, qty);
            },
          )),
        ],
      ),
    );
  }
}

class _FleetProgressCard extends StatelessWidget {
  final ProgressInfo progress;
  final VoidCallback onComplete;

  const _FleetProgressCard({
    required this.progress,
    required this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.warningOrange.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.warningOrange.withOpacity(0.3)),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.rocket_launch, color: AppColors.warningOrange, size: 20),
                const SizedBox(width: 8),
                const Text(
                  '함선 건조 중',
                  style: TextStyle(
                    color: AppColors.warningOrange,
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

class _ShipCard extends StatelessWidget {
  final FleetInfo ship;
  final GameResources resources;
  final bool isBuilding;
  final int quantity;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onBuild;

  const _ShipCard({
    required this.ship,
    required this.resources,
    required this.isBuilding,
    required this.quantity,
    required this.onQuantityChanged,
    required this.onBuild,
  });

  bool get canAfford {
    return resources.metal >= ship.cost.metal * quantity &&
           resources.crystal >= ship.cost.crystal * quantity &&
           resources.deuterium >= ship.cost.deuterium * quantity;
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = !ship.requirementsMet;

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
                        ship.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.warningOrange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '보유: ${ship.count}',
                        style: const TextStyle(
                          color: AppColors.warningOrange,
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
                        _StatChip(icon: Icons.gps_fixed, label: '공격', value: ship.stats.attack),
                        _StatChip(icon: Icons.shield, label: '방어', value: ship.stats.shield),
                        _StatChip(icon: Icons.favorite, label: '내구', value: ship.stats.hull),
                        _StatChip(icon: Icons.speed, label: '속도', value: ship.stats.speed),
                        _StatChip(icon: Icons.inventory_2, label: '적재', value: ship.stats.cargo),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // 요구사항 미충족 시
                    if (isDisabled && ship.missingRequirements.isNotEmpty) ...[
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
                                ship.missingRequirements.join(', '),
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
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '건조 비용 (x$quantity)',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 4),
                              CostDisplay(
                                metal: ship.cost.metal * quantity,
                                crystal: ship.cost.crystal * quantity,
                                deuterium: ship.cost.deuterium * quantity,
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
                          text: '건조',
                          onPressed: (!isBuilding && canAfford && ship.requirementsMet) 
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

