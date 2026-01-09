import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/providers.dart';

class NicknameSetupScreen extends ConsumerStatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onCancel;

  const NicknameSetupScreen({
    super.key,
    required this.onComplete,
    required this.onCancel,
  });

  @override
  ConsumerState<NicknameSetupScreen> createState() => _NicknameSetupScreenState();
}

class _NicknameSetupScreenState extends ConsumerState<NicknameSetupScreen> {
  final _nicknameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    // 추천 닉네임이 있으면 미리 채워넣기
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final suggestedName = ref.read(authProvider).suggestedNickname;
      if (suggestedName != null && suggestedName.isNotEmpty) {
        _nicknameController.text = suggestedName;
      }
    });
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    super.dispose();
  }

  Future<void> _completeSignup() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).completeGoogleSignup(
      _nicknameController.text.trim(),
    );

    if (success) {
      widget.onComplete();
    }
  }

  void _cancel() {
    ref.read(authProvider.notifier).cancelGoogleSignup();
    widget.onCancel();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.ogameBlack,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 타이틀
                    const Icon(
                      Icons.rocket_launch,
                      size: 64,
                      color: AppColors.ogameGreen,
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      '플레이어 이름 설정',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '게임에서 사용할 이름을 입력해주세요',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 40),

                    // 닉네임 입력
                    TextFormField(
                      controller: _nicknameController,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: InputDecoration(
                        labelText: '플레이어 이름',
                        labelStyle: const TextStyle(color: AppColors.textSecondary),
                        hintText: '2~20자',
                        hintStyle: const TextStyle(color: AppColors.textMuted),
                        prefixIcon: const Icon(
                          Icons.person,
                          color: AppColors.textSecondary,
                        ),
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.ogameGreen,
                            width: 2,
                          ),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.errorRed,
                            width: 1,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return '플레이어 이름을 입력해주세요';
                        }
                        if (value.trim().length < 2) {
                          return '최소 2자 이상 입력해주세요';
                        }
                        if (value.trim().length > 20) {
                          return '최대 20자까지 입력할 수 있습니다';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // 에러 메시지
                    if (authState.error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.errorRed.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.errorRed.withOpacity(0.5),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: AppColors.errorRed,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authState.error!,
                                style: const TextStyle(
                                  color: AppColors.errorRed,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // 완료 버튼
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: authState.isLoading ? null : _completeSignup,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.ogameGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          disabledBackgroundColor: AppColors.ogameGreen.withOpacity(0.5),
                        ),
                        child: authState.isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                '게임 시작',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // 취소 버튼
                    TextButton(
                      onPressed: authState.isLoading ? null : _cancel,
                      child: const Text(
                        '취소',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}





