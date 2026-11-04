import 'package:device_frame/device_frame.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_store_screenshots/flutter_store_screenshots.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:naqabti/theme/app_theme.dart';

import 'captions.dart';
import 'mock/mock_bootstrap.dart';
import 'screens.dart';

const _gradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF1F5FB0), Color(0xFF4183D9)],
);

const _captureDelay = Duration(milliseconds: 1200);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setUpMockApp();

  runApp(
    FlutterStoreScreenshotsApp(
      locales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: AppTheme.lightTheme,
      screenshotSets: [
        AppleScreenshotSet.iPhone69(
          captureDelay: _captureDelay,
          storeScreenshots: _framed(Devices.ios.iPhone16ProMax),
        ),
        ScreenshotSet(
          name: 'iPhone 6.5"',
          targetPlatform: TargetPlatform.iOS,
          size: const Size(428, 926),
          pixelDensity: 3.0,
          captureDelay: _captureDelay,
          storeScreenshots: _framed(Devices.ios.iPhone11ProMax),
        ),
        AndroidScreenshotSet.phone(
          captureDelay: _captureDelay,
          storeScreenshots: _framed(Devices.android.samsungGalaxyS25),
        ),
        AppleScreenshotSet.iPadPro129(
          captureDelay: _captureDelay,
          storeScreenshots: _framed(Devices.ios.iPad12InchesGen4),
        ),
        AndroidScreenshotSet.tablet10(
          captureDelay: _captureDelay,
          storeScreenshots: _framed(Devices.android.largeTablet),
        ),
        AndroidScreenshotSet.featureGraphic(
          captureDelay: _captureDelay,
          storeScreenshots: [
            StoreScreenshot(
              name: 'feature_graphic',
              builder: featureGraphicCanvas(
                device: Devices.android.samsungGalaxyS25,
                gradient: _gradient,
                child: localized(appScreens.first.page),
                title: (ctx) => captionTitle(ctx, 'feature'),
                subtitle: (ctx) => captionSubtitle(ctx, 'feature'),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

List<StoreScreenshot> _framed(DeviceInfo device) => [
      for (final (i, screen) in appScreens.indexed)
        StoreScreenshot(
          name: '${(i + 1).toString().padLeft(2, '0')}_${screen.id}',
          builder: framedCanvas(
            device: device,
            gradient: _gradient,
            child: localized(screen.page),
            title: (ctx) => captionTitle(ctx, screen.id),
            subtitle: (ctx) => captionSubtitle(ctx, screen.id),
          ),
        ),
    ];
