import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color background = Color(0xFFF4F4F4);
  static const Color darkBackground = Color(0xFFFFFFFF);
  static const Color primary = Color(0xFFDA291C);
  static const Color border = Color(0xFF111111);
  static const Color borderLight = Color(0xFF111111); // Brutalist strong border
  static const Color textMain = Color(0xFF111111);
  static const Color textMuted = Color(0xFF555555);
  static const Color textInvert = Color(0xFF111111); 
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color success = Color(0xFF10B981); 

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
      textTheme: GoogleFonts.interTextTheme().copyWith(
        headlineLarge: GoogleFonts.oswald(color: textMain, fontWeight: FontWeight.bold, fontSize: 32, letterSpacing: 1.6),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: textOnPrimary,
          shape: const ContinuousRectangleBorder(),
          side: const BorderSide(color: border, width: 2), // Brutalist button border
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
      ),
    );
  }
}
