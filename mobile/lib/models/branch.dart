import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'branch.g.dart';

@JsonSerializable()
class Branch {
  final int id;
  final String name;
  final String prefix;
  final String? address;
  final String? city;
  final String? phone;
  final String? email;
  final User? manager;
  @JsonKey(name: 'parent')
  final int? parentId;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const Branch({
    required this.id,
    required this.name,
    required this.prefix,
    this.address,
    this.city,
    this.phone,
    this.email,
    this.manager,
    this.parentId,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory Branch.fromJson(Map<String, dynamic> json) => _$BranchFromJson(json);

  Map<String, dynamic> toJson() => _$BranchToJson(this);
}
