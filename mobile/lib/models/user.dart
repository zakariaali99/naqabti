import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String username;
  final String? email;
  @JsonKey(name: 'full_name')
  final String? fullName;
  @JsonKey(name: 'first_name_field')
  final String? firstNameAr;
  @JsonKey(name: 'father_name')
  final String? fatherNameAr;
  @JsonKey(name: 'grandfather_name')
  final String? grandfatherNameAr;
  @JsonKey(name: 'family_name')
  final String? familyNameAr;
  @JsonKey(name: 'first_name_en')
  final String? firstNameEn;
  @JsonKey(name: 'father_name_en')
  final String? fatherNameEn;
  @JsonKey(name: 'grandfather_name_en')
  final String? grandfatherNameEn;
  @JsonKey(name: 'family_name_en')
  final String? familyNameEn;
  @JsonKey(name: 'phone_number')
  final String? phoneNumber;
  @JsonKey(name: 'profile_image')
  final String? profileImage;
  final String? language;
  @JsonKey(name: 'city')
  final int? cityId;
  @JsonKey(name: 'user_type')
  final String? userType; // 'doctor' or 'manager'
  final String? specialty; // For doctors
  final String? bio; // For doctors
  final DateTime? birthdate;
  final String? address;
  final String? nationality;
  @JsonKey(name: 'passport_image')
  final String? passportImage;
  @JsonKey(name: 'university_name')
  final String? universityName;
  @JsonKey(name: 'current_degree')
  final String? currentDegree;
  @JsonKey(name: 'membership_number')
  final String? membershipNumber;
  @JsonKey(name: 'is_active')
  final bool? isActive;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.username,
    this.email,
    this.fullName,
    this.firstNameAr,
    this.fatherNameAr,
    this.grandfatherNameAr,
    this.familyNameAr,
    this.firstNameEn,
    this.fatherNameEn,
    this.grandfatherNameEn,
    this.familyNameEn,
    this.phoneNumber,
    this.profileImage,
    this.language,
    this.cityId,
    required this.userType,
    this.specialty,
    this.bio,
    this.birthdate,
    this.address,
    this.nationality,
    this.passportImage,
    this.universityName,
    this.currentDegree,
    this.membershipNumber,
    this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);

  User copyWith({
    int? id,
    String? username,
    String? email,
    String? fullName,
    String? firstNameAr,
    String? fatherNameAr,
    String? grandfatherNameAr,
    String? familyNameAr,
    String? firstNameEn,
    String? fatherNameEn,
    String? grandfatherNameEn,
    String? familyNameEn,
    String? phoneNumber,
    String? profileImage,
    String? language,
    int? cityId,
    String? userType,
    String? specialty,
    String? bio,
    DateTime? birthdate,
    String? address,
    String? nationality,
    String? passportImage,
    String? universityName,
    String? currentDegree,
    String? membershipNumber,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      firstNameAr: firstNameAr ?? this.firstNameAr,
      fatherNameAr: fatherNameAr ?? this.fatherNameAr,
      grandfatherNameAr: grandfatherNameAr ?? this.grandfatherNameAr,
      familyNameAr: familyNameAr ?? this.familyNameAr,
      firstNameEn: firstNameEn ?? this.firstNameEn,
      fatherNameEn: fatherNameEn ?? this.fatherNameEn,
      grandfatherNameEn: grandfatherNameEn ?? this.grandfatherNameEn,
      familyNameEn: familyNameEn ?? this.familyNameEn,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      profileImage: profileImage ?? this.profileImage,
      language: language ?? this.language,
      cityId: cityId ?? this.cityId,
      userType: userType ?? this.userType,
      specialty: specialty ?? this.specialty,
      bio: bio ?? this.bio,
      birthdate: birthdate ?? this.birthdate,
      address: address ?? this.address,
      nationality: nationality ?? this.nationality,
      passportImage: passportImage ?? this.passportImage,
      universityName: universityName ?? this.universityName,
      currentDegree: currentDegree ?? this.currentDegree,
      membershipNumber: membershipNumber ?? this.membershipNumber,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
