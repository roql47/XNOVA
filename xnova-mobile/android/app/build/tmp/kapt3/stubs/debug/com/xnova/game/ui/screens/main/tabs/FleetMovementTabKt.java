package com.xnova.game.ui.screens.main.tabs;

import androidx.compose.foundation.layout.*;
import androidx.compose.foundation.text.KeyboardOptions;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.text.font.FontWeight;
import androidx.compose.ui.text.input.KeyboardType;
import com.xnova.game.ui.screens.main.MainViewModel;
import com.xnova.game.ui.theme.*;
import java.text.NumberFormat;
import java.util.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000B\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\u001aB\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00032\u0006\u0010\u0005\u001a\u00020\u00032\u0006\u0010\u0006\u001a\u00020\u00032\u0006\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\nH\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u000b\u0010\f\u001a\u0010\u0010\r\u001a\u00020\u00012\u0006\u0010\u000e\u001a\u00020\u000fH\u0007\u001a<\u0010\u0010\u001a\u00020\u00012\u0006\u0010\u0011\u001a\u00020\u00032\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0012\u001a\u00020\b2\u0006\u0010\u0013\u001a\u00020\b2\u0012\u0010\u0014\u001a\u000e\u0012\u0004\u0012\u00020\b\u0012\u0004\u0012\u00020\u00010\u0015H\u0003\u001a\u001c\u0010\u0016\u001a\u00020\u00012\b\u0010\u0017\u001a\u0004\u0018\u00010\u00182\b\u0010\u0019\u001a\u0004\u0018\u00010\u0003H\u0003\u001a+\u0010\u001a\u001a\u00020\u00012\u0006\u0010\u001b\u001a\u00020\u00032\u0006\u0010\u0002\u001a\u00020\u00032\u0011\u0010\u001c\u001a\r\u0012\u0004\u0012\u00020\u00010\u001d\u00a2\u0006\u0002\b\u001eH\u0003\u001a\u0010\u0010\u001f\u001a\u00020\u00032\u0006\u0010 \u001a\u00020\bH\u0002\u001a\u0010\u0010!\u001a\u00020\u00032\u0006\u0010\"\u001a\u00020\u0003H\u0002\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006#"}, d2 = {"FleetActivityRow", "", "icon", "", "from", "to", "mission", "remainingTime", "", "color", "Landroidx/compose/ui/graphics/Color;", "FleetActivityRow-kKL39v8", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IJ)V", "FleetMovementTab", "viewModel", "Lcom/xnova/game/ui/screens/main/MainViewModel;", "FleetSelectItem", "name", "available", "selected", "onQuantityChange", "Lkotlin/Function1;", "OGameFleetActivityPanel", "battleStatus", "Lcom/xnova/game/data/model/BattleStatus;", "myCoordinate", "OGamePanel", "title", "content", "Lkotlin/Function0;", "Landroidx/compose/runtime/Composable;", "formatTime", "seconds", "getFleetIcon", "type", "app_debug"})
public final class FleetMovementTabKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void FleetMovementTab(@org.jetbrains.annotations.NotNull()
    com.xnova.game.ui.screens.main.MainViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameFleetActivityPanel(com.xnova.game.data.model.BattleStatus battleStatus, java.lang.String myCoordinate) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGamePanel(java.lang.String title, java.lang.String icon, kotlin.jvm.functions.Function0<kotlin.Unit> content) {
    }
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    private static final void FleetSelectItem(java.lang.String name, java.lang.String icon, int available, int selected, kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onQuantityChange) {
    }
    
    private static final java.lang.String getFleetIcon(java.lang.String type) {
        return null;
    }
    
    private static final java.lang.String formatTime(int seconds) {
        return null;
    }
}