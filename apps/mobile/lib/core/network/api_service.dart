import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio dio;

  // We map directly to the production backend so the emulator/device works immediately without localhost IP routing headers.
  final String _baseUrl = 'https://letterbox-production-5ec3.up.railway.app/api';

  ApiService._internal() {
    dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      headers: {'Content-Type': 'application/json'},
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('mosiac_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) async {
        // Automatic 401 Refresh Handling mirroring the React Web
        if (e.response?.statusCode == 401 && _isTokenExpiredError(e)) {
          final prefs = await SharedPreferences.getInstance();
          final refreshToken = prefs.getString('mosiac_refresh_token');

          if (refreshToken != null) {
            try {
              final refreshDio = Dio();
              final response = await refreshDio.post(
                '$_baseUrl/auth/refresh',
                data: {'refreshToken': refreshToken},
              );

              final newAccessToken = response.data['accessToken'];
              final newRefreshToken = response.data['refreshToken'];

              await prefs.setString('mosiac_token', newAccessToken);
              await prefs.setString('mosiac_refresh_token', newRefreshToken);

              e.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
              
              // Retry the original request
              final retryResponse = await dio.fetch(e.requestOptions);
              return handler.resolve(retryResponse);
            } catch (refreshError) {
              await prefs.remove('mosiac_token');
              await prefs.remove('mosiac_refresh_token');
              // Would trigger a global navigation to login here
              return handler.next(e);
            }
          }
        }
        return handler.next(e);
      },
    ));
  }
  
  bool _isTokenExpiredError(DioException e) {
    // Basic catch for any 401s
    return e.response?.statusCode == 401;
  }
}

final api = ApiService().dio;
