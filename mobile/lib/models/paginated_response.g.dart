// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'paginated_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaginatedResponse<T> _$PaginatedResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) => PaginatedResponse<T>(
  next: (json['next'] as num?)?.toInt(),
  previous: (json['previous'] as num?)?.toInt(),
  lastPage: (json['last_page'] as num?)?.toInt(),
  count: (json['count'] as num).toInt(),
  results: (json['results'] as List<dynamic>).map(fromJsonT).toList(),
);

Map<String, dynamic> _$PaginatedResponseToJson<T>(
  PaginatedResponse<T> instance,
  Object? Function(T value) toJsonT,
) => <String, dynamic>{
  'next': instance.next,
  'previous': instance.previous,
  'last_page': instance.lastPage,
  'count': instance.count,
  'results': instance.results.map(toJsonT).toList(),
};
