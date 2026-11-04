import 'package:json_annotation/json_annotation.dart';

part 'nationality.g.dart';

@JsonSerializable()
class Nationality {
  final int id;
  final String name;
  @JsonKey(name: 'name_ar')
  final String? nameAr;
  final String? code;

  const Nationality({
    required this.id,
    required this.name,
    this.nameAr,
    this.code,
  });

  factory Nationality.fromJson(Map<String, dynamic> json) => _$NationalityFromJson(json);

  Map<String, dynamic> toJson() => _$NationalityToJson(this);

  String displayName(bool isArabic) =>
      (isArabic && nameAr != null && nameAr!.isNotEmpty) ? nameAr! : name;
}
