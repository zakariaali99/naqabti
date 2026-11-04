import 'package:json_annotation/json_annotation.dart';

part 'membership_type.g.dart';

@JsonSerializable()
class MembershipType {
  final int id;
  final String name;
  @JsonKey(includeIfNull: false)
  final String? description;

  @JsonKey(name: 'duration_months')
  final int durationMonths;

  @JsonKey(name: 'price', fromJson: _priceFromJson, toJson: _priceToJson)
  final double price;

  @JsonKey(name: 'is_active')
  final bool isActive;

  @JsonKey(name: 'created_at', includeIfNull: false)
  final DateTime? createdAt;

  @JsonKey(name: 'updated_at', includeIfNull: false)
  final DateTime? updatedAt;

  const MembershipType({
    required this.id,
    required this.name,
    this.description,
    required this.durationMonths,
    required this.price,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  /// Convert JSON value to a double for `price`.
  static double _priceFromJson(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    throw FormatException('Invalid price value: $value');
  }

  static dynamic _priceToJson(double value) => value;

  factory MembershipType.fromJson(Map<String, dynamic> json) => _$MembershipTypeFromJson(json);

  Map<String, dynamic> toJson() => _$MembershipTypeToJson(this);
}
