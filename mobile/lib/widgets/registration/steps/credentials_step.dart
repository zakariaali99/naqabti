import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../../models/registration/registration_data.dart';
import '../../../services/auth_service.dart';
import '../../../utils/external_links.dart';

class CredentialsStep extends StatefulWidget {
  final RegistrationData data;
  final VoidCallback onBack;
  final VoidCallback onSuccess;

  const CredentialsStep({
    super.key,
    required this.data,
    required this.onBack,
    required this.onSuccess,
  });

  @override
  State<CredentialsStep> createState() => _CredentialsStepState();
}

class _CredentialsStepState extends State<CredentialsStep> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstNameController;
  late final TextEditingController _familyNameController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _confirmPasswordController;
  late final TextEditingController _phoneController;
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isLoading = false;

  // Field-level errors returned by the backend, shown below the matching field.
  String? _firstNameServerError;
  String? _familyNameServerError;
  String? _emailServerError;
  String? _passwordServerError;
  String? _phoneServerError;

  bool get _isInstitution => widget.data.userType == 'institution';

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.data.firstName);
    _familyNameController = TextEditingController(text: widget.data.familyName);
    _emailController = TextEditingController(text: widget.data.email);
    _passwordController = TextEditingController(text: widget.data.password);
    _confirmPasswordController = TextEditingController();
    _phoneController = TextEditingController(text: widget.data.phoneNumber);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _familyNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final l10n = AppLocalizations.of(context)!;

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    widget.data.firstName = _firstNameController.text.trim();
    widget.data.familyName = _familyNameController.text.trim();
    widget.data.email = _emailController.text.trim();
    widget.data.password = _passwordController.text;
    widget.data.phoneNumber =
        _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim();

    try {
      final formData = widget.data.toFormData();
      await Get.find<AuthService>().register(formData);

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        widget.onSuccess();
      }
    } on DioException catch (e) {
      debugPrint('========== REGISTER ERROR ==========');
      debugPrint('URL: ${e.requestOptions.method} ${e.requestOptions.uri}');
      debugPrint('Type: ${e.type}');
      debugPrint('Status: ${e.response?.statusCode}');
      debugPrint('Response: ${e.response?.data}');
      debugPrint('Message: ${e.message}');
      debugPrint('====================================');

      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });

      String errorMessage = l10n.registrationFailed;

      if (e.response != null && e.response!.data != null) {
        final data = e.response!.data;

        if (data is Map) {
          _firstNameServerError = _flattenErrorValueOrNull(data['first_name']);
          _familyNameServerError =
              _flattenErrorValueOrNull(data['family_name']);
          _emailServerError = _flattenErrorValueOrNull(data['email']);
          _passwordServerError = _flattenErrorValueOrNull(data['password']);
          _phoneServerError = _flattenErrorValueOrNull(data['phone_number']);
          _formKey.currentState!.validate();
        }

        errorMessage = _parseErrorResponse(data, l10n);
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = l10n.connectionTimeoutPleaseTryAgain;
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = l10n.noInternetConnection;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    } catch (e, stackTrace) {
      debugPrint('========== REGISTER UNEXPECTED ERROR ==========');
      debugPrint('Error: $e');
      debugPrint('Stack: $stackTrace');
      debugPrint('===============================================');

      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${l10n.unexpectedErrorOccurred}: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  /// Builds a human-readable message from a backend error response.
  /// Handles DRF-style field errors ({"field": ["msg", ...]}), {"detail": ...},
  /// {"error": ...}, plain strings, and nested structures.
  String _parseErrorResponse(dynamic data, AppLocalizations l10n) {
    if (data is String) {
      return data.isNotEmpty ? data : l10n.registrationFailed;
    }

    if (data is Map) {
      for (final key in ['detail', 'error', 'message']) {
        final value = data[key];
        if (value is String && value.isNotEmpty) return value;
      }

      final parts = <String>[];
      data.forEach((key, value) {
        final message = _flattenErrorValue(value);
        if (message.isEmpty) return;

        if (key == 'non_field_errors' || key == 'detail') {
          parts.add(message);
        } else {
          parts.add('${_fieldLabel(key.toString(), l10n)}: $message');
        }
      });

      if (parts.isNotEmpty) return parts.join('\n');
    }

    if (data is List && data.isNotEmpty) {
      return _flattenErrorValue(data);
    }

    return l10n.registrationFailed;
  }

  /// Like [_flattenErrorValue] but returns null when there is no message,
  /// so it can be assigned directly to a nullable field-error state.
  String? _flattenErrorValueOrNull(dynamic value) {
    if (value == null) return null;
    final message = _flattenErrorValue(value);
    return message.isEmpty ? null : message;
  }

  /// Flattens a DRF error value (String, List, or nested Map) into one string.
  String _flattenErrorValue(dynamic value) {
    if (value is String) return value;
    if (value is List) {
      return value.map(_flattenErrorValue).where((s) => s.isNotEmpty).join(', ');
    }
    if (value is Map) {
      return value.values
          .map(_flattenErrorValue)
          .where((s) => s.isNotEmpty)
          .join(', ');
    }
    return value?.toString() ?? '';
  }

  /// Maps a backend field name to a localized label, falling back to the
  /// humanized field name so the user can still tell which field failed.
  String _fieldLabel(String key, AppLocalizations l10n) {
    switch (key) {
      case 'first_name':
        return l10n.firstName;
      case 'family_name':
        return l10n.familyName;
      case 'email':
        return l10n.email;
      case 'password':
        return l10n.password;
      case 'phone_number':
        return l10n.phone;
      default:
        return key
            .split('_')
            .where((w) => w.isNotEmpty)
            .map((w) => '${w[0].toUpperCase()}${w.substring(1)}')
            .join(' ');
    }
  }

  /// Mirrors the backend's password validation rules so errors surface
  /// before submission instead of only after a round trip.
  String? _validatePassword(String? value) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.isEmpty) {
      return l10n.pleaseEnterPassword;
    }
    if (value.length < 8) {
      return l10n.passwordMustBeAtLeast8Characters;
    }
    if (RegExp(r'^[0-9]+$').hasMatch(value)) {
      return l10n.passwordCannotBeEntirelyNumeric;
    }
    if (!RegExp(r'[A-Za-z]').hasMatch(value)) {
      return l10n.passwordMustContainLetter;
    }
    return _passwordServerError;
  }

  InputDecoration _decoration({
    required String label,
    required String hint,
    required IconData icon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: Icon(icon, color: const Color(0xFF4183D9)),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF4183D9), width: 2),
      ),
      filled: true,
      fillColor: Theme.of(context).brightness == Brightness.dark
          ? Colors.grey[800]
          : Colors.white,
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            l10n.accountCredentials,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            l10n.enterEmailAndChoosePassword,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          TextFormField(
            controller: _firstNameController,
            decoration: _decoration(
              label: l10n.firstName,
              hint: l10n.firstName,
              icon: Icons.person_outline,
            ),
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (_firstNameServerError != null) {
                setState(() => _firstNameServerError = null);
              }
            },
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return l10n.pleaseEnterFirstName;
              }
              return _firstNameServerError;
            },
          ),
          const SizedBox(height: 20),

          TextFormField(
            controller: _familyNameController,
            decoration: _decoration(
              label: l10n.familyName,
              hint: l10n.familyName,
              icon: Icons.badge_outlined,
            ),
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (_familyNameServerError != null) {
                setState(() => _familyNameServerError = null);
              }
            },
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return l10n.pleaseEnterFamilyName;
              }
              return _familyNameServerError;
            },
          ),
          const SizedBox(height: 20),

          TextFormField(
            controller: _emailController,
            decoration: _decoration(
              label: l10n.email,
              hint: l10n.enterYourEmail,
              icon: Icons.email_outlined,
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (_emailServerError != null) {
                setState(() => _emailServerError = null);
              }
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return l10n.pleaseEnterYourEmail;
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return l10n.pleaseEnterValidEmail;
              }
              return _emailServerError;
            },
          ),
          const SizedBox(height: 20),

          TextFormField(
            controller: _passwordController,
            obscureText: !_isPasswordVisible,
            decoration: _decoration(
              label: l10n.password,
              hint: l10n.createPassword,
              icon: Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(
                  _isPasswordVisible ? Icons.visibility_off : Icons.visibility,
                  color: Colors.grey,
                ),
                onPressed: () {
                  setState(() => _isPasswordVisible = !_isPasswordVisible);
                },
              ),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (_passwordServerError != null) {
                setState(() => _passwordServerError = null);
              }
            },
            validator: _validatePassword,
          ),
          const SizedBox(height: 20),

          TextFormField(
            controller: _confirmPasswordController,
            obscureText: !_isConfirmPasswordVisible,
            decoration: _decoration(
              label: l10n.confirmPassword,
              hint: l10n.reEnterYourPassword,
              icon: Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(
                  _isConfirmPasswordVisible
                      ? Icons.visibility_off
                      : Icons.visibility,
                  color: Colors.grey,
                ),
                onPressed: () {
                  setState(
                      () => _isConfirmPasswordVisible = !_isConfirmPasswordVisible);
                },
              ),
            ),
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return l10n.pleaseConfirmYourPassword;
              }
              if (value != _passwordController.text) {
                return l10n.passwordsDoNotMatch;
              }
              return null;
            },
          ),
          const SizedBox(height: 20),

          TextFormField(
            controller: _phoneController,
            decoration: _decoration(
              label: _isInstitution ? l10n.phone : l10n.phoneOptional,
              hint: l10n.enterYourPhoneNumber,
              icon: Icons.phone_outlined,
            ),
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
            onChanged: (_) {
              if (_phoneServerError != null) {
                setState(() => _phoneServerError = null);
              }
            },
            onFieldSubmitted: (_) => _handleSubmit(),
            validator: (value) {
              if (_isInstitution && (value == null || value.isEmpty)) {
                return l10n.pleaseEnterYourPhoneNumber;
              }
              return _phoneServerError;
            },
          ),
          const SizedBox(height: 24),

          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                l10n.byRegisteringYouAgreeTo,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              TextButton(
                onPressed: () =>
                    ExternalLinks.open(Uri.parse(ExternalLinks.privacyPolicy)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(l10n.privacyPolicy),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isLoading ? null : widget.onBack,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    l10n.back,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF4183D9),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          l10n.submit,
                          style:
                              const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
