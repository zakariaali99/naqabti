import 'package:dio/dio.dart';

/// Model to hold registration data across the account-type and credentials steps
class RegistrationData {
  String? userType; // 'student', 'doctor', 'institution'
  String? firstName;
  String? familyName;
  String? email;
  String? password;
  String? phoneNumber;

  RegistrationData({
    this.userType,
    this.firstName,
    this.familyName,
    this.email,
    this.password,
    this.phoneNumber,
  });

  /// Convert to FormData for API submission
  FormData toFormData() {
    final Map<String, dynamic> fields = {
      'user_type': userType,
      'first_name': firstName,
      'family_name': familyName,
      'email': email,
      'password': password,
    };

    if (phoneNumber != null && phoneNumber!.isNotEmpty) {
      fields['phone_number'] = phoneNumber;
    }

    return FormData.fromMap(fields);
  }

  /// Reset all data
  void clear() {
    userType = null;
    firstName = null;
    familyName = null;
    email = null;
    password = null;
    phoneNumber = null;
  }
}
