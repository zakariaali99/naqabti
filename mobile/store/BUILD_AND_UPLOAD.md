# بناء الإصدار ورفعه

الإصدار الحالي في `pubspec.yaml` هو `1.0.4+1`. ارفع الرقم بعد `+` مع كل رفع جديد لنفس الإصدار.

## 1. تجهيز المشروع (مرة في كل جهاز أو نسخة جديدة)
ملفات `*.g.dart` غير موجودة كلها في git، وبعضها ناقص (الجنسية، والدرجة العلمية)، لذلك يجب توليدها قبل أي بناء:

```bash
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter gen-l10n
flutter analyze
```

## 2. عنوان السيرفر
- **بناء الإنتاج:** يستخدم `https://my.naqabti.ly/api/` تلقائياً، ولا يحتاج أي إعداد.
- **أثناء التطوير على سيرفر محلي:**

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.0.197:8000/api/
```

## 3. Android (Google Play)
1. **أنشئ مفتاح الرفع** مرة واحدة فقط، واحفظ نسخة منه ومن كلمة مروره في مكان آمن. ضياعه يعني أنك لن تستطيع تحديث التطبيق:

```bash
keytool -genkey -v -keystore ~/naqabti-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. **أنشئ الملف `mobile/android/key.properties`،** وهو مستثنى من git:

```
storePassword=<...>
keyPassword=<...>
keyAlias=upload
storeFile=/Users/<you>/naqabti-upload.jks
```

3. **ابنِ الحزمة:** البناء يتوقف برسالة واضحة إن لم يجد المفتاح.

```bash
flutter build appbundle --release
```

الملف الناتج: `build/app/outputs/bundle/release/app-release.aab`

## 4. iOS (App Store)
1. **في Apple Developer:** افتح App ID `ly.naqabti.naqabti` وفعّل **Push Notifications**.
2. **في Firebase Console:** Project settings ← Cloud Messaging ← Apple app ← ارفع **APNs Auth Key (.p8)**.
3. **ابنِ الحزمة:**

```bash
flutter build ipa --release
```

4. **ارفعها** عبر Transporter، أو Xcode ← Organizer.
5. **جرّب الإشعارات على TestFlight قبل الإرسال للمراجعة.** ملف الـ entitlements مضبوط على `production`، فلا تصل إشعارات من TestFlight إلا بعد رفع مفتاح APNs.

## 5. قبل الضغط على "إرسال للمراجعة"
- [ ] الـ backend والويب منشوران على السيرفر. صفحتا `/privacy` و`/account-deletion` تفتحان، و`api/auth/change-password/` يعمل.
- [ ] `python manage.py migrate` نُفّذ على السيرفر، ويشمل migration الدمج `0075`.
- [ ] الحساب التجريبي جاهز ومعتمد.
- [ ] فيديو المراجعة مرفوع، و`APP_REVIEW_NOTES.md` مكتمل.
- [ ] App Privacy وData safety معبّأتان حسب `PRIVACY_LABELS.md`.
- [ ] لقطات شاشة iPhone من داخل التطبيق، لا شاشة الدخول فقط.
