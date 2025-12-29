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

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000h\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b?\b\u0086\b\u0018\u00002\u00020\u0001B\u00a7\u0002\u0012\b\b\u0002\u0010\u0002\u001a\u00020\u0003\u0012\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u0005\u0012\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u0012\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\t\u0012\n\b\u0002\u0010\n\u001a\u0004\u0018\u00010\u000b\u0012\b\b\u0002\u0010\f\u001a\u00020\r\u0012\u000e\b\u0002\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f\u0012\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\u0012\u0012\b\b\u0002\u0010\u0013\u001a\u00020\u0014\u0012\u000e\b\u0002\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00160\u000f\u0012\n\b\u0002\u0010\u0017\u001a\u0004\u0018\u00010\u0012\u0012\b\b\u0002\u0010\u0018\u001a\u00020\u0014\u0012\b\b\u0002\u0010\u0019\u001a\u00020\r\u0012\u000e\b\u0002\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u001b0\u000f\u0012\n\b\u0002\u0010\u001c\u001a\u0004\u0018\u00010\u0012\u0012\b\b\u0002\u0010\u001d\u001a\u00020\u0014\u0012\u000e\b\u0002\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\u001f0\u000f\u0012\n\b\u0002\u0010 \u001a\u0004\u0018\u00010\u0012\u0012\b\b\u0002\u0010!\u001a\u00020\u0014\u0012\u000e\b\u0002\u0010\"\u001a\b\u0012\u0004\u0012\u00020#0\u000f\u0012\b\b\u0002\u0010$\u001a\u00020\r\u0012\b\b\u0002\u0010%\u001a\u00020\r\u0012\n\b\u0002\u0010&\u001a\u0004\u0018\u00010\'\u00a2\u0006\u0002\u0010(J\t\u0010I\u001a\u00020\u0003H\u00c6\u0003J\t\u0010J\u001a\u00020\u0014H\u00c6\u0003J\u000f\u0010K\u001a\b\u0012\u0004\u0012\u00020\u00160\u000fH\u00c6\u0003J\u000b\u0010L\u001a\u0004\u0018\u00010\u0012H\u00c6\u0003J\t\u0010M\u001a\u00020\u0014H\u00c6\u0003J\t\u0010N\u001a\u00020\rH\u00c6\u0003J\u000f\u0010O\u001a\b\u0012\u0004\u0012\u00020\u001b0\u000fH\u00c6\u0003J\u000b\u0010P\u001a\u0004\u0018\u00010\u0012H\u00c6\u0003J\t\u0010Q\u001a\u00020\u0014H\u00c6\u0003J\u000f\u0010R\u001a\b\u0012\u0004\u0012\u00020\u001f0\u000fH\u00c6\u0003J\u000b\u0010S\u001a\u0004\u0018\u00010\u0012H\u00c6\u0003J\u000b\u0010T\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\t\u0010U\u001a\u00020\u0014H\u00c6\u0003J\u000f\u0010V\u001a\b\u0012\u0004\u0012\u00020#0\u000fH\u00c6\u0003J\t\u0010W\u001a\u00020\rH\u00c6\u0003J\t\u0010X\u001a\u00020\rH\u00c6\u0003J\u000b\u0010Y\u001a\u0004\u0018\u00010\'H\u00c6\u0003J\u000b\u0010Z\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\u000b\u0010[\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\u000b\u0010\\\u001a\u0004\u0018\u00010\tH\u00c6\u0003J\u000b\u0010]\u001a\u0004\u0018\u00010\u000bH\u00c6\u0003J\t\u0010^\u001a\u00020\rH\u00c6\u0003J\u000f\u0010_\u001a\b\u0012\u0004\u0012\u00020\u00100\u000fH\u00c6\u0003J\u000b\u0010`\u001a\u0004\u0018\u00010\u0012H\u00c6\u0003J\u00ab\u0002\u0010a\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u00052\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u00052\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00052\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\t2\n\b\u0002\u0010\n\u001a\u0004\u0018\u00010\u000b2\b\b\u0002\u0010\f\u001a\u00020\r2\u000e\b\u0002\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\u00122\b\b\u0002\u0010\u0013\u001a\u00020\u00142\u000e\b\u0002\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00160\u000f2\n\b\u0002\u0010\u0017\u001a\u0004\u0018\u00010\u00122\b\b\u0002\u0010\u0018\u001a\u00020\u00142\b\b\u0002\u0010\u0019\u001a\u00020\r2\u000e\b\u0002\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u001b0\u000f2\n\b\u0002\u0010\u001c\u001a\u0004\u0018\u00010\u00122\b\b\u0002\u0010\u001d\u001a\u00020\u00142\u000e\b\u0002\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\u001f0\u000f2\n\b\u0002\u0010 \u001a\u0004\u0018\u00010\u00122\b\b\u0002\u0010!\u001a\u00020\u00142\u000e\b\u0002\u0010\"\u001a\b\u0012\u0004\u0012\u00020#0\u000f2\b\b\u0002\u0010$\u001a\u00020\r2\b\b\u0002\u0010%\u001a\u00020\r2\n\b\u0002\u0010&\u001a\u0004\u0018\u00010\'H\u00c6\u0001J\u0013\u0010b\u001a\u00020\u00032\b\u0010c\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010d\u001a\u00020\rH\u00d6\u0001J\t\u0010e\u001a\u00020\u0005H\u00d6\u0001R\u0013\u0010&\u001a\u0004\u0018\u00010\'\u00a2\u0006\b\n\u0000\u001a\u0004\b)\u0010*R\u0017\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b+\u0010,R\u0013\u0010\u0011\u001a\u0004\u0018\u00010\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b-\u0010.R\u0011\u0010\u0013\u001a\u00020\u0014\u00a2\u0006\b\n\u0000\u001a\u0004\b/\u00100R\u0013\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b1\u00102R\u0011\u0010$\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b3\u00104R\u0011\u0010%\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b5\u00104R\u0017\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\u001f0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b6\u0010,R\u0013\u0010 \u001a\u0004\u0018\u00010\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b7\u0010.R\u0011\u0010!\u001a\u00020\u0014\u00a2\u0006\b\n\u0000\u001a\u0004\b8\u00100R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b9\u00104R\u0013\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b:\u00102R\u0017\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u001b0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b;\u0010,R\u0013\u0010\u001c\u001a\u0004\u0018\u00010\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b<\u0010.R\u0011\u0010\u001d\u001a\u00020\u0014\u00a2\u0006\b\n\u0000\u001a\u0004\b=\u00100R\u0017\u0010\"\u001a\b\u0012\u0004\u0012\u00020#0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b>\u0010,R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0002\u0010?R\u0011\u0010\u0019\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b@\u00104R\u0013\u0010\u0006\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\bA\u00102R\u0013\u0010\n\u001a\u0004\u0018\u00010\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\bB\u0010CR\u0017\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00160\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\bD\u0010,R\u0013\u0010\u0017\u001a\u0004\u0018\u00010\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\bE\u0010.R\u0011\u0010\u0018\u001a\u00020\u0014\u00a2\u0006\b\n\u0000\u001a\u0004\bF\u00100R\u0013\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\bG\u0010H\u00a8\u0006f"}, d2 = {"Lcom/xnova/game/ui/screens/main/MainUiState;", "", "isLoading", "", "error", "", "playerName", "coordinate", "resources", "Lcom/xnova/game/data/model/Resources;", "production", "Lcom/xnova/game/data/model/Production;", "energyRatio", "", "buildings", "", "Lcom/xnova/game/data/model/BuildingInfo;", "constructionProgress", "Lcom/xnova/game/data/model/ProgressInfo;", "constructionRemainingSeconds", "", "research", "Lcom/xnova/game/data/model/ResearchInfo;", "researchProgress", "researchRemainingSeconds", "labLevel", "fleet", "Lcom/xnova/game/data/model/FleetInfo;", "fleetProgress", "fleetRemainingSeconds", "defense", "Lcom/xnova/game/data/model/DefenseInfo;", "defenseProgress", "defenseRemainingSeconds", "galaxyPlanets", "Lcom/xnova/game/data/model/PlanetInfo;", "currentGalaxy", "currentSystem", "battleStatus", "Lcom/xnova/game/data/model/BattleStatus;", "(ZLjava/lang/String;Ljava/lang/String;Ljava/lang/String;Lcom/xnova/game/data/model/Resources;Lcom/xnova/game/data/model/Production;ILjava/util/List;Lcom/xnova/game/data/model/ProgressInfo;JLjava/util/List;Lcom/xnova/game/data/model/ProgressInfo;JILjava/util/List;Lcom/xnova/game/data/model/ProgressInfo;JLjava/util/List;Lcom/xnova/game/data/model/ProgressInfo;JLjava/util/List;IILcom/xnova/game/data/model/BattleStatus;)V", "getBattleStatus", "()Lcom/xnova/game/data/model/BattleStatus;", "getBuildings", "()Ljava/util/List;", "getConstructionProgress", "()Lcom/xnova/game/data/model/ProgressInfo;", "getConstructionRemainingSeconds", "()J", "getCoordinate", "()Ljava/lang/String;", "getCurrentGalaxy", "()I", "getCurrentSystem", "getDefense", "getDefenseProgress", "getDefenseRemainingSeconds", "getEnergyRatio", "getError", "getFleet", "getFleetProgress", "getFleetRemainingSeconds", "getGalaxyPlanets", "()Z", "getLabLevel", "getPlayerName", "getProduction", "()Lcom/xnova/game/data/model/Production;", "getResearch", "getResearchProgress", "getResearchRemainingSeconds", "getResources", "()Lcom/xnova/game/data/model/Resources;", "component1", "component10", "component11", "component12", "component13", "component14", "component15", "component16", "component17", "component18", "component19", "component2", "component20", "component21", "component22", "component23", "component24", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "other", "hashCode", "toString", "app_debug"})
public final class MainUiState {
    private final boolean isLoading = false;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String error = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String playerName = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String coordinate = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.Resources resources = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.Production production = null;
    private final int energyRatio = 0;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.xnova.game.data.model.BuildingInfo> buildings = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo constructionProgress = null;
    private final long constructionRemainingSeconds = 0L;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.xnova.game.data.model.ResearchInfo> research = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo researchProgress = null;
    private final long researchRemainingSeconds = 0L;
    private final int labLevel = 0;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.xnova.game.data.model.FleetInfo> fleet = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo fleetProgress = null;
    private final long fleetRemainingSeconds = 0L;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.xnova.game.data.model.DefenseInfo> defense = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo defenseProgress = null;
    private final long defenseRemainingSeconds = 0L;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.xnova.game.data.model.PlanetInfo> galaxyPlanets = null;
    private final int currentGalaxy = 0;
    private final int currentSystem = 0;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.BattleStatus battleStatus = null;
    
    public MainUiState(boolean isLoading, @org.jetbrains.annotations.Nullable()
    java.lang.String error, @org.jetbrains.annotations.Nullable()
    java.lang.String playerName, @org.jetbrains.annotations.Nullable()
    java.lang.String coordinate, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.Resources resources, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.Production production, int energyRatio, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.BuildingInfo> buildings, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo constructionProgress, long constructionRemainingSeconds, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.ResearchInfo> research, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo researchProgress, long researchRemainingSeconds, int labLevel, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.FleetInfo> fleet, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo fleetProgress, long fleetRemainingSeconds, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.DefenseInfo> defense, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo defenseProgress, long defenseRemainingSeconds, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.PlanetInfo> galaxyPlanets, int currentGalaxy, int currentSystem, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.BattleStatus battleStatus) {
        super();
    }
    
    public final boolean isLoading() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getError() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getPlayerName() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getCoordinate() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.Resources getResources() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.Production getProduction() {
        return null;
    }
    
    public final int getEnergyRatio() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.BuildingInfo> getBuildings() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getConstructionProgress() {
        return null;
    }
    
    public final long getConstructionRemainingSeconds() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.ResearchInfo> getResearch() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getResearchProgress() {
        return null;
    }
    
    public final long getResearchRemainingSeconds() {
        return 0L;
    }
    
    public final int getLabLevel() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.FleetInfo> getFleet() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getFleetProgress() {
        return null;
    }
    
    public final long getFleetRemainingSeconds() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.DefenseInfo> getDefense() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getDefenseProgress() {
        return null;
    }
    
    public final long getDefenseRemainingSeconds() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.PlanetInfo> getGalaxyPlanets() {
        return null;
    }
    
    public final int getCurrentGalaxy() {
        return 0;
    }
    
    public final int getCurrentSystem() {
        return 0;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.BattleStatus getBattleStatus() {
        return null;
    }
    
    public MainUiState() {
        super();
    }
    
    public final boolean component1() {
        return false;
    }
    
    public final long component10() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.ResearchInfo> component11() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component12() {
        return null;
    }
    
    public final long component13() {
        return 0L;
    }
    
    public final int component14() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.FleetInfo> component15() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component16() {
        return null;
    }
    
    public final long component17() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.DefenseInfo> component18() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component19() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component2() {
        return null;
    }
    
    public final long component20() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.PlanetInfo> component21() {
        return null;
    }
    
    public final int component22() {
        return 0;
    }
    
    public final int component23() {
        return 0;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.BattleStatus component24() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component3() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component4() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.Resources component5() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.Production component6() {
        return null;
    }
    
    public final int component7() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.xnova.game.data.model.BuildingInfo> component8() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component9() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.ui.screens.main.MainUiState copy(boolean isLoading, @org.jetbrains.annotations.Nullable()
    java.lang.String error, @org.jetbrains.annotations.Nullable()
    java.lang.String playerName, @org.jetbrains.annotations.Nullable()
    java.lang.String coordinate, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.Resources resources, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.Production production, int energyRatio, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.BuildingInfo> buildings, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo constructionProgress, long constructionRemainingSeconds, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.ResearchInfo> research, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo researchProgress, long researchRemainingSeconds, int labLevel, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.FleetInfo> fleet, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo fleetProgress, long fleetRemainingSeconds, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.DefenseInfo> defense, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo defenseProgress, long defenseRemainingSeconds, @org.jetbrains.annotations.NotNull()
    java.util.List<com.xnova.game.data.model.PlanetInfo> galaxyPlanets, int currentGalaxy, int currentSystem, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.BattleStatus battleStatus) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
}