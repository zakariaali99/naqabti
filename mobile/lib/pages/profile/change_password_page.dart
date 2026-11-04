import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../services/auth_service.dart';
import '../../utils/password_rules.dart';
import '../../widgets/general_app_bar.dart';
import '../../utils/app_snackbar.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  final AuthService _authService = Get.find<AuthService>();

  bool _isLoading = false;
  bool _obscure = true;
  String? _currentPasswordError;
  String? _newPasswordServerError;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _currentPasswordError = null;
      _newPasswordServerError = null;
    });
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await _authService.changePassword(
        _currentController.text,
        _newController.text,
      );
      if (!mounted) return;
      Get.back();
      AppSnackbar.success(
        l10n.success,
        l10n.passwordChangedSuccess,
      );
    } catch (e) {
      if (!mounted) return;
      final passwordError = passwordServerError(e, l10n);
      final message = apiErrorMessage(e);
      if (passwordError != null) {
        setState(() => _newPasswordServerError = passwordError);
      } else if (message == 'Current password is incorrect') {
        setState(() => _currentPasswordError = l10n.currentPasswordIncorrect);
      } else if (message != null) {
        setState(() => _newPasswordServerError = message);
      } else {
        AppSnackbar.error(
          l10n.error,
          isConnectionError(e)
              ? l10n.checkInternetConnection
              : l10n.somethingWentWrong,
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  InputDecoration _decoration(String label, {String? errorText}) {
    return InputDecoration(
      labelText: label,
      errorText: errorText,
      errorMaxLines: 3,
      prefixIcon: const Icon(Icons.lock_outline),
      suffixIcon: IconButton(
        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
        onPressed: () => setState(() => _obscure = !_obscure),
      ),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: GeneralAppBar(title: l10n.changePassword, showBackButton: true),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _currentController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: _decoration(
                    l10n.currentPassword,
                    errorText: _currentPasswordError,
                  ),
                  validator: (value) => (value == null || value.isEmpty)
                      ? l10n.pleaseEnterYourPassword
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _newController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: _decoration(
                    l10n.newPassword,
                    errorText: _newPasswordServerError,
                  ),
                  validator: (value) => validateNewPassword(value, l10n),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _isLoading ? null : _submit(),
                  decoration: _decoration(l10n.confirmPassword),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return l10n.pleaseConfirmYourPassword;
                    }
                    if (value != _newController.text) {
                      return l10n.passwordsDoNotMatch;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 32),
                SizedBox(
                  height: 56,
                  child: FilledButton(
                    onPressed: _isLoading ? null : _submit,
                    style: FilledButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            l10n.changePassword,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
