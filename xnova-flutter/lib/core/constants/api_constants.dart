class ApiConstants {
  // ============================================
  // 🔧 배포 시 이 부분만 수정하세요!
  // ============================================
  
  // 프로덕션 서버 주소 (Lightsail 배포 후 변경)
  // 예: 'http://13.125.xxx.xxx:3000/api/'
  static const String prodBaseUrl = 'http://YOUR_LIGHTSAIL_IP:3000/api/';
  static const String prodSocketUrl = 'http://YOUR_LIGHTSAIL_IP:3000';
  
  // true로 변경하면 프로덕션 서버 사용
  static const bool isProduction = false;
  
  // ============================================
  
  // 개발 환경 (에뮬레이터)
  static const String devBaseUrl = 'http://10.0.2.2:3000/api/';
  static const String devSocketUrl = 'http://10.0.2.2:3000';
  
  // 로컬 테스트 (실제 기기 + 같은 Wi-Fi)
  // PC의 IP로 변경 (ipconfig로 확인)
  static const String localBaseUrl = 'http://192.168.0.xxx:3000/api/';
  static const String localSocketUrl = 'http://192.168.0.xxx:3000';
  
  static String get baseUrl => isProduction ? prodBaseUrl : devBaseUrl;
  static String get socketUrl => isProduction ? prodSocketUrl : devSocketUrl;
  
  // 타임아웃 설정
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}

