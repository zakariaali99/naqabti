import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/certification.dart';
import '../models/certification_type.dart';
import '../models/paginated_response.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'certification_api_client.g.dart';

/// Certification API Client
/// Handles certification and certification type operations
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class CertificationApiClient extends BaseApiClient {
  factory CertificationApiClient(Dio dio, {String? baseUrl}) = _CertificationApiClient;

  // Certification Type endpoints
  @GET('certification-types/')
  Future<PaginatedResponse<CertificationType>> getCertificationTypes(@Queries() Map<String, dynamic>? queries);

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
  Future<PaginatedResponse<Certification>> getCertifications(@Queries() Map<String, dynamic>? queries);

  @GET('certifications/{id}/')
  Future<Certification> getCertification(@Path('id') int id);

  @POST('certifications/')
  Future<Certification> createCertification(@Body() Map<String, dynamic> data);

  @PATCH('certifications/{id}/')
  Future<Certification> updateCertification(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('certifications/{id}/')
  Future<void> deleteCertification(@Path('id') int id);
}
