// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'certification_type.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CertificationType _$CertificationTypeFromJson(Map<String, dynamic> json) =>
    CertificationType(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String?,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
    );

Map<String, dynamic> _$CertificationTypeToJson(CertificationType instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };
