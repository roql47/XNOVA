import 'dart:math' as Math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/game_constants.dart';
import '../../../../core/constants/game_names.dart';
import '../../../../providers/providers.dart';
import '../../../../data/services/api_service.dart';
import '../../../widgets/game_panel.dart';
import '../../../../data/models/models.dart';

class OverviewTab extends ConsumerWidget {
  const OverviewTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadAllData(),
      color: AppColors.accent,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 건설/연구 진행 상황
          if (gameState.constructionProgress != null || gameState.researchProgress != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildProgressRow(
                left: gameState.constructionProgress != null
                    ? _CompactProgressCard(
                        type: 'building',
                        name: gameState.constructionProgress!.name,
                        finishTime: gameState.constructionProgress!.finishDateTime,
                        onComplete: () => ref.read(gameProvider.notifier).completeBuilding(),
                      )
                    : null,
                right: gameState.researchProgress != null
                    ? _CompactProgressCard(
                        type: 'research',
                        name: gameState.researchProgress!.name,
                        finishTime: gameState.researchProgress!.finishDateTime,
                        onComplete: () => ref.read(gameProvider.notifier).completeResearch(),
                      )
                    : null,
              ),
            ),
          
          // 함대/방어시설 건조 진행 상황
          if (gameState.fleetProgress != null || gameState.defenseProgress != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildProgressRow(
                left: gameState.fleetProgress != null
                    ? _CompactProgressCard(
                        type: 'fleet',
                        name: gameState.fleetProgress!.name,
                        quantity: gameState.fleetProgress!.quantity,
                        finishTime: gameState.fleetProgress!.finishDateTime,
                        onComplete: () => ref.read(gameProvider.notifier).completeFleet(),
                      )
                    : null,
                right: gameState.defenseProgress != null
                    ? _CompactProgressCard(
                        type: 'defense',
                        name: gameState.defenseProgress!.name,
                        quantity: gameState.defenseProgress!.quantity,
                        finishTime: gameState.defenseProgress!.finishDateTime,
                        onComplete: () => ref.read(gameProvider.notifier).completeDefense(),
                      )
                    : null,
              ),
            ),
          
          // 전투 상태
          if (gameState.battleStatus != null) ...[
            if (gameState.battleStatus!.pendingAttack != null)
              _BattleStatusPanel(
                icon: Icons.flight_takeoff,
                title: '공격 진행 중',
                description: '목표: ${gameState.battleStatus!.pendingAttack!.targetCoord}',
                finishTime: gameState.battleStatus!.pendingAttack!.finishDateTime,
                onComplete: () => ref.read(gameProvider.notifier).processBattle(),
              ),
            if (gameState.battleStatus!.pendingReturn != null)
              _FleetReturnPanel(
                pendingReturn: gameState.battleStatus!.pendingReturn!,
                onComplete: () => ref.read(gameProvider.notifier).processBattle(),
              ),
            if (gameState.battleStatus!.incomingAttack != null)
              _BattleStatusPanel(
                icon: Icons.warning_amber,
                title: '적 공격 감지',
                description: '공격자: ${gameState.battleStatus!.incomingAttack!.attackerCoord}',
                finishTime: gameState.battleStatus!.incomingAttack!.finishDateTime,
                onComplete: () => ref.read(gameProvider.notifier).processBattle(),
                isWarning: true,
              ),
          ],
          
          // 행성 정보
          _PlanetInfoPanel(gameState: gameState),
          
          const SizedBox(height: 12),
          
          // 아무 진행중인 것도 없을 때
          if (gameState.constructionProgress == null &&
              gameState.researchProgress == null &&
              gameState.fleetProgress == null &&
              gameState.defenseProgress == null &&
              (gameState.battleStatus?.pendingAttack == null) &&
              (gameState.battleStatus?.pendingReturn == null))
            GamePanel(
              title: '알림',
              icon: Icons.info_outline,
              child: const Text(
                '현재 진행 중인 작업이 없습니다.\n건물을 건설하거나 연구를 시작하세요.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoItem {
  final String label;
  final String value;
  _InfoItem(this.label, this.value);
}

class _InfoGrid extends StatelessWidget {
  final List<_InfoItem> items;

  const _InfoGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: items.map((item) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                item.label,
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              Text(
                item.value,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        )).toList(),
      ),
    );
  }
}

// 진행 상황 Row 빌더 (하나만 있으면 전체 너비, 둘 다 있으면 50%씩)
Widget _buildProgressRow({Widget? left, Widget? right}) {
  if (left != null && right != null) {
    return Row(
      children: [
        Expanded(child: left),
        const SizedBox(width: 8),
        Expanded(child: right),
      ],
    );
  } else if (left != null) {
    return left;
  } else if (right != null) {
    return right;
  }
  return const SizedBox.shrink();
}

// 홈화면용 컴팩트 진행 카드 (원형 이미지 + 시간)
class _CompactProgressCard extends StatelessWidget {
  final String type; // 'building', 'research', 'fleet', 'defense'
  final String name;
  final int? quantity;
  final DateTime? finishTime;
  final VoidCallback onComplete;

  const _CompactProgressCard({
    required this.type,
    required this.name,
    this.quantity,
    required this.finishTime,
    required this.onComplete,
  });

  Color get _accentColor {
    switch (type) {
      case 'building':
        return AppColors.accent;
      case 'research':
        return const Color(0xFF8B5CF6); // Purple
      case 'fleet':
        return const Color(0xFF10B981); // Green
      case 'defense':
        return const Color(0xFFF59E0B); // Orange
      default:
        return AppColors.accent;
    }
  }

  String get _label {
    switch (type) {
      case 'building':
        return '건설';
      case 'research':
        return '연구';
      case 'fleet':
        return '건조';
      case 'defense':
        return '방어';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final koreanName = getKoreanName(name);
    final imagePath = getImagePath(name);

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: _accentColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _accentColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          // 원형 이미지
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: _accentColor, width: 2),
            ),
            child: ClipOval(
              child: imagePath != null
                  ? Image.asset(
                      imagePath,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.surface,
                        child: Icon(_getIcon(), color: _accentColor, size: 20),
                      ),
                    )
                  : Container(
                      color: AppColors.surface,
                      child: Icon(_getIcon(), color: _accentColor, size: 20),
                    ),
            ),
          ),
          const SizedBox(width: 10),
          // 정보
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 라벨 + 수량
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: _accentColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(
                        _label,
                        style: TextStyle(
                          color: _accentColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (quantity != null && quantity! > 1) ...[
                      const SizedBox(width: 4),
                      Text(
                        'x$quantity',
                        style: TextStyle(
                          color: _accentColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                // 이름
                Text(
                  koreanName,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // 시간 (오른쪽 가운데 정렬)
          if (finishTime != null)
            ProgressTimer(
              finishTime: finishTime!,
              onComplete: onComplete,
              textStyle: TextStyle(
                color: _accentColor,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            )
          else
            Text(
              '...',
              style: TextStyle(color: _accentColor, fontSize: 11),
            ),
        ],
      ),
    );
  }

  IconData _getIcon() {
    switch (type) {
      case 'building':
        return Icons.apartment;
      case 'research':
        return Icons.science;
      case 'fleet':
        return Icons.rocket_launch;
      case 'defense':
        return Icons.shield;
      default:
        return Icons.build;
    }
  }
}

class _ProgressPanel extends StatelessWidget {
  final IconData icon;
  final String title;
  final String name;
  final DateTime? finishTime;
  final VoidCallback onComplete;
  final VoidCallback? onCancel;

  const _ProgressPanel({
    required this.icon,
    required this.title,
    required this.name,
    required this.finishTime,
    required this.onComplete,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.panelBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.panelBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: AppColors.accent),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              name,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                if (finishTime != null)
                  ProgressTimer(
                    finishTime: finishTime!,
                    onComplete: onComplete,
                  )
                else
                  const Text('계산 중...', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                const Spacer(),
                if (onCancel != null)
                  GestureDetector(
                    onTap: onCancel,
                    child: const Text(
                      '취소',
                      style: TextStyle(color: AppColors.negative, fontSize: 12),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BattleStatusPanel extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final DateTime finishTime;
  final VoidCallback onComplete;
  final bool isWarning;

  const _BattleStatusPanel({
    required this.icon,
    required this.title,
    required this.description,
    required this.finishTime,
    required this.onComplete,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isWarning ? AppColors.negative : AppColors.accent;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: isWarning 
              ? AppColors.negative.withOpacity(0.08)
              : AppColors.panelBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isWarning ? AppColors.negative.withOpacity(0.3) : AppColors.panelBorder,
          ),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            ProgressTimer(
              finishTime: finishTime,
              onComplete: onComplete,
            ),
          ],
        ),
      ),
    );
  }
}

// 귀환 함대 패널
class _FleetReturnPanel extends StatelessWidget {
  final PendingReturnInfo pendingReturn;
  final VoidCallback onComplete;

  const _FleetReturnPanel({
    required this.pendingReturn,
    required this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    // 귀환 함대 수 계산
    final fleetCount = pendingReturn.fleet.values.fold<int>(0, (sum, count) => sum + count);
    
    // 약탈량 계산
    final totalLoot = (pendingReturn.loot['metal'] ?? 0) + 
                      (pendingReturn.loot['crystal'] ?? 0) + 
                      (pendingReturn.loot['deuterium'] ?? 0);
    
    // 요약 텍스트
    String description;
    if (totalLoot > 0) {
      description = '함선 $fleetCount척, 전리품 ${_formatNumber(totalLoot)}';
    } else {
      description = '함선 $fleetCount척 귀환 중';
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showReturnDetail(context),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.positive.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.positive.withOpacity(0.3)),
          ),
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              const Icon(Icons.flight_land, size: 20, color: AppColors.positive),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '귀환 중',
                      style: TextStyle(
                        color: AppColors.positive,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      description,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 16, color: AppColors.textMuted),
              const SizedBox(width: 8),
              ProgressTimer(
                finishTime: pendingReturn.finishDateTime,
                onComplete: onComplete,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showReturnDetail(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: const Color(0xFF0a0a12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Container(
          padding: const EdgeInsets.all(20),
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 헤더
              Row(
                children: [
                  const Icon(Icons.flight_land, size: 24, color: AppColors.positive),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      '귀환 함대 정보',
                      style: TextStyle(
                        color: AppColors.positive,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20, color: AppColors.textMuted),
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              // 귀환 함대
              const Text(
                '귀환 함대',
                style: TextStyle(
                  color: AppColors.ogameGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.panelBorder),
                ),
                child: _buildFleetList(),
              ),
              const SizedBox(height: 16),
              
              // 약탈 자원
              const Text(
                '약탈한 자원',
                style: TextStyle(
                  color: AppColors.ogameGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.panelBorder),
                ),
                child: Column(
                  children: [
                    _buildResourceRow('메탈', pendingReturn.loot['metal'] ?? 0, AppColors.metalColor),
                    const SizedBox(height: 8),
                    _buildResourceRow('크리스탈', pendingReturn.loot['crystal'] ?? 0, AppColors.crystalColor),
                    const SizedBox(height: 8),
                    _buildResourceRow('중수소', pendingReturn.loot['deuterium'] ?? 0, AppColors.deuteriumColor),
                    const Divider(color: AppColors.panelBorder, height: 20),
                    _buildResourceRow(
                      '총합', 
                      (pendingReturn.loot['metal'] ?? 0) + 
                      (pendingReturn.loot['crystal'] ?? 0) + 
                      (pendingReturn.loot['deuterium'] ?? 0),
                      AppColors.textPrimary,
                      isBold: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              
              // 닫기 버튼
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.ogameGreen,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('닫기'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFleetList() {
    final activeFleet = pendingReturn.fleet.entries.where((e) => e.value > 0).toList();
    
    if (activeFleet.isEmpty) {
      return const Text(
        '귀환 함대 없음',
        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
      );
    }

    return Column(
      children: activeFleet.map((entry) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                GameConstants.getName(entry.key),
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              Text(
                '${entry.value}척',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildResourceRow(String label, int value, Color color, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
            fontSize: 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          _formatNumber(value),
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }

  String _formatNumber(int num) {
    if (num >= 1000000) {
      return '${(num / 1000000).toStringAsFixed(1)}M';
    } else if (num >= 1000) {
      return '${(num / 1000).toStringAsFixed(1)}K';
    }
    return num.toString();
  }
}

// 행성 정보 패널 (필드 시스템 포함)
class _PlanetInfoPanel extends ConsumerStatefulWidget {
  final GameState gameState;

  const _PlanetInfoPanel({required this.gameState});

  @override
  ConsumerState<_PlanetInfoPanel> createState() => _PlanetInfoPanelState();
}

class _PlanetInfoPanelState extends ConsumerState<_PlanetInfoPanel> {
  int? _totalScore;

  @override
  void initState() {
    super.initState();
    _loadScore();
  }

  @override
  void didUpdateWidget(covariant _PlanetInfoPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    // gameState가 변경되면 점수 다시 로드 (건물/연구 등 완료 시)
    _loadScore();
  }

  Future<void> _loadScore() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final scores = await apiService.getMyScores();
      if (mounted) {
        setState(() {
          _totalScore = scores.totalScore;
        });
      }
    } catch (e) {
      // ignore
    }
  }

  GameState get gameState => widget.gameState;

  String _formatScore(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  String _getPlanetTypeName(String? type) {
    switch (type) {
      case 'trocken': return '건조 행성';
      case 'dschjungel': return '정글 행성';
      case 'normaltemp': return '온대 행성';
      case 'wasser': return '물 행성';
      case 'eis': return '얼음 행성';
      default: return '행성';
    }
  }

  // 지름 계산: sqrt(필드 수) × 1000
  int _calculateDiameter(int fields) {
    return (Math.sqrt(fields) * 1000).round();
  }

  String _formatNumber(int num) {
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

  @override
  Widget build(BuildContext context) {
    final fieldInfo = gameState.fieldInfo;
    final planetInfo = gameState.planetInfo;

    final usedFields = fieldInfo?['used'] ?? 0;
    final maxFields = fieldInfo?['max'] ?? 163;
    final remaining = fieldInfo?['remaining'] ?? (maxFields - usedFields);
    final percentage = fieldInfo?['percentage'] ?? ((usedFields / maxFields) * 100).round();

    final temperature = planetInfo?['temperature'] ?? 50;
    final planetType = planetInfo?['planetType'] as String?;
    final diameter = _calculateDiameter(maxFields);

    return GamePanel(
      title: '행성 정보',
      icon: Icons.public,
      child: Column(
        children: [
          // 행성 이미지
          Center(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: AppColors.surface,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  'assets/images/planet06.jpg',
                  height: 160,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 200,
                    height: 160,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.public, size: 80, color: AppColors.accent),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 행성 타입 및 기본 정보
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                // 행성 타입
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _getPlanetTypeName(planetType),
                      style: const TextStyle(
                        color: AppColors.accent,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 필드 정보
                Row(
                  children: [
                    const Icon(Icons.grid_view, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    Text(
                      '필드',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const Spacer(),
                    Text(
                      '$usedFields / $maxFields',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '(남은 필드: $remaining)',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: usedFields / maxFields,
                    backgroundColor: AppColors.panelHeader,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      percentage >= 90 ? AppColors.negative : 
                      percentage >= 70 ? AppColors.warning : AppColors.accent,
                    ),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 12),

                // 온도
                Row(
                  children: [
                    Icon(
                      Icons.thermostat,
                      size: 14,
                      color: temperature > 50 ? Colors.orange : (temperature < 0 ? Colors.cyan : AppColors.textMuted),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      '온도',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const Spacer(),
                    Text(
                      '${temperature}°C',
                      style: TextStyle(
                        color: temperature > 50 ? Colors.orange : (temperature < 0 ? Colors.cyan : AppColors.textPrimary),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // 지름
                Row(
                  children: [
                    const Icon(Icons.straighten, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    const Text(
                      '지름',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const Spacer(),
                    Text(
                      '${_formatNumber(diameter)} km',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // 좌표
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    const Text(
                      '좌표',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const Spacer(),
                    Text(
                      gameState.coordinate ?? '-',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // 총합 점수
                Row(
                  children: [
                    const Icon(Icons.star, size: 14, color: AppColors.accent),
                    const SizedBox(width: 6),
                    const Text(
                      '총합 점수',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const Spacer(),
                    Text(
                      _totalScore != null ? _formatScore(_totalScore!) : '-',
                      style: const TextStyle(
                        color: AppColors.accent,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 추가 정보
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                _buildInfoRow('에너지', '${gameState.resources.energy} (${gameState.energyRatio}%)'),
                const SizedBox(height: 6),
                _buildInfoRow('연구소 레벨', '${gameState.labLevel}'),
                const SizedBox(height: 6),
                _buildInfoRow('조선소 레벨', '${gameState.shipyardLevel}'),
                const SizedBox(height: 6),
                _buildInfoRow('함선', '${gameState.fleet.fold<int>(0, (sum, f) => sum + f.count)}척'),
                const SizedBox(height: 6),
                _buildInfoRow('방어시설', '${gameState.defense.fold<int>(0, (sum, d) => sum + d.count)}기'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

