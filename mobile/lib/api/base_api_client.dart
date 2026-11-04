import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'base_api_client.g.dart';

/// Base API client with JWT authentication support
/// All other API clients should extend this class
@RestApi()
abstract class BaseApiClient {
  factory BaseApiClient(Dio dio, {String? baseUrl}) = _BaseApiClient;
}
