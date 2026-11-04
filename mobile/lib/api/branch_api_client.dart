import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/branch.dart';
import '../models/paginated_response.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'branch_api_client.g.dart';

@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class BranchApiClient extends BaseApiClient {
  factory BranchApiClient(Dio dio, {String? baseUrl}) = _BranchApiClient;

  @GET('branches/')
  Future<PaginatedResponse<Branch>> getBranches(@Queries() Map<String, dynamic>? queries);

  @GET('branches/{id}/')
  Future<Branch> getBranch(@Path('id') int id);

  @POST('branches/')
  Future<Branch> createBranch(@Body() Map<String, dynamic> data);

  @PATCH('branches/{id}/')
  Future<Branch> updateBranch(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('branches/{id}/')
  Future<void> deleteBranch(@Path('id') int id);
}
