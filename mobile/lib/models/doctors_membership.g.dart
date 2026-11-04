// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'doctors_membership.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DoctorsMembership _$DoctorsMembershipFromJson(Map<String, dynamic> json) =>
    DoctorsMembership(
      id: (json['id'] as num).toInt(),
      doctor: json['doctor'] == null
          ? null
          : User.fromJson(json['doctor'] as Map<String, dynamic>),
      doctorId: (json['doctor_id'] as num?)?.toInt(),
      membershipTypeDetails: json['membership_type'] == null
          ? null
          : MembershipType.fromJson(
              json['membership_type'] as Map<String, dynamic>,
            ),
      city: json['city'] == null
          ? null
          : City.fromJson(json['city'] as Map<String, dynamic>),
      cityId: (json['city_id'] as num?)?.toInt(),
      membershipNumber: json['membership_number'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] == null
          ? null
          : DateTime.parse(json['end_date'] as String),
      status: json['status'] as String,
      isActive: json['is_active'] as bool,
      totalAmount: DoctorsMembership._toDouble(json['total_amount']),
      paidAmount: DoctorsMembership._toDouble(json['paid_amount']),
      paymentStatus: json['payment_status'] as String,
      remainingAmount: DoctorsMembership._toDoubleNullable(
        json['remaining_amount'],
      ),
      payments: json['payments'] as List<dynamic>?,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
    );

Map<String, dynamic> _$DoctorsMembershipToJson(DoctorsMembership instance) =>
    <String, dynamic>{
      'id': instance.id,
      'doctor': instance.doctor?.toJson(),
      'doctor_id': instance.doctorId,
      'membership_type': instance.membershipTypeDetails?.toJson(),
      'city': instance.city?.toJson(),
      'city_id': instance.cityId,
      'membership_number': instance.membershipNumber,
      'start_date': instance.startDate.toIso8601String(),
      'end_date': instance.endDate?.toIso8601String(),
      'status': instance.status,
      'is_active': instance.isActive,
      'total_amount': instance.totalAmount,
      'paid_amount': instance.paidAmount,
      'payment_status': instance.paymentStatus,
      'remaining_amount': instance.remainingAmount,
      'payments': instance.payments,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };
