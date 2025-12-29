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

enum MainTab {
  overview('🏠', '개요'),
  buildings('🏗️', '건물'),
  research('🔬', '연구'),
  shipyard('🚀', '조선소'),
  defense('🛡️', '방어'),
  fleet('⚔️', '함대'),
  galaxy('🌌', '은하계');

  final String emoji;
  final String label;

  const MainTab(this.emoji, this.label);
}

class MainScreen extends ConsumerStatefulWidget {
  final VoidCallback onLogout;

  const MainScreen({super.key, required this.onLogout});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  MainTab _selectedTab = MainTab.overview;
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

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.ogameBlack,
      drawer: _buildDrawer(authState, gameState),
      body: SafeArea(
        child: Column(
          children: [
            // 상단 바
            _buildTopBar(gameState),
            // 자원 바
            ResourceBar(
              resources: gameState.resources,
              production: gameState.production,
              energyRatio: gameState.energyRatio,
            ),
            // 탭 컨텐츠
            Expanded(
              child: _buildTabContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(GameState gameState) {
    return Container(
      color: AppColors.ogameDarkBlue,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.menu, color: AppColors.textPrimary),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          Expanded(
            child: Column(
              children: [
                const Text(
                  'XNOVA',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.ogameGreen,
                  ),
                ),
                if (gameState.coordinate != null)
                  Text(
                    '[${gameState.coordinate}]',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => ref.read(gameProvider.notifier).loadAllData(),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(AuthState authState, GameState gameState) {
    return Drawer(
      backgroundColor: AppColors.drawerBackground,
      child: Column(
        children: [
          // 헤더
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              right: 16,
              bottom: 16,
            ),
            color: AppColors.panelHeader,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '🚀 XNOVA',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.ogameGreen,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  authState.user?.playerName ?? gameState.playerName ?? '',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  '좌표: ${authState.user?.coordinate ?? gameState.coordinate ?? ''}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Divider(color: AppColors.panelBorder, height: 1),
          const SizedBox(height: 8),
          // 메뉴 아이템들
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: MainTab.values.map((tab) {
                return _DrawerMenuItem(
                  tab: tab,
                  isSelected: _selectedTab == tab,
                  onTap: () {
                    setState(() => _selectedTab = tab);
                    Navigator.pop(context);
                  },
                );
              }).toList(),
            ),
          ),
          const Divider(color: AppColors.panelBorder, height: 1),
          // 로그아웃
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.errorRed),
            title: const Text(
              '로그아웃',
              style: TextStyle(color: AppColors.errorRed),
            ),
            onTap: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
              widget.onLogout();
            },
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_selectedTab) {
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: Material(
        color: isSelected ? AppColors.drawerItemSelected : Colors.transparent,
        borderRadius: BorderRadius.circular(4),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(4),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isSelected ? AppColors.ogameGreen : Colors.transparent,
              ),
            ),
            child: Row(
              children: [
                Text(tab.emoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    tab.label,
                    style: TextStyle(
                      color: isSelected ? AppColors.ogameGreen : AppColors.textSecondary,
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
                if (isSelected)
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppColors.ogameGreen,
                      shape: BoxShape.circle,
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

