import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/models.dart';
import '../models/alliance_models.dart';
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

  // 상세 자원 정보 (자원 탭용)
  Future<Map<String, dynamic>> getDetailedResources() async {
    final response = await _dio.get('game/resources/detailed');
    return response.data as Map<String, dynamic>;
  }

  // 가동률 설정
  Future<Map<String, dynamic>> setOperationRates(Map<String, int> rates) async {
    final response = await _dio.post('game/resources/operation-rates', data: rates);
    return response.data as Map<String, dynamic>;
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

  Future<UpgradeResponse> downgradeBuilding(UpgradeRequest request) async {
    final response = await _dio.post('game/buildings/downgrade', data: request.toJson());
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

  /// 수송 미션 (자원을 목표 행성에 내리고, 함대만 귀환)
  Future<Map<String, dynamic>> transport({
    required String targetCoord,
    required Map<String, int> fleet,
    required Map<String, int> resources,
  }) async {
    final response = await _dio.post('game/battle/transport', data: {
      'targetCoord': targetCoord,
      'fleet': fleet,
      'resources': {
        'metal': resources['metal'] ?? 0,
        'crystal': resources['crystal'] ?? 0,
        'deuterium': resources['deuterium'] ?? 0,
      },
    });
    return response.data;
  }

  /// 배치 미션 (함대 + 자원을 모두 목표 행성에 배치, 귀환 없음)
  Future<Map<String, dynamic>> deploy({
    required String targetCoord,
    required Map<String, int> fleet,
    required Map<String, int> resources,
  }) async {
    final response = await _dio.post('game/battle/deploy', data: {
      'targetCoord': targetCoord,
      'fleet': fleet,
      'resources': {
        'metal': resources['metal'] ?? 0,
        'crystal': resources['crystal'] ?? 0,
        'deuterium': resources['deuterium'] ?? 0,
      },
    });
    return response.data;
  }

  /// 함대 귀환 명령 (공격 도중 귀환) - 다중 함대 지원
  Future<Map<String, dynamic>> recallFleet({String? missionId}) async {
    final response = await _dio.post('game/battle/recall', data: {
      if (missionId != null) 'missionId': missionId,
    });
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

  // ===== 식민지 =====
  // 내 행성 목록 조회
  Future<Map<String, dynamic>> getMyPlanets() async {
    final response = await _dio.get('planet/list');
    return response.data;
  }

  // 특정 행성 상세 조회
  Future<Map<String, dynamic>> getPlanetDetail(String planetId) async {
    final response = await _dio.get('planet/$planetId');
    return response.data;
  }

  // 활성 행성 전환
  Future<Map<String, dynamic>> switchPlanet(String planetId) async {
    final response = await _dio.post('planet/switch', data: {'planetId': planetId});
    return response.data;
  }

  // 행성 포기
  Future<Map<String, dynamic>> abandonPlanet(String planetId) async {
    final response = await _dio.post('planet/abandon', data: {'planetId': planetId});
    return response.data;
  }

  // 행성 이름 변경
  Future<Map<String, dynamic>> renamePlanet(String planetId, String newName) async {
    final response = await _dio.post('planet/rename', data: {
      'planetId': planetId,
      'newName': newName,
    });
    return response.data;
  }

  // 식민 미션 시작
  Future<Map<String, dynamic>> startColonization({
    required String targetCoord,
    required Map<String, int> fleet,
  }) async {
    final response = await _dio.post('game/colony/start', data: {
      'targetCoord': targetCoord,
      'fleet': fleet,
    });
    return response.data;
  }

  // 식민 미션 완료 처리
  Future<Map<String, dynamic>> completeColonization() async {
    final response = await _dio.post('game/colony/complete');
    return response.data;
  }

  // 식민 미션 귀환 (취소)
  Future<Map<String, dynamic>> recallColonization() async {
    final response = await _dio.post('game/colony/recall');
    return response.data;
  }

  // 식민 함대 귀환 완료
  Future<Map<String, dynamic>> completeColonyReturn() async {
    final response = await _dio.post('game/colony/return');
    return response.data;
  }

  // ===== 카카오톡 연동 =====
  // 카카오톡 연동용 인증코드 생성
  Future<Map<String, dynamic>> generateKakaoLinkCode() async {
    final response = await _dio.post('auth/kakao-link/generate');
    return response.data;
  }

  // ===== 출석체크 =====
  // 출석체크 상태 조회
  Future<CheckInStatus> getCheckInStatus() async {
    final response = await _dio.get('game/check-in/status');
    return CheckInStatus.fromJson(response.data);
  }

  // 출석체크 수행
  Future<CheckInResult> checkIn() async {
    final response = await _dio.post('game/check-in');
    return CheckInResult.fromJson(response.data);
  }

  // ===== 연합 (Alliance) =====
  // 내 연합 정보 조회 (가입 여부 확인)
  Future<Alliance?> getMyAlliance() async {
    final response = await _dio.get('alliance/my-alliance');
    if (response.data == null) return null;
    return Alliance.fromJson(response.data);
  }

  // 연합 생성
  Future<Alliance> createAlliance(CreateAllianceRequest request) async {
    final response = await _dio.post('alliance/create', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 연합 검색
  Future<List<AllianceSearchResult>> searchAlliances(String query, {int? page, int? limit}) async {
    final response = await _dio.get('alliance/search', queryParameters: {
      'query': query,
      if (page != null) 'page': page,
      if (limit != null) 'limit': limit,
    });
    return (response.data as List<dynamic>)
        .map((e) => AllianceSearchResult.fromJson(e))
        .toList();
  }

  // 연합 가입 신청
  Future<Alliance> applyForAlliance(ApplyForAllianceRequest request) async {
    final response = await _dio.post('alliance/apply', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 연합 가입 신청 취소
  Future<Alliance> cancelApplication(String allianceId) async {
    final response = await _dio.delete('alliance/apply/$allianceId');
    return Alliance.fromJson(response.data);
  }

  // 특정 연합 정보 조회
  Future<Alliance> getAllianceInfo(String allianceId) async {
    final response = await _dio.get('alliance/$allianceId');
    return Alliance.fromJson(response.data);
  }

  // 연합 탈퇴
  Future<void> exitAlliance() async {
    await _dio.post('alliance/exit');
  }

  // 계급 생성
  Future<Alliance> createRank(String allianceId, CreateRankRequest request) async {
    final response = await _dio.post('alliance/$allianceId/ranks', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 계급 수정
  Future<Alliance> updateRank(String allianceId, UpdateRankRequest request) async {
    final response = await _dio.put('alliance/$allianceId/ranks', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 계급 삭제
  Future<Alliance> deleteRank(String allianceId, String rankId) async {
    final response = await _dio.delete('alliance/$allianceId/ranks/$rankId');
    return Alliance.fromJson(response.data);
  }

  // 멤버 목록 조회
  Future<List<AllianceMember>> getAllianceMembers(String allianceId) async {
    final response = await _dio.get('alliance/$allianceId/members');
    return (response.data as List<dynamic>)
        .map((e) => AllianceMember.fromJson(e))
        .toList();
  }

  // 멤버 계급 변경
  Future<void> changeMemberRank(String allianceId, ChangeMemberRankRequest request) async {
    await _dio.put('alliance/$allianceId/members/rank', data: request.toJson());
  }

  // 멤버 추방
  Future<void> kickMember(String allianceId, KickMemberRequest request) async {
    await _dio.post('alliance/$allianceId/members/kick', data: request.toJson());
  }

  // 가입 신청 목록 조회
  Future<List<AllianceJoinRequest>> getJoinRequests(String allianceId) async {
    final response = await _dio.get('alliance/$allianceId/requests');
    return (response.data as List<dynamic>)
        .map((e) => AllianceJoinRequest.fromJson(e))
        .toList();
  }

  // 가입 신청 처리 (승인/거절)
  Future<void> processApplication(String allianceId, ProcessApplicationRequest request) async {
    await _dio.post('alliance/$allianceId/requests/process', data: request.toJson());
  }

  // 연합 정보 수정
  Future<Alliance> updateAllianceInfo(String allianceId, UpdateAllianceInfoRequest request) async {
    final response = await _dio.put('alliance/$allianceId/info', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 연합 이름/태그 변경
  Future<Alliance> changeAllianceNameTag(String allianceId, ChangeAllianceNameTagRequest request) async {
    final response = await _dio.put('alliance/$allianceId/name-tag', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 연합 양도
  Future<Alliance> transferAlliance(String allianceId, TransferAllianceRequest request) async {
    final response = await _dio.post('alliance/$allianceId/transfer', data: request.toJson());
    return Alliance.fromJson(response.data);
  }

  // 연합 해산
  Future<void> disbandAlliance(String allianceId) async {
    await _dio.delete('alliance/$allianceId');
  }
}

