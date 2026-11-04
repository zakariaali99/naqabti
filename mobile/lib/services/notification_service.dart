import 'dart:convert';
import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:logger/logger.dart';
import '../firebase_options.dart';
import 'api_service.dart';
import 'auth_service.dart';
import 'device_service.dart';
import '../routes/app_routes.dart';

class NotificationService extends GetxService {
  final _logger = Logger();
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final _apiService = Get.find<ApiService>();
  late FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin;
  
  final RxInt _unreadCount = 0.obs;
  int get unreadCount => _unreadCount.value;

  DateTime? _lastDecrementTime;

  void _guardAgainstStaleRefresh() {
    if (_lastDecrementTime != null &&
        DateTime.now().difference(_lastDecrementTime!) < const Duration(seconds: 2)) {
      _lastDecrementTime = null;
      throw Exception('stale refresh ignored');
    }
  }

  Future<NotificationService> init() async {
    // Initialize local notifications
    await _initializeLocalNotifications();

    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Initialize listeners
    _setupListeners();
    
    // Initialize FCM
    await _initializeFCM();

    // Fetch initial unread count
    fetchUnreadCount();

    return this;
  }

  Future<void> fetchUnreadCount() async {
    // Don't make an authenticated request when there's no session to
    // authenticate with (logged out / before login). The auth interceptor
    // handles the normal expired-access-token case via refresh.
    if (!Get.find<AuthService>().hasToken) {
      _unreadCount.value = 0;
      return;
    }
    try {
      final response = await _apiService.notification.getUnreadCount();
      _guardAgainstStaleRefresh();
      _unreadCount.value = response.unreadCount;
    } catch (e) {
      if (e is Exception && e.toString().contains('stale refresh')) return;
      _logger.e('Failed to fetch notifications count: $e');
    }
  }
  
  void updateUnreadCount(int count) {
    _unreadCount.value = count;
  }
  
  void decrementUnreadCount() {
    if (_unreadCount.value > 0) {
      _unreadCount.value--;
      _lastDecrementTime = DateTime.now();
    }
  }

  Future<void> requestPermission() async {
    // Request permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    _logger.i('User granted permission: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM Token
      String? token = await _messaging.getToken();
      _logger.i('FCM Token: $token');
    }
  }

  void _setupListeners() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _logger.i('Got a message whilst in the foreground!');
      _logger.i('Message data: ${message.data}');

      if (message.notification != null) {
        _logger.i(
          'Message also contained a notification: ${message.notification}',
        );

        // Show a snackbar or dialog
        Get.snackbar(
          message.notification?.title ?? 'Notification',
          message.notification?.body ?? '',
          snackPosition: SnackPosition.TOP,
          backgroundColor: Get.theme.colorScheme.primaryContainer,
          colorText: Get.theme.colorScheme.onPrimaryContainer,
        );

        // Show local notification as well to ensure it appears in system tray
        _showLocalNotification(message);
        
        // Refresh count
        fetchUnreadCount();
      }
    });

    // Handle message opened app
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTapRemote);
  }

  @pragma('vm:entry-point')
  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    Logger().i("Handling a background message: ${message.messageId}");
    
    // Display notification using local notifications
    if (message.notification != null) {
      final notificationPlugin = FlutterLocalNotificationsPlugin();
      await _showLocalNotificationStatic(message, notificationPlugin);
    }
  }

  Future<void> _initializeLocalNotifications() async {
    _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
    
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );
    
    await _flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: _handleNotificationTap,
    );
  }

  void _handleNotificationTap(NotificationResponse notificationResponse) {
    _logger.i('Notification tapped: ${notificationResponse.payload}');
    
    final payloadString = notificationResponse.payload;
    if (payloadString == null) return;

    try {
      final Map<String, dynamic> data = jsonDecode(payloadString);
      final int? notificationId = int.tryParse(data['notification_id']?.toString() ?? '');
      final String? contentType = data['content_type']?.toString();
      final int? objectId = int.tryParse(data['object_id']?.toString() ?? '');

      _navigateToNotificationTarget(
        notificationId: notificationId,
        contentType: contentType,
        objectId: objectId,
      );
    } catch (e) {
      // Fallback for old simple payloads
      final int? id = int.tryParse(payloadString);
      Get.toNamed(
        Routes.notificationDetail,
        arguments: {'id': id},
      );
    }
  }

  void _handleNotificationTapRemote(RemoteMessage message) {
    _logger.i('Remote notification tapped: ${message.data}');
    
    final int? notificationId = int.tryParse(message.data['notification_id']?.toString() ?? '');
    final String? contentType = message.data['content_type']?.toString();
    final int? objectId = int.tryParse(message.data['object_id']?.toString() ?? '');

    _navigateToNotificationTarget(
      notificationId: notificationId,
      contentType: contentType,
      objectId: objectId,
    );
  }

  void _navigateToNotificationTarget({
    int? notificationId,
    String? contentType,
    int? objectId,
  }) {
    if (contentType == 'post' || contentType == 'news') {
      Get.toNamed(Routes.news, arguments: {'id': objectId});
    } else if (contentType == 'payment') {
      Get.toNamed(Routes.payments, arguments: {'id': objectId});
    } else if (contentType == 'membership' || contentType == 'doctors_membership') {
      Get.toNamed(Routes.memberships, arguments: {'id': objectId});
    } else {
      Get.toNamed(
        Routes.notificationDetail,
        arguments: {'id': notificationId},
      );
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    await _showLocalNotificationStatic(message, _flutterLocalNotificationsPlugin);
  }

  static Future<void> _showLocalNotificationStatic(RemoteMessage message, FlutterLocalNotificationsPlugin plugin) async {
    final notification = message.notification;
    
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'high_importance_channel',
      'High Importance Notifications',
      channelDescription: 'This channel is used for important notifications.',
      importance: Importance.max,
      priority: Priority.defaultPriority,
      showWhen: true,
      enableVibration: true,
      autoCancel: true,
      ongoing: false,
    );
    
    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );
    
    final payload = jsonEncode({
      'notification_id': message.data['notification_id'],
      'content_type': message.data['content_type'],
      'object_id': message.data['object_id'],
    });

    final databaseId = int.tryParse(message.data['notification_id']?.toString() ?? '');
    final notificationId = databaseId ?? message.hashCode;

    await plugin.show(
      id: notificationId,
      title: notification?.title ?? 'Notification',
      body: notification?.body ?? '',
      notificationDetails: platformChannelSpecifics,
      payload: payload,
    );
  }

  Future<void> deleteNotification(int id) async {
    try {
      // Call API to delete/cancel on server
      await _apiService.notification.cancelNotification(id);
      
      // Dismiss local notification if visible
      await _flutterLocalNotificationsPlugin.cancel(id: id);
      
      // Update unread count
      fetchUnreadCount();
      
      _logger.i('Notification $id deleted/cancelled successfully');
    } catch (e) {
      _logger.e('Failed to delete notification $id: $e');
    }
  }

  Future<void> clearAllNotifications() async {
    try {
      // Dismiss all local notifications
      await _flutterLocalNotificationsPlugin.cancelAll();
      _logger.i('All local notifications cleared');
    } catch (e) {
      _logger.e('Failed to clear all local notifications: $e');
    }
  }

  Future<void> _initializeFCM() async {
    final deviceService = Get.find<DeviceService>();

    try {
      // Request permission for iOS
      if (Platform.isIOS) {
        NotificationSettings settings = await _messaging.requestPermission(
          alert: true,
          badge: true,
          sound: true,
        );
        _logger.i('User granted permission: ${settings.authorizationStatus}');
      }

      // Get FCM token
      String? token = await _messaging.getToken();
      
      if (token != null) {
        _logger.i('FCM Token: ${token.substring(0, 20)}...');
        
        try {
          await deviceService.submitFcmToken(
            token,
            extraData: {
              'platform': Platform.isAndroid ? 'android' : 'ios',
              'app_version': '1.0.0',
            },
          );
          
          await _messaging.subscribeToTopic('general');
          _logger.i('Subscribed to general topic');
        } catch (e) {
          _logger.w('Failed to submit FCM token: $e');
        }
      } else {
        _logger.w('Failed to get FCM token');
      }

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) async {
        _logger.i('FCM Token refreshed: ${newToken.substring(0, 20)}...');
        try {
          await deviceService.submitFcmToken(
            newToken,
            extraData: {
              'platform': Platform.isAndroid ? 'android' : 'ios',
              'app_version': '1.0.0',
            },
          );
        } catch (e) {
          _logger.w('Failed to submit refreshed FCM token: $e');
        }
      });
    } catch (e) {
      _logger.e('Error initializing FCM: $e');
    }
  }
}
