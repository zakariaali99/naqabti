import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/nationality.dart';
import 'base_api_client.dart';

part 'nationality_api_client.g.dart';

@RestApi()
abstract class NationalityApiClient extends BaseApiClient {
  factory NationalityApiClient(Dio dio, {String? baseUrl}) = _NationalityApiClient;

  @GET('nationalities/')
  Future<List<Nationality>> getNationalities(@Queries() Map<String, dynamic>? queries);
}
