import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/providers.dart';
import '../../../data/models/models.dart';
import '../../widgets/resource_bar.dart';
import '../../widgets/guide_tutorial_overlay.dart';
import '../../widgets/guide_steps_data.dart';
import '../settings/settings_screen.dart';
import 'tabs/overview_tab.dart';
import 'tabs/buildings_tab.dart';
import 'tabs/resources_tab.dart';
import 'tabs/research_tab.dart';
import 'tabs/fleet_tab.dart';
import 'tabs/defense_tab.dart';
import 'tabs/fleet_movement_tab.dart';
import 'tabs/galaxy_tab.dart';
import 'tabs/messages_tab.dart';
import 'tabs/ranking_tab.dart';
import 'tabs/techtree_tab.dart';
import 'tabs/simulator_tab.dart';
import '../chat/chat_screen.dart';

extension MainTabExtension on MainTab {
  IconData get icon {
    switch (this) {
      case MainTab.overview: return Icons.dashboard_outlined;
      case MainTab.buildings: return Icons.apartment_outlined;
      case MainTab.resources: return Icons.trending_up_outlined;
      case MainTab.research: return Icons.science_outlined;
      case MainTab.shipyard: return Icons.rocket_launch_outlined;
      case MainTab.defense: return Icons.shield_outlined;
      case MainTab.fleet: return Icons.flight_outlined;
      case MainTab.galaxy: return Icons.blur_circular_outlined;
      case MainTab.messages: return Icons.mail_outline;
      case MainTab.ranking: return Icons.leaderboard_outlined;
      case MainTab.techtree: return Icons.account_tree_outlined;
      case MainTab.simulator: return Icons.analytics_outlined;
    }
  }

  String get label {
    switch (this) {
      case MainTab.overview: return '홈';
      case MainTab.buildings: return '건물';
      case MainTab.resources: return '자원';
      case MainTab.research: return '연구';
      case MainTab.shipyard: return '조선소';
      case MainTab.defense: return '방어';
      case MainTab.fleet: return '함대';
      case MainTab.galaxy: return '은하계';
      case MainTab.messages: return '메시지';
      case MainTab.ranking: return '랭킹';
      case MainTab.techtree: return '테크트리';
      case MainTab.simulator: return '시뮬레이터';
    }
  }
}

class MainScreen extends ConsumerStatefulWidget {
  final VoidCallback onLogout;

  const MainScreen({super.key, required this.onLogout});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> with WidgetsBindingObserver {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  // 가이드 튜토리얼용 GlobalKey들
  final GlobalKey _resourceBarKey = GlobalKey();
  final GlobalKey _menuButtonKey = GlobalKey();
  final GlobalKey _chatButtonKey = GlobalKey();
  final GlobalKey _tabContentKey = GlobalKey(); // 탭 컨텐츠 영역
  
  // 가이드 표시 상태
  bool _showGuide = false;
  
  // 설정 화면 표시 상태
  bool _showSettings = false;
  
  // 채팅 화면 표시 상태
  bool _showChat = false;
  
  // 관리자 여부
  bool _isAdmin = false;
  
  // 자동 완료 체크 타이머
  Timer? _autoCompleteTimer;
  
  // 마지막 백그라운드 진입 시간
  DateTime? _lastPausedTime;

  @override
  void initState() {
    super.initState();
    // 앱 Lifecycle 관찰자 등록
    WidgetsBinding.instance.addObserver(this);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(gameProvider.notifier).loadAllData();
      ref.read(gameProvider.notifier).loadProfile();
      ref.read(messageProvider.notifier).loadMessages(); // 메시지 로드
      _checkAdminStatus(); // 관리자 권한 확인
      
      // 1초마다 자동 완료 체크 시작
      _startAutoCompleteTimer();
    });
  }
  
  Future<void> _checkAdminStatus() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final isAdmin = await apiService.checkAdmin();
      if (mounted) {
        setState(() {
          _isAdmin = isAdmin;
        });
      }
    } catch (e) {
      // ignore
    }
  }
  
  @override
  void dispose() {
    // 앱 Lifecycle 관찰자 해제
    WidgetsBinding.instance.removeObserver(this);
    _autoCompleteTimer?.cancel();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        // 앱이 백그라운드로 갈 때 시간 기록
        _lastPausedTime = DateTime.now();
        _autoCompleteTimer?.cancel();
        break;
        
      case AppLifecycleState.resumed:
        // 앱이 포그라운드로 돌아왔을 때
        _onAppResumed();
        break;
        
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        // 앱이 완전히 종료될 때
        _autoCompleteTimer?.cancel();
        break;
    }
  }
  
  /// 앱이 포그라운드로 돌아왔을 때 실행
  Future<void> _onAppResumed() async {
    debugPrint('[MainScreen] 백그라운드에서 복귀');
    
    // 1. 인증 상태 확인
    await ref.read(authProvider.notifier).checkAuth();
    final authState = ref.read(authProvider);
    
    if (!authState.isAuthenticated) {
      // 인증 실패 시 로그아웃 처리
      debugPrint('[MainScreen] 인증 실패 - 로그아웃');
      widget.onLogout();
      return;
    }
    
    // 2. 소켓 재연결 (백그라운드에서 끊어졌을 수 있음)
    debugPrint('[MainScreen] 소켓 재연결 시도');
    await ref.read(chatProvider.notifier).reconnect();
    
    // 3. 전체 데이터 재로드
    debugPrint('[MainScreen] 게임 데이터 재로드');
    await ref.read(gameProvider.notifier).loadAllData();
    await ref.read(gameProvider.notifier).loadProfile();
    await ref.read(messageProvider.notifier).loadMessages();
    
    // 4. 자동 완료 타이머 재시작
    _startAutoCompleteTimer();
    _lastPausedTime = null;
  }
  
  void _startAutoCompleteTimer() {
    _autoCompleteTimer?.cancel();
    _autoCompleteTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      ref.read(gameProvider.notifier).checkAndAutoComplete();
    });
  }

  // 탭 전환 시 데이터 새로고침
  void _onTabChanged(MainTab tab) {
    ref.read(navigationProvider.notifier).setTab(tab);
    
    // 탭별 데이터 새로고침
    switch (tab) {
      case MainTab.messages:
        ref.read(messageProvider.notifier).loadMessages();
        break;
      case MainTab.overview:
      case MainTab.buildings:
      case MainTab.research:
      case MainTab.fleet:
      case MainTab.defense:
        ref.read(gameProvider.notifier).loadAllData();
        break;
      default:
        break;
    }
  }

  // 활성 행성 이름 가져오기
  String _getActivePlanetName(GameState gameState) {
    if (gameState.myPlanets.isEmpty) {
      return gameState.playerName ?? '행성';
    }
    final activePlanet = gameState.myPlanets.firstWhere(
      (p) => p.id == gameState.activePlanetId,
      orElse: () => gameState.myPlanets.first,
    );
    return activePlanet.name.isEmpty ? '행성' : activePlanet.name;
  }

  // 행성 선택 바텀시트
  void _showPlanetSelector(BuildContext parentContext) {
    final gameState = ref.read(gameProvider);
    final scaffoldMessenger = ScaffoldMessenger.of(parentContext); // 미리 저장
    
    showModalBottomSheet(
      context: parentContext,
      backgroundColor: AppColors.panelBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '행성 선택',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.settings, color: AppColors.textMuted, size: 20),
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    _showPlanetManagement(parentContext);
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (gameState.myPlanets.isEmpty)
              const Padding(
                padding: EdgeInsets.all(20),
                child: Center(
                  child: Text(
                    '행성 정보를 불러오는 중...',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                ),
              )
            else
              ...gameState.myPlanets.map((planet) => _PlanetListItem(
                planet: planet,
                isActive: planet.id == gameState.activePlanetId,
                onTap: () async {
                  Navigator.pop(sheetContext);
                  if (planet.id != gameState.activePlanetId) {
                    final success = await ref.read(gameProvider.notifier).switchPlanet(planet.id);
                    if (success && mounted) {
                      scaffoldMessenger.showSnackBar(
                        SnackBar(
                          content: Text('${planet.name}으로 전환했습니다.'),
                          backgroundColor: AppColors.positive,
                        ),
                      );
                    }
                  }
                },
              )),
            SizedBox(height: MediaQuery.of(sheetContext).padding.bottom),
          ],
        ),
      ),
    );
  }

  // 행성 관리 다이얼로그
  void _showPlanetManagement(BuildContext parentContext) {
    final gameState = ref.read(gameProvider);
    
    showModalBottomSheet(
      context: parentContext,
      backgroundColor: AppColors.panelBackground,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (innerContext, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '행성 관리',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                '행성 이름을 변경하거나 식민지를 포기할 수 있습니다.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: gameState.myPlanets.length,
                  itemBuilder: (itemContext, index) {
                    final planet = gameState.myPlanets[index];
                    return _PlanetManageItem(
                      planet: planet,
                      onRename: () => _showRenameDialog(sheetContext, planet),
                      onAbandon: planet.isHomePlanet ? null : () => _showAbandonDialog(sheetContext, planet),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 행성 이름 변경 다이얼로그
  void _showRenameDialog(BuildContext context, MyPlanet planet) {
    final controller = TextEditingController(text: planet.name);
    
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text('행성 이름 변경', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: '새 이름',
            hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.5)),
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
          ),
          maxLength: 20,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final newName = controller.text.trim();
              if (newName.isEmpty) return;
              Navigator.pop(dialogContext);
              Navigator.pop(context); // 관리 시트도 닫기
              
              final success = await ref.read(gameProvider.notifier).renamePlanet(planet.id, newName);
              if (success && mounted) {
                ScaffoldMessenger.of(this.context).showSnackBar(
                  const SnackBar(content: Text('행성 이름이 변경되었습니다.'), backgroundColor: AppColors.positive),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('변경'),
          ),
        ],
      ),
    );
  }

  // 행성 포기 다이얼로그
  void _showAbandonDialog(BuildContext context, MyPlanet planet) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: Row(
          children: [
            Icon(Icons.warning_amber, color: AppColors.negative, size: 20),
            const SizedBox(width: 8),
            const Text('행성 포기', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${planet.name} (${planet.coordinate})을(를) 정말 포기하시겠습니까?',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.negative.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.negative.withOpacity(0.3)),
              ),
              child: const Text(
                '⚠️ 포기한 행성은 복구할 수 없습니다.\n모든 건물, 자원, 함대, 방어시설이 사라집니다.',
                style: TextStyle(color: AppColors.negative, fontSize: 11),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              Navigator.pop(context); // 관리 시트도 닫기
              
              final success = await ref.read(gameProvider.notifier).abandonPlanet(planet.id);
              if (mounted) {
                if (success) {
                  ScaffoldMessenger.of(this.context).showSnackBar(
                    const SnackBar(content: Text('행성을 포기했습니다.'), backgroundColor: AppColors.positive),
                  );
                } else {
                  final error = ref.read(gameProvider).error;
                  ScaffoldMessenger.of(this.context).showSnackBar(
                    SnackBar(content: Text(error ?? '행성 포기에 실패했습니다.')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.negative),
            child: const Text('포기'),
          ),
        ],
      ),
    );
  }

  // 관리자 전체 공지 다이얼로그
  void _showBroadcastDialog() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: Row(
          children: [
            Icon(Icons.campaign, color: AppColors.warning, size: 20),
            const SizedBox(width: 8),
            const Text(
              '전체 공지 발송',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
            ),
          ],
        ),
        content: SizedBox(
          width: MediaQuery.of(context).size.width * 0.8,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                ),
                child: const Text(
                  '⚠️ 모든 유저에게 공지 메시지가 발송됩니다.',
                  style: TextStyle(color: AppColors.warning, fontSize: 11),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: titleController,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: '제목',
                  hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.5)),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: contentController,
                maxLines: 5,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: '공지 내용',
                  hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.5)),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.send, size: 16),
            label: const Text('발송'),
            onPressed: () async {
              final title = titleController.text.trim();
              final content = contentController.text.trim();
              
              if (title.isEmpty || content.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('제목과 내용을 입력해주세요.')),
                );
                return;
              }

              Navigator.pop(dialogContext);

              try {
                final apiService = ref.read(apiServiceProvider);
                final result = await apiService.broadcastMessage(
                  title: title,
                  content: content,
                );

                if (result['success'] == true) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result['message'] ?? '공지가 발송되었습니다.'),
                      backgroundColor: AppColors.positive,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(result['message'] ?? '발송에 실패했습니다.')),
                  );
                }
              } catch (e) {
                print('Broadcast error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('공지 발송 중 오류: $e')),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.warning,
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);
    final authState = ref.watch(authProvider);
    final navState = ref.watch(navigationProvider);

    // 설정 화면 표시
    if (_showSettings) {
      return SettingsScreen(
        onClose: () {
          setState(() {
            _showSettings = false;
          });
        },
        onLogout: () {
          setState(() {
            _showSettings = false;
          });
          ref.read(authProvider.notifier).logout();
          widget.onLogout();
        },
      );
    }

    // 채팅 화면 표시
    if (_showChat) {
      return ChatScreen(
        onClose: () {
          setState(() {
            _showChat = false;
          });
        },
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      drawer: _buildDrawer(authState, gameState, navState),
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                _buildTopBar(gameState),
                ResourceBar(
                  key: _resourceBarKey,
                  resources: gameState.resources,
                  production: gameState.production,
                  storageCapacity: gameState.storageCapacity,
                  energyRatio: gameState.energyRatio,
                ),
                Expanded(
                  child: Container(
                    key: _tabContentKey,
                    child: _buildTabContent(navState.selectedTab),
                  ),
                ),
              ],
            ),
          ),
          // 가이드 오버레이
          if (_showGuide)
            GuideTutorialOverlay(
              steps: GuideStepsData(
                resourceBarKey: _resourceBarKey,
                menuButtonKey: _menuButtonKey,
                chatButtonKey: _chatButtonKey,
                tabContentKey: _tabContentKey,
              ).getSteps(),
              onComplete: () {
                setState(() {
                  _showGuide = false;
                });
              },
              onSkip: () {
                setState(() {
                  _showGuide = false;
                });
              },
              onStepChanged: (tabName) {
                if (tabName != null) {
                  final tab = _getTabFromName(tabName);
                  if (tab != null) {
                    _onTabChanged(tab);
                  }
                }
              },
            ),
        ],
      ),
    );
  }
  
  void _startGuide() {
    Navigator.pop(context); // Drawer 닫기
    setState(() {
      _showGuide = true;
    });
  }
  
  MainTab? _getTabFromName(String tabName) {
    switch (tabName) {
      case 'overview': return MainTab.overview;
      case 'buildings': return MainTab.buildings;
      case 'research': return MainTab.research;
      case 'shipyard': return MainTab.shipyard;
      case 'defense': return MainTab.defense;
      case 'fleet': return MainTab.fleet;
      case 'galaxy': return MainTab.galaxy;
      case 'messages': return MainTab.messages;
      case 'techtree': return MainTab.techtree;
      default: return null;
    }
  }

  Widget _buildTopBar(GameState gameState) {
    final messageState = ref.watch(messageProvider);
    final unreadCount = messageState.messages.where((m) => !m.isRead).length;
    
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          IconButton(
            key: _menuButtonKey,
            icon: const Icon(Icons.menu, color: AppColors.textSecondary, size: 22),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          // XNOVA 로고
          GestureDetector(
            onTap: () => _onTabChanged(MainTab.overview),
            child: Text(
              'XNOVA',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.accent,
                letterSpacing: 2,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // 행성 선택 버튼
          Expanded(
            child: GestureDetector(
              onTap: () => _showPlanetSelector(context),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.panelBackground,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.panelBorder.withOpacity(0.5)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      gameState.myPlanets.any((p) => p.id == gameState.activePlanetId && p.isHomePlanet)
                          ? Icons.home_rounded
                          : Icons.public,
                      size: 14,
                      color: AppColors.accent,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _getActivePlanetName(gameState),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            gameState.coordinate ?? '',
                            style: const TextStyle(
                              fontSize: 9,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.unfold_more, size: 16, color: AppColors.textMuted),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),
          // 메시지 아이콘 (읽지 않은 메시지 배지)
          Stack(
            children: [
              GestureDetector(
                onTap: () => _onTabChanged(MainTab.messages),
                onLongPress: _isAdmin ? () => _showBroadcastDialog() : null,
                child: IconButton(
                  icon: Icon(
                    _isAdmin 
                        ? Icons.campaign  // 관리자는 확성기 아이콘
                        : (unreadCount > 0 ? Icons.mail : Icons.mail_outline),
                    color: _isAdmin 
                        ? AppColors.warning  // 관리자는 노란색
                        : (unreadCount > 0 ? AppColors.accent : AppColors.textMuted),
                    size: 20,
                  ),
                  onPressed: () => _onTabChanged(MainTab.messages),
                ),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.negative,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      unreadCount > 9 ? '9+' : '$unreadCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              // 관리자 배지
              if (_isAdmin)
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppColors.warning,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'ADM',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 6,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            key: _chatButtonKey,
            icon: const Icon(Icons.chat_bubble_outline, color: AppColors.accent, size: 20),
            onPressed: () {
              setState(() {
                _showChat = true;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(AuthState authState, GameState gameState, NavigationState navState) {
    return Drawer(
      backgroundColor: AppColors.drawerBackground,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 24,
              left: 20,
              right: 20,
              bottom: 20,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(
                bottom: BorderSide(color: AppColors.panelBorder, width: 1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'XNOVA',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accent,
                    letterSpacing: 3,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  authState.user?.playerName ?? gameState.playerName ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  gameState.coordinate ?? authState.user?.coordinate ?? '',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Builder(
              builder: (context) {
                final messageState = ref.watch(messageProvider);
                final unreadCount = messageState.messages.where((m) => !m.isRead).length;
                
                return ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: MainTab.values
                      .where((tab) => tab != MainTab.simulator && tab != MainTab.messages)  // 시뮬레이터, 메시지 탭 숨김
                      .map((tab) {
                    return _DrawerMenuItem(
                      tab: tab,
                      isSelected: navState.selectedTab == tab,
                      badgeCount: tab == MainTab.messages ? unreadCount : 0,
                      onTap: () {
                        _onTabChanged(tab);
                        Navigator.pop(context);
                      },
                    );
                  }).toList(),
                );
              },
            ),
          ),
          Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: AppColors.panelBorder, width: 1),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 도움말 버튼
                ListTile(
                  dense: true,
                  visualDensity: const VisualDensity(vertical: -2),
                  leading: const Icon(Icons.help_outline_rounded, color: AppColors.accent, size: 20),
                  title: const Text(
                    '도움말',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      '가이드',
                      style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  onTap: _startGuide,
                ),
                // 설정 버튼
                ListTile(
                  dense: true,
                  visualDensity: const VisualDensity(vertical: -2),
                  leading: const Icon(Icons.settings_rounded, color: AppColors.textSecondary, size: 20),
                  title: const Text(
                    '설정',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    setState(() {
                      _showSettings = true;
                    });
                  },
                ),
                // 로그아웃 버튼
                ListTile(
                  dense: true,
                  visualDensity: const VisualDensity(vertical: -2),
                  leading: const Icon(Icons.logout, color: AppColors.negative, size: 20),
                  title: const Text(
                    '로그아웃',
                    style: TextStyle(color: AppColors.negative, fontSize: 13),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    ref.read(authProvider.notifier).logout();
                    widget.onLogout();
                  },
                ),
              ],
            ),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }

  Widget _buildTabContent(MainTab selectedTab) {
    switch (selectedTab) {
      case MainTab.overview:
        return const OverviewTab();
      case MainTab.buildings:
        return const BuildingsTab();
      case MainTab.resources:
        return const ResourcesTab();
      case MainTab.research:
        return const ResearchTab();
      case MainTab.shipyard:
        return const FleetTab();
      case MainTab.defense:
        return const DefenseTab();
      case MainTab.fleet:
        return const FleetMovementTab();
      case MainTab.galaxy:
        return const GalaxyTab();
      case MainTab.messages:
        return const MessagesTab();
      case MainTab.ranking:
        return const RankingTab();
      case MainTab.techtree:
        return const TechtreeTab();
      case MainTab.simulator:
        return const SimulatorTab();
    }
  }
}

class _DrawerMenuItem extends StatelessWidget {
  final MainTab tab;
  final bool isSelected;
  final VoidCallback onTap;
  final int badgeCount;

  const _DrawerMenuItem({
    required this.tab,
    required this.isSelected,
    required this.onTap,
    this.badgeCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: isSelected ? AppColors.drawerItemSelected : Colors.transparent,
        borderRadius: BorderRadius.circular(6),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(6),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: isSelected ? AppColors.accent.withOpacity(0.3) : Colors.transparent,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  tab.icon,
                  size: 18,
                  color: isSelected ? AppColors.accent : AppColors.textMuted,
                ),
                const SizedBox(width: 14),
                Text(
                  tab.label,
                  style: TextStyle(
                    color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                  ),
                ),
                // 안 읽은 메시지 배지 (메시지 텍스트 오른쪽)
                if (badgeCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.negative,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badgeCount > 99 ? '99+' : '$badgeCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// 행성 선택 리스트 아이템
class _PlanetListItem extends StatelessWidget {
  final MyPlanet planet;
  final bool isActive;
  final VoidCallback onTap;

  const _PlanetListItem({
    required this.planet,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: isActive ? AppColors.accent.withOpacity(0.15) : AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? AppColors.accent : AppColors.panelBorder,
          ),
        ),
        child: Row(
          children: [
            Icon(
              planet.isHomePlanet ? Icons.home : Icons.public,
              size: 18,
              color: isActive ? AppColors.accent : AppColors.textMuted,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        planet.name,
                        style: TextStyle(
                          color: isActive ? AppColors.accent : AppColors.textPrimary,
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                      if (planet.isHomePlanet) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '모행성',
                            style: TextStyle(color: AppColors.warning, fontSize: 9, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${planet.coordinate} · 필드 ${planet.usedFields}/${planet.maxFields}',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                  ),
                ],
              ),
            ),
            if (isActive)
              const Icon(Icons.check_circle, size: 18, color: AppColors.accent),
          ],
        ),
      ),
    );
  }
}

// 행성 관리 리스트 아이템
class _PlanetManageItem extends StatelessWidget {
  final MyPlanet planet;
  final VoidCallback onRename;
  final VoidCallback? onAbandon;

  const _PlanetManageItem({
    required this.planet,
    required this.onRename,
    this.onAbandon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Row(
        children: [
          Icon(
            planet.isHomePlanet ? Icons.home : Icons.public,
            size: 24,
            color: planet.isHomePlanet ? AppColors.warning : AppColors.textMuted,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      planet.name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                    if (planet.isHomePlanet) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '모행성',
                          style: TextStyle(color: AppColors.warning, fontSize: 9, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '좌표: ${planet.coordinate}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
                Text(
                  '필드: ${planet.usedFields}/${planet.maxFields} · 온도: ${planet.temperature}°C',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.edit, size: 18),
                color: AppColors.accent,
                onPressed: onRename,
                tooltip: '이름 변경',
              ),
              if (onAbandon != null)
                IconButton(
                  icon: const Icon(Icons.delete_forever, size: 18),
                  color: AppColors.negative,
                  onPressed: onAbandon,
                  tooltip: '포기',
                ),
            ],
          ),
        ],
      ),
    );
  }
}
