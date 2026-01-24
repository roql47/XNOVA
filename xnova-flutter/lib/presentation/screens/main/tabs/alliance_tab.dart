import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../data/models/alliance_models.dart';
import '../../../../providers/alliance_provider.dart';

class AllianceTab extends ConsumerStatefulWidget {
  const AllianceTab({super.key});

  @override
  ConsumerState<AllianceTab> createState() => _AllianceTabState();
}

class _AllianceTabState extends ConsumerState<AllianceTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // 미가입 상태 컨트롤러
  final _tagController = TextEditingController();
  final _nameController = TextEditingController();
  final _searchController = TextEditingController();
  final _applicationController = TextEditingController();
  
  // 관리 상태 컨트롤러
  final _externalTextController = TextEditingController();
  final _internalTextController = TextEditingController();
  final _websiteController = TextEditingController();
  final _logoController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAlliance();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tagController.dispose();
    _nameController.dispose();
    _searchController.dispose();
    _applicationController.dispose();
    _externalTextController.dispose();
    _internalTextController.dispose();
    _websiteController.dispose();
    _logoController.dispose();
    super.dispose();
  }

  Future<void> _loadAlliance() async {
    await ref.read(allianceProvider.notifier).loadMyAlliance();
    // 연합 미가입 시 연합 목록 로드
    final state = ref.read(allianceProvider);
    if (!state.hasAlliance && !state.isPending && state.searchResults.isEmpty) {
      await ref.read(allianceProvider.notifier).searchAlliances();
    }
  }

  @override
  Widget build(BuildContext context) {
    final allianceState = ref.watch(allianceProvider);

    // 에러/성공 메시지 표시
    ref.listen<AllianceState>(allianceProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppColors.negative,
          ),
        );
      }
      if (next.successMessage != null && next.successMessage != previous?.successMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.successMessage!),
            backgroundColor: AppColors.positive,
          ),
        );
      }
    });

    if (allianceState.isLoading && allianceState.status == 'none') {
      return const Center(child: CircularProgressIndicator());
    }

    // 가입 여부에 따라 다른 화면 표시
    if (allianceState.hasAlliance) {
      return _buildMemberView(allianceState);
    } else if (allianceState.isPending) {
      return _buildPendingView(allianceState);
    } else {
      return _buildNoAllianceView(allianceState);
    }
  }

  // ===== 가입 신청 대기 중 화면 =====
  Widget _buildPendingView(AllianceState state) {
    final pending = state.pendingAlliance;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.hourglass_empty,
              size: 64,
              color: AppColors.warning,
            ),
            const SizedBox(height: 16),
            const Text(
              '가입 신청 대기 중',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            if (pending != null) ...[
              Text(
                '[${pending.tag}] ${pending.name}',
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
            ],
            const Text(
              '연합 관리자의 승인을 기다리고 있습니다.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: state.isLoading
                  ? null
                  : () async {
                      if (pending != null) {
                        final success = await ref
                            .read(allianceProvider.notifier)
                            .cancelApplication();
                        if (success) {
                          await _loadAlliance();
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.negative,
                foregroundColor: Colors.white,
              ),
              child: state.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('신청 취소'),
            ),
          ],
        ),
      ),
    );
  }

  // ===== 미가입 상태 화면 =====
  Widget _buildNoAllianceView(AllianceState state) {
    return Column(
      children: [
        Container(
          color: AppColors.surface,
          child: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: '연합 생성'),
              Tab(text: '연합 검색'),
            ],
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.accent,
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildCreateAllianceTab(state),
              _buildSearchAllianceTab(state),
            ],
          ),
        ),
      ],
    );
  }

  // 연합 생성 탭
  Widget _buildCreateAllianceTab(AllianceState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('새 연합 창설'),
          const SizedBox(height: 16),
          Text(
            '연합을 창설하면 자동으로 리더가 됩니다.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 24),
          
          // 연합 태그
          Text('연합 태그 (3~8자)', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _tagController,
            maxLength: 8,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: '예: NOVA',
              hintStyle: TextStyle(color: AppColors.textSecondary),
              filled: true,
              fillColor: AppColors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              counterStyle: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          const SizedBox(height: 16),
          
          // 연합 이름
          Text('연합 이름 (최대 35자)', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _nameController,
            maxLength: 35,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: '예: XNOVA Alliance',
              hintStyle: TextStyle(color: AppColors.textSecondary),
              filled: true,
              fillColor: AppColors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              counterStyle: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          const SizedBox(height: 24),
          
          // 생성 버튼
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: state.isLoading ? null : _createAlliance,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: state.isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('연합 창설', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  // 연합 검색 탭
  Widget _buildSearchAllianceTab(AllianceState state) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _searchController,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: '연합 이름 또는 태그 검색',
              hintStyle: TextStyle(color: AppColors.textSecondary),
              filled: true,
              fillColor: AppColors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search, color: AppColors.accent),
                onPressed: _searchAlliances,
              ),
            ),
            onSubmitted: (_) => _searchAlliances(),
          ),
        ),
        Expanded(
          child: state.searchResults.isEmpty
              ? Center(
                  child: Text(
                    '연합을 검색하세요',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                )
              : ListView.builder(
                  itemCount: state.searchResults.length,
                  itemBuilder: (context, index) {
                    final alliance = state.searchResults[index];
                    return _buildAllianceSearchItem(alliance, state);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildAllianceSearchItem(AllianceSearchResult alliance, AllianceState state) {
    return Card(
      color: AppColors.surface,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: alliance.logo.isNotEmpty
            ? CircleAvatar(backgroundImage: NetworkImage(alliance.logo))
            : CircleAvatar(
                backgroundColor: AppColors.accent.withOpacity(0.2),
                child: Text(alliance.tag[0], style: TextStyle(color: AppColors.accent)),
              ),
        title: Text(
          '[${alliance.tag}] ${alliance.name}',
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '멤버: ${alliance.memberCount}명 | ${alliance.isOpen ? "가입 가능" : "가입 불가"}',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        trailing: alliance.isOpen
            ? IconButton(
                icon: const Icon(Icons.person_add, color: AppColors.accent),
                onPressed: () => _showApplyDialog(alliance),
              )
            : const Icon(Icons.lock, color: AppColors.textSecondary),
        onTap: () => _showAllianceDetails(alliance),
      ),
    );
  }

  // ===== 가입 상태 화면 =====
  Widget _buildMemberView(AllianceState state) {
    final alliance = state.myAlliance!;
    
    return RefreshIndicator(
      onRefresh: _loadAlliance,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 연합 헤더
            _buildAllianceHeader(alliance),
            const SizedBox(height: 16),
            
            // 연합 정보
            _buildAllianceInfoCard(alliance),
            const SizedBox(height: 16),
            
            // 관리자 기능 (리더인 경우)
            if (state.isLeader) ...[
              _buildAdminSection(state),
              const SizedBox(height: 16),
            ],
            
            // 멤버 기능
            _buildMemberActions(state),
          ],
        ),
      ),
    );
  }

  Widget _buildAllianceHeader(Alliance alliance) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.accent.withOpacity(0.3), AppColors.surface],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // 로고
          alliance.logo.isNotEmpty
              ? CircleAvatar(radius: 32, backgroundImage: NetworkImage(alliance.logo))
              : CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.accent,
                  child: Text(
                    alliance.tag,
                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '[${alliance.tag}]',
                  style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  alliance.name,
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(
                  '멤버: ${alliance.memberCount}명 | ${alliance.myRank ?? "멤버"}',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAllianceInfoCard(Alliance alliance) {
    return Card(
      color: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('연합 정보'),
            const SizedBox(height: 12),
            if (alliance.internalText.isNotEmpty) ...[
              Text('내부 공지', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(alliance.internalText, style: TextStyle(color: AppColors.textPrimary)),
              const Divider(color: AppColors.panelBorder, height: 24),
            ],
            if (alliance.externalText.isNotEmpty) ...[
              Text('연합 소개', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(alliance.externalText, style: TextStyle(color: AppColors.textPrimary)),
            ],
            if (alliance.website.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.language, color: AppColors.textSecondary, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      alliance.website,
                      style: TextStyle(color: AppColors.accent, decoration: TextDecoration.underline),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAdminSection(AllianceState state) {
    return Card(
      color: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('관리자 메뉴', icon: Icons.admin_panel_settings),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildAdminButton('멤버 관리', Icons.people, () => _showMembersDialog(state)),
                _buildAdminButton('가입 신청', Icons.person_add, () => _showRequestsDialog(state)),
                _buildAdminButton('연합 정보 수정', Icons.edit, () => _showEditInfoDialog(state)),
                _buildAdminButton('연합 양도', Icons.swap_horiz, () => _showTransferDialog(state)),
                _buildAdminButton('연합 해산', Icons.delete_forever, _showDisbandDialog, isDestructive: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminButton(String label, IconData icon, VoidCallback onPressed, {bool isDestructive = false}) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: isDestructive ? AppColors.negative : AppColors.textPrimary,
        side: BorderSide(color: isDestructive ? AppColors.negative : AppColors.panelBorder),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }

  Widget _buildMemberActions(AllianceState state) {
    return Card(
      color: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('멤버 기능'),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.people_outline, color: AppColors.textSecondary),
              title: const Text('멤버 목록 보기', style: TextStyle(color: AppColors.textPrimary)),
              trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              onTap: () => _showMembersDialog(state),
            ),
            if (!state.isLeader) ...[
              const Divider(color: AppColors.panelBorder),
              ListTile(
                leading: const Icon(Icons.exit_to_app, color: AppColors.negative),
                title: const Text('연합 탈퇴', style: TextStyle(color: AppColors.negative)),
                onTap: _showExitDialog,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {IconData? icon}) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, color: AppColors.accent, size: 20),
          const SizedBox(width: 8),
        ],
        Text(
          title,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  // ===== 액션 메서드 =====
  Future<void> _createAlliance() async {
    final tag = _tagController.text.trim();
    final name = _nameController.text.trim();
    
    if (tag.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('태그는 최소 3자 이상이어야 합니다.'), backgroundColor: AppColors.negative),
      );
      return;
    }
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('연합 이름을 입력하세요.'), backgroundColor: AppColors.negative),
      );
      return;
    }

    final success = await ref.read(allianceProvider.notifier).createAlliance(tag, name);
    if (success) {
      _tagController.clear();
      _nameController.clear();
    }
  }

  Future<void> _searchAlliances() async {
    final query = _searchController.text.trim();
    await ref.read(allianceProvider.notifier).searchAlliances(query);
  }

  void _showApplyDialog(AllianceSearchResult alliance) {
    _applicationController.clear();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: Text('[${alliance.tag}] 가입 신청', style: const TextStyle(color: AppColors.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('지원서를 작성하세요:', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            TextField(
              controller: _applicationController,
              maxLines: 4,
              maxLength: 1000,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: '자기소개를 입력하세요',
                hintStyle: TextStyle(color: AppColors.textSecondary),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              final text = _applicationController.text.trim();
              if (text.isEmpty) return;
              
              Navigator.pop(context);
              await ref.read(allianceProvider.notifier).applyForAlliance(alliance.id, text);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('신청', style: TextStyle(color: Colors.black)),
          ),
        ],
      ),
    );
  }

  void _showAllianceDetails(AllianceSearchResult alliance) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: Text('[${alliance.tag}] ${alliance.name}', style: const TextStyle(color: AppColors.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('멤버: ${alliance.memberCount}명', style: TextStyle(color: AppColors.textSecondary)),
            Text('가입 상태: ${alliance.isOpen ? "가입 가능" : "가입 불가"}', style: TextStyle(color: AppColors.textSecondary)),
            if (alliance.externalText.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(color: AppColors.panelBorder),
              const SizedBox(height: 12),
              Text(alliance.externalText, style: const TextStyle(color: AppColors.textPrimary)),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('닫기'),
          ),
          if (alliance.isOpen)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _showApplyDialog(alliance);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
              child: const Text('가입 신청', style: TextStyle(color: Colors.black)),
            ),
        ],
      ),
    );
  }

  void _showMembersDialog(AllianceState state) async {
    await ref.read(allianceProvider.notifier).loadMembers();
    
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => Consumer(
        builder: (context, ref, _) {
          final members = ref.watch(allianceProvider).members;
          return AlertDialog(
            backgroundColor: AppColors.background,
            title: const Text('멤버 목록', style: TextStyle(color: AppColors.textPrimary)),
            content: SizedBox(
              width: double.maxFinite,
              height: 300,
              child: members.isEmpty
                  ? const Center(child: Text('멤버가 없습니다.', style: TextStyle(color: AppColors.textSecondary)))
                  : ListView.builder(
                      itemCount: members.length,
                      itemBuilder: (context, index) {
                        final member = members[index];
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: member.isOwner ? AppColors.accent : AppColors.surface,
                            child: Icon(
                              member.isOwner ? Icons.star : Icons.person,
                              color: member.isOwner ? Colors.black : AppColors.textSecondary,
                            ),
                          ),
                          title: Text(member.playerName, style: const TextStyle(color: AppColors.textPrimary)),
                          subtitle: Text(
                            '${member.coordinate} | ${member.rankName ?? "멤버"}',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                          trailing: state.isLeader && !member.isOwner
                              ? IconButton(
                                  icon: const Icon(Icons.remove_circle, color: AppColors.negative),
                                  onPressed: () => _confirmKickMember(member),
                                )
                              : null,
                        );
                      },
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('닫기'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmKickMember(AllianceMember member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: const Text('멤버 추방', style: TextStyle(color: AppColors.textPrimary)),
        content: Text('${member.playerName}님을 추방하시겠습니까?', style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);  // 확인 다이얼로그 닫기
              await ref.read(allianceProvider.notifier).kickMember(member.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.negative),
            child: const Text('추방', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showRequestsDialog(AllianceState state) async {
    await ref.read(allianceProvider.notifier).loadApplications();
    
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => Consumer(
        builder: (context, ref, _) {
          final applications = ref.watch(allianceProvider).applications;
          return AlertDialog(
            backgroundColor: AppColors.background,
            title: const Text('가입 신청 목록', style: TextStyle(color: AppColors.textPrimary)),
            content: SizedBox(
              width: double.maxFinite,
              height: 300,
              child: applications.isEmpty
                  ? const Center(child: Text('대기 중인 신청이 없습니다.', style: TextStyle(color: AppColors.textSecondary)))
                  : ListView.builder(
                      itemCount: applications.length,
                      itemBuilder: (context, index) {
                        final application = applications[index];
                        return Card(
                          color: AppColors.surface,
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(application.playerName, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(application.message, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    TextButton(
                                      onPressed: () async {
                                        await ref.read(allianceProvider.notifier).rejectApplication(application.id);
                                      },
                                      child: const Text('거절', style: TextStyle(color: AppColors.negative)),
                                    ),
                                    const SizedBox(width: 8),
                                    ElevatedButton(
                                      onPressed: () async {
                                        await ref.read(allianceProvider.notifier).acceptApplication(application.id);
                                      },
                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.positive),
                                      child: const Text('승인', style: TextStyle(color: Colors.white)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('닫기'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showEditInfoDialog(AllianceState state) {
    final alliance = state.myAlliance!;
    _externalTextController.text = alliance.externalText;
    _internalTextController.text = alliance.internalText;
    _websiteController.text = alliance.website;
    _logoController.text = alliance.logo;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: const Text('연합 정보 수정', style: TextStyle(color: AppColors.textPrimary)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('외부 소개 (비회원에게 표시)', style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              TextField(
                controller: _externalTextController,
                maxLines: 3,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: _inputDecoration('외부 소개를 입력하세요'),
              ),
              const SizedBox(height: 16),
              const Text('내부 공지 (회원에게만 표시)', style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              TextField(
                controller: _internalTextController,
                maxLines: 3,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: _inputDecoration('내부 공지를 입력하세요'),
              ),
              const SizedBox(height: 16),
              const Text('웹사이트', style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              TextField(
                controller: _websiteController,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: _inputDecoration('https://example.com'),
              ),
              const SizedBox(height: 16),
              const Text('로고 이미지 URL', style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              TextField(
                controller: _logoController,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: _inputDecoration('https://example.com/logo.png'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(allianceProvider.notifier).updateAllianceSettings(
                externalText: _externalTextController.text,
                internalText: _internalTextController.text,
                website: _websiteController.text,
                logo: _logoController.text,
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('저장', style: TextStyle(color: Colors.black)),
          ),
        ],
      ),
    );
  }

  void _showTransferDialog(AllianceState state) async {
    await ref.read(allianceProvider.notifier).loadMembers();
    
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => Consumer(
        builder: (context, ref, _) {
          final members = ref.watch(allianceProvider).members.where((m) => !m.isOwner).toList();
          return AlertDialog(
            backgroundColor: AppColors.background,
            title: const Text('연합 양도', style: TextStyle(color: AppColors.textPrimary)),
            content: SizedBox(
              width: double.maxFinite,
              height: 250,
              child: members.isEmpty
                  ? const Center(child: Text('양도할 멤버가 없습니다.', style: TextStyle(color: AppColors.textSecondary)))
                  : Column(
                      children: [
                        Text('새 리더를 선택하세요:', style: TextStyle(color: AppColors.textSecondary)),
                        const SizedBox(height: 12),
                        Expanded(
                          child: ListView.builder(
                            itemCount: members.length,
                            itemBuilder: (context, index) {
                              final member = members[index];
                              return ListTile(
                                title: Text(member.playerName, style: const TextStyle(color: AppColors.textPrimary)),
                                subtitle: Text(member.coordinate, style: TextStyle(color: AppColors.textSecondary)),
                                onTap: () => _confirmTransfer(member),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('취소'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmTransfer(AllianceMember member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: const Text('연합 양도 확인', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          '${member.playerName}님에게 리더 권한을 양도하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);  // 확인 다이얼로그 닫기
              Navigator.pop(context);  // 양도 다이얼로그 닫기
              await ref.read(allianceProvider.notifier).transferAlliance(member.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('양도', style: TextStyle(color: Colors.black)),
          ),
        ],
      ),
    );
  }

  void _showDisbandDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: const Text('연합 해산', style: TextStyle(color: AppColors.negative)),
        content: const Text(
          '연합을 해산하시겠습니까?\n모든 멤버가 연합에서 제외되며, 이 작업은 되돌릴 수 없습니다.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(allianceProvider.notifier).disbandAlliance();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.negative),
            child: const Text('해산', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showExitDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: const Text('연합 탈퇴', style: TextStyle(color: AppColors.negative)),
        content: const Text(
          '정말 연합을 탈퇴하시겠습니까?',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(allianceProvider.notifier).exitAlliance();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.negative),
            child: const Text('탈퇴', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: AppColors.textSecondary),
      filled: true,
      fillColor: AppColors.surface,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
    );
  }
}
