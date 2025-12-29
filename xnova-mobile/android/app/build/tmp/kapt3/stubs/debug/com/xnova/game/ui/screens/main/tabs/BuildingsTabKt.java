package com.xnova.game.ui.screens.main.tabs;

import androidx.compose.foundation.layout.*;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.graphics.SolidColor;
import androidx.compose.ui.layout.ContentScale;
import androidx.compose.ui.text.font.FontWeight;
import coil.request.ImageRequest;
import com.xnova.game.R;
import com.xnova.game.data.model.BuildingInfo;
import com.xnova.game.ui.screens.main.MainViewModel;
import com.xnova.game.ui.theme.*;
import java.text.NumberFormat;
import java.util.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000@\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u000e\n\u0002\u0010\b\n\u0002\b\u0006\u001a\u0010\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u0003H\u0007\u001a&\u0010\u0004\u001a\u00020\u00012\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\b2\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\nH\u0003\u001a*\u0010\u000b\u001a\u00020\u00012\u0006\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u0011H\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u0012\u0010\u0013\u001aV\u0010\u0014\u001a\u00020\u00012\u0006\u0010\u0015\u001a\u00020\r2\u0006\u0010\u0016\u001a\u00020\r2\u0006\u0010\u0017\u001a\u00020\r2\u0006\u0010\u0018\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u00112\f\u0010\u0019\u001a\b\u0012\u0004\u0012\u00020\u00010\n2\f\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u00010\nH\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u001b\u0010\u001c\u001a\u0018\u0010\u001d\u001a\u00020\u00012\u0006\u0010\u0015\u001a\u00020\r2\u0006\u0010\u0016\u001a\u00020\rH\u0003\u001a\u0010\u0010\u001e\u001a\u00020\r2\u0006\u0010\u001f\u001a\u00020 H\u0002\u001a\u0010\u0010!\u001a\u00020\r2\u0006\u0010\"\u001a\u00020\u000fH\u0002\u001a\u0010\u0010#\u001a\u00020\r2\u0006\u0010\u001f\u001a\u00020\u000fH\u0002\u001a\u0010\u0010$\u001a\u00020\r2\u0006\u0010%\u001a\u00020\rH\u0002\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006&"}, d2 = {"BuildingsTab", "", "viewModel", "Lcom/xnova/game/ui/screens/main/MainViewModel;", "OGameBuildingCard", "building", "Lcom/xnova/game/data/model/BuildingInfo;", "isConstructing", "", "onUpgrade", "Lkotlin/Function0;", "OGameCostItem", "label", "", "amount", "", "color", "Landroidx/compose/ui/graphics/Color;", "OGameCostItem-mxwnekA", "(Ljava/lang/String;JJ)V", "OGameProgressPanel", "title", "icon", "name", "remainingSeconds", "onComplete", "onCancel", "OGameProgressPanel-qFjXxE8", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JJLkotlin/jvm/functions/Function0;Lkotlin/jvm/functions/Function0;)V", "OGameSectionHeader", "formatBuildTime", "seconds", "", "formatNumber", "num", "formatRemainingTime", "getBuildingIcon", "type", "app_debug"})
public final class BuildingsTabKt {
    
    @androidx.compose.runtime.Composable()
    public static final void BuildingsTab(@org.jetbrains.annotations.NotNull()
    com.xnova.game.ui.screens.main.MainViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameSectionHeader(java.lang.String title, java.lang.String icon) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameBuildingCard(com.xnova.game.data.model.BuildingInfo building, boolean isConstructing, kotlin.jvm.functions.Function0<kotlin.Unit> onUpgrade) {
    }
    
    private static final java.lang.String getBuildingIcon(java.lang.String type) {
        return null;
    }
    
    private static final java.lang.String formatNumber(long num) {
        return null;
    }
    
    private static final java.lang.String formatBuildTime(int seconds) {
        return null;
    }
    
    private static final java.lang.String formatRemainingTime(long seconds) {
        return null;
    }
}