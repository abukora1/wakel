# دليل الإعداد والنشر خطوة بخطوة

راجع رسالة الدردشة الرئيسية للحصول على الشرح الكامل بالعربية، وهذا الملف نسخة مرجعية سريعة.

## 1. Supabase
1. أنشئ مشروعاً جديداً على supabase.com
2. من SQL Editor نفّذ `supabase/schema.sql` ثم `supabase/rls-policies.sql`
3. من Storage أنشئ bucket باسم `backups` (عام أو خاص حسب الحاجة)
4. من Authentication فعّل مزود الدخول (Email أو Anonymous حسب الحاجة)
5. من Project Settings → API انسخ `Project URL` و `anon public key`

## 2. تحديث المشروع
عدّل `assets/js/config.js` وضع القيم الصحيحة لـ Supabase (وWATI إن وجد).

## 3. GitHub
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## 4. Netlify
- New site from Git → اختر المستودع
- Build command: (فارغ) / Publish directory: `.`
- Deploy site

## 5. اختبار PWA
افتح الموقع المنشور على Netlify عبر HTTPS، تأكد من ظهور زر التثبيت وعمل Service Worker من DevTools → Application.
