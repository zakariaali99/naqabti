import 'package:dio/dio.dart';
import 'package:naqabti/config/api_config.dart';
import 'package:retrofit/retrofit.dart';
import '../models/user.dart';
import '../models/doctors_membership.dart';
import '../models/membership_type.dart';
import '../models/certification.dart';
import '../models/certification_type.dart';
import '../models/city.dart';
import '../models/payment.dart';
import '../models/notification.dart';

part 'api_client.g.dart';

@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class ApiClient {
  factory ApiClient(Dio dio, {String? baseUrl}) = _ApiClient;

  // Authentication endpoints
  @POST('auth/login/')
  Future<LoginResponse> login(@Body() Map<String, dynamic> credentials);

  @POST('auth/register/')
  Future<RegisterResponse> register(@Body() Map<String, dynamic> userData);

  @POST('auth/token/refresh/')
  Future<TokenRefreshResponse> refreshToken(@Body() Map<String, dynamic> refreshToken);

  @POST('auth/logout/')
  Future<void> logout();

  @POST('auth/password-reset/')
  Future<void> requestPasswordReset(@Body() Map<String, dynamic> email);

  @POST('auth/password-reset/confirm/')
  Future<void> confirmPasswordReset(@Body() Map<String, dynamic> data);

  // User endpoints
  @GET('users/me/')
  Future<User> getCurrentUser();

  @PATCH('users/me/')
  Future<User> updateCurrentUser(@Body() Map<String, dynamic> userData);

  @GET('users/')
  Future<List<User>> getUsers(@Queries() Map<String, dynamic>? queries);

  @GET('users/{id}/')
  Future<User> getUser(@Path('id') int id);

  @POST('users/')
  Future<User> createUser(@Body() Map<String, dynamic> userData);

  @PATCH('users/{id}/')
  Future<User> updateUser(@Path('id') int id, @Body() Map<String, dynamic> userData);

  @DELETE('users/{id}/')
  Future<void> deleteUser(@Path('id') int id);

  // Membership Type endpoints
  @GET('membership-types/')
  Future<List<MembershipType>> getMembershipTypes(@Queries() Map<String, dynamic>? queries);

  @GET('membership-types/{id}/')
  Future<MembershipType> getMembershipType(@Path('id') int id);

  @POST('membership-types/')
  Future<MembershipType> createMembershipType(@Body() Map<String, dynamic> data);

  @PATCH('membership-types/{id}/')
  Future<MembershipType> updateMembershipType(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('membership-types/{id}/')
  Future<void> deleteMembershipType(@Path('id') int id);

  // Doctors Membership endpoints
  @GET('memberships/')
  Future<List<DoctorsMembership>> getMemberships(@Queries() Map<String, dynamic>? queries);

  @GET('memberships/{id}/')
  Future<DoctorsMembership> getMembership(@Path('id') int id);

  @POST('memberships/')
  Future<DoctorsMembership> createMembership(@Body() Map<String, dynamic> data);

  @PATCH('memberships/{id}/')
  Future<DoctorsMembership> updateMembership(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('memberships/{id}/')
  Future<void> deleteMembership(@Path('id') int id);

  @POST('memberships/{id}/renew/')
  Future<DoctorsMembership> renewMembership(@Path('id') int id);

  // City endpoints
  @GET('cities/')
  Future<List<City>> getCities(@Queries() Map<String, dynamic>? queries);

  @GET('cities/{id}/')
  Future<City> getCity(@Path('id') int id);

  @POST('cities/')
  Future<City> createCity(@Body() Map<String, dynamic> data);

  @PATCH('cities/{id}/')
  Future<City> updateCity(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('cities/{id}/')
  Future<void> deleteCity(@Path('id') int id);

  // Certification Type endpoints
  @GET('certification-types/')
  Future<List<CertificationType>> getCertificationTypes(@Queries() Map<String, dynamic>? queries);

  @GET('certification-types/{id}/')
  Future<CertificationType> getCertificationType(@Path('id') int id);

  @POST('certification-types/')
  Future<CertificationType> createCertificationType(@Body() Map<String, dynamic> data);

  @PATCH('certification-types/{id}/')
  Future<CertificationType> updateCertificationType(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('certification-types/{id}/')
  Future<void> deleteCertificationType(@Path('id') int id);

  // Certification endpoints
  @GET('certifications/')
  Future<List<Certification>> getCertifications(@Queries() Map<String, dynamic>? queries);

  @GET('certifications/{id}/')
  Future<Certification> getCertification(@Path('id') int id);

  @POST('certifications/')
  Future<Certification> createCertification(@Body() Map<String, dynamic> data);

  @PATCH('certifications/{id}/')
  Future<Certification> updateCertification(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('certifications/{id}/')
  Future<void> deleteCertification(@Path('id') int id);

  // Payment endpoints
  @GET('payments/')
  Future<List<Payment>> getPayments(@Queries() Map<String, dynamic>? queries);

  @GET('payments/{id}/')
  Future<Payment> getPayment(@Path('id') int id);

  @POST('payments/')
  Future<Payment> createPayment(@Body() Map<String, dynamic> data);

  @PATCH('payments/{id}/')
  Future<Payment> updatePayment(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('payments/{id}/')
  Future<void> deletePayment(@Path('id') int id);

  // Notification endpoints
  @GET('notifications/')
  Future<List<AppNotification>> getNotifications(@Queries() Map<String, dynamic>? queries);

  @GET('notifications/{id}/')
  Future<AppNotification> getNotification(@Path('id') int id);

  @PATCH('notifications/{id}/')
  Future<AppNotification> markNotificationAsRead(@Path('id') int id, @Body() Map<String, dynamic> data);

  @POST('notifications/mark-all-read/')
  Future<void> markAllNotificationsAsRead();
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
    return {
      'access': access,
      'refresh': refresh,
      'user': user.toJson(),
    };
  }
}

class RegisterResponse {
  final User user;
  final String? message;

  RegisterResponse({
    required this.user,
    this.message,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      message: json['message'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      if (message != null) 'message': message,
    };
  }
}

class TokenRefreshResponse {
  final String access;

  TokenRefreshResponse({required this.access});

  factory TokenRefreshResponse.fromJson(Map<String, dynamic> json) {
    return TokenRefreshResponse(
      access: json['access'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'access': access,
    };
  }
}
