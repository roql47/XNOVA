import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/research_effects.dart';
import '../../../../core/constants/game_names.dart';
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
              onCancel: () => ref.read(gameProvider.notifier).cancelResearch(),
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
  final VoidCallback onCancel;

  const _ResearchProgressCard({
    required this.progress,
    required this.onComplete,
    required this.onCancel,
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
                          child: const Icon(Icons.science, color: AppColors.accent, size: 24),
                        ),
                      )
                    : Container(
                        color: AppColors.surface,
                        child: const Icon(Icons.science, color: AppColors.accent, size: 24),
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
                          '연구 중',
                          style: TextStyle(
                            color: AppColors.accent,
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
            // 취소 버튼
            InkWell(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: AppColors.surface,
                    title: const Text(
                      '연구 취소',
                      style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
                    ),
                    content: const Text(
                      '연구를 취소하시겠습니까?\n투자한 자원의 50%가 환불됩니다.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('아니오', style: TextStyle(color: AppColors.textMuted)),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          onCancel();
                        },
                        child: const Text('취소하기', style: TextStyle(color: AppColors.negative)),
                      ),
                    ],
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.negative.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppColors.negative.withOpacity(0.3)),
                ),
                child: const Text(
                  '취소',
                  style: TextStyle(
                    color: AppColors.negative,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResearchCard extends StatefulWidget {
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

  @override
  State<_ResearchCard> createState() => _ResearchCardState();
}

class _ResearchCardState extends State<_ResearchCard> {
  bool _isExpanded = false;

  bool get canAfford {
    if (widget.research.cost == null) return false;
    return widget.resources.metal >= widget.research.cost!.metal &&
           widget.resources.crystal >= widget.research.cost!.crystal &&
           widget.resources.deuterium >= widget.research.cost!.deuterium;
  }

  String? _getResearchImagePath(String type) {
    return researchImages[type];
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
    } else {
      return '${secs}초';
    }
  }

  Widget _buildEffectRow() {
    final effect = researchEffects[widget.research.type];
    if (effect == null) return const SizedBox.shrink();

    final effectText = effect.getEffectAtLevel(widget.research.level);
    final nextEffectText = effect.getEffectAtLevel(widget.research.level + 1);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.panelBorder)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            effect.description,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
            ),
          ),
          if (effectText.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                _EffectBadge(label: '현재', value: effectText, isHighlight: true),
                const SizedBox(width: 8),
                _EffectBadge(label: '다음', value: nextEffectText, isHighlight: false),
              ],
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = !widget.research.requirementsMet;

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
              // 헤더 (접기/펼치기)
              InkWell(
                onTap: () => setState(() => _isExpanded = !_isExpanded),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(7),
                  topRight: Radius.circular(7),
                ),
                child: Container(
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
                          widget.research.name,
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
                          'Lv.${widget.research.level}',
                          style: const TextStyle(
                            color: AppColors.accent,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        _isExpanded ? Icons.expand_less : Icons.expand_more,
                        size: 16,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
              // 펼쳤을 때 효과 정보
              if (_isExpanded && researchEffects.containsKey(widget.research.type))
                _buildEffectRow(),
              // 본문
              Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    // 연구 이미지
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: _getResearchImagePath(widget.research.type) != null
                          ? Image.asset(
                              _getResearchImagePath(widget.research.type)!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(
                                Icons.science,
                                size: 32,
                                color: AppColors.textMuted,
                              ),
                            )
                          : const Icon(
                              Icons.science,
                              size: 32,
                              color: AppColors.textMuted,
                            ),
                    ),
                    const SizedBox(width: 14),
                    // 연구 정보
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 요구사항 미충족
                          if (isDisabled && widget.research.missingRequirements.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.negative.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.lock, size: 12, color: AppColors.negative),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      widget.research.missingRequirements.join(', '),
                                      style: const TextStyle(
                                        color: AppColors.negative,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],
                          const Text(
                            '연구 비용',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(height: 6),
                          if (widget.research.cost != null)
                            CostDisplay(
                              metal: widget.research.cost!.metal,
                              crystal: widget.research.cost!.crystal,
                              deuterium: widget.research.cost!.deuterium,
                              currentMetal: widget.resources.metal,
                              currentCrystal: widget.resources.crystal,
                              currentDeuterium: widget.resources.deuterium,
                            ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(Icons.schedule, size: 12, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(
                                _formatTime(widget.research.researchTime),
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
                      onPressed: (!widget.isResearching && canAfford && widget.research.requirementsMet) 
                          ? widget.onResearch 
                          : null,
                      icon: Icons.science,
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

// 효과 배지 위젯
class _EffectBadge extends StatelessWidget {
  final String label;
  final String value;
  final bool isHighlight;

  const _EffectBadge({
    required this.label,
    required this.value,
    required this.isHighlight,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isHighlight 
            ? AppColors.accent.withOpacity(0.1) 
            : AppColors.surface,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: isHighlight 
              ? AppColors.accent.withOpacity(0.3) 
              : AppColors.panelBorder,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: TextStyle(
              color: isHighlight ? AppColors.accent : AppColors.textMuted,
              fontSize: 10,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: isHighlight ? AppColors.accent : AppColors.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
