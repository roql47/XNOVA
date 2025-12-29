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
      color: AppColors.panelBackground,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _ResourceItem(
            icon: Icons.hardware,
            color: AppColors.metalColor,
            value: _formatNumber(resources.metal),
            production: '+${_formatNumber(production.metal)}/h',
          ),
          _ResourceItem(
            icon: Icons.diamond,
            color: AppColors.crystalColor,
            value: _formatNumber(resources.crystal),
            production: '+${_formatNumber(production.crystal)}/h',
          ),
          _ResourceItem(
            icon: Icons.water_drop,
            color: AppColors.deuteriumColor,
            value: _formatNumber(resources.deuterium),
            production: '+${_formatNumber(production.deuterium)}/h',
          ),
          _ResourceItem(
            icon: Icons.bolt,
            color: energyRatio < 100 ? AppColors.errorRed : AppColors.energyColor,
            value: _formatNumber(resources.energy),
            production: '$energyRatio%',
            isEnergy: true,
          ),
        ],
      ),
    );
  }
}

class _ResourceItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String production;
  final bool isEnergy;

  const _ResourceItem({
    required this.icon,
    required this.color,
    required this.value,
    required this.production,
    this.isEnergy = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Text(
          production,
          style: TextStyle(
            color: isEnergy 
                ? (color == AppColors.errorRed ? AppColors.errorRed : AppColors.successGreen)
                : AppColors.textSecondary,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

