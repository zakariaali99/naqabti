// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'certification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Certification _$CertificationFromJson(Map<String, dynamic> json) =>
    Certification(
      id: (json['id'] as num).toInt(),
      doctor: User.fromJson(json['doctor'] as Map<String, dynamic>),
      certificationType: CertificationType.fromJson(
        json['certification_type'] as Map<String, dynamic>,
      ),
      issueDate: DateTime.parse(json['issue_date'] as String),
      expiryDate: json['expiry_date'] == null
          ? null
          : DateTime.parse(json['expiry_date'] as String),
      issuedFrom: json['issued_from'] as String?,
      document: json['document'] as String?,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
    );

Map<String, dynamic> _$CertificationToJson(Certification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'doctor': instance.doctor,
      'certification_type': instance.certificationType,
      'issue_date': instance.issueDate.toIso8601String(),
      'expiry_date': instance.expiryDate?.toIso8601String(),
      'issued_from': instance.issuedFrom,
      'document': instance.document,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };
