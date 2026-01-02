import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class GamePanel extends StatelessWidget {
  final String title;
  final IconData? icon;
  final Widget child;
  final Widget? trailing;
  final EdgeInsets? padding;
  // 레거시 호환용 - 무시됨
  final String? emoji;

  const GamePanel({
    super.key,
    required this.title,
    this.icon,
    required this.child,
    this.trailing,
    this.padding,
    this.emoji,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(7),
                topRight: Radius.circular(7),
              ),
            ),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 16, color: AppColors.accent),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          Padding(
            padding: padding ?? const EdgeInsets.all(14),
            child: child,
          ),
        ],
      ),
    );
  }
}

class GameButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final bool isDanger;
  final bool isLoading;
  final IconData? icon;

  const GameButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isPrimary = true,
    this.isDanger = false,
    this.isLoading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null;
    final backgroundColor = isDanger
        ? AppColors.negative
        : isPrimary
            ? AppColors.buttonPrimary
            : AppColors.buttonSecondary;

    return Material(
      color: isDisabled ? backgroundColor.withOpacity(0.4) : backgroundColor,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: isLoading ? null : onPressed,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: isLoading
              ? const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 14, color: Colors.white.withOpacity(isDisabled ? 0.5 : 1)),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      text,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(isDisabled ? 0.5 : 1),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class ProgressTimer extends StatefulWidget {
  final DateTime finishTime;
  final VoidCallback? onComplete;
  final TextStyle? textStyle;

  const ProgressTimer({
    super.key,
    required this.finishTime,
    this.onComplete,
    this.textStyle,
  });

  @override
  State<ProgressTimer> createState() => _ProgressTimerState();
}

class _ProgressTimerState extends State<ProgressTimer> {
  bool _completed = false;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: Stream.periodic(const Duration(seconds: 1)),
      builder: (context, snapshot) {
        final now = DateTime.now();
        final remaining = widget.finishTime.difference(now);

        if (remaining.inSeconds <= 0) {
          if (!_completed) {
            _completed = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              widget.onComplete?.call();
            });
          }
          return Text(
            '완료',
            style: widget.textStyle?.copyWith(color: AppColors.positive) ?? 
              const TextStyle(
                color: AppColors.positive,
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
          );
        }

        final hours = remaining.inHours;
        final minutes = remaining.inMinutes % 60;
        final seconds = remaining.inSeconds % 60;

        return Text(
          '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
          style: widget.textStyle ?? const TextStyle(
            color: AppColors.accent,
            fontWeight: FontWeight.w600,
            fontSize: 12,
            fontFamily: 'monospace',
            letterSpacing: 1,
          ),
        );
      },
    );
  }
}

class CostDisplay extends StatelessWidget {
  final int metal;
  final int crystal;
  final int deuterium;
  final int? currentMetal;
  final int? currentCrystal;
  final int? currentDeuterium;

  const CostDisplay({
    super.key,
    required this.metal,
    required this.crystal,
    required this.deuterium,
    this.currentMetal,
    this.currentCrystal,
    this.currentDeuterium,
  });

  bool _canAfford(int cost, int? current) {
    if (current == null) return true;
    return current >= cost;
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 4,
      children: [
        if (metal > 0)
          _CostItem(
            label: 'M',
            value: metal,
            canAfford: _canAfford(metal, currentMetal),
            color: AppColors.resourceMetal,
          ),
        if (crystal > 0)
          _CostItem(
            label: 'C',
            value: crystal,
            canAfford: _canAfford(crystal, currentCrystal),
            color: AppColors.resourceCrystal,
          ),
        if (deuterium > 0)
          _CostItem(
            label: 'D',
            value: deuterium,
            canAfford: _canAfford(deuterium, currentDeuterium),
            color: AppColors.resourceDeuterium,
          ),
      ],
    );
  }
}

class _CostItem extends StatelessWidget {
  final String label;
  final int value;
  final bool canAfford;
  final Color color;

  const _CostItem({
    required this.label,
    required this.value,
    required this.canAfford,
    required this.color,
  });

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(3),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          _formatNumber(value),
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: canAfford ? AppColors.textPrimary : AppColors.negative,
          ),
        ),
      ],
    );
  }
}
