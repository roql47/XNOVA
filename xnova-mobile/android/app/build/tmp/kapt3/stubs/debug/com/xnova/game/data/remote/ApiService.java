package com.xnova.game.data.remote;

import com.xnova.game.data.model.*;
import retrofit2.Response;
import retrofit2.http.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u00a4\u0001\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010$\n\u0002\u0010\u000e\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\bf\u0018\u00002\u00020\u0001J\u001e\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u0006H\u00a7@\u00a2\u0006\u0002\u0010\u0007J*\u0010\b\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u000bH\u00a7@\u00a2\u0006\u0002\u0010\fJ*\u0010\r\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u000eH\u00a7@\u00a2\u0006\u0002\u0010\u000fJ \u0010\u0010\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J \u0010\u0012\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J \u0010\u0013\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J \u0010\u0014\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J \u0010\u0015\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J \u0010\u0016\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00180\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u0014\u0010\u0019\u001a\b\u0012\u0004\u0012\u00020\u001a0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u0014\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u001c0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u0014\u0010\u001d\u001a\b\u0012\u0004\u0012\u00020\u001e0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J(\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020 0\u00032\b\b\u0001\u0010!\u001a\u00020\"2\b\b\u0001\u0010#\u001a\u00020\"H\u00a7@\u00a2\u0006\u0002\u0010$J\u0014\u0010%\u001a\b\u0012\u0004\u0012\u00020&0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J*\u0010\'\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u00032\b\b\u0001\u0010(\u001a\u00020\nH\u00a7@\u00a2\u0006\u0002\u0010)J\u0014\u0010*\u001a\b\u0012\u0004\u0012\u00020+0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J(\u0010,\u001a\b\u0012\u0004\u0012\u00020-0\u00032\b\b\u0003\u0010.\u001a\u00020\n2\b\b\u0003\u0010/\u001a\u00020\"H\u00a7@\u00a2\u0006\u0002\u00100J\u0014\u00101\u001a\b\u0012\u0004\u0012\u0002020\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u0014\u00103\u001a\b\u0012\u0004\u0012\u0002040\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u001e\u00105\u001a\b\u0012\u0004\u0012\u0002060\u00032\b\b\u0001\u0010\u0005\u001a\u000207H\u00a7@\u00a2\u0006\u0002\u00108J \u00109\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0011J\u001e\u0010:\u001a\b\u0012\u0004\u0012\u0002060\u00032\b\b\u0001\u0010\u0005\u001a\u00020;H\u00a7@\u00a2\u0006\u0002\u0010<J*\u0010=\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00010\t0\u00032\b\b\u0001\u0010\u0005\u001a\u00020>H\u00a7@\u00a2\u0006\u0002\u0010?J\u001e\u0010@\u001a\b\u0012\u0004\u0012\u00020A0\u00032\b\b\u0001\u0010\u0005\u001a\u00020BH\u00a7@\u00a2\u0006\u0002\u0010C\u00a8\u0006D"}, d2 = {"Lcom/xnova/game/data/remote/ApiService;", "", "attack", "Lretrofit2/Response;", "Lcom/xnova/game/data/model/AttackResponse;", "request", "Lcom/xnova/game/data/model/AttackRequest;", "(Lcom/xnova/game/data/model/AttackRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "buildDefense", "", "", "Lcom/xnova/game/data/model/BuildDefenseRequest;", "(Lcom/xnova/game/data/model/BuildDefenseRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "buildFleet", "Lcom/xnova/game/data/model/BuildFleetRequest;", "(Lcom/xnova/game/data/model/BuildFleetRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "cancelBuilding", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "cancelResearch", "completeBuilding", "completeDefense", "completeFleet", "completeResearch", "getBattleStatus", "Lcom/xnova/game/data/model/BattleStatus;", "getBuildings", "Lcom/xnova/game/data/model/BuildingsResponse;", "getDefense", "Lcom/xnova/game/data/model/DefenseResponse;", "getFleet", "Lcom/xnova/game/data/model/FleetResponse;", "getGalaxyMap", "Lcom/xnova/game/data/model/GalaxyResponse;", "galaxy", "", "system", "(IILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getMyRank", "Lcom/xnova/game/data/model/MyRankResponse;", "getPlayerInfo", "playerId", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getProfile", "Lcom/xnova/game/data/model/UserProfile;", "getRanking", "Lcom/xnova/game/data/model/RankingResponse;", "type", "limit", "(Ljava/lang/String;ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getResearch", "Lcom/xnova/game/data/model/ResearchResponse;", "getResources", "Lcom/xnova/game/data/model/ResourcesResponse;", "login", "Lcom/xnova/game/data/model/AuthResponse;", "Lcom/xnova/game/data/model/LoginRequest;", "(Lcom/xnova/game/data/model/LoginRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "processBattle", "register", "Lcom/xnova/game/data/model/RegisterRequest;", "(Lcom/xnova/game/data/model/RegisterRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "startResearch", "Lcom/xnova/game/data/model/ResearchRequest;", "(Lcom/xnova/game/data/model/ResearchRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "upgradeBuilding", "Lcom/xnova/game/data/model/UpgradeResponse;", "Lcom/xnova/game/data/model/UpgradeRequest;", "(Lcom/xnova/game/data/model/UpgradeRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface ApiService {
    
    @retrofit2.http.POST(value = "auth/register")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object register(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.RegisterRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.AuthResponse>> $completion);
    
    @retrofit2.http.POST(value = "auth/login")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object login(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.LoginRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.AuthResponse>> $completion);
    
    @retrofit2.http.GET(value = "auth/profile")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getProfile(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.UserProfile>> $completion);
    
    @retrofit2.http.GET(value = "game/resources")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getResources(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.ResourcesResponse>> $completion);
    
    @retrofit2.http.GET(value = "game/buildings")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getBuildings(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.BuildingsResponse>> $completion);
    
    @retrofit2.http.POST(value = "game/buildings/upgrade")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object upgradeBuilding(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.UpgradeRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.UpgradeResponse>> $completion);
    
    @retrofit2.http.POST(value = "game/buildings/complete")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object completeBuilding(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.POST(value = "game/buildings/cancel")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object cancelBuilding(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.GET(value = "game/research")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getResearch(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.ResearchResponse>> $completion);
    
    @retrofit2.http.POST(value = "game/research/start")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object startResearch(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.ResearchRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.POST(value = "game/research/complete")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object completeResearch(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.POST(value = "game/research/cancel")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object cancelResearch(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.GET(value = "game/fleet")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getFleet(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.FleetResponse>> $completion);
    
    @retrofit2.http.POST(value = "game/fleet/build")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object buildFleet(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.BuildFleetRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.POST(value = "game/fleet/complete")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object completeFleet(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.GET(value = "game/defense")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getDefense(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.DefenseResponse>> $completion);
    
    @retrofit2.http.POST(value = "game/defense/build")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object buildDefense(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.BuildDefenseRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.POST(value = "game/defense/complete")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object completeDefense(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.POST(value = "game/battle/attack")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object attack(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.AttackRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.AttackResponse>> $completion);
    
    @retrofit2.http.GET(value = "game/battle/status")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getBattleStatus(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.BattleStatus>> $completion);
    
    @retrofit2.http.POST(value = "game/battle/process")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object processBattle(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.GET(value = "galaxy/{galaxy}/{system}")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getGalaxyMap(@retrofit2.http.Path(value = "galaxy")
    int galaxy, @retrofit2.http.Path(value = "system")
    int system, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.GalaxyResponse>> $completion);
    
    @retrofit2.http.GET(value = "galaxy/player/{playerId}")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getPlayerInfo(@retrofit2.http.Path(value = "playerId")
    @org.jetbrains.annotations.NotNull()
    java.lang.String playerId, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.Map<java.lang.String, java.lang.Object>>> $completion);
    
    @retrofit2.http.GET(value = "ranking")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getRanking(@retrofit2.http.Query(value = "type")
    @org.jetbrains.annotations.NotNull()
    java.lang.String type, @retrofit2.http.Query(value = "limit")
    int limit, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.RankingResponse>> $completion);
    
    @retrofit2.http.GET(value = "ranking/me")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getMyRank(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xnova.game.data.model.MyRankResponse>> $completion);
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 3, xi = 48)
    public static final class DefaultImpls {
    }
}