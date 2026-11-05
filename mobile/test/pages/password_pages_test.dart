import 'package:dio/dio.dart' show DioException, RequestOptions, Response;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart' hide Response;
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:naqabti/pages/auth/forgot_password_page.dart';
import 'package:naqabti/pages/profile/change_password_page.dart';
import 'package:naqabti/services/auth_service.dart';

class FakeAuthService extends AuthService {
  int? resetUserId = 42;
  final List<String> calls = [];
  Object? confirmError;
  Object? changeError;

  @override
  Future<int?> requestPasswordReset(String email) async {
    calls.add('request:$email');
    return resetUserId;
  }

  @override
  Future<void> confirmPasswordReset(
      int userId, String code, String newPassword) async {
    calls.add('confirm:$userId:$code:$newPassword');
    if (confirmError != null) throw confirmError!;
  }

  @override
  Future<void> changePassword(String currentPassword, String newPassword) async {
    calls.add('change:$currentPassword:$newPassword');
    if (changeError != null) throw changeError!;
  }
}

DioException badRequest(String message, {List<String>? codes}) {
  final options = RequestOptions(path: 'auth/');
  return DioException(
    requestOptions: options,
    response: Response(
      requestOptions: options,
      statusCode: 400,
      data: {'error': message, if (codes != null) 'codes': codes},
    ),
  );
}

/// Opens [page] on top of a placeholder screen, like the app does, so a
/// `Get.back()` after success returns to something.
Future<void> open(WidgetTester tester, Widget page) async {
  await tester.pumpWidget(GetMaterialApp(
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    locale: const Locale('en'),
    home: const Scaffold(body: Text('previous screen')),
  ));
  Get.to(() => page);
  await tester.pumpAndSettle();
}

/// Lets any GetX snackbar finish its timer and animation.
Future<void> settleSnackbars(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 4));
  await tester.pumpAndSettle();
}

void main() {
  late FakeAuthService auth;

  setUp(() {
    Get.testMode = true;
    auth = FakeAuthService();
    Get.put<AuthService>(auth);
  });

  tearDown(Get.reset);

  group('ForgotPasswordPage', () {
    testWidgets('requests a code then resets with it', (tester) async {
      await open(tester, const ForgotPasswordPage());

      await tester.enterText(find.byType(TextFormField), 'doc@test.com');
      await tester.tap(find.text('Send Code'));
      await tester.pumpAndSettle();

      expect(auth.calls, ['request:doc@test.com']);
      expect(find.text('Verification code'), findsOneWidget);

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), '123456');
      await tester.enterText(fields.at(1), 'NewPass123');
      await tester.enterText(fields.at(2), 'NewPass123');
      await tester.ensureVisible(find.widgetWithText(FilledButton, 'Reset Password'));
      await tester.tap(find.widgetWithText(FilledButton, 'Reset Password'));
      await tester.pumpAndSettle();

      expect(auth.calls.last, 'confirm:42:123456:NewPass123');
      await settleSnackbars(tester);
      expect(find.text('previous screen'), findsOneWidget);
    });

    testWidgets('stays on the email step when no account matched',
        (tester) async {
      auth.resetUserId = null;
      await open(tester, const ForgotPasswordPage());

      await tester.enterText(find.byType(TextFormField), 'nobody@test.com');
      await tester.tap(find.text('Send Code'));
      await tester.pumpAndSettle();

      expect(find.text('Verification code'), findsNothing);
      expect(find.text('Send Code'), findsOneWidget);
      await settleSnackbars(tester);
    });

    testWidgets('shows a code error for an invalid code', (tester) async {
      auth.confirmError = badRequest('Invalid verification code');
      await open(tester, const ForgotPasswordPage());

      await tester.enterText(find.byType(TextFormField), 'doc@test.com');
      await tester.tap(find.text('Send Code'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), '000000');
      await tester.enterText(fields.at(1), 'NewPass123');
      await tester.enterText(fields.at(2), 'NewPass123');
      await tester.ensureVisible(find.widgetWithText(FilledButton, 'Reset Password'));
      await tester.tap(find.widgetWithText(FilledButton, 'Reset Password'));
      await tester.pumpAndSettle();

      expect(find.text('The code is invalid or has expired'), findsOneWidget);
    });

    testWidgets('resend from the code step does not crash', (tester) async {
      await open(tester, const ForgotPasswordPage());

      await tester.enterText(find.byType(TextFormField), 'doc@test.com');
      await tester.tap(find.text('Send Code'));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('Resend code'));
      await tester.tap(find.text('Resend code'));
      await tester.pumpAndSettle();

      expect(auth.calls, ['request:doc@test.com', 'request:doc@test.com']);
    });
  });

  group('ChangePasswordPage', () {
    Future<void> fill(WidgetTester tester, String current, String next,
        String confirm) async {
      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), current);
      await tester.enterText(fields.at(1), next);
      await tester.enterText(fields.at(2), confirm);
      await tester.tap(find.widgetWithText(FilledButton, 'Change Password'));
      await tester.pumpAndSettle();
    }

    testWidgets('validates before calling the server', (tester) async {
      await open(tester, const ChangePasswordPage());

      await fill(tester, 'old', 'NewPass123', 'Different123');

      expect(find.text('Passwords do not match'), findsOneWidget);
      expect(auth.calls, isEmpty);
    });

    testWidgets('shows wrong current password next to the field',
        (tester) async {
      auth.changeError = badRequest('Current password is incorrect');
      await open(tester, const ChangePasswordPage());

      await fill(tester, 'wrong', 'NewPass123', 'NewPass123');

      expect(auth.calls, ['change:wrong:NewPass123']);
      expect(find.text('Current password is incorrect'), findsOneWidget);
    });

    testWidgets('shows a rejected password translated, not raw', (tester) async {
      auth.changeError = badRequest(
        "['This password is too common.']",
        codes: ['password_too_common', 'password_too_similar'],
      );
      await open(tester, const ChangePasswordPage());

      await fill(tester, 'old', 'NewPass123', 'NewPass123');

      expect(
        find.text('This password is too common. Choose a harder one.\n'
            'The password is too close to your personal details.'),
        findsOneWidget,
      );
      expect(find.textContaining('['), findsNothing);
    });

    testWidgets('sends the change when valid', (tester) async {
      await open(tester, const ChangePasswordPage());

      await fill(tester, 'old', 'NewPass123', 'NewPass123');

      expect(auth.calls, ['change:old:NewPass123']);
      await settleSnackbars(tester);
      expect(find.text('previous screen'), findsOneWidget);
    });
  });
}
