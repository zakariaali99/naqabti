import 'package:naqabti/l10n/app_localizations.dart';
import '../models/user.dart';

enum ProfileCompletionField {
  email,
  fullName,
  phoneNumber,
  profileImage,
  birthdate,
  city,
  address,
  nationality,
  passportImage,
  universityName,
  currentDegree,
  membershipNumber,
}

const List<ProfileCompletionField> _baseFields = [
  ProfileCompletionField.email,
  ProfileCompletionField.fullName,
  ProfileCompletionField.phoneNumber,
  ProfileCompletionField.profileImage,
  ProfileCompletionField.birthdate,
  ProfileCompletionField.city,
  ProfileCompletionField.address,
  ProfileCompletionField.nationality,
  ProfileCompletionField.passportImage,
  ProfileCompletionField.universityName,
  ProfileCompletionField.currentDegree,
];

// Doctors also need a membership number to actually complete a membership application.
const List<ProfileCompletionField> _doctorOnlyFields = [
  ProfileCompletionField.membershipNumber,
];

List<ProfileCompletionField> getProfileCompletionFields(bool isDoctor) {
  return isDoctor ? [..._baseFields, ..._doctorOnlyFields] : _baseFields;
}

class ProfileCompletionResult {
  final int percentage;
  final List<ProfileCompletionField> missingFields;
  final List<ProfileCompletionField> completedFields;

  const ProfileCompletionResult({
    required this.percentage,
    required this.missingFields,
    required this.completedFields,
  });
}

bool _hasValue(User user, ProfileCompletionField field) {
  switch (field) {
    case ProfileCompletionField.email:
      return user.email != null && user.email!.isNotEmpty;
    case ProfileCompletionField.fullName:
      return user.fullName != null && user.fullName!.isNotEmpty;
    case ProfileCompletionField.phoneNumber:
      return user.phoneNumber != null && user.phoneNumber!.isNotEmpty;
    case ProfileCompletionField.profileImage:
      return user.profileImage != null && user.profileImage!.isNotEmpty;
    case ProfileCompletionField.birthdate:
      return user.birthdate != null;
    case ProfileCompletionField.city:
      return user.cityId != null;
    case ProfileCompletionField.address:
      return user.address != null && user.address!.isNotEmpty;
    case ProfileCompletionField.nationality:
      return user.nationality != null && user.nationality!.isNotEmpty;
    case ProfileCompletionField.passportImage:
      return user.passportImage != null && user.passportImage!.isNotEmpty;
    case ProfileCompletionField.universityName:
      return user.universityName != null && user.universityName!.isNotEmpty;
    case ProfileCompletionField.currentDegree:
      return user.currentDegree != null && user.currentDegree!.isNotEmpty;
    case ProfileCompletionField.membershipNumber:
      return user.membershipNumber != null && user.membershipNumber!.isNotEmpty;
  }
}

ProfileCompletionResult calculateProfileCompletion(User user, {required bool isDoctor}) {
  final fields = getProfileCompletionFields(isDoctor);
  final missingFields = fields.where((f) => !_hasValue(user, f)).toList();
  final completedFields = fields.where((f) => _hasValue(user, f)).toList();
  final percentage = fields.isEmpty
      ? 100
      : (((fields.length - missingFields.length) / fields.length) * 100).round();

  return ProfileCompletionResult(
    percentage: percentage,
    missingFields: missingFields,
    completedFields: completedFields,
  );
}

/// Maps each field to the l10n label already used for it elsewhere in the
/// app, so hints shown outside the form (e.g. the complete-profile modal)
/// stay consistent with the edit-profile form's own field labels.
String profileCompletionFieldLabel(ProfileCompletionField field, AppLocalizations l10n) {
  switch (field) {
    case ProfileCompletionField.email:
      return l10n.email;
    case ProfileCompletionField.fullName:
      return l10n.name;
    case ProfileCompletionField.phoneNumber:
      return l10n.phoneNumber;
    case ProfileCompletionField.profileImage:
      return l10n.profilePhoto;
    case ProfileCompletionField.birthdate:
      return l10n.birthdate;
    case ProfileCompletionField.city:
      return l10n.city;
    case ProfileCompletionField.address:
      return l10n.address;
    case ProfileCompletionField.nationality:
      return l10n.nationality;
    case ProfileCompletionField.passportImage:
      return l10n.passportImage;
    case ProfileCompletionField.universityName:
      return l10n.universityName;
    case ProfileCompletionField.currentDegree:
      return l10n.currentDegree;
    case ProfileCompletionField.membershipNumber:
      return l10n.membershipNumber;
  }
}
