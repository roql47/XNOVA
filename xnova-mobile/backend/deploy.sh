#!/bin/bash

# XNOVA Backend 배포 스크립트
# Lightsail Ubuntu 서버용

echo "🚀 XNOVA Backend 배포 시작..."

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm ci --production=false

# 2. 빌드
echo "🔨 빌드 중..."
npm run build

# 3. 로그 디렉토리 생성
mkdir -p logs

# 4. PM2로 서버 시작/재시작
echo "🔄 서버 시작 중..."
if pm2 describe xnova-backend > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env production
fi

# 5. PM2 저장 (재부팅 시 자동 시작)
pm2 save

echo "✅ 배포 완료!"
echo "📊 상태 확인: pm2 status"
echo "📜 로그 확인: pm2 logs xnova-backend"

