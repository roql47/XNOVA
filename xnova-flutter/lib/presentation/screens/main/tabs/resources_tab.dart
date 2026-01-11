import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../providers/providers.dart';
import '../../../../core/theme/app_colors.dart';

class ResourcesTab extends ConsumerStatefulWidget {
  const ResourcesTab({super.key});

  @override
  ConsumerState<ResourcesTab> createState() => _ResourcesTabState();
}

class _ResourcesTabState extends ConsumerState<ResourcesTab> {
  Map<String, dynamic>? _detailedResources;
  bool _isLoading = true;
  Map<String, int> _operationRates = {};

  @override
  void initState() {
    super.initState();
    _loadDetailedResources();
  }

  Future<void> _loadDetailedResources() async {
    setState(() => _isLoading = true);
    try {
      final data = await ref.read(gameProvider.notifier).getDetailedResources();
      if (mounted && data != null) {
        setState(() {
          _detailedResources = data;
          final rates = data['operationRates'] as Map<String, dynamic>?;
          if (rates != null) {
            _operationRates = {
              'metalMine': (rates['metalMine'] ?? 100) as int,
              'crystalMine': (rates['crystalMine'] ?? 100) as int,
              'deuteriumMine': (rates['deuteriumMine'] ?? 100) as int,
              'solarPlant': (rates['solarPlant'] ?? 100) as int,
              'fusionReactor': (rates['fusionReactor'] ?? 100) as int,
              'solarSatellite': (rates['solarSatellite'] ?? 100) as int,
            };
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _updateOperationRates() async {
    final success = await ref.read(gameProvider.notifier).setOperationRates(_operationRates);
    if (success) {
      await _loadDetailedResources();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('가동률이 변경되었습니다.'),
            backgroundColor: AppColors.positive,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.accent),
      );
    }

    if (_detailedResources == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('자원 정보를 불러올 수 없습니다.', style: TextStyle(color: AppColors.textMuted)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDetailedResources,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadDetailedResources,
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProductionTable(),
            const SizedBox(height: 20),
            _buildForecast(),
            const SizedBox(height: 80), // 하단 여백
          ],
        ),
      ),
    );
  }

  // 섹션 1: 생산 테이블
  Widget _buildProductionTable() {
    final productionDetails = _detailedResources!['productionDetails'] as List<dynamic>;
    final basicIncome = _detailedResources!['basicIncome'] as Map<String, dynamic>;
    final production = _detailedResources!['production'] as Map<String, dynamic>;
    final energyRatio = _detailedResources!['energyRatio'] as int;

    return _buildSection(
      title: '생산 테이블',
      icon: Icons.factory_outlined,
      child: Column(
        children: [
          // 헤더
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(
              children: [
                Expanded(flex: 3, child: Text('시설', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold))),
                Expanded(flex: 2, child: Text('메탈', style: TextStyle(color: AppColors.resourceMetal, fontSize: 11, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                Expanded(flex: 2, child: Text('크리스탈', style: TextStyle(color: AppColors.resourceCrystal, fontSize: 11, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                Expanded(flex: 2, child: Text('듀테륨', style: TextStyle(color: AppColors.resourceDeuterium, fontSize: 11, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                Expanded(flex: 2, child: Text('에너지', style: TextStyle(color: AppColors.resourceEnergy, fontSize: 11, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                Expanded(flex: 2, child: Text('가동률', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          
          // 시설별 행
          ...productionDetails.map((detail) => _buildProductionRow(detail as Map<String, dynamic>)),
          
          const Divider(color: AppColors.panelBorder, height: 24),
          
          // 기본 수입
          _buildSummaryRow('기본 수입', basicIncome['metal'], basicIncome['crystal'], basicIncome['deuterium'], 0),
          
          const Divider(color: AppColors.panelBorder, height: 24),
          
          // 합계
          _buildSummaryRow('합계 (/시간)', production['metal'], production['crystal'], production['deuterium'], (production['energyProduction'] as int) - (production['energyConsumption'] as int), isTotal: true),
          
          const SizedBox(height: 12),
          
          // 에너지 효율 표시
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: energyRatio >= 100 ? AppColors.positive.withOpacity(0.1) : AppColors.negative.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: energyRatio >= 100 ? AppColors.positive : AppColors.negative),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '생산 효율',
                  style: TextStyle(
                    color: energyRatio >= 100 ? AppColors.positive : AppColors.negative,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$energyRatio%',
                  style: TextStyle(
                    color: energyRatio >= 100 ? AppColors.positive : AppColors.negative,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 12),
          
          // 계산 버튼
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _updateOperationRates,
              icon: const Icon(Icons.calculate, size: 18),
              label: const Text('가동률 적용'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductionRow(Map<String, dynamic> detail) {
    final type = detail['type'] as String;
    final name = detail['name'] as String;
    final level = detail['level'] as int;
    final metal = detail['metal'] as int;
    final crystal = detail['crystal'] as int;
    final deuterium = detail['deuterium'] as int;
    final energy = detail['energy'] as int;
    final currentRate = _operationRates[type] ?? 100;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w500)),
                Text('Lv.$level', style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              metal > 0 ? '+${_formatNumber(metal)}' : metal < 0 ? _formatNumber(metal) : '-',
              style: TextStyle(color: metal > 0 ? AppColors.positive : metal < 0 ? AppColors.negative : AppColors.textMuted, fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              crystal > 0 ? '+${_formatNumber(crystal)}' : crystal < 0 ? _formatNumber(crystal) : '-',
              style: TextStyle(color: crystal > 0 ? AppColors.positive : crystal < 0 ? AppColors.negative : AppColors.textMuted, fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              deuterium > 0 ? '+${_formatNumber(deuterium)}' : deuterium < 0 ? _formatNumber(deuterium) : '-',
              style: TextStyle(color: deuterium > 0 ? AppColors.positive : deuterium < 0 ? AppColors.negative : AppColors.textMuted, fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              energy > 0 ? '+${_formatNumber(energy)}' : energy < 0 ? _formatNumber(energy) : '-',
              style: TextStyle(color: energy > 0 ? AppColors.positive : energy < 0 ? AppColors.negative : AppColors.textMuted, fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
          Expanded(
            flex: 2,
            child: _buildRateDropdown(type, currentRate),
          ),
        ],
      ),
    );
  }

  Widget _buildRateDropdown(String type, int currentRate) {
    return Container(
      height: 28,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(4),
      ),
      child: DropdownButton<int>(
        value: currentRate,
        underline: const SizedBox(),
        isDense: true,
        isExpanded: true,
        dropdownColor: AppColors.panelBackground,
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
        items: List.generate(11, (i) => i * 10).map((rate) {
          return DropdownMenuItem<int>(
            value: rate,
            child: Text('$rate%', style: const TextStyle(fontSize: 11)),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            setState(() {
              _operationRates[type] = value;
            });
          }
        },
      ),
    );
  }

  Widget _buildSummaryRow(String label, int metal, int crystal, int deuterium, int energy, {bool isTotal = false}) {
    final style = TextStyle(
      color: isTotal ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: isTotal ? 12 : 11,
      fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Expanded(flex: 3, child: Text(label, style: style)),
          Expanded(flex: 2, child: Text(_formatNumber(metal), style: style.copyWith(color: AppColors.resourceMetal), textAlign: TextAlign.right)),
          Expanded(flex: 2, child: Text(_formatNumber(crystal), style: style.copyWith(color: AppColors.resourceCrystal), textAlign: TextAlign.right)),
          Expanded(flex: 2, child: Text(_formatNumber(deuterium), style: style.copyWith(color: deuterium >= 0 ? AppColors.resourceDeuterium : AppColors.negative), textAlign: TextAlign.right)),
          Expanded(flex: 2, child: Text(_formatNumber(energy), style: style.copyWith(color: energy >= 0 ? AppColors.positive : AppColors.negative), textAlign: TextAlign.right)),
          const Expanded(flex: 2, child: SizedBox()),
        ],
      ),
    );
  }

  // 섹션 2: 예상 생산량
  Widget _buildForecast() {
    final forecast = _detailedResources!['forecast'] as Map<String, dynamic>;
    final daily = forecast['daily'] as Map<String, dynamic>;
    final weekly = forecast['weekly'] as Map<String, dynamic>;
    final monthly = forecast['monthly'] as Map<String, dynamic>;

    return _buildSection(
      title: '예상 생산량',
      icon: Icons.timeline_outlined,
      child: Column(
        children: [
          _buildForecastRow('일간', daily),
          const SizedBox(height: 8),
          _buildForecastRow('주간', weekly),
          const SizedBox(height: 8),
          _buildForecastRow('월간', monthly),
        ],
      ),
    );
  }

  Widget _buildForecastRow(String period, Map<String, dynamic> data) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.panelBackground,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 40,
            child: Text(period, style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildForecastValue('M', data['metal'] as int, AppColors.resourceMetal),
                _buildForecastValue('C', data['crystal'] as int, AppColors.resourceCrystal),
                _buildForecastValue('D', data['deuterium'] as int, data['deuterium'] >= 0 ? AppColors.resourceDeuterium : AppColors.negative),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForecastValue(String label, int value, Color color) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(
          value >= 0 ? '+${_formatNumber(value)}' : _formatNumber(value),
          style: TextStyle(color: value >= 0 ? AppColors.textPrimary : AppColors.negative, fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildSection({required String title, required IconData icon, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.panelBackground.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.panelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.accent, size: 20),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number.abs() >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number.abs() >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return NumberFormat('#,###').format(number);
  }
}

