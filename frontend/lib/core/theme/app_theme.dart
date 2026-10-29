import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFFF7A59); // Coral
  static const Color primaryLight = Color(0xFFFFA07A);
  static const Color primaryDark = Color(0xFFE4573D);
  static const Color secondary = Color(0xFF5ED0B5); // Mint
  static const Color accent = Color(0xFFFFC857); // Warm yellow
  static const Color backgroundDark = Color(0xFF101827); // Night blue
  static const Color surfaceDark = Color(0xFF182338);
  static const Color cardDark = Color(0xFF24324B);
  static const Color cardElevated = Color(0xFF2C3B57);
  static const Color textLight = Color(0xFFF7F7FB);
  static const Color textMuted = Color(0xFFA9B5C9);

  // ELO Rank Colors
  static const Color rankHierro = Color(0xFF71717A); // Gray
  static const Color rankBronce = Color(0xFFB45309); // Amber/Bronze
  static const Color rankPlata = Color(0xFF94A3B8); // Slate/Silver
  static const Color rankOro = Color(0xFFEAB308); // Gold
  static const Color rankPlatino = Color(0xFF06B6D4); // Cyan
  static const Color rankDiamante = Color(0xFF8B5CF6); // Purple/Violet

  static Color forRank(String rank) {
    switch (rank.toUpperCase()) {
      case 'HIERRO':
        return rankHierro;
      case 'BRONCE':
        return rankBronce;
      case 'PLATA':
        return rankPlata;
      case 'ORO':
        return rankOro;
      case 'PLATINO':
        return rankPlatino;
      case 'DIAMANTE':
        return rankDiamante;
      default:
        return primary;
    }
  }
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surfaceDark,
        onSurface: AppColors.textLight,
        error: Color(0xFFFF6B6B),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.textLight,
          fontSize: 22,
          fontWeight: FontWeight.w800,
        ),
        iconTheme: IconThemeData(color: AppColors.textLight),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceDark,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 17,
        ),
        labelStyle: const TextStyle(color: AppColors.textMuted),
        hintStyle: const TextStyle(color: AppColors.textMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
        ),
      ),
      textTheme: const TextTheme(
        headlineSmall: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
        ),
        titleLarge: TextStyle(
          fontSize: 21,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.textLight,
        ),
        bodyLarge: TextStyle(fontSize: 16, color: AppColors.textLight),
        bodyMedium: TextStyle(fontSize: 14, color: AppColors.textMuted),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceDark,
        selectedItemColor: AppColors.primaryLight,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700),
        showUnselectedLabels: true,
      ),
    );
  }
}
