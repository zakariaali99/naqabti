import 'package:json_annotation/json_annotation.dart';
import 'user.dart';
import 'membership_type.dart';
import 'city.dart';

part 'doctors_membership.g.dart';

@JsonSerializable(explicitToJson: true)
class DoctorsMembership {
  final int id;
  final User? doctor;
  @JsonKey(name: 'doctor_id')
  final int? doctorId;
  // @JsonKey(name: 'membership_type')
  // final int membershipType;
  @JsonKey(name: 'membership_type')
  final MembershipType? membershipTypeDetails;
  final City? city;
  @JsonKey(name: 'city_id')
  final int? cityId;
  @JsonKey(name: 'membership_number')
  final String membershipNumber;
  @JsonKey(name: 'start_date')
  final DateTime startDate;
  @JsonKey(name: 'end_date')
  final DateTime? endDate;
  final String status; // 'active', 'pending', 'canceled', 'expired'
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'total_amount', fromJson: _toDouble)
  final double totalAmount;
  @JsonKey(name: 'paid_amount', fromJson: _toDouble)
  final double paidAmount;
  @JsonKey(name: 'payment_status')
  final String paymentStatus; // 'unpaid', 'partial', 'paid'
  @JsonKey(name: 'remaining_amount', fromJson: _toDoubleNullable)
  final double? remainingAmount;
  final List<dynamic>? payments;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const DoctorsMembership({
    required this.id,
    this.doctor,
    this.doctorId,
    // required this.membershipType,
    this.membershipTypeDetails,
    this.city,
    this.cityId,
    required this.membershipNumber,
    required this.startDate,
    this.endDate,
    required this.status,
    required this.isActive,
    required this.totalAmount,
    required this.paidAmount,
    required this.paymentStatus,
    this.remainingAmount,
    this.payments,
    this.createdAt,
    this.updatedAt,
  });

  static double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static double? _toDoubleNullable(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  factory DoctorsMembership.fromJson(Map<String, dynamic> json) =>
      _$DoctorsMembershipFromJson(json);

  Map<String, dynamic> toJson() => _$DoctorsMembershipToJson(this);

  double get calculatedRemainingAmount => 
      remainingAmount ?? (totalAmount - paidAmount);

  bool get isFullyPaid => paymentStatus == 'paid';
  bool get isPartiallyPaid => paymentStatus == 'partial';
  bool get isUnpaid => paymentStatus == 'unpaid';
}
