import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import '../services/auth_service.dart';
import '../config/api_config.dart';

class DioClient {
  final Dio _dio;
  final Logger _logger = Logger();
  final AuthService _authService;

  /// Extra interceptors installed before the defaults (used by store_screenshots to serve mock data).
  static final List<Interceptor> extraInterceptors = [];

  DioClient(this._authService) : _dio = Dio() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = Duration(seconds: ApiConfig.connectTimeout);
    _dio.options.receiveTimeout = Duration(seconds: ApiConfig.receiveTimeout);
    _dio.options.sendTimeout = Duration(seconds: ApiConfig.sendTimeout);
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add interceptors
    _dio.interceptors.addAll(extraInterceptors);
    _dio.interceptors.add(_loggingInterceptor());
    _dio.interceptors.add(_authInterceptor());
  }

  Dio get dio => _dio;

  /// Auth Interceptor to add JWT token to requests
  Interceptor _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        debugPrint("Requesting: ${options.path}");
        debugPrint("Host: ${options.baseUrl}");
        // Skip auth header for login/register/refresh endpoints
        if (!options.path.contains('auth/login') &&
            !options.path.contains('auth/register') &&
            !options.path.contains('auth/password-reset') &&
            !options.path.contains('auth/token/refresh')) {
          final token = await _authService.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized - refresh token.
        // Skip the refresh endpoint itself and any request we already retried,
        // so a still-failing token can't cause an infinite refresh loop.
        final isRefreshCall =
            error.requestOptions.path.contains('auth/token/refresh');
        final alreadyRetried = error.requestOptions.extra['retried'] == true;

        if (error.response?.statusCode == 401 &&
            !isRefreshCall &&
            !alreadyRetried) {
          final refreshToken = await _authService.getRefreshToken();

          if (refreshToken != null) {
            try {
              // Try to refresh the access token (shared across concurrent 401s)
              final newAccessToken = await _authService.refreshAccessToken(refreshToken);

              if (newAccessToken != null) {
                // Retry the original request once with the new token
                error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                error.requestOptions.extra['retried'] = true;

                final response = await _dio.fetch(error.requestOptions);
                return handler.resolve(response);
              }
            } catch (e) {
              _logger.e('Token refresh failed: $e');
              debugPrint('Token refresh failed: $e');
            }
          }
        }
        return handler.next(error);
      },
    );
  }

  /// Logging Interceptor for debugging
  Interceptor _loggingInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        _logger.i(
          'REQUEST[${options.method}] => PATH: ${options.path}\n'
          'Headers: ${options.headers}\n'
          'Data: ${options.data}',
        );
        return handler.next(options);
      },
      onResponse: (response, handler) {
        _logger.i(
          'RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}\n'
          'Data: ${response.data}',
        );
        debugPrint("Response: $response");
        return handler.next(response);
      },
      onError: (error, handler) {
        _logger.e(
          'ERROR[${error.response?.statusCode}] => PATH: ${error.requestOptions.path}\n'
          'Message: ${error.message}\n'
          'Response: ${error.response?.data}',
        );
        debugPrint("Error: $error");
        return handler.next(error);
      },
    );
  }

  /// Update base URL
  void updateBaseUrl(String newBaseUrl) {
    _dio.options.baseUrl = newBaseUrl;
  }

  /// Add custom header
  void addHeader(String key, String value) {
    _dio.options.headers[key] = value;
  }

  /// Remove header
  void removeHeader(String key) {
    _dio.options.headers.remove(key);
  }
}
