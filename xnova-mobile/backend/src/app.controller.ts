import { Controller, Get, Query } from '@nestjs/common';

@Controller()
export class AppController {
  // 최소 필수 버전 (이 버전 미만은 강제 업데이트)
  private readonly MIN_REQUIRED_VERSION = '0.31.0';
  // 최신 버전
  private readonly LATEST_VERSION = '0.31.0';

  @Get()
  getHello() {
    return {
      name: 'XNOVA API',
      version: '1.0.0',
      description: 'XNOVA 모바일 게임 백엔드 서버',
      endpoints: {
        auth: '/api/auth',
        game: '/api/game',
        galaxy: '/api/galaxy',
        ranking: '/api/ranking',
      },
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('version-check')
  checkVersion(@Query('version') currentVersion: string) {
    const forceUpdate = this.compareVersions(currentVersion || '0.0.0', this.MIN_REQUIRED_VERSION) < 0;
    
    return {
      minRequiredVersion: this.MIN_REQUIRED_VERSION,
      latestVersion: this.LATEST_VERSION,
      forceUpdate,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.xnova.game',
      message: forceUpdate 
        ? '새로운 버전이 출시되었습니다. 업데이트가 필요합니다.' 
        : null,
    };
  }

  // 버전 비교 함수: v1 < v2 면 음수, v1 == v2 면 0, v1 > v2 면 양수
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    return 0;
  }
}
