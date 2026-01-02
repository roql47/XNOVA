import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_names.dart';
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
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          if (gameState.defenseProgress != null)
            _DefenseProgressCard(
              progress: gameState.defenseProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeDefense(),
            ),
          
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
    final koreanName = getKoreanName(progress.name);
    final imagePath = getImagePath(progress.name);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.accent.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.accent.withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            // 원형 이미지
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.accent, width: 2),
              ),
              child: ClipOval(
                child: imagePath != null
                    ? Image.asset(
                        imagePath,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.surface,
                          child: const Icon(Icons.shield, color: AppColors.accent, size: 24),
                        ),
                      )
                    : Container(
                        color: AppColors.surface,
                        child: const Icon(Icons.shield, color: AppColors.accent, size: 24),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            // 정보
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '건설 중',
                          style: TextStyle(
                            color: AppColors.accent,
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.positive.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'x${progress.quantity ?? 1}',
                          style: const TextStyle(
                            color: AppColors.positive,
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    koreanName,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 12, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      if (progress.finishDateTime != null)
                        Expanded(
                          child: ProgressTimer(
                            finishTime: progress.finishDateTime!,
                            onComplete: onComplete,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
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

  String? _getDefenseImagePath(String type) {
    const defenseImages = {
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
    return defenseImages[type];
  }

  String _formatBuildTime(double seconds) {
    if (seconds <= 0) return '즉시';
    final totalSeconds = seconds.toInt();
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final secs = totalSeconds % 60;
    if (hours > 0) {
      return '${hours}시간 ${minutes}분 ${secs}초';
    } else if (minutes > 0) {
      return '${minutes}분 ${secs}초';
    } else {
      return '${secs}초';
    }
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
              color: isDisabled ? AppColors.textMuted : AppColors.panelBorder,
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        defense.maxCount != null 
                            ? '${defense.count}/${defense.maxCount}'
                            : '보유: ${defense.count}',
                        style: const TextStyle(
                          color: AppColors.accent,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 방어시설 이미지
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _getDefenseImagePath(defense.type) != null
                              ? Image.asset(
                                  _getDefenseImagePath(defense.type)!,
                                  width: 100,
                                  height: 100,
                                  cacheWidth: 200,
                                  cacheHeight: 200,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      Container(
                                        width: 100,
                                        height: 100,
                                        color: AppColors.surface,
                                        child: const Icon(Icons.shield, size: 40, color: AppColors.textMuted),
                                      ),
                                )
                              : Container(
                                  width: 100,
                                  height: 100,
                                  color: AppColors.surface,
                                  child: const Icon(Icons.shield, size: 40, color: AppColors.textMuted),
                                ),
                        ),
                        const SizedBox(width: 14),
                        // 스탯
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: 10,
                                runSpacing: 4,
                                children: [
                                  _StatChip(icon: Icons.gps_fixed, value: defense.stats.attack),
                                  _StatChip(icon: Icons.shield, value: defense.stats.shield),
                                  _StatChip(icon: Icons.favorite, value: defense.stats.hull),
                                ],
                              ),
                              const SizedBox(height: 10),
                              // 건조 시간
                              Row(
                                children: [
                                  Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    '건조: ${_formatBuildTime(defense.buildTime)}',
                                    style: const TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    if (!defense.requirementsMet && defense.missingRequirements.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.negative.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.lock, size: 14, color: AppColors.negative),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                defense.missingRequirements.join(', '),
                                style: const TextStyle(
                                  color: AppColors.negative,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (isMaxed) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle, size: 14, color: AppColors.warning),
                            const SizedBox(width: 8),
                            const Text(
                              '최대 보유 수량에 도달했습니다',
                              style: TextStyle(
                                color: AppColors.warning,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
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
                                  color: AppColors.textMuted,
                                  fontSize: 10,
                                ),
                              ),
                              const SizedBox(height: 6),
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
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 16),
                              onPressed: quantity > 1 
                                  ? () => onQuantityChanged(quantity - 1)
                                  : null,
                              color: AppColors.textMuted,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                            ),
                            Container(
                              width: 36,
                              alignment: Alignment.center,
                              child: Text(
                                '$quantity',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 16),
                              onPressed: () => onQuantityChanged(quantity + 1),
                              color: AppColors.textMuted,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
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
  final int value;

  const _StatChip({
    required this.icon,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: AppColors.textMuted),
        const SizedBox(width: 3),
        Text(
          '$value',
          style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}
