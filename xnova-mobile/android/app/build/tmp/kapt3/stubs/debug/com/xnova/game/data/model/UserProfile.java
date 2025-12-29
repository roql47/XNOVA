package com.xnova.game.data.model;

import com.google.gson.annotations.SerializedName;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00004\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010$\n\u0002\u0010\b\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b0\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0086\b\u0018\u00002\u00020\u0001B\u00d7\u0001\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0003\u0012\u0006\u0010\u0006\u001a\u00020\u0003\u0012\u0006\u0010\u0007\u001a\u00020\b\u0012\u0012\u0010\t\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u0012\u0012\u0010\f\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u0012\u0012\u0010\r\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u0012\u0012\u0010\u000e\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u0012\u0012\u0010\u000f\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u0012\b\u0010\u0010\u001a\u0004\u0018\u00010\u0011\u0012\b\u0010\u0012\u001a\u0004\u0018\u00010\u0011\u0012\b\u0010\u0013\u001a\u0004\u0018\u00010\u0011\u0012\b\u0010\u0014\u001a\u0004\u0018\u00010\u0011\u0012\b\u0010\u0015\u001a\u0004\u0018\u00010\u0001\u0012\b\u0010\u0016\u001a\u0004\u0018\u00010\u0001\u0012\b\u0010\u0017\u001a\u0004\u0018\u00010\u0001\u00a2\u0006\u0002\u0010\u0018J\t\u0010/\u001a\u00020\u0003H\u00c6\u0003J\u0015\u00100\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\nH\u00c6\u0003J\u000b\u00101\u001a\u0004\u0018\u00010\u0011H\u00c6\u0003J\u000b\u00102\u001a\u0004\u0018\u00010\u0011H\u00c6\u0003J\u000b\u00103\u001a\u0004\u0018\u00010\u0011H\u00c6\u0003J\u000b\u00104\u001a\u0004\u0018\u00010\u0011H\u00c6\u0003J\u000b\u00105\u001a\u0004\u0018\u00010\u0001H\u00c6\u0003J\u000b\u00106\u001a\u0004\u0018\u00010\u0001H\u00c6\u0003J\u000b\u00107\u001a\u0004\u0018\u00010\u0001H\u00c6\u0003J\t\u00108\u001a\u00020\u0003H\u00c6\u0003J\t\u00109\u001a\u00020\u0003H\u00c6\u0003J\t\u0010:\u001a\u00020\u0003H\u00c6\u0003J\t\u0010;\u001a\u00020\bH\u00c6\u0003J\u0015\u0010<\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\nH\u00c6\u0003J\u0015\u0010=\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\nH\u00c6\u0003J\u0015\u0010>\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\nH\u00c6\u0003J\u0015\u0010?\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\nH\u00c6\u0003J\u00fd\u0001\u0010@\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00032\b\b\u0002\u0010\u0006\u001a\u00020\u00032\b\b\u0002\u0010\u0007\u001a\u00020\b2\u0014\b\u0002\u0010\t\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n2\u0014\b\u0002\u0010\f\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n2\u0014\b\u0002\u0010\r\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n2\u0014\b\u0002\u0010\u000e\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n2\u0014\b\u0002\u0010\u000f\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n2\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u00112\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\u00112\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u00112\n\b\u0002\u0010\u0014\u001a\u0004\u0018\u00010\u00112\n\b\u0002\u0010\u0015\u001a\u0004\u0018\u00010\u00012\n\b\u0002\u0010\u0016\u001a\u0004\u0018\u00010\u00012\n\b\u0002\u0010\u0017\u001a\u0004\u0018\u00010\u0001H\u00c6\u0001J\u0013\u0010A\u001a\u00020B2\b\u0010C\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010D\u001a\u00020\u000bH\u00d6\u0001J\t\u0010E\u001a\u00020\u0003H\u00d6\u0001R\u0013\u0010\u0010\u001a\u0004\u0018\u00010\u0011\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u001aR\u0011\u0010\u0006\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u001cR\u001d\u0010\u000f\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u001eR\u0013\u0010\u0014\u001a\u0004\u0018\u00010\u0011\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001f\u0010\u001aR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b \u0010\u001cR\u001d\u0010\f\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u00a2\u0006\b\n\u0000\u001a\u0004\b!\u0010\u001eR\u001d\u0010\u000e\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\"\u0010\u001eR\u0013\u0010\u0013\u001a\u0004\u0018\u00010\u0011\u00a2\u0006\b\n\u0000\u001a\u0004\b#\u0010\u001aR\u0016\u0010\u0002\u001a\u00020\u00038\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b$\u0010\u001cR\u0013\u0010\u0017\u001a\u0004\u0018\u00010\u0001\u00a2\u0006\b\n\u0000\u001a\u0004\b%\u0010&R\u001d\u0010\t\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\'\u0010\u001eR\u0013\u0010\u0015\u001a\u0004\u0018\u00010\u0001\u00a2\u0006\b\n\u0000\u001a\u0004\b(\u0010&R\u0013\u0010\u0016\u001a\u0004\u0018\u00010\u0001\u00a2\u0006\b\n\u0000\u001a\u0004\b)\u0010&R\u0011\u0010\u0005\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b*\u0010\u001cR\u001d\u0010\r\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u000b0\n\u00a2\u0006\b\n\u0000\u001a\u0004\b+\u0010\u001eR\u0013\u0010\u0012\u001a\u0004\u0018\u00010\u0011\u00a2\u0006\b\n\u0000\u001a\u0004\b,\u0010\u001aR\u0011\u0010\u0007\u001a\u00020\b\u00a2\u0006\b\n\u0000\u001a\u0004\b-\u0010.\u00a8\u0006F"}, d2 = {"Lcom/xnova/game/data/model/UserProfile;", "", "id", "", "email", "playerName", "coordinate", "resources", "Lcom/xnova/game/data/model/Resources;", "mines", "", "", "facilities", "researchLevels", "fleet", "defense", "constructionProgress", "Lcom/xnova/game/data/model/ProgressInfo;", "researchProgress", "fleetProgress", "defenseProgress", "pendingAttack", "pendingReturn", "incomingAttack", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lcom/xnova/game/data/model/Resources;Ljava/util/Map;Ljava/util/Map;Ljava/util/Map;Ljava/util/Map;Ljava/util/Map;Lcom/xnova/game/data/model/ProgressInfo;Lcom/xnova/game/data/model/ProgressInfo;Lcom/xnova/game/data/model/ProgressInfo;Lcom/xnova/game/data/model/ProgressInfo;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;)V", "getConstructionProgress", "()Lcom/xnova/game/data/model/ProgressInfo;", "getCoordinate", "()Ljava/lang/String;", "getDefense", "()Ljava/util/Map;", "getDefenseProgress", "getEmail", "getFacilities", "getFleet", "getFleetProgress", "getId", "getIncomingAttack", "()Ljava/lang/Object;", "getMines", "getPendingAttack", "getPendingReturn", "getPlayerName", "getResearchLevels", "getResearchProgress", "getResources", "()Lcom/xnova/game/data/model/Resources;", "component1", "component10", "component11", "component12", "component13", "component14", "component15", "component16", "component17", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "", "other", "hashCode", "toString", "app_debug"})
public final class UserProfile {
    @com.google.gson.annotations.SerializedName(value = "_id")
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String id = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String email = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String playerName = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String coordinate = null;
    @org.jetbrains.annotations.NotNull()
    private final com.xnova.game.data.model.Resources resources = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Map<java.lang.String, java.lang.Integer> mines = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Map<java.lang.String, java.lang.Integer> facilities = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Map<java.lang.String, java.lang.Integer> researchLevels = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Map<java.lang.String, java.lang.Integer> fleet = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Map<java.lang.String, java.lang.Integer> defense = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo constructionProgress = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo researchProgress = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo fleetProgress = null;
    @org.jetbrains.annotations.Nullable()
    private final com.xnova.game.data.model.ProgressInfo defenseProgress = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.Object pendingAttack = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.Object pendingReturn = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.Object incomingAttack = null;
    
    public UserProfile(@org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    java.lang.String email, @org.jetbrains.annotations.NotNull()
    java.lang.String playerName, @org.jetbrains.annotations.NotNull()
    java.lang.String coordinate, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.Resources resources, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> mines, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> facilities, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> researchLevels, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> fleet, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> defense, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo constructionProgress, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo researchProgress, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo fleetProgress, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo defenseProgress, @org.jetbrains.annotations.Nullable()
    java.lang.Object pendingAttack, @org.jetbrains.annotations.Nullable()
    java.lang.Object pendingReturn, @org.jetbrains.annotations.Nullable()
    java.lang.Object incomingAttack) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getId() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getEmail() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getPlayerName() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getCoordinate() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.Resources getResources() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> getMines() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> getFacilities() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> getResearchLevels() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> getFleet() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> getDefense() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getConstructionProgress() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getResearchProgress() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getFleetProgress() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo getDefenseProgress() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getPendingAttack() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getPendingReturn() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getIncomingAttack() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component1() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> component10() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component11() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component12() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component13() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.xnova.game.data.model.ProgressInfo component14() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object component15() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object component16() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object component17() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component2() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component3() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.Resources component5() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> component6() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> component7() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> component8() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, java.lang.Integer> component9() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.UserProfile copy(@org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    java.lang.String email, @org.jetbrains.annotations.NotNull()
    java.lang.String playerName, @org.jetbrains.annotations.NotNull()
    java.lang.String coordinate, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.Resources resources, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> mines, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> facilities, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> researchLevels, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> fleet, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, java.lang.Integer> defense, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo constructionProgress, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo researchProgress, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo fleetProgress, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.ProgressInfo defenseProgress, @org.jetbrains.annotations.Nullable()
    java.lang.Object pendingAttack, @org.jetbrains.annotations.Nullable()
    java.lang.Object pendingReturn, @org.jetbrains.annotations.Nullable()
    java.lang.Object incomingAttack) {
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