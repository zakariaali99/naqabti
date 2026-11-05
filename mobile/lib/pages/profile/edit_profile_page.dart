import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'package:naqabti/l10n/app_localizations.dart';

import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/general_app_bar.dart';
import '../../models/city.dart';
import '../../models/nationality.dart';
import '../../models/academic_degree.dart';
import '../../utils/profile_completion.dart';
import 'change_password_page.dart';
import '../../utils/app_snackbar.dart';
import '../../utils/profile_errors.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final AuthService _authService = Get.find<AuthService>();

  String _initialFor(String? fullName, String? username) {
    final name = (fullName != null && fullName.trim().isNotEmpty)
        ? fullName.trim()
        : (username != null && username.trim().isNotEmpty)
            ? username.trim()
            : '';
    if (name.isEmpty) return 'U';
    return name.substring(0, 1).toUpperCase();
  }

  final _formKey = GlobalKey<FormState>();

  late TextEditingController _usernameController;
  late TextEditingController _emailController;
  late TextEditingController _firstNameArController;
  late TextEditingController _fatherNameArController;
  late TextEditingController _grandfatherNameArController;
  late TextEditingController _familyNameArController;
  late TextEditingController _firstNameEnController;
  late TextEditingController _fatherNameEnController;
  late TextEditingController _grandfatherNameEnController;
  late TextEditingController _familyNameEnController;
  late TextEditingController _phoneNumberController;
  late TextEditingController _specialtyController;
  late TextEditingController _bioController;
  late TextEditingController _addressController;
  late TextEditingController _universityNameController;
  late TextEditingController _membershipNumberController;

  bool _isLoading = false;
  bool _hasChanges = false;
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  List<City> _cities = [];
  int? _selectedCityId;
  bool _isLoadingCities = true;

  DateTime? _selectedBirthdate;
  late TextEditingController _birthDayController;
  late TextEditingController _birthMonthController;
  late TextEditingController _birthYearController;
  late FocusNode _birthMonthFocus;
  late FocusNode _birthYearFocus;

  List<Nationality> _nationalities = [];
  Nationality? _selectedNationality;
  bool _isLoadingNationalities = true;

  List<AcademicDegree> _academicDegrees = [];
  AcademicDegree? _selectedDegree;
  bool _isLoadingDegrees = true;

  String? _selectedPassportPath;
  bool _isPassportPdf = false;

  @override
  void initState() {
    super.initState();
    final user = _authService.user;
    _usernameController = TextEditingController(text: user?.username ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _firstNameArController = TextEditingController(text: user?.firstNameAr ?? '');
    _fatherNameArController = TextEditingController(text: user?.fatherNameAr ?? '');
    _grandfatherNameArController = TextEditingController(text: user?.grandfatherNameAr ?? '');
    _familyNameArController = TextEditingController(text: user?.familyNameAr ?? '');
    _firstNameEnController = TextEditingController(text: user?.firstNameEn ?? '');
    _fatherNameEnController = TextEditingController(text: user?.fatherNameEn ?? '');
    _grandfatherNameEnController = TextEditingController(text: user?.grandfatherNameEn ?? '');
    _familyNameEnController = TextEditingController(text: user?.familyNameEn ?? '');
    _phoneNumberController = TextEditingController(text: user?.phoneNumber ?? '');
    _specialtyController = TextEditingController(text: user?.specialty ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
    _addressController = TextEditingController(text: user?.address ?? '');
    _universityNameController = TextEditingController(text: user?.universityName ?? '');
    _membershipNumberController = TextEditingController(text: user?.membershipNumber ?? '');
    _selectedCityId = user?.cityId;
    _selectedBirthdate = user?.birthdate;
    _birthDayController = TextEditingController(text: _selectedBirthdate?.day.toString() ?? '');
    _birthMonthController = TextEditingController(text: _selectedBirthdate?.month.toString() ?? '');
    _birthYearController = TextEditingController(text: _selectedBirthdate?.year.toString() ?? '');
    _birthMonthFocus = FocusNode();
    _birthYearFocus = FocusNode();

    // Listen for changes
    _usernameController.addListener(_onFieldChanged);
    _emailController.addListener(_onFieldChanged);
    _firstNameArController.addListener(_onFieldChanged);
    _fatherNameArController.addListener(_onFieldChanged);
    _grandfatherNameArController.addListener(_onFieldChanged);
    _familyNameArController.addListener(_onFieldChanged);
    _firstNameEnController.addListener(_onFieldChanged);
    _fatherNameEnController.addListener(_onFieldChanged);
    _grandfatherNameEnController.addListener(_onFieldChanged);
    _familyNameEnController.addListener(_onFieldChanged);
    _phoneNumberController.addListener(_onFieldChanged);
    _specialtyController.addListener(_onFieldChanged);
    _bioController.addListener(_onFieldChanged);
    _addressController.addListener(_onFieldChanged);
    _universityNameController.addListener(_onFieldChanged);
    _membershipNumberController.addListener(_onFieldChanged);
    _birthDayController.addListener(_onBirthdateFieldChanged);
    _birthMonthController.addListener(_onBirthdateFieldChanged);
    _birthYearController.addListener(_onBirthdateFieldChanged);

    _fetchCities();
    _fetchNationalities();
    _fetchAcademicDegrees();
  }

  Future<void> _fetchCities() async {
    try {
      final apiService = Get.find<ApiService>();
      final cities = await apiService.city.getCities(null);
      setState(() {
        _cities = cities;
        _isLoadingCities = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingCities = false;
        });
      }
    }
  }

  Future<void> _fetchNationalities() async {
    try {
      final apiService = Get.find<ApiService>();
      final nationalities = await apiService.nationality.getNationalities(null);
      setState(() {
        _nationalities = nationalities;
        _isLoadingNationalities = false;
        final userNationality = _authService.user?.nationality;
        if (userNationality != null) {
          _selectedNationality = _nationalities.firstWhereOrNull((n) => n.name == userNationality);
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingNationalities = false;
        });
      }
    }
  }

  Future<void> _fetchAcademicDegrees() async {
    try {
      final apiService = Get.find<ApiService>();
      final degrees = await apiService.academicDegree.getAcademicDegrees(null);
      setState(() {
        _academicDegrees = degrees;
        _isLoadingDegrees = false;
        final userDegree = _authService.user?.currentDegree;
        if (userDegree != null) {
          _selectedDegree = _academicDegrees.firstWhereOrNull((d) => d.name == userDegree);
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingDegrees = false;
        });
      }
    }
  }

  void _onFieldChanged() {
    setState(() {
      _hasChanges = true;
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _firstNameArController.dispose();
    _fatherNameArController.dispose();
    _grandfatherNameArController.dispose();
    _familyNameArController.dispose();
    _firstNameEnController.dispose();
    _fatherNameEnController.dispose();
    _grandfatherNameEnController.dispose();
    _familyNameEnController.dispose();
    _phoneNumberController.dispose();
    _specialtyController.dispose();
    _bioController.dispose();
    _addressController.dispose();
    _universityNameController.dispose();
    _membershipNumberController.dispose();
    _birthDayController.dispose();
    _birthMonthController.dispose();
    _birthYearController.dispose();
    _birthMonthFocus.dispose();
    _birthYearFocus.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
          _hasChanges = true;
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  bool get _birthdateFieldsAllEmpty =>
      _birthDayController.text.trim().isEmpty &&
      _birthMonthController.text.trim().isEmpty &&
      _birthYearController.text.trim().isEmpty;

  void _onBirthdateFieldChanged() {
    setState(() {
      _hasChanges = true;
      final day = int.tryParse(_birthDayController.text);
      final month = int.tryParse(_birthMonthController.text);
      final year = int.tryParse(_birthYearController.text);

      if (day != null &&
          month != null &&
          year != null &&
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 1900 &&
          year <= DateTime.now().year) {
        final parsed = DateTime(year, month, day);
        _selectedBirthdate =
            (parsed.day == day && parsed.month == month && parsed.year == year) ? parsed : null;
      } else {
        _selectedBirthdate = null;
      }
    });
  }

  String? _validateBirthDay(String? value) {
    if (_birthdateFieldsAllEmpty) return null;
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.trim().isEmpty) return l10n.pleaseEnterDay;
    final day = int.tryParse(value);
    if (day == null || day < 1 || day > 31) return l10n.dayMustBeBetween1And31;
    return null;
  }

  String? _validateBirthMonth(String? value) {
    if (_birthdateFieldsAllEmpty) return null;
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.trim().isEmpty) return l10n.pleaseEnterMonth;
    final month = int.tryParse(value);
    if (month == null || month < 1 || month > 12) return l10n.monthMustBeBetween1And12;
    return null;
  }

  String? _validateBirthYear(String? value) {
    if (_birthdateFieldsAllEmpty) return null;
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.trim().isEmpty) return l10n.pleaseEnterYear;
    final year = int.tryParse(value);
    final currentYear = DateTime.now().year;
    if (year == null || year < 1900 || year > currentYear) {
      return l10n.yearMustBeBetween1900AndCurrentYear(currentYear.toString());
    }
    return null;
  }

  void _showPassportSourceSheet() {
    final l10n = AppLocalizations.of(context)!;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                l10n.choosePassportSource,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: Text(l10n.uploadFromGallery),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickPassportFromGallery();
                },
              ),
              ListTile(
                leading: const Icon(Icons.picture_as_pdf_outlined),
                title: Text(l10n.uploadPdfDocument),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickPassportPdf();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickPassportFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );
      if (image != null) {
        setState(() {
          _selectedPassportPath = image.path;
          _isPassportPdf = false;
          _hasChanges = true;
        });
      }
    } catch (e) {
      debugPrint('Failed to pick image: $e');
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToPickImage)),
        );
      }
    }
  }

  Future<void> _pickPassportPdf() async {
    try {
      final result = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null && result.path != null) {
        setState(() {
          _selectedPassportPath = result.path!;
          _isPassportPdf = true;
          _hasChanges = true;
        });
      }
    } catch (e) {
      debugPrint('Failed to pick file: $e');
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToPickFile)),
        );
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final l10n = AppLocalizations.of(context)!;

    setState(() {
      _isLoading = true;
    });

    try {
      final userId = _authService.user?.id;
      if (userId == null) {
        throw Exception('User not found');
      }

      // Update Profile Image if selected
      if (_selectedImage != null) {
        await _authService.updateProfilePhoto(_selectedImage!);
      }

      // Update Passport Image if selected
      if (_selectedPassportPath != null) {
        await _authService.uploadPassportImage(File(_selectedPassportPath!));
      }

      // Update User Data
      final userData = <String, dynamic>{
        'username': _usernameController.text,
        'email': _emailController.text,
        'first_name_field': _firstNameArController.text,
        'father_name': _fatherNameArController.text,
        'grandfather_name': _grandfatherNameArController.text,
        'family_name': _familyNameArController.text,
        'first_name_en': _firstNameEnController.text,
        'father_name_en': _fatherNameEnController.text,
        'grandfather_name_en': _grandfatherNameEnController.text,
        'family_name_en': _familyNameEnController.text,
        'phone_number': _phoneNumberController.text,
        'specialty': _specialtyController.text,
        'bio': _bioController.text,
        'city': _selectedCityId,
        'address': _addressController.text,
        'university_name': _universityNameController.text,
        if (_selectedBirthdate != null)
          'birthdate':
              '${_selectedBirthdate!.year.toString().padLeft(4, '0')}-${_selectedBirthdate!.month.toString().padLeft(2, '0')}-${_selectedBirthdate!.day.toString().padLeft(2, '0')}',
        if (_selectedNationality != null) 'nationality': _selectedNationality!.name,
        if (_selectedDegree != null) 'current_degree': _selectedDegree!.name,
        if (_authService.user?.userType == 'doctor')
          'membership_number': _membershipNumberController.text,
      };

      final updatedUser = await _authService.updateProfile(userData);

      if (mounted) {
        setState(() {
          _hasChanges = false;
          _selectedImage = null; // Reset selection so it shows from updated user data (if reloaded)
          _selectedPassportPath = null;
          // Ideally rely on AuthService updating the currentUser observable
        });

        if (updatedUser != null) {
          final isDoctor = updatedUser.userType == 'doctor';
          final result = calculateProfileCompletion(updatedUser, isDoctor: isDoctor);
          _showProfileUpdatedModal(result.percentage);
        } else {
          AppSnackbar.success(
            l10n.success,
            l10n.profileUpdatedSuccessfully,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        AppSnackbar.error(
          l10n.failedToUpdateProfile,
          profileSaveErrorMessage(e, l10n),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final primaryColor = const Color(0xFF4183D9);
    final user = _authService.user;
    final isDoctor = user?.userType == 'doctor';
    final missingFields = user != null
        ? calculateProfileCompletion(user, isDoctor: isDoctor).missingFields
        : const <ProfileCompletionField>[];
    bool isMissing(ProfileCompletionField field) =>
        isDoctor && missingFields.contains(field);

    return Scaffold(
      appBar: GeneralAppBar(
        title: l10n.editProfile,
        showBackButton: true,
        actions: [
          if (_hasChanges)
            TextButton(
              onPressed: _isLoading ? null : _saveProfile,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(l10n.save, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            children: [
              _buildProfilePicture(context, isMissing(ProfileCompletionField.profileImage)),
              const SizedBox(height: 32),

              _buildSectionTitle(context, l10n.personalInformation),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _usernameController,
                label: l10n.username,
                icon: Icons.person_outline,
                validator: (value) => value == null || value.isEmpty ? l10n.usernameRequired : null,
                enabled: false,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _emailController,
                label: l10n.email,
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                isMissing: isMissing(ProfileCompletionField.email),
                validator: (value) {
                  if (value == null || value.isEmpty) return l10n.emailRequired;
                  if (!GetUtils.isEmail(value)) return l10n.pleaseEnterValidEmail;
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Arabic Names
              _buildSectionTitle(
                context,
                l10n.arabicNames,
                isMissing: isMissing(ProfileCompletionField.fullName),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _firstNameArController,
                      label: l10n.firstName,
                      icon: Icons.person_outline,
                      validator: (value) => value == null || value.isEmpty ? l10n.pleaseEnterFirstName : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _fatherNameArController,
                      label: l10n.fatherName,
                      icon: Icons.person_outline,
                      validator: (value) => value == null || value.isEmpty ? l10n.pleaseEnterFatherName : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _grandfatherNameArController,
                      label: l10n.grandfatherName,
                      icon: Icons.person_outline,
                      validator: (value) => value == null || value.isEmpty ? l10n.pleaseEnterGrandfatherName : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _familyNameArController,
                      label: l10n.familyName,
                      icon: Icons.person_outline,
                      validator: (value) => value == null || value.isEmpty ? l10n.pleaseEnterFamilyName : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // English Names
              _buildSectionTitle(context, l10n.englishNames),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _firstNameEnController,
                      label: l10n.firstNameEn,
                      icon: Icons.person_outline,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _fatherNameEnController,
                      label: l10n.fatherNameEn,
                      icon: Icons.person_outline,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _grandfatherNameEnController,
                      label: l10n.grandfatherNameEn,
                      icon: Icons.person_outline,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _familyNameEnController,
                      label: l10n.familyNameEn,
                      icon: Icons.person_outline,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Birthdate
              _buildSectionTitle(
                context,
                l10n.birthdate,
                isMissing: isMissing(ProfileCompletionField.birthdate),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _birthDayController,
                      label: l10n.day,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 2,
                      hideCounter: true,
                      textInputAction: TextInputAction.next,
                      onFieldSubmitted: (_) => _birthMonthFocus.requestFocus(),
                      validator: _validateBirthDay,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _birthMonthController,
                      label: l10n.month,
                      focusNode: _birthMonthFocus,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 2,
                      hideCounter: true,
                      textInputAction: TextInputAction.next,
                      onFieldSubmitted: (_) => _birthYearFocus.requestFocus(),
                      validator: _validateBirthMonth,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _birthYearController,
                      label: l10n.year,
                      focusNode: _birthYearFocus,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 4,
                      hideCounter: true,
                      textInputAction: TextInputAction.done,
                      validator: _validateBirthYear,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // City Selection
              _buildSectionTitle(context, l10n.city),
              const SizedBox(height: 16),
              if (_isLoadingCities)
                const Center(child: CircularProgressIndicator())
              else
                DropdownButtonFormField<int>(
                  value: _selectedCityId,
                  decoration: _dropdownDecoration(
                    label: l10n.city,
                    icon: Icons.location_city,
                    isMissing: isMissing(ProfileCompletionField.city),
                  ),
                  items: _cities.map((city) {
                    return DropdownMenuItem<int>(
                      value: city.id,
                      child: Text(city.displayName(Localizations.localeOf(context).languageCode == 'ar')),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedCityId = value;
                      _hasChanges = true;
                    });
                  },
                ),
              const SizedBox(height: 24),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _phoneNumberController,
                label: l10n.phoneNumber,
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                isMissing: isMissing(ProfileCompletionField.phoneNumber),
              ),
              const SizedBox(height: 32),

              // Location Information
              _buildSectionTitle(context, l10n.locationInformation),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _addressController,
                label: l10n.address,
                icon: Icons.home_outlined,
                maxLines: 2,
                isMissing: isMissing(ProfileCompletionField.address),
              ),
              const SizedBox(height: 16),

              if (_isLoadingNationalities)
                const Center(child: CircularProgressIndicator())
              else
                DropdownButtonFormField<Nationality>(
                  value: _selectedNationality,
                  decoration: _dropdownDecoration(
                    label: l10n.nationality,
                    icon: Icons.flag_outlined,
                    isMissing: isMissing(ProfileCompletionField.nationality),
                  ),
                  items: _sortedNationalities(context).map((nationality) {
                    return DropdownMenuItem<Nationality>(
                      value: nationality,
                      child: Text(
                        nationality.displayName(Localizations.localeOf(context).languageCode == 'ar'),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedNationality = value;
                      _hasChanges = true;
                    });
                  },
                ),
              const SizedBox(height: 16),

              _buildPassportUpload(context, isMissing(ProfileCompletionField.passportImage)),
              const SizedBox(height: 32),

              // Education Information
              _buildSectionTitle(context, l10n.educationInformation),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _universityNameController,
                label: l10n.universityName,
                icon: Icons.school_outlined,
                isMissing: isMissing(ProfileCompletionField.universityName),
              ),
              const SizedBox(height: 16),

              if (_isLoadingDegrees)
                const Center(child: CircularProgressIndicator())
              else
                DropdownButtonFormField<AcademicDegree>(
                  value: _selectedDegree,
                  decoration: _dropdownDecoration(
                    label: l10n.currentDegree,
                    icon: Icons.workspace_premium_outlined,
                    isMissing: isMissing(ProfileCompletionField.currentDegree),
                  ),
                  items: _academicDegrees.map((degree) {
                    return DropdownMenuItem<AcademicDegree>(
                      value: degree,
                      child: Text(degree.name),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedDegree = value;
                      _hasChanges = true;
                    });
                  },
                ),
              const SizedBox(height: 32),

              if (isDoctor) ...[
                _buildSectionTitle(context, l10n.doctorInformation),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _membershipNumberController,
                  label: l10n.membershipNumber,
                  icon: Icons.badge_outlined,
                  isMissing: isMissing(ProfileCompletionField.membershipNumber),
                ),
                const SizedBox(height: 32),
              ],

              _buildSectionTitle(context, l10n.professionalInformation),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _specialtyController,
                label: l10n.specialty,
                icon: Icons.medical_services_outlined,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                controller: _bioController,
                label: l10n.bio,
                icon: Icons.info_outline,
                maxLines: 4,
                maxLength: 500,
                alignLabelWithHint: true,
              ),
              const SizedBox(height: 40),

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton(
                  onPressed: _isLoading || !_hasChanges ? null : _saveProfile,
                  style: FilledButton.styleFrom(
                    backgroundColor: primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          l10n.saveChanges,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),

              // Change Password Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton.icon(
                  onPressed: () => Get.to(() => const ChangePasswordPage()),
                  icon: const Icon(Icons.lock_outline),
                  label: Text(l10n.changePassword),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.grey[700],
                    side: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  void _showProfileUpdatedModal(int percentage) {
    final l10n = AppLocalizations.of(context)!;
    const primaryColor = Color(0xFF4183D9);

    Get.dialog(
      barrierDismissible: false,
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.check_circle_outline, color: Colors.green),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      l10n.profileUpdatedModalTitle,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                l10n.profileUpdatedSuccessfully,
                style: TextStyle(color: Colors.grey[700]),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.profileCompletion,
                    style: TextStyle(fontSize: 13, color: Colors.grey[600], fontWeight: FontWeight.w500),
                  ),
                  Text(
                    '$percentage%',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: percentage / 100,
                  minHeight: 6,
                  backgroundColor: Colors.grey[200],
                  valueColor: const AlwaysStoppedAnimation<Color>(primaryColor),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Get.back();
                    Get.offAllNamed('/home');
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    l10n.close,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Nationality> _sortedNationalities(BuildContext context) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    final sorted = List<Nationality>.from(_nationalities);
    sorted.sort((a, b) => a.displayName(isArabic).compareTo(b.displayName(isArabic)));
    return sorted;
  }

  Widget _missingIcon() {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Tooltip(
        message: l10n.fieldNeededForCompletion,
        child: Icon(Icons.info_outline, size: 13, color: Colors.orange[700]),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title, {bool isMissing = false}) {
    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: const Color(0xFF4183D9),
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          if (isMissing) _missingIcon(),
        ],
      ),
    );
  }

  Widget _buildProfilePicture(BuildContext context, bool isMissing) {
    final primaryColor = const Color(0xFF4183D9);

    return Center(
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: primaryColor.withValues(alpha: 0.2),
                    width: 2,
                  ),
                ),
                child: CircleAvatar(
                  radius: 64,
                  backgroundColor: primaryColor.withValues(alpha: 0.1),
                  backgroundImage: _selectedImage != null
                      ? FileImage(_selectedImage!)
                      : (_authService.user?.profileImage != null
                          ? NetworkImage(_authService.user!.profileImage!)
                          : null) as ImageProvider<Object>?,
                  child: _selectedImage == null &&
                          _authService.user?.profileImage == null
                      ? Text(
                          _initialFor(
                            _authService.user?.fullName,
                            _authService.user?.username,
                          ),
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                          ),
                        )
                      : null,
                ),
              ),
              Positioned(
                bottom: 4,
                right: 4,
                child: Material(
                  color: primaryColor,
                  shape: const CircleBorder(),
                  elevation: 2,
                  child: InkWell(
                    onTap: _pickImage,
                    customBorder: const CircleBorder(),
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(Icons.camera_alt, color: Colors.white, size: 20),
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (isMissing) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  AppLocalizations.of(context)!.profilePhoto,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                _missingIcon(),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPassportUpload(BuildContext context, bool isMissing) {
    final l10n = AppLocalizations.of(context)!;
    final hasExisting = _authService.user?.passportImage != null &&
        _authService.user!.passportImage!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              l10n.passportImage,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            if (isMissing) _missingIcon(),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: _showPassportSourceSheet,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
              borderRadius: BorderRadius.circular(16),
              color: Colors.grey.withValues(alpha: 0.05),
            ),
            child: Column(
              children: [
                if (_selectedPassportPath != null && !_isPassportPdf) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(_selectedPassportPath!),
                      height: 160,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(height: 12),
                ] else if (_selectedPassportPath != null && _isPassportPdf) ...[
                  Icon(Icons.picture_as_pdf, size: 48, color: Colors.red[400]),
                  const SizedBox(height: 8),
                  Text(
                    _selectedPassportPath!.split('/').last,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                ] else if (hasExisting) ...[
                  Icon(Icons.check_circle, size: 40, color: Colors.green[600]),
                  const SizedBox(height: 8),
                ],
                Icon(
                  (_selectedPassportPath != null || hasExisting) ? Icons.edit : Icons.upload_file,
                  size: 32,
                  color: const Color(0xFF4183D9),
                ),
                const SizedBox(height: 8),
                Text(
                  (_selectedPassportPath != null || hasExisting)
                      ? l10n.tapToChangePassportImage
                      : l10n.tapToUploadPassportImage,
                  style: const TextStyle(color: Color(0xFF4183D9), fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  InputDecoration _fieldDecoration({
    required String label,
    IconData? icon,
    bool isMissing = false,
    bool enabled = true,
  }) {
    final primaryColor = const Color(0xFF4183D9);
    return InputDecoration(
      label: isMissing ? _missingLabel(label) : null,
      labelText: isMissing ? null : label,
      hintText: 'Enter $label',
      prefixIcon: icon != null ? Icon(icon, color: primaryColor.withValues(alpha: 0.7)) : null,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: primaryColor, width: 2),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      filled: true,
      fillColor: enabled ? Colors.grey.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.1),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }

  InputDecoration _dropdownDecoration({
    required String label,
    required IconData icon,
    bool isMissing = false,
  }) {
    return _fieldDecoration(label: label, icon: icon, isMissing: isMissing);
  }

  Widget _missingLabel(String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(text),
        _missingIcon(),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    IconData? icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    int maxLines = 1,
    int? maxLength,
    bool alignLabelWithHint = false,
    bool enabled = true,
    bool isMissing = false,
    bool hideCounter = false,
    FocusNode? focusNode,
    TextInputAction? textInputAction,
    void Function(String)? onFieldSubmitted,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      focusNode: focusNode,
      decoration: _fieldDecoration(
        label: label,
        icon: icon,
        isMissing: isMissing,
        enabled: enabled,
      ).copyWith(
        alignLabelWithHint: alignLabelWithHint,
        counterText: hideCounter ? '' : null,
      ),
      keyboardType: keyboardType,
      validator: validator,
      maxLines: maxLines,
      maxLength: maxLength,
      textInputAction: textInputAction,
      onFieldSubmitted: onFieldSubmitted,
      inputFormatters: inputFormatters,
    );
  }
}
