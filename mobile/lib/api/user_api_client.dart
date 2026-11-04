import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/user.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'user_api_client.g.dart';

/// User API Client
/// Handles user CRUD operations
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class UserApiClient extends BaseApiClient {
  factory UserApiClient(Dio dio, {String? baseUrl}) = _UserApiClient;

  @GET('users/me/')
  Future<User> getCurrentUser();

  @PATCH('users/me/')
  Future<User> updateCurrentUser(@Body() Map<String, dynamic> userData);

  @PATCH('users/me/')
  @MultiPart()
  Future<User> updateProfileImage(@Body() FormData userData);

  @PATCH('users/me/')
  @MultiPart()
  Future<User> updatePassportImage(@Body() FormData userData);

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
}
