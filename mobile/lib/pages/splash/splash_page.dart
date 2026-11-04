import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../services/auth_service.dart';

/// Splash page that shows while checking authentication status.
/// Attempts to load user profile from stored tokens.
/// If token is expired or invalid, cleans up and redirects to login.
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    final authService = Get.find<AuthService>();

    // Small delay for splash to be visible
    await Future.delayed(const Duration(milliseconds: 500));

    // Check if there's a stored token
    if (authService.hasToken) {
      // Try to load user from token
      final success = await authService.tryRestoreSession();

      if (success && authService.isLoggedIn) {
        // User is authenticated, go to home
        Get.offAllNamed('/home');
      } else {
        // Token expired or invalid, clean up and go to login
        await authService.clearTokens();
        Get.offAllNamed('/login');
      }
    } else {
      // No token, go to login
      Get.offAllNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App logo
            Image.asset(
              'assets/images/logo.png',
              width: 150,
              height: 150,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 48),
            // Loading indicator
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
