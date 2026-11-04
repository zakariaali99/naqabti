import 'dart:io';
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/medical_report.dart';

part 'medical_report_api_client.g.dart';

@RestApi()
abstract class MedicalReportApiClient {
  factory MedicalReportApiClient(Dio dio, {String baseUrl}) = _MedicalReportApiClient;

  @GET('medical-reports/')
  Future<PaginatedMedicalReports> getReports({
    @Queries() Map<String, dynamic>? filters,
  });

  @GET('medical-reports/{id}/')
  Future<MedicalReport> getReport(@Path('id') int id);

  @POST('medical-reports/')
  @MultiPart()
  Future<MedicalReport> createReport({
    @Part(name: 'patient_name') required String patientName,
    @Part(name: 'patient_id') String? patientId,
    @Part(name: 'diagnosis') required String diagnosis,
    @Part(name: 'treatment') String? treatment,
    @Part(name: 'recommendations') String? recommendations,
    @Part(name: 'notes') String? notes,
    @Part(name: 'document') File? document,
  });

  @PATCH('medical-reports/{id}/')
  @MultiPart()
  Future<MedicalReport> updateReport(
    @Path('id') int id, {
    @Part(name: 'patient_name') String? patientName,
    @Part(name: 'patient_id') String? patientId,
    @Part(name: 'diagnosis') String? diagnosis,
    @Part(name: 'treatment') String? treatment,
    @Part(name: 'recommendations') String? recommendations,
    @Part(name: 'notes') String? notes,
    @Part(name: 'document') File? document,
  });

  @DELETE('medical-reports/{id}/')
  Future<void> deleteReport(@Path('id') int id);

  @GET('medical-reports/{id}/export_pdf/')
  Future<dynamic> exportPdf(@Path('id') int id);
}
