export default {
  // Page titles
  title: "المقالات والأخبار",
  createTitle: "إنشاء مقال جديد",
  editTitle: "تعديل المقال",
  createSubtitle: "املأ التفاصيل لإنشاء مقال جديد",
  editSubtitle: "تحديث تفاصيل المقال",

  // Stats
  totalPosts: "الإجمالي: {{count}} مقال",

  // Buttons
  createPost: "إنشاء مقال",
  updatePost: "تحديث المقال",
  cancel: "إلغاء",
  add: "إضافة",

  // Table columns
  table: {
    title: "العنوان",
    type: "النوع",
    status: "الحالة",
    author: "الكاتب",
    published: "تاريخ النشر",
    views: "المشاهدات",
    actions: "الإجراءات",
  },

  // Filters
  filters: {
    search: "البحث في المقالات...",
    allTypes: "جميع الأنواع",
    allStatus: "جميع الحالات",
  },

  // Post types
  types: {
    news: "أخبار",
    announcement: "إعلان",
    article: "مقال",
  },

  // Post status
  status: {
    draft: "مسودة",
    published: "منشور",
    archived: "مؤرشف",
  },

  // Actions
  actions: {
    edit: "تعديل",
    publish: "نشر",
    archive: "أرشفة",
    feature: "تمييز",
    unfeature: "إلغاء التمييز",
    delete: "حذف",
  },

  // Form sections
  form: {
    basicInfo: "المعلومات الأساسية",
    postSettings: "إعدادات المقال",
    featuredImage: "الصورة الرئيسية",
    tags: "الوسوم",

    // Fields
    titleLabel: "العنوان",
    titlePlaceholder: "أدخل عنوان المقال",
    excerptLabel: "الملخص",
    excerptPlaceholder: "ملخص قصير للمقال",
    contentLabel: "المحتوى",
    contentPlaceholder: "اكتب محتوى المقال هنا...",
    postTypeLabel: "نوع المقال",
    postTypePlaceholder: "اختر نوع المقال",
    statusLabel: "الحالة",
    statusPlaceholder: "اختر الحالة",
    featuredPost: "مقال مميز",
    addTag: "أضف وسم",

    // Image upload
    uploadImage: "رفع صورة رئيسية",
    chooseImage: "اختر صورة",

    // Validation
    titleRequired: "العنوان مطلوب",
    contentRequired: "المحتوى مطلوب",
  },

  // Badges
  featured: "مميز",

  // Empty state
  noPostsFound: "لا توجد مقالات",

  // Delete modal
  deletePost: "حذف المقال",
  deleteConfirm: "هل أنت متأكد من حذف هذا المقال؟",

  // Misc
  views: "{{count}} مشاهدة",
  loading: "جاري التحميل...",
} as const;
