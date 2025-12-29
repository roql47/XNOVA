package com.xnova.game.ui.screens.main;

import androidx.compose.foundation.layout.*;
import androidx.compose.material.icons.Icons;
import androidx.compose.material.icons.filled.*;
import androidx.compose.material.icons.outlined.*;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.graphics.vector.ImageVector;
import androidx.compose.ui.text.font.FontWeight;
import com.xnova.game.ui.screens.main.tabs.*;
import com.xnova.game.ui.theme.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u00004\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\u001a&\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0003\u001a \u0010\b\u001a\u00020\u00012\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\b\b\u0002\u0010\n\u001a\u00020\u000bH\u0007\u001aF\u0010\f\u001a\u00020\u00012\u0006\u0010\r\u001a\u00020\u00032\b\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u000f2\u0012\u0010\u0011\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00122\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0003\u001a8\u0010\u0013\u001a\u00020\u00012\b\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u000f2\f\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\f\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0003\u00a8\u0006\u0016"}, d2 = {"DrawerMenuItem", "", "tab", "Lcom/xnova/game/ui/screens/main/MainTab;", "isSelected", "", "onClick", "Lkotlin/Function0;", "MainScreen", "onLogout", "viewModel", "Lcom/xnova/game/ui/screens/main/MainViewModel;", "OGameDrawerContent", "selectedTab", "playerName", "", "coordinate", "onTabSelected", "Lkotlin/Function1;", "OGameTopBar", "onMenuClick", "onRefresh", "app_debug"})
public final class MainScreenKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void MainScreen(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onLogout, @org.jetbrains.annotations.NotNull()
    com.xnova.game.ui.screens.main.MainViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameTopBar(java.lang.String playerName, java.lang.String coordinate, kotlin.jvm.functions.Function0<kotlin.Unit> onMenuClick, kotlin.jvm.functions.Function0<kotlin.Unit> onRefresh) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void OGameDrawerContent(com.xnova.game.ui.screens.main.MainTab selectedTab, java.lang.String playerName, java.lang.String coordinate, kotlin.jvm.functions.Function1<? super com.xnova.game.ui.screens.main.MainTab, kotlin.Unit> onTabSelected, kotlin.jvm.functions.Function0<kotlin.Unit> onLogout) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void DrawerMenuItem(com.xnova.game.ui.screens.main.MainTab tab, boolean isSelected, kotlin.jvm.functions.Function0<kotlin.Unit> onClick) {
    }
}