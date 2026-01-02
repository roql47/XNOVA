# XNOVA 배포 가이드

## 1. 백엔드 빌드 & 배포

### Windows (로컬)
```bash
# 1. 백엔드 빌드
cd C:\Users\User\Desktop\XNOVA\xnova-mobile\backend
npm run build

# 2. Git 푸시
cd C:\Users\User\Desktop\XNOVA
git add -A
git commit -m "설명"
git push origin main
```

### Lightsail (서버)
```bash
# SSH 접속 후
cd ~/XNOVA
git pull origin main
cd xnova-mobile/backend
npx pm2 restart xnova-backend
```

### 한 줄 명령어 (Lightsail)
```bash
cd ~/XNOVA && git pull origin main && cd xnova-mobile/backend && npx pm2 restart xnova-backend
```

---

## 2. Flutter APK 빌드

### 릴리즈 APK
```bash
cd C:\Users\User\Desktop\XNOVA\xnova-flutter
flutter build apk --release
```

### 아키텍처별 APK (용량 작음)
```bash
flutter build apk --split-per-abi --release
```

### APK 위치
```
xnova-flutter\build\app\outputs\flutter-apk\app-release.apk
```

---

## 3. 전체 배포 프로세스 (Windows)

```bash
# 1. 백엔드 빌드
cd /d C:\Users\User\Desktop\XNOVA\xnova-mobile\backend & npm run build

# 2. Git 푸시
cd /d C:\Users\User\Desktop\XNOVA & git add -A & git commit -m "update" & git push origin main

# 3. APK 빌드 (선택)
cd /d C:\Users\User\Desktop\XNOVA\xnova-flutter & flutter build apk --release
```

---

## 4. PM2 유용한 명령어 (Lightsail)

```bash
# 로그 확인
npx pm2 logs xnova-backend --lines 50

# 상태 확인
npx pm2 status

# 재시작
npx pm2 restart xnova-backend

# 중지
npx pm2 stop xnova-backend

# 삭제 후 재시작
npx pm2 delete xnova-backend
npx pm2 start dist/main.js --name xnova-backend
```

---

## 5. 문제 해결

### 빌드 에러 시
```bash
# node_modules 재설치
cd xnova-mobile/backend
rm -rf node_modules
npm install
npm run build
```

### PM2 not found
```bash
# npx 사용
npx pm2 restart xnova-backend
```

