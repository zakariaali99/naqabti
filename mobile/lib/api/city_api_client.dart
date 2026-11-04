import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/city.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'city_api_client.g.dart';

/// City API Client
/// Handles city CRUD operations
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class CityApiClient extends BaseApiClient {
  factory CityApiClient(Dio dio, {String? baseUrl}) = _CityApiClient;

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
}
