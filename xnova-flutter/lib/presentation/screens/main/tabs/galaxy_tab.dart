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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(gameProvider.notifier).loadGalaxy(_galaxy, _system);
    });
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
        // 검색 바
        Container(
          padding: const EdgeInsets.all(12),
          color: AppColors.panelBackground,
          child: Row(
            children: [
              // 은하
              Expanded(
                child: Row(
                  children: [
                    const Text('은하:', style: TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 60,
                      child: TextField(
                        controller: TextEditingController(text: '$_galaxy'),
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          isDense: true,
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
              // 시스템
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left, color: AppColors.textSecondary),
                      onPressed: _previousSystem,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                    Text(
                      '태양계 $_system',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
                      onPressed: _nextSystem,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
              ),
              // 검색 버튼
              IconButton(
                icon: const Icon(Icons.search, color: AppColors.ogameGreen),
                onPressed: _search,
              ),
            ],
          ),
        ),
        // 행성 목록
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => ref.read(gameProvider.notifier).loadGalaxy(_galaxy, _system),
            color: AppColors.ogameGreen,
            backgroundColor: AppColors.panelBackground,
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
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  void _showAttackDialog(BuildContext context, PlanetInfo planet) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: Text(
          '공격: ${planet.coordinate}',
          style: const TextStyle(color: AppColors.textPrimary),
        ),
        content: Text(
          '${planet.playerName}의 행성을 공격하시겠습니까?\n\n함대 탭에서 함선을 선택하여 출격할 수 있습니다.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: 함대 탭으로 이동 + 좌표 자동 입력
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorRed,
            ),
            child: const Text('함대 탭으로 이동'),
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

  const _PlanetRow({
    required this.position,
    required this.planet,
    this.onAttack,
  });

  @override
  Widget build(BuildContext context) {
    final isEmpty = planet.playerName == null;
    final isOwn = planet.isOwnPlanet;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isOwn 
            ? AppColors.ogameGreen.withOpacity(0.1)
            : AppColors.panelBackground,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isOwn ? AppColors.ogameGreen : AppColors.panelBorder,
        ),
      ),
      child: InkWell(
        onTap: onAttack,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              // 위치
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isEmpty 
                      ? AppColors.ogameBlack
                      : isOwn
                          ? AppColors.ogameGreen
                          : AppColors.panelHeader,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$position',
                  style: TextStyle(
                    color: isEmpty ? AppColors.textDisabled : AppColors.textPrimary,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // 행성 정보
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEmpty ? '빈 슬롯' : planet.playerName!,
                      style: TextStyle(
                        color: isEmpty 
                            ? AppColors.textDisabled
                            : isOwn
                                ? AppColors.ogameGreen
                                : AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      planet.coordinate,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              // 상태 아이콘들
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (planet.hasMoon)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Text('🌙', style: TextStyle(fontSize: 16)),
                    ),
                  if (planet.hasDebris)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Text('💥', style: TextStyle(fontSize: 16)),
                    ),
                  if (isOwn)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(
                        Icons.home,
                        size: 18,
                        color: AppColors.ogameGreen,
                      ),
                    ),
                  if (!isEmpty && !isOwn)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(
                        Icons.gps_fixed,
                        size: 18,
                        color: AppColors.errorRed,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

