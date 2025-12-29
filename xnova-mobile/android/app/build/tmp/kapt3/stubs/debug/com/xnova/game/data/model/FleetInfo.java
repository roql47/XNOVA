package com.xnova.game.data.model;

import com.google.gson.annotations.SerializedName;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00008\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010 \n\u0002\b\u001e\b\u0086\b\u0018\u00002\u00020\u0001BK\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\u0006\u0010\u0007\u001a\u00020\b\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u0006\u0010\u000b\u001a\u00020\f\u0012\u0006\u0010\r\u001a\u00020\u000e\u0012\f\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u00030\u0010\u00a2\u0006\u0002\u0010\u0011J\t\u0010!\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\"\u001a\u00020\u0003H\u00c6\u0003J\t\u0010#\u001a\u00020\u0006H\u00c6\u0003J\t\u0010$\u001a\u00020\bH\u00c6\u0003J\t\u0010%\u001a\u00020\nH\u00c6\u0003J\t\u0010&\u001a\u00020\fH\u00c6\u0003J\t\u0010\'\u001a\u00020\u000eH\u00c6\u0003J\u000f\u0010(\u001a\b\u0012\u0004\u0012\u00020\u00030\u0010H\u00c6\u0003J_\u0010)\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\b2\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\f2\b\b\u0002\u0010\r\u001a\u00020\u000e2\u000e\b\u0002\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u00030\u0010H\u00c6\u0001J\u0013\u0010*\u001a\u00020\u000e2\b\u0010+\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010,\u001a\u00020\u0006H\u00d6\u0001J\t\u0010-\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u000b\u001a\u00020\f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u0013R\u0011\u0010\u0007\u001a\u00020\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\u0015R\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0017\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u00030\u0010\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0011\u0010\r\u001a\u00020\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001dR\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u001fR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b \u0010\u001b\u00a8\u0006."}, d2 = {"Lcom/xnova/game/data/model/FleetInfo;", "", "type", "", "name", "count", "", "cost", "Lcom/xnova/game/data/model/Cost;", "stats", "Lcom/xnova/game/data/model/FleetStats;", "buildTime", "", "requirementsMet", "", "missingRequirements", "", "(Ljava/lang/String;Ljava/lang/String;ILcom/xnova/game/data/model/Cost;Lcom/xnova/game/data/model/FleetStats;DZLjava/util/List;)V", "getBuildTime", "()D", "getCost", "()Lcom/xnova/game/data/model/Cost;", "getCount", "()I", "getMissingRequirements", "()Ljava/util/List;", "getName", "()Ljava/lang/String;", "getRequirementsMet", "()Z", "getStats", "()Lcom/xnova/game/data/model/FleetStats;", "getType", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "copy", "equals", "other", "hashCode", "toString", "app_debug"})
public final class FleetInfo {
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String type = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String name = null;
    private final int count = 0;
    @org.jetbrains.annotations.NotNull()
    private final com.xnova.game.data.model.Cost cost = null;
    @org.jetbrains.annotations.NotNull()
    private final com.xnova.game.data.model.FleetStats stats = null;
    private final double buildTime = 0.0;
    private final boolean requirementsMet = false;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<java.lang.String> missingRequirements = null;
    
    public FleetInfo(@org.jetbrains.annotations.NotNull()
    java.lang.String type, @org.jetbrains.annotations.NotNull()
    java.lang.String name, int count, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.Cost cost, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.FleetStats stats, double buildTime, boolean requirementsMet, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> missingRequirements) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getType() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getName() {
        return null;
    }
    
    public final int getCount() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.Cost getCost() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.FleetStats getStats() {
        return null;
    }
    
    public final double getBuildTime() {
        return 0.0;
    }
    
    public final boolean getRequirementsMet() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<java.lang.String> getMissingRequirements() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component1() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component2() {
        return null;
    }
    
    public final int component3() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.Cost component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.FleetStats component5() {
        return null;
    }
    
    public final double component6() {
        return 0.0;
    }
    
    public final boolean component7() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<java.lang.String> component8() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.xnova.game.data.model.FleetInfo copy(@org.jetbrains.annotations.NotNull()
    java.lang.String type, @org.jetbrains.annotations.NotNull()
    java.lang.String name, int count, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.Cost cost, @org.jetbrains.annotations.NotNull()
    com.xnova.game.data.model.FleetStats stats, double buildTime, boolean requirementsMet, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> missingRequirements) {
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