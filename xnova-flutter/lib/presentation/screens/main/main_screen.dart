import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/providers.dart';
import '../../widgets/resource_bar.dart';
import '../../widgets/guide_tutorial_overlay.dart';
import '../../widgets/guide_steps_data.dart';
import 'tabs/overview_tab.dart';
import 'tabs/buildings_tab.dart';
import 'tabs/research_tab.dart';
import 'tabs/fleet_tab.dart';
import 'tabs/defense_tab.dart';
import 'tabs/fleet_movement_tab.dart';
import 'tabs/galaxy_tab.dart';
import 'tabs/messages_tab.dart';
import 'tabs/techtree_tab.dart';
import 'tabs/simulator_tab.dart';

extension MainTabExtension on MainTab {
  IconData get icon {
    switch (this) {
      case MainTab.overview: return Icons.dashboard_outlined;
      case MainTab.buildings: return Icons.apartment_outlined;
      case MainTab.research: return Icons.science_outlined;
      case MainTab.shipyard: return Icons.rocket_launch_outlined;
      case MainTab.defense: return Icons.shield_outlined;
      case MainTab.fleet: return Icons.flight_outlined;
      case MainTab.galaxy: return Icons.blur_circular_outlined;
      case MainTab.messages: return Icons.mail_outline;
      case MainTab.techtree: return Icons.account_tree_outlined;
      case MainTab.simulator: return Icons.analytics_outlined;
    }
  }

  String get label {
    switch (this) {
      case MainTab.overview: return '홈';
      case MainTab.buildings: return '건물';
      case MainTab.research: return '연구';
      case MainTab.shipyard: return '조선소';
      case MainTab.defense: return '방어';
      case MainTab.fleet: return '함대';
      case MainTab.galaxy: return '은하계';
      case MainTab.messages: return '메시지';
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

class _MainScreenState extends ConsumerState<MainScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  // 가이드 튜토리얼용 GlobalKey들
  final GlobalKey _resourceBarKey = GlobalKey();
  final GlobalKey _menuButtonKey = GlobalKey();
  final GlobalKey _refreshButtonKey = GlobalKey();
  final GlobalKey _tabContentKey = GlobalKey(); // 탭 컨텐츠 영역
  
  // 가이드 표시 상태
  bool _showGuide = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(gameProvider.notifier).loadAllData();
      ref.read(gameProvider.notifier).loadProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);
    final authState = ref.watch(authProvider);
    final navState = ref.watch(navigationProvider);

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
                refreshButtonKey: _refreshButtonKey,
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
                    ref.read(navigationProvider.notifier).setTab(tab);
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
          Expanded(
            child: Column(
              children: [
                Text(
                  'XNOVA',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accent,
                    letterSpacing: 2,
                  ),
                ),
                if (gameState.coordinate != null)
                  Text(
                    gameState.coordinate!,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                      letterSpacing: 1,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            key: _refreshButtonKey,
            icon: const Icon(Icons.refresh, color: AppColors.textMuted, size: 20),
            onPressed: () => ref.read(gameProvider.notifier).loadAllData(),
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
                  authState.user?.coordinate ?? gameState.coordinate ?? '',
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
                      .where((tab) => tab != MainTab.simulator)  // 시뮬레이터 탭 숨김
                      .map((tab) {
                    return _DrawerMenuItem(
                      tab: tab,
                      isSelected: navState.selectedTab == tab,
                      badgeCount: tab == MainTab.messages ? unreadCount : 0,
                      onTap: () {
                        ref.read(navigationProvider.notifier).setTab(tab);
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
                // 로그아웃 버튼
                ListTile(
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
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(
                      tab.icon,
                      size: 18,
                      color: isSelected ? AppColors.accent : AppColors.textMuted,
                    ),
                    if (badgeCount > 0)
                      Positioned(
                        right: -6,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppColors.negative,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                          child: Text(
                            badgeCount > 99 ? '99+' : '$badgeCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    tab.label,
                    style: TextStyle(
                      color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
                      fontSize: 13,
                      fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
                if (badgeCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$badgeCount',
                      style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
