import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_names.dart';
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

  void _onBuild(String type) {
    final qty = _quantities[type] ?? 1;
    ref.read(gameProvider.notifier).buildFleet(type, qty);
  }

  void _dispatchFleet() {
    final selectedShips = <String, int>{};
    final gameState = ref.read(gameProvider);
    
    for (var ship in gameState.fleet) {
      final qty = _quantities[ship.type] ?? 0;
      if (qty > 0) {
        selectedShips[ship.type] = qty;
      }
    }

    if (selectedShips.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('출격시킬 함선을 선택하세요.')),
      );
      return;
    }

    _showDispatchDialog(selectedShips);
  }

  void _showDispatchDialog(Map<String, int> selectedShips) {
    final coordController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: const Text('함대 출격 설정', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('목표 좌표를 입력하세요', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 12),
            TextField(
              controller: coordController,
              autofocus: true,
              style: const TextStyle(color: AppColors.textPrimary, fontFamily: 'monospace'),
              decoration: InputDecoration(
                hintText: '예) 1:123:5',
                hintStyle: TextStyle(color: AppColors.textMuted),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide(color: AppColors.panelBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide(color: AppColors.accent),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('선택된 함대:', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
            const SizedBox(height: 4),
            ...selectedShips.entries.map((e) => Text(
              '${e.key}: ${e.value}척', 
              style: TextStyle(color: AppColors.accent, fontSize: 11)
            )),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              if (coordController.text.isNotEmpty) {
                ref.read(gameProvider.notifier).attack(coordController.text, selectedShips);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${coordController.text}로 함대가 출격했습니다')),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.negative,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('출격 (공격)'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: gameState.fleet.any((s) => (_quantities[s.type] ?? 0) > 0)
          ? FloatingActionButton.extended(
              onPressed: _dispatchFleet,
              backgroundColor: AppColors.negative,
              icon: const Icon(Icons.send, size: 18),
              label: const Text('함대 출격', style: TextStyle(fontSize: 13)),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () => ref.read(gameProvider.notifier).loadFleet(),
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
            
            if (gameState.fleetProgress != null)
              _FleetProgressCard(
                progress: gameState.fleetProgress!,
                onComplete: () => ref.read(gameProvider.notifier).completeFleet(),
              ),
            
            ...gameState.fleet.map((ship) => _ShipCard(
              ship: ship,
              resources: gameState.resources,
              isBuilding: gameState.fleetProgress != null,
              quantity: _quantities[ship.type] ?? 0,
              onQuantityChanged: (qty) {
                setState(() => _quantities[ship.type] = qty);
              },
              onBuild: () => _onBuild(ship.type),
            )),
            const SizedBox(height: 80),
          ],
        ),
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
    final qty = quantity > 0 ? quantity : 1;
    return resources.metal >= ship.cost.metal * qty &&
           resources.crystal >= ship.cost.crystal * qty &&
           resources.deuterium >= ship.cost.deuterium * qty;
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
                        ship.name,
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
                        '보유: ${ship.count}',
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
                        // 함선 이미지
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _getShipImagePath(ship.type) != null
                              ? Image.asset(
                                  _getShipImagePath(ship.type)!,
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
                                        child: const Icon(Icons.rocket_launch, size: 40, color: AppColors.textMuted),
                                      ),
                                )
                              : Container(
                                  width: 100,
                                  height: 100,
                                  color: AppColors.surface,
                                  child: const Icon(Icons.rocket_launch, size: 40, color: AppColors.textMuted),
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
                                  _StatChip(icon: Icons.gps_fixed, value: ship.stats.attack),
                                  _StatChip(icon: Icons.shield, value: ship.stats.shield),
                                  _StatChip(icon: Icons.favorite, value: ship.stats.hull),
                                  _StatChip(icon: Icons.speed, value: ship.stats.speed),
                                  _StatChip(icon: Icons.inventory_2, value: ship.stats.cargo),
                                ],
                              ),
                              const SizedBox(height: 10),
                              // 건조 시간
                              Row(
                                children: [
                                  Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    '건조: ${_formatBuildTime(ship.buildTime)}',
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
                    if (isDisabled && ship.missingRequirements.isNotEmpty) ...[
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
                                ship.missingRequirements.join(', '),
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
                              Text(
                                '건조 비용 (x${quantity > 0 ? quantity : 1})',
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 10,
                                ),
                              ),
                              const SizedBox(height: 6),
                              CostDisplay(
                                metal: ship.cost.metal * (quantity > 0 ? quantity : 1),
                                crystal: ship.cost.crystal * (quantity > 0 ? quantity : 1),
                                deuterium: ship.cost.deuterium * (quantity > 0 ? quantity : 1),
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
                                '${quantity > 0 ? quantity : 1}',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 16),
                              onPressed: () => onQuantityChanged((quantity > 0 ? quantity : 1) + 1),
                              color: AppColors.textMuted,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
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
