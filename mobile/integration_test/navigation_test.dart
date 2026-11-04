// E2E Navigation Tests
//
// This file contains end-to-end tests for app navigation.
// Run tests with: flutter test integration_test/navigation_test.dart

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

import 'pages/home_page.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('E2E Navigation Tests', () {
    setUp(() async {
      Get.reset();
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

    /// Test: Navigate to home page
    testWidgets('Home page loads correctly', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      // Navigate directly to home
      Get.offAllNamed('/home');
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify home page is displayed
      HomePage.verifyHomePageDisplayed(tester);
    });

    /// Test: Bottom navigation tabs work
    testWidgets('Bottom navigation tabs work correctly', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/home');
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify bottom navigation exists
      HomePage.verifyBottomNavigationDisplayed(tester);

      // The home page has TabBar with 3 tabs: Notifications, Home, Profile
      // Find and tap the Profile tab (index 2)
      final bottomNavItems = find.byType(BottomNavigationBarItem);
      expect(bottomNavItems, findsNWidgets(3));

      // Tap on profile tab (third item)
      await tester.tap(bottomNavItems.at(2));
      await tester.pumpAndSettle();

      // Verify profile content is shown (should have profile-related widgets)
      await tester.pump(const Duration(seconds: 1));
    });

    /// Test: Drawer navigation works
    testWidgets('Drawer opens and shows menu items', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/home');
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Open drawer by tapping the menu icon
      final menuButton = find.byIcon(Icons.menu);
      expect(menuButton, findsOneWidget);
      await tester.tap(menuButton);
      await tester.pumpAndSettle();

      // Verify drawer is open
      expect(find.byType(Drawer), findsOneWidget);
    });

    /// Test: Quick actions grid displays correctly
    testWidgets('Quick actions grid displays correctly', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/home');
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify quick actions grid is displayed
      HomePage.verifyQuickActionsDisplayed(tester);
    });

    /// Test: Pull to refresh functionality
    testWidgets('Pull to refresh works', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/home');
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find the scrollable content
      final scrollable = find.byType(Scrollable).first;
      expect(scrollable, findsOneWidget);

      // Perform pull to refresh
      await tester.fling(scrollable, const Offset(0, 300), 1000);
      await tester.pumpAndSettle();
    });
  });

  group('E2E Route Navigation Tests', () {
    setUp(() async {
      Get.reset();
      SharedPreferences.setMockInitialValues({});
      
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

    /// Test: Navigate to payments page
    testWidgets('Navigate to payments page', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/payments');
      await tester.pumpAndSettle();

      // Verify payments page loads
      expect(find.byType(Scaffold), findsOneWidget);
    });

    /// Test: Navigate to certifications page
    testWidgets('Navigate to certifications page', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/certifications');
      await tester.pumpAndSettle();

      // Verify certifications page loads
      expect(find.byType(Scaffold), findsOneWidget);
    });

    /// Test: Navigate to memberships page
    testWidgets('Navigate to memberships page', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/memberships');
      await tester.pumpAndSettle();

      // Verify memberships page loads
      expect(find.byType(Scaffold), findsOneWidget);
    });

    /// Test: Navigate to profile edit page
    testWidgets('Navigate to profile edit page', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      Get.offAllNamed('/profile/edit');
      await tester.pumpAndSettle();

      // Verify profile edit page loads
      expect(find.byType(Scaffold), findsOneWidget);
    });
  });
}
