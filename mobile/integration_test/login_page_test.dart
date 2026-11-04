import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:naqabti/main.dart' as app;

import 'package:naqabti/pages/auth/login_page.dart';
import 'pages/login_page.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> launchApp(WidgetTester tester) async {
    // Reset GetX for a clean state
    Get.reset();
    SharedPreferences.setMockInitialValues({});
    
    // Start the app
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 5));
    
    // Navigate to login
    Get.offAllNamed('/login');
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }

  group('Login Page E2E Tests', () {
    testWidgets('Verification of UI elements on Login Page', (WidgetTester tester) async {
      await launchApp(tester);

      // Verify basic UI elements
      LoginPagePOM.verifyLoginPageDisplayed(tester);
      
      // Verify logo visibility
      expect(find.byType(Image), findsWidgets);
      
      // Verify AppBar theme toggle
      expect(LoginPagePOM.themeToggleButton, findsOneWidget);
    });

    testWidgets('Form validation behavior', (WidgetTester tester) async {
      await launchApp(tester);

      // 1. Empty credentials
      await LoginPagePOM.tapLoginButton(tester);
      await tester.pump();
      expect(find.textContaining('Please enter'), findsWidgets);

      // 2. Short password validation
      await LoginPagePOM.enterUsername(tester, 'testuser');
      await LoginPagePOM.enterPassword(tester, '123');
      await LoginPagePOM.tapLoginButton(tester);
      await tester.pump();
      expect(find.textContaining('6 characters'), findsOneWidget);
    });

    testWidgets('Password visibility toggle correctly switches state', (WidgetTester tester) async {
      await launchApp(tester);

      // Enter a password
      await LoginPagePOM.enterPassword(tester, 'password123');
      
      // Initial state icon
      expect(find.byIcon(Icons.visibility), findsOneWidget);
      
      // Toggle
      await LoginPagePOM.togglePasswordVisibility(tester);
      await tester.pump();
      
      // Should now show visibility_off
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
      
      // Toggle back
      await LoginPagePOM.togglePasswordVisibility(tester);
      await tester.pump();
      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('Navigation links from login page work', (WidgetTester tester) async {
      await launchApp(tester);

      // 1. Forgot password navigation
      await LoginPagePOM.tapForgotPassword(tester);
      await tester.pumpAndSettle();
      expect(Get.currentRoute, '/forgot-password');

      // Go back
      Get.back();
      await tester.pumpAndSettle();

      // 2. Register link navigation
      await LoginPagePOM.tapRegisterLink(tester);
      await tester.pumpAndSettle();
      expect(Get.currentRoute, '/register');
    });

    testWidgets('Theme toggle switches application brightness', (WidgetTester tester) async {
      await launchApp(tester);
      
      final initialBrightness = Theme.of(tester.element(find.byType(LoginPage))).brightness;
      
      // Tap theme toggle
      await LoginPagePOM.tapThemeToggleButton(tester);
      await tester.pumpAndSettle();
      
      final newBrightness = Theme.of(tester.element(find.byType(Scaffold).first)).brightness;
      expect(newBrightness, isNot(initialBrightness));
    });

    testWidgets('Login attempt shows loading indicator', (WidgetTester tester) async {
      await launchApp(tester);

      // Enter valid-looking credentials
      await LoginPagePOM.enterUsername(tester, 'testuser');
      await LoginPagePOM.enterPassword(tester, 'password123');

      // Tap login (don't use tapLoginButton helper with pumpAndSettle because it might wait forever)
      await tester.tap(LoginPagePOM.loginButton);
      
      // Start pump to trigger loading
      await tester.pump();
      
      // Verify loading indicator is visible
      expect(LoginPagePOM.loadingIndicator, findsOneWidget);
    });
  });
}
