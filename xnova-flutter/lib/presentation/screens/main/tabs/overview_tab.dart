import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/providers.dart';
import '../../../widgets/game_panel.dart';

class OverviewTab extends ConsumerWidget {
  const OverviewTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gameState = ref.watch(gameProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(gameProvider.notifier).loadAllData(),
      color: AppColors.ogameGreen,
      backgroundColor: AppColors.panelBackground,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 건설 진행 상황
          if (gameState.constructionProgress != null)
            _ProgressPanel(
              emoji: '🏗️',
              title: '건설 중',
              name: gameState.constructionProgress!.name,
              finishTime: gameState.constructionProgress!.finishDateTime,
              onComplete: () => ref.read(gameProvider.notifier).completeBuilding(),
              onCancel: () => ref.read(gameProvider.notifier).cancelBuilding(),
            ),
          
          // 연구 진행 상황
          if (gameState.researchProgress != null)
            _ProgressPanel(
              emoji: '🔬',
              title: '연구 중',
              name: gameState.researchProgress!.name,
              finishTime: gameState.researchProgress!.finishDateTime,
              onComplete: () => ref.read(gameProvider.notifier).completeResearch(),
            ),
          
          // 함대 건조 진행 상황
          if (gameState.fleetProgress != null)
            _ProgressPanel(
              emoji: '🚀',
              title: '함선 건조 중',
              name: '${gameState.fleetProgress!.name} x${gameState.fleetProgress!.quantity ?? 1}',
              finishTime: gameState.fleetProgress!.finishDateTime,
              onComplete: () => ref.read(gameProvider.notifier).completeFleet(),
            ),
          
          // 방어시설 건설 진행 상황
          if (gameState.defenseProgress != null)
            _ProgressPanel(
              emoji: '🛡️',
              title: '방어시설 건설 중',
              name: '${gameState.defenseProgress!.name} x${gameState.defenseProgress!.quantity ?? 1}',
              finishTime: gameState.defenseProgress!.finishDateTime,
              onComplete: () => ref.read(gameProvider.notifier).completeDefense(),
            ),
          
          // 전투 상태
          if (gameState.battleStatus != null) ...[
            if (gameState.battleStatus!.pendingAttack != null)
              _BattleStatusPanel(
                emoji: '⚔️',
                title: '공격 진행 중',
                description: '목표: ${gameState.battleStatus!.pendingAttack!.targetCoord}',
                remainingTime: gameState.battleStatus!.pendingAttack!.remainingTime,
              ),
            if (gameState.battleStatus!.pendingReturn != null)
              _BattleStatusPanel(
                emoji: '🔙',
                title: '귀환 중',
                description: '전리품 획득!',
                remainingTime: gameState.battleStatus!.pendingReturn!.remainingTime,
              ),
            if (gameState.battleStatus!.incomingAttack != null)
              _BattleStatusPanel(
                emoji: '🚨',
                title: '적 공격 감지!',
                description: '공격자: ${gameState.battleStatus!.incomingAttack!.attackerCoord}',
                remainingTime: gameState.battleStatus!.incomingAttack!.remainingTime,
                isWarning: true,
              ),
          ],
          
          // 빠른 정보
          GamePanel(
            title: '행성 정보',
            emoji: '🌍',
            child: Column(
              children: [
                _InfoRow('좌표', gameState.coordinate ?? '-'),
                _InfoRow('건물 수', '${gameState.buildings.length}'),
                _InfoRow('연구 레벨', '${gameState.labLevel}'),
                _InfoRow('조선소 레벨', '${gameState.shipyardLevel}'),
                _InfoRow('보유 함선', '${gameState.fleet.fold<int>(0, (sum, f) => sum + f.count)}척'),
                _InfoRow('방어시설', '${gameState.defense.fold<int>(0, (sum, d) => sum + d.count)}기'),
              ],
            ),
          ),
          
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
              emoji: '📢',
              child: const Text(
                '현재 진행 중인 작업이 없습니다.\n건물을 건설하거나 연구를 시작해보세요!',
                style: TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}

class _ProgressPanel extends StatelessWidget {
  final String emoji;
  final String title;
  final String name;
  final DateTime? finishTime;
  final VoidCallback onComplete;
  final VoidCallback? onCancel;

  const _ProgressPanel({
    required this.emoji,
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
      child: GamePanel(
        title: title,
        emoji: emoji,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              name,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.timer, size: 16, color: AppColors.warningOrange),
                const SizedBox(width: 8),
                if (finishTime != null)
                  ProgressTimer(
                    finishTime: finishTime!,
                    onComplete: onComplete,
                  )
                else
                  const Text('계산 중...', style: TextStyle(color: AppColors.textSecondary)),
                const Spacer(),
                if (onCancel != null)
                  TextButton(
                    onPressed: onCancel,
                    child: const Text(
                      '취소',
                      style: TextStyle(color: AppColors.errorRed, fontSize: 12),
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
  final String emoji;
  final String title;
  final String description;
  final double remainingTime;
  final bool isWarning;

  const _BattleStatusPanel({
    required this.emoji,
    required this.title,
    required this.description,
    required this.remainingTime,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: isWarning 
              ? AppColors.errorRed.withOpacity(0.1)
              : AppColors.panelBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isWarning ? AppColors.errorRed : AppColors.panelBorder,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isWarning ? AppColors.errorRed : AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    description,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              _formatTime(remainingTime),
              style: TextStyle(
                color: isWarning ? AppColors.errorRed : AppColors.warningOrange,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(double seconds) {
    final duration = Duration(seconds: seconds.toInt());
    final h = duration.inHours;
    final m = duration.inMinutes % 60;
    final s = duration.inSeconds % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

