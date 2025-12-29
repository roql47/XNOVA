import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class ResearchTab extends ConsumerWidget {
  const ResearchTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadResearch(),
      color: AppColors.ogameGreen,
      backgroundColor: AppColors.panelBackground,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 연구소 레벨
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.panelBackground,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.science, color: AppColors.infoBlue),
                const SizedBox(width: 8),
                Text(
                  '연구소 레벨: ${gameState.labLevel}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          
          // 연구 진행 중
          if (gameState.researchProgress != null)
            _ResearchProgressCard(
              progress: gameState.researchProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeResearch(),
            ),
          
          // 연구 목록
          ...gameState.research.map((research) => _ResearchCard(
            research: research,
            resources: gameState.resources,
            isResearching: gameState.researchProgress != null,
            onResearch: () => ref.read(gameProvider.notifier).startResearch(research.type),
          )),
        ],
      ),
    );
  }
}

class _ResearchProgressCard extends StatelessWidget {
  final ProgressInfo progress;
  final VoidCallback onComplete;

  const _ResearchProgressCard({
    required this.progress,
    required this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.infoBlue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.infoBlue.withOpacity(0.3)),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.science, color: AppColors.infoBlue, size: 20),
                const SizedBox(width: 8),
                const Text(
                  '연구 진행 중',
                  style: TextStyle(
                    color: AppColors.infoBlue,
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
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ResearchCard extends StatelessWidget {
  final ResearchInfo research;
  final GameResources resources;
  final bool isResearching;
  final VoidCallback onResearch;

  const _ResearchCard({
    required this.research,
    required this.resources,
    required this.isResearching,
    required this.onResearch,
  });

  bool get canAfford {
    if (research.cost == null) return false;
    return resources.metal >= research.cost!.metal &&
           resources.crystal >= research.cost!.crystal &&
           resources.deuterium >= research.cost!.deuterium;
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = !research.requirementsMet;

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
                        research.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.infoBlue.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Lv.${research.level}',
                        style: const TextStyle(
                          color: AppColors.infoBlue,
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
                    // 요구사항 미충족 시
                    if (isDisabled && research.missingRequirements.isNotEmpty) ...[
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
                                research.missingRequirements.join(', '),
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
                              const Text(
                                '연구 비용',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 4),
                              if (research.cost != null)
                                CostDisplay(
                                  metal: research.cost!.metal,
                                  crystal: research.cost!.crystal,
                                  deuterium: research.cost!.deuterium,
                                  currentMetal: resources.metal,
                                  currentCrystal: resources.crystal,
                                  currentDeuterium: resources.deuterium,
                                ),
                              const SizedBox(height: 4),
                              Text(
                                '⏱️ ${_formatTime(research.researchTime)}',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        GameButton(
                          text: '연구',
                          onPressed: (!isResearching && canAfford && research.requirementsMet) 
                              ? onResearch 
                              : null,
                          icon: Icons.science,
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

