import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/token_service.dart';
import '../data/services/api_service.dart';
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

  AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.user,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    UserInfo? user,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;
  final TokenService _tokenService;

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

  Future<void> logout() async {
    await _tokenService.deleteToken();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final tokenService = ref.watch(tokenServiceProvider);
  return AuthNotifier(apiService, tokenService);
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

  const GameProduction({
    this.metal = 0,
    this.crystal = 0,
    this.deuterium = 0,
  });
}

class GameNotifier extends StateNotifier<GameState> {
  final ApiService _apiService;

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

  Future<void> loadBattleStatus() async {
    try {
      final response = await _apiService.getBattleStatus();
      state = state.copyWith(battleStatus: response);
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

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final gameProvider = StateNotifierProvider<GameNotifier, GameState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return GameNotifier(apiService);
});

