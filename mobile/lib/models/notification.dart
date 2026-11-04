import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'notification.g.dart';

@JsonSerializable()
class AppNotification {
  final int id;
  final User user;
  final String? title;
  final String message;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'is_read')
  final bool read;
  @JsonKey(name: 'notification_type')
  final String? notificationType;
  @JsonKey(name: 'content_type')
  final String? contentType;
  @JsonKey(name: 'object_id')
  final int? objectId;

  const AppNotification({
    required this.id,
    required this.user,
    this.title,
    required this.message,
    required this.createdAt,
    required this.read,
    this.notificationType,
    this.contentType,
    this.objectId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      _$AppNotificationFromJson(json);

  Map<String, dynamic> toJson() => _$AppNotificationToJson(this);

  AppNotification copyWith({
    int? id,
    User? user,
    String? title,
    String? message,
    DateTime? createdAt,
    bool? read,
    String? notificationType,
    String? contentType,
    int? objectId,
  }) {
    return AppNotification(
      id: id ?? this.id,
      user: user ?? this.user,
      title: title ?? this.title,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
      read: read ?? this.read,
      notificationType: notificationType ?? this.notificationType,
      contentType: contentType ?? this.contentType,
      objectId: objectId ?? this.objectId,
    );
  }
}

@JsonSerializable()
class UnreadCountResponse {
  @JsonKey(name: 'unread_count')
  final int unreadCount;

  const UnreadCountResponse({
    required this.unreadCount,
  });

  factory UnreadCountResponse.fromJson(Map<String, dynamic> json) =>
      _$UnreadCountResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UnreadCountResponseToJson(this);
}
