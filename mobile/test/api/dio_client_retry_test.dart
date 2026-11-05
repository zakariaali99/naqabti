import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/api/dio_client.dart';
import 'package:naqabti/services/auth_service.dart';

class _TokenAuthService extends AuthService {
  String _access = 'expired';

  @override
  Future<String?> getAccessToken() async => _access;

  @override
  Future<String?> getRefreshToken() async => 'refresh';

  @override
  Future<String?> refreshAccessToken(String refreshToken) async =>
      _access = 'fresh';
}

/// Answers 401 to the first request and 200 to the retry, reading the body
/// each time like the real adapter does.
class _ExpiredOnceAdapter implements HttpClientAdapter {
  final List<String> authHeaders = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (requestStream != null) await requestStream.drain<void>();
    authHeaders.add('${options.headers['Authorization']}');
    final status = authHeaders.length == 1 ? 401 : 200;
    return ResponseBody.fromString(
      jsonEncode({'ok': status == 200}),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('an upload is sent again after the session is refreshed', () async {
    final client = DioClient(_TokenAuthService());
    final adapter = _ExpiredOnceAdapter();
    client.dio.httpClientAdapter = adapter;

    final response = await client.dio.patch(
      'users/me/profile-image/',
      data: FormData.fromMap({
        'profile_image': MultipartFile.fromBytes([1, 2, 3], filename: 'a.jpg'),
      }),
    );

    expect(response.statusCode, 200);
    expect(adapter.authHeaders, ['Bearer expired', 'Bearer fresh']);
  });
}
