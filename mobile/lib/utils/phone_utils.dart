/// True when [input] looks like a phone number typed without the Libyan
/// country code (e.g. 0912345678), so the login error can say how to write it.
bool isPhoneWithoutCountryCode(String input) {
  final compact = input.replaceAll(RegExp(r'[\s\-()]'), '');
  if (!RegExp(r'^\+?\d{7,15}$').hasMatch(compact)) return false;
  return !(compact.startsWith('+218') ||
      compact.startsWith('00218') ||
      compact.startsWith('218'));
}
