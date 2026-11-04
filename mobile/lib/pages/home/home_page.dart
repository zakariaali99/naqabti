import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../models/user.dart';
import '../../models/doctors_membership.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../services/settings_service.dart';
import 'package:flutter_floating_bottom_bar/flutter_floating_bottom_bar.dart';
import '../../widgets/general_app_bar.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/main_bottom_nav_bar.dart';
import '../../widgets/notification_popup.dart';
import '../profile/profile_page.dart';
import 'widgets/profile_completion_card.dart';
import 'widgets/profile_summary_card.dart';
import 'widgets/quick_actions_grid.dart';
import 'widgets/welcome_section.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with SingleTickerProviderStateMixin {
  final AuthService _authService = Get.find<AuthService>();
  final ApiService _apiService = Get.find<ApiService>();
  final NotificationService _notificationService =
      Get.find<NotificationService>();
  late TabController _tabController;

  User? _currentUser;
  DoctorsMembership? _membership;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.index = 0; // Start at Home
    _tabController.addListener(() {
      setState(() {});
    });
    _loadData();
    _requestNotificationPermission();
    // Fetch notifications count on home load
    _notificationService.fetchUnreadCount();
  }

  Future<void> _requestNotificationPermission() async {
    await _notificationService.requestPermission();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    _currentUser = _authService.user;

    if (_currentUser != null) {
      final membershipsResponse = await _apiService.membership.getMemberships({
        'doctor': _currentUser!.id,
      });
      if (membershipsResponse.results.isNotEmpty) {
        _membership = membershipsResponse.results.first;
      }
    }

    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final barDecoration = BoxDecoration(
      color: isDark ? null : const Color(0xFF4183D9),
      gradient: isDark
          ? const LinearGradient(
              colors: [Color(0xFF1565C0), Color(0xFF0D47A1)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            )
          : null,
      borderRadius: BorderRadius.circular(32),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.15),
          blurRadius: 18,
          offset: const Offset(0, 6),
        ),
      ],
    );

    return PopScope(
      canPop: _tabController.index == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _tabController.animateTo(0);
      },
      child: Scaffold(
        appBar: GeneralAppBar(
          title: _getAppBarTitle(l10n),
          showDrawerButton: true,
          actions: _buildAppBarActions(context),
        ),
        drawer: const AppDrawer(),
        body: BottomBar(
          showIcon: true,
          icon:
              (width, height) => Center(
                child: IconButton(
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    final primary = PrimaryScrollController.of(context);
                    primary.animateTo(
                      0,
                      duration: const Duration(milliseconds: 400),
                      curve: Curves.easeOut,
                    );
                  },
                  icon: Icon(
                    Icons.arrow_upward_rounded,
                    color: Colors.white,
                    size: width,
                  ),
                ),
              ),
          layout: BottomBarLayout(
            width: MediaQuery.of(context).size.width * 0.9,
            borderRadius: BorderRadius.circular(32),
            offset: 12,
            alignment: Alignment.bottomCenter,
            fit: StackFit.expand,
          ),
          motion: const BottomBarMotion(
            duration: Duration(milliseconds: 500),
            curve: Curves.decelerate,
            slideStart: Offset(0, 2),
            slideEnd: Offset.zero,
          ),
          scrollBehavior: const BottomBarScrollBehavior(
            hideOnScroll: true,
            reverse: false,
          ),
          theme: BottomBarThemeData(
            barDecoration: barDecoration,
            iconHeight: 40,
            iconWidth: 40,
          ),
          body: Padding(
            padding: const EdgeInsets.only(bottom: 80), // Prevent content overlap
            child: TabBarView(
              controller: _tabController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildHomeContent(),
                const ProfilePage(),
              ],
            ),
          ),
          child: MainBottomNavBar(tabController: _tabController),
        ),
      ),
    );
  }

  String _getAppBarTitle(AppLocalizations l10n) {
    switch (_tabController.index) {
      case 0:
        return l10n.home;
      case 1:
        return l10n.profile;
      default:
        return l10n.home;
    }
  }

  List<Widget> _buildAppBarActions(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = Get.locale?.languageCode ?? 'en';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return [
      Obx(() {
        final count = Get.find<NotificationService>().unreadCount;
        return IconButton(
          icon: Badge(
            isLabelVisible: count > 0,
            label: Text(count > 99 ? '99+' : '$count'),
            child: const Icon(Icons.notifications_outlined),
          ),
          tooltip: l10n.notifications,
          onPressed: () => _showNotificationPopup(context),
        );
      }),
      IconButton(
        icon: SizedBox(
          width: 24,
          height: 24,
          child: Center(
            child: Text(
              currentLocale == 'ar' ? '🇸🇦' : '🇺🇸',
              style: const TextStyle(fontSize: 20, height: 1.0),
            ),
          ),
        ),
        tooltip: currentLocale == 'ar' ? l10n.english : l10n.arabic,
        onPressed: () {
          final newLocale = currentLocale == 'ar'
              ? const Locale('en')
              : const Locale('ar');
          SettingsService.to.saveLocale(newLocale);
        },
      ),
      IconButton(
        icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
        tooltip: isDark ? l10n.lightMode : l10n.darkMode,
        onPressed: () {
          final newMode = isDark ? ThemeMode.light : ThemeMode.dark;
          SettingsService.to.saveThemeMode(newMode);
        },
      ),
    ];
  }

  Future<void> _showNotificationPopup(BuildContext context) async {
    await NotificationPopup.show(context);
  }

  Widget _buildHomeContent() {
    final l10n = AppLocalizations.of(context)!;
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.retry),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            WelcomeSection(user: _currentUser),
            const SizedBox(height: 32),
            if (_currentUser != null) ...[
              ProfileCompletionCard(user: _currentUser!),
              const SizedBox(height: 32),
            ],
            ProfileSummaryCard(user: _currentUser, membership: _membership),
            const SizedBox(height: 32),
            const QuickActionsGrid(),
            const SizedBox(height: 100), // Spacing for bottom bar
          ],
        ),
      ),
    );
  }
}

