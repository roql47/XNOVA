import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../data/models/models.dart';
import '../../../../data/services/api_service.dart';
import '../../../../providers/providers.dart';

class RankingTab extends ConsumerStatefulWidget {
  const RankingTab({super.key});

  @override
  ConsumerState<RankingTab> createState() => _RankingTabState();
}

class _RankingTabState extends ConsumerState<RankingTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // 플레이어 랭킹 데이터
  List<PlayerScore> _rankings = [];
  MyRankResponse? _myRank;
  bool _isLoading = true;
  String _selectedType = 'total';
  int _totalPlayers = 0;

  // 연합 랭킹 데이터
  List<Map<String, dynamic>> _allianceRankings = [];
  bool _isAllianceLoading = true;
  int _totalAlliances = 0;

  final List<Map<String, String>> _rankingTypes = [
    {'key': 'total', 'label': '총합'},
    {'key': 'building', 'label': '건물'},
    {'key': 'research', 'label': '연구'},
    {'key': 'fleet', 'label': '함대'},
    {'key': 'defense', 'label': '방어'},
    {'key': 'alliance', 'label': '연합'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _rankingTypes.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        final newType = _rankingTypes[_tabController.index]['key']!;
        setState(() {
          _selectedType = newType;
        });
        if (newType == 'alliance') {
          _loadAllianceRanking();
        } else {
          _loadRanking();
        }
      }
    });
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadRanking(),
      _loadMyRank(),
    ]);
  }

  Future<void> _loadRanking() async {
    setState(() => _isLoading = true);
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getRanking(type: _selectedType);
      setState(() {
        _rankings = response.ranking;
        _totalPlayers = response.totalPlayers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadAllianceRanking() async {
    setState(() => _isAllianceLoading = true);
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getAllianceRanking();
      final ranking = (response['ranking'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      setState(() {
        _allianceRankings = ranking;
        _totalAlliances = response['totalAlliances'] ?? ranking.length;
        _isAllianceLoading = false;
      });
    } catch (e) {
      setState(() => _isAllianceLoading = false);
    }
  }

  Future<void> _loadMyRank() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getMyRank();
      setState(() {
        _myRank = response;
      });
    } catch (e) {
      // ignore
    }
  }

  RankInfo? _getMyRankForType(String type) {
    if (_myRank == null) return null;
    switch (type) {
      case 'total':
        return _myRank!.total;
      case 'building':
        return _myRank!.building;
      case 'research':
        return _myRank!.research;
      case 'fleet':
        return _myRank!.fleet;
      case 'defense':
        return _myRank!.defense;
      default:
        return _myRank!.total;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;

    return Column(
      children: [
        // 내 순위 카드 (연합 탭이 아닐 때만)
        if (_myRank != null && _selectedType != 'alliance')
          _buildMyRankCard(),
        
        // 탭 바
        Container(
          color: AppColors.surface,
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textMuted,
            indicatorColor: AppColors.accent,
            indicatorWeight: 2,
            labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontSize: 13),
            tabs: _rankingTypes.map((type) => Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (type['key'] == 'alliance')
                    const Icon(Icons.shield, size: 16),
                  if (type['key'] == 'alliance')
                    const SizedBox(width: 4),
                  Text(type['label']!),
                ],
              ),
            )).toList(),
          ),
        ),
        
        // 플레이어/연합 수 표시
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: AppColors.panelBackground,
          child: Text(
            _selectedType == 'alliance'
                ? '총 $_totalAlliances개의 연합'
                : '총 $_totalPlayers명의 플레이어',
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
            ),
          ),
        ),
        
        // 랭킹 목록
        Expanded(
          child: _selectedType == 'alliance'
              ? _buildAllianceRankingList()
              : _buildPlayerRankingList(currentUserId),
        ),
      ],
    );
  }

  Widget _buildPlayerRankingList(String? currentUserId) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.accent));
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.accent,
      child: _rankings.isEmpty
          ? const Center(
              child: Text(
                '랭킹 데이터가 없습니다.',
                style: TextStyle(color: AppColors.textMuted),
              ),
            )
          : ListView.builder(
              itemCount: _rankings.length,
              itemBuilder: (context, index) {
                final player = _rankings[index];
                final isMe = player.playerId == currentUserId;
                return _buildRankingItem(player, isMe);
              },
            ),
    );
  }

  Widget _buildAllianceRankingList() {
    if (_isAllianceLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.positive));
    }

    return RefreshIndicator(
      onRefresh: _loadAllianceRanking,
      color: AppColors.positive,
      child: _allianceRankings.isEmpty
          ? const Center(
              child: Text(
                '연합 랭킹 데이터가 없습니다.',
                style: TextStyle(color: AppColors.textMuted),
              ),
            )
          : ListView.builder(
              itemCount: _allianceRankings.length,
              itemBuilder: (context, index) {
                final alliance = _allianceRankings[index];
                return _buildAllianceRankingItem(alliance);
              },
            ),
    );
  }

  Widget _buildMyRankCard() {
    final myRankInfo = _getMyRankForType(_selectedType);
    if (myRankInfo == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.accent.withOpacity(0.15),
            AppColors.accent.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accent.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          // 내 순위
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.accent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  '내 순위',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '#${myRankInfo.rank}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // 내 점수 정보
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _rankingTypes.firstWhere((t) => t['key'] == _selectedType)['label']! + ' 점수',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatNumber(myRankInfo.score),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          // 전체 유저 중 퍼센트
          if (_totalPlayers > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '상위 ${((myRankInfo.rank / _totalPlayers) * 100).toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRankingItem(PlayerScore player, bool isMe) {
    Color rankColor;
    IconData? medalIcon;
    
    if (player.rank == 1) {
      rankColor = const Color(0xFFFFD700);
      medalIcon = Icons.emoji_events;
    } else if (player.rank == 2) {
      rankColor = const Color(0xFFC0C0C0);
      medalIcon = Icons.emoji_events;
    } else if (player.rank == 3) {
      rankColor = const Color(0xFFCD7F32);
      medalIcon = Icons.emoji_events;
    } else {
      rankColor = AppColors.textMuted;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isMe ? AppColors.accent.withOpacity(0.1) : Colors.transparent,
        border: Border(
          bottom: BorderSide(color: AppColors.panelBorder, width: 0.5),
          left: isMe ? BorderSide(color: AppColors.accent, width: 3) : BorderSide.none,
        ),
      ),
      child: Row(
        children: [
          // 순위
          SizedBox(
            width: 50,
            child: medalIcon != null
                ? Row(
                    children: [
                      Icon(medalIcon, color: rankColor, size: 20),
                      const SizedBox(width: 4),
                      Text(
                        '${player.rank}',
                        style: TextStyle(
                          color: rankColor,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  )
                : Text(
                    '${player.rank}',
                    style: TextStyle(
                      color: rankColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
          ),
          
          // 플레이어 정보
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        player.playerName,
                        style: TextStyle(
                          color: isMe ? AppColors.accent : AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: isMe ? FontWeight.bold : FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'ME',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          
          // 점수
          Text(
            _formatNumber(player.score),
            style: TextStyle(
              color: isMe ? AppColors.accent : AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAllianceRankingItem(Map<String, dynamic> alliance) {
    final rank = alliance['rank'] ?? 0;
    final tag = alliance['tag'] ?? '';
    final name = alliance['name'] ?? '';
    final memberCount = alliance['memberCount'] ?? 0;
    final totalScore = alliance['totalScore'] ?? 0;

    Color rankColor;
    
    if (rank == 1) {
      rankColor = const Color(0xFFFFD700);
    } else if (rank == 2) {
      rankColor = const Color(0xFFC0C0C0);
    } else if (rank == 3) {
      rankColor = const Color(0xFFCD7F32);
    } else {
      rankColor = AppColors.textMuted;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.panelBorder, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          // 순위
          SizedBox(
            width: 50,
            child: Text(
              '$rank',
              style: TextStyle(
                color: rankColor,
                fontSize: 14,
                fontWeight: rank <= 3 ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ),
          
          // 연합 정보
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // 연합 태그
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.positive.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '[$tag]',
                        style: const TextStyle(
                          color: AppColors.positive,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // 연합명
                    Flexible(
                      child: Text(
                        name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // 멤버 수
                Text(
                  '멤버 $memberCount명',
                  style: TextStyle(
                    color: AppColors.textMuted.withOpacity(0.8),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          
          // 점수
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _formatNumber(totalScore),
                style: const TextStyle(
                  color: AppColors.positive,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                '총점',
                style: TextStyle(
                  color: AppColors.textMuted.withOpacity(0.6),
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}
