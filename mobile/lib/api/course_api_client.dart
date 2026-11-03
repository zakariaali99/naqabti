import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/course.dart';
import '../models/paginated_response.dart';
import 'base_api_client.dart';

part 'course_api_client.g.dart';

@RestApi()
abstract class CourseApiClient extends BaseApiClient {
  factory CourseApiClient(Dio dio, {String? baseUrl}) = _CourseApiClient;

  @GET('professional-development/')
  Future<PaginatedResponse<Course>> getCourses(
    @Queries() Map<String, dynamic> queries,
  );

  @GET('professional-development/{id}/')
  Future<Course> getCourse(@Path("id") int id);

  @POST('professional-development/{id}/register/')
  Future<void> enroll(@Path("id") int id);
}
