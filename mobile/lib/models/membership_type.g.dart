// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'membership_type.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MembershipType _$MembershipTypeFromJson(Map<String, dynamic> json) =>
    MembershipType(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String?,
      durationMonths: (json['duration_months'] as num).toInt(),
      price: MembershipType._priceFromJson(json['price']),
      isActive: json['is_active'] as bool,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
    );

Map<String, dynamic> _$MembershipTypeToJson(MembershipType instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': ?instance.description,
      'duration_months': instance.durationMonths,
      'price': MembershipType._priceToJson(instance.price),
      'is_active': instance.isActive,
      'created_at': ?instance.createdAt?.toIso8601String(),
      'updated_at': ?instance.updatedAt?.toIso8601String(),
    };
