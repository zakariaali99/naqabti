// Public legal pages linked from the mobile app and the store listings.
// Keep them in sync with what the app and backend actually collect.

export const LEGAL_LAST_UPDATED = "2026-11-03";

// TODO(before publishing): confirm the legal entity name and contact email.
export const LEGAL_CONTACT = {
  organizationAr: "النقابة العامة للأطباء",
  organizationEn: "General Syndicate of Physicians",
  email: "privacy@naqabti.ly",
  website: "https://my.naqabti.ly",
};

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  sections: LegalSection[];
}

type Lang = "ar" | "en";

export const privacyPolicy: Record<Lang, LegalDocument> = {
  ar: {
    title: "سياسة الخصوصية",
    intro: `توضح هذه السياسة كيف يجمع ${LEGAL_CONTACT.organizationAr} ("النقابة") البيانات ويستخدمها ويحميها عند استخدامك تطبيق "نقابتي" وبوابة الأعضاء على ${LEGAL_CONTACT.website}.`,
    sections: [
      {
        heading: "1. البيانات التي نجمعها",
        bullets: [
          "بيانات الحساب: الاسم بالعربية والإنجليزية، البريد الإلكتروني، رقم الهاتف، وكلمة المرور (تُحفظ مشفّرة ولا يمكن لأحد قراءتها).",
          "بيانات الملف الشخصي: تاريخ الميلاد، الجنس، الجنسية، المدينة والمنطقة والعنوان، صورة الملف الشخصي، وصورة جواز السفر أو وثيقة الهوية التي ترفعها.",
          "البيانات المهنية: الدرجة العلمية، الجامعة، سنة التخرج، التخصص، النبذة، رقم العضوية، الفرع، والشهادات ومستنداتها.",
          "سجلات العضوية: طلبات العضوية والتجديد، وسجلات الدفعات (المبلغ والحالة وطريقة الدفع)، والدورات والفعاليات التي تسجّل فيها.",
          "التقارير الطبية: إذا رفع الطبيب تقريراً طبياً فإنه يتضمن بيانات صحية عن مريض (اسم المريض ورقم هويته والتشخيص والعلاج والمرفقات). تُعامل هذه البيانات كبيانات حساسة.",
          "الشكاوى: نص الشكوى ومرفقاتها والردود عليها.",
          "بيانات الجهاز: رمز الإشعارات (FCM) ونوع الجهاز، لإرسال الإشعارات فقط.",
          "سجلات تقنية: عنوان IP وأوقات الطلبات على الخادم، لأغراض الأمان وحل المشكلات.",
        ],
      },
      {
        heading: "2. ما لا نجمعه",
        bullets: [
          "لا نتتبعك عبر التطبيقات أو المواقع الأخرى، ولا نستخدم أدوات إعلانية أو تحليلات تسويقية.",
          "لا نجمع موقعك الجغرافي من الجهاز. موقع المنطقة يُحفظ فقط إذا اخترته بنفسك على الخريطة في البوابة.",
          "لا يتم أي دفع داخل التطبيق ولا نجمع بيانات بطاقات الدفع؛ الدفعات تُسدَّد للنقابة خارج التطبيق وتُسجَّل فقط.",
        ],
      },
      {
        heading: "3. كيف نستخدم البيانات",
        bullets: [
          "إدارة العضوية: التسجيل، التحقق من البيانات والمستندات، الموافقة على الحساب، التجديد، وإصدار الشهادات.",
          "التواصل معك: إرسال رموز التحقق وإعادة تعيين كلمة المرور وإشعارات الحساب والعضوية والأخبار.",
          "الملف المهني العام: تُعرض فقط الحقول التي تختار إظهارها في إعدادات ملفك العام.",
          "معالجة الشكاوى والتقارير الطبية المرفوعة إلى النقابة.",
          "حماية الخدمة ومنع إساءة الاستخدام والوفاء بالالتزامات القانونية.",
        ],
      },
      {
        heading: "4. مع من نشارك البيانات",
        bullets: [
          "موظفو النقابة ومديرو الفروع المخوَّلون، كلٌّ في حدود صلاحياته.",
          "Google Firebase Cloud Messaging: لإيصال الإشعارات إلى جهازك (يُرسل إليه رمز الجهاز ومحتوى الإشعار فقط).",
          "مزوّد الاستضافة الذي يشغّل خوادم النقابة.",
          "الجهات الرسمية عندما يفرض القانون ذلك.",
          "لا نبيع بياناتك ولا نشاركها لأغراض إعلانية.",
        ],
      },
      {
        heading: "5. مدة الاحتفاظ وحذف الحساب",
        paragraphs: [
          "نحتفظ ببياناتك طالما حسابك قائم. يمكنك حذف حسابك في أي وقت من التطبيق (الملف الشخصي ← حذف الحساب) أو من بوابة الأعضاء.",
          "عند طلب الحذف يُعطَّل حسابك فوراً وتُلغى كل جلسات الدخول ورموز الإشعارات. خلال 30 يوماً تحذف النقابة بياناتك الشخصية نهائياً (الاسم، البريد، الهاتف، العنوان، تاريخ الميلاد، الصورة، صورة الجواز، النبذة، والحقول الإضافية)، وتُحذف النسخ السابقة من سجل التعديلات. للتراجع عن الطلب خلال هذه المدة تواصل مع النقابة.",
          "تحتفظ النقابة بسجلات العضوية والدفعات والشهادات والشكاوى والتقارير المرفوعة إليها بقدر ما يلزمها القانون والأنظمة المهنية، لكنها لا تعود مرتبطة باسمك أو بيانات تواصلك.",
        ],
      },
      {
        heading: "6. حماية البيانات",
        paragraphs: [
          "نستخدم اتصالاً مشفّراً (HTTPS)، وتُحفظ كلمات المرور مشفّرة، ويقتصر الوصول إلى البيانات على المخوَّلين. لا توجد وسيلة حماية كاملة، لكننا نراجع إجراءاتنا باستمرار.",
        ],
      },
      {
        heading: "7. حقوقك",
        bullets: [
          "الاطلاع على بياناتك وتصحيحها من صفحة الملف الشخصي.",
          "التحكم في الحقول الظاهرة في ملفك المهني العام.",
          "حذف حسابك من التطبيق أو البوابة، أو بطلب عبر البريد أدناه.",
          "إيقاف الإشعارات من إعدادات جهازك.",
        ],
      },
      {
        heading: "8. القاصرون",
        paragraphs: [
          "الخدمة موجّهة للأطباء والطلبة والمؤسسات الصحية، وليست موجّهة لمن هم دون 18 عاماً.",
        ],
      },
      {
        heading: "9. التعديلات على هذه السياسة",
        paragraphs: [
          "قد نحدّث هذه السياسة، وسنعرض تاريخ آخر تحديث أعلى الصفحة، ونبلغك داخل التطبيق عند أي تغيير جوهري.",
        ],
      },
      {
        heading: "10. التواصل",
        paragraphs: [`لأي سؤال أو طلب يتعلق ببياناتك: ${LEGAL_CONTACT.email}`],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    intro: `This policy explains how the ${LEGAL_CONTACT.organizationEn} ("the Syndicate") collects, uses and protects data when you use the Naqabti app and the member portal at ${LEGAL_CONTACT.website}.`,
    sections: [
      {
        heading: "1. Data we collect",
        bullets: [
          "Account data: your name in Arabic and English, email address, phone number and password (stored hashed; nobody can read it).",
          "Profile data: date of birth, gender, nationality, city, area and address, profile photo, and the passport or ID image you upload.",
          "Professional data: academic degree, university, graduation year, specialty, bio, membership number, branch, and certifications with their documents.",
          "Membership records: membership and renewal requests, payment records (amount, status and method), and the courses and events you register for.",
          "Medical reports: when a doctor submits a medical report it contains health information about a patient (patient name and ID, diagnosis, treatment and attachments). We treat this as sensitive data.",
          "Complaints: the complaint text, its attachments and the replies.",
          "Device data: the push notification token (FCM) and device type, used only to send notifications.",
          "Technical logs: IP address and request times on our server, for security and troubleshooting.",
        ],
      },
      {
        heading: "2. What we do not collect",
        bullets: [
          "We do not track you across other apps or websites and do not use advertising or marketing analytics tools.",
          "We do not collect your location from your device. An area location is stored only if you pick it yourself on the map in the portal.",
          "There are no payments inside the app and we do not collect card details; fees are paid to the Syndicate outside the app and only recorded.",
        ],
      },
      {
        heading: "3. How we use data",
        bullets: [
          "Membership management: registration, checking your details and documents, approving your account, renewals and certificates.",
          "Contacting you: verification and password reset codes, account and membership notifications, and news.",
          "Public professional profile: only the fields you choose to show in your public profile settings are displayed.",
          "Handling complaints and medical reports submitted to the Syndicate.",
          "Protecting the service, preventing abuse and meeting legal obligations.",
        ],
      },
      {
        heading: "4. Who we share data with",
        bullets: [
          "Authorised Syndicate staff and branch managers, each within their permissions.",
          "Google Firebase Cloud Messaging, to deliver notifications to your device (it receives only the device token and the notification content).",
          "The hosting provider that runs the Syndicate's servers.",
          "Public authorities where the law requires it.",
          "We do not sell your data or share it for advertising.",
        ],
      },
      {
        heading: "5. Retention and account deletion",
        paragraphs: [
          "We keep your data while your account exists. You can delete your account at any time in the app (Profile → Delete Account) or in the member portal.",
          "When you request deletion, your account is disabled immediately and every sign-in session and notification token is revoked. Within 30 days the syndicate permanently removes your personal data (name, email, phone, address, date of birth, photo, passport image, bio and extra fields) and earlier copies in the edit history. To withdraw the request during that time, contact the syndicate.",
          "The Syndicate keeps membership, payment, certification, complaint and submitted report records only as far as the law and professional regulations require, and they are no longer linked to your name or contact details.",
        ],
      },
      {
        heading: "6. Security",
        paragraphs: [
          "We use encrypted connections (HTTPS), passwords are stored hashed, and access to data is limited to authorised people. No method is perfectly secure, but we review our safeguards regularly.",
        ],
      },
      {
        heading: "7. Your rights",
        bullets: [
          "View and correct your data from your profile page.",
          "Control which fields appear on your public professional profile.",
          "Delete your account in the app or the portal, or by request to the email below.",
          "Turn off notifications in your device settings.",
        ],
      },
      {
        heading: "8. Minors",
        paragraphs: [
          "The service is meant for physicians, students and health institutions and is not directed at anyone under 18.",
        ],
      },
      {
        heading: "9. Changes to this policy",
        paragraphs: [
          "We may update this policy. The date of the last update is shown at the top, and we will tell you in the app about any significant change.",
        ],
      },
      {
        heading: "10. Contact",
        paragraphs: [
          `For any question or request about your data: ${LEGAL_CONTACT.email}`,
        ],
      },
    ],
  },
};

export const accountDeletion: Record<Lang, LegalDocument> = {
  ar: {
    title: "حذف الحساب",
    intro:
      "يمكنك حذف حسابك في نقابتي بنفسك في أي وقت، من التطبيق أو من بوابة الأعضاء.",
    sections: [
      {
        heading: "من تطبيق نقابتي",
        bullets: [
          "سجّل الدخول وافتح الملف الشخصي.",
          'اضغط "حذف الحساب" في أسفل الصفحة.',
          "أكّد الطلب. يُعطَّل حسابك ويتم تسجيل خروجك فوراً.",
        ],
      },
      {
        heading: "من بوابة الأعضاء على الويب",
        bullets: [
          `سجّل الدخول على ${LEGAL_CONTACT.website}.`,
          'افتح ملفك الشخصي وانتقل إلى "منطقة الخطر".',
          'اضغط "حذف الحساب" ثم أكّد.',
        ],
      },
      {
        heading: "إن لم تستطع تسجيل الدخول",
        paragraphs: [
          `أرسل طلب الحذف من البريد المسجّل في حسابك إلى ${LEGAL_CONTACT.email}، وسننفّذه خلال 30 يوماً بعد التحقق من هويتك.`,
        ],
      },
      {
        heading: "مهلة الثلاثين يوماً",
        paragraphs: [
          "بعد تأكيد الطلب يبقى حسابك معطّلاً، ويحذف موظفو النقابة بياناتك الشخصية نهائياً خلال 30 يوماً. إن غيّرت رأيك خلال هذه المدة، تواصل مع النقابة لإلغاء الطلب وإعادة تفعيل الحساب.",
        ],
      },
      {
        heading: "ما الذي يُحذف وما الذي يُحتفظ به",
        bullets: [
          "يُحذف نهائياً خلال 30 يوماً: الاسم، البريد، الهاتف، العنوان، تاريخ الميلاد، الصورة، صورة الجواز، النبذة، الحقول الإضافية، جلسات الدخول، ورموز الإشعارات (تُلغى الجلسات ورموز الإشعارات فوراً عند الطلب).",
          "يُحتفظ به دون بياناتك الشخصية: سجلات العضوية والدفعات والشهادات والشكاوى والتقارير المرفوعة إلى النقابة، بقدر ما يلزمه القانون والأنظمة المهنية.",
        ],
      },
    ],
  },
  en: {
    title: "Delete your account",
    intro:
      "You can delete your Naqabti account yourself at any time, from the app or from the member portal.",
    sections: [
      {
        heading: "In the Naqabti app",
        bullets: [
          "Sign in and open your Profile.",
          'Tap "Delete Account" at the bottom of the page.',
          "Confirm. Your account is disabled and you are signed out immediately.",
        ],
      },
      {
        heading: "In the web member portal",
        bullets: [
          `Sign in at ${LEGAL_CONTACT.website}.`,
          'Open your profile and go to "Danger Zone".',
          'Click "Delete Account" and confirm.',
        ],
      },
      {
        heading: "If you cannot sign in",
        paragraphs: [
          `Email your deletion request from the address on your account to ${LEGAL_CONTACT.email}. We will complete it within 30 days after verifying your identity.`,
        ],
      },
      {
        heading: "The 30-day period",
        paragraphs: [
          "After you confirm, your account stays disabled and syndicate staff permanently delete your personal data within 30 days. If you change your mind during that time, contact the syndicate to cancel the request and re-activate your account.",
        ],
      },
      {
        heading: "What is deleted and what is kept",
        bullets: [
          "Deleted permanently within 30 days: name, email, phone, address, date of birth, photo, passport image, bio, extra fields, sign-in sessions and notification tokens (sessions and notification tokens are revoked right away).",
          "Kept without your personal details: membership, payment, certification, complaint and submitted report records, only as far as the law and professional regulations require.",
        ],
      },
    ],
  },
};
