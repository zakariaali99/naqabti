import 'package:json_annotation/json_annotation.dart';

part 'city.g.dart';

@JsonSerializable()
class City {
  final int id;
  final String name;
  @JsonKey(name: 'name_ar')
  final String? nameAr;
  final String? region;
  final String? prefix;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const City({
    required this.id,
    required this.name,
    this.nameAr,
    this.region,
    this.prefix,
    this.createdAt,
    this.updatedAt,
  });

  factory City.fromJson(Map<String, dynamic> json) => _$CityFromJson(json);

  Map<String, dynamic> toJson() => _$CityToJson(this);

  String displayName(bool isArabic) {
    final localName = (isArabic && nameAr != null && nameAr!.isNotEmpty) ? nameAr! : name;
    if (prefix != null && prefix!.isNotEmpty) {
      return '$prefix $localName';
    }
    if (region != null && region!.isNotEmpty) {
      return '$localName, $region';
    }
    return localName;
  }
}
