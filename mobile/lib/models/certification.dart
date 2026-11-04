import 'package:json_annotation/json_annotation.dart';
import 'user.dart';
import 'certification_type.dart';

part 'certification.g.dart';

@JsonSerializable()
class Certification {
  final int id;
  final User doctor;
  @JsonKey(name: 'certification_type')
  final CertificationType certificationType;
  @JsonKey(name: 'issue_date')
  final DateTime issueDate;
  @JsonKey(name: 'expiry_date')
  final DateTime? expiryDate;
  @JsonKey(name: 'issued_from')
  final String? issuedFrom;
  final String? document;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const Certification({
    required this.id,
    required this.doctor,
    required this.certificationType,
    required this.issueDate,
    this.expiryDate,
    this.issuedFrom,
    this.document,
    this.createdAt,
    this.updatedAt,
  });

  factory Certification.fromJson(Map<String, dynamic> json) =>
      _$CertificationFromJson(json);

  Map<String, dynamic> toJson() => _$CertificationToJson(this);

  bool get isExpired {
    if (expiryDate == null) return false;
    return expiryDate!.isBefore(DateTime.now());
  }
}
