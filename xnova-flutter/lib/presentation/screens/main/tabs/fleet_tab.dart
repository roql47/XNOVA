import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_names.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart' hide Resources;
import '../../../widgets/game_panel.dart';

class FleetTab extends ConsumerWidget {
  const FleetTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadFleet(),
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 조선소 레벨 표시
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.panelBackground,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: Row(
              children: [
                Icon(Icons.rocket_launch, color: AppColors.accent, size: 18),
                const SizedBox(width: 10),
                Text(
                  '조선소 레벨: ${gameState.shipyardLevel}',
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
          
          // 건조 진행 카드
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
            onBuild: (qty) => ref.read(gameProvider.notifier).buildFleet(ship.type, qty),
          )),
        ],
      ),
    );
  }
}

// 건조 진행 카드
class _FleetProgressCard extends StatelessWidget {
  final ProgressInfo progress;
  final VoidCallback onComplete;

  const _FleetProgressCard({
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
                          child: const Icon(Icons.rocket_launch, color: AppColors.accent, size: 24),
                        ),
                      )
                    : Container(
                        color: AppColors.surface,
                        child: const Icon(Icons.rocket_launch, color: AppColors.accent, size: 24),
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
                          '건조 중',
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

// 함선 카드
class _ShipCard extends StatefulWidget {
  final FleetInfo ship;
  final GameResources resources;
  final bool isBuilding;
  final Function(int) onBuild;

  const _ShipCard({
    required this.ship,
    required this.resources,
    required this.isBuilding,
    required this.onBuild,
  });

  @override
  State<_ShipCard> createState() => _ShipCardState();
}

class _ShipCardState extends State<_ShipCard> {
  bool _isExpanded = false;
  int _quantity = 1;

  bool get canAfford {
    return widget.resources.metal >= widget.ship.cost.metal * _quantity &&
           widget.resources.crystal >= widget.ship.cost.crystal * _quantity &&
           widget.resources.deuterium >= widget.ship.cost.deuterium * _quantity;
  }

  String? _getShipImagePath(String type) {
    const shipImages = {
      'smallCargo': 'assets/images/small_cargo_ship.webp',
      'largeCargo': 'assets/images/large_cargo_ship.webp',
      'lightFighter': 'assets/images/light_fighter.webp',
      'heavyFighter': 'assets/images/heavy_fighter.webp',
      'cruiser': 'assets/images/cruiser.webp',
      'battleship': 'assets/images/battleship.webp',
      'battlecruiser': 'assets/images/battlecruiser.jpg',
      'bomber': 'assets/images/bomber.webp',
      'destroyer': 'assets/images/destroyer.webp',
      'deathstar': 'assets/images/deathstar.webp',
      'colonyShip': 'assets/images/colony_ship.webp',
      'recycler': 'assets/images/recycler.webp',
      'espionageProbe': 'assets/images/espionage_probe.webp',
      'solarSatellite': 'assets/images/solar_satellite.webp',
    };
    return shipImages[type];
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
    int tempQuantity = _quantity;
    final controller = TextEditingController(text: _quantity.toString());
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: BoxDecoration(
            color: AppColors.panelBackground,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border.all(color: AppColors.accent.withOpacity(0.3)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 핸들바
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textMuted.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              // 헤더 (이미지 + 이름)
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.accent.withOpacity(0.5)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _getShipImagePath(widget.ship.type) != null
                        ? Image.asset(
                            _getShipImagePath(widget.ship.type)!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Icon(
                              Icons.rocket_launch,
                              color: AppColors.accent,
                              size: 24,
                            ),
                          )
                        : Icon(Icons.rocket_launch, color: AppColors.accent, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.ship.name,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          '보유: ${widget.ship.count}대',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // 수량 조절 영역
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // 감소 버튼
                    _buildQuantityButton(
                      icon: Icons.remove,
                      onTap: () {
                        if (tempQuantity > 1) {
                          setModalState(() {
                            tempQuantity--;
                            controller.text = tempQuantity.toString();
                          });
                        }
                      },
                    ),
                    const SizedBox(width: 16),
                    // 수량 입력
                    SizedBox(
                      width: 100,
                      child: TextField(
                        controller: controller,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.accent,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onChanged: (value) {
                          final qty = int.tryParse(value) ?? 1;
                          setModalState(() => tempQuantity = qty > 0 ? qty : 1);
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    // 증가 버튼
                    _buildQuantityButton(
                      icon: Icons.add,
                      onTap: () {
                        setModalState(() {
                          tempQuantity++;
                          controller.text = tempQuantity.toString();
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // 빠른 선택 버튼
              Row(
                children: [1, 5, 10, 50, 100].map((num) {
                  final isSelected = tempQuantity == num;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: InkWell(
                        onTap: () {
                          setModalState(() {
                            tempQuantity = num;
                            controller.text = num.toString();
                          });
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.accent : AppColors.surface,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected ? AppColors.accent : AppColors.panelBorder,
                            ),
                          ),
                          child: Text(
                            '$num',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: isSelected ? Colors.black : AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              // 확인 버튼
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final qty = int.tryParse(controller.text) ?? 1;
                    if (qty > 0) {
                      setState(() => _quantity = qty);
                    }
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    '${tempQuantity}대 선택',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuantityButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.panelBackground,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.panelBorder),
        ),
        child: Icon(icon, color: AppColors.accent, size: 20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = !widget.ship.requirementsMet;

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
                          widget.ship.name,
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
                          '보유: ${widget.ship.count}',
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
                      _StatItem(icon: Icons.gps_fixed, label: '공격력', value: widget.ship.stats.attack),
                      _StatItem(icon: Icons.shield, label: '방어막', value: widget.ship.stats.shield),
                      _StatItem(icon: Icons.favorite, label: '내구력', value: widget.ship.stats.hull),
                      _StatItem(icon: Icons.speed, label: '속도', value: widget.ship.stats.speed),
                      _StatItem(icon: Icons.inventory_2, label: '적재량', value: widget.ship.stats.cargo),
                    ],
                  ),
                ),
              // 본문
              Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    // 함선 이미지
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: _getShipImagePath(widget.ship.type) != null
                          ? Image.asset(
                              _getShipImagePath(widget.ship.type)!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(
                                Icons.rocket_launch,
                                size: 32,
                                color: AppColors.textMuted,
                              ),
                            )
                          : const Icon(
                              Icons.rocket_launch,
                              size: 32,
                              color: AppColors.textMuted,
                            ),
                    ),
                    const SizedBox(width: 14),
                    // 건조 정보
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 요구사항 미충족
                          if (isDisabled && widget.ship.missingRequirements.isNotEmpty) ...[
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
                                      widget.ship.missingRequirements.join(', '),
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
                          Text(
                            '건조 비용 (x$_quantity)',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(height: 6),
                          CostDisplay(
                            metal: widget.ship.cost.metal * _quantity,
                            crystal: widget.ship.cost.crystal * _quantity,
                            deuterium: widget.ship.cost.deuterium * _quantity,
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
                                _formatTime(widget.ship.buildTime),
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
                    // 수량 선택 및 건조 버튼
                    Column(
                      children: [
                        // 수량 선택
                        InkWell(
                          onTap: _showQuantityDialog,
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
                          text: '건조',
                          onPressed: (!widget.isBuilding && canAfford && widget.ship.requirementsMet)
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
