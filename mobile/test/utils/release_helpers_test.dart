import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/api/auth_api_client.dart';
import 'package:naqabti/l10n/app_localizations_en.dart';
import 'package:naqabti/utils/external_links.dart';
import 'package:naqabti/utils/password_rules.dart';

void main() {
  final l10n = AppLocalizationsEn();

  group('validateNewPassword', () {
    test('rejects empty, short, numeric and letterless passwords', () {
      expect(validateNewPassword('', l10n), l10n.pleaseEnterPassword);
      expect(validateNewPassword('abc12', l10n),
          l10n.passwordMustBeAtLeast8Characters);
      expect(validateNewPassword('12345678', l10n),
          l10n.passwordCannotBeEntirelyNumeric);
      expect(validateNewPassword('12345678!', l10n),
          l10n.passwordMustContainLetter);
    });

    test('accepts a password the backend accepts', () {
      expect(validateNewPassword('Str0ng!Passw0rd', l10n), isNull);
    });
  });

  group('apiErrorMessage', () {
    test('reads the error field of a 400 response', () {
      final error = DioException(
        requestOptions: RequestOptions(path: 'auth/change-password/'),
        response: Response(
          requestOptions: RequestOptions(path: 'auth/change-password/'),
          statusCode: 400,
          data: {'error': 'Current password is incorrect'},
        ),
      );
      expect(apiErrorMessage(error), 'Current password is incorrect');
      expect(isConnectionError(error), isFalse);
    });

    test('treats a request without response as a connection error', () {
      final error = DioException(requestOptions: RequestOptions(path: 'x'));
      expect(apiErrorMessage(error), isNull);
      expect(isConnectionError(error), isTrue);
    });
  });

  group('ExternalLinks.mediaUri', () {
    test('keeps absolute URLs', () {
      expect(
        ExternalLinks.mediaUri('https://cdn.example.com/a.pdf').toString(),
        'https://cdn.example.com/a.pdf',
      );
    });

    test('resolves server-relative media paths against the API host', () {
      expect(
        ExternalLinks.mediaUri('/media/certs/a.pdf').toString(),
        'https://my.naqabti.ly/media/certs/a.pdf',
      );
    });
  });

  test('PasswordResetResponse reads user_id only when present', () {
    expect(PasswordResetResponse.fromJson({'user_id': 7}).userId, 7);
    expect(PasswordResetResponse.fromJson({'message': 'x'}).userId, isNull);
  });
}
