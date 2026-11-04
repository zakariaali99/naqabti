import 'package:flutter/material.dart';
import 'package:get/get.dart';

enum SnackKind { success, error, info }

/// In-app toasts on a solid background.
///
/// GetX's default snackbar background is 20% grey, so the page showed
/// through it and the text was hard to read. Every toast goes through here.
class AppSnackbar {
  AppSnackbar._();

  static const Color successColor = Color(0xFF2E7D32);
  static const Color errorColor = Color(0xFFC62828);
  static const Color infoColor = Color(0xFF1565C0);

  static Color colorFor(SnackKind kind) {
    switch (kind) {
      case SnackKind.success:
        return successColor;
      case SnackKind.error:
        return errorColor;
      case SnackKind.info:
        return infoColor;
    }
  }

  static IconData iconFor(SnackKind kind) {
    switch (kind) {
      case SnackKind.success:
        return Icons.check_circle_rounded;
      case SnackKind.error:
        return Icons.error_rounded;
      case SnackKind.info:
        return Icons.info_rounded;
    }
  }

  static void success(String title, String message) =>
      show(title, message, kind: SnackKind.success);

  static void error(String title, String message) =>
      show(title, message, kind: SnackKind.error);

  static void info(
    String title,
    String message, {
    IconData? icon,
    SnackPosition position = SnackPosition.BOTTOM,
  }) =>
      show(title, message, kind: SnackKind.info, icon: icon, position: position);

  static void show(
    String title,
    String message, {
    SnackKind kind = SnackKind.info,
    IconData? icon,
    SnackPosition position = SnackPosition.BOTTOM,
    Duration duration = const Duration(seconds: 3),
  }) {
    Get.snackbar(
      title,
      message,
      snackPosition: position,
      backgroundColor: colorFor(kind),
      colorText: Colors.white,
      icon: Icon(icon ?? iconFor(kind), color: Colors.white),
      shouldIconPulse: false,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
      duration: duration,
      isDismissible: true,
      boxShadows: const [
        BoxShadow(color: Color(0x40000000), blurRadius: 12, offset: Offset(0, 4)),
      ],
    );
  }
}
