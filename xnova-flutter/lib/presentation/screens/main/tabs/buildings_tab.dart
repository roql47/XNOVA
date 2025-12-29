import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class BuildingsTab extends ConsumerWidget {
  const BuildingsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);
    
    // 카테고리별로 건물 분류
    final mines = gameState.buildings.where((b) => b.category == 'mine').toList();
    final facilities = gameState.buildings.where((b) => b.category == 'facility').toList();

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadBuildings(),
      color: AppColors.ogameGreen,
      backgroundColor: AppColors.panelBackground,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 건설 진행 중
          if (gameState.constructionProgress != null)
            _ConstructionProgressCard(
              progress: gameState.constructionProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeBuilding(),
              onCancel: () => ref.read(gameProvider.notifier).cancelBuilding(),
            ),
          
          // 광산
          if (mines.isNotEmpty) ...[
            const _SectionHeader(emoji: '⛏️', title: '자원 생산'),
            ...mines.map((building) => _BuildingCard(
              building: building,
              resources: gameState.resources,
              isConstructing: gameState.constructionProgress != null,
              onUpgrade: () => ref.read(gameProvider.notifier).upgradeBuilding(building.type),
            )),
          ],
          
          // 시설
          if (facilities.isNotEmpty) ...[
            const SizedBox(height: 16),
            const _SectionHeader(emoji: '🏭', title: '시설'),
            ...facilities.map((building) => _BuildingCard(
              building: building,
              resources: gameState.resources,
              isConstructing: gameState.constructionProgress != null,
              onUpgrade: () => ref.read(gameProvider.notifier).upgradeBuilding(building.type),
            )),
          ],
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String emoji;
  final String title;

  const _SectionHeader({required this.emoji, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _ConstructionProgressCard extends StatelessWidget {
  final ProgressInfo progress;
  final VoidCallback onComplete;
  final VoidCallback onCancel;

  const _ConstructionProgressCard({
    required this.progress,
    required this.onComplete,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.ogameGreen.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.ogameGreen.withOpacity(0.3)),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.construction, color: AppColors.ogameGreen, size: 20),
                const SizedBox(width: 8),
                const Text(
                  '건설 중',
                  style: TextStyle(
                    color: AppColors.ogameGreen,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              progress.name,
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
                const Spacer(),
                TextButton(
                  onPressed: onCancel,
                  child: const Text(
                    '취소',
                    style: TextStyle(color: AppColors.errorRed, fontSize: 12),
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

class _BuildingCard extends StatelessWidget {
  final BuildingInfo building;
  final GameResources resources;
  final bool isConstructing;
  final VoidCallback onUpgrade;

  const _BuildingCard({
    required this.building,
    required this.resources,
    required this.isConstructing,
    required this.onUpgrade,
  });

  bool get canAfford {
    if (building.upgradeCost == null) return false;
    return resources.metal >= building.upgradeCost!.metal &&
           resources.crystal >= building.upgradeCost!.crystal &&
           resources.deuterium >= building.upgradeCost!.deuterium;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.panelBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.panelBorder),
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
                      building.name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.ogameGreen.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Lv.${building.level}',
                      style: const TextStyle(
                        color: AppColors.ogameGreen,
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
              child: Row(
                children: [
                  // 비용
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '업그레이드 비용',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (building.upgradeCost != null)
                          CostDisplay(
                            metal: building.upgradeCost!.metal,
                            crystal: building.upgradeCost!.crystal,
                            deuterium: building.upgradeCost!.deuterium,
                            currentMetal: resources.metal,
                            currentCrystal: resources.crystal,
                            currentDeuterium: resources.deuterium,
                          ),
                        const SizedBox(height: 4),
                        Text(
                          '⏱️ ${_formatTime(building.upgradeTime)}',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // 버튼
                  GameButton(
                    text: '업그레이드',
                    onPressed: (!isConstructing && canAfford) ? onUpgrade : null,
                    icon: Icons.arrow_upward,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(double seconds) {
    final duration = Duration(seconds: seconds.toInt());
    if (duration.inHours > 0) {
      return '${duration.inHours}시간 ${duration.inMinutes % 60}분';
    } else if (duration.inMinutes > 0) {
      return '${duration.inMinutes}분 ${duration.inSeconds % 60}초';
    }
    return '${duration.inSeconds}초';
  }
}

