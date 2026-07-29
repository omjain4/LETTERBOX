import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFFF4F4F4);
  static const Color darkBackground = Color(0xFF111111);
  static const Color primary = Color(0xFFDA291C);
  static const Color border = Color(0xFF111111);
  static const Color borderLight = Color(0xFF333333);
  static const Color textMain = Color(0xFF111111);
  static const Color textMuted = Color(0xFF555555);
  static const Color textInvert = Color(0xFFFFFFFF);
  static const Color success = Color(0xFF00E054); // Letterboxd Green

  static ThemeData get lightTheme {
    return ThemeData(
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: const ColorScheme.light(
        primary: primary,
        background: background,
        surface: Colors.white,
        onPrimary: textInvert,
        onBackground: textMain,
        onSurface: textMain,
      ),
      fontFamily: 'Inter', // Assuming standard font
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBackground,
        foregroundColor: textInvert,
        elevation: 0,
        centerTitle: false,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: textMain, fontWeight: FontWeight.bold, fontSize: 32),
        bodyLarge: TextStyle(color: textMain, fontSize: 16),
        bodyMedium: TextStyle(color: textMuted, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: textInvert,
          shape: const ContinuousRectangleBorder(), // Brutalist square edges
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
      ),
    );
  }
}
