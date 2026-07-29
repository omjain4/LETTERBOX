import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('mosiac_token');

    if (token != null) {
      try {
        final response = await api.get('/auth/me');
        _user = response.data['user'];
      } catch (e) {
        // Token is likely invalid or network is down
        await prefs.remove('mosiac_token');
        await prefs.remove('mosiac_refresh_token');
        _user = null;
      }
    }
    
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('mosiac_token', response.data['accessToken']);
      await prefs.setString('mosiac_refresh_token', response.data['refreshToken']);

      _user = response.data['user'];
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('mosiac_token');
    await prefs.remove('mosiac_refresh_token');
    _user = null;
    notifyListeners();
  }
}
