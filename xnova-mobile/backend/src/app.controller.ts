import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
}
