// Home Page Object for E2E Tests
//
// This file contains the HomePage object with methods to interact
// with the home page elements.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Page Object for Home Page
class HomePage {
  // ==================== Finders ====================
  
  /// App bar title
  static Finder get appBarTitle => find.byType(AppBar);
  
  /// Drawer button (hamburger menu)
  static Finder get drawerButton => find.byIcon(Icons.menu);
  
  /// Welcome section
  static Finder get welcomeSection => find.textContaining('Welcome');
  
  /// Profile summary card
  static Finder get profileSummaryCard => find.byType(Card);

  /// Profile completion card
  static Finder get profileCompletionCard => find.byKey(const Key('profile_completion_card'));

  /// Profile completion percentage text (e.g. "75%")
  static Finder get profileCompletionPercentageText =>
      find.byKey(const Key('profile_completion_percentage'));
  
  /// Quick actions grid
  static Finder get quickActionsGrid => find.byType(GridView);
  
  /// Bottom navigation bar
  static Finder get bottomNavBar => find.byType(BottomNavigationBar);
  
  /// Tab bar
  static Finder get tabBar => find.byType(TabBar);
  
  /// Tab bar view
  static Finder get tabBarView => find.byType(TabBarView);
  
  /// Refresh indicator
  static Finder get refreshIndicator => find.byType(RefreshIndicator);
  
  /// Loading indicator
  static Finder get loadingIndicator => find.byType(CircularProgressIndicator);
  
  // ==================== Tab Navigation ====================
  
  /// Tab indices for bottom navigation
  static const int notificationsTab = 0;
  static const int homeTab = 1;
  static const int profileTab = 2;
  
  // ==================== Quick Actions ====================
  
  /// Quick action: Memberships
  static Finder get membershipsAction => find.text('Memberships');
  
  /// Quick action: Certifications
  static Finder get certificationsAction => find.text('Certifications');
  
  /// Quick action: Payments
  static Finder get paymentsAction => find.text('Payments');
  
  /// Quick action: Courses
  static Finder get coursesAction => find.text('Courses');
  
  /// Quick action: Renew Membership
  static Finder get renewMembershipAction => find.text('Renew Membership');
  
  // ==================== Actions ====================
  
  /// Open drawer
  static Future<void> openDrawer(WidgetTester tester) async {
    await tester.tap(drawerButton);
    await tester.pumpAndSettle();
  }
  
  /// Navigate to tab by index
  static Future<void> navigateToTab(WidgetTester tester, int tabIndex) async {
    // Find the bottom navigation bar
    final bottomNavFinder = find.byType(BottomNavigationBar);
    expect(bottomNavFinder, findsOneWidget);
    
    // Find all BottomNavigationBarItem widgets
    final items = find.byType(BottomNavigationBarItem);
    expect(items, findsNWidgets(3)); // Notif, Home, Profile
    
    // Tap on the appropriate tab
    await tester.tap(items.at(tabIndex));
    await tester.pumpAndSettle();
  }
  
  /// Pull to refresh
  static Future<void> pullToRefresh(WidgetTester tester) async {
    await tester.fling(find.byType(RefreshIndicator), const Offset(0, 300), 1000);
    await tester.pumpAndSettle();
  }
  
  /// Tap on quick action
  static Future<void> tapQuickAction(WidgetTester tester, String actionName) async {
    final actionFinder = find.text(actionName);
    await tester.tap(actionFinder);
    await tester.pumpAndSettle();
  }
  
  // ==================== Verifications ====================
  
  /// Verify home page is displayed
  static void verifyHomePageDisplayed(WidgetTester tester) {
    // Home page has either BottomNavigationBar or TabBar
    expect(
      find.byType(BottomNavigationBar).evaluate().isNotEmpty || 
      find.byType(TabBar).evaluate().isNotEmpty,
      isTrue,
    );
  }
  
  /// Verify welcome section is displayed
  static void verifyWelcomeSectionDisplayed(WidgetTester tester) {
    expect(welcomeSection, findsWidgets);
  }
  
  /// Verify profile summary is displayed
  static void verifyProfileSummaryDisplayed(WidgetTester tester) {
    expect(profileSummaryCard, findsWidgets);
  }

  /// Verify profile completion card is displayed
  static void verifyProfileCompletionDisplayed(WidgetTester tester) {
    expect(profileCompletionCard, findsOneWidget);
  }

  /// Read the currently displayed profile completion percentage text (e.g. "75%")
  static String getProfileCompletionPercentage(WidgetTester tester) {
    final text = tester.widget<Text>(profileCompletionPercentageText);
    return text.data ?? '';
  }

  /// Verify the displayed profile completion percentage matches [expected] (e.g. "75%")
  static void verifyProfileCompletionPercentage(WidgetTester tester, String expected) {
    expect(getProfileCompletionPercentage(tester), expected);
  }
  
  /// Verify quick actions are displayed
  static void verifyQuickActionsDisplayed(WidgetTester tester) {
    expect(quickActionsGrid, findsOneWidget);
  }
  
  /// Verify bottom navigation is displayed
  static void verifyBottomNavigationDisplayed(WidgetTester tester) {
    expect(bottomNavBar, findsOneWidget);
  }
  
  /// Verify loading state
  static void verifyLoadingState(WidgetTester tester) {
    expect(loadingIndicator, findsOneWidget);
  }
  
  /// Verify content is loaded (not loading)
  static void verifyContentLoaded(WidgetTester tester) {
    // Should show welcome section or profile summary
    expect(
      welcomeSection.evaluate().isNotEmpty || 
      profileSummaryCard.evaluate().isNotEmpty,
      isTrue,
    );
  }
}
