package com.xnova.game.data.remote

import com.xnova.game.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // ===== 인증 =====
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @GET("auth/profile")
    suspend fun getProfile(): Response<UserProfile>
    
    // ===== 자원 =====
    @GET("game/resources")
    suspend fun getResources(): Response<ResourcesResponse>
    
    // ===== 건물 =====
    @GET("game/buildings")
    suspend fun getBuildings(): Response<BuildingsResponse>
    
    @POST("game/buildings/upgrade")
    suspend fun upgradeBuilding(@Body request: UpgradeRequest): Response<UpgradeResponse>
    
    @POST("game/buildings/complete")
    suspend fun completeBuilding(): Response<Map<String, Any>>
    
    @POST("game/buildings/cancel")
    suspend fun cancelBuilding(): Response<Map<String, Any>>
    
    // ===== 연구 =====
    @GET("game/research")
    suspend fun getResearch(): Response<ResearchResponse>
    
    @POST("game/research/start")
    suspend fun startResearch(@Body request: ResearchRequest): Response<Map<String, Any>>
    
    @POST("game/research/complete")
    suspend fun completeResearch(): Response<Map<String, Any>>
    
    @POST("game/research/cancel")
    suspend fun cancelResearch(): Response<Map<String, Any>>
    
    // ===== 함대 =====
    @GET("game/fleet")
    suspend fun getFleet(): Response<FleetResponse>
    
    @POST("game/fleet/build")
    suspend fun buildFleet(@Body request: BuildFleetRequest): Response<Map<String, Any>>
    
    @POST("game/fleet/complete")
    suspend fun completeFleet(): Response<Map<String, Any>>
    
    // ===== 방어시설 =====
    @GET("game/defense")
    suspend fun getDefense(): Response<DefenseResponse>
    
    @POST("game/defense/build")
    suspend fun buildDefense(@Body request: BuildDefenseRequest): Response<Map<String, Any>>
    
    @POST("game/defense/complete")
    suspend fun completeDefense(): Response<Map<String, Any>>
    
    // ===== 전투 =====
    @POST("game/battle/attack")
    suspend fun attack(@Body request: AttackRequest): Response<AttackResponse>
    
    @GET("game/battle/status")
    suspend fun getBattleStatus(): Response<BattleStatus>
    
    @POST("game/battle/process")
    suspend fun processBattle(): Response<Map<String, Any>>
    
    // ===== 은하 =====
    @GET("galaxy/{galaxy}/{system}")
    suspend fun getGalaxyMap(
        @Path("galaxy") galaxy: Int,
        @Path("system") system: Int
    ): Response<GalaxyResponse>
    
    @GET("galaxy/player/{playerId}")
    suspend fun getPlayerInfo(@Path("playerId") playerId: String): Response<Map<String, Any>>
    
    // ===== 랭킹 =====
    @GET("ranking")
    suspend fun getRanking(
        @Query("type") type: String = "total",
        @Query("limit") limit: Int = 100
    ): Response<RankingResponse>
    
    @GET("ranking/me")
    suspend fun getMyRank(): Response<MyRankResponse>
}

