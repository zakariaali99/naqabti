import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/models/registration/registration_data.dart';

Map<String, String> _fields(RegistrationData data) =>
    {for (final f in data.toFormData().fields) f.key: f.value};

void main() {
  test('sends the names the backend requires', () {
    final fields = _fields(RegistrationData(
      userType: 'doctor',
      firstName: 'محمد',
      familyName: 'الاختبار',
      email: 'dr@example.com',
      password: 'Doctor2026x',
    ));

    expect(fields['first_name'], 'محمد');
    expect(fields['family_name'], 'الاختبار');
    expect(fields.containsKey('phone_number'), isFalse);
  });

  test('sends the phone number for every account type', () {
    for (final type in ['student', 'doctor', 'institution']) {
      final fields = _fields(RegistrationData(
        userType: type,
        firstName: 'a',
        familyName: 'b',
        email: 'x@example.com',
        password: 'Doctor2026x',
        phoneNumber: '0912345678',
      ));
      expect(fields['phone_number'], '0912345678', reason: type);
    }
  });
}
