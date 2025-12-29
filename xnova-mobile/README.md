# XNOVA 모바일 게임

XNOVA는 우주 정복 전략 게임입니다. 자원을 채굴하고, 함대를 건조하고, 다른 플레이어를 공격하여 우주를 정복하세요!

## 프로젝트 구조

```
xnova-mobile/
├── backend/          # NestJS 백엔드 서버
│   ├── src/
│   │   ├── auth/         # 인증 모듈 (JWT)
│   │   ├── user/         # 사용자 모듈
│   │   ├── game/         # 게임 로직 모듈
│   │   │   ├── services/
│   │   │   │   ├── resources.service.ts   # 자원 관리
│   │   │   │   ├── buildings.service.ts   # 건물 관리
│   │   │   │   ├── research.service.ts    # 연구 관리
│   │   │   │   ├── fleet.service.ts       # 함대 관리
│   │   │   │   ├── defense.service.ts     # 방어시설 관리
│   │   │   │   └── battle.service.ts      # 전투 시뮬레이션
│   │   │   └── constants/
│   │   │       └── game-data.ts           # 게임 데이터 (비용, 스탯 등)
│   │   ├── galaxy/       # 은하 지도 모듈
│   │   ├── ranking/      # 랭킹 모듈
│   │   └── socket/       # Socket.IO 실시간 통신
│   └── package.json
│
└── android/          # Android 앱 (Kotlin + Jetpack Compose)
    └── app/
        └── src/main/java/com/xnova/game/
            ├── data/
            │   ├── model/        # 데이터 모델
            │   ├── remote/       # API 서비스
            │   ├── local/        # 로컬 저장소
            │   └── repository/   # 리포지토리
            ├── di/               # Hilt DI 모듈
            └── ui/
                ├── theme/        # 테마 (컬러, 타이포그래피)
                ├── navigation/   # 네비게이션
                └── screens/      # 화면들
```

## 기술 스택

### 백엔드
- **Node.js + NestJS** - 서버 프레임워크
- **MongoDB** - NoSQL 데이터베이스
- **JWT** - 인증
- **Socket.IO** - 실시간 통신

### Android
- **Kotlin** - 프로그래밍 언어
- **Jetpack Compose** - 모던 UI 툴킷
- **Hilt** - 의존성 주입
- **Retrofit + OkHttp** - 네트워크
- **DataStore** - 로컬 저장소
- **Coroutines + Flow** - 비동기 처리

## 실행 방법

### 1. 백엔드 실행

```bash
# MongoDB 실행 필요 (로컬 또는 클라우드)

cd xnova-mobile/backend

# 의존성 설치
npm install

# 개발 모드 실행
npm run start:dev

# 또는 빌드 후 실행
npm run build
npm run start:prod
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 2. Android 앱 실행

1. **Android Studio**에서 `xnova-mobile/android` 폴더를 엽니다.
2. Gradle 동기화가 완료될 때까지 기다립니다.
3. 에뮬레이터 또는 실제 기기에서 앱을 실행합니다.

> **참고**: 에뮬레이터에서 로컬 서버에 접속하려면 `10.0.2.2` 주소를 사용합니다 (이미 설정됨).

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 프로필 조회

### 게임
- `GET /api/game/resources` - 자원 조회
- `GET /api/game/buildings` - 건물 조회
- `POST /api/game/buildings/upgrade` - 건물 업그레이드
- `GET /api/game/research` - 연구 조회
- `POST /api/game/research/start` - 연구 시작
- `GET /api/game/fleet` - 함대 조회
- `POST /api/game/fleet/build` - 함대 건조
- `GET /api/game/defense` - 방어시설 조회
- `POST /api/game/defense/build` - 방어시설 건조
- `POST /api/game/battle/attack` - 공격
- `GET /api/game/battle/status` - 전투 상태

### 은하
- `GET /api/galaxy/:galaxy/:system` - 은하 지도 조회

### 랭킹
- `GET /api/ranking` - 전체 랭킹
- `GET /api/ranking/me` - 내 랭킹

## 게임 시스템

### 자원
- **메탈** 🪨 - 기본 건설 자원
- **크리스탈** 💎 - 고급 기술 자원
- **듀테륨** 💧 - 연료 및 고급 자원
- **에너지** ⚡ - 생산 효율에 영향

### 건물
- **광산**: 메탈광산, 크리스탈광산, 듀테륨광산
- **에너지**: 태양광발전소, 핵융합로
- **시설**: 로봇공장, 조선소, 연구소, 나노공장

### 함대
- 소형/대형 화물선, 전투기, 순양함, 전함 등
- 각 함선마다 고유한 공격력, 방어력, 속도, 적재량

### 전투 시스템
- 라운드 기반 전투 시뮬레이션 (최대 6라운드)
- 급속사격 시스템
- 기술 보너스 적용 (무기, 방어막, 장갑)
- 전리품 약탈 (30%)

## 라이선스

이 프로젝트는 학습 및 개인 사용 목적으로 만들어졌습니다.

