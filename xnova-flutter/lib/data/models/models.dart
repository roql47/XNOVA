// ===== 인증 관련 =====
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {
    'email': email,
    'password': password,
  };
}

class RegisterRequest {
  final String email;
  final String password;
  final String playerName;

  RegisterRequest({
    required this.email,
    required this.password,
    required this.playerName,
  });

  Map<String, dynamic> toJson() => {
    'email': email,
    'password': password,
    'playerName': playerName,
  };
}

class AuthResponse {
  final String message;
  final UserInfo user;
  final String accessToken;

  AuthResponse({
    required this.message,
    required this.user,
    required this.accessToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    message: json['message'] ?? '',
    user: UserInfo.fromJson(json['user']),
    accessToken: json['accessToken'] ?? '',
  );
}

class UserInfo {
  final String id;
  final String email;
  final String playerName;
  final String coordinate;

  UserInfo({
    required this.id,
    required this.email,
    required this.playerName,
    required this.coordinate,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) => UserInfo(
    id: json['id'] ?? json['_id'] ?? '',
    email: json['email'] ?? '',
    playerName: json['playerName'] ?? '',
    coordinate: json['coordinate'] ?? '',
  );
}

// ===== 자원 관련 =====
class Resources {
  final int metal;
  final int crystal;
  final int deuterium;
  final int energy;

  Resources({
    this.metal = 0,
    this.crystal = 0,
    this.deuterium = 0,
    this.energy = 0,
  });

  factory Resources.fromJson(Map<String, dynamic> json) => Resources(
    metal: (json['metal'] ?? 0).toInt(),
    crystal: (json['crystal'] ?? 0).toInt(),
    deuterium: (json['deuterium'] ?? 0).toInt(),
    energy: (json['energy'] ?? 0).toInt(),
  );
}

class Production {
  final int metal;
  final int crystal;
  final int deuterium;
  final int energyProduction;
  final int energyConsumption;

  Production({
    this.metal = 0,
    this.crystal = 0,
    this.deuterium = 0,
    this.energyProduction = 0,
    this.energyConsumption = 0,
  });

  factory Production.fromJson(Map<String, dynamic> json) => Production(
    metal: (json['metal'] ?? 0).toInt(),
    crystal: (json['crystal'] ?? 0).toInt(),
    deuterium: (json['deuterium'] ?? 0).toInt(),
    energyProduction: (json['energyProduction'] ?? 0).toInt(),
    energyConsumption: (json['energyConsumption'] ?? 0).toInt(),
  );
}

class ResourcesResponse {
  final Resources resources;
  final Production production;
  final int energyRatio;

  ResourcesResponse({
    required this.resources,
    required this.production,
    this.energyRatio = 100,
  });

  factory ResourcesResponse.fromJson(Map<String, dynamic> json) => ResourcesResponse(
    resources: Resources.fromJson(json['resources'] ?? {}),
    production: Production.fromJson(json['production'] ?? {}),
    energyRatio: (json['energyRatio'] ?? 100).toInt(),
  );
}

// ===== 건물 관련 =====
class Cost {
  final int metal;
  final int crystal;
  final int deuterium;

  Cost({this.metal = 0, this.crystal = 0, this.deuterium = 0});

  factory Cost.fromJson(Map<String, dynamic>? json) => Cost(
    metal: (json?['metal'] ?? 0).toInt(),
    crystal: (json?['crystal'] ?? 0).toInt(),
    deuterium: (json?['deuterium'] ?? 0).toInt(),
  );
}

class BuildingInfo {
  final String type;
  final String name;
  final int level;
  final String category;
  final Cost? upgradeCost;
  final double upgradeTime;

  BuildingInfo({
    required this.type,
    required this.name,
    required this.level,
    required this.category,
    this.upgradeCost,
    this.upgradeTime = 0,
  });

  factory BuildingInfo.fromJson(Map<String, dynamic> json) => BuildingInfo(
    type: json['type'] ?? '',
    name: json['name'] ?? '',
    level: (json['level'] ?? 0).toInt(),
    category: json['category'] ?? '',
    upgradeCost: json['upgradeCost'] != null ? Cost.fromJson(json['upgradeCost']) : null,
    upgradeTime: (json['upgradeTime'] ?? 0).toDouble(),
  );
}

class ProgressInfo {
  final String type;
  final String name;
  final int? quantity;
  final String startTime;
  final String finishTime;

  ProgressInfo({
    required this.type,
    required this.name,
    this.quantity,
    required this.startTime,
    required this.finishTime,
  });

  factory ProgressInfo.fromJson(Map<String, dynamic>? json) {
    if (json == null) return ProgressInfo(type: '', name: '', startTime: '', finishTime: '');
    return ProgressInfo(
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      quantity: json['quantity'],
      startTime: json['startTime'] ?? '',
      finishTime: json['finishTime'] ?? '',
    );
  }
  
  DateTime? get finishDateTime {
    if (finishTime.isEmpty) return null;
    return DateTime.tryParse(finishTime);
  }
}

class BuildingsResponse {
  final List<BuildingInfo> buildings;
  final ProgressInfo? constructionProgress;

  BuildingsResponse({required this.buildings, this.constructionProgress});

  factory BuildingsResponse.fromJson(Map<String, dynamic> json) => BuildingsResponse(
    buildings: (json['buildings'] as List<dynamic>?)
        ?.map((e) => BuildingInfo.fromJson(e))
        .toList() ?? [],
    constructionProgress: json['constructionProgress'] != null
        ? ProgressInfo.fromJson(json['constructionProgress'])
        : null,
  );
}

class UpgradeRequest {
  final String buildingType;

  UpgradeRequest({required this.buildingType});

  Map<String, dynamic> toJson() => {'buildingType': buildingType};
}

class UpgradeResponse {
  final String message;
  final String building;
  final int currentLevel;
  final int targetLevel;
  final Cost cost;
  final double constructionTime;
  final String finishTime;

  UpgradeResponse({
    required this.message,
    required this.building,
    required this.currentLevel,
    required this.targetLevel,
    required this.cost,
    required this.constructionTime,
    required this.finishTime,
  });

  factory UpgradeResponse.fromJson(Map<String, dynamic> json) => UpgradeResponse(
    message: json['message'] ?? '',
    building: json['building'] ?? '',
    currentLevel: (json['currentLevel'] ?? 0).toInt(),
    targetLevel: (json['targetLevel'] ?? 0).toInt(),
    cost: Cost.fromJson(json['cost']),
    constructionTime: (json['constructionTime'] ?? 0).toDouble(),
    finishTime: json['finishTime'] ?? '',
  );
}

// ===== 연구 관련 =====
class ResearchInfo {
  final String type;
  final String name;
  final int level;
  final Cost? cost;
  final double researchTime;
  final bool requirementsMet;
  final List<String> missingRequirements;

  ResearchInfo({
    required this.type,
    required this.name,
    required this.level,
    this.cost,
    this.researchTime = 0,
    this.requirementsMet = true,
    this.missingRequirements = const [],
  });

  factory ResearchInfo.fromJson(Map<String, dynamic> json) => ResearchInfo(
    type: json['type'] ?? '',
    name: json['name'] ?? '',
    level: (json['level'] ?? 0).toInt(),
    cost: json['cost'] != null ? Cost.fromJson(json['cost']) : null,
    researchTime: (json['researchTime'] ?? 0).toDouble(),
    requirementsMet: json['requirementsMet'] ?? true,
    missingRequirements: (json['missingRequirements'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [],
  );
}

class ResearchResponse {
  final List<ResearchInfo> research;
  final ProgressInfo? researchProgress;
  final int labLevel;

  ResearchResponse({
    required this.research,
    this.researchProgress,
    this.labLevel = 0,
  });

  factory ResearchResponse.fromJson(Map<String, dynamic> json) => ResearchResponse(
    research: (json['research'] as List<dynamic>?)
        ?.map((e) => ResearchInfo.fromJson(e))
        .toList() ?? [],
    researchProgress: json['researchProgress'] != null
        ? ProgressInfo.fromJson(json['researchProgress'])
        : null,
    labLevel: (json['labLevel'] ?? 0).toInt(),
  );
}

class ResearchRequest {
  final String researchType;

  ResearchRequest({required this.researchType});

  Map<String, dynamic> toJson() => {'researchType': researchType};
}

// ===== 함대 관련 =====
class FleetStats {
  final int attack;
  final int shield;
  final int hull;
  final int speed;
  final int cargo;
  final int fuelConsumption;

  FleetStats({
    this.attack = 0,
    this.shield = 0,
    this.hull = 0,
    this.speed = 0,
    this.cargo = 0,
    this.fuelConsumption = 0,
  });

  factory FleetStats.fromJson(Map<String, dynamic> json) => FleetStats(
    attack: (json['attack'] ?? 0).toInt(),
    shield: (json['shield'] ?? 0).toInt(),
    hull: (json['hull'] ?? 0).toInt(),
    speed: (json['speed'] ?? 0).toInt(),
    cargo: (json['cargo'] ?? 0).toInt(),
    fuelConsumption: (json['fuelConsumption'] ?? 0).toInt(),
  );
}

class FleetInfo {
  final String type;
  final String name;
  final int count;
  final Cost cost;
  final FleetStats stats;
  final double buildTime;
  final bool requirementsMet;
  final List<String> missingRequirements;

  FleetInfo({
    required this.type,
    required this.name,
    this.count = 0,
    required this.cost,
    required this.stats,
    this.buildTime = 0,
    this.requirementsMet = true,
    this.missingRequirements = const [],
  });

  factory FleetInfo.fromJson(Map<String, dynamic> json) => FleetInfo(
    type: json['type'] ?? '',
    name: json['name'] ?? '',
    count: (json['count'] ?? 0).toInt(),
    cost: Cost.fromJson(json['cost']),
    stats: FleetStats.fromJson(json['stats'] ?? {}),
    buildTime: (json['buildTime'] ?? 0).toDouble(),
    requirementsMet: json['requirementsMet'] ?? true,
    missingRequirements: (json['missingRequirements'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [],
  );
}

class FleetResponse {
  final List<FleetInfo> fleet;
  final ProgressInfo? fleetProgress;
  final int shipyardLevel;

  FleetResponse({
    required this.fleet,
    this.fleetProgress,
    this.shipyardLevel = 0,
  });

  factory FleetResponse.fromJson(Map<String, dynamic> json) => FleetResponse(
    fleet: (json['fleet'] as List<dynamic>?)
        ?.map((e) => FleetInfo.fromJson(e))
        .toList() ?? [],
    fleetProgress: json['fleetProgress'] != null
        ? ProgressInfo.fromJson(json['fleetProgress'])
        : null,
    shipyardLevel: (json['shipyardLevel'] ?? 0).toInt(),
  );
}

class BuildFleetRequest {
  final String fleetType;
  final int quantity;

  BuildFleetRequest({required this.fleetType, required this.quantity});

  Map<String, dynamic> toJson() => {
    'fleetType': fleetType,
    'quantity': quantity,
  };
}

// ===== 방어시설 관련 =====
class DefenseStats {
  final int attack;
  final int shield;
  final int hull;

  DefenseStats({this.attack = 0, this.shield = 0, this.hull = 0});

  factory DefenseStats.fromJson(Map<String, dynamic> json) => DefenseStats(
    attack: (json['attack'] ?? 0).toInt(),
    shield: (json['shield'] ?? 0).toInt(),
    hull: (json['hull'] ?? 0).toInt(),
  );
}

class DefenseInfo {
  final String type;
  final String name;
  final int count;
  final Cost cost;
  final DefenseStats stats;
  final double buildTime;
  final int? maxCount;
  final bool requirementsMet;
  final List<String> missingRequirements;

  DefenseInfo({
    required this.type,
    required this.name,
    this.count = 0,
    required this.cost,
    required this.stats,
    this.buildTime = 0,
    this.maxCount,
    this.requirementsMet = true,
    this.missingRequirements = const [],
  });

  factory DefenseInfo.fromJson(Map<String, dynamic> json) => DefenseInfo(
    type: json['type'] ?? '',
    name: json['name'] ?? '',
    count: (json['count'] ?? 0).toInt(),
    cost: Cost.fromJson(json['cost']),
    stats: DefenseStats.fromJson(json['stats'] ?? {}),
    buildTime: (json['buildTime'] ?? 0).toDouble(),
    maxCount: json['maxCount'],
    requirementsMet: json['requirementsMet'] ?? true,
    missingRequirements: (json['missingRequirements'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [],
  );
}

class DefenseResponse {
  final List<DefenseInfo> defense;
  final ProgressInfo? defenseProgress;
  final int robotFactoryLevel;

  DefenseResponse({
    required this.defense,
    this.defenseProgress,
    this.robotFactoryLevel = 0,
  });

  factory DefenseResponse.fromJson(Map<String, dynamic> json) => DefenseResponse(
    defense: (json['defense'] as List<dynamic>?)
        ?.map((e) => DefenseInfo.fromJson(e))
        .toList() ?? [],
    defenseProgress: json['defenseProgress'] != null
        ? ProgressInfo.fromJson(json['defenseProgress'])
        : null,
    robotFactoryLevel: (json['robotFactoryLevel'] ?? 0).toInt(),
  );
}

class BuildDefenseRequest {
  final String defenseType;
  final int quantity;

  BuildDefenseRequest({required this.defenseType, required this.quantity});

  Map<String, dynamic> toJson() => {
    'defenseType': defenseType,
    'quantity': quantity,
  };
}

// ===== 은하 지도 관련 =====
class PlanetInfo {
  final int position;
  final String coordinate;
  final String? playerName;
  final String? playerId;
  final bool isOwnPlanet;
  final bool hasDebris;
  final bool hasMoon;

  PlanetInfo({
    required this.position,
    required this.coordinate,
    this.playerName,
    this.playerId,
    this.isOwnPlanet = false,
    this.hasDebris = false,
    this.hasMoon = false,
  });

  factory PlanetInfo.fromJson(Map<String, dynamic> json) => PlanetInfo(
    position: (json['position'] ?? 0).toInt(),
    coordinate: json['coordinate'] ?? '',
    playerName: json['playerName'],
    playerId: json['playerId'],
    isOwnPlanet: json['isOwnPlanet'] ?? false,
    hasDebris: json['hasDebris'] ?? false,
    hasMoon: json['hasMoon'] ?? false,
  );
}

class GalaxyResponse {
  final int galaxy;
  final int system;
  final List<PlanetInfo> planets;

  GalaxyResponse({
    required this.galaxy,
    required this.system,
    required this.planets,
  });

  factory GalaxyResponse.fromJson(Map<String, dynamic> json) => GalaxyResponse(
    galaxy: (json['galaxy'] ?? 1).toInt(),
    system: (json['system'] ?? 1).toInt(),
    planets: (json['planets'] as List<dynamic>?)
        ?.map((e) => PlanetInfo.fromJson(e))
        .toList() ?? [],
  );
}

// ===== 전투 관련 =====
class AttackRequest {
  final String targetCoord;
  final Map<String, int> fleet;

  AttackRequest({required this.targetCoord, required this.fleet});

  Map<String, dynamic> toJson() => {
    'targetCoord': targetCoord,
    'fleet': fleet,
  };
}

class AttackResponse {
  final String message;
  final Map<String, int> fleet;
  final int capacity;
  final int fuelConsumption;
  final double travelTime;
  final String arrivalTime;
  final int distance;

  AttackResponse({
    required this.message,
    required this.fleet,
    required this.capacity,
    required this.fuelConsumption,
    required this.travelTime,
    required this.arrivalTime,
    required this.distance,
  });

  factory AttackResponse.fromJson(Map<String, dynamic> json) => AttackResponse(
    message: json['message'] ?? '',
    fleet: Map<String, int>.from(json['fleet'] ?? {}),
    capacity: (json['capacity'] ?? 0).toInt(),
    fuelConsumption: (json['fuelConsumption'] ?? 0).toInt(),
    travelTime: (json['travelTime'] ?? 0).toDouble(),
    arrivalTime: json['arrivalTime'] ?? '',
    distance: (json['distance'] ?? 0).toInt(),
  );
}

class BattleStatus {
  final PendingAttackInfo? pendingAttack;
  final PendingReturnInfo? pendingReturn;
  final IncomingAttackInfo? incomingAttack;

  BattleStatus({this.pendingAttack, this.pendingReturn, this.incomingAttack});

  factory BattleStatus.fromJson(Map<String, dynamic> json) => BattleStatus(
    pendingAttack: json['pendingAttack'] != null
        ? PendingAttackInfo.fromJson(json['pendingAttack'])
        : null,
    pendingReturn: json['pendingReturn'] != null
        ? PendingReturnInfo.fromJson(json['pendingReturn'])
        : null,
    incomingAttack: json['incomingAttack'] != null
        ? IncomingAttackInfo.fromJson(json['incomingAttack'])
        : null,
  );
}

class PendingAttackInfo {
  final String targetCoord;
  final Map<String, int> fleet;
  final double remainingTime;
  final bool battleCompleted;

  PendingAttackInfo({
    required this.targetCoord,
    required this.fleet,
    required this.remainingTime,
    this.battleCompleted = false,
  });

  factory PendingAttackInfo.fromJson(Map<String, dynamic> json) => PendingAttackInfo(
    targetCoord: json['targetCoord'] ?? '',
    fleet: Map<String, int>.from(json['fleet'] ?? {}),
    remainingTime: (json['remainingTime'] ?? 0).toDouble(),
    battleCompleted: json['battleCompleted'] ?? false,
  );
}

class PendingReturnInfo {
  final Map<String, int> fleet;
  final Map<String, int> loot;
  final double remainingTime;

  PendingReturnInfo({
    required this.fleet,
    required this.loot,
    required this.remainingTime,
  });

  factory PendingReturnInfo.fromJson(Map<String, dynamic> json) => PendingReturnInfo(
    fleet: Map<String, int>.from(json['fleet'] ?? {}),
    loot: Map<String, int>.from(json['loot'] ?? {}),
    remainingTime: (json['remainingTime'] ?? 0).toDouble(),
  );
}

class IncomingAttackInfo {
  final String attackerCoord;
  final double remainingTime;

  IncomingAttackInfo({required this.attackerCoord, required this.remainingTime});

  factory IncomingAttackInfo.fromJson(Map<String, dynamic> json) => IncomingAttackInfo(
    attackerCoord: json['attackerCoord'] ?? '',
    remainingTime: (json['remainingTime'] ?? 0).toDouble(),
  );
}

// ===== 랭킹 관련 =====
class PlayerScore {
  final int rank;
  final String playerId;
  final String playerName;
  final String coordinate;
  final int totalScore;
  final int constructionScore;
  final int researchScore;
  final int fleetScore;

  PlayerScore({
    required this.rank,
    required this.playerId,
    required this.playerName,
    required this.coordinate,
    this.totalScore = 0,
    this.constructionScore = 0,
    this.researchScore = 0,
    this.fleetScore = 0,
  });

  factory PlayerScore.fromJson(Map<String, dynamic> json) => PlayerScore(
    rank: (json['rank'] ?? 0).toInt(),
    playerId: json['playerId'] ?? '',
    playerName: json['playerName'] ?? '',
    coordinate: json['coordinate'] ?? '',
    totalScore: (json['totalScore'] ?? 0).toInt(),
    constructionScore: (json['constructionScore'] ?? 0).toInt(),
    researchScore: (json['researchScore'] ?? 0).toInt(),
    fleetScore: (json['fleetScore'] ?? 0).toInt(),
  );
}

class RankingResponse {
  final String type;
  final List<PlayerScore> ranking;
  final int totalPlayers;

  RankingResponse({
    required this.type,
    required this.ranking,
    this.totalPlayers = 0,
  });

  factory RankingResponse.fromJson(Map<String, dynamic> json) => RankingResponse(
    type: json['type'] ?? 'total',
    ranking: (json['ranking'] as List<dynamic>?)
        ?.map((e) => PlayerScore.fromJson(e))
        .toList() ?? [],
    totalPlayers: (json['totalPlayers'] ?? 0).toInt(),
  );
}

class MyRankResponse {
  final RankInfo total;
  final RankInfo construction;
  final RankInfo research;
  final RankInfo fleet;

  MyRankResponse({
    required this.total,
    required this.construction,
    required this.research,
    required this.fleet,
  });

  factory MyRankResponse.fromJson(Map<String, dynamic> json) => MyRankResponse(
    total: RankInfo.fromJson(json['total'] ?? {}),
    construction: RankInfo.fromJson(json['construction'] ?? {}),
    research: RankInfo.fromJson(json['research'] ?? {}),
    fleet: RankInfo.fromJson(json['fleet'] ?? {}),
  );
}

class RankInfo {
  final int rank;
  final int score;

  RankInfo({this.rank = 0, this.score = 0});

  factory RankInfo.fromJson(Map<String, dynamic> json) => RankInfo(
    rank: (json['rank'] ?? 0).toInt(),
    score: (json['score'] ?? 0).toInt(),
  );
}

// ===== 사용자 프로필 =====
class UserProfile {
  final String id;
  final String email;
  final String playerName;
  final String coordinate;
  final Resources resources;
  final Map<String, int> mines;
  final Map<String, int> facilities;
  final Map<String, int> researchLevels;
  final Map<String, int> fleet;
  final Map<String, int> defense;
  final ProgressInfo? constructionProgress;
  final ProgressInfo? researchProgress;
  final ProgressInfo? fleetProgress;
  final ProgressInfo? defenseProgress;

  UserProfile({
    required this.id,
    required this.email,
    required this.playerName,
    required this.coordinate,
    required this.resources,
    this.mines = const {},
    this.facilities = const {},
    this.researchLevels = const {},
    this.fleet = const {},
    this.defense = const {},
    this.constructionProgress,
    this.researchProgress,
    this.fleetProgress,
    this.defenseProgress,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
    id: json['_id'] ?? json['id'] ?? '',
    email: json['email'] ?? '',
    playerName: json['playerName'] ?? '',
    coordinate: json['coordinate'] ?? '',
    resources: Resources.fromJson(json['resources'] ?? {}),
    mines: Map<String, int>.from(json['mines'] ?? {}),
    facilities: Map<String, int>.from(json['facilities'] ?? {}),
    researchLevels: Map<String, int>.from(json['researchLevels'] ?? {}),
    fleet: Map<String, int>.from(json['fleet'] ?? {}),
    defense: Map<String, int>.from(json['defense'] ?? {}),
    constructionProgress: json['constructionProgress'] != null
        ? ProgressInfo.fromJson(json['constructionProgress'])
        : null,
    researchProgress: json['researchProgress'] != null
        ? ProgressInfo.fromJson(json['researchProgress'])
        : null,
    fleetProgress: json['fleetProgress'] != null
        ? ProgressInfo.fromJson(json['fleetProgress'])
        : null,
    defenseProgress: json['defenseProgress'] != null
        ? ProgressInfo.fromJson(json['defenseProgress'])
        : null,
  );
}

