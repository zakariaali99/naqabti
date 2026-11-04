// E2E Test Configuration
// 
// This file contains shared test configuration and utilities for E2E tests.
// Run tests with: flutter test integration_test/
//
// Note: Before running tests, add integration_test to pubspec.yaml:
// dev_dependencies:
//   integration_test:
//     sdk: flutter

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Test configuration constants
class TestConfig {
  // API Base URL - update for your environment
  static const String apiBaseUrl = 'http://localhost:8000/api';
  
  // Test user credentials
  static const String testUsername = 'testuser';
  static const String testPassword = 'testpassword123';
  
  // Test timeouts
  static const Duration defaultTimeout = Duration(seconds: 10);
  static const Duration animationTimeout = Duration(seconds: 2);
  
  // Wait durations
  static const Duration shortWait = Duration(milliseconds: 500);
  static const Duration mediumWait = Duration(seconds: 1);
  static const Duration longWait = Duration(seconds: 3);
}

/// Custom matchers for E2E testing
extension WidgetTesterExtensions on WidgetTester {
  /// Wait for animation to complete
  Future<void> waitForAnimation() async {
    await pump(TestConfig.animationTimeout);
  }
  
  /// Find and tap a widget with key
  Future<void> tapByKey(String key, {bool warnIfMissed = true}) async {
    final finder = find.byKey(Key(key));
    await tap(finder, warnIfMissed: warnIfMissed);
    await pump();
  }
  
  /// Find and enter text in a widget with key
  Future<void> enterTextByKey(String key, String text) async {
    final finder = find.byKey(Key(key));
    await enterText(finder, text);
    await pump();
  }
}
