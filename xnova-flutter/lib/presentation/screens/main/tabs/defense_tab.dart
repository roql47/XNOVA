import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_names.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class DefenseTab extends ConsumerWidget {
  const DefenseTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadDefense(),
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 건설 진행 카드
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
            onBuild: (qty) => ref.read(gameProvider.notifier).buildDefense(defense.type, qty),
          )),
        ],
      ),
    );
  }
}

// 건설 진행 카드
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
                      if ((progress.quantity ?? 1) > 1) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.positive.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '남은 수량: ${progress.quantity}',
                            style: const TextStyle(
                              color: AppColors.positive,
                              fontWeight: FontWeight.w600,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
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

// 방어시설 카드
class _DefenseCard extends StatefulWidget {
  final DefenseInfo defense;
  final GameResources resources;
  final bool isBuilding;
  final Function(int) onBuild;

  const _DefenseCard({
    required this.defense,
    required this.resources,
    required this.isBuilding,
    required this.onBuild,
  });

  @override
  State<_DefenseCard> createState() => _DefenseCardState();
}

class _DefenseCardState extends State<_DefenseCard> {
  bool _isExpanded = false;
  int _quantity = 1;

  bool get canAfford {
    return widget.resources.metal >= widget.defense.cost.metal * _quantity &&
           widget.resources.crystal >= widget.defense.cost.crystal * _quantity &&
           widget.resources.deuterium >= widget.defense.cost.deuterium * _quantity;
  }

  bool get isMaxed {
    if (widget.defense.maxCount == null) return false;
    return widget.defense.count >= widget.defense.maxCount!;
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

  void _showQuantityDialog() {
    final controller = TextEditingController(text: _quantity.toString());
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Text(
          '${widget.defense.name} 건설 수량',
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              autofocus: true,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              decoration: InputDecoration(
                hintText: '수량 입력',
                hintStyle: TextStyle(color: AppColors.textMuted),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppColors.panelBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppColors.panelBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppColors.accent),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // 빠른 선택 버튼
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [1, 5, 10, 50, 100].map((num) {
                return InkWell(
                  onTap: () => controller.text = num.toString(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.panelBorder),
                    ),
                    child: Text(
                      '$num',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              final qty = int.tryParse(controller.text) ?? 1;
              if (qty > 0) {
                setState(() => _quantity = qty);
              }
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = !widget.defense.requirementsMet || isMaxed;

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
                          widget.defense.name,
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
                          widget.defense.maxCount != null 
                              ? '${widget.defense.count}/${widget.defense.maxCount}'
                              : '보유: ${widget.defense.count}',
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
              // 펼쳤을 때 스탯 정보
              if (_isExpanded)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border(bottom: BorderSide(color: AppColors.panelBorder)),
                  ),
                  child: Wrap(
                    spacing: 16,
                    runSpacing: 6,
                    children: [
                      _StatItem(icon: Icons.gps_fixed, label: '공격력', value: widget.defense.stats.attack),
                      _StatItem(icon: Icons.shield, label: '방어막', value: widget.defense.stats.shield),
                      _StatItem(icon: Icons.favorite, label: '내구력', value: widget.defense.stats.hull),
                    ],
                  ),
                ),
              // 본문
              Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    // 방어시설 이미지
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: _getDefenseImagePath(widget.defense.type) != null
                          ? Image.asset(
                              _getDefenseImagePath(widget.defense.type)!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(
                                Icons.shield,
                                size: 32,
                                color: AppColors.textMuted,
                              ),
                            )
                          : const Icon(
                              Icons.shield,
                              size: 32,
                              color: AppColors.textMuted,
                            ),
                    ),
                    const SizedBox(width: 14),
                    // 건설 정보
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 요구사항 미충족
                          if (!widget.defense.requirementsMet && widget.defense.missingRequirements.isNotEmpty) ...[
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
                                      widget.defense.missingRequirements.join(', '),
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
                          // 최대 보유 수량 도달
                          if (isMaxed) ...[
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.warning.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.check_circle, size: 12, color: AppColors.warning),
                                  const SizedBox(width: 6),
                                  const Text(
                                    '최대 보유 수량 도달',
                                    style: TextStyle(
                                      color: AppColors.warning,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],
                          Text(
                            '건설 비용 (x$_quantity)',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(height: 6),
                          CostDisplay(
                            metal: widget.defense.cost.metal * _quantity,
                            crystal: widget.defense.cost.crystal * _quantity,
                            deuterium: widget.defense.cost.deuterium * _quantity,
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
                                _formatTime(widget.defense.buildTime),
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
                    // 수량 선택 및 건설 버튼
                    Column(
                      children: [
                        // 수량 선택
                        InkWell(
                          onTap: isMaxed ? null : _showQuantityDialog,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppColors.panelBorder),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '$_quantity',
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.edit, size: 12, color: AppColors.textMuted),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        GameButton(
                          text: '건설',
                          onPressed: (!widget.isBuilding && canAfford && widget.defense.requirementsMet && !isMaxed)
                              ? () => widget.onBuild(_quantity)
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

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int value;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  String _formatNumber(int num) {
    if (num >= 1000000) return '${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return '${(num / 1000).toStringAsFixed(1)}K';
    return num.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(
          '$label: ${_formatNumber(value)}',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
