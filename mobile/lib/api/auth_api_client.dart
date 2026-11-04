import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';
import 'package:retrofit/retrofit.dart';
import '../models/user.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'auth_api_client.g.dart';

/// Authentication API Client
/// Handles login, register, logout, password reset, and token refresh
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class AuthApiClient extends BaseApiClient {
  factory AuthApiClient(Dio dio, {String? baseUrl}) = _AuthApiClient;

  @POST('auth/login/')
  Future<LoginResponse> login(@Body() Map<String, dynamic> credentials);

  @POST('auth/register/')
  @MultiPart()
  Future<RegisterResponse> register(@Body() FormData formData);

  @POST('auth/token/refresh/')
  Future<TokenRefreshResponse> refreshToken(
    @Body() Map<String, dynamic> refreshToken,
  );

  @POST('auth/logout/')
  Future<void> logout();

  @POST('auth/password-reset/')
  Future<void> requestPasswordReset(@Body() Map<String, dynamic> email);

  @POST('auth/password-reset/confirm/')
  Future<void> confirmPasswordReset(@Body() Map<String, dynamic> data);
}

// Response models for authentication
class LoginResponse {
  final String access;
  final String refresh;
  final User user;

  LoginResponse({
    required this.access,
    required this.refresh,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      access: json['access'] as String,
      refresh: json['refresh'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {'access': access, 'refresh': refresh, 'user': user.toJson()};
  }
}

class RegisterResponse {
  final String? message;
  final String? email;
  final int? userId;
  // Present only if the backend returns the full user object.
  final User? user;

  RegisterResponse({this.message, this.email, this.userId, this.user});

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    debugPrint("======================= Response JSON =======================");
    debugPrint(json.toString());
    debugPrint("======================= Response JSON =======================");
    return RegisterResponse(
      message: json['message'] as String?,
      email: json['email'] as String?,
      userId: json['user_id'] as int?,
      user: json['user'] is Map<String, dynamic>
          ? User.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (message != null) 'message': message,
      if (email != null) 'email': email,
      if (userId != null) 'user_id': userId,
      if (user != null) 'user': user!.toJson(),
    };
  }
}

class TokenRefreshResponse {
  final String access;
  final String? refresh;

  TokenRefreshResponse({required this.access, this.refresh});

  factory TokenRefreshResponse.fromJson(Map<String, dynamic> json) {
    return TokenRefreshResponse(
      access: json['access'] as String,
      // With ROTATE_REFRESH_TOKENS the backend returns a new refresh token too.
      refresh: json['refresh'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'access': access, if (refresh != null) 'refresh': refresh};
  }
}
