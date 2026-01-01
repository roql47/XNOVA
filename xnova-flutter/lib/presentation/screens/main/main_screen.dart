import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/providers.dart';
import '../../widgets/resource_bar.dart';
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
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(gameState),
            ResourceBar(
              resources: gameState.resources,
              production: gameState.production,
              energyRatio: gameState.energyRatio,
            ),
            Expanded(
              child: _buildTabContent(navState.selectedTab),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(GameState gameState) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          IconButton(
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
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: MainTab.values
                  .where((tab) => tab != MainTab.simulator)  // 시뮬레이터 탭 숨김
                  .map((tab) {
                return _DrawerMenuItem(
                  tab: tab,
                  isSelected: navState.selectedTab == tab,
                  onTap: () {
                    ref.read(navigationProvider.notifier).setTab(tab);
                    Navigator.pop(context);
                  },
                );
              }).toList(),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: AppColors.panelBorder, width: 1),
              ),
            ),
            child: ListTile(
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

  const _DrawerMenuItem({
    required this.tab,
    required this.isSelected,
    required this.onTap,
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
