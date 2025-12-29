class ApiConstants {
  // 개발 환경 (에뮬레이터)
  static const String devBaseUrl = 'http://10.0.2.2:3000/api/';
  static const String devSocketUrl = 'http://10.0.2.2:3000';
  
  // 프로덕션 환경
  static const String prodBaseUrl = 'https://your-server.com/api/';
  static const String prodSocketUrl = 'https://your-server.com';
  
  // 현재 환경 설정
  static const bool isProduction = false;
  
  static String get baseUrl => isProduction ? prodBaseUrl : devBaseUrl;
  static String get socketUrl => isProduction ? prodSocketUrl : devSocketUrl;
  
  // 타임아웃 설정
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}

