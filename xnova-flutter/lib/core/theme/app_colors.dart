import 'package:flutter/material.dart';

class AppColors {
  // 기본 배경 (어두운 우주 느낌)
  static const Color background = Color(0xFF0A0E14);
  static const Color surface = Color(0xFF12171F);
  static const Color surfaceLight = Color(0xFF1A2030);
  
  // 단일 액센트 컬러 (사이버 블루-그린)
  static const Color accent = Color(0xFF00C896);
  static const Color accentDim = Color(0xFF00A67A);
  
  // 텍스트
  static const Color textPrimary = Color(0xFFE8ECF0);
  static const Color textSecondary = Color(0xFF7A8A9A);
  static const Color textMuted = Color(0xFF4A5568);
  
  // 패널/카드
  static const Color panelBackground = Color(0xFF141A24);
  static const Color panelBorder = Color(0xFF1E2738);
  static const Color panelHeader = Color(0xFF1A2233);
  
  // Drawer
  static const Color drawerBackground = Color(0xFF0D1218);
  static const Color drawerItemSelected = Color(0xFF0F1F1A);
  
  // 자원 (단순화 - 밝기로 구분)
  static const Color resourceMetal = Color(0xFF9AA5B1);
  static const Color resourceCrystal = Color(0xFF7EC8E3);
  static const Color resourceDeuterium = Color(0xFF6EE7B7);
  static const Color resourceEnergy = Color(0xFFFFD666);
  
  // 상태 (최소화)
  static const Color positive = Color(0xFF10B981);
  static const Color warning = Color(0xFFD97706);
  static const Color negative = Color(0xFFDC2626);
  
  // 버튼
  static const Color buttonPrimary = Color(0xFF00A67A);
  static const Color buttonSecondary = Color(0xFF1A2233);
  
  // 레거시 호환 (점진적 마이그레이션)
  static const Color ogameBlack = background;
  static const Color ogameDarkBlue = surface;
  static const Color ogameGreen = accent;
  static const Color ogameLightGreen = accent;
  static const Color metalColor = resourceMetal;
  static const Color crystalColor = resourceCrystal;
  static const Color deuteriumColor = resourceDeuterium;
  static const Color energyColor = resourceEnergy;
  static const Color textDisabled = textMuted;
  static const Color successGreen = positive;
  static const Color warningOrange = warning;
  static const Color errorRed = negative;
  static const Color infoBlue = resourceCrystal;
  static const Color buttonPrimaryHover = buttonPrimary;
  static const Color buttonDanger = negative;
}
