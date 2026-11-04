import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/l10n/app_localizations_ar.dart';
import 'package:naqabti/utils/profile_errors.dart';

DioException _error(int? status, Object? data) {
  final options = RequestOptions(path: 'users/me/');
  return DioException(
    requestOptions: options,
    response: status == null
        ? null
        : Response(requestOptions: options, statusCode: status, data: data),
  );
}

void main() {
  final l10n = AppLocalizationsAr();

  test('field errors are named and translated', () {
    final message = profileSaveErrorMessage(
      _error(400, {
        'email': ['Email already registered.'],
        'phone_number': ['Phone number already registered.'],
      }),
      l10n,
    );
    expect(message,
        '${l10n.email}: ${l10n.alreadyUsedByAnotherAccount}\n'
        '${l10n.phoneNumber}: ${l10n.alreadyUsedByAnotherAccount}');
  });

  test('no answer from the server asks to check the connection', () {
    expect(profileSaveErrorMessage(_error(null, null), l10n),
        l10n.checkInternetConnection);
  });

  test('anything else is a plain failure, never the raw exception', () {
    final message = profileSaveErrorMessage(_error(500, 'Server Error'), l10n);
    expect(message, l10n.failedToUpdateProfile);
    expect(message.contains('DioException'), isFalse);
  });
}
