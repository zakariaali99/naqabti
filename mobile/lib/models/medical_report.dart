import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'medical_report.g.dart';

@JsonSerializable()
class MedicalReport {
  final int id;
  @JsonKey(name: 'doctor')
  final int doctorId;
  @JsonKey(name: 'doctor_detail')
  final User? doctor;
  @JsonKey(name: 'patient_name')
  final String patientName;
  @JsonKey(name: 'patient_id')
  final String? patientNationalId;
  @JsonKey(name: 'report_date')
  final DateTime reportDate;
  final String diagnosis;
  final String? treatment;
  final String? recommendations;
  final String? notes;
  final String? document;
  @JsonKey(name: 'document_url')
  final String? documentUrl;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;

  MedicalReport({
    required this.id,
    required this.doctorId,
    this.doctor,
    required this.patientName,
    this.patientNationalId,
    required this.reportDate,
    required this.diagnosis,
    this.treatment,
    this.recommendations,
    this.notes,
    this.document,
    this.documentUrl,
    required this.createdAt,
  });

  factory MedicalReport.fromJson(Map<String, dynamic> json) => _$MedicalReportFromJson(json);
  Map<String, dynamic> toJson() => _$MedicalReportToJson(this);
}

@JsonSerializable()
class PaginatedMedicalReports {
  final int count;
  final String? next;
  final String? previous;
  final List<MedicalReport> results;

  PaginatedMedicalReports({
    required this.count,
    this.next,
    this.previous,
    required this.results,
  });

  factory PaginatedMedicalReports.fromJson(Map<String, dynamic> json) => _$PaginatedMedicalReportsFromJson(json);
  Map<String, dynamic> toJson() => _$PaginatedMedicalReportsToJson(this);
}
