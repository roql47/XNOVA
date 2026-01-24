import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../data/services/token_service.dart';
import '../data/services/api_service.dart';
import '../data/services/socket_service.dart';
import '../data/models/models.dart';
import '../data/models/alliance_models.dart';

// ===== 서비스 Provider =====
final tokenServiceProvider = Provider<TokenService>((ref) {
  return TokenService();
});

final apiServiceProvider = Provider<ApiService>((ref) {
  final tokenService = ref.watch(tokenServiceProvider);
  return ApiService(tokenService: tokenService);
});

// ===== 인증 상태 =====
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final UserInfo? user;
  // 구글 로그인 - 닉네임 설정 필요 상태
  final bool needsNickname;
  final String? pendingGoogleIdToken;
  final String? suggestedNickname;

  AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.user,
    this.needsNickname = false,
    this.pendingGoogleIdToken,
    this.suggestedNickname,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    UserInfo? user,
    bool? needsNickname,
    String? pendingGoogleIdToken,
    String? suggestedNickname,
    bool clearPendingGoogle = false,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      user: user ?? this.user,
      needsNickname: needsNickname ?? this.needsNickname,
      pendingGoogleIdToken: clearPendingGoogle ? null : (pendingGoogleIdToken ?? this.pendingGoogleIdToken),
      suggestedNickname: clearPendingGoogle ? null : (suggestedNickname ?? this.suggestedNickname),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;
  final TokenService _tokenService;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId: '820555705462-hk73umafu7a0auvmrbslhagrp17r32rd.apps.googleusercontent.com',
  );

  AuthNotifier(this._apiService, this._tokenService) : super(AuthState());

  Future<void> checkAuth() async {
    final hasToken = await _tokenService.hasToken();
    if (hasToken) {
      try {
        final profile = await _apiService.getProfile();
        state = state.copyWith(
          isAuthenticated: true,
          user: UserInfo(
            id: profile.id,
            email: profile.email,
            playerName: profile.playerName,
            coordinate: profile.coordinate,
          ),
        );
      } catch (e) {
        await _tokenService.deleteToken();
        state = state.copyWith(isAuthenticated: false);
      }
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.login(LoginRequest(
        email: email,
        password: password,
      ));
      await _tokenService.saveToken(response.accessToken);
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
      );
      return false;
    }
  }

  Future<bool> register(String email, String password, String playerName) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.register(RegisterRequest(
        email: email,
        password: password,
        playerName: playerName,
      ));
      await _tokenService.saveToken(response.accessToken);
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
      );
      return true;
    } catch (e) {
      // 서버에서 전달한 구체적인 에러 메시지 추출
      String errorMessage = '회원가입에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMessage = data['message'].toString();
        }
      }
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      return false;
    }
  }

  // 구글 로그인
  Future<bool> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      print('🔵 Google Sign-In 시작...');
      
      // 기존 세션 정리 (캐시된 토큰 문제 방지)
      try {
        await _googleSignIn.signOut();
        print('🔵 기존 Google 세션 정리 완료');
      } catch (e) {
        print('🟡 기존 세션 정리 중 에러 (무시): $e');
      }
      
      // 구글 로그인 실행
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      print('🔵 Google Sign-In 결과: $googleUser');
      
      if (googleUser == null) {
        print('🔴 Google Sign-In 취소됨');
        state = state.copyWith(isLoading: false);
        return false; // 사용자가 취소함
      }

      // 구글 인증 토큰 획득
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Google 인증 토큰을 가져올 수 없습니다.',
        );
        return false;
      }

      // 백엔드에 구글 토큰 전송
      final response = await _apiService.googleAuth(GoogleAuthRequest(idToken: idToken));

      if (response.needsNickname) {
        // 닉네임 설정 필요
        state = state.copyWith(
          isLoading: false,
          needsNickname: true,
          pendingGoogleIdToken: idToken,
          suggestedNickname: response.suggestedName,
        );
        return false; // 아직 로그인 완료 아님
      }

      // 로그인 성공
      if (response.accessToken != null) {
        await _tokenService.saveToken(response.accessToken!);
        state = state.copyWith(
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          needsNickname: false,
          clearPendingGoogle: true,
        );
        return true;
      }

      state = state.copyWith(
        isLoading: false,
        error: '구글 로그인에 실패했습니다.',
      );
      return false;
    } catch (e, stackTrace) {
      print('🔴 Google Sign-In 에러: $e');
      print('🔴 Stack trace: $stackTrace');
      state = state.copyWith(
        isLoading: false,
        error: '구글 로그인에 실패했습니다: ${e.toString()}',
      );
      return false;
    }
  }

  // 구글 회원가입 완료 (닉네임 설정)
  Future<bool> completeGoogleSignup(String playerName) async {
    if (state.pendingGoogleIdToken == null) {
      state = state.copyWith(error: '구글 인증 정보가 없습니다. 다시 로그인해주세요.');
      return false;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.completeGoogleSignup(
        GoogleCompleteRequest(
          idToken: state.pendingGoogleIdToken!,
          playerName: playerName,
        ),
      );

      await _tokenService.saveToken(response.accessToken);
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        needsNickname: false,
        clearPendingGoogle: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: '회원가입에 실패했습니다. 다른 닉네임을 사용해주세요.',
      );
      return false;
    }
  }

  // 닉네임 설정 취소
  void cancelGoogleSignup() {
    _googleSignIn.signOut();
    state = state.copyWith(
      needsNickname: false,
      clearPendingGoogle: true,
    );
  }

  Future<void> logout() async {
    await _tokenService.deleteToken();
    await _googleSignIn.signOut();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final tokenService = ref.watch(tokenServiceProvider);
  return AuthNotifier(apiService, tokenService);
});

// ===== 네비게이션 상태 =====
enum MainTab {
  overview,
  buildings,
  resources,  // 자원 탭 추가
  research,
  shipyard,
  defense,
  fleet,
  galaxy,
  alliance,  // 연합 탭 추가
  messages,
  ranking,
  techtree,
  simulator,
}

class NavigationState {
  final MainTab selectedTab;
  final String? targetCoordinate;
  final String? missionType; // 'attack', 'transport', 'deploy'

  NavigationState({
    this.selectedTab = MainTab.overview,
    this.targetCoordinate,
    this.missionType,
  });

  NavigationState copyWith({
    MainTab? selectedTab,
    String? targetCoordinate,
    String? missionType,
    bool clearTarget = false,
  }) {
    return NavigationState(
      selectedTab: selectedTab ?? this.selectedTab,
      targetCoordinate: clearTarget ? null : (targetCoordinate ?? this.targetCoordinate),
      missionType: clearTarget ? null : (missionType ?? this.missionType),
    );
  }
}

class NavigationNotifier extends StateNotifier<NavigationState> {
  NavigationNotifier() : super(NavigationState());

  void setTab(MainTab tab) {
    state = state.copyWith(selectedTab: tab);
  }

  void setAttackTarget(String coordinate) {
    state = state.copyWith(
      selectedTab: MainTab.fleet,
      targetCoordinate: coordinate,
      missionType: 'attack',
    );
  }

  void setTransportTarget(String coordinate) {
    state = state.copyWith(
      selectedTab: MainTab.fleet,
      targetCoordinate: coordinate,
      missionType: 'transport',
    );
  }

  void setDeployTarget(String coordinate) {
    state = state.copyWith(
      selectedTab: MainTab.fleet,
      targetCoordinate: coordinate,
      missionType: 'deploy',
    );
  }

  void setColonizeTarget(String coordinate) {
    state = state.copyWith(
      selectedTab: MainTab.fleet,
      targetCoordinate: coordinate,
      missionType: 'colony',
    );
  }

  void clearAttackTarget() {
    state = state.copyWith(clearTarget: true);
  }
}

final navigationProvider = StateNotifierProvider<NavigationNotifier, NavigationState>((ref) {
  return NavigationNotifier();
});

// ===== 게임 상태 =====
class GameState {
  final GameResources resources;
  final GameProduction production;
  final int energyRatio;
  final String? playerName;
  final String? coordinate;
  final bool isLoading;
  final String? error;

  // 건물
  final List<BuildingInfo> buildings;
  final ProgressInfo? constructionProgress;

  // 필드 정보
  final Map<String, dynamic>? fieldInfo;
  final Map<String, dynamic>? planetInfo;

  // 연구
  final List<ResearchInfo> research;
  final ProgressInfo? researchProgress;
  final int labLevel;

  // 함대
  final List<FleetInfo> fleet;
  final ProgressInfo? fleetProgress;
  final int shipyardLevel;

  // 방어
  final List<DefenseInfo> defense;
  final ProgressInfo? defenseProgress;

  // 은하
  final int currentGalaxy;
  final int currentSystem;
  final List<PlanetInfo> galaxyPlanets;

  // 전투
  final BattleStatus? battleStatus;

  // 다중 행성
  final List<MyPlanet> myPlanets;
  final String? activePlanetId;

  // 출석체크
  final CheckInStatus? checkInStatus;

  GameState({
    this.resources = const GameResources(),
    this.production = const GameProduction(),
    this.energyRatio = 100,
    this.playerName,
    this.coordinate,
    this.isLoading = false,
    this.error,
    this.buildings = const [],
    this.constructionProgress,
    this.fieldInfo,
    this.planetInfo,
    this.research = const [],
    this.researchProgress,
    this.labLevel = 0,
    this.fleet = const [],
    this.fleetProgress,
    this.shipyardLevel = 0,
    this.defense = const [],
    this.defenseProgress,
    this.currentGalaxy = 1,
    this.currentSystem = 1,
    this.galaxyPlanets = const [],
    this.battleStatus,
    this.myPlanets = const [],
    this.activePlanetId,
    this.checkInStatus,
  });

  GameState copyWith({
    GameResources? resources,
    GameProduction? production,
    int? energyRatio,
    String? playerName,
    String? coordinate,
    bool? isLoading,
    String? error,
    List<BuildingInfo>? buildings,
    ProgressInfo? constructionProgress,
    bool clearConstructionProgress = false,
    Map<String, dynamic>? fieldInfo,
    Map<String, dynamic>? planetInfo,
    List<ResearchInfo>? research,
    ProgressInfo? researchProgress,
    bool clearResearchProgress = false,
    int? labLevel,
    List<FleetInfo>? fleet,
    ProgressInfo? fleetProgress,
    bool clearFleetProgress = false,
    int? shipyardLevel,
    List<DefenseInfo>? defense,
    ProgressInfo? defenseProgress,
    bool clearDefenseProgress = false,
    int? currentGalaxy,
    int? currentSystem,
    List<PlanetInfo>? galaxyPlanets,
    BattleStatus? battleStatus,
    bool clearBattleStatus = false,
    List<MyPlanet>? myPlanets,
    String? activePlanetId,
    CheckInStatus? checkInStatus,
  }) {
    return GameState(
      resources: resources ?? this.resources,
      production: production ?? this.production,
      energyRatio: energyRatio ?? this.energyRatio,
      playerName: playerName ?? this.playerName,
      coordinate: coordinate ?? this.coordinate,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      buildings: buildings ?? this.buildings,
      constructionProgress: clearConstructionProgress ? null : (constructionProgress ?? this.constructionProgress),
      fieldInfo: fieldInfo ?? this.fieldInfo,
      planetInfo: planetInfo ?? this.planetInfo,
      research: research ?? this.research,
      researchProgress: clearResearchProgress ? null : (researchProgress ?? this.researchProgress),
      labLevel: labLevel ?? this.labLevel,
      fleet: fleet ?? this.fleet,
      fleetProgress: clearFleetProgress ? null : (fleetProgress ?? this.fleetProgress),
      shipyardLevel: shipyardLevel ?? this.shipyardLevel,
      defense: defense ?? this.defense,
      defenseProgress: clearDefenseProgress ? null : (defenseProgress ?? this.defenseProgress),
      currentGalaxy: currentGalaxy ?? this.currentGalaxy,
      currentSystem: currentSystem ?? this.currentSystem,
      galaxyPlanets: galaxyPlanets ?? this.galaxyPlanets,
      battleStatus: clearBattleStatus ? null : (battleStatus ?? this.battleStatus),
      myPlanets: myPlanets ?? this.myPlanets,
      activePlanetId: activePlanetId ?? this.activePlanetId,
      checkInStatus: checkInStatus ?? this.checkInStatus,
    );
  }
}

class GameResources {
  final int metal;
  final int crystal;
  final int deuterium;
  final int energy;

  const GameResources({
    this.metal = 0,
    this.crystal = 0,
    this.deuterium = 0,
    this.energy = 0,
  });
}

class GameProduction {
  final int metal;
  final int crystal;
  final int deuterium;
  final int energyProduction;
  final int energyConsumption;

  const GameProduction({
    this.metal = 0,
    this.crystal = 0,
    this.deuterium = 0,
    this.energyProduction = 0,
    this.energyConsumption = 0,
  });
}

class GameNotifier extends StateNotifier<GameState> {
  final ApiService _apiService;
  
  // 자동 완료 처리 중 플래그 (중복 호출 방지)
  bool _isProcessingAutoComplete = false;

  GameNotifier(this._apiService) : super(GameState());

  Future<void> loadAllData() async {
    state = state.copyWith(isLoading: true);
    try {
      await Future.wait([
        loadResources(),
        loadBuildings(),
        loadResearch(),
        loadFleet(),
        loadDefense(),
        loadBattleStatus(),
        loadMyPlanets(),
      ]);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// 내 행성 목록 로드
  Future<void> loadMyPlanets() async {
    try {
      final response = await _apiService.getMyPlanets();
      final planets = (response['planets'] as List?)
          ?.map((p) => MyPlanet.fromJson(p))
          .toList() ?? [];
      final activePlanetId = response['activePlanetId']?.toString();
      
      // 활성 행성의 좌표 찾기
      String? activePlanetCoordinate;
      if (activePlanetId != null && planets.isNotEmpty) {
        final activePlanet = planets.firstWhere(
          (p) => p.id == activePlanetId,
          orElse: () => planets.first,
        );
        activePlanetCoordinate = activePlanet.coordinate;
      }
      
      state = state.copyWith(
        myPlanets: planets,
        activePlanetId: activePlanetId,
        coordinate: activePlanetCoordinate,
      );
    } catch (e) {
      // ignore
    }
  }

  /// 활성 행성 전환
  Future<bool> switchPlanet(String planetId) async {
    try {
      await _apiService.switchPlanet(planetId);
      // 행성 전환 후 모든 데이터 새로고침 (순차적으로)
      await loadMyPlanets();
      await loadProfile();
      // 모든 게임 데이터를 순차적으로 로드 (병렬 로드 시 타이밍 이슈 방지)
      await loadResources();
      await loadBuildings();
      await loadResearch();
      await loadFleet();
      await loadDefense();
      await loadBattleStatus();
      return true;
    } catch (e) {
      state = state.copyWith(error: '행성 전환에 실패했습니다.');
      return false;
    }
  }

  /// 행성 이름 변경
  Future<bool> renamePlanet(String planetId, String newName) async {
    try {
      await _apiService.renamePlanet(planetId, newName);
      await loadMyPlanets();
      return true;
    } catch (e) {
      state = state.copyWith(error: '행성 이름 변경에 실패했습니다.');
      return false;
    }
  }

  /// 행성 포기
  Future<bool> abandonPlanet(String planetId) async {
    try {
      await _apiService.abandonPlanet(planetId);
      await loadMyPlanets();
      await loadProfile();
      await loadAllData();
      return true;
    } catch (e) {
      String errorMsg = '행성 포기에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(error: errorMsg);
      return false;
    }
  }

  Future<void> loadProfile() async {
    try {
      final profile = await _apiService.getProfile();
      state = state.copyWith(
        playerName: profile.playerName,
        coordinate: profile.coordinate,
      );
    } catch (e) {
      // ignore
    }
  }

  // ===== 출석체크 =====
  Future<void> loadCheckInStatus() async {
    try {
      final status = await _apiService.getCheckInStatus();
      state = state.copyWith(checkInStatus: status);
    } catch (e) {
      // ignore
    }
  }

  Future<CheckInResult?> checkIn() async {
    try {
      final result = await _apiService.checkIn();
      if (result.success) {
        // 출석체크 성공 시 상태 및 자원 새로고침
        await loadCheckInStatus();
        await loadResources();
      }
      return result;
    } catch (e) {
      state = state.copyWith(error: '출석체크에 실패했습니다.');
      return null;
    }
  }

  Future<void> loadResources() async {
    try {
      final response = await _apiService.getResources();
      state = state.copyWith(
        resources: GameResources(
          metal: response.resources.metal,
          crystal: response.resources.crystal,
          deuterium: response.resources.deuterium,
          energy: response.resources.energy,
        ),
        production: GameProduction(
          metal: response.production.metal,
          crystal: response.production.crystal,
          deuterium: response.production.deuterium,
          energyProduction: response.production.energyProduction,
          energyConsumption: response.production.energyConsumption,
        ),
        energyRatio: response.energyRatio,
      );
    } catch (e) {
      // ignore
    }
  }

  // 상세 자원 정보 조회 (자원 탭용)
  Future<Map<String, dynamic>?> getDetailedResources() async {
    try {
      return await _apiService.getDetailedResources();
    } catch (e) {
      return null;
    }
  }

  // 가동률 설정
  Future<bool> setOperationRates(Map<String, int> rates) async {
    try {
      final result = await _apiService.setOperationRates(rates);
      if (result['success'] == true) {
        await loadResources(); // 자원 정보 새로고침
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> loadBuildings() async {
    try {
      final response = await _apiService.getBuildings();
      state = state.copyWith(
        buildings: response.buildings,
        constructionProgress: response.constructionProgress,
        clearConstructionProgress: response.constructionProgress == null,
        fieldInfo: response.fieldInfo,
        planetInfo: response.planetInfo,
      );
    } catch (e) {
      // ignore
    }
  }

  Future<void> upgradeBuilding(String buildingType) async {
    try {
      await _apiService.upgradeBuilding(UpgradeRequest(buildingType: buildingType));
      await loadBuildings();
      await loadResources();
    } catch (e) {
      state = state.copyWith(error: '건물 업그레이드에 실패했습니다.');
    }
  }

  Future<void> downgradeBuilding(String buildingType) async {
    try {
      await _apiService.downgradeBuilding(UpgradeRequest(buildingType: buildingType));
      await loadBuildings();
      await loadResources();
    } catch (e) {
      state = state.copyWith(error: '건물 파괴에 실패했습니다.');
    }
  }

  Future<void> completeBuilding() async {
    try {
      await _apiService.completeBuilding();
      await loadBuildings();
      await loadResources();
    } catch (e) {
      // ignore
    }
  }

  Future<void> cancelBuilding() async {
    try {
      await _apiService.cancelBuilding();
      await loadBuildings();
      await loadResources();
    } catch (e) {
      // ignore
    }
  }

  Future<void> loadResearch() async {
    try {
      final response = await _apiService.getResearch();
      state = state.copyWith(
        research: response.research,
        researchProgress: response.researchProgress,
        clearResearchProgress: response.researchProgress == null,
        labLevel: response.labLevel,
      );
    } catch (e) {
      // ignore
    }
  }

  Future<void> startResearch(String researchType) async {
    try {
      await _apiService.startResearch(ResearchRequest(researchType: researchType));
      await loadResearch();
      await loadResources();
    } catch (e) {
      state = state.copyWith(error: '연구 시작에 실패했습니다.');
    }
  }

  Future<void> completeResearch() async {
    try {
      await _apiService.completeResearch();
      await loadResearch();
    } catch (e) {
      // ignore
    }
  }

  Future<void> cancelResearch() async {
    try {
      await _apiService.cancelResearch();
      await loadResearch();
      await loadResources();
    } catch (e) {
      // ignore
    }
  }

  Future<void> loadFleet() async {
    try {
      final response = await _apiService.getFleet();
      state = state.copyWith(
        fleet: response.fleet,
        fleetProgress: response.fleetProgress,
        clearFleetProgress: response.fleetProgress == null,
        shipyardLevel: response.shipyardLevel,
      );
    } catch (e) {
      // ignore
    }
  }

  Future<void> buildFleet(String fleetType, int quantity) async {
    try {
      await _apiService.buildFleet(BuildFleetRequest(
        fleetType: fleetType,
        quantity: quantity,
      ));
      await loadFleet();
      await loadResources();
    } catch (e) {
      state = state.copyWith(error: '함선 건조에 실패했습니다.');
    }
  }

  Future<void> completeFleet() async {
    try {
      await _apiService.completeFleet();
      await loadFleet();
    } catch (e) {
      // ignore
    }
  }

  Future<void> loadDefense() async {
    try {
      final response = await _apiService.getDefense();
      state = state.copyWith(
        defense: response.defense,
        defenseProgress: response.defenseProgress,
        clearDefenseProgress: response.defenseProgress == null,
      );
    } catch (e) {
      // ignore
    }
  }

  Future<void> buildDefense(String defenseType, int quantity) async {
    try {
      await _apiService.buildDefense(BuildDefenseRequest(
        defenseType: defenseType,
        quantity: quantity,
      ));
      await loadDefense();
      await loadResources();
    } catch (e) {
      state = state.copyWith(error: '방어시설 건설에 실패했습니다.');
    }
  }

  Future<void> completeDefense() async {
    try {
      await _apiService.completeDefense();
      await loadDefense();
    } catch (e) {
      // ignore
    }
  }

  Future<void> loadGalaxy(int galaxy, int system) async {
    try {
      final response = await _apiService.getGalaxyMap(galaxy, system);
      state = state.copyWith(
        currentGalaxy: galaxy,
        currentSystem: system,
        galaxyPlanets: response.planets,
      );
    } catch (e) {
      // ignore
    }
  }

  Future<SpyResponse?> spyOnPlanet(String targetCoord, int probeCount) async {
    try {
      final response = await _apiService.spyOnPlanet(targetCoord, probeCount);
      // 정찰 후 함대 정보 갱신
      await loadFleet();
      return response;
    } catch (e) {
      print('🔴 정찰 API 에러: $e');
      return null;
    }
  }

  Future<void> loadBattleStatus() async {
    try {
      final response = await _apiService.getBattleStatus();
      
      // 응답이 null이거나 모든 상태가 비어있으면 battleStatus 클리어
      if (response == null || 
          (response.pendingAttack == null && 
           response.pendingReturn == null && 
           response.incomingAttack == null)) {
        state = state.copyWith(clearBattleStatus: true);
        return;
      }
      
      state = state.copyWith(battleStatus: response);
      
      // 이미 시간이 만료된 상태라면 자동 처리 시도
      final now = DateTime.now();
      bool needsProcess = false;
      
      if (response.pendingAttack != null) {
        final remaining = response.pendingAttack!.finishDateTime.difference(now).inSeconds;
        if (remaining <= 0 && !response.pendingAttack!.battleCompleted) {
          needsProcess = true;
        }
      } 
      
      if (!needsProcess && response.pendingReturn != null) {
        final remaining = response.pendingReturn!.finishDateTime.difference(now).inSeconds;
        if (remaining <= 0) {
          needsProcess = true;
        }
      }

      if (needsProcess) {
        // 중복 실행 방지를 위해 약간의 딜레이 후 실행
        Future.delayed(const Duration(milliseconds: 500), () => processBattle());
      }
    } catch (e) {
      // ignore
    }
  }

  Future<bool> attack(String targetCoord, Map<String, int> fleet) async {
    try {
      await _apiService.attack(AttackRequest(
        targetCoord: targetCoord,
        fleet: fleet,
      ));
      await loadFleet();
      await loadBattleStatus();
      return true;
    } catch (e) {
      String errorMsg = '공격에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(error: errorMsg);
      return false;
    }
  }

  Future<void> recycle(String targetCoord, Map<String, int> fleet) async {
    try {
      await _apiService.recycle(AttackRequest(
        targetCoord: targetCoord,
        fleet: fleet,
      ));
      await loadFleet();
      await loadBattleStatus();
    } catch (e) {
      state = state.copyWith(error: '수확선 출격에 실패했습니다.');
    }
  }

  /// 수송 미션 (자원을 목표 행성에 내리고, 함대만 귀환)
  Future<bool> transport(String targetCoord, Map<String, int> fleet, Map<String, int> resources) async {
    try {
      await _apiService.transport(
        targetCoord: targetCoord,
        fleet: fleet,
        resources: resources,
      );
      await loadFleet();
      await loadBattleStatus();
      await loadResources();
      return true;
    } catch (e) {
      String errorMsg = '수송에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(error: errorMsg);
      return false;
    }
  }

  /// 배치 미션 (함대 + 자원을 모두 목표 행성에 배치, 귀환 없음)
  Future<bool> deploy(String targetCoord, Map<String, int> fleet, Map<String, int> resources) async {
    try {
      await _apiService.deploy(
        targetCoord: targetCoord,
        fleet: fleet,
        resources: resources,
      );
      await loadFleet();
      await loadBattleStatus();
      await loadResources();
      return true;
    } catch (e) {
      String errorMsg = '배치에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(error: errorMsg);
      return false;
    }
  }

  /// 식민 미션 (빈 좌표에 새로운 식민지 건설, 식민선 1대 소모)
  Future<bool> colonize(String targetCoord, Map<String, int> fleet) async {
    try {
      await _apiService.startColonization(
        targetCoord: targetCoord,
        fleet: fleet,
      );
      await loadFleet();
      await loadBattleStatus();
      await loadResources();
      return true;
    } catch (e) {
      String errorMsg = '식민에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(error: errorMsg);
      return false;
    }
  }

  /// 함대 귀환 명령 (공격 도중 귀환) - 다중 함대 지원
  Future<bool> recallFleet({String? missionId}) async {
    try {
      await _apiService.recallFleet(missionId: missionId);
      await loadBattleStatus();
      return true;
    } catch (e) {
      String errorMsg = '함대 귀환에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(error: errorMsg);
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  /// 자동 완료 체크 - 건설/연구/함대/방어 진행 중인 작업이 완료되었는지 확인하고 자동 완료 처리
  Future<void> checkAndAutoComplete() async {
    if (_isProcessingAutoComplete) return;
    
    final now = DateTime.now();
    bool needsRefresh = false;
    
    try {
      _isProcessingAutoComplete = true;
      
      // 건설 완료 체크
      if (state.constructionProgress != null) {
        final finishTime = state.constructionProgress!.finishDateTime;
        if (finishTime != null && now.isAfter(finishTime)) {
          await _apiService.completeBuilding();
          needsRefresh = true;
        }
      }
      
      // 연구 완료 체크
      if (state.researchProgress != null) {
        final finishTime = state.researchProgress!.finishDateTime;
        if (finishTime != null && now.isAfter(finishTime)) {
          await _apiService.completeResearch();
          needsRefresh = true;
        }
      }
      
      // 함대 건조 완료 체크
      if (state.fleetProgress != null) {
        final finishTime = state.fleetProgress!.finishDateTime;
        if (finishTime != null && now.isAfter(finishTime)) {
          await _apiService.completeFleet();
          needsRefresh = true;
        }
      }
      
      // 방어시설 건조 완료 체크
      if (state.defenseProgress != null) {
        final finishTime = state.defenseProgress!.finishDateTime;
        if (finishTime != null && now.isAfter(finishTime)) {
          await _apiService.completeDefense();
          needsRefresh = true;
        }
      }
      
      // 전투/수확/귀환 완료 체크
      bool battleNeedsProcess = false;
      if (state.battleStatus != null) {
        // 공격/수확 도착 체크 (remainingTime <= 0 이거나 완료 시간이 지났으면)
        if (state.battleStatus!.pendingAttack != null && 
            !state.battleStatus!.pendingAttack!.battleCompleted) {
          final pa = state.battleStatus!.pendingAttack!;
          if (pa.remainingTime <= 0 || !pa.finishDateTime.isAfter(now)) {
            battleNeedsProcess = true;
          }
        }
        // 귀환 완료 체크
        if (!battleNeedsProcess && state.battleStatus!.pendingReturn != null) {
          final pr = state.battleStatus!.pendingReturn!;
          if (pr.remainingTime <= 0 || !pr.finishDateTime.isAfter(now)) {
            battleNeedsProcess = true;
          }
        }
        // 다중 함대 미션 완료 체크 (fleetMissions 배열)
        if (!battleNeedsProcess && state.battleStatus!.fleetMissions.isNotEmpty) {
          for (final mission in state.battleStatus!.fleetMissions) {
            // remainingTime이 0 이하이거나 완료 시간이 지났으면 처리 필요
            if (mission.remainingTime <= 0 || !mission.finishDateTime.isAfter(now)) {
              battleNeedsProcess = true;
              break;
            }
          }
        }
      }
      
      // 전투 관련 처리가 필요한 경우
      if (battleNeedsProcess) {
        await processBattle();
        needsRefresh = true;
      }
      
      // 완료된 작업이 있으면 데이터 새로고침
      if (needsRefresh) {
        await Future.wait([
          loadBuildings(),
          loadResearch(),
          loadFleet(),
          loadDefense(),
          loadResources(),
        ]);
      }
    } catch (e) {
      // 에러 무시 (다음 체크에서 재시도)
    } finally {
      _isProcessingAutoComplete = false;
    }
  }

  Future<void> processBattle() async {
    try {
      final result = await _apiService.processBattle();
      
      // 수송/배치 완료 후 상태 갱신
      if (result['transportProcessed'] == true || result['deployProcessed'] == true) {
        // 약간의 딜레이 후 상태 갱신 (서버 저장 완료 대기)
        await Future.delayed(const Duration(milliseconds: 300));
      }
      
      await loadBattleStatus();
      await loadResources();
      await loadFleet();
    } catch (e) {
      // 에러 시에도 상태 갱신 시도
      await loadBattleStatus();
    }
  }
}

final gameProvider = StateNotifierProvider<GameNotifier, GameState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return GameNotifier(apiService);
});

// ===== 메시지 상태 =====
class MessageState {
  final List<Message> messages;
  final bool isLoading;
  final String? error;

  MessageState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
  });

  MessageState copyWith({
    List<Message>? messages,
    bool? isLoading,
    String? error,
  }) {
    return MessageState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class MessageNotifier extends StateNotifier<MessageState> {
  final ApiService _apiService;

  MessageNotifier(this._apiService) : super(MessageState());

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true);
    try {
      final messages = await _apiService.getMessages();
      state = state.copyWith(messages: messages, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _apiService.markMessageAsRead(id);
      state = state.copyWith(
        messages: state.messages.map((m) => m.id == id ? Message(
          id: m.id,
          senderName: m.senderName,
          title: m.title,
          content: m.content,
          type: m.type,
          isRead: true,
          createdAt: m.createdAt,
          metadata: m.metadata,
        ) : m).toList(),
      );
    } catch (e) {
      // ignore
    }
  }

  Future<void> deleteMessage(String id) async {
    try {
      await _apiService.deleteMessage(id);
      state = state.copyWith(
        messages: state.messages.where((m) => m.id != id).toList(),
      );
    } catch (e) {
      // ignore
    }
  }
}

final messageProvider = StateNotifierProvider<MessageNotifier, MessageState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return MessageNotifier(apiService);
});

// ===== 소켓 서비스 Provider =====
final socketServiceProvider = Provider<SocketService>((ref) {
  final tokenService = ref.watch(tokenServiceProvider);
  return SocketService(tokenService: tokenService);
});

// ===== 채팅 상태 =====
class ChatState {
  final List<ChatMessage> messages;
  final bool isConnected;
  final bool isLoading;
  final int userCount;
  final String? error;

  ChatState({
    this.messages = const [],
    this.isConnected = false,
    this.isLoading = false,
    this.userCount = 0,
    this.error,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isConnected,
    bool? isLoading,
    int? userCount,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isConnected: isConnected ?? this.isConnected,
      isLoading: isLoading ?? this.isLoading,
      userCount: userCount ?? this.userCount,
      error: error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final SocketService _socketService;
  final String? _currentUserId;

  ChatNotifier(this._socketService, this._currentUserId) : super(ChatState()) {
    _setupListeners();
  }

  void _setupListeners() {
    _socketService.connectionStream.listen((connected) {
      state = state.copyWith(isConnected: connected);
    });

    _socketService.chatHistoryStream.listen((messages) {
      state = state.copyWith(messages: messages, isLoading: false);
    });

    _socketService.chatMessageStream.listen((message) {
      // 새 메시지 추가
      final updatedMessages = [...state.messages, message];
      // 최근 50개만 유지
      if (updatedMessages.length > 50) {
        updatedMessages.removeAt(0);
      }
      state = state.copyWith(messages: updatedMessages);
    });

    _socketService.userCountStream.listen((count) {
      state = state.copyWith(userCount: count);
    });
  }

  Future<void> connect() async {
    state = state.copyWith(isLoading: true);
    await _socketService.connect(autoJoinChat: true);  // 자동 채팅방 입장
  }

  void joinChat() {
    _socketService.joinChat();
  }

  void leaveChat() {
    _socketService.leaveChat();
  }

  void sendMessage(String message) {
    if (message.trim().isNotEmpty) {
      _socketService.sendChatMessage(message);
    }
  }

  void disconnect() {
    _socketService.disconnect();
  }

  /// 소켓 재연결 - 백그라운드에서 복귀 시 사용
  Future<void> reconnect() async {
    state = state.copyWith(isLoading: true);
    await _socketService.reconnect(autoJoinChat: true);
  }

  String? get currentUserId => _currentUserId;
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  final authState = ref.watch(authProvider);
  return ChatNotifier(socketService, authState.user?.id);
});

// ===== 연합 상태 =====
class AllianceState {
  final Alliance? myAlliance;  // 내가 가입한 연합 정보
  final List<AllianceSearchResult> searchResults;  // 검색 결과
  final List<AllianceMember> members;  // 연합 멤버 목록
  final List<AllianceJoinRequest> joinRequests;  // 가입 신청 목록
  final bool isLoading;
  final String? error;
  final String? successMessage;

  AllianceState({
    this.myAlliance,
    this.searchResults = const [],
    this.members = const [],
    this.joinRequests = const [],
    this.isLoading = false,
    this.error,
    this.successMessage,
  });

  AllianceState copyWith({
    Alliance? myAlliance,
    bool clearMyAlliance = false,
    List<AllianceSearchResult>? searchResults,
    List<AllianceMember>? members,
    List<AllianceJoinRequest>? joinRequests,
    bool? isLoading,
    String? error,
    String? successMessage,
    bool clearMessages = false,
  }) {
    return AllianceState(
      myAlliance: clearMyAlliance ? null : (myAlliance ?? this.myAlliance),
      searchResults: searchResults ?? this.searchResults,
      members: members ?? this.members,
      joinRequests: joinRequests ?? this.joinRequests,
      isLoading: isLoading ?? this.isLoading,
      error: clearMessages ? null : error,
      successMessage: clearMessages ? null : successMessage,
    );
  }

  bool get hasAlliance => myAlliance != null;
  bool get isLeader => myAlliance?.isOwner == true;
}

class AllianceNotifier extends StateNotifier<AllianceState> {
  final ApiService _apiService;

  AllianceNotifier(this._apiService) : super(AllianceState());

  // 내 연합 정보 로드
  Future<void> loadMyAlliance() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.getMyAlliance();
      state = state.copyWith(
        myAlliance: alliance,
        clearMyAlliance: alliance == null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, clearMyAlliance: true);
    }
  }

  // 연합 생성
  Future<bool> createAlliance(String tag, String name) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.createAlliance(
        CreateAllianceRequest(tag: tag, name: name),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 [$tag] $name이 생성되었습니다!',
      );
      return true;
    } catch (e) {
      String errorMsg = '연합 생성에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 연합 검색
  Future<void> searchAlliances(String query) async {
    if (query.trim().isEmpty) {
      state = state.copyWith(searchResults: []);
      return;
    }
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final results = await _apiService.searchAlliances(query);
      state = state.copyWith(searchResults: results, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '검색에 실패했습니다.');
    }
  }

  // 연합 가입 신청
  Future<bool> applyForAlliance(String allianceId, String applicationText) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.applyForAlliance(
        ApplyForAllianceRequest(
          allianceId: allianceId,
          applicationText: applicationText,
        ),
      );
      state = state.copyWith(
        isLoading: false,
        successMessage: '가입 신청이 완료되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '가입 신청에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 가입 신청 취소
  Future<bool> cancelApplication(String allianceId) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.cancelApplication(allianceId);
      state = state.copyWith(
        isLoading: false,
        successMessage: '가입 신청이 취소되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '신청 취소에 실패했습니다.');
      return false;
    }
  }

  // 연합 탈퇴
  Future<bool> exitAlliance() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.exitAlliance();
      state = state.copyWith(
        clearMyAlliance: true,
        isLoading: false,
        successMessage: '연합에서 탈퇴했습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '연합 탈퇴에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 멤버 목록 로드
  Future<void> loadMembers() async {
    if (state.myAlliance == null) return;
    try {
      final members = await _apiService.getAllianceMembers(state.myAlliance!.id);
      state = state.copyWith(members: members);
    } catch (e) {
      // ignore
    }
  }

  // 가입 신청 목록 로드
  Future<void> loadJoinRequests() async {
    if (state.myAlliance == null) return;
    try {
      final requests = await _apiService.getJoinRequests(state.myAlliance!.id);
      state = state.copyWith(joinRequests: requests);
    } catch (e) {
      // ignore
    }
  }

  // 가입 신청 처리 (승인/거절)
  Future<bool> processApplication(String requestId, bool approve, {String? rejectionReason}) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.processApplication(
        state.myAlliance!.id,
        ProcessApplicationRequest(
          requestId: requestId,
          approve: approve,
          rejectionReason: rejectionReason,
        ),
      );
      await loadJoinRequests();
      await loadMyAlliance();  // 멤버 수 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: approve ? '가입 신청을 승인했습니다.' : '가입 신청을 거절했습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '신청 처리에 실패했습니다.');
      return false;
    }
  }

  // 멤버 추방
  Future<bool> kickMember(String memberId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.kickMember(
        state.myAlliance!.id,
        KickMemberRequest(memberId: memberId),
      );
      await loadMembers();
      await loadMyAlliance();  // 멤버 수 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: '멤버를 추방했습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '멤버 추방에 실패했습니다.');
      return false;
    }
  }

  // 연합 정보 수정
  Future<bool> updateAllianceInfo({
    String? descriptionExternal,
    String? descriptionInternal,
    String? website,
    String? logoImageUrl,
    bool? openToApplications,
  }) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.updateAllianceInfo(
        state.myAlliance!.id,
        UpdateAllianceInfoRequest(
          descriptionExternal: descriptionExternal,
          descriptionInternal: descriptionInternal,
          website: website,
          logoImageUrl: logoImageUrl,
          openToApplications: openToApplications,
        ),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 정보가 수정되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '정보 수정에 실패했습니다.');
      return false;
    }
  }

  // 연합 이름/태그 변경
  Future<bool> changeAllianceNameTag({String? tag, String? name}) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.changeAllianceNameTag(
        state.myAlliance!.id,
        ChangeAllianceNameTagRequest(tag: tag, name: name),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 정보가 변경되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '변경에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 연합 양도
  Future<bool> transferAlliance(String newLeaderId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.transferAlliance(
        state.myAlliance!.id,
        TransferAllianceRequest(newLeaderId: newLeaderId),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 리더가 변경되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '연합 양도에 실패했습니다.');
      return false;
    }
  }

  // 연합 해산
  Future<bool> disbandAlliance() async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.disbandAlliance(state.myAlliance!.id);
      state = state.copyWith(
        clearMyAlliance: true,
        members: [],
        joinRequests: [],
        isLoading: false,
        successMessage: '연합이 해산되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '연합 해산에 실패했습니다.');
      return false;
    }
  }

  // 계급 생성
  Future<bool> createRank(String name, RankPermissions permissions) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.createRank(
        state.myAlliance!.id,
        CreateRankRequest(name: name, permissions: permissions),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '계급이 생성되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '계급 생성에 실패했습니다.');
      return false;
    }
  }

  // 계급 삭제
  Future<bool> deleteRank(String rankId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.deleteRank(state.myAlliance!.id, rankId);
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '계급이 삭제되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '계급 삭제에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 메시지 초기화
  void clearMessages() {
    state = state.copyWith(clearMessages: true);
  }
}

final allianceProvider = StateNotifierProvider<AllianceNotifier, AllianceState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AllianceNotifier(apiService);
});
