import 'package:json_annotation/json_annotation.dart';

part 'device.g.dart';

/// Device model for FCM token management
@JsonSerializable()
class Device {
  final int? id;
  
  @JsonKey(name: 'fcm_token')
  final String fcmToken;
  
  final int? user;
  
  @JsonKey(name: 'extra_data')
  final Map<String, dynamic>? extraData;
  
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  Device({
    this.id,
    required this.fcmToken,
    this.user,
    this.extraData,
    this.createdAt,
    this.updatedAt,
  });

  factory Device.fromJson(Map<String, dynamic> json) => _$DeviceFromJson(json);
  
  Map<String, dynamic> toJson() => _$DeviceToJson(this);
  
  Device copyWith({
    int? id,
    String? fcmToken,
    int? user,
    Map<String, dynamic>? extraData,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Device(
      id: id ?? this.id,
      fcmToken: fcmToken ?? this.fcmToken,
      user: user ?? this.user,
      extraData: extraData ?? this.extraData,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
