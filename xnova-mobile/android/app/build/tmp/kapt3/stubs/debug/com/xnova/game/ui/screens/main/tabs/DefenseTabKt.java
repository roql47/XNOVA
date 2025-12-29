package com.xnova.game.ui.screens.main.tabs;

import androidx.compose.foundation.layout.*;
import androidx.compose.foundation.text.KeyboardOptions;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.text.font.FontWeight;
import androidx.compose.ui.text.input.KeyboardType;
import com.xnova.game.data.model.DefenseInfo;
import com.xnova.game.ui.screens.main.MainViewModel;
import com.xnova.game.ui.theme.*;
import java.text.NumberFormat;
import java.util.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000<\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\b\n\u0002\b\u0010\u001a\u0010\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u0003H\u0007\u001a*\u0010\u0004\u001a\u00020\u00012\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\nH\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u000b\u0010\f\u001a,\u0010\r\u001a\u00020\u00012\u0006\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u00112\u0012\u0010\u0012\u001a\u000e\u0012\u0004\u0012\u00020\u0014\u0012\u0004\u0012\u00020\u00010\u0013H\u0003\u001a:\u0010\u0015\u001a\u00020\u00012\u0006\u0010\u0016\u001a\u00020\u00062\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0017\u001a\u00020\u00062\u0006\u0010\u0018\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\nH\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u0019\u0010\u001a\u001a \u0010\u001b\u001a\u00020\u00012\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u001c\u001a\u00020\u00062\u0006\u0010\u001d\u001a\u00020\u0006H\u0003\u001a\u0010\u0010\u001e\u001a\u00020\u00062\u0006\u0010\u001f\u001a\u00020\bH\u0002\u001a\u0010\u0010 \u001a\u00020\u00062\u0006\u0010!\u001a\u00020\bH\u0002\u001a\u0010\u0010\"\u001a\u00020\u00062\u0006\u0010#\u001a\u00020\u0006H\u0002\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006$"}, d2 = {"DefenseTab", "", "viewModel", "Lcom/xnova/game/ui/screens/main/MainViewModel;", "OGameCostItem", "icon", "", "amount", "", "color", "Landroidx/compose/ui/graphics/Color;", "OGameCostItem-mxwnekA", "(Ljava/lang/String;JJ)V", "OGameDefenseCard", "defense", "Lcom/xnova/game/data/model/DefenseInfo;", "isBuilding", "", "onBuild", "Lkotlin/Function1;", "", "OGameProgressPanel", "title", "name", "remainingSeconds", "OGameProgressPanel-xwkQ0AY", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JJ)V", "OGameStatItem", "label", "value", "formatNumber", "num", "formatTime", "seconds", "getDefenseIcon", "type", "app_debug"})
public final class DefenseTabKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void DefenseTab(@org.jetbrains.annotations.NotNull()
    com.xnova.game.ui.screens.main.MainViewModel viewModel) {
    }
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    private static final void OGameDefenseCard(com.xnova.game.data.model.DefenseInfo defense, boolean isBuilding, kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onBuild) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameStatItem(java.lang.String icon, java.lang.String label, java.lang.String value) {
    }
    
    private static final java.lang.String getDefenseIcon(java.lang.String type) {
        return null;
    }
    
    private static final java.lang.String formatNumber(long num) {
        return null;
    }
    
    private static final java.lang.String formatTime(long seconds) {
        return null;
    }
}