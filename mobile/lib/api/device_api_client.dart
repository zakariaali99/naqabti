import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/device.dart';
import 'base_api_client.dart';

part 'device_api_client.g.dart';

/// Device API Client
/// Handles device FCM token registration and management
@RestApi()
abstract class DeviceApiClient extends BaseApiClient {
  factory DeviceApiClient(Dio dio, {String? baseUrl}) = _DeviceApiClient;

  @GET('devices/')
  Future<List<Device>> getDevices(@Queries() Map<String, dynamic>? queries);

  @GET('devices/{id}/')
  Future<Device> getDevice(@Path('id') int id);

  @POST('devices/')
  Future<Device> registerDevice(@Body() Map<String, dynamic> data);

  @PATCH('devices/{id}/')
  Future<Device> updateDevice(
    @Path('id') int id,
    @Body() Map<String, dynamic> data,
  );

  @DELETE('devices/{id}/')
  Future<void> deleteDevice(@Path('id') int id);

  @POST('devices/register_or_update/')
  Future<Device> registerOrUpdateDevice(@Body() Map<String, dynamic> data);
}
