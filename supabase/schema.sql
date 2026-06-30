-- =========================================================
-- نظام الإيجارات الزراعية - Schema
-- =========================================================
create extension if not exists "uuid-ossp";

-- 1) إعدادات التطبيق
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
insert into app_settings (key, value) values ('rent_price_per_feddan', '5000')
  on conflict (key) do nothing;

-- 2) المستأجرين
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  national_id text,
  address text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) القطع الزراعية
-- 1 فدان = 24 قيراط = 576 سهم
create table if not exists parcels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tenant_id uuid references tenants(id) on delete set null,
  parent_parcel_id uuid references parcels(id) on delete set null,
  region text,
  area_feddan numeric(12,4) not null default 0,
  area_qirat numeric(12,4) generated always as (area_feddan * 24) stored,
  area_sahm numeric(14,4) generated always as (area_feddan * 576) stored,
  status text default 'safe', -- safe | under_monitoring | critical
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_parcels_tenant on parcels(tenant_id);
create index if not exists idx_parcels_parent on parcels(parent_parcel_id);

-- 4) المخالفات
create table if not exists infringements (
  id uuid primary key default uuid_generate_v4(),
  parcel_id uuid references parcels(id) on delete cascade,
  description text not null,
  report_date date default current_date,
  is_resolved boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_infringements_parcel on infringements(parcel_id);

-- 5) المستندات (روابط ملفات Supabase Storage)
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  related_type text not null, -- tenant | parcel
  related_id uuid not null,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- 6) النسخ الاحتياطية
create table if not exists backups (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  file_url text not null,
  created_at timestamptz default now()
);

-- 7) سجل إشعارات واتساب
create table if not exists whatsapp_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete set null,
  message text,
  status text default 'sent',
  sent_at timestamptz default now()
);

-- تحديث updated_at تلقائياً
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tenants_updated on tenants;
create trigger trg_tenants_updated before update on tenants
  for each row execute function set_updated_at();

drop trigger if exists trg_parcels_updated on parcels;
create trigger trg_parcels_updated before update on parcels
  for each row execute function set_updated_at();
