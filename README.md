# XNOVA 프로젝트

우주 전략 게임 - 모바일 앱 + 백엔드 서버

## 📁 프로젝트 구조

```
XNOVA/
├── xnova-flutter/          # 📱 Flutter 모바일 앱 (Android + iOS)
│   ├── lib/                # Dart 소스 코드
│   ├── android/            # Android 빌드 설정
│   └── ios/                # iOS 빌드 설정
│
├── xnova-mobile/           # 🔧 백엔드 서버
│   └── backend/            # NestJS API 서버
│
└── XNOVA.js                # 🌐 웹 프론트엔드
```

## 🚀 빠른 시작

### 백엔드 서버 실행
```bash
cd xnova-mobile/backend
npm install
npm run start:dev
```

### Flutter 앱 실행
```bash
cd xnova-flutter
flutter pub get
flutter run
```

## ⚠️ 정리 필요

`xnova-mobile/android/` 폴더는 더 이상 사용하지 않습니다.
Flutter 앱(`xnova-flutter/`)을 대신 사용하세요.

삭제하려면:
```bash
# Windows
rmdir /s /q xnova-mobile\android

# Mac/Linux
rm -rf xnova-mobile/android
```

## 📱 앱 빌드

### Android
```bash
cd xnova-flutter
flutter build apk --release
```

### iOS (Mac 필요)
```bash
cd xnova-flutter
flutter build ios --release
```


