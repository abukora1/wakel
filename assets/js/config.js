// =========================================================
// إعدادات المشروع - الرجاء استبدال القيم بمفاتيحك الخاصة
// =========================================================

export const SUPABASE_CONFIG = {
  // رابط مشروعك من Supabase
  url: "https://ogsjlbbzzjpjqcrqbibe.supabase.co",
  
  // المفتاح العام (anon public) - تم التحديث
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nc2psYmJ6empwanFjcnFiaWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3OTM2MTcsImV4cCI6MjA5ODM2OTYxN30.7Xc7lp7ekmLuDcjFeBM7SvkphF5Ef8iOAqJZ5xqBamg"
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
    underMonitoring: 0.02,   // 2% من مساحة القطعة = تحت المراقبة
    critical: 0.05          // 5% من مساحة القطعة = حرج
  }
};
