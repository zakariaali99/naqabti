import 'package:json_annotation/json_annotation.dart';
import 'user.dart';
import 'doctors_membership.dart';

part 'payment.g.dart';

@JsonSerializable()
class Payment {
  final int id;
  final User user;
  final int? membership;
  @JsonKey(name: 'membership_details')
  final DoctorsMembership? membershipDetails;
  @JsonKey(fromJson: _amountFromJson)
  final double amount;
  @JsonKey(name: 'payment_method')
  final String paymentMethod; // 'cash', 'card', 'bank_transfer', 'online', 'other'
  @JsonKey(name: 'payment_date')
  final DateTime paymentDate;
  @JsonKey(name: 'reference_number')
  final String? referenceNumber;
  final String? description;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const Payment({
    required this.id,
    required this.user,
    this.membership,
    this.membershipDetails,
    required this.amount,
    required this.paymentMethod,
    required this.paymentDate,
    this.referenceNumber,
    this.description,
    this.createdAt,
    this.updatedAt,
  });

  static double _amountFromJson(dynamic value) {
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    if (value is int) {
      return value.toDouble();
    }
    return value as double;
  }

  factory Payment.fromJson(Map<String, dynamic> json) =>
      _$PaymentFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentToJson(this);

  String get paymentMethodDisplay {
    switch (paymentMethod) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'online':
        return 'Online Payment';
      case 'other':
        return 'Other';
      default:
        return paymentMethod;
    }
  }
}
