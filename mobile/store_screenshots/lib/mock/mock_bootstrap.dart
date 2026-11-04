import 'package:get/get.dart';
import 'package:naqabti/api/dio_client.dart';
import 'package:naqabti/services/api_service.dart';
import 'package:naqabti/services/auth_service.dart';
import 'package:naqabti/services/course_service.dart';
import 'package:naqabti/services/device_service.dart';
import 'package:naqabti/services/notification_service.dart';
import 'package:naqabti/services/settings_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'fake_notification_service.dart';
import 'mock_api_interceptor.dart';

/// Registers the app's real services on top of mock API responses and a signed-in session.
Future<void> setUpMockApp() async {
  // ignore: invalid_use_of_visible_for_testing_member
  SharedPreferences.setMockInitialValues({
    'access_token': 'mock',
    'refresh_token': 'mock',
  });
  DioClient.extraInterceptors.add(MockApiInterceptor());

  await Get.putAsync(() => AuthService().init());
  await Get.putAsync(() => ApiService().init());
  await Get.putAsync(() => DeviceService().init());
  Get.put<NotificationService>(FakeNotificationService());
  await Get.putAsync(() => CourseService().init());
  await Get.putAsync(() => SettingsService().init());
}
