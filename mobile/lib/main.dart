import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'pages/auth/login_page.dart';
import 'pages/auth/register_page.dart';
import 'pages/auth/forgot_password_page.dart';
import 'pages/splash/splash_page.dart';
import 'pages/home/home_page.dart';
import 'pages/payments/payments_page.dart';
import 'pages/certifications/certifications_page.dart';
import 'pages/memberships/memberships_page.dart';
import 'pages/profile/edit_profile_page.dart';
import 'pages/complaints/complaints_page.dart';
import 'pages/library/library_page.dart';
import 'pages/medical_reports/medical_reports_page.dart';
import 'pages/news/news_page.dart';
import 'pages/events/events_page.dart';
import 'pages/branches/branches_page.dart';
import 'pages/announcements/announcements_page.dart';
import 'pages/courses/courses_page.dart';
import 'pages/renew_membership/renew_membership_page.dart';
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
      getPages: [
        GetPage(
          name: '/splash',
          page: () => const SplashPage(),
          transition: Transition.fadeIn,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/login',
          page: () => const LoginPage(),
          transition: Transition.fadeIn,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/register',
          page: () => const RegisterPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/forgot-password',
          page: () => const ForgotPasswordPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/home',
          page: () => const HomePage(),
          transition: Transition.fadeIn,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/payments',
          page: () => const PaymentsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/certifications',
          page: () => const CertificationsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/memberships',
          page: () => const MembershipsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/profile/edit',
          page: () => const EditProfilePage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/complaints',
          page: () => const ComplaintsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/library',
          page: () => const LibraryPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/medical-reports',
          page: () => const MedicalReportsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/news',
          page: () => const NewsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/events',
          page: () => const EventsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/branches',
          page: () => const BranchesPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/announcements',
          page: () => const AnnouncementsPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/courses',
          page: () => const CoursesPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
        GetPage(
          name: '/renew-membership',
          page: () => const RenewMembershipPage(),
          transition: Transition.rightToLeft,
          transitionDuration: const Duration(milliseconds: 300),
        ),
      ],

      // Default transition for all routes
      defaultTransition: Transition.native,
    );
  }
}
