import 'package:get/get.dart';
import 'package:naqabti/services/notification_service.dart';

/// Stands in for [NotificationService], which needs Firebase (not configured on macOS).
class FakeNotificationService extends GetxService implements NotificationService {
  // Observable because HomePage reads it inside an Obx.
  final _unreadCount = 3.obs;

  @override
  int get unreadCount => _unreadCount.value;

  @override
  Future<void> fetchUnreadCount() async {}

  @override
  void updateUnreadCount(int count) {}

  @override
  void decrementUnreadCount() {}

  @override
  Future<void> requestPermission() async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}
