# إجابات الخصوصية للمتجرين

مطابقة لما يجمعه التطبيق فعلاً، ولملف `ios/Runner/PrivacyInfo.xcprivacy`، ولصفحة https://my.naqabti.ly/privacy

## Apple: App Privacy (App Store Connect)

**هل يجمع التطبيق بيانات؟** نعم.
**هل تُستخدم للتتبع (Tracking)؟** لا، لكل الأنواع.
**هل ترتبط بهوية المستخدم (Linked to user)؟** نعم، لكل الأنواع.
**الغرض في كل الأنواع:** App Functionality فقط.

| الفئة في App Store Connect | النوع | ملاحظات |
|---|---|---|
| Contact Info | Name, Email Address, Phone Number, Physical Address | من التسجيل والملف الشخصي |
| Health & Fitness | Health | التقارير الطبية التي يرفعها الطبيب (بيانات مرضى) |
| User Content | Photos or Videos | صورة الملف الشخصي وصور المستندات |
| User Content | Other User Content | الشكاوى ونصوص التقارير والمستندات |
| Identifiers | User ID | معرّف الحساب |
| Identifiers | Device ID | رمز الإشعارات FCM |
| Sensitive Info | — | **لا** (لا عرق ولا دين ولا ميول) |
| Financial Info | — | **لا**. سجلات الدفع لا تتضمن بيانات بطاقات، وتُسجَّل خارج التطبيق |
| Location | — | **لا** من التطبيق |
| Usage Data / Diagnostics | — | **لا**. لا توجد أدوات تحليلات |

**Privacy Policy URL:** https://my.naqabti.ly/privacy

## Google Play: Data safety

**هل يجمع التطبيق أو يشارك بيانات؟** يجمع: نعم. يشارك: لا. Firebase مزوّد خدمة وليس "مشاركة" بحسب تعريف Google.
**هل البيانات مشفّرة أثناء النقل؟** نعم (HTTPS).
**هل يمكن للمستخدم طلب حذف بياناته؟** نعم، من داخل التطبيق ومن الرابط https://my.naqabti.ly/account-deletion

| الفئة | النوع | مطلوب أم اختياري | الغرض |
|---|---|---|---|
| Personal info | Name, Email, Phone, Address, Other info (تاريخ الميلاد، الجنسية) | مطلوب | Account management, App functionality |
| Health and fitness | Health info | اختياري (للأطباء الذين يرفعون تقارير) | App functionality |
| Photos and videos | Photos | اختياري | App functionality |
| Files and docs | Files and docs | اختياري | App functionality |
| App info and performance | — | لا يُجمع | — |
| Device or other IDs | Device or other IDs (FCM) | مطلوب | App functionality (الإشعارات) |

**Delete account URL** (حقل مستقل في Play Console): https://my.naqabti.ly/account-deletion
