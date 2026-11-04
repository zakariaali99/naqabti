// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: (json['id'] as num).toInt(),
  username: json['username'] as String,
  email: json['email'] as String?,
  fullName: json['full_name'] as String?,
  firstNameAr: json['first_name_field'] as String?,
  fatherNameAr: json['father_name'] as String?,
  grandfatherNameAr: json['grandfather_name'] as String?,
  familyNameAr: json['family_name'] as String?,
  firstNameEn: json['first_name_en'] as String?,
  fatherNameEn: json['father_name_en'] as String?,
  grandfatherNameEn: json['grandfather_name_en'] as String?,
  familyNameEn: json['family_name_en'] as String?,
  phoneNumber: json['phone_number'] as String?,
  profileImage: json['profile_image'] as String?,
  language: json['language'] as String?,
  cityId: (json['city'] as num?)?.toInt(),
  userType: json['user_type'] as String?,
  specialty: json['specialty'] as String?,
  bio: json['bio'] as String?,
  birthdate: json['birthdate'] == null
      ? null
      : DateTime.parse(json['birthdate'] as String),
  address: json['address'] as String?,
  nationality: json['nationality'] as String?,
  passportImage: json['passport_image'] as String?,
  universityName: json['university_name'] as String?,
  currentDegree: json['current_degree'] as String?,
  membershipNumber: json['membership_number'] as String?,
  isActive: json['is_active'] as bool?,
  createdAt: json['created_at'] == null
      ? null
      : DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  'id': instance.id,
  'username': instance.username,
  'email': instance.email,
  'full_name': instance.fullName,
  'first_name_field': instance.firstNameAr,
  'father_name': instance.fatherNameAr,
  'grandfather_name': instance.grandfatherNameAr,
  'family_name': instance.familyNameAr,
  'first_name_en': instance.firstNameEn,
  'father_name_en': instance.fatherNameEn,
  'grandfather_name_en': instance.grandfatherNameEn,
  'family_name_en': instance.familyNameEn,
  'phone_number': instance.phoneNumber,
  'profile_image': instance.profileImage,
  'language': instance.language,
  'city': instance.cityId,
  'user_type': instance.userType,
  'specialty': instance.specialty,
  'bio': instance.bio,
  'birthdate': instance.birthdate?.toIso8601String(),
  'address': instance.address,
  'nationality': instance.nationality,
  'passport_image': instance.passportImage,
  'university_name': instance.universityName,
  'current_degree': instance.currentDegree,
  'membership_number': instance.membershipNumber,
  'is_active': instance.isActive,
  'created_at': instance.createdAt?.toIso8601String(),
  'updated_at': instance.updatedAt?.toIso8601String(),
};
