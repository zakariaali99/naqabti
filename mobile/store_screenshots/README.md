# Store screenshots

Generates App Store and Google Play screenshots of Naqabti using
[flutter_store_screenshots](https://pub.dev/packages/flutter_store_screenshots).
It renders the app's real pages with mock preview data, so no backend or account is needed.

## Run

```sh
cd store_screenshots
flutter run -d macos
```

Pick a set and a locale in the toolbar to preview, then click **↓** to export.
Images are written to `screenshots/<set>/<locale>/NN_<screen>.png`.

Sets: iPhone 6.9", iPhone 6.5", Android phone, iPad 12.9", Android 10" tablet and the Play feature graphic.
Locales: English and Arabic.

## How it works

- `lib/mock/mock_bootstrap.dart` registers the app's real GetX services with a fake signed-in session.
  `NotificationService` is replaced by `FakeNotificationService` because it needs Firebase.
- `lib/mock/mock_api_interceptor.dart` is added to every `DioClient` (via `DioClient.extraInterceptors`)
  and answers API requests from `lib/mock/fixtures.dart`.
  Unmatched GET paths log `MockApiInterceptor: no fixture for GET <path>` and return an empty list.
- `lib/screens.dart` lists the pages to capture. `lib/captions.dart` holds the marketing titles per language.
- `assets` is a symlink to `../assets`, because the app loads its images by unprefixed paths.

## Edit

- Preview data: `lib/mock/fixtures.dart`. The fixtures have English and Arabic variants.
- Screens and their order: `appScreens` in `lib/screens.dart`.
- Captions: `lib/captions.dart`. Background, device frames and sets: `lib/main.dart`.

`flutter test` renders every screen in both locales against the fixtures.
