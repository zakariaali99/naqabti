import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:naqabti/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  String randomUser(String prefix) => '$prefix${Random().nextInt(99999)}';

  // ---------------------------------------------------------------------------
  // Robust Helpers
  // ---------------------------------------------------------------------------

  Future<void> launchRegister(WidgetTester tester) async {
    debugPrint('🚀 [Test] Launching app...');
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 15));
    
    debugPrint('🔎 [Test] Looking for Sign Up button...');
    final signUpFinder = find.byWidgetPredicate((widget) {
      if (widget is TextButton && widget.child is Text) {
        final label = (widget.child as Text).data ?? '';
        final l = label.toLowerCase();
        return l.contains('sign up') || l.contains('إنشاء') || l.contains('سجيل');
      }
      return false;
    });

    if (signUpFinder.evaluate().isEmpty) {
      await tester.tap(find.textContaining('Sign Up').last);
    } else {
      await tester.ensureVisible(signUpFinder.last);
      await tester.tap(signUpFinder.last);
    }
    
    await tester.pumpAndSettle(const Duration(seconds: 5));
    debugPrint('✅ [Test] Arrived at RegisterPage');
  }

  Future<void> tapPrimary(WidgetTester tester) async {
    debugPrint('👉 [Test] Tapping Continue/Primary button...');
    await tester.pumpAndSettle(const Duration(seconds: 2));
    
    final finder = find.byType(FilledButton);
    for (int i = 0; i < 5; i++) {
      if (finder.evaluate().isNotEmpty) break;
      await tester.pump(const Duration(seconds: 1));
    }
    
    expect(finder, findsWidgets, reason: 'No FilledButton found!');
    final btn = finder.last;
    await tester.ensureVisible(btn);
    await tester.tap(btn);
    await tester.pumpAndSettle(const Duration(seconds: 5));
  }

  Future<void> selectAccountTypeByIcon(WidgetTester tester, IconData icon) async {
    debugPrint('🔘 [Test] Selecting account type by icon: $icon');
    final iconFinder = find.byIcon(icon).first;
    await tester.ensureVisible(iconFinder);
    await tester.tap(iconFinder);
    await tester.pumpAndSettle(const Duration(seconds: 1));
  }

  Future<void> waitAndEnterText(WidgetTester tester, Finder finder, String text) async {
    for (int i = 0; i < 8; i++) {
      if (finder.evaluate().isNotEmpty) break;
      await tester.pump(const Duration(seconds: 1));
    }
    expect(finder, findsWidgets, reason: 'Field not found for text: $text');
    await tester.ensureVisible(finder.first);
    await tester.enterText(finder.first, text);
    await tester.pumpAndSettle();
  }

  Future<void> selectDropdown(WidgetTester tester, int index, String optionText) async {
    debugPrint('🏙️ [Test] Selecting dropdown #$index -> option: $optionText');
    
    await tester.pumpAndSettle(const Duration(seconds: 2));
    final dropdownFind = find.byWidgetPredicate((widget) => widget is DropdownButtonFormField);
    
    for (int i = 0; i < 20; i++) {
        if (dropdownFind.evaluate().length > index) break;
        await tester.pump(const Duration(milliseconds: 500));
    }
    
    debugPrint('Found ${dropdownFind.evaluate().length} dropdowns on screen');
    expect(dropdownFind.evaluate().length, greaterThan(index), reason: 'Expected dropdown at index $index not found!');
    
    final dropdown = dropdownFind.at(index);
    await tester.ensureVisible(dropdown);
    await tester.tap(dropdown);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    final option = find.textContaining(optionText).last;
    await tester.ensureVisible(option);
    await tester.tap(option);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }

  // ===========================================================================
  //  TEST SUITE
  // ===========================================================================
  
  group('Registration Flow', () {
    
    testWidgets('Student Registration Flow', (WidgetTester tester) async {
      await launchRegister(tester);
      await selectAccountTypeByIcon(tester, Icons.school);
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 1: Personal Info');
      // Fill Arabic Names
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'First Name'), 'أحمد');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Father Name'), 'محمد');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Grandfather Name'), 'علي');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Family Name'), 'الليبي');
      
      // Username & Phone
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.alternate_email), matching: find.byType(TextFormField)), randomUser('std'));
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.phone), matching: find.byType(TextFormField)), '0910001122');
      
      // Birthdate
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Day'), '15');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Month'), '05');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Year'), '1995');
      
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 2: Location');
      await selectDropdown(tester, 0, 'Tripoli');
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.home), matching: find.byType(TextFormField)), 'Tripoli Center');
      await selectDropdown(tester, 1, 'Libyan');
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 3: Education');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'University Name'), 'University of Tripoli');
      // Degree is not a dropdown, it's a list of InkWells
      await tester.tap(find.textContaining('Bachelor').last);
      await tester.pumpAndSettle();
      await tapPrimary(tester);

      debugPrint('📍 [Test] Step 4: Review');
      expect(find.byType(Checkbox), findsWidgets);
    });

    testWidgets('Doctor Registration Flow', (WidgetTester tester) async {
      await launchRegister(tester);
      await selectAccountTypeByIcon(tester, Icons.medical_services);
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 1: Personal (Doctor)');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'First Name'), 'دكتور');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Father Name'), 'باسم');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Grandfather Name'), 'هشام');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Family Name'), 'السيد');

      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.alternate_email), matching: find.byType(TextFormField)), randomUser('doc'));
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.phone), matching: find.byType(TextFormField)), '0912223344');
      
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Day'), '01');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Month'), '01');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Year'), '1980');
      
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 2: Location (Doctor)');
      await selectDropdown(tester, 0, 'Tripoli');
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.home), matching: find.byType(TextFormField)), 'Clinic Road');
      await selectDropdown(tester, 1, 'Libyan');
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 3: Education (Doctor)');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'University Name'), 'University of Tripoli');
      final degreeFinder = find.textContaining('PhD').last;
      await tester.ensureVisible(degreeFinder);
      await tester.tap(degreeFinder, warnIfMissed: false);
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tapPrimary(tester);
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      debugPrint('📍 [Test] Step 4: Professional');
      final switchFinder = find.textContaining('active membership');
      await tester.ensureVisible(switchFinder);
      await tester.tap(switchFinder);
      await tester.pumpAndSettle();
      
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.badge), matching: find.byType(TextFormField)), 'DOC-1234');
      // Branch is a dropdown here!
      await selectDropdown(tester, 0, 'Tripoli Branch'); 
      await tapPrimary(tester);
      await tester.pumpAndSettle(const Duration(seconds: 2));
      
      debugPrint('📍 [Test] Step 5: Review');
      expect(find.byType(Checkbox), findsWidgets);
    });

    testWidgets('Institution Registration Flow', (WidgetTester tester) async {
      await launchRegister(tester);
      await selectAccountTypeByIcon(tester, Icons.business);
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 1: Instit Info');
      await waitAndEnterText(tester, find.widgetWithText(TextFormField, 'Institution Name'), 'Test Hospital');
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.alternate_email), matching: find.byType(TextFormField)), randomUser('hosp'));
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.phone), matching: find.byType(TextFormField)), '0920003344');
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 2: Location (Inst)');
      await selectDropdown(tester, 0, 'Benghazi');
      await waitAndEnterText(tester, find.ancestor(of: find.byIcon(Icons.home), matching: find.byType(TextFormField)), 'Benghazi St');
      
      // Step 2 has a phone field for institutions
      final phoneInLoc = find.ancestor(of: find.byIcon(Icons.phone), matching: find.byType(TextFormField));
      await tester.enterText(phoneInLoc, '0927778899');
      
      await tapPrimary(tester);
      
      debugPrint('📍 [Test] Step 3: Review');
      expect(find.byType(Checkbox), findsOneWidget);
    });
  });
}
