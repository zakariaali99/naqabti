import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'api_service.dart';
import '../models/course.dart';
import '../models/paginated_response.dart';

class CourseService extends GetxService {
  final ApiService _apiService = Get.find<ApiService>();

  Future<CourseService> init() async {
    return this;
  }

  Future<PaginatedResponse<Course>> getCourses({
    int page = 1,
    Map<String, dynamic>? queryParams,
  }) async {
    try {
      final queries = {
        'page': page,
        ...?queryParams,
      };
      return await _apiService.course.getCourses(queries);
    } catch (e) {
      debugPrint('Error fetching courses: $e');
      rethrow;
    }
  }

  Future<Course> getCourse(int id) async {
    try {
      return await _apiService.course.getCourse(id);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> enroll(int id) async {
    try {
      await _apiService.course.enroll(id);
    } catch (e) {
      rethrow;
    }
  }
}
