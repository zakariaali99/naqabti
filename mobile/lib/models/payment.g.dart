// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Payment _$PaymentFromJson(Map<String, dynamic> json) => Payment(
  id: (json['id'] as num).toInt(),
  user: User.fromJson(json['user'] as Map<String, dynamic>),
  membership: (json['membership'] as num?)?.toInt(),
  membershipDetails: json['membership_details'] == null
      ? null
      : DoctorsMembership.fromJson(
          json['membership_details'] as Map<String, dynamic>,
        ),
  amount: Payment._amountFromJson(json['amount']),
  paymentMethod: json['payment_method'] as String,
  paymentDate: DateTime.parse(json['payment_date'] as String),
  referenceNumber: json['reference_number'] as String?,
  description: json['description'] as String?,
  createdAt: json['created_at'] == null
      ? null
      : DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
);

Map<String, dynamic> _$PaymentToJson(Payment instance) => <String, dynamic>{
  'id': instance.id,
  'user': instance.user,
  'membership': instance.membership,
  'membership_details': instance.membershipDetails,
  'amount': instance.amount,
  'payment_method': instance.paymentMethod,
  'payment_date': instance.paymentDate.toIso8601String(),
  'reference_number': instance.referenceNumber,
  'description': instance.description,
  'created_at': instance.createdAt?.toIso8601String(),
  'updated_at': instance.updatedAt?.toIso8601String(),
};
