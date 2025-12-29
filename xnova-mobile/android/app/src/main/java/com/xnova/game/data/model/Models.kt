package com.xnova.game.data.model

import com.google.gson.annotations.SerializedName

// 인증 관련
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val playerName: String
)

data class AuthResponse(
    val message: String,
    val user: UserInfo,
    val accessToken: String
)

data class UserInfo(
    val id: String,
    val email: String,
    val playerName: String,
    val coordinate: String
)

// 자원 관련
data class Resources(
    val metal: Long = 0,
    val crystal: Long = 0,
    val deuterium: Long = 0,
    val energy: Int = 0
)

data class Production(
    val metal: Int = 0,
    val crystal: Int = 0,
    val deuterium: Int = 0,
    val energyProduction: Int = 0,
    val energyConsumption: Int = 0
)

data class ResourcesResponse(
    val resources: Resources,
    val production: Production,
    val energyRatio: Int
)

// 건물 관련
data class BuildingInfo(
    val type: String,
    val name: String,
    val level: Int,
    val category: String,
    val upgradeCost: Cost?,
    val upgradeTime: Double
)

data class Cost(
    val metal: Long = 0,
    val crystal: Long = 0,
    val deuterium: Long = 0
)

data class ProgressInfo(
    val type: String,
    val name: String,
    val quantity: Int? = null,
    val startTime: String,
    val finishTime: String
)

data class BuildingsResponse(
    val buildings: List<BuildingInfo>,
    val constructionProgress: ProgressInfo?
)

data class UpgradeRequest(
    val buildingType: String
)

data class UpgradeResponse(
    val message: String,
    val building: String,
    val currentLevel: Int,
    val targetLevel: Int,
    val cost: Cost,
    val constructionTime: Double,
    val finishTime: String
)

// 연구 관련
data class ResearchInfo(
    val type: String,
    val name: String,
    val level: Int,
    val cost: Cost?,
    val researchTime: Double,
    val requirementsMet: Boolean,
    val missingRequirements: List<String>
)

data class ResearchResponse(
    val research: List<ResearchInfo>,
    val researchProgress: ProgressInfo?,
    val labLevel: Int
)

data class ResearchRequest(
    val researchType: String
)

// 함대 관련
data class FleetStats(
    val attack: Int,
    val shield: Int,
    val hull: Int,
    val speed: Int,
    val cargo: Int,
    val fuelConsumption: Int
)

data class FleetInfo(
    val type: String,
    val name: String,
    val count: Int,
    val cost: Cost,
    val stats: FleetStats,
    val buildTime: Double,
    val requirementsMet: Boolean,
    val missingRequirements: List<String>
)

data class FleetResponse(
    val fleet: List<FleetInfo>,
    val fleetProgress: ProgressInfo?,
    val shipyardLevel: Int
)

data class BuildFleetRequest(
    val fleetType: String,
    val quantity: Int
)

// 방어시설 관련
data class DefenseStats(
    val attack: Int,
    val shield: Int,
    val hull: Int
)

data class DefenseInfo(
    val type: String,
    val name: String,
    val count: Int,
    val cost: Cost,
    val stats: DefenseStats,
    val buildTime: Double,
    val maxCount: Int?,
    val requirementsMet: Boolean,
    val missingRequirements: List<String>
)

data class DefenseResponse(
    val defense: List<DefenseInfo>,
    val defenseProgress: ProgressInfo?,
    val robotFactoryLevel: Int
)

data class BuildDefenseRequest(
    val defenseType: String,
    val quantity: Int
)

// 은하 지도 관련
data class PlanetInfo(
    val position: Int,
    val coordinate: String,
    val playerName: String?,
    val playerId: String?,
    val isOwnPlanet: Boolean,
    val hasDebris: Boolean,
    val hasMoon: Boolean
)

data class GalaxyResponse(
    val galaxy: Int,
    val system: Int,
    val planets: List<PlanetInfo>
)

// 전투 관련
data class AttackRequest(
    val targetCoord: String,
    val fleet: Map<String, Int>
)

data class AttackResponse(
    val message: String,
    val fleet: Map<String, Int>,
    val capacity: Int,
    val fuelConsumption: Int,
    val travelTime: Double,
    val arrivalTime: String,
    val distance: Int
)

data class BattleStatus(
    val pendingAttack: PendingAttackInfo?,
    val pendingReturn: PendingReturnInfo?,
    val incomingAttack: IncomingAttackInfo?
)

data class PendingAttackInfo(
    val targetCoord: String,
    val fleet: Map<String, Int>,
    val remainingTime: Double,
    val battleCompleted: Boolean
)

data class PendingReturnInfo(
    val fleet: Map<String, Int>,
    val loot: Map<String, Long>,
    val remainingTime: Double
)

data class IncomingAttackInfo(
    val attackerCoord: String,
    val remainingTime: Double
)

// 랭킹 관련
data class PlayerScore(
    val rank: Int,
    val playerId: String,
    val playerName: String,
    val coordinate: String,
    val totalScore: Long,
    val constructionScore: Long,
    val researchScore: Long,
    val fleetScore: Long
)

data class RankingResponse(
    val type: String,
    val ranking: List<PlayerScore>,
    val totalPlayers: Int
)

data class MyRankResponse(
    val total: RankInfo,
    val construction: RankInfo,
    val research: RankInfo,
    val fleet: RankInfo
)

data class RankInfo(
    val rank: Int,
    val score: Long
)

// 사용자 프로필
data class UserProfile(
    @SerializedName("_id") val id: String,
    val email: String,
    val playerName: String,
    val coordinate: String,
    val resources: Resources,
    val mines: Map<String, Int>,
    val facilities: Map<String, Int>,
    val researchLevels: Map<String, Int>,
    val fleet: Map<String, Int>,
    val defense: Map<String, Int>,
    val constructionProgress: ProgressInfo?,
    val researchProgress: ProgressInfo?,
    val fleetProgress: ProgressInfo?,
    val defenseProgress: ProgressInfo?,
    val pendingAttack: Any?,
    val pendingReturn: Any?,
    val incomingAttack: Any?
)

