-- =========================================================
-- سياسات الأمان (Row Level Security)
-- =========================================================
alter table app_settings enable row level security;
alter table tenants enable row level security;
alter table parcels enable row level security;
alter table infringements enable row level security;
alter table documents enable row level security;
alter table backups enable row level security;
alter table whatsapp_logs enable row level security;

-- ملاحظة: هذه السياسات تسمح لأي مستخدم "مُصادق" (authenticated)
-- بإجراء كافة العمليات. يمكن لاحقاً تقييدها بأدوار (Admin/Viewer).

create policy "authenticated_all_app_settings" on app_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_tenants" on tenants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_parcels" on parcels
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_infringements" on infringements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_documents" on documents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_backups" on backups
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_whatsapp_logs" on whatsapp_logs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket policy (يُنشأ الـ bucket باسم backups يدوياً من لوحة Supabase)
-- بعد إنشاء الـ bucket، فعّل عليه قاعدة وصول للمستخدمين المصادقين من تبويب Policies في Storage.
