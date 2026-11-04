import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/utils/app_snackbar.dart';
import 'package:naqabti/utils/phone_utils.dart';

void main() {
  group('isPhoneWithoutCountryCode', () {
    test('local formats need the hint', () {
      expect(isPhoneWithoutCountryCode('0912345678'), isTrue);
      expect(isPhoneWithoutCountryCode('091 234 5678'), isTrue);
      expect(isPhoneWithoutCountryCode('912345678'), isTrue);
    });

    test('international numbers and usernames do not', () {
      expect(isPhoneWithoutCountryCode('+218912345678'), isFalse);
      expect(isPhoneWithoutCountryCode('00218912345678'), isFalse);
      expect(isPhoneWithoutCountryCode('218912345678'), isFalse);
      expect(isPhoneWithoutCountryCode('ahmed'), isFalse);
      expect(isPhoneWithoutCountryCode('a@b.com'), isFalse);
    });
  });

  test('snackbar backgrounds are fully opaque', () {
    for (final kind in SnackKind.values) {
      expect(AppSnackbar.colorFor(kind).a, 1.0, reason: kind.name);
    }
  });
}
