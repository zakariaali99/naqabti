import 'package:flutter/widgets.dart';

/// Marketing caption (title, subtitle) per screen id and language.
const _captions = <String, Map<String, (String, String)>>{
  'en': {
    'home': ('Your union, in your pocket', 'Everything you need as a member, in one place'),
    'membership': ('Manage your membership', 'Track status, renewals and payments'),
    'profile': ('Your professional profile', 'Keep your details and credentials up to date'),
    'notifications': ('Never miss an update', 'Instant alerts for what matters to you'),
    'courses': ('Grow your skills', 'Register for accredited courses and workshops'),
    'complaints': ('We are listening', 'Submit and follow up on requests easily'),
    'news': ('Stay informed', 'The latest news and announcements from the union'),
    'feature': ('Naqabti', 'Your medical union membership app'),
  },
  'ar': {
    'home': ('نقابتك في جيبك', 'كل ما تحتاجه كعضو في مكان واحد'),
    'membership': ('إدارة عضويتك', 'تابع الحالة والتجديد والمدفوعات'),
    'profile': ('ملفك المهني', 'حافظ على بياناتك وشهاداتك محدثة'),
    'notifications': ('لا تفوّت أي جديد', 'تنبيهات فورية لكل ما يهمك'),
    'courses': ('طوّر مهاراتك', 'سجّل في الدورات وورش العمل المعتمدة'),
    'complaints': ('صوتك مسموع', 'قدّم طلباتك وتابعها بسهولة'),
    'news': ('ابقَ على اطلاع', 'آخر الأخبار والإعلانات من النقابة'),
    'feature': ('نقابتي', 'تطبيق عضوية النقابة الطبية'),
  },
};

(String, String) _caption(BuildContext context, String id) {
  final lang = Localizations.localeOf(context).languageCode;
  return (_captions[lang] ?? _captions['en']!)[id]!;
}

String captionTitle(BuildContext context, String id) => _caption(context, id).$1;
String captionSubtitle(BuildContext context, String id) => _caption(context, id).$2;
