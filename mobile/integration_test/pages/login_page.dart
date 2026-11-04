// Login Page Object for E2E Tests
//
// This file contains the LoginPage object with methods to interact
// with the login page elements.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Page Object for Login Page
class LoginPagePOM {
  // ==================== Finders ====================
  
  /// Username text field
  static Finder get usernameField => find.byType(TextFormField).first;
  
  /// Password text field  
  static Finder get passwordField => find.byType(TextFormField).at(1);
  
  /// Login button
  static Finder get loginButton => find.byType(FilledButton);
  
  /// Login button with specific text
  static Finder get loginButtonWithText => find.widgetWithText(FilledButton, 'Sign In');
  
  /// Forgot password link
  static Finder get forgotPasswordLink => find.byWidgetPredicate((widget) {
    if (widget is TextButton && widget.child is Text) {
      final label = (widget.child as Text).data ?? '';
      return label.toLowerCase().contains('forgot');
    }
    return false;
  });
  
  /// Register link / Sign Up button
  static Finder get registerLink => find.byWidgetPredicate((widget) {
    if (widget is TextButton && widget.child is Text) {
      final label = (widget.child as Text).data ?? '';
      return label.toLowerCase().contains('sign up') || label.toLowerCase().contains('register');
    }
    return false;
  });
  
  /// Password visibility toggle
  static Finder get passwordVisibilityToggle => find.descendant(
    of: passwordField,
    matching: find.byType(IconButton),
  ).first;

  /// Theme toggle button (light/dark)
  static Finder get topCornerThemeToggleButton {
    final darkInAppBar = find.descendant(
      of: find.byType(Scaffold),
      matching: find.byIcon(Icons.dark_mode),
    );
    if (darkInAppBar.evaluate().isNotEmpty) return darkInAppBar;

    final lightInAppBar = find.descendant(
      of: find.byType(Scaffold),
      matching: find.byIcon(Icons.light_mode),
    );
    return lightInAppBar;
  }

  /// Theme toggle button (fallback finder)
  static Finder get themeToggleButton =>
      topCornerThemeToggleButton.evaluate().isNotEmpty
          ? topCornerThemeToggleButton
          : (find.byIcon(Icons.dark_mode).evaluate().isNotEmpty
                ? find.byIcon(Icons.dark_mode)
                : find.byIcon(Icons.light_mode));
  
  /// Loading indicator (shown during login)
  static Finder get loadingIndicator => find.byType(CircularProgressIndicator);
  
  /// Snackbar (for error/success messages)
  static Finder get snackbar => find.byType(SnackBar);
  
  // ==================== Actions ====================
  
  /// Enter username
  static Future<void> enterUsername(WidgetTester tester, String username) async {
    await tester.ensureVisible(usernameField);
    await tester.enterText(usernameField, username);
    await tester.pump();
  }
  
  /// Enter password
  static Future<void> enterPassword(WidgetTester tester, String password) async {
    await tester.ensureVisible(passwordField);
    await tester.enterText(passwordField, password);
    await tester.pump();
  }
  
  /// Tap login button
  static Future<void> tapLoginButton(WidgetTester tester) async {
    await tester.ensureVisible(loginButton);
    await tester.tap(loginButton);
    await tester.pumpAndSettle();
  }
  
  /// Toggle password visibility
  static Future<void> togglePasswordVisibility(WidgetTester tester) async {
    await tester.ensureVisible(passwordVisibilityToggle);
    await tester.tap(passwordVisibilityToggle);
    await tester.pump();
  }
  
  /// Tap forgot password link
  static Future<void> tapForgotPassword(WidgetTester tester) async {
    await tester.ensureVisible(forgotPasswordLink);
    await tester.tap(forgotPasswordLink);
    await tester.pumpAndSettle();
  }
  
  /// Tap register link
  static Future<void> tapRegisterLink(WidgetTester tester) async {
    await tester.ensureVisible(registerLink);
    await tester.tap(registerLink);
    await tester.pumpAndSettle();
  }

  /// Tap theme toggle button
  static Future<void> tapThemeToggleButton(WidgetTester tester) async {
    await tester.ensureVisible(topCornerThemeToggleButton);
    await tester.tap(topCornerThemeToggleButton);
    await tester.pumpAndSettle();
  }
  
  // ==================== Verifications ====================
  
  /// Verify login page is displayed
  static void verifyLoginPageDisplayed(WidgetTester tester) {
    expect(find.byType(Scaffold), findsOneWidget);
    expect(usernameField, findsOneWidget);
    expect(passwordField, findsOneWidget);
    expect(loginButton, findsOneWidget);
  }
  
  /// Verify login button is enabled (not loading)
  static void verifyLoginButtonEnabled(WidgetTester tester) {
    final FilledButton button = tester.widget(loginButton);
    expect(button.onPressed, isNotNull);
  }
  
  /// Verify login button is disabled (loading)
  static void verifyLoginButtonDisabled(WidgetTester tester) {
    expect(loadingIndicator, findsOneWidget);
  }
  
  /// Verify error snackbar is displayed
  static void verifyErrorSnackbarDisplayed(WidgetTester tester) {
    expect(snackbar, findsOneWidget);
  }
  
  /// Verify login successful (navigated to home)
  static Future<bool> verifyLoginSuccess(WidgetTester tester) async {
    // Wait for navigation
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    // Check if we're on home page by looking for home-specific elements
    // The home page has BottomBar with navigation
    final hasBottomBar = find.byType(BottomNavigationBar).evaluate().isNotEmpty ||
        find.byType(TabBar).evaluate().isNotEmpty;
    
    return hasBottomBar;
  }
  
  /// Fill login form and submit
  static Future<void> login(WidgetTester tester, String username, String password) async {
    await enterUsername(tester, username);
    await enterPassword(tester, password);
    await tapLoginButton(tester);
  }
}
