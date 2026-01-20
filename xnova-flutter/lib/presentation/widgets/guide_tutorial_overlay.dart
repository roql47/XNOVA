import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// 가이드 단계 정보를 담는 클래스
class GuideStep {
  final String title;
  final String description;
  final GlobalKey? targetKey;
  final Alignment tooltipAlignment;
  final EdgeInsets tooltipMargin;
  final IconData? icon;
  final String? tabToShow; // 해당 단계에서 보여줄 탭 이름

  const GuideStep({
    required this.title,
    required this.description,
    this.targetKey,
    this.tooltipAlignment = Alignment.center,
    this.tooltipMargin = const EdgeInsets.all(20),
    this.icon,
    this.tabToShow,
  });
}

/// 인터랙티브 가이드 튜토리얼 오버레이 위젯
class GuideTutorialOverlay extends StatefulWidget {
  final List<GuideStep> steps;
  final VoidCallback onComplete;
  final VoidCallback onSkip;
  final void Function(String? tabName)? onStepChanged; // 단계 변경 시 탭 전환 콜백

  const GuideTutorialOverlay({
    super.key,
    required this.steps,
    required this.onComplete,
    required this.onSkip,
    this.onStepChanged,
  });

  @override
  State<GuideTutorialOverlay> createState() => _GuideTutorialOverlayState();
}

class _GuideTutorialOverlayState extends State<GuideTutorialOverlay>
    with SingleTickerProviderStateMixin {
  int _currentStep = 0;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );
    _animationController.forward();
    
    // 첫 번째 단계의 탭으로 전환
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifyTabChange();
    });
  }
  
  void _notifyTabChange() {
    final step = widget.steps[_currentStep];
    widget.onStepChanged?.call(step.tabToShow);
    
    // 탭 전환 후 레이아웃이 완료되면 다시 빌드
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < widget.steps.length - 1) {
      setState(() {
        _currentStep++;
      });
      _animationController.reset();
      _animationController.forward();
      _notifyTabChange();
    } else {
      widget.onComplete();
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
      _animationController.reset();
      _animationController.forward();
      _notifyTabChange();
    }
  }

  Rect? _getTargetRect() {
    final step = widget.steps[_currentStep];
    if (step.targetKey?.currentContext == null) return null;

    try {
      final RenderBox? renderBox =
          step.targetKey!.currentContext!.findRenderObject() as RenderBox?;
      if (renderBox == null || !renderBox.hasSize) return null;

      final position = renderBox.localToGlobal(Offset.zero);
      final size = renderBox.size;

      return Rect.fromLTWH(
        position.dx - 8,
        position.dy - 8,
        size.width + 16,
        size.height + 16,
      );
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final step = widget.steps[_currentStep];
    final targetRect = _getTargetRect();
    final screenSize = MediaQuery.of(context).size;

    return Container(
      width: screenSize.width,
      height: screenSize.height,
      color: Colors.transparent,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 어두운 오버레이 배경 (하이라이트 영역 제외)
          Positioned.fill(
            child: GestureDetector(
              onTap: () {}, // 배경 터치 무시
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return CustomPaint(
                    size: Size(constraints.maxWidth, constraints.maxHeight),
                    painter: _OverlayPainter(
                      highlightRect: targetRect,
                      overlayColor: const Color(0xD9000000), // Colors.black.withOpacity(0.85)
                    ),
                  );
                },
              ),
            ),
          ),

          // 하이라이트 영역 테두리 (타겟이 있을 때)
          if (targetRect != null)
            Positioned(
              left: targetRect.left,
              top: targetRect.top,
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Opacity(
                      opacity: _fadeAnimation.value,
                      child: Container(
                        width: targetRect.width,
                        height: targetRect.height,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.accent,
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withOpacity(0.3),
                              blurRadius: 20,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

          // 툴팁 / 설명 박스
          _buildTooltip(step, targetRect),

          // 하단 컨트롤 버튼
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.of(context).padding.bottom + 20,
            child: _buildControls(),
          ),

          // 상단 스킵 버튼
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            right: 16,
            child: _buildSkipButton(),
          ),
        ],
      ),
    );
  }

  Widget _buildTooltip(GuideStep step, Rect? targetRect) {
    final screenSize = MediaQuery.of(context).size;
    final padding = MediaQuery.of(context).padding;

    // 사용 가능한 영역 계산 (상단 패딩 + 하단 컨트롤 버튼 영역 제외)
    final topSafeArea = padding.top + 50; // 스킵 버튼 영역
    final bottomSafeArea = padding.bottom + 100; // 하단 컨트롤 버튼 영역
    final availableHeight = screenSize.height - topSafeArea - bottomSafeArea;
    
    // 툴팁 최대 높이 (화면의 50% 또는 가용 높이의 60% 중 작은 값)
    final maxTooltipHeight = (availableHeight * 0.6).clamp(200.0, screenSize.height * 0.5);

    // 툴팁 위치 계산
    double top;
    if (targetRect != null) {
      final targetCenter = targetRect.center.dy;
      final screenCenter = screenSize.height / 2;
      
      if (targetCenter < screenCenter) {
        // 타겟이 상단에 있으면 타겟 아래에 표시
        top = targetRect.bottom + 20;
        // 화면 하단을 벗어나지 않도록 조정
        if (top + maxTooltipHeight > screenSize.height - bottomSafeArea) {
          top = screenSize.height - bottomSafeArea - maxTooltipHeight - 10;
        }
      } else {
        // 타겟이 하단에 있으면 타겟 위에 표시
        top = topSafeArea + 10;
      }
    } else {
      // 타겟이 없으면 화면 중앙 상단에 표시
      top = topSafeArea + 10;
    }
    
    // 최소 top 값 보장
    top = top.clamp(topSafeArea, screenSize.height - bottomSafeArea - 150);

    return Positioned(
      top: top,
      left: 16,
      right: 16,
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Opacity(
            opacity: _fadeAnimation.value,
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: child,
            ),
          );
        },
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: maxTooltipHeight,
          ),
          child: _TooltipContent(
            step: step,
            currentStep: _currentStep,
            totalSteps: widget.steps.length,
          ),
        ),
      ),
    );
  }

  Widget _buildControls() {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Opacity(
          opacity: _fadeAnimation.value,
          child: child,
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // 이전 버튼
            _currentStep > 0
                ? _buildNavButton(
                    icon: Icons.arrow_back_rounded,
                    label: '이전',
                    onTap: _previousStep,
                    isPrimary: false,
                  )
                : const SizedBox(width: 100),

            // 진행 표시
            _buildProgressIndicator(),

            // 다음/완료 버튼
            _buildNavButton(
              icon: _currentStep < widget.steps.length - 1
                  ? Icons.arrow_forward_rounded
                  : Icons.check_rounded,
              label: _currentStep < widget.steps.length - 1 ? '다음' : '완료',
              onTap: _nextStep,
              isPrimary: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isPrimary,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isPrimary ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(
            color: isPrimary ? AppColors.accent : AppColors.panelBorder,
            width: 1,
          ),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: AppColors.accent.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isPrimary) ...[
              Icon(icon, color: AppColors.textSecondary, size: 18),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: TextStyle(
                color: isPrimary ? Colors.white : AppColors.textSecondary,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            if (isPrimary) ...[
              const SizedBox(width: 8),
              Icon(icon, color: Colors.white, size: 18),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        widget.steps.length,
        (index) => Container(
          width: index == _currentStep ? 24 : 8,
          height: 8,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          decoration: BoxDecoration(
            color: index == _currentStep
                ? AppColors.accent
                : index < _currentStep
                    ? AppColors.accent.withOpacity(0.5)
                    : AppColors.textMuted.withOpacity(0.3),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }

  Widget _buildSkipButton() {
    return GestureDetector(
      onTap: widget.onSkip,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.panelBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '스킵',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.close_rounded,
              color: AppColors.textSecondary,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}

/// 오버레이 페인터 - 하이라이트 영역을 제외한 어두운 배경
class _OverlayPainter extends CustomPainter {
  final Rect? highlightRect;
  final Color overlayColor;

  _OverlayPainter({
    this.highlightRect,
    required this.overlayColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = overlayColor;

    // 전체 화면을 어둡게
    final fullRect = Rect.fromLTWH(0, 0, size.width, size.height);

    if (highlightRect != null) {
      // 하이라이트 영역을 제외하고 그리기
      final path = Path()
        ..addRect(fullRect)
        ..addRRect(RRect.fromRectAndRadius(highlightRect!, const Radius.circular(12)))
        ..fillType = PathFillType.evenOdd;
      canvas.drawPath(path, paint);
    } else {
      canvas.drawRect(fullRect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _OverlayPainter oldDelegate) {
    return highlightRect != oldDelegate.highlightRect ||
        overlayColor != oldDelegate.overlayColor;
  }
}

/// 툴팁 컨텐츠 위젯
class _TooltipContent extends StatelessWidget {
  final GuideStep step;
  final int currentStep;
  final int totalSteps;

  const _TooltipContent({
    required this.step,
    required this.currentStep,
    required this.totalSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF141A24), // AppColors.panelBackground
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0x4D00C896), // AppColors.accent.withOpacity(0.3)
          width: 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A00C896), // AppColors.accent.withOpacity(0.1)
            blurRadius: 30,
            spreadRadius: 0,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // 스텝 번호와 아이콘
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0x2600C896), // AppColors.accent.withOpacity(0.15)
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${currentStep + 1} / $totalSteps',
                      style: const TextStyle(
                        color: Color(0xFF00C896), // AppColors.accent
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (step.icon != null)
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0x1A00C896), // AppColors.accent.withOpacity(0.1)
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        step.icon,
                        color: const Color(0xFF00C896), // AppColors.accent
                        size: 20,
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 14),

              // 제목
              Text(
                step.title,
                style: const TextStyle(
                  color: Color(0xFFE8ECF0), // AppColors.textPrimary
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),

              const SizedBox(height: 10),

              // 설명
              Text(
                step.description,
                style: const TextStyle(
                  color: Color(0xFF7A8A9A), // AppColors.textSecondary
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

