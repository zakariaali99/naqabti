import 'dart:io';
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/library_item.dart';
import '../models/paginated_response.dart';

part 'library_api_client.g.dart';

@RestApi()
abstract class LibraryApiClient {
  factory LibraryApiClient(Dio dio, {String baseUrl}) = _LibraryApiClient;

  @GET('library/')
  Future<PaginatedResponse<LibraryItem>> getAll({
    @Query('search') String? search,
    @Query('item_type') String? itemType,
    @Query('category') String? category,
    @Query('page') int? page,
    @Query('page_size') int? pageSize,
  });

  @GET('library/{id}/')
  Future<LibraryItem> getById(@Path('id') int id);

  @POST('library/')
  @MultiPart()
  Future<LibraryItem> create({
    @Part(name: 'title') required String title,
    @Part(name: 'description') String? description,
    @Part(name: 'category') String? category,
    @Part(name: 'item_type') required String itemType,
    @Part(name: 'file') File? file,
    @Part(name: 'external_link') String? externalLink,
    @Part(name: 'thumbnail') File? thumbnail,
    @Part(name: 'author_name') String? authorName,
    @Part(name: 'publication_year') int? publicationYear,
    @Part(name: 'is_public') bool? isPublic,
  });

  @PATCH('library/{id}/')
  @MultiPart()
  Future<LibraryItem> update(
    @Path('id') int id, {
    @Part(name: 'title') String? title,
    @Part(name: 'description') String? description,
    @Part(name: 'category') String? category,
    @Part(name: 'item_type') String? itemType,
    @Part(name: 'file') File? file,
    @Part(name: 'external_link') String? externalLink,
    @Part(name: 'thumbnail') File? thumbnail,
    @Part(name: 'author_name') String? authorName,
    @Part(name: 'publication_year') int? publicationYear,
    @Part(name: 'is_public') bool? isPublic,
  });

  @DELETE('library/{id}/')
  Future<void> delete(@Path('id') int id);

  @POST('library/{id}/increment_download/')
  Future<dynamic> incrementDownload(@Path('id') int id);

  @POST('library/{id}/increment_view/')
  Future<dynamic> incrementView(@Path('id') int id);

  @GET('library/stats/')
  Future<dynamic> getStats();
}
