import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_names.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class BuildingsTab extends ConsumerWidget {
  const BuildingsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);
    
    final mines = gameState.buildings.where((b) => b.category == 'mines').toList();
    final facilities = gameState.buildings.where((b) => b.category == 'facilities').toList();

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadBuildings(),
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          if (gameState.constructionProgress != null)
            _ConstructionProgressCard(
              progress: gameState.constructionProgress!,
              onComplete: () => ref.read(gameProvider.notifier).completeBuilding(),
              onCancel: () => ref.read(gameProvider.notifier).cancelBuilding(),
            ),
          
          if (mines.isNotEmpty) ...[
            const _SectionHeader(icon: Icons.precision_manufacturing, title: '자원 생산'),
            ...mines.map((building) => _BuildingCard(
              building: building,
              resources: gameState.resources,
              isConstructing: gameState.constructionProgress != null,
              onUpgrade: () => ref.read(gameProvider.notifier).upgradeBuilding(building.type),
              onDowngrade: () => ref.read(gameProvider.notifier).downgradeBuilding(building.type),
            )),
          ],
          
          if (facilities.isNotEmpty) ...[
            const SizedBox(height: 16),
            const _SectionHeader(icon: Icons.apartment, title: '시설'),
            ...facilities.map((building) => _BuildingCard(
              building: building,
              resources: gameState.resources,
              isConstructing: gameState.constructionProgress != null,
              onUpgrade: () => ref.read(gameProvider.notifier).upgradeBuilding(building.type),
              onDowngrade: () => ref.read(gameProvider.notifier).downgradeBuilding(building.type),
            )),
          ],
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
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
    final koreanName = getKoreanName(progress.name);
    final imagePath = getImagePath(progress.name);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: progress.isDowngrade 
              ? AppColors.negative.withOpacity(0.08)
              : AppColors.accent.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: progress.isDowngrade 
                ? AppColors.negative.withOpacity(0.2)
                : AppColors.accent.withOpacity(0.2),
          ),
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
                border: Border.all(
                  color: progress.isDowngrade ? AppColors.negative : AppColors.accent, 
                  width: 2,
                ),
              ),
              child: ClipOval(
                child: imagePath != null
                    ? Image.asset(
                        imagePath,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.surface,
                          child: Icon(
                            progress.isDowngrade ? Icons.delete_outline : Icons.construction, 
                            color: progress.isDowngrade ? AppColors.negative : AppColors.accent, 
                            size: 24,
                          ),
                        ),
                      )
                    : Container(
                        color: AppColors.surface,
                        child: Icon(
                          progress.isDowngrade ? Icons.delete_outline : Icons.construction, 
                          color: progress.isDowngrade ? AppColors.negative : AppColors.accent, 
                          size: 24,
                        ),
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
                          color: progress.isDowngrade 
                              ? AppColors.negative.withOpacity(0.2)
                              : AppColors.accent.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          progress.isDowngrade ? '파괴 중' : '건설 중',
                          style: TextStyle(
                            color: progress.isDowngrade ? AppColors.negative : AppColors.accent,
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
              onTap: onCancel,
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

class _BuildingCard extends StatefulWidget {
  final BuildingInfo building;
  final GameResources resources;
  final bool isConstructing;
  final VoidCallback onUpgrade;
  final VoidCallback onDowngrade;

  const _BuildingCard({
    required this.building,
    required this.resources,
    required this.isConstructing,
    required this.onUpgrade,
    required this.onDowngrade,
  });

  @override
  State<_BuildingCard> createState() => _BuildingCardState();
}

class _BuildingCardState extends State<_BuildingCard> {
  bool _isExpanded = false;

  bool get canAfford {
    if (widget.building.upgradeCost == null) return false;
    return widget.resources.metal >= widget.building.upgradeCost!.metal &&
           widget.resources.crystal >= widget.building.upgradeCost!.crystal &&
           widget.resources.deuterium >= widget.building.upgradeCost!.deuterium;
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
                        widget.building.name,
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
                        'Lv.${widget.building.level}',
                        style: const TextStyle(
                          color: AppColors.accent,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (widget.building.level > 0) ...[
                      const SizedBox(width: 2),
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: PopupMenuButton<String>(
                          iconSize: 14,
                          padding: EdgeInsets.zero,
                          splashRadius: 12,
                          color: AppColors.panelBackground,
                          onSelected: (value) {
                            if (value == 'destroy') {
                              _showDowngradeDialog(context);
                            }
                          },
                          itemBuilder: (context) => [
                            PopupMenuItem<String>(
                              value: 'destroy',
                              enabled: !widget.isConstructing,
                              height: 36,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.delete_outline, size: 14, color: widget.isConstructing ? AppColors.textMuted : AppColors.negative),
                                  const SizedBox(width: 6),
                                  Text(
                                    '파괴 (Lv.${widget.building.level} → ${widget.building.level - 1})',
                                    style: TextStyle(
                                      color: widget.isConstructing ? AppColors.textMuted : AppColors.negative,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          child: const Icon(Icons.more_vert, size: 14, color: AppColors.textMuted),
                        ),
                      ),
                    ],
                    const SizedBox(width: 4),
                    Icon(
                      _isExpanded ? Icons.expand_less : Icons.expand_more,
                      size: 16,
                      color: AppColors.textMuted,
                    ),
                  ],
                ),
              ),
            ),
            if (_isExpanded)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border(bottom: BorderSide(color: AppColors.panelBorder)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (widget.building.production != null)
                      _DetailRow(
                        label: (widget.building.type == 'solarPlant' || widget.building.type == 'fusionReactor') 
                            ? '에너지 생산량' : '자원 생산량',
                        // 에너지 생산(태양광/핵융합로)은 "/h" 없이, 자원 생산은 "/h" 표시
                        currentValue: (widget.building.type == 'solarPlant' || widget.building.type == 'fusionReactor')
                            ? '+${_formatAmount(widget.building.production!)}'
                            : '+${_formatAmount(widget.building.production!)}/h',
                        nextValue: widget.building.nextProduction != null 
                            ? (widget.building.type == 'solarPlant' || widget.building.type == 'fusionReactor')
                                ? '+${_formatAmount(widget.building.nextProduction!)}'
                                : '+${_formatAmount(widget.building.nextProduction!)}/h'
                            : null,
                        isPositive: true,
                      ),
                    if (widget.building.consumption != null && widget.building.consumption! > 0)
                      _DetailRow(
                        label: widget.building.type == 'fusionReactor' ? '듀테륨 소모량' : '에너지 소모량',
                        currentValue: '-${_formatAmount(widget.building.consumption!)}',
                        nextValue: widget.building.nextConsumption != null 
                            ? '-${_formatAmount(widget.building.nextConsumption!)}' 
                            : null,
                        isPositive: false,
                      ),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _buildBuildingImage(widget.building.type),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '업그레이드 비용',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(height: 6),
                        if (widget.building.upgradeCost != null)
                          CostDisplay(
                            metal: widget.building.upgradeCost!.metal,
                            crystal: widget.building.upgradeCost!.crystal,
                            deuterium: widget.building.upgradeCost!.deuterium,
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
                              _formatTime(widget.building.upgradeTime),
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
                    text: '업그레이드',
                    onPressed: (!widget.isConstructing && canAfford) ? widget.onUpgrade : null,
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

  void _showDowngradeDialog(BuildContext context) {
    final cost = widget.building.upgradeCost;
    final downgradeCost = cost != null ? {
      'metal': (cost.metal * 0.25).floor(),
      'crystal': (cost.crystal * 0.25).floor(),
      'deuterium': (cost.deuterium * 0.25).floor(),
    } : {'metal': 0, 'crystal': 0, 'deuterium': 0};
    
    final canAffordDowngrade = 
      widget.resources.metal >= downgradeCost['metal']! &&
      widget.resources.crystal >= downgradeCost['crystal']! &&
      widget.resources.deuterium >= downgradeCost['deuterium']!;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: Text(
          '${widget.building.name} 파괴',
          style: const TextStyle(color: AppColors.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Lv.${widget.building.level} → Lv.${widget.building.level - 1}',
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            const Text(
              '파괴 비용 (건설 비용의 25%):',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              'M: ${_formatAmount(downgradeCost['metal']!)}  C: ${_formatAmount(downgradeCost['crystal']!)}  D: ${_formatAmount(downgradeCost['deuterium']!)}',
              style: TextStyle(
                color: canAffordDowngrade ? AppColors.textSecondary : AppColors.negative,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '소요 시간: 건설 시간의 50%',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            const Text(
              '⚠️ 파괴 시 행성 필드 1칸이 회복됩니다.',
              style: TextStyle(color: AppColors.warning, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: canAffordDowngrade ? () {
              Navigator.pop(context);
              widget.onDowngrade();
            } : null,
            child: Text(
              '파괴',
              style: TextStyle(color: canAffordDowngrade ? AppColors.negative : AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  String _formatAmount(int amount) {
    if (amount >= 1000000) return '${(amount / 1000000).toStringAsFixed(1)}M';
    if (amount >= 1000) return '${(amount / 1000).toStringAsFixed(1)}K';
    return amount.toString();
  }

  Widget _buildBuildingImage(String type) {
    String? assetPath;
    switch (type) {
      case 'metalMine':
        assetPath = 'assets/images/metalmine.webp';
        break;
      case 'crystalMine':
        assetPath = 'assets/images/crystalmine.webp';
        break;
      case 'deuteriumMine':
      case 'deuteriumSynthesizer':
        assetPath = 'assets/images/deuterium_synthesizer.webp';
        break;
      case 'solarPlant':
        assetPath = 'assets/images/solarplant.webp';
        break;
      case 'fusionReactor':
        assetPath = 'assets/images/fusion_reactor.webp';
        break;
      case 'robotFactory':
      case 'roboticsFactory':
        assetPath = 'assets/images/robotics_factory.webp';
        break;
      case 'nanoFactory':
      case 'naniteFactory':
        assetPath = 'assets/images/nanite_factory.webp';
        break;
      case 'shipyard':
        assetPath = 'assets/images/shipyard.webp';
        break;
      case 'researchLaboratory':
      case 'researchLab':
        assetPath = 'assets/images/research_rab.webp';
        break;
      case 'terraformer':
        assetPath = 'assets/images/terraformer.webp';
        break;
      case 'allianceDepot':
        assetPath = 'assets/images/alliance_depot.webp';
        break;
      case 'missileSilo':
        assetPath = 'assets/images/missile_silo.webp';
        break;
      case 'spaceDock':
        assetPath = 'assets/images/space_dock.webp';
        break;
      case 'lunarBase':
        assetPath = 'assets/images/lunar_base.webp';
        break;
      case 'sensorPhalanx':
        assetPath = 'assets/images/sensor_phalanx.webp';
        break;
      case 'jumpGate':
        assetPath = 'assets/images/jump_gate.webp';
        break;
    }

    if (assetPath != null) {
      return Image.asset(
        assetPath,
        width: 72,
        height: 72,
        cacheWidth: 144,
        cacheHeight: 144,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => 
            const Icon(Icons.apartment, size: 32, color: AppColors.textMuted),
      );
    }

    return const Icon(Icons.apartment, size: 32, color: AppColors.textMuted);
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

class _DetailRow extends StatelessWidget {
  final String label;
  final String currentValue;
  final String? nextValue;
  final bool isPositive;

  const _DetailRow({
    required this.label,
    required this.currentValue,
    this.nextValue,
    required this.isPositive,
  });

  @override
  Widget build(BuildContext context) {
    final color = isPositive ? AppColors.positive : AppColors.negative;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
          Row(
            children: [
              Text(
                currentValue,
                style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
              ),
              if (nextValue != null) ...[
                const SizedBox(width: 6),
                Icon(Icons.arrow_forward, size: 10, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  nextValue!,
                  style: TextStyle(color: color.withOpacity(0.7), fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
