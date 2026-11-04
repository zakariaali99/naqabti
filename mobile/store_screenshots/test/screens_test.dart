import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:naqabti/theme/app_theme.dart';
import 'package:store_screenshots/mock/mock_bootstrap.dart';
import 'package:store_screenshots/screens.dart';

/// A piece of fixture text each screen should show (English run).
const _expectedText = {
  'home': 'Ahmed',
  'membership': 'TRP-2024-01587',
  'profile': 'Cardiology',
  'notifications': 'Membership renewed',
  'courses': 'Advanced Cardiac Life Support',
  'complaints': 'Membership card not delivered',
  'news': 'Annual Medical Conference 2026',
};

/// Renders every screenshot screen with the mock data in each locale and checks nothing throws.
void main() {
  setUpAll(setUpMockApp);

  for (final locale in const [Locale('en'), Locale('ar')]) {
    for (final screen in appScreens) {
      testWidgets('${screen.id} (${locale.languageCode})', (tester) async {
        tester.view.physicalSize = const Size(1290, 2796);
        tester.view.devicePixelRatio = 3;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(
          MaterialApp(
            locale: locale,
            supportedLocales: const [Locale('en'), Locale('ar')],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            theme: AppTheme.lightTheme,
            home: Builder(builder: localized(screen.page)),
          ),
        );
        await tester.pump(const Duration(seconds: 1));
        await tester.pump(const Duration(seconds: 1));

        expect(tester.takeException(), isNull);
        if (locale.languageCode == 'en') {
          expect(find.textContaining(_expectedText[screen.id]!), findsWidgets);
        } else if (screen.id == 'notifications') {
          expect(find.textContaining('تم تجديد العضوية'), findsWidgets);
        }
      });
    }
  }
}
