// =========================================================
// إعدادات المشروع - الرجاء استبدال القيم بمفاتيحك الخاصة
// =========================================================

export const SUPABASE_CONFIG = {
  // ضع رابط مشروعك من Supabase Project Settings → API → Project URL
  url: "https://YOUR-PROJECT-REF.supabase.co",

  // مفتاح "publishable" آمن للاستخدام في الواجهة الأمامية (المتصفح)
  anonKey: "sb_publishable_GazNQnJ0SqHuDDrKMNDWmg_uClUJaPB"
};

// ⚠️ تنبيه أمان مهم:
// لا تضع أبداً مفتاح "sb_secret_..." في هذا الملف أو أي ملف داخل الموقع.
// هذا المفتاح يمنح صلاحيات كاملة بدون قيود حماية (RLS)،
// ومجرد نشر الموقع يجعل أي زائر قادراً على رؤيته والتحكم الكامل بقاعدة بياناتك.
// إذا احتجت عمليات إدارية حساسة مستقبلاً، استخدمه فقط داخل بيئة خادم خاصة بك
// (مثل Supabase Edge Functions أو سكربت يعمل على جهازك) وليس هنا أبداً.

// WATI WhatsApp API (اختياري) - اتركه فارغاً لاستخدام wa.me فقط
export const WATI_CONFIG = {
  apiEndpoint: "", // مثال: https://live-mt-server.wati.io/XXXX/api/v1
  accessToken: ""
};

// EmailJS (اختياري)
export const EMAILJS_CONFIG = {
  serviceId: "",
  templateId: "",
  publicKey: ""
};

export const APP_CONFIG = {
  appName: "نظام الإيجارات الزراعية",
  feddanToQirat: 24,
  feddanToSahm: 576,
  infringementThresholds: {
    underMonitoring: 0.02,
    critical: 0.05
  }
};
