import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../services/auth_service.dart';
import '../../utils/password_rules.dart';
import '../../widgets/general_app_bar.dart';
import '../../utils/app_snackbar.dart';
import '../../widgets/language_toggle_button.dart';

/// Two steps: request a 6-digit code by email, then enter the code with a
/// new password (backed by auth/reset-password and auth/confirm-password-reset).
class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final AuthService _authService = Get.find<AuthService>();

  bool _isLoading = false;
  bool _obscure = true;
  int? _userId;
  String? _codeError;
  String? _passwordServerError;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _showError(Object error) {
    final l10n = AppLocalizations.of(context)!;
    AppSnackbar.error(
      l10n.error,
      isConnectionError(error)
          ? l10n.checkInternetConnection
          : l10n.somethingWentWrong,
    );
  }

  Future<void> _requestCode() async {
    // The email form is only on screen in the first step; "resend" reuses
    // the address that was already validated.
    final emailForm = _emailFormKey.currentState;
    if (emailForm != null && !emailForm.validate()) return;
    final l10n = AppLocalizations.of(context)!;

    setState(() => _isLoading = true);
    try {
      final userId =
          await _authService.requestPasswordReset(_emailController.text.trim());
      if (!mounted) return;
      if (userId == null) {
        AppSnackbar.error(
          l10n.resetPassword,
          l10n.resetCodeNotSent,
        );
        return;
      }
      setState(() {
        _userId = userId;
        _codeError = null;
        _passwordServerError = null;
      });
    } catch (e) {
      if (mounted) _showError(e);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    setState(() {
      _codeError = null;
      _passwordServerError = null;
    });
    if (!_resetFormKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;

    setState(() => _isLoading = true);
    try {
      await _authService.confirmPasswordReset(
        _userId!,
        _codeController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;
      Get.back();
      AppSnackbar.success(
        l10n.success,
        l10n.passwordResetSuccess,
      );
    } catch (e) {
      if (!mounted) return;
      final message = apiErrorMessage(e);
      if (message != null && message.toLowerCase().contains('code')) {
        setState(() => _codeError = l10n.invalidOrExpiredCode);
      } else if (message != null) {
        setState(() => _passwordServerError = message);
      } else {
        _showError(e);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: GeneralAppBar(
        title: l10n.resetPassword,
        showBackButton: true,
        onBackPressed: () => Get.back(),
        actions: const [LanguageToggleButton()],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: _userId == null
                ? _buildEmailStep(l10n)
                : _buildResetStep(l10n),
          ),
        ),
      ),
    );
  }

  Widget _header(String title, String description) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Image.asset(
          'assets/images/logo.png',
          width: 100,
          height: 100,
          fit: BoxFit.contain,
        ),
        const SizedBox(height: 24),
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          description,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _primaryButton(String label, VoidCallback onPressed) {
    return FilledButton(
      onPressed: _isLoading ? null : onPressed,
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: _isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(
              label,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
    );
  }

  Widget _secondaryButton(String label, VoidCallback onPressed) {
    return OutlinedButton(
      onPressed: _isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  InputDecoration _decoration(
    String label,
    IconData icon, {
    String? errorText,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      errorText: errorText,
      errorMaxLines: 3,
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Widget _buildEmailStep(AppLocalizations l10n) {
    return Form(
      key: _emailFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header(l10n.forgotPasswordQuestion, l10n.forgotPasswordCodeDescription),
          TextFormField(
            controller: _emailController,
            decoration: _decoration(l10n.email, Icons.email_outlined),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _isLoading ? null : _requestCode(),
            validator: (value) {
              final email = value?.trim() ?? '';
              if (email.isEmpty) return l10n.pleaseEnterYourEmail;
              if (!RegExp(r'^[\w\-\.+]+@([\w-]+\.)+[\w-]{2,}$').hasMatch(email)) {
                return l10n.pleaseEnterAValidEmail;
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          _primaryButton(l10n.sendResetCode, _requestCode),
          const SizedBox(height: 16),
          _secondaryButton(l10n.backToSignIn, () => Get.back()),
        ],
      ),
    );
  }

  Widget _buildResetStep(AppLocalizations l10n) {
    final visibilityToggle = IconButton(
      icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
      onPressed: () => setState(() => _obscure = !_obscure),
    );

    return Form(
      key: _resetFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header(l10n.resetPassword, l10n.resetCodeSentDescription),
          Text(
            _emailController.text.trim(),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _codeController,
            decoration: _decoration(
              l10n.verificationCode,
              Icons.pin_outlined,
              errorText: _codeError,
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            textInputAction: TextInputAction.next,
            validator: (value) => (value == null || value.trim().length != 6)
                ? l10n.pleaseEnterVerificationCode
                : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscure,
            decoration: _decoration(
              l10n.newPassword,
              Icons.lock_outline,
              errorText: _passwordServerError,
              suffixIcon: visibilityToggle,
            ),
            textInputAction: TextInputAction.next,
            validator: (value) => validateNewPassword(value, l10n),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmController,
            obscureText: _obscure,
            decoration: _decoration(l10n.confirmPassword, Icons.lock_outline),
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _isLoading ? null : _resetPassword(),
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
          const SizedBox(height: 24),
          _primaryButton(l10n.resetPassword, _resetPassword),
          const SizedBox(height: 16),
          _secondaryButton(l10n.resendCode, _requestCode),
        ],
      ),
    );
  }
}
