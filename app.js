const KEY = "personalForecastDashboard.v1";
const DEFAULTS = {
  currencySymbol: "$",
  currentSavings: 0,
  savingPerPay: 0,
  tripTarget: 0,
  payFrequency: "fortnightly",
  nextPayDate: "",
  vacationStart: "2026-08-14",
  vacationEnd: "2026-10-31",
  leaveBalanceHours: 0,
  leaveAccrualPerPay: 0,
  hoursPerWorkDay: 7.6,
  plannedLeaveHours: "",
  oneOffItems: []
};

let data = loadData();
let route = "home";

const $ = (id) => document.getElementById(id);
const fields = [
  "currencySymbol",
  "currentSavings",
  "savingPerPay",
  "tripTarget",
  "payFrequency",
  "nextPayDate",
  "vacationStart",
  "vacationEnd",
  "leaveBalanceHours",
  "leaveAccrualPerPay",
  "hoursPerWorkDay",
  "plannedLeaveHours"
];

document.addEventListener("DOMContentLoaded", () => {
  bind();
  hydrate();
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});

function bind() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });

  fields.forEach((id) => {
    $(id).addEventListener("input", () => {
      saveFields();
      render();
    });
  });

  $("addItemBtn").addEventListener("click", addItem);
  $("exportBtn").addEventListener("click", exportBackup);
  $("importInput").addEventListener("change", importBackup);
  $("resetBtn").addEventListener("click", resetData);
}

function setRoute(nextRoute) {
  route = nextRoute;
  document.body.dataset.route = route;
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("is-active"));
  $(`screen-${route}`).classList.add("is-active");
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || typeof saved !== "object") return { ...DEFAULTS, oneOffItems: [] };
    return {
      ...DEFAULTS,
      ...saved,
      oneOffItems: Array.isArray(saved.oneOffItems) ? saved.oneOffItems : []
    };
  } catch {
    return { ...DEFAULTS, oneOffItems: [] };
  }
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function hydrate() {
  fields.forEach((id) => {
    $(id).value = data[id] ?? "";
  });
}

function saveFields() {
  fields.forEach((id) => {
    const input = $(id);
    data[id] = input.type === "number" ? (input.value === "" ? "" : Number(input.value)) : input.value;
  });
  persist();
}

function resetData() {
  if (!confirm("Reset all dashboard data saved in this browser?")) return;
  data = { ...DEFAULTS, oneOffItems: [] };
  persist();
  hydrate();
  render();
  toast("Dashboard reset");
}

function render() {
  const today = startOfDay(new Date());
  const vac = parseDate(data.vacationStart);
  const end = parseDate(data.vacationEnd);
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  const savingsVac = forecast(vac, today);
  const savingsEnd = forecast(yearEnd, today);
  const paydays = paydaysUntil(vac, today);
  const days = vac ? Math.max(0, Math.ceil((vac - today) / 86400000)) : 0;
  const leaveAvailable = num(data.leaveBalanceHours) + num(data.leaveAccrualPerPay) * paydays.length;
  const leaveNeed = leaveRequired(vac, end);
  const leaveGap = leaveAvailable - leaveNeed;

  $("todayLine").textContent = fmtDate(today);
  $("currencyPill").textContent = data.currencySymbol === "$" ? "AUD" : data.currencySymbol || "AUD";
  $("savingsVacation").textContent = money(savingsVac);
  $("targetProgressText").textContent = targetText(savingsVac);
  $("targetProgress").style.width = `${targetPercent(savingsVac)}%`;

  $("savingsVacationMoney").textContent = money(savingsVac);
  $("savingsVacationMeta").textContent = vac ? fmtDate(vac) : "Not set";
  $("savingsYearEnd").textContent = money(savingsEnd);
  $("savingsYearEndMeta").textContent = fmtDate(yearEnd);
  $("paydaysLeftMeta").textContent = `${paydays.length} left`;

  $("leaveByVacation").textContent = `${fmtNum(leaveAvailable)} hrs`;
  $("leaveByVacationMeta").textContent = `${fmtNum(num(data.leaveBalanceHours))} current + ${fmtNum(num(data.leaveAccrualPerPay))} hrs per pay.`;
  $("leaveGapBadge").textContent = `${leaveGap >= 0 ? "+" : ""}${fmtNum(leaveGap)} hrs`;
  $("leaveGapBadge").classList.toggle("bad", leaveGap < 0);
  $("leaveGapBadge").classList.toggle("good", leaveGap >= 0);
  $("tripCountdownSmall").textContent = vac ? `${days} days` : "Set date";

  renderHome(today, vac, end, savingsEnd, paydays, days, leaveAvailable, leaveNeed, leaveGap);
  renderPaydays(today, vac);
  renderLeave(vac, end, days, leaveAvailable, leaveNeed, leaveGap);
  renderItems(today, vac);
}

function renderHome(today, vac, end, savingsEnd, paydays, days, leaveAvailable, leaveNeed, leaveGap) {
  const rows = [
    row("31", "End of year", fmtDate(new Date(today.getFullYear(), 11, 31)), money(savingsEnd)),
    row("P", "Paydays left", vac ? `Until ${fmtDate(vac)}` : "Set vacation date", String(paydays.length)),
    row("D", "Vacation countdown", vac ? `${fmtNum(days / 7)} weeks / ${fmtNum(days / 14)} fortnights` : "Set vacation date", vac ? `${days}d` : "—"),
    row("L", "Leave gap", `Need ${fmtNum(leaveNeed)} hrs · Have ${fmtNum(leaveAvailable)} hrs`, `${leaveGap >= 0 ? "+" : ""}${fmtNum(leaveGap)}h`, leaveGap >= 0 ? "good" : "bad")
  ];
  $("homeSnapshot").innerHTML = rows.join("");
}

function renderPaydays(today, vac) {
  const dates = paydaysUntil(vac, today).slice(0, 10);
  if (!data.nextPayDate || !vac || !dates.length) {
    $("paydayList").innerHTML = `<div class="empty-card">Set your next payday and vacation start date.</div>`;
    return;
  }
  $("paydayList").innerHTML = dates.map((date, index) => row("$", fmtDate(date), index === 0 ? "Next expected payday" : "Projected savings after this pay", money(forecast(date, today)))).join("");
}

function renderLeave(vac, end, days, available, need, gap) {
  const rows = [
    row("D", "Days until vacation", vac ? `${fmtNum(days / 7)} weeks · ${fmtNum(days / 14)} fortnights` : "Set vacation date", vac ? `${days}` : "—"),
    row("S", "Vacation start", "Editable in settings", vac ? fmtDate(vac) : "—"),
    row("E", "Vacation end", "Editable in settings", end ? fmtDate(end) : "—"),
    row("N", "Leave needed", data.plannedLeaveHours === "" ? "Auto estimate: Mon-Fri only" : "Manual hours entered", `${fmtNum(need)}h`),
    row("G", "Leave gap", `Available ${fmtNum(available)}h`, `${gap >= 0 ? "+" : ""}${fmtNum(gap)}h`, gap >= 0 ? "good" : "bad")
  ];
  $("leaveSnapshot").innerHTML = rows.join("");
}

function renderItems(today, vac) {
  const sorted = data.oneOffItems.slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const active = sorted.filter((item) => {
    const d = parseDate(item.date);
    return d && d >= today && (!vac || d <= vac);
  });
  const total = active.reduce((sum, item) => sum + (item.type === "income" ? num(item.amount) : -num(item.amount)), 0);
  $("itemsTotal").textContent = `${active.length} upcoming · ${money(total)}`;

  if (!sorted.length) {
    $("itemsList").innerHTML = `<div class="empty-card">No one-off items added.</div>`;
    return;
  }

  $("itemsList").innerHTML = sorted.map((item) => {
    const sign = item.type === "income" ? "+" : "-";
    const valueClass = item.type === "income" ? "good" : "bad";
    return `
      <div class="forecast-row">
        <div class="row-icon">${item.type === "income" ? "+" : "−"}</div>
        <div class="row-main">
          <div class="row-title">${escapeHtml(item.name)}</div>
          <div class="row-subtitle">${fmtDate(parseDate(item.date))} · ${item.type}</div>
        </div>
        <button class="row-value ${valueClass} text-remove" type="button" data-remove="${item.id}">${sign}${money(item.amount)}</button>
      </div>`;
  }).join("");

  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      data.oneOffItems = data.oneOffItems.filter((item) => item.id !== button.dataset.remove);
      persist();
      render();
      toast("Item removed");
    });
  });
}

function row(icon, title, subtitle, value, valueClass = "") {
  return `
    <div class="forecast-row">
      <div class="row-icon">${icon}</div>
      <div class="row-main"><div class="row-title">${title}</div><div class="row-subtitle">${subtitle}</div></div>
      <div class="row-value ${valueClass}">${value}</div>
    </div>`;
}

function addItem() {
  const name = $("itemName").value.trim();
  const type = $("itemType").value;
  const amount = Number($("itemAmount").value);
  const date = $("itemDate").value;

  if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
    toast("Add name, amount and date");
    return;
  }

  data.oneOffItems.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    type,
    amount,
    date
  });
  persist();
  ["itemName", "itemAmount", "itemDate"].forEach((id) => ($(id).value = ""));
  $("itemType").value = "expense";
  render();
  toast("Item added");
}

function forecast(target, today = startOfDay(new Date())) {
  if (!target) return num(data.currentSavings);
  return num(data.currentSavings) + num(data.savingPerPay) * paydaysUntil(target, today).length + itemTotalUntil(target, today);
}

function itemTotalUntil(target, today = startOfDay(new Date())) {
  return data.oneOffItems.reduce((total, item) => {
    const d = parseDate(item.date);
    if (!d || d < today || d > target) return total;
    return total + (item.type === "income" ? num(item.amount) : -num(item.amount));
  }, 0);
}

function paydaysUntil(target, today = startOfDay(new Date())) {
  const next = parseDate(data.nextPayDate);
  if (!next || !target) return [];
  let d = startOfDay(next);
  let guard = 0;
  while (d < today && guard < 600) {
    d = addCycle(d);
    guard += 1;
  }
  const out = [];
  guard = 0;
  while (d <= target && guard < 600) {
    out.push(new Date(d));
    d = addCycle(d);
    guard += 1;
  }
  return out;
}

function addCycle(date) {
  const d = new Date(date);
  if (data.payFrequency === "weekly") {
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (data.payFrequency === "monthly") {
    const day = d.getDate();
    d.setMonth(d.getMonth() + 1);
    if (d.getDate() < day) d.setDate(0);
    return d;
  }
  d.setDate(d.getDate() + 14);
  return d;
}

function leaveRequired(startDate, endDate) {
  if (data.plannedLeaveHours !== "" && data.plannedLeaveHours !== null && Number(data.plannedLeaveHours) >= 0) {
    return num(data.plannedLeaveHours);
  }
  if (!startDate || !endDate || endDate < startDate) return 0;
  return weekdaysInclusive(startDate, endDate) * num(data.hoursPerWorkDay || 7.6);
}

function weekdaysInclusive(startDate, endDate) {
  let count = 0;
  const d = new Date(startDate);
  while (d <= endDate) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function targetPercent(balance) {
  const target = num(data.tripTarget);
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, (balance / target) * 100));
}

function targetText(balance) {
  const target = num(data.tripTarget);
  if (target <= 0) return "Set a trip target in Settings.";
  const gap = balance - target;
  return gap >= 0 ? `${money(gap)} above target by vacation.` : `${money(Math.abs(gap))} short of target by vacation.`;
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forecast-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Backup exported");
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      data = { ...DEFAULTS, ...imported, oneOffItems: Array.isArray(imported.oneOffItems) ? imported.oneOffItems : [] };
      persist();
      hydrate();
      render();
      toast("Backup imported");
    } catch {
      toast("Could not import backup");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function parseDate(value) {
  if (!value) return null;
  const p = String(value).split("-").map(Number);
  if (p.length !== 3 || p.some(Number.isNaN)) return null;
  return startOfDay(new Date(p[0], p[1] - 1, p[2]));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(date) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function fmtNum(value, digits = 1) {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(num(value));
}

function money(value) {
  return `${data.currencySymbol || "$"}${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(num(value))}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1700);
}
