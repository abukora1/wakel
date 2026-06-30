// =========================================================
// whatsapp.js - إرسال إشعارات واتساب عبر WATI أو رابط wa.me
// =========================================================
import { WATI_CONFIG } from "./config.js";
import { logWhatsappMessage } from "./db.js";

function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

export async function sendWhatsappMessage(tenant, message) {
  const phone = normalizePhone(tenant.phone);
  if (!phone) {
    throw new Error("لا يوجد رقم هاتف مسجل لهذا المستأجر");
  }

  if (WATI_CONFIG.apiEndpoint && WATI_CONFIG.accessToken) {
    try {
      const res = await fetch(
        `${WATI_CONFIG.apiEndpoint}/sendSessionMessage/${encodeURIComponent(phone)}?messageText=${encodeURIComponent(message)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WATI_CONFIG.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (!res.ok) throw new Error("WATI API error");
      await logWhatsappMessage(tenant.id, message, "sent_via_wati");
      return { method: "wati", success: true };
    } catch (err) {
      console.warn("WATI failed, falling back to wa.me", err);
    }
  }

  // رجوع لرابط wa.me
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  await logWhatsappMessage(tenant.id, message, "opened_wa_link");
  return { method: "wa.me", success: true };
}

export function buildTenantGreetingMessage(tenant) {
  return `مرحباً ${tenant.name}،\nنود التواصل معكم بخصوص عقد الإيجار الزراعي الخاص بكم.\nيرجى التواصل معنا لأي استفسار.\nشكراً لكم.`;
}

export function buildInfringementAlertMessage(tenant, parcelName, description) {
  return `تنبيه: تم تسجيل مخالفة على القطعة "${parcelName}" التابعة لكم.\nالوصف: ${description}\nيرجى المبادرة بمعالجة الأمر في أقرب وقت.`;
}
