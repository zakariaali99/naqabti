export default {
  title: "الحملات الإعلانية",
  createTitle: "حملة إعلانية جديدة",
  editTitle: "تعديل الحملة الإعلانية",
  totalCount: "إجمالي الحملات: {{count}}",

  create: "إنشاء حملة إعلانية",
  update: "حفظ الحملة",
  submit: "إطلاق الحملة",
  noCampaignsFound: "لم يتم العثور على حملات",
  deleteTitle: "حذف الحملة",

  steps: {
    info: "المعلومات",
    targeting: "الاستهداف",
    preview: "التقدير",
  },

  status: {
    all: "جميع الحالات",
    draft: "مسودة",
    published: "منشور",
    archived: "مؤرشف",
  },

  filters: {
    search: "البحث في الحملات...",
    status: "تصفية حسب الحالة",
  },

  table: {
    title: "عنوان الحملة",
    advertiser: "المعلن",
    status: "الحالة",
    targeting: "الاستهداف",
    audience: "حجم الجمهور",
    views: "المشاهدات",
    publishedAt: "تاريخ النشر",
    actions: "الإجراءات",
  },

  actions: {
    publish: "نشر",
    unpublish: "تعيين كمسودة",
    archive: "أرشفة",
    analytics: "عرض التحليلات",
    delete: "حذف",
  },

  form: {
    subtitle: "تكوين معايير الاستهداف والتصميم المتميز لحملتك",
    general: "معلومات الحملة العامة",
    title: "عنوان الحملة",
    titlePlaceholder: "مثال: عرض ورشة عمل أمراض القلب",
    content: "محتوى الإعلان",
    contentPlaceholder: "اكتب الوصف الكامل / نص الرسالة...",
    status: "حالة الحملة",
    featuredImage: "صورة البانر الرئيسية",
    uploadClick: "انقر أو اسحب لرفع صورة البانر",
    targetingTitle: "تحديد الجمهور المستهدف",
    targetingDesc: "قم بتصفية أعضاء النقابة الذين يجب أن يشاهدوا حملتك. ترك معيار فارغ يعني استهداف جميع الأعضاء.",
    branches: "الفروع المستهدفة",
    allBranches: "جميع الفروع",
    cities: "المدن المستهدفة",
    allCities: "جميع المدن",
    specialties: "التخصصات المستهدفة",
    allSpecialties: "جميع التخصصات",
    realtimeAudience: "الوصول المتوقع حالياً",
    calculatedBasedTarget: "يتم التحديث ديناميكياً مع تغيير التحديدات",
    members: "طبيب",
    reviewTitle: "مراجعة الحملة وتفاصيل الجمهور المتوقع",
  },

  review: {
    titleLabel: "عنوان الحملة",
    contentLabel: "نص الرسالة",
    banner: "بانر الحملة",
    estimatedAudience: "الوصول المتوقع للجمهور",
    audienceDisclaimer: "إجمالي الأطباء المسجلين المطابقين لمعايير التصفية",
    breakdownTitle: "توزيع الجمهور",
    byBranch: "أهم الفروع المستهدفة",
    byCity: "أهم المدن المستهدفة",
  },

  banner: {
    noAds: "لا توجد حملات نشطة",
    viewDetails: "عرض التفاصيل",
    title: "الإعلانات",
  },
} as const;
