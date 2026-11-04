import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../services/settings_service.dart';

/// App bar button that switches between Arabic and English.
class LanguageToggleButton extends StatelessWidget {
  const LanguageToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isArabic = (Get.locale?.languageCode ?? 'en') == 'ar';

    return IconButton(
      icon: SizedBox(
        width: 24,
        height: 24,
        child: Center(
          // Shows the language the button switches to.
          child: Text(
            isArabic ? 'EN' : 'ع',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              height: 1.0,
            ),
          ),
        ),
      ),
      tooltip: isArabic ? l10n.english : l10n.arabic,
      onPressed: () => SettingsService.to.saveLocale(
        isArabic ? const Locale('en') : const Locale('ar'),
      ),
    );
  }
}
