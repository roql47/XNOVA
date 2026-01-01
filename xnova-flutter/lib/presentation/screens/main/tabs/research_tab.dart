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
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.panelBackground,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: Row(
              children: [
                Icon(Icons.science, color: AppColors.accent, size: 18),
                const SizedBox(width: 10),
                Text(
                  '연구소 레벨: ${gameState.labLevel}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          
          if (gameState.researchProgress != null)
            _ResearchProgressCard(
              progress: gameState.researchProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeResearch(),
            ),
          
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
          color: AppColors.accent.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.accent.withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.science, color: AppColors.accent, size: 16),
                const SizedBox(width: 8),
                const Text(
                  '연구 진행 중',
                  style: TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              progress.name,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
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

  String? _getResearchImagePath(String type) {
    const researchImages = {
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
    };
    return researchImages[type];
  }

  String _formatResearchTime(double seconds) {
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
                        research.name,
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
                        'Lv.${research.level}',
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
                        // 연구 이미지
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _getResearchImagePath(research.type) != null
                              ? Image.asset(
                                  _getResearchImagePath(research.type)!,
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
                                        child: const Icon(Icons.science, size: 40, color: AppColors.textMuted),
                                      ),
                                )
                              : Container(
                                  width: 100,
                                  height: 100,
                                  color: AppColors.surface,
                                  child: const Icon(Icons.science, size: 40, color: AppColors.textMuted),
                                ),
                        ),
                        const SizedBox(width: 14),
                        // 연구 시간
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (research.researchTime > 0)
                                Row(
                                  children: [
                                    Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                                    const SizedBox(width: 4),
                                    Text(
                                      '연구: ${_formatResearchTime(research.researchTime)}',
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
                    if (isDisabled && research.missingRequirements.isNotEmpty) ...[
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
                                research.missingRequirements.join(', '),
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
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '연구 비용',
                                style: TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 10,
                                ),
                              ),
                              const SizedBox(height: 6),
                              if (research.cost != null)
                                CostDisplay(
                                  metal: research.cost!.metal,
                                  crystal: research.cost!.crystal,
                                  deuterium: research.cost!.deuterium,
                                  currentMetal: resources.metal,
                                  currentCrystal: resources.crystal,
                                  currentDeuterium: resources.deuterium,
                                ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(Icons.schedule, size: 12, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    _formatTime(research.researchTime),
                                    style: const TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
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
