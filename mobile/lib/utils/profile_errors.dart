import 'package:dio/dio.dart';
import 'package:naqabti/l10n/app_localizations.dart';

/// Readable text for a failed profile save, instead of the raw exception.
/// Field errors from the server become `field: reason`, one per line.
String profileSaveErrorMessage(Object error, AppLocalizations l10n) {
  if (error is! DioException) return l10n.failedToUpdateProfile;
  final response = error.response;
  if (response == null) return l10n.checkInternetConnection;

  final data = response.data;
  if (response.statusCode != 400 || data is! Map) {
    return l10n.failedToUpdateProfile;
  }

  final labels = {
    'username': l10n.username,
    'email': l10n.email,
    'phone_number': l10n.phoneNumber,
    'membership_number': l10n.membershipNumber,
  };

  final lines = <String>[];
  data.forEach((field, value) {
    final reason = value is List && value.isNotEmpty ? '${value.first}' : '$value';
    final taken = reason.contains('already registered') ||
        reason.contains('already exists');
    final label = labels[field];
    if (label == null) return;
    lines.add('$label: ${taken ? l10n.alreadyUsedByAnotherAccount : reason}');
  });

  return lines.isEmpty ? l10n.failedToUpdateProfile : lines.join('\n');
}
