import 'package:flutter/material.dart';
import 'package:dio/dio.dart' as dio;
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:get/get.dart';
import '../../widgets/general_app_bar.dart';
import '../../widgets/profile/complete_profile_modal.dart';
import '../../services/auth_service.dart';
import '../../services/notification_service.dart';
import '../../services/settings_service.dart';
import '../../utils/profile_completion.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../utils/app_snackbar.dart';
import '../../widgets/language_toggle_button.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  Future<void> _toggleTheme() async {
    final settingsService = Get.find<SettingsService>();
    final currentMode = settingsService.themeMode;

    final nextMode = currentMode == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;

    await settingsService.saveThemeMode(nextMode);
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      try {
        final authService = Get.find<AuthService>();
        
        // Get FCM token to send with login
        String? fcmToken;
        try {
          fcmToken = await FirebaseMessaging.instance.getToken();
        } catch (e) {
          print('Error getting FCM token for login: $e');
        }

        final user = await authService.login(
          _usernameController.text.trim(),
          _passwordController.text,
          fcmToken: fcmToken,
        );

        if (mounted && user != null) {
          // Navigate to home page on success
          Get.offAllNamed('/home');

          // Request notification permission
          try {
            final notificationService = Get.find<NotificationService>();
            await notificationService.requestPermission();
          } catch (e) {
            // Ignore errors if service not found or permission request fails
            debugPrint('Error requesting notification permission: $e');
          }

          if (mounted) {
            final l10n = AppLocalizations.of(context)!;
            AppSnackbar.success(
              l10n.loginSuccessful,
              '${l10n.welcome}, ${user.fullName ?? user.username}!',
            );
          }

          // Nudge doctors with an incomplete profile to finish it.
          if (user.userType == 'doctor') {
            final completion = calculateProfileCompletion(user, isDoctor: true);
            if (completion.missingFields.isNotEmpty) {
              Get.dialog(
                CompleteProfileModal(
                  percentage: completion.percentage,
                  missingFields: completion.missingFields,
                  completedFields: completion.completedFields,
                ),
              );
            }
          }
        }
      } catch (e) {
        if (mounted) {
          final l10n = AppLocalizations.of(context)!;
          String errorMessage = l10n.invalidCredentials;
          bool isInactive = false;

          if (e is dio.DioException &&
              e.response?.data.toString().contains('deletion_requested') ==
                  true) {
            final l10n = AppLocalizations.of(context)!;
            Get.dialog(
              AlertDialog(
                title: Text(l10n.accountDeletionPendingTitle),
                content: Text(l10n.accountDeletionPendingMessage),
                actions: [
                  TextButton(
                    onPressed: () => Get.back(),
                    child: Text(l10n.close),
                  ),
                ],
              ),
            );
            return;
          }

          if (e is dio.DioException && e.response != null) {
            final data = e.response?.data;
            // Check for the specific inactive message
            // DRF ValidationError can be a list or a dict
            if (data.toString().contains('User is not active right now')) {
              isInactive = true;
              errorMessage = 'User is not active right now';
            }
          }

          if (isInactive) {
            Get.dialog(
              AlertDialog(
                title: const Text('Account Inactive'),
                content: const Text(
                  'Your account is not active right now. Please contact support or wait for approval.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Get.back(),
                    child: const Text('OK'),
                  ),
                ],
              ),
            );
          } else {
            AppSnackbar.error(
              l10n.loginFailed,
              errorMessage,
            );
          }
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;

    return Scaffold(
      appBar: GeneralAppBar(
        actions: [
          const LanguageToggleButton(),
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: _toggleTheme,
            tooltip: isDark ? 'Switch to light mode' : 'Switch to dark mode',
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SizedBox(
            width: isTablet ? screenWidth * 0.5 : null,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                // Logo
                Image.asset(
                  'assets/images/logo.png',
                  width: 150,
                  height: 150,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 16),
                
                // Welcome Text
                Text(
                  AppLocalizations.of(context)!.signInToContinue,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF4183D9),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Login Form Card
                Card(
                  elevation: 4,
                  shadowColor: Colors.black.withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Username, email or phone (the backend accepts any)
                          TextFormField(
                            controller: _usernameController,
                            decoration: InputDecoration(
                              labelText: AppLocalizations.of(context)!.loginIdentifier,
                              hintText: AppLocalizations.of(context)!.loginIdentifierHint,
                              prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF4183D9)),
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
                              fillColor: isDark ? Colors.grey[800] : Colors.white,
                              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                            ),
                            keyboardType: TextInputType.text,
                            textInputAction: TextInputAction.next,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return AppLocalizations.of(context)!.pleaseEnterYourUsername;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 20),

                          // Password Field
                          TextFormField(
                            controller: _passwordController,
                            obscureText: !_isPasswordVisible,
                            decoration: InputDecoration(
                              labelText: AppLocalizations.of(context)!.password,
                              hintText: AppLocalizations.of(context)!.enterYourPassword,
                              prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF4183D9)),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _isPasswordVisible
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                  color: Colors.grey,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _isPasswordVisible = !_isPasswordVisible;
                                  });
                                },
                              ),
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
                              fillColor: isDark ? Colors.grey[800] : Colors.white,
                              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                            ),
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _handleLogin(),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return AppLocalizations.of(context)!.pleaseEnterYourPassword;
                              }
                              if (value.length < 6) {
                                return AppLocalizations.of(context)!.passwordMustBeAtLeast6Characters;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Forgot Password
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {
                                Get.toNamed('/forgot-password');
                              },
                              style: TextButton.styleFrom(
                                foregroundColor: const Color(0xFF4183D9),
                                padding: const EdgeInsets.symmetric(horizontal: 0),
                              ),
                              child: Text(AppLocalizations.of(context)!.forgotPassword),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Login Button
                          SizedBox(
                            height: 52,
                            child: FilledButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF4183D9),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : Text(
                                      AppLocalizations.of(context)!.signIn,
                                      style: const TextStyle(
                                        fontSize: 18,
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
                
                const SizedBox(height: 32),

                // Divider
                Row(
                  children: [
                    Expanded(child: Divider(color: Colors.grey.withValues(alpha: 0.3))),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        AppLocalizations.of(context)!.or,
                        style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w500),
                      ),
                    ),
                    Expanded(child: Divider(color: Colors.grey.withValues(alpha: 0.3))),
                  ],
                ),
                const SizedBox(height: 32),

                // Register Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      AppLocalizations.of(context)!.dontHaveAccount,
                      style: TextStyle(color: Colors.grey[700], fontSize: 15),
                    ),
                    TextButton(
                      onPressed: () {
                        Get.toNamed('/register');
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFF4183D9),
                      ),
                      child: Text(
                        AppLocalizations.of(context)!.signUp,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                  ],
                ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
