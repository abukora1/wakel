// =========================================================
// app.js - تشغيل التطبيق، ربط الأحداث، إدارة الحالة
// =========================================================
import { APP_CONFIG } from "./config.js";
import * as db from "./db.js";
import * as ui from "./ui.js";
import { openReportInNewWindow, downloadReportHTML } from "./reports.js";
import { backupToLocalFile, backupToCloud, readBackupFile, restoreFromBackup } from "./backup.js";
import { sendWhatsappMessage, buildTenantGreetingMessage } from "./whatsapp.js";

const state = {
  tenants: [],
  parcels: [],
  infringements: [],
  rentPrice: 0,
  currentTab: "tenants",
  searchTerm: "",
  selectedEntity: null // { id, type }
};

const LOCAL_CACHE_KEY = "agri_rental_cache_v1";

function saveLocalCache() {
  try {
    localStorage.setItem(
      LOCAL_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), tenants: state.tenants, parcels: state.parcels, infringements: state.infringements, rentPrice: state.rentPrice })
    );
  } catch (e) {
    console.warn("local cache save failed", e);
  }
}

function loadLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return false;
    const cached = JSON.parse(raw);
    state.tenants = cached.tenants || [];
    state.parcels = cached.parcels || [];
    state.infringements = cached.infringements || [];
    state.rentPrice = cached.rentPrice || 0;
    return true;
  } catch (e) {
    return false;
  }
}

async function loadAllData() {
  try {
    const [tenants, parcels, infringements, rentPrice] = await Promise.all([
      db.fetchTenants(),
      db.fetchParcels(),
      db.fetchInfringements(),
      db.getRentPrice()
    ]);
    state.tenants = tenants;
    state.parcels = parcels;
    state.infringements = infringements;
    state.rentPrice = rentPrice;
    saveLocalCache();
  } catch (err) {
    console.error("loadAllData error", err);
    ui.showToast("تعذر الاتصال بالخادم، يتم عرض بيانات محفوظة محلياً", "error");
    loadLocalCache();
  }
  renderAll();
}

function getFilteredList(type) {
  const term = state.searchTerm.trim().toLowerCase();
  if (type === "tenants") {
    if (!term) return state.tenants;
    return state.tenants.filter(
      (t) => t.name?.toLowerCase().includes(term) || t.phone?.includes(term) || t.address?.toLowerCase().includes(term)
    );
  }
  if (type === "parcels") {
    if (!term) return state.parcels;
    return state.parcels.filter((p) => p.name?.toLowerCase().includes(term) || p.region?.toLowerCase().includes(term));
  }
  if (type === "infringements") {
    if (!term) return state.infringements;
    return state.infringements.filter((i) => i.description?.toLowerCase().includes(term));
  }
  return [];
}

function renderAll() {
  ui.renderStats(state);
  ui.renderTenants("tenantsList", getFilteredList("tenants"), state.parcels, openDetail);
  ui.renderParcels("parcelsList", getFilteredList("parcels"), state.tenants, state.infringements, state.rentPrice, openDetail);
  ui.renderInfringements("infringementsList", getFilteredList("infringements"), state.parcels, openDetail);
}

function openDetail(id, type) {
  state.selectedEntity = { id, type };
  if (type === "tenant") {
    const tenant = state.tenants.find((t) => t.id === id);
    document.getElementById("detailTitle").textContent = tenant.name;
    document.getElementById("detailBody").innerHTML = ui.buildTenantDetailHTML(tenant, state.parcels);
    document.getElementById("detailWhatsappBtn").style.display = "inline-flex";
    document.getElementById("detailDeleteBtn").style.display = "inline-flex";
  } else if (type === "parcel") {
    const parcel = state.parcels.find((p) => p.id === id);
    const tenant = state.tenants.find((t) => t.id === parcel.tenant_id);
    document.getElementById("detailTitle").textContent = parcel.name;
    document.getElementById("detailBody").innerHTML = ui.buildParcelDetailHTML(parcel, state.parcels, state.infringements, state.rentPrice, tenant);
    document.getElementById("detailWhatsappBtn").style.display = "none";
    document.getElementById("detailDeleteBtn").style.display = "inline-flex";
  } else if (type === "infringement") {
    const inf = state.infringements.find((i) => i.id === id);
    const parcel = state.parcels.find((p) => p.id === inf.parcel_id);
    document.getElementById("detailTitle").textContent = "تفاصيل المخالفة";
    document.getElementById("detailBody").innerHTML = `
      <div class="detail-row"><span class="k">القطعة</span><span class="v">${parcel ? parcel.name : "-"}</span></div>
      <div class="detail-row"><span class="k">الوصف</span><span class="v">${inf.description}</span></div>
      <div class="detail-row"><span class="k">التاريخ</span><span class="v">${inf.report_date}</span></div>
      <div class="detail-row"><span class="k">الحالة</span><span class="v">${inf.is_resolved ? "تم الحل" : "نشطة"}</span></div>
    `;
    document.getElementById("detailWhatsappBtn").style.display = "none";
    document.getElementById("detailDeleteBtn").style.display = "inline-flex";
  }
  ui.openModal("detailModal");
}

// ---------------- Event bindings ----------------
function bindStaticEvents() {
  // البحث
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("searchClearBtn");
  searchInput.addEventListener("input", () => {
    state.searchTerm = searchInput.value;
    clearBtn.classList.toggle("show", !!searchInput.value);
    renderAll();
  });
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchTerm = "";
    clearBtn.classList.remove("show");
    renderAll();
  });

  // التبويبات
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentTab = btn.dataset.tab;
      ui.setActiveTab(state.currentTab);
    });
  });

  // تحديث البيانات
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    ui.showToast("جارٍ تحديث البيانات...", "info");
    await loadAllData();
    ui.showToast("تم تحديث البيانات بنجاح");
  });

  // إغلاق المودالز
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => ui.closeModal(btn.dataset.closeModal));
  });

  // فتح نموذج إضافة مستأجر
  document.getElementById("addTenantBtn").addEventListener("click", () => {
    document.getElementById("tenantForm").reset();
    ui.openModal("tenantModal");
  });
  document.getElementById("tenantForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const tenant = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      national_id: form.national_id.value.trim(),
      address: form.address.value.trim(),
      notes: form.notes.value.trim()
    };
    try {
      const created = await db.addTenant(tenant);
      state.tenants.unshift(created);
      saveLocalCache();
      renderAll();
      ui.closeModal("tenantModal");
      ui.showToast("تم إضافة المستأجر بنجاح");
    } catch (err) {
      console.error(err);
      ui.showToast("حدث خطأ أثناء إضافة المستأجر", "error");
    }
  });

  // فتح نموذج إضافة قطعة
  document.getElementById("addParcelBtn").addEventListener("click", () => {
    document.getElementById("parcelForm").reset();
    populateParcelFormSelects();
    ui.openModal("parcelModal");
  });
  document.getElementById("parcelForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const parcel = {
      name: form.name.value.trim(),
      tenant_id: form.tenant_id.value || null,
      parent_parcel_id: form.parent_parcel_id.value || null,
      region: form.region.value.trim(),
      area_feddan: parseFloat(form.area_feddan.value) || 0
    };
    try {
      const created = await db.addParcel(parcel);
      state.parcels.unshift(created);
      saveLocalCache();
      renderAll();
      ui.closeModal("parcelModal");
      ui.showToast("تم إضافة القطعة بنجاح");
    } catch (err) {
      console.error(err);
      ui.showToast("حدث خطأ أثناء إضافة القطعة", "error");
    }
  });

  // فتح نموذج تسجيل مخالفة
  document.getElementById("addInfringementBtn").addEventListener("click", () => {
    document.getElementById("infringementForm").reset();
    document.getElementById("infringementForm").report_date.value = new Date().toISOString().slice(0, 10);
    populateInfringementFormSelect();
    ui.openModal("infringementModal");
  });
  document.getElementById("infringementForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const infringement = {
      parcel_id: form.parcel_id.value,
      description: form.description.value.trim(),
      report_date: form.report_date.value
    };
    try {
      const created = await db.addInfringement(infringement);
      state.infringements.unshift(created);
      saveLocalCache();
      renderAll();
      ui.closeModal("infringementModal");
      ui.showToast("تم تسجيل المخالفة بنجاح");
    } catch (err) {
      console.error(err);
      ui.showToast("حدث خطأ أثناء تسجيل المخالفة", "error");
    }
  });

  // التقرير
  document.getElementById("reportBtn").addEventListener("click", () => {
    openReportInNewWindow(state);
  });
  document.getElementById("exportReportBtn").addEventListener("click", () => {
    downloadReportHTML(state);
  });

  // النسخ الاحتياطي
  document.getElementById("backupBtn").addEventListener("click", () => {
    ui.openModal("backupModal");
  });
  document.getElementById("backupLocalBtn").addEventListener("click", async () => {
    await backupToLocalFile(state);
    ui.showToast("تم تحميل النسخة الاحتياطية محلياً");
  });
  document.getElementById("backupCloudBtn").addEventListener("click", async () => {
    try {
      await backupToCloud(state);
      ui.showToast("تم رفع النسخة الاحتياطية إلى Supabase");
    } catch (err) {
      console.error(err);
      ui.showToast("فشل رفع النسخة الاحتياطية، تحقق من إعداد bucket باسم backups", "error");
    }
  });
  document.getElementById("restoreFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("سيتم استبدال جميع البيانات الحالية بالنسخة المرفوعة. هل أنت متأكد؟")) return;
    try {
      const backupObj = await readBackupFile(file);
      await restoreFromBackup(backupObj);
      await loadAllData();
      ui.closeModal("backupModal");
      ui.showToast("تمت استعادة البيانات بنجاح");
    } catch (err) {
      console.error(err);
      ui.showToast(err.message || "فشلت عملية الاستعادة", "error");
    }
  });

  // تفاصيل: حذف
  document.getElementById("detailDeleteBtn").addEventListener("click", async () => {
    const { id, type } = state.selectedEntity;
    if (!confirm("هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      if (type === "tenant") {
        await db.deleteTenant(id);
        state.tenants = state.tenants.filter((t) => t.id !== id);
      } else if (type === "parcel") {
        await db.deleteParcel(id);
        state.parcels = state.parcels.filter((p) => p.id !== id);
      } else if (type === "infringement") {
        await db.deleteInfringement(id);
        state.infringements = state.infringements.filter((i) => i.id !== id);
      }
      saveLocalCache();
      renderAll();
      ui.closeModal("detailModal");
      ui.showToast("تم الحذف بنجاح");
    } catch (err) {
      console.error(err);
      ui.showToast("حدث خطأ أثناء الحذف", "error");
    }
  });

  // تفاصيل: واتساب
  document.getElementById("detailWhatsappBtn").addEventListener("click", async () => {
    const { id, type } = state.selectedEntity;
    if (type !== "tenant") return;
    const tenant = state.tenants.find((t) => t.id === id);
    try {
      await sendWhatsappMessage(tenant, buildTenantGreetingMessage(tenant));
      ui.showToast("تم إرسال الرسالة بنجاح");
    } catch (err) {
      ui.showToast(err.message || "فشل إرسال الرسالة", "error");
    }
  });

  // سعر الفدان
  document.getElementById("rentPriceBtn").addEventListener("click", () => {
    document.getElementById("rentPriceInput").value = state.rentPrice;
    ui.openModal("rentPriceModal");
  });
  document.getElementById("rentPriceForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPrice = parseFloat(document.getElementById("rentPriceInput").value) || 0;
    try {
      await db.setRentPrice(newPrice);
      state.rentPrice = newPrice;
      saveLocalCache();
      renderAll();
      ui.closeModal("rentPriceModal");
      ui.showToast("تم تحديث سعر الفدان بنجاح");
    } catch (err) {
      console.error(err);
      ui.showToast("حدث خطأ أثناء تحديث السعر", "error");
    }
  });
}

function populateParcelFormSelects() {
  const tenantSelect = document.querySelector("#parcelForm select[name=tenant_id]");
  tenantSelect.innerHTML =
    `<option value="">بدون مستأجر</option>` + state.tenants.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");

  const parentSelect = document.querySelector("#parcelForm select[name=parent_parcel_id]");
  parentSelect.innerHTML =
    `<option value="">بدون قطعة أم</option>` + state.parcels.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
}

function populateInfringementFormSelect() {
  const parcelSelect = document.querySelector("#infringementForm select[name=parcel_id]");
  parcelSelect.innerHTML = state.parcels.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
}

// ---------------- PWA Install ----------------
let deferredPrompt = null;
function bindPwaInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById("installBtn").style.display = "flex";
  });
  document.getElementById("installBtn").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById("installBtn").style.display = "none";
  });
  window.addEventListener("appinstalled", () => {
    ui.showToast("تم تثبيت التطبيق بنجاح");
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("SW registration failed", err));
  }
}

// ---------------- Init ----------------
async function init() {
  db.initSupabase();
  bindStaticEvents();
  bindPwaInstall();
  registerServiceWorker();
  ui.setActiveTab(state.currentTab);
  ui.renderSkeleton("tenantsList");
  ui.renderSkeleton("parcelsList");
  ui.renderSkeleton("infringementsList");
  await loadAllData();
}

document.addEventListener("DOMContentLoaded", init);
