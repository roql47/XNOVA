# 🚀 AWS Lightsail 배포 가이드

## 1단계: Lightsail 인스턴스 생성

### AWS Console에서:
1. [AWS Lightsail](https://lightsail.aws.amazon.com) 접속
2. **Create instance** 클릭
3. 설정:
   - Region: **Seoul (ap-northeast-2)** ← 한국 사용자용
   - Platform: **Linux/Unix**
   - Blueprint: **OS Only → Ubuntu 22.04 LTS**
   - Instance plan: **$3.5/월** (512MB RAM) 또는 **$5/월** (1GB RAM, 권장)
   - Instance name: `xnova-backend`
4. **Create instance** 클릭

### 고정 IP 할당:
1. **Networking** 탭 → **Create static IP**
2. 인스턴스에 연결
3. IP 주소 기록: `XX.XX.XX.XX`

### 방화벽 설정:
1. 인스턴스 클릭 → **Networking** 탭
2. **Add rule**:
   - Application: **Custom**
   - Protocol: **TCP**
   - Port: **3000**
3. **Save**

---

## 2단계: 서버 초기 설정

### SSH 접속:
```bash
# Lightsail 콘솔에서 "Connect using SSH" 클릭
# 또는 다운로드한 키 파일로 접속
ssh -i your-key.pem ubuntu@YOUR_IP
```

### Node.js 설치:
```bash
# NVM 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Node.js 20 설치
nvm install 20
nvm use 20

# 확인
node -v  # v20.x.x
npm -v
```

### PM2 설치:
```bash
npm install -g pm2
```

### Git 설치 (이미 설치됨):
```bash
git --version
```

---

## 3단계: 프로젝트 배포

### 코드 업로드 (방법 1: Git):
```bash
# GitHub에 코드 푸시 후
cd ~
git clone https://github.com/YOUR_USERNAME/XNOVA.git
cd XNOVA/xnova-mobile/backend
```

### 코드 업로드 (방법 2: SCP):
```bash
# 로컬에서 실행
scp -i your-key.pem -r ./xnova-mobile/backend ubuntu@YOUR_IP:~/xnova-backend
```

### 환경변수 설정:
```bash
cd ~/xnova-backend  # 또는 ~/XNOVA/xnova-mobile/backend

# .env 파일 생성
nano .env
```

**.env 내용:**
```env
NODE_ENV=production
PORT=3000

# MongoDB Atlas 연결 문자열 (기존 것 사용)
MONGODB_URI=mongodb+srv://r4823120_db_user:YOUR_PASSWORD@cluster0.6ovf2ru.mongodb.net/xnova?retryWrites=true&w=majority

# JWT 시크릿 (새로 생성 권장)
JWT_SECRET=여기에-매우-긴-랜덤-문자열-입력
JWT_EXPIRES_IN=15m

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# CORS
CORS_ORIGINS=capacitor://localhost,http://localhost
```

### 배포 실행:
```bash
# 의존성 설치
npm ci

# 빌드
npm run build

# 로그 폴더 생성
mkdir -p logs

# PM2로 시작
pm2 start ecosystem.config.js --env production

# 재부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

### 상태 확인:
```bash
pm2 status
pm2 logs xnova-backend
```

---

## 4단계: Flutter 앱 설정

### `lib/core/constants/api_constants.dart` 수정:
```dart
// Lightsail IP로 변경
static const String prodBaseUrl = 'http://XX.XX.XX.XX:3000/api/';
static const String prodSocketUrl = 'http://XX.XX.XX.XX:3000';

// true로 변경
static const bool isProduction = true;
```

### APK 다시 빌드:
```bash
cd xnova-flutter
flutter build apk --release
```

---

## 5단계: 확인

### 서버 테스트:
```bash
# 브라우저 또는 curl로 테스트
curl http://YOUR_IP:3000/api
```

### 앱 테스트:
1. 새 APK를 폰에 설치
2. 회원가입/로그인 테스트

---

## 유용한 명령어

```bash
# 서버 상태
pm2 status

# 로그 확인
pm2 logs xnova-backend

# 서버 재시작
pm2 restart xnova-backend

# 서버 중지
pm2 stop xnova-backend

# 코드 업데이트 후
git pull
npm run build
pm2 restart xnova-backend
```

---

## 문제 해결

### 연결 안 됨:
1. Lightsail 방화벽에서 3000 포트 열렸는지 확인
2. `pm2 status`로 서버 실행 중인지 확인
3. `pm2 logs`로 에러 확인

### MongoDB 연결 실패:
1. MongoDB Atlas에서 IP 화이트리스트에 Lightsail IP 추가
2. Network Access → Add IP Address → Lightsail IP 입력

### 메모리 부족:
$3.5 플랜 (512MB)에서 메모리 부족 시 $5 플랜 (1GB)으로 업그레이드





