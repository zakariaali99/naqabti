import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/payment.dart';
import '../models/paginated_response.dart';
import '../config/api_config.dart';
import 'base_api_client.dart';

part 'payment_api_client.g.dart';

/// Payment API Client
/// Handles payment CRUD operations
@RestApi(baseUrl: ApiConfig.baseUrl)
abstract class PaymentApiClient extends BaseApiClient {
  factory PaymentApiClient(Dio dio, {String? baseUrl}) = _PaymentApiClient;

  @GET('payments/')
  Future<PaginatedResponse<Payment>> getPayments(@Queries() Map<String, dynamic>? queries);

  @GET('payments/{id}/')
  Future<Payment> getPayment(@Path('id') int id);

  @POST('payments/')
  Future<Payment> createPayment(@Body() Map<String, dynamic> data);

  @PATCH('payments/{id}/')
  Future<Payment> updatePayment(@Path('id') int id, @Body() Map<String, dynamic> data);

  @DELETE('payments/{id}/')
  Future<void> deletePayment(@Path('id') int id);
}
