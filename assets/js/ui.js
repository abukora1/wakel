// =========================================================
// ui.js - متحكم الواجهة: نوافذ منبثقة، إشعارات توست، عرض البطاقات
// =========================================================
import { calculateTotalArea, calculateMonthlyRent, getInfringementStatus } from "./db.js";

const STATUS_LABELS = { safe: "آمن", under_monitoring: "تحت المراقبة", critical: "حرج" };
const STATUS_CLASS = { safe: "badge-safe", under_monitoring: "badge-monitor", critical: "badge-critical" };

export function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-info-circle";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

export function openModal(id) {
  document.getElementById(id).classList.add("show");
}
export function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

export function renderSkeleton(containerId, count = 4) {
  const el = document.getElementById(containerId);
  el.innerHTML = Array.from({ length: count }).map(() => `<div class="skeleton"></div>`).join("");
}

export function renderStats(state) {
  document.getElementById("statTenants").textContent = state.tenants.length;
  document.getElementById("statParcels").textContent = state.parcels.length;
  const activeInfringements = state.infringements.filter((i) => !i.is_resolved).length;
  document.getElementById("statInfringements").textContent = activeInfringements;
  document.getElementById("statRentPrice").textContent = state.rentPrice.toLocaleString("ar-EG");
}

export function renderTenants(containerId, tenants, parcels, onCardClick) {
  const el = document.getElementById(containerId);
  if (tenants.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>لا يوجد مستأجرون بعد. ابدأ بإضافة مستأجر جديد.</p></div>`;
    return;
  }
  el.innerHTML = tenants
    .map((t) => {
      const count = parcels.filter((p) => p.tenant_id === t.id).length;
      return `<div class="entity-card" data-id="${t.id}" data-type="tenant">
        <div class="main-info">
          <div class="title"><i class="fa-solid fa-user"></i> ${t.name}</div>
          <div class="sub">${t.phone || "بدون هاتف"} · ${count} قطعة</div>
        </div>
        <i class="fa-solid fa-chevron-left" style="color:#94a3b8"></i>
      </div>`;
    })
    .join("");
  el.querySelectorAll(".entity-card").forEach((card) => {
    card.addEventListener("click", () => onCardClick(card.dataset.id, card.dataset.type));
  });
}

export function renderParcels(containerId, parcels, tenants, infringements, rentPrice, onCardClick) {
  const el = document.getElementById(containerId);
  if (parcels.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-tractor"></i><p>لا توجد قطع مسجلة بعد.</p></div>`;
    return;
  }
  el.innerHTML = parcels
    .map((p) => {
      const tenant = tenants.find((t) => t.id === p.tenant_id);
      const total = calculateTotalArea(p.id, parcels);
      const status = getInfringementStatus(p.id, parcels, infringements);
      return `<div class="entity-card" data-id="${p.id}" data-type="parcel">
        <div class="main-info">
          <div class="title"><i class="fa-solid fa-map"></i> ${p.name}</div>
          <div class="sub">${tenant ? tenant.name : "بدون مستأجر"} · ${total.toFixed(2)} فدان · ${p.region || ""}</div>
        </div>
        <span class="badge ${STATUS_CLASS[status]}">${STATUS_LABELS[status]}</span>
      </div>`;
    })
    .join("");
  el.querySelectorAll(".entity-card").forEach((card) => {
    card.addEventListener("click", () => onCardClick(card.dataset.id, card.dataset.type));
  });
}

export function renderInfringements(containerId, infringements, parcels, onCardClick) {
  const el = document.getElementById(containerId);
  if (infringements.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>لا توجد مخالفات مسجلة.</p></div>`;
    return;
  }
  el.innerHTML = infringements
    .map((inf) => {
      const parcel = parcels.find((p) => p.id === inf.parcel_id);
      return `<div class="entity-card" data-id="${inf.id}" data-type="infringement">
        <div class="main-info">
          <div class="title"><i class="fa-solid fa-flag"></i> ${parcel ? parcel.name : "قطعة غير معروفة"}</div>
          <div class="sub">${inf.description} · ${inf.report_date || ""}</div>
        </div>
        <span class="badge ${inf.is_resolved ? "badge-safe" : "badge-critical"}">${inf.is_resolved ? "تم الحل" : "نشطة"}</span>
      </div>`;
    })
    .join("");
  el.querySelectorAll(".entity-card").forEach((card) => {
    card.addEventListener("click", () => onCardClick(card.dataset.id, card.dataset.type));
  });
}

export function buildTenantDetailHTML(tenant, parcels) {
  const tenantParcels = parcels.filter((p) => p.tenant_id === tenant.id);
  return `
    <div class="detail-row"><span class="k">الاسم</span><span class="v">${tenant.name}</span></div>
    <div class="detail-row"><span class="k">الهاتف</span><span class="v">${tenant.phone || "-"}</span></div>
    <div class="detail-row"><span class="k">الرقم القومي</span><span class="v">${tenant.national_id || "-"}</span></div>
    <div class="detail-row"><span class="k">العنوان</span><span class="v">${tenant.address || "-"}</span></div>
    <div class="detail-row"><span class="k">الملاحظات</span><span class="v">${tenant.notes || "-"}</span></div>
    <div class="detail-row"><span class="k">عدد القطع</span><span class="v">${tenantParcels.length}</span></div>
  `;
}

export function buildParcelDetailHTML(parcel, allParcels, allInfringements, rentPrice, tenant) {
  const total = calculateTotalArea(parcel.id, allParcels);
  const rent = calculateMonthlyRent(total, rentPrice);
  const status = getInfringementStatus(parcel.id, allParcels, allInfringements);
  const activeInfringements = allInfringements.filter((i) => i.parcel_id === parcel.id && !i.is_resolved).length;
  return `
    <div class="detail-row"><span class="k">الاسم</span><span class="v">${parcel.name}</span></div>
    <div class="detail-row"><span class="k">المستأجر</span><span class="v">${tenant ? tenant.name : "-"}</span></div>
    <div class="detail-row"><span class="k">المنطقة</span><span class="v">${parcel.region || "-"}</span></div>
    <div class="detail-row"><span class="k">المساحة الأساسية</span><span class="v">${parseFloat(parcel.area_feddan).toFixed(2)} فدان</span></div>
    <div class="detail-row"><span class="k">المساحة الإجمالية (مع الأبناء)</span><span class="v">${total.toFixed(2)} فدان</span></div>
    <div class="detail-row"><span class="k">الإيجار الشهري</span><span class="v">${rent.toLocaleString("ar-EG")} ج.م</span></div>
    <div class="detail-row"><span class="k">المخالفات النشطة</span><span class="v">${activeInfringements}</span></div>
    <div class="detail-row"><span class="k">الحالة</span><span class="v"><span class="badge ${STATUS_CLASS[status]}">${STATUS_LABELS[status]}</span></span></div>
  `;
}

export function setActiveTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.style.display = panel.dataset.panel === tab ? "block" : "none";
  });
}
