import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'routes/app_pages.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/notification_service.dart';
import 'services/device_service.dart';
import 'services/course_service.dart';
import 'services/settings_service.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Initialize services
  await Get.putAsync(() => AuthService().init());
  await Get.putAsync(() => ApiService().init());
  await Get.putAsync(() => DeviceService().init());
  await Get.putAsync(() => NotificationService().init());
  await Get.putAsync(() => CourseService().init());
  await Get.putAsync(() => SettingsService().init());

  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();
    
    return GetMaterialApp(
      title: 'Naqabti',
      debugShowCheckedModeBanner: false,

      builder: (context, child) {
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: AppTheme.getOverlayStyle(context),
          child: child ?? const SizedBox(),
        );
      },

      // Localization
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'),
        Locale('ar'),
      ],
      locale: settingsService.locale,
      fallbackLocale: const Locale('en'),

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: settingsService.themeMode,

      // Initial route - always start with splash to check auth
      initialRoute: '/splash',

      // Route configuration using GetX named routes
      getPages: AppPages.routes,

      // Default transition for all routes
      defaultTransition: Transition.native,
    );
  }
}
