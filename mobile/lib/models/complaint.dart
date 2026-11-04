import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'complaint.g.dart';

@JsonSerializable()
class Complaint {
  final int id;
  final String subject;
  final String description;
  final String status;
  @JsonKey(name: 'status_display')
  final String statusDisplay;
  final String priority;
  @JsonKey(name: 'priority_display')
  final String priorityDisplay;
  final String? category;
  @JsonKey(name: 'admin_response')
  final String? adminResponse;
  final String? attachment;
  final int? user;
  @JsonKey(name: 'user_detail')
  final User? userDetail;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  Complaint({
    required this.id,
    required this.subject,
    required this.description,
    required this.status,
    required this.statusDisplay,
    required this.priority,
    required this.priorityDisplay,
    this.category,
    this.adminResponse,
    this.attachment,
    this.user,
    this.userDetail,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) => _$ComplaintFromJson(json);
  Map<String, dynamic> toJson() => _$ComplaintToJson(this);
}
