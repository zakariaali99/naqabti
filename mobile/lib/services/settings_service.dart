import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsService extends GetxService {
  static SettingsService get to => Get.find();
  
  late SharedPreferences _prefs;
  final Rx<ThemeMode> _themeMode = ThemeMode.system.obs;
  final Rx<Locale> _locale = const Locale('en').obs;

  ThemeMode get themeMode => _themeMode.value;
  Locale get locale => _locale.value;

  Future<SettingsService> init() async {
    _prefs = await SharedPreferences.getInstance();
    
    // Load saved settings
    _loadThemeMode();
    _loadLocale();
    
    return this;
  }

  void _loadThemeMode() {
    final modeString = _prefs.getString('theme_mode');
    switch (modeString) {
      case 'dark':
        _themeMode.value = ThemeMode.dark;
        break;
      case 'light':
        _themeMode.value = ThemeMode.light;
        break;
      default:
        _themeMode.value = ThemeMode.system;
    }
  }

  void _loadLocale() {
    final languageCode = _prefs.getString('locale_code');
    if (languageCode != null) {
      _locale.value = Locale(languageCode);
    } else {
      // Default to English if not set
      _locale.value = const Locale('en');
    }
  }

  Future<void> saveThemeMode(ThemeMode mode) async {
    _themeMode.value = mode;
    String modeString;
    switch (mode) {
      case ThemeMode.dark:
        modeString = 'dark';
        break;
      case ThemeMode.light:
        modeString = 'light';
        break;
      case ThemeMode.system:
        modeString = 'system';
        break;
    }
    await _prefs.setString('theme_mode', modeString);
    Get.changeThemeMode(mode);
  }

  Future<void> saveLocale(Locale newLocale) async {
    _locale.value = newLocale;
    await _prefs.setString('locale_code', newLocale.languageCode);
    Get.updateLocale(newLocale);
  }
}
