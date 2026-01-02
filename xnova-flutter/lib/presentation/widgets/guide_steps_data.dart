import 'package:flutter/material.dart';
import 'guide_tutorial_overlay.dart';

/// 가이드 단계 데이터를 생성하는 클래스
class GuideStepsData {
  // GlobalKey들을 외부에서 주입받아 사용
  final GlobalKey? resourceBarKey;
  final GlobalKey? menuButtonKey;
  final GlobalKey? chatButtonKey;
  final GlobalKey? tabContentKey;

  GuideStepsData({
    this.resourceBarKey,
    this.menuButtonKey,
    this.chatButtonKey,
    this.tabContentKey,
  });

  List<GuideStep> getSteps() {
    return [
      // 1. 환영 메시지
      GuideStep(
        title: 'XNOVA에 오신 것을 환영합니다!',
        description: 'XNOVA는 우주 전략 시뮬레이션 게임입니다. '
            '행성을 개발하고, 함대를 건설하며, 은하계를 탐험하세요. '
            '이 가이드에서 게임의 기본적인 UI와 기능을 알려드리겠습니다.',
        icon: Icons.rocket_launch_rounded,
        tabToShow: 'overview',
      ),

      // 2. 리소스 바 설명
      GuideStep(
        title: '자원 현황',
        description: '화면 상단의 자원 바에서 현재 보유한 자원을 확인할 수 있습니다.\n\n'
            '• M - 메탈 (회색): 건물과 함선 건설의 기본 자원\n'
            '• C - 크리스탈 (하늘색): 연구와 고급 함선에 필요\n'
            '• D - 듀테리움 (민트색): 함선 연료와 고급 연구에 사용\n'
            '• ⚡ 에너지 (노란색): 광산 가동에 필요한 전력',
        targetKey: resourceBarKey,
        icon: Icons.inventory_2_rounded,
        tabToShow: 'overview',
      ),

      // 3. 메뉴 버튼 설명
      GuideStep(
        title: '메뉴 네비게이션',
        description: '좌측 상단의 메뉴 버튼을 탭하면 사이드바가 열립니다. '
            '이곳에서 다양한 게임 기능에 접근할 수 있습니다.',
        targetKey: menuButtonKey,
        icon: Icons.menu_rounded,
        tabToShow: 'overview',
      ),

      // 4. 홈/개요 탭
      GuideStep(
        title: '홈 (개요)',
        description: '홈 화면에서는 현재 행성의 전체적인 상태를 한눈에 볼 수 있습니다.\n\n'
            '• 진행 중인 건설/연구 현황\n'
            '• 행성 기본 정보\n'
            '• 최근 활동 요약',
        icon: Icons.dashboard_rounded,
        tabToShow: 'overview',
        targetKey: tabContentKey,
      ),

      // 5. 건물 탭
      GuideStep(
        title: '건물',
        description: '건물 메뉴에서 다양한 시설을 건설하고 업그레이드할 수 있습니다.\n\n'
            '• 자원 생산 건물: 광산, 발전소\n'
            '• 저장 시설: 자원 저장소\n'
            '• 기반 시설: 로봇 공장, 나노 공장 등',
        icon: Icons.apartment_rounded,
        tabToShow: 'buildings',
        targetKey: tabContentKey,
      ),

      // 6. 연구 탭
      GuideStep(
        title: '연구',
        description: '연구소에서 다양한 기술을 개발할 수 있습니다.\n\n'
            '• 에너지 기술: 발전 효율 향상\n'
            '• 추진 기술: 함선 속도 증가\n'
            '• 무기/방어 기술: 전투력 강화',
        icon: Icons.science_rounded,
        tabToShow: 'research',
        targetKey: tabContentKey,
      ),

      // 7. 조선소 탭
      GuideStep(
        title: '조선소',
        description: '조선소에서 다양한 함선을 건조할 수 있습니다.\n\n'
            '• 민간 함선: 화물선, 정찰기\n'
            '• 전투 함선: 전투기, 순양함, 전함\n'
            '• 특수 함선: 식민선, 재활용선',
        icon: Icons.rocket_launch_rounded,
        tabToShow: 'shipyard',
        targetKey: tabContentKey,
      ),

      // 8. 방어 탭
      GuideStep(
        title: '방어 시설',
        description: '방어 메뉴에서 행성을 보호할 방어 시설을 건설합니다.\n\n'
            '• 포대: 로켓 발사대, 레이저 포탑\n'
            '• 방어막: 소형/대형 실드 돔\n'
            '• 미사일: 대탄도 미사일, 행성간 미사일',
        icon: Icons.shield_rounded,
        tabToShow: 'defense',
        targetKey: tabContentKey,
      ),

      // 9. 함대 이동 탭
      GuideStep(
        title: '함대 이동',
        description: '함대 메뉴에서 함대 미션을 관리합니다.\n\n'
            '• 수송: 자원을 다른 행성으로 이동\n'
            '• 정찰: 적 행성 정보 수집\n'
            '• 공격: 다른 플레이어 행성 공격\n'
            '• 식민: 새로운 행성 개척',
        icon: Icons.flight_rounded,
        tabToShow: 'fleet',
        targetKey: tabContentKey,
      ),

      // 10. 은하계 탭
      GuideStep(
        title: '은하계',
        description: '은하계 뷰에서 우주를 탐험할 수 있습니다.\n\n'
            '• 다른 플레이어의 행성 확인\n'
            '• 빈 좌표에 식민지 건설\n'
            '• 잔해 필드 수집',
        icon: Icons.blur_circular_rounded,
        tabToShow: 'galaxy',
        targetKey: tabContentKey,
      ),

      // 11. 메시지 탭
      GuideStep(
        title: '메시지',
        description: '메시지 센터에서 게임 내 알림을 확인합니다.\n\n'
            '• 전투 보고서\n'
            '• 정찰 보고서\n'
            '• 시스템 메시지',
        icon: Icons.mail_rounded,
        tabToShow: 'messages',
        targetKey: tabContentKey,
      ),

      // 12. 테크트리 탭
      GuideStep(
        title: '테크트리',
        description: '테크트리에서 모든 건물, 연구, 함선의 요구사항과 '
            '업그레이드 경로를 확인할 수 있습니다. 효율적인 발전 계획을 세우세요!',
        icon: Icons.account_tree_rounded,
        tabToShow: 'techtree',
        targetKey: tabContentKey,
      ),

      // 13. 채팅 버튼
      GuideStep(
        title: '전체 채팅',
        description: '우측 상단의 채팅 버튼으로 다른 플레이어들과 실시간으로 대화할 수 있습니다. '
            '전략을 공유하거나 동맹을 맺어보세요!',
        targetKey: chatButtonKey,
        icon: Icons.chat_bubble_outline_rounded,
        tabToShow: 'overview',
      ),

      // 14. 게임 팁
      GuideStep(
        title: '게임 팁',
        description: '성공적인 발전을 위한 팁:\n\n'
            '• 초반에는 자원 생산에 집중하세요\n'
            '• 에너지 부족에 주의하세요\n'
            '• 연구는 장기적 투자입니다\n'
            '• 방어 시설로 행성을 보호하세요\n'
            '• 동맹을 맺어 협력하세요',
        icon: Icons.lightbulb_rounded,
        tabToShow: 'overview',
      ),

      // 15. 마무리
      GuideStep(
        title: '가이드 완료!',
        description: '기본적인 UI 안내가 끝났습니다. '
            '이제 우주 정복을 향한 여정을 시작하세요!\n\n'
            '도움말은 메뉴에서 언제든 다시 볼 수 있습니다. '
            '즐거운 게임 되세요! 🚀',
        icon: Icons.celebration_rounded,
        tabToShow: 'overview',
      ),
    ];
  }
}

