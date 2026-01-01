import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart';

class GalaxyTab extends ConsumerStatefulWidget {
  const GalaxyTab({super.key});

  @override
  ConsumerState<GalaxyTab> createState() => _GalaxyTabState();
}

class _GalaxyTabState extends ConsumerState<GalaxyTab> {
  int _galaxy = 1;
  int _system = 1;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final gameState = ref.read(gameProvider);
      if (gameState.coordinate != null) {
        final parts = gameState.coordinate!.split(':');
        if (parts.length >= 2) {
          _galaxy = int.tryParse(parts[0]) ?? 1;
          _system = int.tryParse(parts[1]) ?? 1;
        }
      }
      _initialized = true;
      
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(gameProvider.notifier).loadGalaxy(_galaxy, _system);
      });
    }
  }

  void _search() {
    ref.read(gameProvider.notifier).loadGalaxy(_galaxy, _system);
  }

  void _previousSystem() {
    if (_system > 1) {
      setState(() => _system--);
      _search();
    }
  }

  void _nextSystem() {
    if (_system < 499) {
      setState(() => _system++);
      _search();
    }
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          color: AppColors.surface,
          child: Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Text('은하:', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 50,
                      child: TextField(
                        controller: TextEditingController(text: '$_galaxy'),
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                          isDense: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(4)),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                            borderSide: BorderSide(color: AppColors.panelBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                            borderSide: BorderSide(color: AppColors.accent),
                          ),
                        ),
                        onSubmitted: (value) {
                          final g = int.tryParse(value);
                          if (g != null && g >= 1 && g <= 9) {
                            setState(() => _galaxy = g);
                            _search();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: Icon(Icons.chevron_left, color: AppColors.textMuted, size: 20),
                      onPressed: _previousSystem,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                    Text(
                      '태양계 $_system',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
                      onPressed: _nextSystem,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.search, color: AppColors.accent, size: 20),
                onPressed: _search,
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => ref.read(gameProvider.notifier).loadGalaxy(_galaxy, _system),
            color: AppColors.accent,
            backgroundColor: AppColors.surface,
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: 15,
              itemBuilder: (context, index) {
                final position = index + 1;
                final planet = gameState.galaxyPlanets.firstWhere(
                  (p) => p.position == position,
                  orElse: () => PlanetInfo(
                    position: position,
                    coordinate: '$_galaxy:$_system:$position',
                  ),
                );
                return _PlanetRow(
                  position: position,
                  planet: planet,
                  onAttack: planet.playerName != null && !planet.isOwnPlanet
                      ? () => _showAttackDialog(context, planet)
                      : null,
                  onRecycle: planet.hasDebris
                      ? () => _showRecycleDialog(context, planet)
                      : null,
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  void _showRecycleDialog(BuildContext context, PlanetInfo planet) {
    final debris = planet.debrisAmount;
    final metal = debris?['metal'] ?? 0;
    final crystal = debris?['crystal'] ?? 0;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Text(
          '데브리 필드: ${planet.coordinate}',
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('보유 자원:', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 8),
            Text('메탈: $metal', style: TextStyle(color: AppColors.resourceMetal, fontSize: 12)),
            Text('크리스탈: $crystal', style: TextStyle(color: AppColors.resourceCrystal, fontSize: 12)),
            const SizedBox(height: 16),
            const Text(
              '수확선을 보내 이 자원을 수집하시겠습니까?\n함대 탭에서 수확선을 선택하여 출격할 수 있습니다.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _dispatchRecyclers(planet);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.positive,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('수확선 출격'),
          ),
        ],
      ),
    );
  }

  void _dispatchRecyclers(PlanetInfo planet) {
    final gameState = ref.read(gameProvider);
    final recyclers = gameState.fleet.firstWhere((f) => f.type == 'recycler', orElse: () => FleetInfo(type: 'recycler', name: '수확선', count: 0, cost: Cost(), stats: FleetStats()));
    
    if (recyclers.count <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('수확선이 없습니다. 먼저 수확선을 건조하세요.')),
      );
      return;
    }

    final debris = planet.debrisAmount;
    final totalDebris = (debris?['metal'] ?? 0) + (debris?['crystal'] ?? 0);
    final capacityPerRecycler = 20000;
    
    int needed = (totalDebris / capacityPerRecycler).ceil();
    if (needed == 0) needed = 1;
    final toSend = needed > recyclers.count ? recyclers.count : needed;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: const Text('수확선 출격 확인', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
        content: Text('수확선 $toSend대를 ${planet.coordinate}로 보내시겠습니까?', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('취소', style: TextStyle(color: AppColors.textMuted))),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(gameProvider.notifier).recycle(planet.coordinate, {'recycler': toSend});
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${planet.coordinate}로 수확선 ${toSend}대가 출격했습니다')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('출격'),
          ),
        ],
      ),
    );
  }

  void _showAttackDialog(BuildContext context, PlanetInfo planet) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Text(
          '공격: ${planet.coordinate}',
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
        ),
        content: Text(
          '${planet.playerName}의 행성을 공격하시겠습니까?\n\n함대 탭에서 함선을 선택하여 출격할 수 있습니다.',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(navigationProvider.notifier).setAttackTarget(planet.coordinate);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.negative,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('공격 지점으로 설정'),
          ),
        ],
      ),
    );
  }
}

class _PlanetRow extends StatelessWidget {
  final int position;
  final PlanetInfo planet;
  final VoidCallback? onAttack;
  final VoidCallback? onRecycle;

  const _PlanetRow({
    required this.position,
    required this.planet,
    this.onAttack,
    this.onRecycle,
  });

  @override
  Widget build(BuildContext context) {
    final isEmpty = planet.playerName == null;
    final isOwn = planet.isOwnPlanet;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isOwn 
            ? AppColors.accent.withOpacity(0.08)
            : AppColors.panelBackground,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isOwn ? AppColors.accent.withOpacity(0.3) : AppColors.panelBorder,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: isEmpty 
                    ? AppColors.background
                    : isOwn
                        ? AppColors.accent
                        : AppColors.surfaceLight,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                '$position',
                style: TextStyle(
                  color: isEmpty ? AppColors.textMuted : AppColors.textPrimary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: InkWell(
                onTap: onAttack,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEmpty ? '빈 슬롯' : planet.playerName!,
                      style: TextStyle(
                        color: isEmpty 
                            ? AppColors.textMuted
                            : isOwn
                                ? AppColors.accent
                                : AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      planet.coordinate,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (planet.hasMoon)
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Icon(Icons.brightness_3, size: 14, color: AppColors.textMuted),
                  ),
                if (planet.hasDebris)
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: InkWell(
                      onTap: onRecycle,
                      child: Icon(Icons.blur_on, size: 14, color: AppColors.warning),
                    ),
                  ),
                if (isOwn)
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Icon(
                      Icons.home,
                      size: 16,
                      color: AppColors.accent,
                    ),
                  ),
                if (!isEmpty && !isOwn)
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: InkWell(
                      onTap: onAttack,
                      child: Icon(
                        Icons.gps_fixed,
                        size: 16,
                        color: AppColors.negative,
                      ),
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
