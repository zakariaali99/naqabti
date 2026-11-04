import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:naqabti/models/user.dart';
import 'package:naqabti/pages/complaints/complaints_page.dart';
import 'package:naqabti/pages/courses/courses_page.dart';
import 'package:naqabti/pages/home/home_page.dart';
import 'package:naqabti/pages/memberships/memberships_page.dart';
import 'package:naqabti/pages/news/news_page.dart';
import 'package:naqabti/pages/notifications/notifications_page.dart';
import 'package:naqabti/pages/profile/profile_page.dart';
import 'package:naqabti/services/auth_service.dart';

import 'mock/fixtures.dart';

/// A screen to capture: its id (used for file names and captions) and the app page.
class AppScreen {
  const AppScreen(this.id, this.page);

  final String id;
  final WidgetBuilder page;
}

final appScreens = <AppScreen>[
  AppScreen('home', (_) => const HomePage()),
  AppScreen('membership', (_) => const MembershipsPage()),
  // ProfilePage is a tab inside HomePage, so give it its own app bar.
  AppScreen(
    'profile',
    (context) => Scaffold(
      appBar: AppBar(title: Text(AppLocalizations.of(context)!.profile)),
      body: const ProfilePage(),
    ),
  ),
  AppScreen('notifications', (_) => const NotificationsPage()),
  AppScreen('courses', (_) => const CoursesPage()),
  AppScreen('complaints', (_) => const ComplaintsPage()),
  AppScreen('news', (_) => const NewsPage()),
];

/// Builds [page] with the mock data and GetX locale switched to the screenshot's locale.
WidgetBuilder localized(WidgetBuilder page) {
  return (context) {
    final locale = Localizations.localeOf(context);
    if (MockData.locale != locale.languageCode) {
      MockData.locale = locale.languageCode;
      Get.find<AuthService>().currentUser.value = User.fromJson(MockData.user);
    }
    Get.locale = locale;
    return page(context);
  };
}
