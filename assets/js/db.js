// =========================================================
// db.js - طبقة الوصول للبيانات (CRUD) عبر Supabase
// =========================================================
import { SUPABASE_CONFIG, APP_CONFIG } from "./config.js";

let supabase = null;

export function initSupabase() {
  if (!window.supabase) {
    console.error("Supabase JS library not loaded");
    return null;
  }
  supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return supabase;
}

export function getClient() {
  return supabase;
}

// ---------- Settings ----------
export async function getRentPrice() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "rent_price_per_feddan")
    .single();
  if (error) {
    console.warn("rent price fetch failed", error);
    return 0;
  }
  return parseFloat(data.value) || 0;
}

export async function setRentPrice(newPrice) {
  const { error } = await supabase
    .from("app_settings")
    .update({ value: String(newPrice), updated_at: new Date().toISOString() })
    .eq("key", "rent_price_per_feddan");
  if (error) throw error;
}

// ---------- Tenants ----------
export async function fetchTenants() {
  const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addTenant(tenant) {
  const { data, error } = await supabase.from("tenants").insert(tenant).select().single();
  if (error) throw error;
  return data;
}

export async function updateTenant(id, updates) {
  const { data, error } = await supabase.from("tenants").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTenant(id) {
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Parcels ----------
export async function fetchParcels() {
  const { data, error } = await supabase.from("parcels").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addParcel(parcel) {
  const { data, error } = await supabase.from("parcels").insert(parcel).select().single();
  if (error) throw error;
  return data;
}

export async function updateParcel(id, updates) {
  const { data, error } = await supabase.from("parcels").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteParcel(id) {
  const { error } = await supabase.from("parcels").delete().eq("id", id);
  if (error) throw error;
}

// حساب المساحة الكلية لقطعة مع كل أبنائها (متكرر)
export function calculateTotalArea(parcelId, allParcels) {
  const parcel = allParcels.find((p) => p.id === parcelId);
  if (!parcel) return 0;
  let total = parseFloat(parcel.area_feddan) || 0;
  const children = allParcels.filter((p) => p.parent_parcel_id === parcelId);
  for (const child of children) {
    total += calculateTotalArea(child.id, allParcels);
  }
  return total;
}

export function calculateMonthlyRent(totalFeddan, pricePerFeddan) {
  return Math.round(totalFeddan * pricePerFeddan * 100) / 100;
}

// ---------- Infringements ----------
export async function fetchInfringements() {
  const { data, error } = await supabase.from("infringements").select("*").order("report_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addInfringement(infringement) {
  const { data, error } = await supabase.from("infringements").insert(infringement).select().single();
  if (error) throw error;
  return data;
}

export async function resolveInfringement(id) {
  const { data, error } = await supabase.from("infringements").update({ is_resolved: true }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInfringement(id) {
  const { error } = await supabase.from("infringements").delete().eq("id", id);
  if (error) throw error;
}

// تحديد شدة المخالفات لقطعة معينة
export function getInfringementStatus(parcelId, allParcels, allInfringements) {
  const totalArea = calculateTotalArea(parcelId, allParcels) || 0.0001;
  const activeCount = allInfringements.filter((i) => i.parcel_id === parcelId && !i.is_resolved).length;
  const ratio = activeCount / totalArea;
  const { underMonitoring, critical } = APP_CONFIG.infringementThresholds;
  if (ratio >= critical) return "critical";
  if (ratio >= underMonitoring) return "under_monitoring";
  return "safe";
}

// ---------- Documents ----------
export async function fetchDocuments(relatedType, relatedId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("related_type", relatedType)
    .eq("related_id", relatedId);
  if (error) throw error;
  return data;
}

export async function addDocument(doc) {
  const { data, error } = await supabase.from("documents").insert(doc).select().single();
  if (error) throw error;
  return data;
}

// ---------- WhatsApp logs ----------
export async function logWhatsappMessage(tenantId, message, status = "sent") {
  const { error } = await supabase.from("whatsapp_logs").insert({ tenant_id: tenantId, message, status });
  if (error) console.warn("whatsapp log failed", error);
}

// ---------- Backups ----------
export async function registerBackup(fileName, fileUrl) {
  const { data, error } = await supabase.from("backups").insert({ file_name: fileName, file_url: fileUrl }).select().single();
  if (error) throw error;
  return data;
}

export async function uploadBackupFile(fileName, fileBlob) {
  const { data, error } = await supabase.storage.from("backups").upload(fileName, fileBlob, { upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("backups").getPublicUrl(fileName);
  return pub.publicUrl;
}
