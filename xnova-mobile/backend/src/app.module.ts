import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { GalaxyModule } from './galaxy/galaxy.module';
import { RankingModule } from './ranking/ranking.module';
import { SocketModule } from './socket/socket.module';
import { MessageModule } from './message/message.module';
import { PlanetModule } from './planet/planet.module';
import { AllianceModule } from './alliance/alliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // 스케줄러 모듈 - 함대 미션 자동 처리
    ScheduleModule.forRoot(),
    // Rate Limiting - 무차별 대입 공격 방지
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1초
        limit: 3,    // 1초에 3번까지
      },
      {
        name: 'medium',
        ttl: 10000,  // 10초
        limit: 20,   // 10초에 20번까지
      },
      {
        name: 'long',
        ttl: 60000,  // 1분
        limit: 100,  // 1분에 100번까지
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    GameModule,
    GalaxyModule,
    RankingModule,
    SocketModule,
    MessageModule,
    PlanetModule,
    AllianceModule,
  ],
  providers: [
    // 전역 Rate Limiting 가드 적용
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
