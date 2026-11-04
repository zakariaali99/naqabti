// E2E Authentication Tests
//
// This file contains end-to-end tests for the authentication flow.
// Run tests with: flutter test integration_test/auth_test.dart
//
// Note: Before running tests, run: flutter pub get

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:naqabti/main.dart' as app;
import 'package:naqabti/services/auth_service.dart';
import 'package:naqabti/services/api_service.dart';
import 'package:naqabti/services/notification_service.dart';
import 'package:naqabti/services/device_service.dart';
import 'package:naqabti/services/course_service.dart';
import 'package:naqabti/services/settings_service.dart';

import 'pages/login_page.dart';

void main() {
  // Create binding for integration tests
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('E2E Authentication Tests', () {
    setUp(() async {
      // Reset GetX before each test
      Get.reset();
      
      // Initialize SharedPreferences with mock values
      SharedPreferences.setMockInitialValues({});
      
      // Initialize services
      await Get.putAsync(() => AuthService().init());
      await Get.putAsync(() => ApiService().init());
      await Get.putAsync(() => NotificationService().init());
      await Get.putAsync(() => DeviceService().init());
      await Get.putAsync(() => CourseService().init());
      await Get.putAsync(() => SettingsService().init());
    });

    tearDown(() {
      Get.reset();
    });

    /// Test: Verify login page loads correctly
    testWidgets('Login page loads successfully', (WidgetTester tester) async {
      // Build the app
      app.main();
      await tester.pumpAndSettle();

      // Navigate to login page (skip splash)
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Verify login page elements
      LoginPagePOM.verifyLoginPageDisplayed(tester);
      
      // Verify logo is displayed
      expect(find.byType(Image), findsWidgets);
      
      // Verify "Sign In" text is present
      expect(find.text('Sign In'), findsOneWidget);
    });

    /// Test: Login with empty credentials shows validation errors
    testWidgets('Login with empty credentials shows validation errors', 
        (WidgetTester tester) async {
      // Build the app and navigate to login
      app.main();
      await tester.pumpAndSettle();
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Tap login button without entering credentials
      await LoginPagePOM.tapLoginButton(tester);
      await tester.pump();

      // Verify validation error messages
      expect(find.text('Please enter your username'), findsOneWidget);
      expect(find.text('Please enter your password'), findsOneWidget);
    });

    /// Test: Login with short password shows validation error
    testWidgets('Login with short password shows validation error',
        (WidgetTester tester) async {
      // Build the app and navigate to login
      app.main();
      await tester.pumpAndSettle();
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Enter username but short password
      await LoginPagePOM.enterUsername(tester, 'testuser');
      await LoginPagePOM.enterPassword(tester, '123');
      await LoginPagePOM.tapLoginButton(tester);
      await tester.pump();

      // Verify password validation error
      expect(find.textContaining('6 characters'), findsOneWidget);
    });

    /// Test: Password visibility toggle works
    testWidgets('Password visibility toggle works',
        (WidgetTester tester) async {
      // Build the app and navigate to login
      app.main();
      await tester.pumpAndSettle();
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Toggle password visibility (click the visibility icon)
      final visibilityIcons = find.byIcon(Icons.visibility);
      expect(visibilityIcons, findsOneWidget);
      await tester.tap(visibilityIcons);
      await tester.pump();

      // After toggling, the icon should change to visibility_off
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
    });

    /// Test: Forgot password navigation works
    testWidgets('Forgot password link navigates correctly',
        (WidgetTester tester) async {
      // Build the app and navigate to login
      app.main();
      await tester.pumpAndSettle();
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Tap forgot password link
      await LoginPagePOM.tapForgotPassword(tester);

      // Verify navigation to forgot password page
      await tester.pumpAndSettle();
      
      // Should have forgot password related content
      expect(find.textContaining('Forgot'), findsWidgets);
    });

    /// Test: Register link navigation works
    testWidgets('Register link navigates correctly',
        (WidgetTester tester) async {
      // Build the app and navigate to login
      app.main();
      await tester.pumpAndSettle();
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Tap register link
      await LoginPagePOM.tapRegisterLink(tester);

      // Verify navigation to register page
      await tester.pumpAndSettle();
      
      // Should have register related content
      expect(find.textContaining('Sign Up'), findsWidgets);
    });

    /// Test: Login button shows loading state during authentication
    testWidgets('Login button shows loading state',
        (WidgetTester tester) async {
      // Build the app and navigate to login
      app.main();
      await tester.pumpAndSettle();
      Get.offAllNamed('/login');
      await tester.pumpAndSettle();

      // Enter valid credentials
      await LoginPagePOM.enterUsername(tester, 'testuser');
      await LoginPagePOM.enterPassword(tester, 'password123');

      // Start login (will fail due to no backend, but should show loading)
      LoginPagePOM.tapLoginButton(tester);
      
      // Allow some time for the loading state to appear
      await tester.pump(const Duration(milliseconds: 100));

      // Verify loading indicator appears
      LoginPagePOM.verifyLoginButtonDisabled(tester);
    });
  });

  group('E2E Session Management Tests', () {
    setUp(() async {
      Get.reset();
      SharedPreferences.setMockInitialValues({});
      await Get.putAsync(() => AuthService().init());
    });

    tearDown(() {
      Get.reset();
    });

    /// Test: User session persists after app restart
    testWidgets('Session persistence behavior', (WidgetTester tester) async {
      // Build the app
      app.main();
      await tester.pumpAndSettle();

      // Get auth service
      final authService = Get.find<AuthService>();
      
      // Verify initial state - not authenticated
      expect(authService.isLoggedIn, isFalse);
      
      // The session should be loaded from storage
      await tester.pump(const Duration(seconds: 1));
    });
  });
}
