import 'package:json_annotation/json_annotation.dart';

part 'academic_degree.g.dart';

@JsonSerializable()
class AcademicDegree {
  final int id;
  final String name;

  const AcademicDegree({
    required this.id,
    required this.name,
  });

  factory AcademicDegree.fromJson(Map<String, dynamic> json) =>
      _$AcademicDegreeFromJson(json);

  Map<String, dynamic> toJson() => _$AcademicDegreeToJson(this);
}
