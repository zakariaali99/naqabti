import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/doctors_membership.dart';
import '../models/membership_type.dart';
import '../models/paginated_response.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'membership_api_client.g.dart';

/// Membership API Client
/// Handles membership and membership type operations
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class MembershipApiClient extends BaseApiClient {
  factory MembershipApiClient(Dio dio, {String? baseUrl}) = _MembershipApiClient;

  // Membership Type endpoints
  @GET('membership-types/')
  Future<PaginatedResponse<MembershipType>> getMembershipTypes(@Queries() Map<String, dynamic>? queries);

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
  Future<PaginatedResponse<DoctorsMembership>> getMemberships(@Queries() Map<String, dynamic>? queries);

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
}
