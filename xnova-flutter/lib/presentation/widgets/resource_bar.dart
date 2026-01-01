import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/providers.dart';

class ResourceBar extends StatelessWidget {
  final GameResources resources;
  final GameProduction production;
  final int energyRatio;

  const ResourceBar({
    super.key,
    required this.resources,
    required this.production,
    required this.energyRatio,
  });

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return NumberFormat('#,###').format(number);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          _ResourceItem(
            label: 'M',
            color: AppColors.resourceMetal,
            value: _formatNumber(resources.metal),
            production: '+${_formatNumber(production.metal)}',
          ),
          const SizedBox(width: 16),
          _ResourceItem(
            label: 'C',
            color: AppColors.resourceCrystal,
            value: _formatNumber(resources.crystal),
            production: '+${_formatNumber(production.crystal)}',
          ),
          const SizedBox(width: 16),
          _ResourceItem(
            label: 'D',
            color: AppColors.resourceDeuterium,
            value: _formatNumber(resources.deuterium),
            production: '+${_formatNumber(production.deuterium)}',
          ),
          const Spacer(),
          _EnergyItem(
            value: _formatNumber(resources.energy),
            ratio: energyRatio,
          ),
        ],
      ),
    );
  }
}

class _ResourceItem extends StatelessWidget {
  final String label;
  final Color color;
  final String value;
  final String production;

  const _ResourceItem({
    required this.label,
    required this.color,
    required this.value,
    required this.production,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              production,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 9,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _EnergyItem extends StatelessWidget {
  final String value;
  final int ratio;

  const _EnergyItem({
    required this.value,
    required this.ratio,
  });

  @override
  Widget build(BuildContext context) {
    final isLow = ratio < 100;
    final color = isLow ? AppColors.negative : AppColors.resourceEnergy;
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.bolt,
          size: 14,
          color: color,
        ),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '$ratio%',
              style: TextStyle(
                color: isLow ? AppColors.negative : AppColors.textMuted,
                fontSize: 9,
                fontWeight: isLow ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
