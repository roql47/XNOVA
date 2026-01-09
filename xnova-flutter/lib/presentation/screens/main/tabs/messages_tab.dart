import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../providers/providers.dart';
import '../../../../data/models/models.dart';
import '../../../../core/constants/game_constants.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/services/token_service.dart';

class MessagesTab extends ConsumerStatefulWidget {
  const MessagesTab({super.key});

  @override
  ConsumerState<MessagesTab> createState() => _MessagesTabState();
}

// 메시지 카테고리 enum
enum MessageCategory {
  announcement, // 공지사항
  fleet,        // 함대 이벤트
  espionage,    // 정탐 메시지
  player,       // 개인 메시지
}

class _MessagesTabState extends ConsumerState<MessagesTab> with SingleTickerProviderStateMixin {
  bool _isSelectionMode = false;
  final Set<String> _selectedIds = {};
  late TabController _tabController;
  MessageCategory _currentCategory = MessageCategory.announcement;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _currentCategory = MessageCategory.values[_tabController.index];
          _selectedIds.clear();
          _isSelectionMode = false;
        });
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(messageProvider.notifier).loadMessages();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // 메시지를 카테고리별로 필터링
  List<Message> _filterMessages(List<Message> messages, MessageCategory category) {
    return messages.where((m) {
      switch (category) {
        case MessageCategory.announcement:
          // 공지사항: metadata.isAnnouncement == true 또는 senderName이 [공지]로 시작
          return m.metadata?['isAnnouncement'] == true || 
                 m.senderName.startsWith('[공지]');
        case MessageCategory.fleet:
          // 함대 이벤트: type이 system이고 senderName에 '사령부' 포함 또는
          // type이 battle이고 spy가 아닌 경우 (전투 보고서)
          if (m.type == 'system' && m.senderName.contains('사령부')) return true;
          if (m.type == 'system' && m.senderName.contains('관리국')) return true;
          if (m.type == 'battle') {
            final metaType = m.metadata?['type'] as String?;
            return metaType != 'spy' && metaType != 'spy_alert';
          }
          return false;
        case MessageCategory.espionage:
          // 정탐 메시지: type이 battle이고 metadata.type이 spy 또는 spy_alert
          if (m.type == 'battle') {
            final metaType = m.metadata?['type'] as String?;
            return metaType == 'spy' || metaType == 'spy_alert';
          }
          return false;
        case MessageCategory.player:
          // 개인 메시지: type이 player
          return m.type == 'player';
      }
    }).toList();
  }

  void _toggleSelectionMode() {
    setState(() {
      _isSelectionMode = !_isSelectionMode;
      if (!_isSelectionMode) {
        _selectedIds.clear();
      }
    });
  }

  void _toggleMessageSelection(String messageId) {
    setState(() {
      if (_selectedIds.contains(messageId)) {
        _selectedIds.remove(messageId);
      } else {
        _selectedIds.add(messageId);
      }
    });
  }

  void _selectAll(List<Message> messages) {
    setState(() {
      if (_selectedIds.length == messages.length) {
        _selectedIds.clear();
      } else {
        _selectedIds.clear();
        _selectedIds.addAll(messages.map((m) => m.id));
      }
    });
  }

  Future<void> _deleteSelected() async {
    if (_selectedIds.isEmpty) return;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text('메시지 삭제', style: TextStyle(color: AppColors.textPrimary)),
        content: Text('${_selectedIds.length}개의 메시지를 삭제하시겠습니까?', 
          style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('삭제', style: TextStyle(color: AppColors.negative)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      for (final id in _selectedIds) {
        await ref.read(messageProvider.notifier).deleteMessage(id);
      }
      setState(() {
        _selectedIds.clear();
        _isSelectionMode = false;
      });
    }
  }

  Future<void> _deleteAll() async {
    final messageState = ref.read(messageProvider);
    if (messageState.messages.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text('전체 삭제', style: TextStyle(color: AppColors.textPrimary)),
        content: Text('모든 메시지(${messageState.messages.length}개)를 삭제하시겠습니까?', 
          style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('전체 삭제', style: TextStyle(color: AppColors.negative)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      for (final message in messageState.messages) {
        await ref.read(messageProvider.notifier).deleteMessage(message.id);
      }
      setState(() {
        _selectedIds.clear();
        _isSelectionMode = false;
      });
    }
  }

  // 카테고리별 아이콘 반환
  IconData _getCategoryIcon(MessageCategory category) {
    switch (category) {
      case MessageCategory.announcement:
        return Icons.campaign;
      case MessageCategory.fleet:
        return Icons.rocket_launch;
      case MessageCategory.espionage:
        return Icons.radar;
      case MessageCategory.player:
        return Icons.person;
    }
  }

  // 카테고리별 색상 반환
  Color _getCategoryColor(MessageCategory category) {
    switch (category) {
      case MessageCategory.announcement:
        return AppColors.warning;
      case MessageCategory.fleet:
        return AppColors.accent;
      case MessageCategory.espionage:
        return AppColors.infoBlue;
      case MessageCategory.player:
        return AppColors.positive;
    }
  }

  // 카테고리별 라벨 반환
  String _getCategoryLabel(MessageCategory category) {
    switch (category) {
      case MessageCategory.announcement:
        return '공지';
      case MessageCategory.fleet:
        return '함대';
      case MessageCategory.espionage:
        return '정탐';
      case MessageCategory.player:
        return '개인';
    }
  }

  @override
  Widget build(BuildContext context) {
    final messageState = ref.watch(messageProvider);
    final filteredMessages = _filterMessages(messageState.messages, _currentCategory);
    final unreadCount = filteredMessages.where((m) => !m.isRead).length;

    // 각 카테고리별 안 읽은 메시지 수
    final announcementUnread = _filterMessages(messageState.messages, MessageCategory.announcement)
        .where((m) => !m.isRead).length;
    final fleetUnread = _filterMessages(messageState.messages, MessageCategory.fleet)
        .where((m) => !m.isRead).length;
    final espionageUnread = _filterMessages(messageState.messages, MessageCategory.espionage)
        .where((m) => !m.isRead).length;
    final playerUnread = _filterMessages(messageState.messages, MessageCategory.player)
        .where((m) => !m.isRead).length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // 탭바
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.panelBorder)),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: _getCategoryColor(_currentCategory),
              indicatorWeight: 2,
              labelColor: _getCategoryColor(_currentCategory),
              unselectedLabelColor: AppColors.textMuted,
              labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              unselectedLabelStyle: const TextStyle(fontSize: 11),
              tabs: [
                _buildTab(MessageCategory.announcement, announcementUnread),
                _buildTab(MessageCategory.fleet, fleetUnread),
                _buildTab(MessageCategory.espionage, espionageUnread),
                _buildTab(MessageCategory.player, playerUnread),
              ],
            ),
          ),
          // 상단 툴바
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.panelBackground,
              border: Border(bottom: BorderSide(color: AppColors.panelBorder.withOpacity(0.5))),
            ),
            child: Row(
              children: [
                // 안 읽은 메시지 표시
                if (unreadCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _getCategoryColor(_currentCategory).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.mail, size: 12, color: _getCategoryColor(_currentCategory)),
                        const SizedBox(width: 4),
                        Text(
                          '안 읽음 $unreadCount',
                          style: TextStyle(color: _getCategoryColor(_currentCategory), fontSize: 10, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  )
                else
                  Text(
                    '${_getCategoryLabel(_currentCategory)} ${filteredMessages.length}개',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                  ),
                const Spacer(),
                // 선택 모드 버튼
                if (_isSelectionMode) ...[
                  TextButton.icon(
                    onPressed: () => _selectAll(filteredMessages),
                    icon: Icon(
                      _selectedIds.length == filteredMessages.length 
                        ? Icons.deselect : Icons.select_all,
                      size: 14,
                    ),
                    label: Text(_selectedIds.length == filteredMessages.length ? '해제' : '전체', style: const TextStyle(fontSize: 10)),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _selectedIds.isNotEmpty ? _deleteSelected : null,
                    icon: const Icon(Icons.delete, size: 14),
                    label: Text('삭제(${_selectedIds.length})', style: const TextStyle(fontSize: 10)),
                    style: TextButton.styleFrom(
                      foregroundColor: _selectedIds.isNotEmpty ? AppColors.negative : AppColors.textMuted,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  IconButton(
                    onPressed: _toggleSelectionMode,
                    icon: const Icon(Icons.close, size: 16),
                    color: AppColors.textMuted,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ] else ...[
                  IconButton(
                    onPressed: _toggleSelectionMode,
                    icon: const Icon(Icons.checklist, size: 16),
                    color: AppColors.textSecondary,
                    tooltip: '선택 모드',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    onPressed: filteredMessages.isNotEmpty ? () => _deleteAllFiltered(filteredMessages) : null,
                    icon: const Icon(Icons.delete_sweep, size: 16),
                    color: filteredMessages.isNotEmpty ? AppColors.negative : AppColors.textMuted,
                    tooltip: '전체 삭제',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ],
            ),
          ),
          // 메시지 목록
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(messageProvider.notifier).loadMessages(),
              color: _getCategoryColor(_currentCategory),
              backgroundColor: AppColors.surface,
              child: messageState.isLoading && messageState.messages.isEmpty
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                  : filteredMessages.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _getCategoryIcon(_currentCategory),
                                size: 48,
                                color: AppColors.textMuted.withOpacity(0.3),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                '${_getCategoryLabel(_currentCategory)} 메시지가 없습니다.',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: filteredMessages.length,
                          itemBuilder: (context, index) {
                            final message = filteredMessages[index];
                            return _MessageCard(
                              message: message,
                              isSelectionMode: _isSelectionMode,
                              isSelected: _selectedIds.contains(message.id),
                              onSelectionChanged: () => _toggleMessageSelection(message.id),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(MessageCategory category, int unreadCount) {
    return Tab(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getCategoryIcon(category), size: 14),
          const SizedBox(width: 4),
          Text(_getCategoryLabel(category)),
          if (unreadCount > 0) ...[
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: _getCategoryColor(category),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                unreadCount > 99 ? '99+' : '$unreadCount',
                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _deleteAllFiltered(List<Message> messages) async {
    if (messages.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: Text('${_getCategoryLabel(_currentCategory)} 전체 삭제', style: const TextStyle(color: AppColors.textPrimary)),
        content: Text('${_getCategoryLabel(_currentCategory)} 메시지 ${messages.length}개를 모두 삭제하시겠습니까?', 
          style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('전체 삭제', style: TextStyle(color: AppColors.negative)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      for (final message in messages) {
        await ref.read(messageProvider.notifier).deleteMessage(message.id);
      }
      setState(() {
        _selectedIds.clear();
        _isSelectionMode = false;
      });
    }
  }
}

class _MessageCard extends ConsumerWidget {
  final Message message;
  final bool isSelectionMode;
  final bool isSelected;
  final VoidCallback? onSelectionChanged;

  const _MessageCard({
    required this.message,
    this.isSelectionMode = false,
    this.isSelected = false,
    this.onSelectionChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isSelected 
          ? AppColors.accent.withOpacity(0.1)
          : (message.isRead ? AppColors.panelBackground : AppColors.panelHeader),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSelected 
            ? AppColors.accent
            : (message.isRead ? AppColors.panelBorder : AppColors.accent.withOpacity(0.3)),
          width: isSelected ? 2 : (message.isRead ? 1 : 1.5),
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () {
          if (isSelectionMode) {
            onSelectionChanged?.call();
          } else {
            if (!message.isRead) {
              ref.read(messageProvider.notifier).markAsRead(message.id);
            }
            _showMessageDetail(context, message);
          }
        },
        onLongPress: () {
          if (!isSelectionMode) {
            onSelectionChanged?.call();
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // 선택 모드일 때 체크박스
              if (isSelectionMode) ...[
                Icon(
                  isSelected ? Icons.check_circle : Icons.circle_outlined,
                  color: isSelected ? AppColors.accent : AppColors.textMuted,
                  size: 20,
                ),
                const SizedBox(width: 10),
              ],
              // 안 읽음 표시
              if (!message.isRead && !isSelectionMode) ...[
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              // 메시지 내용
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            _getTypeIcon(message.type),
                            const SizedBox(width: 8),
                            Text(
                              message.senderName,
                              style: TextStyle(
                                color: AppColors.accent,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          formatKSTDateTime(message.createdAt),
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      message.title,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: message.isRead ? FontWeight.normal : FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (message.type == 'battle' && message.metadata != null)
                      _buildBattleSummary(message.metadata!)
                    else
                      Text(
                        _stripHtml(message.content),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
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

  // HTML 태그 제거 (미리보기용 - 줄바꿈 제거)
  String _stripHtml(String html) {
    return html.replaceAll(RegExp(r'<[^>]*>'), '').replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  // HTML 태그 제거 (상세보기용 - 줄바꿈 유지)
  String _stripHtmlPreserveNewlines(String html) {
    // <br> 태그를 줄바꿈으로 변환
    String result = html.replaceAll(RegExp(r'<br\s*/?>'), '\n');
    // 나머지 HTML 태그 제거
    result = result.replaceAll(RegExp(r'<[^>]*>'), '');
    // 연속 공백 정리 (줄바꿈은 유지)
    result = result.replaceAll(RegExp(r'[^\S\n]+'), ' ');
    // 연속 줄바꿈 정리
    result = result.replaceAll(RegExp(r'\n\s*\n'), '\n\n');
    return result.trim();
  }

  Widget _buildBattleSummary(Map<String, dynamic> metadata) {
    // 정찰 보고서인 경우
    final metaType = metadata['type'] as String?;
    if (metaType == 'spy') {
      final report = metadata['report'] as Map<String, dynamic>?;
      final targetName = report?['targetName'] ?? '알 수 없음';
      return Text(
        '정찰 대상: $targetName',
        style: TextStyle(
          color: AppColors.infoBlue,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      );
    }
    
    // 정찰 알림인 경우
    if (metaType == 'spy_alert') {
      final attackerCoord = metadata['attackerCoord'] ?? '?:?:?';
      return Text(
        '정찰 발원지: $attackerCoord',
        style: TextStyle(
          color: AppColors.warning,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      );
    }
    
    final resultType = metadata['resultType'] as String? ?? '알 수 없음';
    final isAttacker = metadata['isAttacker'] as bool? ?? true;
    
    return Text(
      '${isAttacker ? "공격" : "방어"} $resultType',
      style: TextStyle(
        color: resultType == '승리' ? AppColors.positive : (resultType == '패배' ? AppColors.negative : AppColors.textMuted),
        fontSize: 11,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _getTypeIcon(String type) {
    switch (type) {
      case 'battle':
        return Icon(Icons.military_tech, size: 14, color: AppColors.negative);
      case 'system':
        return Icon(Icons.settings, size: 14, color: AppColors.resourceCrystal);
      default:
        return Icon(Icons.person, size: 14, color: AppColors.accent);
    }
  }

  void _showMessageDetail(BuildContext context, Message message) {
    if (message.type == 'battle' && message.metadata != null) {
      final metaType = message.metadata!['type'] as String?;
      if (metaType == 'spy' || metaType == 'spy_alert') {
        _showSpyReportDialog(context, message);
      } else {
        _showBattleReportDialog(context, message);
      }
    } else {
      _showNormalMessageDialog(context, message);
    }
  }

  void _showSpyReportDialog(BuildContext context, Message message) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
            maxWidth: MediaQuery.of(context).size.width * 0.95,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 헤더
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.radar, color: AppColors.infoBlue, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            message.title,
                            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '보낸이: ${message.senderName}',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textMuted, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              // 정찰 보고서 내용
              Flexible(
                child: SingleChildScrollView(
                  child: _SpyReportDetail(metadata: message.metadata!),
                ),
              ),
              // 닫기 버튼
              Padding(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.infoBlue,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('닫기'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showNormalMessageDialog(BuildContext context, Message message) {
    // 플레이어 메시지인 경우 발신자 좌표 추출
    final senderCoordinate = message.type == 'player' && message.metadata != null
        ? message.metadata!['senderCoordinate'] as String?
        : null;

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Text(message.title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 16)),
        content: SizedBox(
          width: MediaQuery.of(context).size.width * 0.9,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      '보낸이: ${message.senderName}',
                      style: TextStyle(color: AppColors.accent, fontSize: 11),
                    ),
                    if (senderCoordinate != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        '[$senderCoordinate]',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  _stripHtmlPreserveNewlines(message.content),
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('닫기', style: TextStyle(color: AppColors.textMuted)),
          ),
          // 플레이어 메시지인 경우 답장 버튼 표시
          if (senderCoordinate != null)
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(dialogContext);
                _showReplyDialog(context, message.senderName, senderCoordinate);
              },
              icon: const Icon(Icons.reply, size: 16),
              label: const Text('답장'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.white,
              ),
            ),
        ],
      ),
    );
  }

  void _showReplyDialog(BuildContext context, String receiverName, String receiverCoordinate) {
    final titleController = TextEditingController(text: 'Re: ');
    final contentController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Row(
          children: [
            Icon(Icons.reply, color: AppColors.accent, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '$receiverName에게 답장',
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
                '좌표: $receiverCoordinate',
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
              _sendReply(context, receiverName, receiverCoordinate, titleController.text, contentController.text);
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

  void _sendReply(BuildContext context, String receiverName, String receiverCoordinate, String title, String content) async {
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
        receiverCoordinate: receiverCoordinate,
        title: title.trim(),
        content: content.trim(),
      );

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$receiverName에게 답장을 보냈습니다.'),
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

  void _showBattleReportDialog(BuildContext context, Message message) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: AppColors.panelBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
            maxWidth: MediaQuery.of(context).size.width * 0.95,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 헤더
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            message.title,
                            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '보낸이: ${message.senderName}',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textMuted, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              // 전투 보고서 내용
              Flexible(
                child: SingleChildScrollView(
                  child: _BattleReportDetail(metadata: message.metadata!),
                ),
              ),
              // 닫기 버튼
              Padding(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('닫기'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpyReportDetail extends StatelessWidget {
  final Map<String, dynamic> metadata;

  const _SpyReportDetail({required this.metadata});

  @override
  Widget build(BuildContext context) {
    final metaType = metadata['type'] as String?;
    
    // 정찰 알림 (피정찰자에게)
    if (metaType == 'spy_alert') {
      final attackerCoord = metadata['attackerCoord'] ?? '?:?:?';
      return Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.warning.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '정찰 감지!',
                          style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '좌표 $attackerCoord에서 정찰 위성이 발견되었습니다.',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                '⚠️ 누군가 당신의 행성을 정찰했습니다.\n공격이 임박했을 수 있으니 방어 준비를 하세요!',
                style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.5),
              ),
            ),
          ],
        ),
      );
    }
    
    // 정찰 보고서 (정찰자에게)
    final report = metadata['report'] as Map<String, dynamic>?;
    if (report == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text('정찰 데이터가 없습니다.', style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }

    final targetName = report['targetName'] ?? '알 수 없음';
    final targetCoord = report['targetCoord'] ?? '?:?:?';
    final probesLost = report['probesLost'] ?? 0;
    final probesSurvived = report['probesSurvived'] ?? 0;
    final stScore = report['stScore'] ?? 0;
    final mySpyLevel = report['mySpyLevel'] ?? 0;
    final targetSpyLevel = report['targetSpyLevel'] ?? 0;
    final resources = report['resources'] as Map<String, dynamic>?;
    final fleet = report['fleet'] as Map<String, dynamic>?;
    final defense = report['defense'] as Map<String, dynamic>?;
    final buildings = report['buildings'] as Map<String, dynamic>?;
    final research = report['research'] as Map<String, dynamic>?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 대상 정보
        Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.panelBorder),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.location_on, color: AppColors.accent, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '$targetName [$targetCoord]',
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '정찰 위성: $probesSurvived대 귀환, $probesLost대 손실',
                style: TextStyle(
                  color: probesLost > 0 ? AppColors.negative : AppColors.positive,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'ST 점수: $stScore (내 정탐: Lv.$mySpyLevel / 상대: Lv.$targetSpyLevel)',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
              ),
              const SizedBox(height: 2),
              Text(
                '※ ST≥2: 함대, ST≥3: 방어, ST≥5: 건물, ST≥7: 연구',
                style: TextStyle(color: AppColors.textMuted.withOpacity(0.7), fontSize: 9),
              ),
            ],
          ),
        ),
        
        // 자원 현황
        if (resources != null)
          _buildSpySection(
            '자원 현황',
            Icons.inventory_2,
            AppColors.resourceMetal,
            [
              _buildResourceItem('메탈', _toInt(resources['metal']), AppColors.resourceMetal),
              _buildResourceItem('크리스탈', _toInt(resources['crystal']), AppColors.resourceCrystal),
              _buildResourceItem('듀테륨', _toInt(resources['deuterium']), AppColors.resourceDeuterium),
              _buildResourceItem('에너지', _toInt(resources['energy']), AppColors.resourceEnergy),
            ],
          ),
        
        // 함대
        if (fleet != null)
          _buildSpySection(
            '함대',
            Icons.rocket_launch,
            AppColors.accent,
            _buildFleetOrDefenseItems(fleet, true),
          ),
        
        // 방어시설
        if (defense != null)
          _buildSpySection(
            '방어시설',
            Icons.shield,
            AppColors.positive,
            _buildFleetOrDefenseItems(defense, false),
          ),
        
        // 건물
        if (buildings != null)
          _buildSpySection(
            '건물',
            Icons.apartment,
            AppColors.warning,
            _buildBuildingsOrResearchItems(buildings),
          ),
        
        // 연구
        if (research != null)
          _buildSpySection(
            '연구',
            Icons.science,
            AppColors.resourceCrystal,
            _buildBuildingsOrResearchItems(research),
          ),
      ],
    );
  }

  Widget _buildSpySection(String title, IconData icon, Color color, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Row(
              children: [
                Icon(icon, color: color, size: 16),
                const SizedBox(width: 8),
                Text(title, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: children.isEmpty
                ? Text('정보 없음', style: TextStyle(color: AppColors.textMuted, fontSize: 11))
                : Column(children: children),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceItem(String name, int value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(name, style: TextStyle(color: color, fontSize: 11)),
          Text(_formatNumber(value), style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  List<Widget> _buildFleetOrDefenseItems(Map<String, dynamic> data, bool isFleet) {
    final entries = data.entries.where((e) => _toInt(e.value) > 0).toList();
    if (entries.isEmpty) {
      return [Text(isFleet ? '함대 없음' : '방어시설 없음', style: TextStyle(color: AppColors.textMuted, fontSize: 11))];
    }
    return entries.map((e) {
      final name = GameConstants.getName(e.key);
      final count = _toInt(e.value);
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(name, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
            Text(_formatNumber(count), style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }).toList();
  }

  List<Widget> _buildBuildingsOrResearchItems(Map<String, dynamic> data) {
    // _empty 플래그 체크 (모든 레벨이 0인 경우)
    if (data.containsKey('_empty')) {
      return [const Text('모두 Lv.0', style: TextStyle(color: AppColors.textMuted, fontSize: 11))];
    }
    final entries = data.entries.where((e) => !e.key.startsWith('_') && _toInt(e.value) > 0).toList();
    if (entries.isEmpty) {
      return [const Text('모두 Lv.0', style: TextStyle(color: AppColors.textMuted, fontSize: 11))];
    }
    return entries.map((e) {
      final name = GameConstants.getName(e.key);
      final level = _toInt(e.value);
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(name, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
            Text('Lv.$level', style: const TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }).toList();
  }

  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  String _formatNumber(int num) {
    if (num == 0) return '0';
    final str = num.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) {
        buffer.write(',');
      }
    }
    return buffer.toString().split('').reversed.join();
  }
}

class _BattleReportDetail extends StatelessWidget {
  final Map<String, dynamic> metadata;

  const _BattleReportDetail({required this.metadata});

  @override
  Widget build(BuildContext context) {
    final battleResult = metadata['battleResult'] as Map<String, dynamic>?;
    if (battleResult == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text('전투 데이터가 없습니다.', style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }

    final attackerWon = battleResult['result'] == 'awon';
    final defenderWon = battleResult['result'] == 'dwon';
    
    final attackerLosses = battleResult['attackerLosses'] as Map<String, dynamic>? ?? {};
    final defenderLosses = battleResult['defenderLosses'] as Map<String, dynamic>? ?? {};
    final loot = battleResult['loot'] as Map<String, dynamic>? ?? {};
    final debris = {
      'metal': battleResult['dm'] ?? 0,
      'crystal': battleResult['dk'] ?? 0,
    };
    final moonChance = battleResult['moonChance'] ?? 0;
    final restoredDefenses = battleResult['restoredDefenses'] as Map<String, dynamic>? ?? {};

    final before = battleResult['before'] as Map<String, dynamic>? ?? {};
    final beforeAttackers = (before['attackers'] as List<dynamic>?) ?? [];
    final beforeDefenders = (before['defenders'] as List<dynamic>?) ?? [];
    final rounds = (battleResult['rounds'] as List<dynamic>?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 전투 전 - 공격측
        _buildPreBattleSide('전투 전 - 공격측', beforeAttackers, true),
        
        // 전투 전 - 방어측
        _buildPreBattleSide('전투 전 - 방어측', beforeDefenders, false),
        
        // 라운드별 전투
        ...rounds.asMap().entries.map((entry) {
          final roundIdx = entry.key;
          final round = entry.value as Map<String, dynamic>;
          final prevRound = roundIdx > 0 ? rounds[roundIdx - 1] as Map<String, dynamic> : null;
          return _buildRoundSection(roundIdx + 1, round, prevRound, beforeAttackers, beforeDefenders);
        }),
        
        // 전투 결과
        _buildBattleResultSection(
          attackerWon: attackerWon,
          defenderWon: defenderWon,
          attackerLosses: attackerLosses,
          defenderLosses: defenderLosses,
          loot: loot,
          debris: debris,
          moonChance: moonChance,
          restoredDefenses: restoredDefenses,
        ),
      ],
    );
  }

  Widget _buildPreBattleSide(String title, List<dynamic> participants, bool isAttacker) {
    if (participants.isEmpty) return const SizedBox.shrink();
    
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          ...participants.map((p) {
            final participant = p as Map<String, dynamic>;
            return _buildParticipantSlot(participant, isAttacker, true);
          }),
        ],
      ),
    );
  }

  Widget _buildParticipantSlot(Map<String, dynamic> participant, bool isAttacker, bool showTech) {
    final name = participant['name'] ?? '알 수 없음';
    final coordinate = participant['coordinate'] ?? '?:?:?';
    final weap = participant['weap'] ?? 0;
    final shld = participant['shld'] ?? 0;
    final armr = participant['armr'] ?? 0;
    final fleet = (participant['fleet'] as Map<String, dynamic>?) ?? {};
    final defense = (participant['defense'] as Map<String, dynamic>?) ?? {};

    final allUnits = {...fleet, ...defense};
    final activeUnits = allUnits.entries.where((e) => (e.value as num) > 0).toList();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.panelBorder.withOpacity(0.5))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Column(
              children: [
                Text(
                  '${isAttacker ? "공격자" : "방어자"} $name [$coordinate]',
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                ),
                if (showTech)
                  Text(
                    '무기: ${weap * 10}%  방어막: ${shld * 10}%  장갑: ${armr * 10}%',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          if (activeUnits.isNotEmpty)
            _buildUnitTable(activeUnits, weap, shld, armr)
          else
            const Center(
              child: Padding(
                padding: EdgeInsets.all(8),
                child: Text('파괴됨', style: TextStyle(color: AppColors.negative, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildUnitTable(List<MapEntry<String, dynamic>> units, int weaponTech, int shieldTech, int armorTech) {
    final weaponBonus = 1 + weaponTech * 0.1;
    final shieldBonus = 1 + shieldTech * 0.1;
    final armorBonus = 1 + armorTech * 0.1;
    
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Table(
        defaultColumnWidth: const IntrinsicColumnWidth(),
        border: TableBorder.all(color: AppColors.panelBorder, width: 1),
        children: [
          TableRow(
            decoration: BoxDecoration(color: AppColors.panelHeader),
            children: [
              _tableCell('유형', isHeader: true),
              ...units.map((e) => _tableCell(GameConstants.getName(e.key), isHeader: true)),
            ],
          ),
          TableRow(
            children: [
              _tableCell('수량', isHeader: true),
              ...units.map((e) => _tableCell(_formatNumberFull(_toInt(e.value)))),
            ],
          ),
          TableRow(
            children: [
              _tableCell('공격력', isHeader: true),
              ...units.map((e) {
                final baseAttack = GameConstants.getBaseAttack(e.key);
                final attack = (baseAttack * weaponBonus).round();
                return _tableCell(_formatNumberFull(attack));
              }),
            ],
          ),
          TableRow(
            children: [
              _tableCell('방어막', isHeader: true),
              ...units.map((e) {
                final baseShield = GameConstants.getBaseShield(e.key);
                final shield = (baseShield * shieldBonus).round();
                return _tableCell(_formatNumberFull(shield));
              }),
            ],
          ),
          TableRow(
            children: [
              _tableCell('장갑', isHeader: true),
              ...units.map((e) {
                final baseHull = GameConstants.getBaseHull(e.key);
                final armor = (baseHull * armorBonus / 10).round();
                return _tableCell(_formatNumberFull(armor));
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tableCell(String text, {bool isHeader = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 10,
          fontWeight: isHeader ? FontWeight.bold : FontWeight.normal,
          color: isHeader ? AppColors.textPrimary : AppColors.textSecondary,
        ),
      ),
    );
  }

  Widget _buildRoundSection(int roundNum, Map<String, dynamic> round, Map<String, dynamic>? prevRound, List<dynamic> initialAttackers, List<dynamic> initialDefenders) {
    final ashoot = _toInt(round['ashoot']);
    final apower = _toInt(round['apower']);
    final dabsorb = _toInt(round['dabsorb']);
    final dshoot = _toInt(round['dshoot']);
    final dpower = _toInt(round['dpower']);
    final aabsorb = _toInt(round['aabsorb']);
    final attackers = (round['attackers'] as List<dynamic>?) ?? [];
    final defenders = (round['defenders'] as List<dynamic>?) ?? [];

    // 이전 라운드 대비 변화량 계산
    Map<String, int> attackerChanges = {};
    Map<String, int> defenderChanges = {};
    
    // 이전 상태 (이전 라운드 또는 초기 상태)
    final prevAttackers = prevRound != null 
        ? (prevRound['attackers'] as List<dynamic>?) ?? []
        : initialAttackers;
    final prevDefenders = prevRound != null 
        ? (prevRound['defenders'] as List<dynamic>?) ?? []
        : initialDefenders;
    
    // 이전 공격측 유닛 맵
    Map<String, int> prevAttackerUnits = {};
    for (final p in prevAttackers) {
      final participant = p as Map<String, dynamic>;
      final fleet = (participant['fleet'] as Map<String, dynamic>?) ?? {};
      fleet.forEach((key, value) {
        prevAttackerUnits[key] = (prevAttackerUnits[key] ?? 0) + _toInt(value);
      });
    }
    
    // 이전 방어측 유닛 맵
    Map<String, int> prevDefenderUnits = {};
    for (final p in prevDefenders) {
      final participant = p as Map<String, dynamic>;
      final fleet = (participant['fleet'] as Map<String, dynamic>?) ?? {};
      final defense = (participant['defense'] as Map<String, dynamic>?) ?? {};
      fleet.forEach((key, value) {
        prevDefenderUnits[key] = (prevDefenderUnits[key] ?? 0) + _toInt(value);
      });
      defense.forEach((key, value) {
        prevDefenderUnits[key] = (prevDefenderUnits[key] ?? 0) + _toInt(value);
      });
    }
    
    // 현재 공격측 유닛 맵
    Map<String, int> currAttackerUnits = {};
    for (final p in attackers) {
      final participant = p as Map<String, dynamic>;
      final fleet = (participant['fleet'] as Map<String, dynamic>?) ?? {};
      fleet.forEach((key, value) {
        currAttackerUnits[key] = (currAttackerUnits[key] ?? 0) + _toInt(value);
      });
    }
    
    // 현재 방어측 유닛 맵
    Map<String, int> currDefenderUnits = {};
    for (final p in defenders) {
      final participant = p as Map<String, dynamic>;
      final fleet = (participant['fleet'] as Map<String, dynamic>?) ?? {};
      final defense = (participant['defense'] as Map<String, dynamic>?) ?? {};
      fleet.forEach((key, value) {
        currDefenderUnits[key] = (currDefenderUnits[key] ?? 0) + _toInt(value);
      });
      defense.forEach((key, value) {
        currDefenderUnits[key] = (currDefenderUnits[key] ?? 0) + _toInt(value);
      });
    }
    
    // 변화량 계산
    for (final entry in prevAttackerUnits.entries) {
      final current = currAttackerUnits[entry.key] ?? 0;
      final diff = entry.value - current;
      if (diff > 0) attackerChanges[entry.key] = diff;
    }
    
    for (final entry in prevDefenderUnits.entries) {
      final current = currDefenderUnits[entry.key] ?? 0;
      final diff = entry.value - current;
      if (diff > 0) defenderChanges[entry.key] = diff;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.panelBorder),
            ),
            child: Column(
              children: [
                Text('라운드 $roundNum', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.panelHeader,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '공격 함대가 ${_formatNumberFull(ashoot)}번 발사하여 총 화력 ${_formatNumberFull(apower)}으로\n'
                    '방어측을 공격합니다. 방어측의 방어막이 ${_formatNumberFull(dabsorb)}의 피해를 흡수합니다.',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.panelHeader,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '방어 함대가 ${_formatNumberFull(dshoot)}번 발사하여 총 화력 ${_formatNumberFull(dpower)}으로\n'
                    '공격측을 공격합니다. 공격측의 방어막이 ${_formatNumberFull(aabsorb)}의 피해를 흡수합니다.',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          _buildRoundAfterSide('라운드 $roundNum 후 - 공격측:', attackers, true, attackerChanges),
          _buildRoundAfterSide('라운드 $roundNum 후 - 방어측:', defenders, false, defenderChanges),
        ],
      ),
    );
  }

  Widget _buildRoundAfterSide(String title, List<dynamic> participants, bool isAttacker, Map<String, int> changes) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
          ),
          if (participants.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: Text('파괴됨', style: TextStyle(color: AppColors.negative, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            )
          else
            ...participants.map((p) {
              final participant = p as Map<String, dynamic>;
              final name = participant['name'] ?? '알 수 없음';
              final coordinate = participant['coordinate'] ?? '?:?:?';
              final fleet = (participant['fleet'] as Map<String, dynamic>?) ?? {};
              final defense = (participant['defense'] as Map<String, dynamic>?) ?? {};
              final allUnits = {...fleet, ...defense};
              final activeUnits = allUnits.entries.where((e) => (e.value as num) > 0).toList();

              return Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${isAttacker ? "공격자" : "방어자"} $name [$coordinate]',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                    ),
                    const SizedBox(height: 8),
                    if (activeUnits.isEmpty)
                      const Text('파괴됨', style: TextStyle(color: AppColors.negative, fontSize: 10))
                    else
                      _buildRoundUnitTable(activeUnits, changes),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildRoundUnitTable(List<MapEntry<String, dynamic>> units, Map<String, int> changes) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Table(
        defaultColumnWidth: const IntrinsicColumnWidth(),
        border: TableBorder.all(color: AppColors.panelBorder, width: 1),
        children: [
          TableRow(
            decoration: BoxDecoration(color: AppColors.panelHeader),
            children: [
              _tableCell('유형', isHeader: true),
              ...units.map((e) => _tableCell(GameConstants.getName(e.key), isHeader: true)),
            ],
          ),
          TableRow(
            children: [
              _tableCell('수량', isHeader: true),
              ...units.map((e) {
                final change = changes[e.key] ?? 0;
                if (change > 0) {
                  return _tableCellWithChange(_formatNumberFull(_toInt(e.value)), change);
                }
                return _tableCell(_formatNumberFull(_toInt(e.value)));
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tableCellWithChange(String text, int change) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      child: Column(
        children: [
          Text(text, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
          Text(
            '(▼${_formatNumberFull(change)})',
            style: const TextStyle(fontSize: 9, color: AppColors.negative),
          ),
        ],
      ),
    );
  }

  Widget _buildBattleResultSection({
    required bool attackerWon,
    required bool defenderWon,
    required Map<String, dynamic> attackerLosses,
    required Map<String, dynamic> defenderLosses,
    required Map<String, dynamic> loot,
    required Map<String, dynamic> debris,
    required int moonChance,
    required Map<String, dynamic> restoredDefenses,
  }) {
    final resultText = attackerWon 
        ? '공격자가 전투에서 승리했습니다!' 
        : (defenderWon ? '방어자가 전투에서 승리했습니다!' : '전투가 무승부로 끝났습니다.');

    final attackerTotal = _toInt(attackerLosses['metal']) + _toInt(attackerLosses['crystal']) + _toInt(attackerLosses['deuterium']);
    final defenderTotal = _toInt(defenderLosses['metal']) + _toInt(defenderLosses['crystal']) + _toInt(defenderLosses['deuterium']);

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: const Text(
              '전투 결과',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            child: Text(
              resultText,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (attackerWon) ...[
                  const Text('약탈한 자원:', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                  const SizedBox(height: 6),
                  _buildResourceRow('메탈', _toInt(loot['metal'])),
                  _buildResourceRow('크리스탈', _toInt(loot['crystal'])),
                  _buildResourceRow('중수소', _toInt(loot['deuterium'])),
                  const Divider(color: AppColors.panelBorder, height: 20),
                ],
                const Text('손실 통계', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 6),
                Text('공격자 총 손실: ${_formatNumberFull(attackerTotal)} 유닛', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                Text('방어자 총 손실: ${_formatNumberFull(defenderTotal)} 유닛', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                const SizedBox(height: 12),
                const Text('잔해 필드', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 4),
                Text(
                  '메탈 ${_formatNumberFull(_toInt(debris['metal']))} | 크리스탈 ${_formatNumberFull(_toInt(debris['crystal']))}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                ),
                const SizedBox(height: 8),
                Text('달 생성 확률: $moonChance%', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                if (restoredDefenses.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('방어시설 복구', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text(
                    restoredDefenses.entries
                        .where((e) => (e.value as num) > 0)
                        .map((e) => '${e.value} ${GameConstants.getName(e.key)}')
                        .join(', ') + ' 복구됨',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceRow(String label, int value) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, top: 2),
      child: Text('$label: ${_formatNumberFull(value)}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
    );
  }

  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  String _formatNumberFull(int num) {
    if (num == 0) return '0';
    final str = num.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) {
        buffer.write(',');
      }
    }
    return buffer.toString().split('').reversed.join();
  }
}
