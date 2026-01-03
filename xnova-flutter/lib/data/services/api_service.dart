import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/models.dart';
import 'token_service.dart';

class ApiService {
  late final Dio _dio;
  final TokenService _tokenService;

  ApiService({required TokenService tokenService}) : _tokenService = tokenService {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _tokenService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // 401 에러 처리 (토큰 만료)
        if (error.response?.statusCode == 401) {
          _tokenService.deleteToken();
        }
        return handler.next(error);
      },
    ));
  }

  // ===== 인증 =====
  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _dio.post('auth/register', data: request.toJson());
    return AuthResponse.fromJson(response.data);
  }

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _dio.post('auth/login', data: request.toJson());
    return AuthResponse.fromJson(response.data);
  }

  Future<UserProfile> getProfile() async {
    final response = await _dio.get('auth/profile');
    return UserProfile.fromJson(response.data);
  }

  // ===== Google 인증 =====
  Future<GoogleAuthResponse> googleAuth(GoogleAuthRequest request) async {
    final response = await _dio.post('auth/google', data: request.toJson());
    return GoogleAuthResponse.fromJson(response.data);
  }

  Future<AuthResponse> completeGoogleSignup(GoogleCompleteRequest request) async {
    final response = await _dio.post('auth/google/complete', data: request.toJson());
    return AuthResponse.fromJson(response.data);
  }

  // ===== 자원 =====
  Future<ResourcesResponse> getResources() async {
    final response = await _dio.get('game/resources');
    return ResourcesResponse.fromJson(response.data);
  }

  // ===== 건물 =====
  Future<BuildingsResponse> getBuildings() async {
    final response = await _dio.get('game/buildings');
    return BuildingsResponse.fromJson(response.data);
  }

  Future<UpgradeResponse> upgradeBuilding(UpgradeRequest request) async {
    final response = await _dio.post('game/buildings/upgrade', data: request.toJson());
    return UpgradeResponse.fromJson(response.data);
  }

  Future<Map<String, dynamic>> completeBuilding() async {
    final response = await _dio.post('game/buildings/complete');
    return response.data;
  }

  Future<Map<String, dynamic>> cancelBuilding() async {
    final response = await _dio.post('game/buildings/cancel');
    return response.data;
  }

  // ===== 연구 =====
  Future<ResearchResponse> getResearch() async {
    final response = await _dio.get('game/research');
    return ResearchResponse.fromJson(response.data);
  }

  Future<Map<String, dynamic>> startResearch(ResearchRequest request) async {
    final response = await _dio.post('game/research/start', data: request.toJson());
    return response.data;
  }

  Future<Map<String, dynamic>> completeResearch() async {
    final response = await _dio.post('game/research/complete');
    return response.data;
  }

  Future<Map<String, dynamic>> cancelResearch() async {
    final response = await _dio.post('game/research/cancel');
    return response.data;
  }

  // ===== 함대 =====
  Future<FleetResponse> getFleet() async {
    final response = await _dio.get('game/fleet');
    return FleetResponse.fromJson(response.data);
  }

  Future<Map<String, dynamic>> buildFleet(BuildFleetRequest request) async {
    final response = await _dio.post('game/fleet/build', data: request.toJson());
    return response.data;
  }

  Future<Map<String, dynamic>> completeFleet() async {
    final response = await _dio.post('game/fleet/complete');
    return response.data;
  }

  // ===== 방어시설 =====
  Future<DefenseResponse> getDefense() async {
    final response = await _dio.get('game/defense');
    return DefenseResponse.fromJson(response.data);
  }

  Future<Map<String, dynamic>> buildDefense(BuildDefenseRequest request) async {
    final response = await _dio.post('game/defense/build', data: request.toJson());
    return response.data;
  }

  Future<Map<String, dynamic>> completeDefense() async {
    final response = await _dio.post('game/defense/complete');
    return response.data;
  }

  // ===== 전투 =====
  Future<AttackResponse> attack(AttackRequest request) async {
    final response = await _dio.post('game/battle/attack', data: request.toJson());
    return AttackResponse.fromJson(response.data);
  }

  Future<AttackResponse> recycle(AttackRequest request) async {
    final response = await _dio.post('game/battle/recycle', data: request.toJson());
    return AttackResponse.fromJson(response.data);
  }

  /// 함대 귀환 명령 (공격 도중 귀환)
  Future<Map<String, dynamic>> recallFleet() async {
    final response = await _dio.post('game/battle/recall');
    return response.data;
  }

  Future<BattleStatus> getBattleStatus() async {
    final response = await _dio.get('game/battle/status');
    return BattleStatus.fromJson(response.data);
  }

  Future<Map<String, dynamic>> processBattle() async {
    final response = await _dio.post('game/battle/process');
    return response.data;
  }

  // ===== 메시지 =====
  Future<List<Message>> getMessages({int limit = 50}) async {
    final response = await _dio.get('messages', queryParameters: {'limit': limit});
    return (response.data as List).map((e) => Message.fromJson(e)).toList();
  }

  Future<void> markMessageAsRead(String id) async {
    await _dio.post('messages/$id/read');
  }

  Future<void> deleteMessage(String id) async {
    await _dio.delete('messages/$id');
  }

  Future<Map<String, dynamic>> sendMessage({
    required String receiverCoordinate,
    required String title,
    required String content,
  }) async {
    final response = await _dio.post('messages/send', data: {
      'receiverCoordinate': receiverCoordinate,
      'title': title,
      'content': content,
    });
    return response.data;
  }

  // 관리자 권한 확인
  Future<bool> checkAdmin() async {
    try {
      final response = await _dio.get('messages/admin/check');
      return response.data['isAdmin'] ?? false;
    } catch (e) {
      return false;
    }
  }

  // 전체 공지 메시지 발송 (관리자 전용)
  Future<Map<String, dynamic>> broadcastMessage({
    required String title,
    required String content,
  }) async {
    final response = await _dio.post('messages/broadcast', data: {
      'title': title,
      'content': content,
    });
    return response.data;
  }

  // ===== 은하 =====
  Future<GalaxyResponse> getGalaxyMap(int galaxy, int system) async {
    final response = await _dio.get('galaxy/$galaxy/$system');
    return GalaxyResponse.fromJson(response.data);
  }

  Future<Map<String, dynamic>> getPlayerInfo(String playerId) async {
    final response = await _dio.get('galaxy/player/$playerId');
    return response.data;
  }

  // ===== 정찰 =====
  Future<SpyResponse> spyOnPlanet(String targetCoord, int probeCount) async {
    try {
      final response = await _dio.post('galaxy/spy', data: {
        'targetCoord': targetCoord,
        'probeCount': probeCount,
      });
      return SpyResponse.fromJson(response.data);
    } on DioException catch (e) {
      print('🔴 정찰 API DioException: ${e.response?.data}');
      // 서버에서 에러 응답을 보낸 경우
      if (e.response?.data != null && e.response!.data is Map) {
        return SpyResponse.fromJson(e.response!.data);
      }
      // NestJS 기본 에러 응답 처리
      if (e.response?.data != null && e.response!.data is Map) {
        final data = e.response!.data as Map<String, dynamic>;
        final message = data['message'];
        String errorMsg = '알 수 없는 오류';
        if (message is String) {
          errorMsg = message;
        } else if (message is List) {
          errorMsg = message.join(', ');
        }
        return SpyResponse(success: false, error: errorMsg);
      }
      return SpyResponse(success: false, error: '네트워크 오류가 발생했습니다.');
    }
  }

  // ===== 랭킹 =====
  Future<RankingResponse> getRanking({String type = 'total', int page = 1, int limit = 100}) async {
    final response = await _dio.get('ranking', queryParameters: {
      'type': type,
      'page': page,
      'limit': limit,
    });
    return RankingResponse.fromJson(response.data);
  }

  Future<MyRankResponse> getMyRank() async {
    final response = await _dio.get('ranking/my-rank');
    return MyRankResponse.fromJson(response.data);
  }

  Future<MyScoresResponse> getMyScores() async {
    final response = await _dio.get('ranking/my-scores');
    return MyScoresResponse.fromJson(response.data);
  }

  // ===== 설정 =====
  // 행성 이름 변경
  Future<Map<String, dynamic>> updatePlanetName(String planetName) async {
    final response = await _dio.put('user/planet-name', data: {'planetName': planetName});
    return response.data;
  }

  // 비밀번호 변경
  Future<Map<String, dynamic>> updatePassword(String currentPassword, String newPassword) async {
    final response = await _dio.put('user/password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    return response.data;
  }

  // 휴가 모드 상태 조회
  Future<Map<String, dynamic>> getVacationStatus() async {
    final response = await _dio.get('user/vacation');
    return response.data;
  }

  // 휴가 모드 활성화
  Future<Map<String, dynamic>> activateVacation() async {
    final response = await _dio.post('user/vacation');
    return response.data;
  }

  // 휴가 모드 해제
  Future<Map<String, dynamic>> deactivateVacation() async {
    final response = await _dio.delete('user/vacation');
    return response.data;
  }

  // 계정 초기화
  Future<Map<String, dynamic>> resetAccount(String password) async {
    final response = await _dio.post('user/reset', data: {'password': password});
    return response.data;
  }

  // 계정 탈퇴
  Future<Map<String, dynamic>> deleteAccount(String password) async {
    final response = await _dio.delete('user/account', data: {'password': password});
    return response.data;
  }
}

