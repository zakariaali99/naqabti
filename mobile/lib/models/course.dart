import 'package:json_annotation/json_annotation.dart';

part 'course.g.dart';

@JsonSerializable()
class Course {
  final int id;
  final String title;
  
  @JsonKey(name: 'content')
  final String? description;
  
  // Backend doesn't seem to have instructor field yet, keeping it as nullable/optional
  final String? instructor; 

  @JsonKey(name: 'date_from')
  final DateTime? startDate;
  
  @JsonKey(name: 'date_to')
  final DateTime? endDate;
  
  final String? price; // Backend uses Decimal/String for price
  
  final String? image;
  
  final String status;
  
  @JsonKey(name: 'registration_status')
  final String? registrationStatus;

  Course({
    required this.id,
    required this.title,
    this.description,
    this.instructor,
    this.startDate,
    this.endDate,
    this.price,
    this.image,
    required this.status,
    this.registrationStatus,
  });

  factory Course.fromJson(Map<String, dynamic> json) => _$CourseFromJson(json);
  Map<String, dynamic> toJson() => _$CourseToJson(this);
}
