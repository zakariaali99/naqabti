import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'fixtures.dart';

/// Answers every API request with [MockData] so the real pages render without a backend.
class MockApiInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final data = options.method == 'GET'
        ? _get(options.path, options.queryParameters)
        : <String, dynamic>{};
    handler.resolve(Response(requestOptions: options, statusCode: 200, data: data));
  }

  Object _get(String path, Map<String, dynamic> query) {
    switch (path) {
      case 'users/me/':
        return MockData.user;
      case 'notifications/unread_count/':
        return {'unread_count': 3};
      case 'notifications/':
        return MockData.paginated(MockData.notifications);
      case 'memberships/':
        return MockData.paginated(MockData.memberships);
      case 'membership-types/':
        return MockData.paginated([MockData.membershipType]);
      case 'payments/':
        return MockData.paginated(MockData.payments);
      case 'certifications/':
        return MockData.paginated(MockData.certifications);
      case 'professional-development/':
        return MockData.paginated(MockData.courses);
      case 'complaints/':
        return MockData.paginated(MockData.complaints);
      case 'posts/':
      case 'posts/featured/':
      case 'posts/by_type/':
        return MockData.paginated(MockData.posts(query['post_type'] as String?));
      case 'cities/':
        return [MockData.city];
      case 'nationalities/':
      case 'academic-degrees/':
        return [];
    }
    debugPrint('MockApiInterceptor: no fixture for GET $path');
    return MockData.paginated([]);
  }
}
