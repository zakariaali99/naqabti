import 'package:dio/dio.dart';
import 'package:naqabti/l10n/app_localizations.dart';

/// Client-side copy of the backend's password validators, so users see the
/// problem before the request is sent. Same rules as registration.
String? validateNewPassword(String? value, AppLocalizations l10n) {
  if (value == null || value.isEmpty) {
    return l10n.pleaseEnterPassword;
  }
  if (value.length < 8) {
    return l10n.passwordMustBeAtLeast8Characters;
  }
  if (RegExp(r'^[0-9]+$').hasMatch(value)) {
    return l10n.passwordCannotBeEntirelyNumeric;
  }
  if (!RegExp(r'[A-Za-z]').hasMatch(value)) {
    return l10n.passwordMustContainLetter;
  }
  return null;
}

/// The `error` message an auth endpoint returned with a 400, if any.
String? apiErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['error'] is String) {
      return data['error'] as String;
    }
  }
  return null;
}

/// A rejected new password, translated from the validator codes the server
/// sends (e.g. password_too_common), one per line. Null when there are none.
String? passwordServerError(Object error, AppLocalizations l10n) {
  if (error is! DioException) return null;
  final data = error.response?.data;
  final codes = data is Map ? data['codes'] : null;
  if (codes is! List || codes.isEmpty) return null;

  final lines = <String>[];
  for (final code in codes) {
    final line = switch (code) {
      'password_too_common' => l10n.passwordTooCommon,
      'password_entirely_numeric' => l10n.passwordCannotBeEntirelyNumeric,
      'password_too_short' => l10n.passwordMustBeAtLeast8Characters,
      'password_too_similar' => l10n.passwordTooSimilar,
      _ => null,
    };
    if (line == null) return null;
    lines.add(line);
  }
  return lines.join('\n');
}

/// True when the request never got an answer from the server.
bool isConnectionError(Object error) {
  return error is DioException && error.response == null;
}
