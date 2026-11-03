import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/notification.dart';
import '../models/paginated_response.dart';
import 'base_api_client.dart';

part 'notification_api_client.g.dart';

/// Notification API Client
/// Handles notification operations
@RestApi()
abstract class NotificationApiClient extends BaseApiClient {
  factory NotificationApiClient(Dio dio, {String? baseUrl}) = _NotificationApiClient;

  @GET('notifications/')
  Future<PaginatedResponse<AppNotification>> getNotifications(@Queries() Map<String, dynamic>? queries);

  @GET('notifications/{id}/')
  Future<AppNotification> getNotification(@Path('id') int id);

  @POST('notifications/{id}/mark_as_read/')
  Future<AppNotification> markNotificationAsRead(@Path('id') int id);

  @POST('notifications/{id}/mark_as_unread/')
  Future<AppNotification> markNotificationAsUnread(@Path('id') int id);

  @POST('notifications/mark_all_as_read/')
  Future<void> markAllNotificationsAsRead();

  @POST('notifications/{id}/cancel/')
  Future<void> cancelNotification(@Path('id') int id);

  @GET('notifications/unread_count/')
  Future<UnreadCountResponse> getUnreadCount();
}
