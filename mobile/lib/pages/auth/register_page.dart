import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../widgets/general_app_bar.dart';
import '../../models/registration/registration_data.dart';
import '../../widgets/registration/steps/account_type_step.dart';
import '../../widgets/registration/steps/credentials_step.dart';
import '../../widgets/registration/steps/welcome_step.dart';
import '../../widgets/language_toggle_button.dart';

enum _RegisterPhase { accountType, credentials, success }

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  _RegisterPhase _phase = _RegisterPhase.accountType;
  final RegistrationData _registrationData = RegistrationData();

  static const _steps = [_RegisterPhase.accountType, _RegisterPhase.credentials];

  void _goToCredentials() {
    setState(() => _phase = _RegisterPhase.credentials);
  }

  void _goToAccountType() {
    setState(() => _phase = _RegisterPhase.accountType);
  }

  void _handleSuccess() {
    setState(() => _phase = _RegisterPhase.success);
  }

  void _handleComplete() {
    Get.offAllNamed('/login');
  }

  Widget _buildCurrentStep() {
    switch (_phase) {
      case _RegisterPhase.accountType:
        return AccountTypeStep(data: _registrationData, onNext: _goToCredentials);
      case _RegisterPhase.credentials:
        return CredentialsStep(
          data: _registrationData,
          onBack: _goToAccountType,
          onSuccess: _handleSuccess,
        );
      case _RegisterPhase.success:
        return WelcomeStep(onContinue: _handleComplete);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final stepNumber = _steps.indexOf(_phase) + 1;

    return Scaffold(
      appBar: GeneralAppBar(
        title: l10n.createAccount,
        showBackButton: _phase == _RegisterPhase.accountType,
        actions: const [LanguageToggleButton()],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_phase != _RegisterPhase.success)
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: stepNumber / _steps.length,
                    minHeight: 6,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).primaryColor,
                    ),
                  ),
                ),
              ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: _buildCurrentStep(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
