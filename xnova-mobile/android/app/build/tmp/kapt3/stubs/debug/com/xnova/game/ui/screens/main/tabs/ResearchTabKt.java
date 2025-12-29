package com.xnova.game.ui.screens.main.tabs;

import androidx.compose.foundation.layout.*;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.graphics.SolidColor;
import androidx.compose.ui.text.font.FontWeight;
import com.xnova.game.data.model.ResearchInfo;
import com.xnova.game.ui.screens.main.MainViewModel;
import com.xnova.game.ui.theme.*;
import java.text.NumberFormat;
import java.util.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000>\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0007\u001a*\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00052\u0006\u0010\u0006\u001a\u00020\u0007H\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\b\u0010\t\u001a+\u0010\n\u001a\u00020\u00012\u0006\u0010\u000b\u001a\u00020\u00032\u0006\u0010\u0002\u001a\u00020\u00032\u0011\u0010\f\u001a\r\u0012\u0004\u0012\u00020\u00010\r\u00a2\u0006\u0002\b\u000eH\u0003\u001aV\u0010\u000f\u001a\u00020\u00012\u0006\u0010\u000b\u001a\u00020\u00032\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0010\u001a\u00020\u00032\u0006\u0010\u0011\u001a\u00020\u00052\u0006\u0010\u0006\u001a\u00020\u00072\f\u0010\u0012\u001a\b\u0012\u0004\u0012\u00020\u00010\r2\f\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00010\rH\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u0014\u0010\u0015\u001a&\u0010\u0016\u001a\u00020\u00012\u0006\u0010\u0017\u001a\u00020\u00182\u0006\u0010\u0019\u001a\u00020\u001a2\f\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u00010\rH\u0003\u001a\u0010\u0010\u001c\u001a\u00020\u00012\u0006\u0010\u001d\u001a\u00020\u001eH\u0007\u001a\u0010\u0010\u001f\u001a\u00020\u00032\u0006\u0010 \u001a\u00020\u0005H\u0002\u001a\u0010\u0010!\u001a\u00020\u00032\u0006\u0010\"\u001a\u00020\u0005H\u0002\u001a\u0010\u0010#\u001a\u00020\u00032\u0006\u0010$\u001a\u00020\u0003H\u0002\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006%"}, d2 = {"OGameCostItem", "", "icon", "", "amount", "", "color", "Landroidx/compose/ui/graphics/Color;", "OGameCostItem-mxwnekA", "(Ljava/lang/String;JJ)V", "OGamePanel", "title", "content", "Lkotlin/Function0;", "Landroidx/compose/runtime/Composable;", "OGameProgressPanel", "name", "remainingSeconds", "onComplete", "onCancel", "OGameProgressPanel-qFjXxE8", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JJLkotlin/jvm/functions/Function0;Lkotlin/jvm/functions/Function0;)V", "OGameResearchCard", "research", "Lcom/xnova/game/data/model/ResearchInfo;", "isResearching", "", "onStart", "ResearchTab", "viewModel", "Lcom/xnova/game/ui/screens/main/MainViewModel;", "formatNumber", "num", "formatTime", "seconds", "getResearchIcon", "type", "app_debug"})
public final class ResearchTabKt {
    
    @androidx.compose.runtime.Composable()
    public static final void ResearchTab(@org.jetbrains.annotations.NotNull()
    com.xnova.game.ui.screens.main.MainViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGamePanel(java.lang.String title, java.lang.String icon, kotlin.jvm.functions.Function0<kotlin.Unit> content) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameResearchCard(com.xnova.game.data.model.ResearchInfo research, boolean isResearching, kotlin.jvm.functions.Function0<kotlin.Unit> onStart) {
    }
    
    private static final java.lang.String getResearchIcon(java.lang.String type) {
        return null;
    }
    
    private static final java.lang.String formatNumber(long num) {
        return null;
    }
    
    private static final java.lang.String formatTime(long seconds) {
        return null;
    }
}