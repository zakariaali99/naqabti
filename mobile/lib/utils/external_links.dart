import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/api_config.dart';

/// Public pages on the syndicate website.
class ExternalLinks {
  ExternalLinks._();

  static const String privacyPolicy = 'https://my.naqabti.ly/privacy';

  /// Turns a media path from the API into an absolute URL. The API may send
  /// either a full URL or a path relative to the server (e.g. `/media/...`).
  static Uri mediaUri(String pathOrUrl) {
    final uri = Uri.parse(pathOrUrl);
    if (uri.hasScheme) return uri;
    return Uri.parse(ApiConfig.baseUrl).resolve(pathOrUrl);
  }

  /// Opens [uri] outside the app. Returns false when nothing could handle it.
  static Future<bool> open(Uri uri) async {
    try {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Could not open $uri: $e');
      return false;
    }
  }

  static Future<bool> call(String phone) =>
      open(Uri(scheme: 'tel', path: phone.replaceAll(RegExp(r'[^0-9+]'), '')));

  static Future<bool> openInMaps(String address) => open(
        Uri.https('www.google.com', '/maps/search/', {
          'api': '1',
          'query': address,
        }),
      );
}
