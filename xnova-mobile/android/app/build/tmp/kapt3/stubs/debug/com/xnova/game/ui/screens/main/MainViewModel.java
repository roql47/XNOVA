package com.xnova.game.ui.screens.main;

import androidx.lifecycle.ViewModel;
import com.xnova.game.data.local.TokenManager;
import com.xnova.game.data.model.*;
import com.xnova.game.data.repository.GameRepository;
import com.xnova.game.data.repository.Result;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.StateFlow;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000X\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010$\n\u0002\u0010\b\n\u0002\b\u0006\n\u0002\u0010\t\n\u0002\b\u001b\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\"\u0010\u0015\u001a\u00020\u00162\u0006\u0010\u0017\u001a\u00020\u00182\u0012\u0010\u0019\u001a\u000e\u0012\u0004\u0012\u00020\u0018\u0012\u0004\u0012\u00020\u001b0\u001aJ\u0016\u0010\u001c\u001a\u00020\u00162\u0006\u0010\u001d\u001a\u00020\u00182\u0006\u0010\u001e\u001a\u00020\u001bJ\u0016\u0010\u001f\u001a\u00020\u00162\u0006\u0010 \u001a\u00020\u00182\u0006\u0010\u001e\u001a\u00020\u001bJ\u0018\u0010!\u001a\u00020\"2\u0006\u0010#\u001a\u00020\u00182\u0006\u0010$\u001a\u00020\"H\u0002J\u0006\u0010%\u001a\u00020\u0016J\u0006\u0010&\u001a\u00020\u0016J\u0006\u0010\'\u001a\u00020\u0016J\u0006\u0010(\u001a\u00020\u0016J\u0006\u0010)\u001a\u00020\u0016J\u0006\u0010*\u001a\u00020\u0016J\u0006\u0010+\u001a\u00020\u0016J\u0006\u0010,\u001a\u00020\u0016J\u0006\u0010-\u001a\u00020\u0016J\u0006\u0010.\u001a\u00020\u0016J\u0006\u0010/\u001a\u00020\u0016J\u0006\u00100\u001a\u00020\u0016J\u0016\u00101\u001a\u00020\u00162\u0006\u00102\u001a\u00020\u001b2\u0006\u00103\u001a\u00020\u001bJ\u0006\u00104\u001a\u00020\u0016J\u0006\u00105\u001a\u00020\u0016J\b\u00106\u001a\u00020\u0016H\u0002J\u000e\u00107\u001a\u00020\u00162\u0006\u00108\u001a\u00020\u0018J\b\u00109\u001a\u00020\u0016H\u0002J\b\u0010:\u001a\u00020\u0016H\u0002J\u000e\u0010;\u001a\u00020\u00162\u0006\u0010<\u001a\u00020\u0018R\u0014\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000f\u001a\u0004\u0018\u00010\u0010X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\t0\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014\u00a8\u0006="}, d2 = {"Lcom/xnova/game/ui/screens/main/MainViewModel;", "Landroidx/lifecycle/ViewModel;", "gameRepository", "Lcom/xnova/game/data/repository/GameRepository;", "tokenManager", "Lcom/xnova/game/data/local/TokenManager;", "(Lcom/xnova/game/data/repository/GameRepository;Lcom/xnova/game/data/local/TokenManager;)V", "_uiState", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/xnova/game/ui/screens/main/MainUiState;", "isCompletingConstruction", "", "isCompletingDefense", "isCompletingFleet", "isCompletingResearch", "timerJob", "Lkotlinx/coroutines/Job;", "uiState", "Lkotlinx/coroutines/flow/StateFlow;", "getUiState", "()Lkotlinx/coroutines/flow/StateFlow;", "attack", "", "targetCoord", "", "fleet", "", "", "buildDefense", "defenseType", "quantity", "buildFleet", "fleetType", "calculateRemainingSeconds", "", "finishTimeStr", "nowMillis", "cancelBuilding", "cancelResearch", "clearError", "completeBuilding", "completeDefense", "completeFleet", "completeResearch", "loadBattleStatus", "loadBuildings", "loadData", "loadDefense", "loadFleet", "loadGalaxy", "galaxy", "system", "loadResearch", "loadResources", "loadUserInfo", "startResearch", "researchType", "startTimerLoop", "updateRemainingTimes", "upgradeBuilding", "buildingType", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class MainViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.xnova.game.data.repository.GameRepository gameRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.xnova.game.data.local.TokenManager tokenManager = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.xnova.game.ui.screens.main.MainUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.xnova.game.ui.screens.main.MainUiState> uiState = null;
    @org.jetbrains.annotations.Nullable()
    private kotlinx.coroutines.Job timerJob;
    private boolean isCompletingConstruction = false;
    private boolean isCompletingResearch = false;
    private boolean isCompletingFleet = false;
    private boolean isCompletingDefense = false;
    
    @javax.inject.Inject()
    public MainViewModel(@org.jetbrains.annotations.NotNull()
    com.xnova.game.data.repository.GameRepository gameRepository, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.local.TokenManager tokenManager) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.xnova.game.ui.screens.main.MainUiState> getUiState() {
        return null;
    }
    
    private final void startTimerLoop() {
    }
    
    private final void updateRemainingTimes() {
    }
    
    private final long calculateRemainingSeconds(java.lang.String finishTimeStr, long nowMillis) {
        return 0L;
    }
    
    private final void loadUserInfo() {
    }
    
    public final void loadData() {
    }
    
    public final void loadResources() {
    }
    
    public final void loadBuildings() {
    }
    
    public final void loadResearch() {
    }
    
    public final void loadFleet() {
    }
    
    public final void loadDefense() {
    }
    
    public final void loadBattleStatus() {
    }
    
    public final void loadGalaxy(int galaxy, int system) {
    }
    
    public final void upgradeBuilding(@org.jetbrains.annotations.NotNull()
    java.lang.String buildingType) {
    }
    
    public final void completeBuilding() {
    }
    
    public final void cancelBuilding() {
    }
    
    public final void completeResearch() {
    }
    
    public final void cancelResearch() {
    }
    
    public final void completeFleet() {
    }
    
    public final void completeDefense() {
    }
    
    public final void startResearch(@org.jetbrains.annotations.NotNull()
    java.lang.String researchType) {
    }
    
    public final void buildFleet(@org.jetbrains.annotations.NotNull()
    java.lang.String fleetType, int quantity) {
    }
    
    public final void buildDefense(@org.jetbrains.annotations.NotNull()
    java.lang.String defenseType, int quantity) {
    }
    
    public final void attack(@org.jetbrains.annotations.NotNull()
    java.lang.String targetCoord, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> fleet) {
    }
    
    public final void clearError() {
    }
}