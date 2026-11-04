import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/post.dart';
import '../models/paginated_response.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'post_api_client.g.dart';

/// Post API Client
/// Handles post/news operations
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class PostApiClient extends BaseApiClient {
  factory PostApiClient(Dio dio, {String? baseUrl}) = _PostApiClient;

  /// Get paginated list of posts
  @GET('posts/')
  Future<PaginatedResponse<Post>> getPosts(@Queries() Map<String, dynamic>? queries);

  /// Get a single post by ID
  @GET('posts/{id}/')
  Future<Post> getPost(@Path('id') int id);

  /// Get featured posts
  @GET('posts/featured/')
  Future<PaginatedResponse<Post>> getFeaturedPosts(@Queries() Map<String, dynamic>? queries);

  /// Get posts by type
  @GET('posts/by_type/')
  Future<PaginatedResponse<Post>> getPostsByType(@Queries() Map<String, dynamic>? queries);

  /// Increment view count
  @POST('posts/{id}/increment_views/')
  Future<void> incrementViews(@Path('id') int id);
}
