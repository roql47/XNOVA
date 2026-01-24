import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../providers/providers.dart';
import '../../../data/services/socket_service.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final VoidCallback onClose;

  const ChatScreen({super.key, required this.onClose});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _globalMessageController = TextEditingController();
  final TextEditingController _allianceMessageController = TextEditingController();
  final ScrollController _globalScrollController = ScrollController();
  final ScrollController _allianceScrollController = ScrollController();
  late TabController _tabController;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeChat();
    });
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      if (_tabController.index == 1) {
        // 연합 채팅 탭으로 전환 시 입장
        ref.read(allianceChatProvider.notifier).joinChat();
      }
    }
  }

  Future<void> _initializeChat() async {
    if (!mounted) return;
    final chatNotifier = ref.read(chatProvider.notifier);
    await chatNotifier.connect();
    if (!mounted) return;
    setState(() {
      _isInitialized = true;
    });
    _scrollToBottom(_globalScrollController);
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _globalMessageController.dispose();
    _allianceMessageController.dispose();
    _globalScrollController.dispose();
    _allianceScrollController.dispose();
    super.dispose();
  }

  void _sendGlobalMessage() {
    final message = _globalMessageController.text.trim();
    if (message.isNotEmpty) {
      ref.read(chatProvider.notifier).sendMessage(message);
      _globalMessageController.clear();
      _scrollToBottom(_globalScrollController);
    }
  }

  void _sendAllianceMessage() {
    final message = _allianceMessageController.text.trim();
    if (message.isNotEmpty) {
      ref.read(allianceChatProvider.notifier).sendMessage(message);
      _allianceMessageController.clear();
      _scrollToBottom(_allianceScrollController);
    }
  }

  void _scrollToBottom(ScrollController controller) {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (controller.hasClients) {
        controller.animateTo(
          controller.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final allianceChatState = ref.watch(allianceChatProvider);

    // 새 메시지가 오면 스크롤
    ref.listen<ChatState>(chatProvider, (previous, next) {
      if (previous == null || 
          (previous.messages.isEmpty && next.messages.isNotEmpty) ||
          next.messages.length > previous.messages.length) {
        _scrollToBottom(_globalScrollController);
      }
    });

    ref.listen<AllianceChatState>(allianceChatProvider, (previous, next) {
      if (previous == null || 
          (previous.messages.isEmpty && next.messages.isNotEmpty) ||
          next.messages.length > previous.messages.length) {
        _scrollToBottom(_allianceScrollController);
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: widget.onClose,
        ),
        title: const Text(
          '채팅',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent,
          labelColor: AppColors.accent,
          unselectedLabelColor: AppColors.textMuted,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.public, size: 18),
                  const SizedBox(width: 6),
                  const Text('전체'),
                  if (chatState.userCount > 0) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${chatState.userCount}',
                        style: const TextStyle(fontSize: 10),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.shield, size: 18),
                  const SizedBox(width: 6),
                  Text(allianceChatState.allianceTag ?? '연합'),
                  if (allianceChatState.userCount > 0) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.positive.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${allianceChatState.userCount}',
                        style: const TextStyle(fontSize: 10),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 전체 채팅
          _buildGlobalChatTab(chatState),
          // 연합 채팅
          _buildAllianceChatTab(allianceChatState),
        ],
      ),
    );
  }

  Widget _buildGlobalChatTab(ChatState chatState) {
    final currentUserId = ref.read(chatProvider.notifier).currentUserId;

    return Column(
      children: [
        Expanded(
          child: chatState.isLoading && chatState.messages.isEmpty
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.accent),
                )
              : chatState.messages.isEmpty
                  ? _buildEmptyState('전체 채팅', '다른 플레이어들과 대화해보세요!')
                  : ListView.builder(
                      controller: _globalScrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: chatState.messages.length,
                      itemBuilder: (context, index) {
                        final message = chatState.messages[index];
                        final isMe = message.senderId == currentUserId;
                        return _ChatBubble(message: message, isMe: isMe);
                      },
                    ),
        ),
        _buildInputArea(
          controller: _globalMessageController,
          onSend: _sendGlobalMessage,
          isConnected: chatState.isConnected,
          placeholder: '전체 채팅...',
        ),
      ],
    );
  }

  Widget _buildAllianceChatTab(AllianceChatState chatState) {
    final currentUserId = ref.read(allianceChatProvider.notifier).currentUserId;

    // 연합 미가입 상태
    if (chatState.error != null && chatState.error!.contains('가입')) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shield_outlined,
              size: 64,
              color: AppColors.textMuted.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              '연합에 가입되어 있지 않습니다',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '연합에 가입하면 연합원들과 채팅할 수 있습니다',
              style: TextStyle(
                color: AppColors.textMuted.withOpacity(0.7),
                fontSize: 12,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: chatState.isLoading && chatState.messages.isEmpty
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.positive),
                )
              : chatState.messages.isEmpty
                  ? _buildEmptyState('연합 채팅', '연합원들과 대화해보세요!')
                  : ListView.builder(
                      controller: _allianceScrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: chatState.messages.length,
                      itemBuilder: (context, index) {
                        final message = chatState.messages[index];
                        final isMe = message.senderId == currentUserId;
                        return _ChatBubble(
                          message: message,
                          isMe: isMe,
                          isAlliance: true,
                        );
                      },
                    ),
        ),
        _buildInputArea(
          controller: _allianceMessageController,
          onSend: _sendAllianceMessage,
          isConnected: chatState.isConnected,
          placeholder: '연합 채팅...',
          accentColor: AppColors.positive,
        ),
      ],
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: AppColors.textMuted.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            '아직 메시지가 없습니다',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(
              color: AppColors.textMuted.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea({
    required TextEditingController controller,
    required VoidCallback onSend,
    required bool isConnected,
    required String placeholder,
    Color accentColor = AppColors.accent,
  }) {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.panelBorder, width: 1),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.panelBackground,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.panelBorder),
              ),
              child: TextField(
                controller: controller,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                maxLength: 200,
                maxLines: 1,
                enabled: isConnected,
                decoration: InputDecoration(
                  hintText: isConnected ? placeholder : '연결 중...',
                  hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.5)),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  counterText: '',
                ),
                onSubmitted: (_) => onSend(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: isConnected ? accentColor : AppColors.textMuted,
            borderRadius: BorderRadius.circular(20),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: isConnected ? onSend : null,
              child: Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                child: const Icon(
                  Icons.send,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final bool isAlliance;

  const _ChatBubble({
    required this.message,
    required this.isMe,
    this.isAlliance = false,
  });

  String _formatTime(DateTime time) {
    final kst = toKST(time);
    final hour = kst.hour.toString().padLeft(2, '0');
    final minute = kst.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Color _getAvatarColor(String odId) {
    final colors = [
      const Color(0xFF6366F1),
      const Color(0xFF8B5CF6),
      const Color(0xFFEC4899),
      const Color(0xFFEF4444),
      const Color(0xFFF97316),
      const Color(0xFFF59E0B),
      const Color(0xFF10B981),
      const Color(0xFF14B8A6),
      const Color(0xFF06B6D4),
      const Color(0xFF3B82F6),
    ];
    final hash = odId.hashCode.abs();
    return colors[hash % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final avatarColor = _getAvatarColor(message.senderId);
    final initial = message.senderName.isNotEmpty 
        ? message.senderName[0].toUpperCase() 
        : '?';
    final bubbleColor = isAlliance ? AppColors.positive : AppColors.accent;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMe) ...[
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8, top: 2),
              decoration: BoxDecoration(
                color: avatarColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  initial,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      message.senderName,
                      style: TextStyle(
                        color: avatarColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.panelBackground,
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(4),
                              topRight: Radius.circular(16),
                              bottomRight: Radius.circular(16),
                              bottomLeft: Radius.circular(16),
                            ),
                            border: Border.all(color: AppColors.panelBorder),
                          ),
                          child: Text(
                            message.message,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _formatTime(message.timestamp),
                        style: TextStyle(
                          color: AppColors.textMuted.withOpacity(0.6),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ] else ...[
            Text(
              _formatTime(message.timestamp),
              style: TextStyle(
                color: AppColors.textMuted.withOpacity(0.6),
                fontSize: 10,
              ),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: bubbleColor.withOpacity(0.2),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                    bottomLeft: Radius.circular(16),
                    bottomRight: Radius.circular(4),
                  ),
                  border: Border.all(color: bubbleColor.withOpacity(0.3)),
                ),
                child: Text(
                  message.message,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
