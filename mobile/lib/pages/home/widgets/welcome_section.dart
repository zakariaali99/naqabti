import 'package:flutter/material.dart';
import '../../../models/user.dart';

class WelcomeSection extends StatelessWidget {
  final User? user;

  const WelcomeSection({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.0, end: 1.0),
          duration: const Duration(seconds: 1),
          curve: Curves.elasticOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Opacity(
                opacity: value.clamp(0.0, 1.0),
                child: child,
              ),
            );
          },
          child: Container(
            height: 100,
            alignment: Alignment.center,
            child: Image.asset(
              'assets/images/widelogo.png',
              fit: BoxFit.contain,
            ),
          ),
        ),
      
      ],
    );
  }
}
