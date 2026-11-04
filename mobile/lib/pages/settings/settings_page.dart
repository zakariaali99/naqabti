import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../services/settings_service.dart';
import '../../widgets/general_app_bar.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    // We rely on Get.isDarkMode updating on rebuild, which happens when theme changes
    // But for smoother switch animation, we can also use local state if needed.
    // However, since GetMaterialApp rebuilds the whole app, this should be fine.
    final isDark = Get.isDarkMode;
    final currentLocale = Get.locale?.languageCode ?? 'en';

    return Scaffold(
      appBar: GeneralAppBar(
        title: l10n.settings,
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSection(
            context,
            title: l10n.general,
            children: [
              _buildSettingsTile(
                context,
                icon: Icons.language,
                title: l10n.language,
                subtitle: currentLocale == 'ar' ? l10n.arabic : l10n.english,
                onTap: () => _showLanguageBottomSheet(context, l10n),
                isFirst: true,
                isLast: true,
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          _buildSection(
            context,
            title: l10n.preferences,
            children: [
              // Custom tile for Theme with Switch
              Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: SwitchListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  secondary: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4183D9).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.dark_mode_outlined, color: Color(0xFF4183D9), size: 20),
                  ),
                  title: Text(l10n.darkMode, style: const TextStyle(fontWeight: FontWeight.w500)),
                  subtitle: Text(isDark ? l10n.on : l10n.off, style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color)),
                  activeColor: const Color(0xFF4183D9),
                  value: isDark,
                  onChanged: (value) {
                    final newMode = value ? ThemeMode.dark : ThemeMode.light;
                    SettingsService.to.saveThemeMode(newMode);
                    
                    setState(() {});
                    
                    Get.snackbar(
                      value ? l10n.darkMode : l10n.lightMode,
                      value ? l10n.switchedToDarkMode : l10n.switchedToLightMode,
                      snackPosition: SnackPosition.BOTTOM,
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      colorText: Theme.of(context).colorScheme.onPrimaryContainer,
                      duration: const Duration(seconds: 2),
                      margin: const EdgeInsets.all(16),
                      borderRadius: 12,
                      icon: Icon(
                        value ? Icons.dark_mode : Icons.light_mode,
                        color: const Color(0xFF4183D9),
                      ),
                    );
                  },
                ),
              ),
              Divider(height: 1, thickness: 1, indent: 60, color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
              _buildSettingsTile(
                context,
                icon: Icons.notifications_outlined,
                title: l10n.notifications,
                subtitle: l10n.enabled,
                onTap: () {},
                isLast: true,
                 // Start with false since it's second item
              ),
            ],
          ),

          const SizedBox(height: 24),

          _buildSection(
            context,
            title: l10n.appInfo,
            children: [
              _buildSettingsTile(
                context,
                icon: Icons.info_outline,
                title: l10n.about,
                subtitle: '${l10n.version} ${l10n.applicationVersion}',
                onTap: () {},
                isFirst: true,
                isLast: true,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, {required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isFirst = false,
    bool isLast = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.vertical(
          top: isFirst ? const Radius.circular(16) : Radius.zero,
          bottom: isLast ? const Radius.circular(16) : Radius.zero,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF4183D9).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: const Color(0xFF4183D9), size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 20,
                color: Theme.of(context).colorScheme.outline,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageBottomSheet(BuildContext context, AppLocalizations l10n) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final currentLocale = Get.locale?.languageCode ?? 'en';
        
        return SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  l10n.selectLanguage,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                _buildLanguageOption(
                  context,
                  l10n,
                  code: 'en',
                  name: l10n.english,
                  flag: '🇺🇸',
                  isSelected: currentLocale == 'en',
                ),
                const Divider(),
                _buildLanguageOption(
                  context,
                  l10n,
                  code: 'ar',
                  name: l10n.arabic,
                  flag: '🇸🇦',
                  isSelected: currentLocale == 'ar',
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLanguageOption(
    BuildContext context,
    AppLocalizations l10n, {
    required String code,
    required String name,
    required String flag,
    required bool isSelected,
  }) {
    return ListTile(
      leading: Text(flag, style: const TextStyle(fontSize: 24)),
      title: Text(
        name,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? const Color(0xFF4183D9) : null,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check, color: Color(0xFF4183D9))
          : null,
      onTap: () {
        SettingsService.to.saveLocale(Locale(code));
        Navigator.pop(context);
        setState(() {});
        
        // Show confirmation snackbar
        Get.snackbar(
          l10n.languageChanged,
          code == 'ar'
              ? l10n.languageChangedToArabic
              : l10n.languageChangedToEnglish,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          colorText: Theme.of(context).colorScheme.onPrimaryContainer,
          duration: const Duration(seconds: 2),
          margin: const EdgeInsets.all(16),
          borderRadius: 12,
          icon: Icon(
            Icons.check_circle,
            color: const Color(0xFF4183D9),
          ),
        );
      },
    );
  }
}
