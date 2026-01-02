import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/providers.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/token_service.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onLogout;

  const SettingsScreen({
    super.key,
    required this.onClose,
    required this.onLogout,
  });

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late ApiService _apiService;
  bool _isLoading = false;
  Map<String, dynamic>? _vacationStatus;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService(tokenService: TokenService());
    _loadVacationStatus();
  }

  Future<void> _loadVacationStatus() async {
    try {
      final status = await _apiService.getVacationStatus();
      setState(() {
        _vacationStatus = status;
      });
    } catch (e) {
      // 에러 무시
    }
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameProvider);
    
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
          onPressed: widget.onClose,
        ),
        title: const Text(
          '설정',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('행성 설정'),
                  _buildSettingCard([
                    _buildSettingItem(
                      icon: Icons.edit_rounded,
                      title: '행성 이름 변경',
                      subtitle: gameState.planetName ?? '행성',
                      onTap: () => _showPlanetNameDialog(gameState.planetName ?? ''),
                    ),
                  ]),
                  
                  const SizedBox(height: 24),
                  _buildSectionTitle('계정 설정'),
                  _buildSettingCard([
                    _buildSettingItem(
                      icon: Icons.lock_rounded,
                      title: '비밀번호 변경',
                      subtitle: '계정 비밀번호를 변경합니다',
                      onTap: _showPasswordChangeDialog,
                    ),
                  ]),
                  
                  const SizedBox(height: 24),
                  _buildSectionTitle('휴가 모드'),
                  _buildVacationCard(),
                  
                  const SizedBox(height: 24),
                  _buildSectionTitle('위험 설정', isWarning: true),
                  _buildSettingCard([
                    _buildSettingItem(
                      icon: Icons.refresh_rounded,
                      title: '계정 초기화',
                      subtitle: '모든 게임 데이터를 초기화합니다',
                      onTap: _showResetAccountDialog,
                      isDestructive: true,
                    ),
                    _buildDivider(),
                    _buildSettingItem(
                      icon: Icons.delete_forever_rounded,
                      title: '계정 탈퇴',
                      subtitle: '계정을 완전히 삭제합니다',
                      onTap: _showDeleteAccountDialog,
                      isDestructive: true,
                    ),
                  ]),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title, {bool isWarning = false}) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          color: isWarning ? AppColors.negative : AppColors.textMuted,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildSettingCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isDestructive 
                      ? AppColors.negative.withOpacity(0.1)
                      : AppColors.accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: isDestructive ? AppColors.negative : AppColors.accent,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: isDestructive ? AppColors.negative : AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textMuted,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      height: 1,
      color: AppColors.panelBorder,
    );
  }

  Widget _buildVacationCard() {
    final isActive = _vacationStatus?['isActive'] ?? false;
    final canActivate = _vacationStatus?['canActivate'] ?? false;
    final reason = _vacationStatus?['canActivateReason'];
    
    String? remainingTime;
    if (isActive && _vacationStatus?['minEndTime'] != null) {
      final minEndTime = DateTime.parse(_vacationStatus!['minEndTime']);
      final now = DateTime.now();
      if (minEndTime.isAfter(now)) {
        final diff = minEndTime.difference(now);
        final hours = diff.inHours;
        final minutes = diff.inMinutes % 60;
        remainingTime = '${hours}시간 ${minutes}분 후 해제 가능';
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? AppColors.warning.withOpacity(0.5) : AppColors.panelBorder,
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isActive 
                      ? AppColors.warning.withOpacity(0.1)
                      : AppColors.accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.beach_access_rounded,
                  color: isActive ? AppColors.warning : AppColors.accent,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '휴가 모드',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isActive ? '활성화됨' : '비활성화됨',
                      style: TextStyle(
                        color: isActive ? AppColors.warning : AppColors.textMuted,
                        fontSize: 12,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoRow('효과', '모든 자원 생산 중단, 공격 불가'),
                const SizedBox(height: 6),
                _buildInfoRow('최소 기간', '48시간'),
                const SizedBox(height: 6),
                _buildInfoRow('조건', '진행 중인 작업이 없어야 함'),
              ],
            ),
          ),
          if (remainingTime != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                remainingTime,
                style: const TextStyle(
                  color: AppColors.warning,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
          if (!isActive && !canActivate && reason != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.negative.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                reason,
                style: const TextStyle(
                  color: AppColors.negative,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isActive
                  ? (remainingTime == null ? _deactivateVacation : null)
                  : (canActivate ? _showActivateVacationDialog : null),
              style: ElevatedButton.styleFrom(
                backgroundColor: isActive ? AppColors.surface : AppColors.accent,
                foregroundColor: isActive ? AppColors.textPrimary : Colors.white,
                disabledBackgroundColor: AppColors.surface.withOpacity(0.5),
                disabledForegroundColor: AppColors.textMuted,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: isActive 
                      ? BorderSide(color: AppColors.panelBorder) 
                      : BorderSide.none,
                ),
              ),
              child: Text(
                isActive ? '휴가 모드 해제' : '휴가 모드 활성화',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 60,
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 12,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  void _showPlanetNameDialog(String currentName) {
    final controller = TextEditingController(text: currentName);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text(
          '행성 이름 변경',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: '새 행성 이름',
            hintStyle: TextStyle(color: AppColors.textMuted),
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.panelBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.panelBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.accent),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => _updatePlanetName(controller.text),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
            ),
            child: const Text('변경'),
          ),
        ],
      ),
    );
  }

  Future<void> _updatePlanetName(String newName) async {
    Navigator.pop(context);
    
    if (newName.trim().length < 2) {
      _showMessage('행성 이름은 2자 이상이어야 합니다.', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await _apiService.updatePlanetName(newName.trim());
      if (result['success'] == true) {
        _showMessage('행성 이름이 변경되었습니다.');
        ref.read(gameProvider.notifier).loadAllData();
      } else {
        _showMessage(result['message'] ?? '변경에 실패했습니다.', isError: true);
      }
    } catch (e) {
      _showMessage('오류가 발생했습니다.', isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showPasswordChangeDialog() {
    final currentController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text(
          '비밀번호 변경',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildPasswordField(currentController, '현재 비밀번호'),
            const SizedBox(height: 12),
            _buildPasswordField(newController, '새 비밀번호'),
            const SizedBox(height: 12),
            _buildPasswordField(confirmController, '새 비밀번호 확인'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => _updatePassword(
              currentController.text,
              newController.text,
              confirmController.text,
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
            ),
            child: const Text('변경'),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordField(TextEditingController controller, String hint) {
    return TextField(
      controller: controller,
      obscureText: true,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: AppColors.textMuted),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: AppColors.panelBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: AppColors.panelBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: AppColors.accent),
        ),
      ),
    );
  }

  Future<void> _updatePassword(String current, String newPw, String confirm) async {
    if (newPw != confirm) {
      _showMessage('새 비밀번호가 일치하지 않습니다.', isError: true);
      return;
    }
    
    if (newPw.length < 6) {
      _showMessage('비밀번호는 6자 이상이어야 합니다.', isError: true);
      return;
    }

    Navigator.pop(context);
    setState(() => _isLoading = true);
    
    try {
      final result = await _apiService.updatePassword(current, newPw);
      if (result['success'] == true) {
        _showMessage('비밀번호가 변경되었습니다.');
      } else {
        _showMessage(result['message'] ?? '변경에 실패했습니다.', isError: true);
      }
    } catch (e) {
      _showMessage('오류가 발생했습니다.', isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showActivateVacationDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text(
          '휴가 모드 활성화',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: const Text(
          '휴가 모드를 활성화하면:\n\n'
          '• 모든 자원 생산이 중단됩니다\n'
          '• 다른 플레이어가 공격할 수 없습니다\n'
          '• 최소 48시간 후에 해제할 수 있습니다\n\n'
          '활성화하시겠습니까?',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _activateVacation();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.warning,
            ),
            child: const Text('활성화'),
          ),
        ],
      ),
    );
  }

  Future<void> _activateVacation() async {
    setState(() => _isLoading = true);
    try {
      final result = await _apiService.activateVacation();
      if (result['success'] == true) {
        _showMessage('휴가 모드가 활성화되었습니다.');
        _loadVacationStatus();
      } else {
        _showMessage(result['message'] ?? '활성화에 실패했습니다.', isError: true);
      }
    } catch (e) {
      _showMessage('오류가 발생했습니다.', isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deactivateVacation() async {
    setState(() => _isLoading = true);
    try {
      final result = await _apiService.deactivateVacation();
      if (result['success'] == true) {
        _showMessage('휴가 모드가 해제되었습니다.');
        _loadVacationStatus();
        ref.read(gameProvider.notifier).loadAllData();
      } else {
        _showMessage(result['message'] ?? '해제에 실패했습니다.', isError: true);
      }
    } catch (e) {
      _showMessage('오류가 발생했습니다.', isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showResetAccountDialog() {
    final passwordController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text(
          '계정 초기화',
          style: TextStyle(color: AppColors.negative),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '⚠️ 경고: 이 작업은 되돌릴 수 없습니다!\n\n'
              '모든 게임 데이터가 초기화됩니다:\n'
              '• 모든 건물, 연구, 함대, 방어시설\n'
              '• 모든 자원\n'
              '• 새로운 행성 좌표 배정\n\n'
              '계속하려면 비밀번호를 입력하세요:',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            _buildPasswordField(passwordController, '비밀번호'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => _resetAccount(passwordController.text),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.negative,
            ),
            child: const Text('초기화'),
          ),
        ],
      ),
    );
  }

  Future<void> _resetAccount(String password) async {
    Navigator.pop(context);
    setState(() => _isLoading = true);
    
    try {
      final result = await _apiService.resetAccount(password);
      if (result['success'] == true) {
        _showMessage('계정이 초기화되었습니다.');
        ref.read(gameProvider.notifier).loadAllData();
        ref.read(gameProvider.notifier).loadProfile();
      } else {
        _showMessage(result['message'] ?? '초기화에 실패했습니다.', isError: true);
      }
    } catch (e) {
      _showMessage('오류가 발생했습니다.', isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showDeleteAccountDialog() {
    final passwordController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.panelBackground,
        title: const Text(
          '계정 탈퇴',
          style: TextStyle(color: AppColors.negative),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '⚠️ 경고: 이 작업은 되돌릴 수 없습니다!\n\n'
              '계정이 완전히 삭제됩니다:\n'
              '• 모든 게임 데이터 삭제\n'
              '• 계정 정보 삭제\n'
              '• 같은 이메일로 재가입 가능\n\n'
              '계속하려면 비밀번호를 입력하세요:',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            _buildPasswordField(passwordController, '비밀번호'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => _deleteAccount(passwordController.text),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.negative,
            ),
            child: const Text('탈퇴'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteAccount(String password) async {
    Navigator.pop(context);
    setState(() => _isLoading = true);
    
    try {
      final result = await _apiService.deleteAccount(password);
      if (result['success'] == true) {
        _showMessage('계정이 삭제되었습니다.');
        // 로그아웃 처리
        widget.onLogout();
      } else {
        _showMessage(result['message'] ?? '삭제에 실패했습니다.', isError: true);
      }
    } catch (e) {
      _showMessage('오류가 발생했습니다.', isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.negative : AppColors.positive,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}

