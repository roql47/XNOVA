import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class GamePanel extends StatelessWidget {
  final String title;
  final String? emoji;
  final Widget child;
  final Widget? trailing;
  final EdgeInsets? padding;

  const GamePanel({
    super.key,
    required this.title,
    this.emoji,
    required this.child,
    this.trailing,
    this.padding,
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
          // 헤더
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.panelHeader,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(7),
                topRight: Radius.circular(7),
              ),
            ),
            child: Row(
              children: [
                if (emoji != null) ...[
                  Text(emoji!, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          // 컨텐츠
          Padding(
            padding: padding ?? const EdgeInsets.all(12),
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
    final backgroundColor = isDanger
        ? AppColors.buttonDanger
        : isPrimary
            ? AppColors.buttonPrimary
            : AppColors.buttonSecondary;

    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: isPrimary || isDanger
              ? BorderSide.none
              : const BorderSide(color: AppColors.panelBorder),
        ),
      ),
      child: isLoading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 16),
                  const SizedBox(width: 6),
                ],
                Text(
                  text,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
    );
  }
}

class ProgressTimer extends StatelessWidget {
  final DateTime finishTime;
  final VoidCallback? onComplete;

  const ProgressTimer({
    super.key,
    required this.finishTime,
    this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: Stream.periodic(const Duration(seconds: 1)),
      builder: (context, snapshot) {
        final now = DateTime.now();
        final remaining = finishTime.difference(now);

        if (remaining.isNegative) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            onComplete?.call();
          });
          return const Text(
            '완료!',
            style: TextStyle(
              color: AppColors.successGreen,
              fontWeight: FontWeight.bold,
            ),
          );
        }

        final hours = remaining.inHours;
        final minutes = remaining.inMinutes % 60;
        final seconds = remaining.inSeconds % 60;

        return Text(
          '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
          style: const TextStyle(
            color: AppColors.warningOrange,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
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

  Color _getColor(int cost, int? current) {
    if (current == null) return AppColors.textSecondary;
    return current >= cost ? AppColors.successGreen : AppColors.errorRed;
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 4,
      children: [
        if (metal > 0)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.hardware, size: 12, color: AppColors.metalColor),
              const SizedBox(width: 4),
              Text(
                _formatNumber(metal),
                style: TextStyle(
                  fontSize: 11,
                  color: _getColor(metal, currentMetal),
                ),
              ),
            ],
          ),
        if (crystal > 0)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.diamond, size: 12, color: AppColors.crystalColor),
              const SizedBox(width: 4),
              Text(
                _formatNumber(crystal),
                style: TextStyle(
                  fontSize: 11,
                  color: _getColor(crystal, currentCrystal),
                ),
              ),
            ],
          ),
        if (deuterium > 0)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.water_drop, size: 12, color: AppColors.deuteriumColor),
              const SizedBox(width: 4),
              Text(
                _formatNumber(deuterium),
                style: TextStyle(
                  fontSize: 11,
                  color: _getColor(deuterium, currentDeuterium),
                ),
              ),
            ],
          ),
      ],
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

