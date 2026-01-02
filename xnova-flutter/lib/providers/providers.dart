import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../data/services/token_service.dart';
import '../data/services/api_service.dart';
import '../data/services/socket_service.dart';
import '../data/models/models.dart';

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
    serverClientId: '820555705462-qhtlv9mdpd41gnvfh3en3nm4ultbg4ha.apps.googleusercontent.com',
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
      state = state.copyWith(
        isLoading: false,
        error: '회원가입에 실패했습니다. 다른 이메일이나 닉네임을 사용해주세요.',
      );
      return false;
    }
  }

  // 구글 로그인
  Future<bool> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      print('🔵 Google Sign-In 시작...');
      
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
  research,
  shipyard,
  defense,
  fleet,
  galaxy,
  messages,
  ranking,
  techtree,
  simulator,
}

class NavigationState {
  final MainTab selectedTab;
  final String? targetCoordinate;

  NavigationState({
    this.selectedTab = MainTab.overview,
    this.targetCoordinate,
  });

  NavigationState copyWith({
    MainTab? selectedTab,
    String? targetCoordinate,
    bool clearTarget = false,
  }) {
    return NavigationState(
      selectedTab: selectedTab ?? this.selectedTab,
      targetCoordinate: clearTarget ? null : (targetCoordinate ?? this.targetCoordinate),
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
      battleStatus: battleStatus ?? this.battleStatus,
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
      ]);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
      state = state.copyWith(battleStatus: response);
      
      // 이미 시간이 만료된 상태라면 자동 처리 시도
      if (response != null) {
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
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> attack(String targetCoord, Map<String, int> fleet) async {
    try {
      await _apiService.attack(AttackRequest(
        targetCoord: targetCoord,
        fleet: fleet,
      ));
      await loadFleet();
      await loadBattleStatus();
    } catch (e) {
      state = state.copyWith(error: '공격에 실패했습니다.');
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
      await _apiService.processBattle();
      await loadBattleStatus();
      await loadResources();
      await loadFleet();
    } catch (e) {
      // ignore
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
    await _socketService.connect();
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

  String? get currentUserId => _currentUserId;
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  final authState = ref.watch(authProvider);
  return ChatNotifier(socketService, authState.user?.id);
});

