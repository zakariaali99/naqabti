import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import '../pages/announcements/announcements_page.dart';
import '../pages/auth/forgot_password_page.dart';
import '../pages/auth/login_page.dart';
import '../pages/auth/register_page.dart';
import '../pages/branches/branches_page.dart';
import '../pages/certifications/certifications_page.dart';
import '../pages/complaints/complaints_page.dart';
import '../pages/courses/courses_page.dart';
import '../pages/events/events_page.dart';
import '../pages/home/home_page.dart';
import '../pages/library/library_page.dart';
import '../pages/medical_reports/medical_reports_page.dart';
import '../pages/memberships/memberships_page.dart';
import '../pages/news/news_page.dart';
import '../pages/notifications/notification_detail_page.dart';
import '../pages/payments/payments_page.dart';
import '../pages/profile/edit_profile_page.dart';
import '../pages/renew_membership/renew_membership_page.dart';
import '../pages/settings/settings_page.dart';
import '../pages/splash/splash_page.dart';
import 'app_routes.dart';

/// The single list of named routes; every [Routes] constant must be here.
class AppPages {
  static GetPage _fade(String name, Widget Function() page) => GetPage(
        name: name,
        page: page,
        transition: Transition.fadeIn,
        transitionDuration: const Duration(milliseconds: 300),
      );

  static GetPage _slide(String name, Widget Function() page) => GetPage(
        name: name,
        page: page,
        transition: Transition.rightToLeft,
        transitionDuration: const Duration(milliseconds: 300),
      );

  static final routes = [
    _fade(Routes.splash, () => const SplashPage()),
    _fade(Routes.login, () => const LoginPage()),
    _slide(Routes.register, () => const RegisterPage()),
    _slide(Routes.forgotPassword, () => const ForgotPasswordPage()),
    _fade(Routes.home, () => const HomePage()),
    _slide(Routes.payments, () => const PaymentsPage()),
    _slide(Routes.certifications, () => const CertificationsPage()),
    _slide(Routes.memberships, () => const MembershipsPage()),
    _slide(Routes.notificationDetail, () => const NotificationDetailPage()),
    _slide(Routes.profileEdit, () => const EditProfilePage()),
    _slide(Routes.settings, () => const SettingsPage()),
    _slide(Routes.complaints, () => const ComplaintsPage()),
    _slide(Routes.library, () => const LibraryPage()),
    _slide(Routes.medicalReports, () => const MedicalReportsPage()),
    _slide(Routes.news, () => const NewsPage()),
    _slide(Routes.events, () => const EventsPage()),
    _slide(Routes.branches, () => const BranchesPage()),
    _slide(Routes.announcements, () => const AnnouncementsPage()),
    _slide(Routes.courses, () => const CoursesPage()),
    _slide(Routes.renewMembership, () => const RenewMembershipPage()),
  ];
}
