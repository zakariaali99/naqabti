import 'package:json_annotation/json_annotation.dart';

part 'certification_type.g.dart';

@JsonSerializable()
class CertificationType {
  final int id;
  final String name;
  final String? description;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const CertificationType({
    required this.id,
    required this.name,
    this.description,
    this.createdAt,
    this.updatedAt,
  });

  factory CertificationType.fromJson(Map<String, dynamic> json) =>
      _$CertificationTypeFromJson(json);

  Map<String, dynamic> toJson() => _$CertificationTypeToJson(this);
}
