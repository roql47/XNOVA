package com.xnova.game.ui.components;

import androidx.compose.foundation.layout.*;
import androidx.compose.runtime.Composable;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.text.font.FontWeight;
import coil.request.ImageRequest;
import com.xnova.game.R;
import com.xnova.game.data.model.Production;
import com.xnova.game.data.model.Resources;
import com.xnova.game.ui.theme.*;
import java.text.NumberFormat;
import java.util.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000:\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\u001a \u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00032\u0006\u0010\u0005\u001a\u00020\u0003H\u0003\u001a.\u0010\u0006\u001a\u00020\u00012\b\u0010\u0007\u001a\u0004\u0018\u00010\b2\b\u0010\t\u001a\u0004\u0018\u00010\n2\u0006\u0010\u000b\u001a\u00020\u00032\b\b\u0002\u0010\f\u001a\u00020\rH\u0007\u001a*\u0010\u000e\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u0012H\u0003\u00f8\u0001\u0000\u00a2\u0006\u0004\b\u0013\u0010\u0014\u001a\u0010\u0010\u0015\u001a\u00020\u00162\u0006\u0010\u000f\u001a\u00020\u0010H\u0002\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\u0017"}, d2 = {"EnergyItem", "", "imageRes", "", "used", "total", "ResourceBar", "resources", "Lcom/xnova/game/data/model/Resources;", "production", "Lcom/xnova/game/data/model/Production;", "energyRatio", "modifier", "Landroidx/compose/ui/Modifier;", "ResourceItem", "amount", "", "color", "Landroidx/compose/ui/graphics/Color;", "ResourceItem-mxwnekA", "(IJJ)V", "formatAmount", "", "app_debug"})
public final class ResourceBarKt {
    
    @androidx.compose.runtime.Composable()
    public static final void ResourceBar(@org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.Resources resources, @org.jetbrains.annotations.Nullable()
    com.xnova.game.data.model.Production production, int energyRatio, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void EnergyItem(int imageRes, int used, int total) {
    }
    
    private static final java.lang.String formatAmount(long amount) {
        return null;
    }
}