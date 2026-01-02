import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/services/token_service.dart';

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
                    Text('태양계:', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    const SizedBox(width: 4),
                    SizedBox(
                      width: 50,
                      child: TextField(
                        controller: TextEditingController(text: '$_system'),
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
                          final s = int.tryParse(value);
                          if (s != null && s >= 1 && s <= 499) {
                            setState(() => _system = s);
                            _search();
                          }
                        },
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
                  onSpy: planet.playerName != null && !planet.isOwnPlanet
                      ? () => _showSpyDialog(context, planet)
                      : null,
                  onMessage: planet.playerName != null && !planet.isOwnPlanet
                      ? () => _showMessageDialog(context, planet)
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

  void _showSpyDialog(BuildContext context, PlanetInfo planet) {
    final gameState = ref.read(gameProvider);
    final probes = gameState.fleet.firstWhere(
      (f) => f.type == 'espionageProbe',
      orElse: () => FleetInfo(type: 'espionageProbe', name: '무인정찰기', count: 0, cost: Cost(), stats: FleetStats()),
    );
    
    int probeCount = 1;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.panelBackground,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          title: Row(
            children: [
              Icon(Icons.radar, color: AppColors.resourceCrystal, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '정찰: ${planet.coordinate}',
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${planet.playerName}의 행성을 정찰합니다.',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text('보유 정찰기: ', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  Text('${probes.count}대', style: TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text('출격 수: ', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  IconButton(
                    icon: Icon(Icons.remove_circle_outline, color: AppColors.textMuted, size: 20),
                    onPressed: probeCount > 1 ? () => setDialogState(() => probeCount--) : null,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '$probeCount',
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.add_circle_outline, color: AppColors.textMuted, size: 20),
                    onPressed: probeCount < probes.count ? () => setDialogState(() => probeCount++) : null,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('💡 팁', style: TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      '• 더 많은 정찰기 = 더 자세한 정보\n'
                      '• 적 함대가 많으면 정찰기 파괴 위험↑\n'
                      '• 정탐기술이 높으면 더 적은 정찰기로 OK',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 10, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('취소', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: probes.count >= probeCount ? () async {
                Navigator.pop(context);
                _executeSpy(planet, probeCount);
              } : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.resourceCrystal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('정찰 시작'),
            ),
          ],
        ),
      ),
    );
  }

  void _executeSpy(PlanetInfo planet, int probeCount) async {
    final result = await ref.read(gameProvider.notifier).spyOnPlanet(planet.coordinate, probeCount);
    
    if (result == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('정찰 요청에 실패했습니다.')),
      );
      return;
    }

    if (!result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.error ?? '정찰에 실패했습니다.')),
      );
      return;
    }

    // 성공 메시지
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message ?? '정찰 완료! 메시지함에서 보고서를 확인하세요.'),
        backgroundColor: AppColors.positive,
      ),
    );
  }

  void _showMessageDialog(BuildContext context, PlanetInfo planet) {
    final titleController = TextEditingController();
    final contentController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Row(
          children: [
            Icon(Icons.mail_outline, color: AppColors.accent, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${planet.playerName}에게 메시지',
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '좌표: ${planet.coordinate}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: titleController,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  labelText: '제목',
                  labelStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: AppColors.panelBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: AppColors.panelBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: AppColors.accent),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                maxLength: 100,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: contentController,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  labelText: '내용',
                  labelStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: AppColors.panelBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: AppColors.panelBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: AppColors.accent),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                maxLines: 5,
                maxLength: 2000,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _sendMessage(planet, titleController.text, contentController.text);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('보내기'),
          ),
        ],
      ),
    );
  }

  void _sendMessage(PlanetInfo planet, String title, String content) async {
    if (title.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('제목을 입력해주세요.')),
      );
      return;
    }
    if (content.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('내용을 입력해주세요.')),
      );
      return;
    }

    try {
      final apiService = ApiService(tokenService: TokenService());
      final result = await apiService.sendMessage(
        receiverCoordinate: planet.coordinate,
        title: title.trim(),
        content: content.trim(),
      );

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${planet.playerName}에게 메시지를 보냈습니다.'),
            backgroundColor: AppColors.positive,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? '메시지 전송에 실패했습니다.')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('메시지 전송 중 오류가 발생했습니다.')),
      );
    }
  }
}

class _PlanetRow extends StatelessWidget {
  final int position;
  final PlanetInfo planet;
  final VoidCallback? onAttack;
  final VoidCallback? onRecycle;
  final VoidCallback? onSpy;
  final VoidCallback? onMessage;

  const _PlanetRow({
    required this.position,
    required this.planet,
    this.onAttack,
    this.onRecycle,
    this.onSpy,
    this.onMessage,
  });

  /// 활동 상태 표시 위젯
  Widget _buildActivityIndicator(PlanetInfo planet) {
    final status = planet.activityStatus;
    final text = planet.activityText;

    // 온라인 (10분 이내): 초록색 점
    if (status == 'online') {
      return Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: AppColors.positive,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.positive.withOpacity(0.5),
              blurRadius: 4,
              spreadRadius: 1,
            ),
          ],
        ),
      );
    }

    // 최근 활동 (11분~59분): 회색 글씨
    if (status == 'recent' && text != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
        decoration: BoxDecoration(
          color: AppColors.textMuted.withOpacity(0.15),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          text,
          style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 9,
            fontWeight: FontWeight.w500,
          ),
        ),
      );
    }

    // 1시간~12시간: 회색 글씨
    if (status == 'hours' && text != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
        decoration: BoxDecoration(
          color: AppColors.textMuted.withOpacity(0.1),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: AppColors.textMuted.withOpacity(0.7),
            fontSize: 9,
            fontWeight: FontWeight.w500,
          ),
        ),
      );
    }

    // 7일 이상 접속 없음: 회색 점
    if (status == 'inactive') {
      return Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: AppColors.textMuted.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
      );
    }

    // 12시간~7일: 표시 없음
    return const SizedBox.shrink();
  }

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
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // 행성 이름 + 좌표 (왼쪽)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // 행성 이름
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
                          // 좌표
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
                    // 활동 상태 표시 (오른쪽, 세로 가운데)
                    if (!isEmpty && !isOwn)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: _buildActivityIndicator(planet),
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
                if (!isEmpty && !isOwn) ...[
                  // 메시지 아이콘
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: InkWell(
                      onTap: onMessage,
                      child: Icon(
                        Icons.mail_outline,
                        size: 16,
                        color: AppColors.accent,
                      ),
                    ),
                  ),
                  // 정찰 아이콘
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: InkWell(
                      onTap: onSpy,
                      child: Icon(
                        Icons.radar,
                        size: 16,
                        color: AppColors.resourceCrystal,
                      ),
                    ),
                  ),
                  // 공격 아이콘
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
              ],
            ),
          ],
        ),
      ),
    );
  }
}
