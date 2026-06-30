// =========================================================
// reports.js - مولد التقارير HTML القابلة للطباعة
// =========================================================
import { calculateTotalArea, calculateMonthlyRent, getInfringementStatus } from "./db.js";

const STATUS_LABELS = {
  safe: "آمن",
  under_monitoring: "تحت المراقبة",
  critical: "حرج"
};

function buildReportHTML(state) {
  const { tenants, parcels, infringements, rentPrice } = state;

  const tenantRows = tenants
    .map((tenant) => {
      const tenantParcels = parcels.filter((p) => p.tenant_id === tenant.id);
      if (tenantParcels.length === 0) {
        return `<tr>
          <td>${tenant.name}</td><td colspan="5" style="color:#888">لا توجد قطع مسجلة</td>
        </tr>`;
      }
      return tenantParcels
        .map((parcel) => {
          const total = calculateTotalArea(parcel.id, parcels);
          const rent = calculateMonthlyRent(total, rentPrice);
          const status = getInfringementStatus(parcel.id, parcels, infringements);
          return `<tr>
            <td>${tenant.name}</td>
            <td>${parcel.name}</td>
            <td>${parcel.region || "-"}</td>
            <td>${total.toFixed(2)} فدان</td>
            <td>${rent.toLocaleString("ar-EG")} ج.م</td>
            <td><span class="status-${status}">${STATUS_LABELS[status]}</span></td>
          </tr>`;
        })
        .join("");
    })
    .join("");

  const infringementRows = infringements
    .map((inf) => {
      const parcel = parcels.find((p) => p.id === inf.parcel_id);
      return `<tr>
        <td>${parcel ? parcel.name : "-"}</td>
        <td>${inf.description}</td>
        <td>${inf.report_date || "-"}</td>
        <td>${inf.is_resolved ? "تم الحل" : "نشطة"}</td>
      </tr>`;
    })
    .join("");

  const activeInfringementsCount = infringements.filter((i) => !i.is_resolved).length;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>تقرير شامل - نظام الإيجارات الزراعية</title>
<style>
  body { font-family: 'Cairo', Arial, sans-serif; padding: 30px; color: #0f172a; }
  h1 { text-align: center; color: #15803d; }
  .meta { text-align: center; color: #64748b; margin-bottom: 20px; }
  .summary { display: flex; gap: 14px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap; }
  .summary div { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 20px; text-align: center; }
  .summary .num { font-size: 1.4rem; font-weight: 800; color: #15803d; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: right; font-size: .9rem; }
  th { background: #15803d; color: #fff; }
  tr:nth-child(even) { background: #f8fafc; }
  .status-safe { color: #16a34a; font-weight: 700; }
  .status-under_monitoring { color: #d97706; font-weight: 700; }
  .status-critical { color: #dc2626; font-weight: 700; }
  .print-btn { display: block; margin: 0 auto 20px; padding: 10px 24px; background: #15803d; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ كـ PDF</button>
  <h1>تقرير شامل - نظام الإيجارات الزراعية</h1>
  <div class="meta">تاريخ التقرير: ${new Date().toLocaleDateString("ar-EG")}</div>

  <div class="summary">
    <div><div class="num">${tenants.length}</div>المستأجرين</div>
    <div><div class="num">${parcels.length}</div>القطع</div>
    <div><div class="num">${activeInfringementsCount}</div>مخالفات نشطة</div>
    <div><div class="num">${rentPrice.toLocaleString("ar-EG")}</div>سعر الفدان (ج.م)</div>
  </div>

  <h2>تفاصيل المستأجرين والقطع</h2>
  <table>
    <thead><tr><th>المستأجر</th><th>القطعة</th><th>المنطقة</th><th>المساحة الكلية</th><th>الإيجار الشهري</th><th>الحالة</th></tr></thead>
    <tbody>${tenantRows || '<tr><td colspan="6">لا توجد بيانات</td></tr>'}</tbody>
  </table>

  <h2>سجل المخالفات</h2>
  <table>
    <thead><tr><th>القطعة</th><th>الوصف</th><th>تاريخ التقرير</th><th>الحالة</th></tr></thead>
    <tbody>${infringementRows || '<tr><td colspan="4">لا توجد مخالفات</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

export function openReportInNewWindow(state) {
  const html = buildReportHTML(state);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

export function downloadReportHTML(state) {
  const html = buildReportHTML(state);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `تقرير-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
