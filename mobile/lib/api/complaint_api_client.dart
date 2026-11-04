import 'dart:io';
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/complaint.dart';
import '../models/paginated_response.dart';

part 'complaint_api_client.g.dart';

@RestApi()
abstract class ComplaintApiClient {
  factory ComplaintApiClient(Dio dio, {String baseUrl}) = _ComplaintApiClient;

  @GET('complaints/')
  Future<PaginatedResponse<Complaint>> getAll({
    @Query('search') String? search,
    @Query('status') String? status,
    @Query('priority') String? priority,
    @Query('page') int? page,
    @Query('page_size') int? pageSize,
  });

  @GET('complaints/{id}/')
  Future<Complaint> getById(@Path('id') int id);

  @POST('complaints/')
  @MultiPart()
  Future<Complaint> create({
    @Part(name: 'subject') required String subject,
    @Part(name: 'description') required String description,
    @Part(name: 'priority') String? priority,
    @Part(name: 'category') String? category,
    @Part(name: 'attachment') File? attachment,
  });

  @PATCH('complaints/{id}/')
  @MultiPart()
  Future<Complaint> update(
    @Path('id') int id, {
    @Part(name: 'subject') String? subject,
    @Part(name: 'description') String? description,
    @Part(name: 'priority') String? priority,
    @Part(name: 'category') String? category,
    @Part(name: 'attachment') File? attachment,
    @Part(name: 'status') String? status,
  });

  @DELETE('complaints/{id}/')
  Future<void> delete(@Path('id') int id);

  @POST('complaints/{id}/resolve/')
  Future<Complaint> resolve(
    @Path('id') int id,
    @Field('admin_response') String adminResponse,
  );

  @POST('complaints/{id}/add_response/')
  Future<Complaint> addResponse(
    @Path('id') int id,
    @Field('response') String response,
  );

  @GET('complaints/stats/')
  Future<dynamic> getStats();
}
