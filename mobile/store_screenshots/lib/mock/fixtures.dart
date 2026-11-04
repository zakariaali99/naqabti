/// Preview data served by [MockApiInterceptor]. Keys match the app's
/// `lib/models/*.g.dart` `fromJson` (snake_case).
class MockData {
  MockData._();

  /// Language of the fixture text; set by the screen wrapper before each page builds.
  static String locale = 'en';

  static bool get _ar => locale == 'ar';
  static String _t(String en, String ar) => _ar ? ar : en;

  static String _date(int daysFromNow) =>
      DateTime.now().add(Duration(days: daysFromNow)).toIso8601String().substring(0, 10);
  static String _dateTime(Duration ago) =>
      DateTime.now().subtract(ago).toUtc().toIso8601String();

  static Map<String, dynamic> paginated(List<Map<String, dynamic>> results) => {
        'count': results.length,
        'next': null,
        'previous': null,
        'last_page': 1,
        'results': results,
      };

  static Map<String, dynamic> get city => {
        'id': 1,
        'name': 'Tripoli',
        'name_ar': 'طرابلس',
        'region': 'West',
        'prefix': 'TRP',
      };

  static Map<String, dynamic> get user => {
        'id': 1,
        'username': 'ahmed.ali',
        'email': 'ahmed.ali@example.com',
        'full_name': _t('Dr. Ahmed Ali Al-Mansouri', 'د. أحمد علي المنصوري'),
        'first_name_field': 'أحمد',
        'father_name': 'علي',
        'grandfather_name': 'محمد',
        'family_name': 'المنصوري',
        'first_name_en': 'Ahmed',
        'father_name_en': 'Ali',
        'grandfather_name_en': 'Mohamed',
        'family_name_en': 'Al-Mansouri',
        'phone_number': '+218 91 234 5678',
        'profile_image': null,
        'language': locale,
        'city': 1,
        'user_type': 'doctor',
        'specialty': _t('Cardiology', 'أمراض القلب'),
        'bio': _t(
          'Consultant cardiologist with 12 years of clinical experience.',
          'استشاري أمراض القلب بخبرة سريرية تمتد 12 عامًا.',
        ),
        'birthdate': '1985-04-12',
        'address': _t('Tripoli, Libya', 'طرابلس، ليبيا'),
        'nationality': _t('Libyan', 'ليبي'),
        'university_name': _t('University of Tripoli', 'جامعة طرابلس'),
        'current_degree': _t('Consultant', 'استشاري'),
        'membership_number': 'TRP-2024-01587',
        'is_active': true,
        'created_at': _dateTime(const Duration(days: 400)),
        'updated_at': _dateTime(const Duration(days: 3)),
      };

  static Map<String, dynamic> get membershipType => {
        'id': 1,
        'name': _t('Annual Membership', 'العضوية السنوية'),
        'description': _t('Full membership for practicing doctors', 'عضوية كاملة للأطباء الممارسين'),
        'duration_months': 12,
        'price': '300.00',
        'is_active': true,
      };

  static Map<String, dynamic> get membership => {
        'id': 1,
        'doctor': user,
        'doctor_id': 1,
        'membership_type': membershipType,
        'city': city,
        'city_id': 1,
        'membership_number': 'TRP-2024-01587',
        'start_date': _date(-120),
        'end_date': _date(245),
        'status': 'active',
        'is_active': true,
        'total_amount': '300.00',
        'paid_amount': '300.00',
        'payment_status': 'paid',
        'remaining_amount': '0.00',
        'payments': [],
        'created_at': _dateTime(const Duration(days: 120)),
        'updated_at': _dateTime(const Duration(days: 120)),
      };

  static List<Map<String, dynamic>> get memberships => [
        membership,
        {
          ...membership,
          'id': 2,
          'membership_number': 'TRP-2023-01587',
          'start_date': _date(-485),
          'end_date': _date(-120),
          'status': 'expired',
          'is_active': false,
        },
      ];

  static List<Map<String, dynamic>> get payments => [
        _payment(1, '300.00', 'bank_transfer', 120, 'TRX-88213',
            _t('Annual membership fee', 'رسوم العضوية السنوية')),
        _payment(2, '150.00', 'card', 45, 'TRX-90544',
            _t('Cardiology workshop registration', 'التسجيل في ورشة أمراض القلب')),
        _payment(3, '300.00', 'cash', 485, 'TRX-61027',
            _t('Annual membership fee', 'رسوم العضوية السنوية')),
        _payment(4, '50.00', 'online', 510, 'TRX-60311',
            _t('Membership card issuance', 'إصدار بطاقة العضوية')),
      ];

  static Map<String, dynamic> _payment(
          int id, String amount, String method, int daysAgo, String ref, String description) =>
      {
        'id': id,
        'user': user,
        'membership': 1,
        'membership_details': membership..remove('doctor'),
        'amount': amount,
        'payment_method': method,
        'payment_date': _date(-daysAgo),
        'reference_number': ref,
        'description': description,
      };

  static List<Map<String, dynamic>> get notifications => [
        _notification(1, _t('Membership renewed', 'تم تجديد العضوية'),
            _t('Your annual membership is active until next year. Thank you!',
                'عضويتك السنوية فعّالة حتى العام القادم. شكرًا لك!'),
            const Duration(minutes: 25), false, 'doctors_membership'),
        _notification(2, _t('New course available', 'دورة جديدة متاحة'),
            _t('Registration is open for "Advanced Cardiac Life Support".',
                'التسجيل مفتوح الآن لدورة "الإنعاش القلبي المتقدم".'),
            const Duration(hours: 3), false, 'course'),
        _notification(3, _t('Complaint updated', 'تحديث على الشكوى'),
            _t('The administration has responded to your complaint.',
                'قامت الإدارة بالرد على شكواك.'),
            const Duration(hours: 9), false, 'complaint'),
        _notification(4, _t('Payment received', 'تم استلام الدفعة'),
            _t('We received your payment of 150 LYD.', 'تم استلام دفعتك بقيمة 150 د.ل.'),
            const Duration(days: 2), true, 'payment'),
        _notification(5, _t('Annual general assembly', 'الجمعية العمومية السنوية'),
            _t('Join us for the annual general assembly next month.',
                'ندعوكم لحضور الجمعية العمومية السنوية الشهر القادم.'),
            const Duration(days: 4), true, 'news'),
        _notification(6, _t('Profile verified', 'تم توثيق الملف الشخصي'),
            _t('Your professional profile has been verified.', 'تم توثيق ملفك المهني بنجاح.'),
            const Duration(days: 9), true, null),
      ];

  static Map<String, dynamic> _notification(
          int id, String title, String message, Duration ago, bool read, String? type) =>
      {
        'id': id,
        'user': user,
        'title': title,
        'message': message,
        'created_at': _dateTime(ago),
        'is_read': read,
        'notification_type': type,
        'content_type': type,
        'object_id': id,
      };

  static List<Map<String, dynamic>> get courses => [
        _course(1, _t('Advanced Cardiac Life Support', 'الإنعاش القلبي المتقدم'),
            _t('Dr. Salem Ben Omran', 'د. سالم بن عمران'), 12, 14, '250', 'confirmed'),
        _course(2, _t('Modern Diabetes Management', 'الإدارة الحديثة لمرض السكري'),
            _t('Dr. Huda Al-Fitouri', 'د. هدى الفيتوري'), 20, 21, '0', 'pending'),
        _course(3, _t('Clinical Ultrasound Essentials', 'أساسيات الموجات فوق الصوتية'),
            _t('Dr. Khaled Abushaala', 'د. خالد أبوشعالة'), 34, 36, '400', null),
        _course(4, _t('Medical Research Methodology', 'منهجية البحث الطبي'),
            _t('Dr. Mariam Al-Zawi', 'د. مريم الزاوي'), 45, 47, '0', null),
      ];

  static Map<String, dynamic> _course(int id, String title, String instructor, int startIn,
          int endIn, String price, String? registration) =>
      {
        'id': id,
        'title': title,
        'content': _t(
          'A hands-on program accredited for continuing medical education credits.',
          'برنامج تطبيقي معتمد ضمن ساعات التعليم الطبي المستمر.',
        ),
        'instructor': instructor,
        'date_from': _date(startIn),
        'date_to': _date(endIn),
        'price': price,
        'image': null,
        'status': 'active',
        'registration_status': registration,
      };

  static List<Map<String, dynamic>> get complaints => [
        _complaint(1, _t('Membership card not delivered', 'لم يتم استلام بطاقة العضوية'),
            'resolved', _t('Resolved', 'تم الحل'), 'medium', _t('Medium', 'متوسطة'),
            _t('Your card is ready for pickup at the Tripoli branch.',
                'بطاقتك جاهزة للاستلام من فرع طرابلس.'),
            6),
        _complaint(2, _t('Payment not reflected', 'الدفعة لم تظهر في الحساب'), 'in_progress',
            _t('In progress', 'قيد المعالجة'), 'high', _t('High', 'عالية'), null, 2),
        _complaint(3, _t('Update specialty information', 'تحديث بيانات التخصص'), 'open',
            _t('Open', 'مفتوحة'), 'low', _t('Low', 'منخفضة'), null, 1),
      ];

  static Map<String, dynamic> _complaint(int id, String subject, String status,
          String statusDisplay, String priority, String priorityDisplay, String? response,
          int daysAgo) =>
      {
        'id': id,
        'subject': subject,
        'description': _t(
          'Please review my request and update my record accordingly.',
          'يرجى مراجعة طلبي وتحديث بياناتي وفقًا لذلك.',
        ),
        'status': status,
        'status_display': statusDisplay,
        'priority': priority,
        'priority_display': priorityDisplay,
        'category': 'membership',
        'admin_response': response,
        'attachment': null,
        'user': 1,
        'user_detail': user,
        'created_at': _dateTime(Duration(days: daysAgo)),
        'updated_at': _dateTime(Duration(days: daysAgo)),
      };

  static List<Map<String, dynamic>> posts(String? type) => [
        _post(1, type ?? 'news', _t('Annual Medical Conference 2026', 'المؤتمر الطبي السنوي 2026'),
            _t('Over 600 doctors gathered in Tripoli for three days of talks and workshops.',
                'أكثر من 600 طبيب اجتمعوا في طرابلس لثلاثة أيام من المحاضرات وورش العمل.'),
            2, 1240, true),
        _post(2, type ?? 'news', _t('New CME requirements announced', 'الإعلان عن متطلبات التعليم الطبي المستمر الجديدة'),
            _t('Members must complete 30 CME hours per year starting next cycle.',
                'يتعين على الأعضاء إكمال 30 ساعة تعليم طبي مستمر سنويًا ابتداءً من الدورة القادمة.'),
            6, 860, false),
        _post(3, type ?? 'news', _t('Benghazi branch opens new office', 'فرع بنغازي يفتتح مقرًا جديدًا'),
            _t('Members in the east can now complete procedures at the new office.',
                'يمكن لأعضاء المنطقة الشرقية الآن إتمام معاملاتهم في المقر الجديد.'),
            11, 530, false),
        _post(4, type ?? 'news', _t('Health insurance agreement signed', 'توقيع اتفاقية التأمين الصحي'),
            _t('A new agreement offers discounted health insurance for members and families.',
                'اتفاقية جديدة توفر تأمينًا صحيًا بأسعار مخفضة للأعضاء وعائلاتهم.'),
            18, 2105, false),
      ];

  static Map<String, dynamic> _post(int id, String type, String title, String excerpt,
          int daysAgo, int views, bool featured) =>
      {
        'id': id,
        'title': title,
        'content': excerpt,
        'excerpt': excerpt,
        'post_type': type,
        'status': 'published',
        'featured_image': null,
        'author': null,
        'published_at': _dateTime(Duration(days: daysAgo)),
        'views_count': views,
        'is_featured': featured,
        'tags': [],
        'created_at': _dateTime(Duration(days: daysAgo)),
        'updated_at': _dateTime(Duration(days: daysAgo)),
      };

  static List<Map<String, dynamic>> get certifications => [
        _certification(1, _t('Board Certification', 'شهادة البورد'),
            _t('Libyan Board of Medical Specialties', 'المجلس الليبي للتخصصات الطبية'), 900, 925),
        _certification(2, _t('BLS Instructor', 'مدرب الإنعاش الأساسي'),
            _t('American Heart Association', 'جمعية القلب الأمريكية'), 200, 530),
        _certification(3, _t('Good Clinical Practice', 'الممارسة السريرية الجيدة'),
            _t('Ministry of Health', 'وزارة الصحة'), 60, 670),
      ];

  static Map<String, dynamic> _certification(
          int id, String type, String issuer, int issuedDaysAgo, int expiresInDays) =>
      {
        'id': id,
        'doctor': user,
        'certification_type': {'id': id, 'name': type, 'description': null},
        'issue_date': _date(-issuedDaysAgo),
        'expiry_date': _date(expiresInDays),
        'issued_from': issuer,
        'document': null,
      };
}
