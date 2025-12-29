package com.xnova.game.data.repository;

import com.xnova.game.data.model.*;
import com.xnova.game.data.remote.ApiService;
import javax.inject.Inject;
import javax.inject.Singleton;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000r\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010$\n\u0002\u0010\b\n\u0002\b\u000f\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J0\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\u0006\u0010\b\u001a\u00020\t2\u0012\u0010\n\u001a\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\f0\u000bH\u0086@\u00a2\u0006\u0002\u0010\rJ0\u0010\u000e\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u00062\u0006\u0010\u000f\u001a\u00020\t2\u0006\u0010\u0010\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\u0011J0\u0010\u0012\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u00062\u0006\u0010\u0013\u001a\u00020\t2\u0006\u0010\u0010\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\u0011J \u0010\u0014\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J \u0010\u0016\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J \u0010\u0017\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J \u0010\u0018\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J \u0010\u0019\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J \u0010\u001a\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J\u0014\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u001c0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J\u0014\u0010\u001d\u001a\b\u0012\u0004\u0012\u00020\u001e0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J\u0014\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020 0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J\u0014\u0010!\u001a\b\u0012\u0004\u0012\u00020\"0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J$\u0010#\u001a\b\u0012\u0004\u0012\u00020$0\u00062\u0006\u0010%\u001a\u00020\f2\u0006\u0010&\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\'J\u0014\u0010(\u001a\b\u0012\u0004\u0012\u00020)0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J(\u0010*\u001a\b\u0012\u0004\u0012\u00020+0\u00062\b\b\u0002\u0010,\u001a\u00020\t2\b\b\u0002\u0010-\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\u0011J\u0014\u0010.\u001a\b\u0012\u0004\u0012\u00020/0\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J\u0014\u00100\u001a\b\u0012\u0004\u0012\u0002010\u0006H\u0086@\u00a2\u0006\u0002\u0010\u0015J(\u00102\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u000b0\u00062\u0006\u00103\u001a\u00020\tH\u0086@\u00a2\u0006\u0002\u00104J\u001c\u00105\u001a\b\u0012\u0004\u0012\u0002060\u00062\u0006\u00107\u001a\u00020\tH\u0086@\u00a2\u0006\u0002\u00104R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u00068"}, d2 = {"Lcom/xnova/game/data/repository/GameRepository;", "", "apiService", "Lcom/xnova/game/data/remote/ApiService;", "(Lcom/xnova/game/data/remote/ApiService;)V", "attack", "Lcom/xnova/game/data/repository/Result;", "Lcom/xnova/game/data/model/AttackResponse;", "targetCoord", "", "fleet", "", "", "(Ljava/lang/String;Ljava/util/Map;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "buildDefense", "defenseType", "quantity", "(Ljava/lang/String;ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "buildFleet", "fleetType", "cancelBuilding", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "cancelResearch", "completeBuilding", "completeDefense", "completeFleet", "completeResearch", "getBattleStatus", "Lcom/xnova/game/data/model/BattleStatus;", "getBuildings", "Lcom/xnova/game/data/model/BuildingsResponse;", "getDefense", "Lcom/xnova/game/data/model/DefenseResponse;", "getFleet", "Lcom/xnova/game/data/model/FleetResponse;", "getGalaxyMap", "Lcom/xnova/game/data/model/GalaxyResponse;", "galaxy", "system", "(IILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getMyRank", "Lcom/xnova/game/data/model/MyRankResponse;", "getRanking", "Lcom/xnova/game/data/model/RankingResponse;", "type", "limit", "getResearch", "Lcom/xnova/game/data/model/ResearchResponse;", "getResources", "Lcom/xnova/game/data/model/ResourcesResponse;", "startResearch", "researchType", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "upgradeBuilding", "Lcom/xnova/game/data/model/UpgradeResponse;", "buildingType", "app_debug"})
public final class GameRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.xnova.game.data.remote.ApiService apiService = null;
    
    @javax.inject.Inject()
    public GameRepository(@org.jetbrains.annotations.NotNull()
    com.xnova.game.data.remote.ApiService apiService) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getResources(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.ResourcesResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getBuildings(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.BuildingsResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object upgradeBuilding(@org.jetbrains.annotations.NotNull()
    java.lang.String buildingType, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.UpgradeResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object completeBuilding(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object cancelBuilding(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getResearch(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.ResearchResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object startResearch(@org.jetbrains.annotations.NotNull()
    java.lang.String researchType, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object completeResearch(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object cancelResearch(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getFleet(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.FleetResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object buildFleet(@org.jetbrains.annotations.NotNull()
    java.lang.String fleetType, int quantity, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object completeFleet(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getDefense(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.DefenseResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object buildDefense(@org.jetbrains.annotations.NotNull()
    java.lang.String defenseType, int quantity, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object completeDefense(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getGalaxyMap(int galaxy, int system, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.GalaxyResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object attack(@org.jetbrains.annotations.NotNull()
    java.lang.String targetCoord, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> fleet, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.AttackResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getBattleStatus(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.BattleStatus>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getRanking(@org.jetbrains.annotations.NotNull()
    java.lang.String type, int limit, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.RankingResponse>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getMyRank(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.xnova.game.data.repository.Result<com.xnova.game.data.model.MyRankResponse>> $completion) {
        return null;
    }
}