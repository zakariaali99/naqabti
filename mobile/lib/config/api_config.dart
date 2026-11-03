/// API Configuration
/// Contains all static configuration variables for API communication
class ApiConfig {
  // Private constructor to prevent instantiation
  ApiConfig._();

  /// Base URL for API endpoints.
  /// Release builds talk to production; for local development pass
  /// `--dart-define=API_BASE_URL=http://<host>:8000/api/`.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://my.naqabti.ly/api/',
  );

  /// Connection timeout in seconds
  static const int connectTimeout = 30;

  /// Receive timeout in seconds
  static const int receiveTimeout = 30;

  /// Send timeout in seconds
  static const int sendTimeout = 30;

  /// API version (if applicable)
  static const String apiVersion = 'v1';

  /// Enable logging in debug mode
  static const bool enableLogging = true;

  /// Shared preferences keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user';

  /// Pagination defaults
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
}
