import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../pages/home/home_tab_controller.dart';
import '../routes/app_routes.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  static String _initialFor(String? fullName, String? username) {
    final name = (fullName != null && fullName.trim().isNotEmpty)
        ? fullName.trim()
        : (username != null && username.trim().isNotEmpty)
            ? username.trim()
            : '';
    if (name.isEmpty) return 'U';
    return name.substring(0, 1).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();
    final user = authService.user;
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Drawer(
      backgroundColor: colorScheme.surface,
      child: SafeArea(
        child: Column(
          children: [
            // User Profile Card
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                elevation: 4,
                shadowColor: colorScheme.shadow.withValues(alpha: 0.2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
                      colors: [
                        Theme.of(context).primaryColor,
                        Theme.of(context).primaryColor.withValues(alpha: 0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: CircleAvatar(
                          radius: 30,
                          backgroundColor: Colors.white,
                          backgroundImage: user?.profileImage != null
                              ? NetworkImage(user!.profileImage!)
                              : null,
                          child: user?.profileImage == null
                              ? Text(
                                  _initialFor(user?.fullName, user?.username),
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).primaryColor,
                                  ),
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.fullName ?? user?.username ?? l10n.user,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.email ?? '',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.9),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    // Main Navigation Card
                    Card(
                      elevation: 0,
                      color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      child: Column(
                        children: [
                          _buildDrawerItem(
                            context,
                            icon: Icons.home_rounded,
                            label: l10n.home,
                            isSelected: _getSelectedIndex() == 0,
                            onTap: () => _onDestinationSelected(context, 0),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.payment_rounded,
                            label: l10n.payments,
                            isSelected: _getSelectedIndex() == 1,
                            onTap: () => _onDestinationSelected(context, 1),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.workspace_premium_rounded,
                            label: l10n.certifications,
                            isSelected: _getSelectedIndex() == 2,
                            onTap: () => _onDestinationSelected(context, 2),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.school_rounded,
                            label: l10n.courses,
                            isSelected: _getSelectedIndex() == 14,
                            onTap: () => _onDestinationSelected(context, 14),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.card_membership_rounded,
                            label: l10n.memberships,
                            isSelected: _getSelectedIndex() == 3,
                            onTap: () => _onDestinationSelected(context, 3),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.newspaper_rounded,
                            label: l10n.news,
                            isSelected: _getSelectedIndex() == 10,
                            onTap: () => _onDestinationSelected(context, 10),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.event_rounded,
                            label: l10n.events,
                            isSelected: _getSelectedIndex() == 11,
                            onTap: () => _onDestinationSelected(context, 11),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.campaign_rounded,
                            label: l10n.announcements,
                            isSelected: _getSelectedIndex() == 13,
                            onTap: () => _onDestinationSelected(context, 13),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.message_rounded,
                            label: l10n.complaints,
                            isSelected: _getSelectedIndex() == 7,
                            onTap: () => _onDestinationSelected(context, 7),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.book_rounded,
                            label: l10n.library,
                            isSelected: _getSelectedIndex() == 8,
                            onTap: () => _onDestinationSelected(context, 8),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.assignment_rounded,
                            label: l10n.medicalReports,
                            isSelected: _getSelectedIndex() == 9,
                            onTap: () => _onDestinationSelected(context, 9),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.map_rounded,
                            label: l10n.branches,
                            isSelected: _getSelectedIndex() == 12,
                            onTap: () => _onDestinationSelected(context, 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Settings & Info Card
                    Card(
                      elevation: 0,
                      color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      child: Column(
                        children: [
                          _buildDrawerItem(
                            context,
                            icon: Icons.person_rounded,
                            label: l10n.editProfile,
                            isSelected: _getSelectedIndex() == 4,
                            onTap: () => _onDestinationSelected(context, 4),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.settings_rounded,
                            label: 'Settings',
                            isSelected: _getSelectedIndex() == 5,
                            onTap: () => _onDestinationSelected(context, 5),
                          ),
                          _buildDrawerItem(
                            context,
                            icon: Icons.info_rounded,
                            label: l10n.about,
                            isSelected: false,
                            onTap: () => _onDestinationSelected(context, 6),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Logout Card
            Padding(
              padding: const EdgeInsets.all(16),
              child: Card(
                elevation: 0,
                color: colorScheme.errorContainer.withValues(alpha: 0.2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: InkWell(
                  onTap: () {
                    Navigator.pop(context);
                    _handleLogout(context);
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Row(
                      children: [
                        Icon(
                          Icons.logout_rounded,
                          color: colorScheme.error,
                          size: 24,
                        ),
                        const SizedBox(width: 16),
                        Text(
                          l10n.logout,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.error,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: isSelected
              ? BoxDecoration(
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                )
              : null,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Icon(
                icon,
                color: isSelected ? Theme.of(context).primaryColor : colorScheme.onSurfaceVariant,
                size: 24,
              ),
              const SizedBox(width: 16),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Theme.of(context).primaryColor : colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  int _getSelectedIndex() {
    final currentRoute = Get.currentRoute;
    switch (currentRoute) {
      case '/home':
        return 0;
      case '/payments':
        return 1;
      case '/certifications':
        return 2;
      case '/memberships':
        return 3;
      case '/profile/edit':
        return 4;
      case '/settings':
        return 5;
      case '/complaints':
        return 7;
      case '/library':
        return 8;
      case '/medical-reports':
        return 9;
      case '/news':
        return 10;
      case '/events':
        return 11;
      case '/branches':
        return 12;
      case '/announcements':
        return 13;
      case '/courses':
        return 14;
      default:
        // About is 6
        return 0; // Default to home
    }
  }

  static const Map<int, String> _destinations = {
    1: Routes.payments,
    2: Routes.certifications,
    3: Routes.memberships,
    4: Routes.profileEdit,
    5: Routes.settings,
    7: Routes.complaints,
    8: Routes.library,
    9: Routes.medicalReports,
    10: Routes.news,
    11: Routes.events,
    12: Routes.branches,
    13: Routes.announcements,
    14: Routes.courses,
  };

  void _onDestinationSelected(BuildContext context, int index) {
    Navigator.pop(context); // Close drawer first
    if (index == 0) {
      _goHome();
    } else if (index == 6) {
      _showAboutDialog(context);
    } else {
      final route = _destinations[index]!;
      if (Get.currentRoute == route) return;
      // Open every page directly above Home so the stack never grows and
      // back always returns to Home.
      Get.offNamedUntil(route, (r) => r.settings.name == Routes.home);
    }
  }

  /// Returns to the Home tab, also when Home is already open on Profile.
  void _goHome() {
    if (Get.currentRoute != Routes.home) {
      Get.until((r) => r.settings.name == Routes.home || r.isFirst);
      if (Get.currentRoute != Routes.home) Get.offAllNamed(Routes.home);
    }
    if (Get.isRegistered<HomeTabController>()) {
      Get.find<HomeTabController>().showHome();
    }
  }

  void _showAboutDialog(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    showAboutDialog(
      context: context,
      applicationName: l10n.naqabti,
      applicationVersion: l10n.applicationVersion,
      applicationIcon: Icon(
        Icons.medical_services,
        size: 48,
        color: Theme.of(context).primaryColor,
      ),
      applicationLegalese: l10n.allRightsReserved,
      children: [
        const SizedBox(height: 16),
        Text(
          l10n.comprehensiveMembershipManagement,
        ),
        const SizedBox(height: 16),
        Text(
          l10n.developedByMuwaija,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Future<void> _handleLogout(BuildContext context) async {
    final authService = Get.find<AuthService>();
    final l10n = AppLocalizations.of(context)!;

    final confirm = await Get.dialog<bool>(
      AlertDialog(
        title: Text(l10n.logoutTitle),
        content: Text(l10n.areYouSureYouWantToLogout),
        actions: [
          TextButton(
            onPressed: () => Get.back(result: false),
            child: Text(l10n.cancel),
          ),
          FilledButton(
            onPressed: () => Get.back(result: true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(l10n.logout),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await authService.logout();
    }
  }
}
