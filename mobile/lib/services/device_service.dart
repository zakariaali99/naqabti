import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'api_service.dart';

/// Device Service
/// Manages device FCM token registration and updates
class DeviceService extends GetxService {
  final ApiService _apiService = Get.find<ApiService>();

  Future<DeviceService> init() async {
    return this;
  }

  /// Submit FCM token to backend
  /// 
  /// This method registers or updates the device FCM token.
  /// It uses the register_or_update endpoint which handles both
  /// new registrations and updates to existing tokens.
  /// 
  /// [fcmToken] - The Firebase Cloud Messaging token
  /// [extraData] - Optional additional device information (platform, version, etc.)
  Future<void> submitFcmToken(
    String fcmToken, {
    Map<String, dynamic>? extraData,
  }) async {
    try {
      final data = {
        'fcm_token': fcmToken,
        if (extraData != null) 'extra_data': extraData,
      };

      await _apiService.device.registerOrUpdateDevice(data);
      
      debugPrint('FCM token registered successfully: ${fcmToken.substring(0, 20)}...');
    } catch (e) {
      debugPrint('Error submitting FCM token: $e');
      rethrow;
    }
  }

  /// Get all devices for the current user
  Future<List<dynamic>> getDevices() async {
    try {
      final devices = await _apiService.device.getDevices(null);
      return devices;
    } catch (e) {
      debugPrint('Error fetching devices: $e');
      rethrow;
    }
  }

  /// Delete a device by ID
  Future<void> deleteDevice(int deviceId) async {
    try {
      await _apiService.device.deleteDevice(deviceId);
      debugPrint('Device deleted successfully: $deviceId');
    } catch (e) {
      debugPrint('Error deleting device: $e');
      rethrow;
    }
  }
}
