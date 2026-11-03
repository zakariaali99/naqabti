import 'package:get/get.dart';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart' as dio;
import 'package:http_parser/http_parser.dart';
import '../api/auth_api_client.dart';
import '../api/user_api_client.dart';
import '../api/dio_client.dart';
import '../models/user.dart';
import '../config/api_config.dart';

class AuthService extends GetxService {
  late final SharedPreferences _prefs;
  late final AuthApiClient _authClient;
  late final UserApiClient _userClient;

  final Rx<User?> currentUser = Rx<User?>(null);
  final RxBool isAuthenticated = false.obs;

  /// Tracks an in-flight token refresh so concurrent 401s share a single
  /// refresh call instead of each firing their own (which would race and
  /// overwrite each other's rotated refresh tokens).
  Future<String?>? _ongoingRefresh;

  Future<AuthService> init() async {
    _prefs = await SharedPreferences.getInstance();

    // Initialize Dio and API clients
    final dioClient = DioClient(this);
    _authClient = AuthApiClient(dioClient.dio);
    _userClient = UserApiClient(dioClient.dio);

    // Load saved user data
    await _loadUser();

    return this;
  }

  /// Refresh current user data
  Future<void> refreshUser() async {
    try {
      final user = await _userClient.getCurrentUser();
      currentUser.value = user;
    } catch (e) {
      rethrow;
    }
  }

  /// Load user from storage
  Future<void> _loadUser() async {
    final accessToken = await getAccessToken();
    if (accessToken != null) {
      try {
        final user = await _userClient.getCurrentUser();
        currentUser.value = user;
        isAuthenticated.value = true;
      } catch (e) {
        // Token might be expired, try to refresh
        final refreshToken = await getRefreshToken();
        if (refreshToken != null) {
          await refreshAccessToken(refreshToken);
        } else {
          await logout();
        }
      }
    }
  }

  /// Try to restore session from stored tokens
  /// Returns true if session was restored successfully, false otherwise
  Future<bool> tryRestoreSession() async {
    final accessToken = await getAccessToken();
    if (accessToken == null) {
      return false;
    }

    try {
      // Try to get current user with existing token
      final user = await _userClient.getCurrentUser();
      currentUser.value = user;
      isAuthenticated.value = true;
      return true;
    } catch (e) {
      // Token might be expired, try to refresh
      final refreshToken = await getRefreshToken();
      if (refreshToken != null) {
        final newToken = await refreshAccessToken(refreshToken);
        if (newToken != null) {
          // Token refreshed, try again
          try {
            final user = await _userClient.getCurrentUser();
            currentUser.value = user;
            isAuthenticated.value = true;
            return true;
          } catch (e) {
            // Still failed, clear everything
            await clearTokens();
            isAuthenticated.value = false;
            return false;
          }
        }
      }
      // Refresh failed or no refresh token
      await clearTokens();
      isAuthenticated.value = false;
      return false;
    }
  }

  /// Login
  Future<User?> login(String username, String password, {String? fcmToken}) async {
    try {
      final response = await _authClient.login({
        'username': username,
        'password': password,
        if (fcmToken != null) 'fcm_token': fcmToken,
      });

      await saveTokens(response.access, response.refresh);
      currentUser.value = response.user;
      isAuthenticated.value = true;

      return response.user;
    } catch (e) {
      rethrow;
    }
  }

  /// Register
  Future<User?> register(dio.FormData formData) async {
    try {
      final response = await _authClient.register(formData);
      return response.user;
    } catch (e) {
      rethrow;
    }
  }

  /// Update Profile Photo
  Future<User?> updateProfilePhoto(File photo) async {
    try {
      String fileName = photo.path.split('/').last;
      
      final formData = dio.FormData.fromMap({
        'profile_image': await dio.MultipartFile.fromFile(
          photo.path,
          filename: fileName,
        ),
      });

      final user = await _userClient.updateProfileImage(formData);
      currentUser.value = user;
      return user;
    } catch (e) {
      rethrow;
    }
  }

  /// Upload Passport Image (image or PDF)
  Future<User?> uploadPassportImage(File file) async {
    try {
      final fileName = file.path.split('/').last;
      final ext = fileName.contains('.') ? fileName.split('.').last.toLowerCase() : '';
      final contentType = ext == 'pdf'
          ? MediaType('application', 'pdf')
          : MediaType('image', ext.isEmpty ? 'jpeg' : ext);

      final formData = dio.FormData.fromMap({
        'passport_image': await dio.MultipartFile.fromFile(
          file.path,
          filename: fileName,
          contentType: contentType,
        ),
      });

      final user = await _userClient.updatePassportImage(formData);
      currentUser.value = user;
      return user;
    } catch (e) {
      rethrow;
    }
  }

  /// Update Profile
  Future<User?> updateProfile(Map<String, dynamic> userData) async {
    try {
      final user = await _userClient.updateCurrentUser(userData);
      currentUser.value = user;
      return user;
    } catch (e) {
      rethrow;
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _authClient.logout();
    } catch (e) {
      // Ignore errors during logout API call
    } finally {
      await clearTokens();
      currentUser.value = null;
      isAuthenticated.value = false;

      // Navigate to login page only if GetX is ready
      try {
        if (Get.currentRoute != '/login') {
          Get.offAllNamed('/login');
        }
      } catch (e) {
        // Navigation not available yet, ignore
      }
    }
  }

  /// Delete the current account (soft delete + anonymization on the server)
  Future<void> deleteAccount() async {
    final user = currentUser.value;
    if (user == null) {
      throw StateError('No signed-in user to delete');
    }

    // Only sign out once the server confirmed the deletion, so a failed
    // request never looks like a deleted account.
    await _userClient.deleteUser(user.id);

    await clearTokens();
    currentUser.value = null;
    isAuthenticated.value = false;

    // Navigate to login page only if GetX is ready
    try {
      if (Get.currentRoute != '/login') {
        Get.offAllNamed('/login');
      }
    } catch (e) {
      // Navigation not available yet, ignore
    }
  }


  /// Refresh access token.
  ///
  /// Single-flight: if a refresh is already running, concurrent callers await
  /// the same future instead of starting their own.
  Future<String?> refreshAccessToken(String refreshToken) {
    return _ongoingRefresh ??=
        _performRefresh(refreshToken).whenComplete(() => _ongoingRefresh = null);
  }

  Future<String?> _performRefresh(String refreshToken) async {
    try {
      final response = await _authClient.refreshToken({
        'refresh': refreshToken,
      });

      // Persist the new access token, and the rotated refresh token if the
      // backend returned one (ROTATE_REFRESH_TOKENS), so the refresh window
      // keeps sliding forward instead of expiring at the original login.
      if (response.refresh != null && response.refresh!.isNotEmpty) {
        await saveTokens(response.access, response.refresh!);
      } else {
        await saveAccessToken(response.access);
      }
      return response.access;
    } catch (e) {
      await clearTokens();
      currentUser.value = null;
      isAuthenticated.value = false;
      return null;
    }
  }

  /// Request a password reset code by email.
  /// Returns the account id the code was issued for, or null when no
  /// account matched the email.
  Future<int?> requestPasswordReset(String email) async {
    final response = await _authClient.requestPasswordReset({'email': email});
    return response['user_id'] as int?;
  }

  /// Set a new password using a verified reset code.
  Future<void> confirmPasswordReset(
    int userId,
    String code,
    String newPassword,
  ) async {
    await _authClient.confirmPasswordReset({
      'user_id': userId,
      'code': code,
      'new_password': newPassword,
      'confirm_password': newPassword,
    });
  }

  /// Change the password of the signed-in user.
  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await _authClient.changePassword({
      'current_password': currentPassword,
      'new_password': newPassword,
      'confirm_password': newPassword,
    });
  }

  /// Save tokens to storage
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _prefs.setString(ApiConfig.accessTokenKey, accessToken);
    await _prefs.setString(ApiConfig.refreshTokenKey, refreshToken);
  }

  /// Save access token
  Future<void> saveAccessToken(String accessToken) async {
    await _prefs.setString(ApiConfig.accessTokenKey, accessToken);
  }

  /// Get access token
  Future<String?> getAccessToken() async {
    return _prefs.getString(ApiConfig.accessTokenKey);
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    return _prefs.getString(ApiConfig.refreshTokenKey);
  }

  /// Clear tokens
  Future<void> clearTokens() async {
    await _prefs.remove(ApiConfig.accessTokenKey);
    await _prefs.remove(ApiConfig.refreshTokenKey);
    await _prefs.remove(ApiConfig.userKey);
  }

  /// Check if user is logged in
  bool get isLoggedIn => isAuthenticated.value;

  /// Check if tokens exist in storage (synchronous check)
  bool get hasToken => _prefs.getString(ApiConfig.accessTokenKey) != null;

  /// Get current user
  User? get user => currentUser.value;
}
