import 'package:dio/dio.dart';

/// Model to hold registration data across the account-type and credentials steps
class RegistrationData {
  String? userType; // 'student', 'doctor', 'institution'
  String? email;
  String? password;
  String? phoneNumber;

  RegistrationData({
    this.userType,
    this.email,
    this.password,
    this.phoneNumber,
  });

  /// Convert to FormData for API submission
  FormData toFormData() {
    final Map<String, dynamic> fields = {
      'user_type': userType,
      'email': email,
      'password': password,
    };

    if (userType == 'institution' &&
        phoneNumber != null &&
        phoneNumber!.isNotEmpty) {
      fields['phone_number'] = phoneNumber;
    }

    return FormData.fromMap(fields);
  }

  /// Reset all data
  void clear() {
    userType = null;
    email = null;
    password = null;
    phoneNumber = null;
  }
}
