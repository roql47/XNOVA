package com.xnova.game.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val OGameColorScheme = darkColorScheme(
    primary = OGameGreen,
    secondary = OGameBlue,
    tertiary = OGameOrange,
    background = OGameBlack,
    surface = PanelBackground,
    surfaceVariant = PanelHeader,
    onPrimary = OGameBlack,
    onSecondary = TextPrimary,
    onTertiary = TextPrimary,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
    error = ErrorRed,
    onError = TextPrimary,
    outline = PanelBorder
)

@Composable
fun XNovaTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = OGameColorScheme
    val view = LocalView.current
    
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = OGameBlack.toArgb()
            window.navigationBarColor = OGameBlack.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
