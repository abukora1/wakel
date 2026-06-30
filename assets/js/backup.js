// =========================================================
// backup.js - النسخ الاحتياطي واستعادة البيانات (JSON)
// =========================================================
import { getClient, registerBackup, uploadBackupFile } from "./db.js";

export async function createBackupObject(state) {
  return {
    version: 1,
    created_at: new Date().toISOString(),
    data: {
      tenants: state.tenants,
      parcels: state.parcels,
      infringements: state.infringements,
      settings: { rent_price_per_feddan: state.rentPrice }
    }
  };
}

export function downloadJSON(obj, fileName) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function backupToLocalFile(state) {
  const backupObj = await createBackupObject(state);
  const fileName = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadJSON(backupObj, fileName);
  return fileName;
}

export async function backupToCloud(state) {
  const backupObj = await createBackupObject(state);
  const fileName = `backup-${Date.now()}.json`;
  const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
  const fileUrl = await uploadBackupFile(fileName, blob);
  await registerBackup(fileName, fileUrl);
  return fileUrl;
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        resolve(parsed);
      } catch (e) {
        reject(new Error("ملف النسخة الاحتياطية غير صالح"));
      }
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsText(file);
  });
}

// استعادة البيانات: تستبدل كل الجداول بالبيانات الموجودة في النسخة
export async function restoreFromBackup(backupObj) {
  const supabase = getClient();
  const { tenants = [], parcels = [], infringements = [] } = backupObj.data || {};

  // حذف الحالي
  await supabase.from("infringements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("parcels").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (tenants.length) await supabase.from("tenants").insert(tenants);
  if (parcels.length) await supabase.from("parcels").insert(parcels.map(({ area_qirat, area_sahm, ...rest }) => rest));
  if (infringements.length) await supabase.from("infringements").insert(infringements);

  if (backupObj.data?.settings?.rent_price_per_feddan) {
    await supabase
      .from("app_settings")
      .update({ value: String(backupObj.data.settings.rent_price_per_feddan) })
      .eq("key", "rent_price_per_feddan");
  }
}
