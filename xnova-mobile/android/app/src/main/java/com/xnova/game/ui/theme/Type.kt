package com.xnova.game.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import com.xnova.game.R

// Google Fonts Provider
val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs
)

// Orbitron - 우주/SF 느낌의 폰트
val OrbitronFont = GoogleFont("Orbitron")

val OrbitronFontFamily = FontFamily(
    Font(googleFont = OrbitronFont, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = OrbitronFont, fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = OrbitronFont, fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = OrbitronFont, fontProvider = provider, weight = FontWeight.Bold),
    Font(googleFont = OrbitronFont, fontProvider = provider, weight = FontWeight.ExtraBold)
)

// Exo 2 - 본문용 SF 폰트
val Exo2Font = GoogleFont("Exo 2")

val Exo2FontFamily = FontFamily(
    Font(googleFont = Exo2Font, fontProvider = provider, weight = FontWeight.Light),
    Font(googleFont = Exo2Font, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = Exo2Font, fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = Exo2Font, fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = Exo2Font, fontProvider = provider, weight = FontWeight.Bold)
)

val Typography = Typography(
    // 큰 제목들 - Orbitron (SF/게임 느낌)
    displayLarge = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 45.sp,
        lineHeight = 52.sp
    ),
    displaySmall = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 36.sp,
        lineHeight = 44.sp
    ),
    headlineLarge = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 40.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 36.sp
    ),
    headlineSmall = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 24.sp,
        lineHeight = 32.sp
    ),
    
    // 타이틀 - Orbitron
    titleLarge = TextStyle(
        fontFamily = OrbitronFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),
    titleMedium = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    titleSmall = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    
    // 본문 - Exo 2 (가독성 좋음)
    bodyLarge = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    bodySmall = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp
    ),
    
    // 라벨 - Exo 2
    labelLarge = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    labelMedium = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    ),
    labelSmall = TextStyle(
        fontFamily = Exo2FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
