import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/academic_degree.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'academic_degree_api_client.g.dart';

@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class AcademicDegreeApiClient extends BaseApiClient {
  factory AcademicDegreeApiClient(Dio dio, {String? baseUrl}) = _AcademicDegreeApiClient;

  @GET('academic-degrees/')
  Future<List<AcademicDegree>> getAcademicDegrees(@Queries() Map<String, dynamic>? queries);
}
