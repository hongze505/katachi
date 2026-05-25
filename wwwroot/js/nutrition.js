

/* ════════ TAB ════════ */
function switchTab(name) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelector(`[onclick="switchTab('${name}')"]`)
    .classList.add("active");
  document.getElementById(`tab-${name}`).classList.add("active");
}

/* ════════ 假資料 TODO: fetch('/api/foods') ════════ */
let FOOD_DB = [];

async function loadFoods() {
    try {
        const res = await fetch('/Nutrition/GetFoods');
        FOOD_DB = await res.json();
        // 欄位名稱對應後端回傳的 camelCase
        FOOD_DB = FOOD_DB.map(f => ({
            id: f.id,
            name: f.name,
            en: f.nameEn ?? "",
            cal: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            unit: f.unit
        }));
        renderFoodList(FOOD_DB);
    } catch (err) {
        console.error(err);
        showToast("食物資料載入失敗");
    }
}

let foodLog = [];
let tdeeBase = 0;
let tdeeTarget = 0;
let goalMode = "maintain";
let macroTargets = { protein: 0, carbs: 0, fat: 0 };

function calcMacroTargets(kcal, mode) {
    const ratios = {
        cut:      { p: 0.35, c: 0.35, f: 0.30 },
        maintain: { p: 0.30, c: 0.40, f: 0.30 },
        bulk:     { p: 0.25, c: 0.50, f: 0.25 },
    };
    const r = ratios[mode] || ratios.maintain;
    return {
        protein: Math.round(kcal * r.p / 4),
        carbs:   Math.round(kcal * r.c / 4),
        fat:     Math.round(kcal * r.f / 9),
    };
}

/* ════════ 登入判斷 TODO: JWT ════════ */
function isLoggedIn() {
  return false;
}

/* ════════ 儲存 / 歷史 ════════ */
const HISTORY_KEY = "katachi_nutrition_history";
/* ════════ 多日紀錄管理 ════════ */
const _LOG_KEY = "katachi_daily_logs";

function _fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function _fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function _saveTodayLog() {
  const key = document.getElementById("history-date-picker")?.value || _fmtDate(new Date());
  const all = JSON.parse(localStorage.getItem(_LOG_KEY) || "{}");
  all[key] = foodLog;
  localStorage.setItem(_LOG_KEY, JSON.stringify(all));
  renderHistory(key);
}
function _loadDayLog(dateKey) {
  const all = JSON.parse(localStorage.getItem(_LOG_KEY) || "{}");
  foodLog = all[dateKey] || [];
  const logLabel = document.querySelector("#tab-food .panel-label");
  if (logLabel) {
    const today = _fmtDate(new Date());
    if (dateKey === today) {
      logLabel.textContent = "今日記錄";
    } else {
      const d = new Date(dateKey);
      logLabel.textContent = `${d.getMonth() + 1}/${d.getDate()} 記錄`;
    }
  }
  renderLog();
  updateChart();
}

function historyChangeDate(delta) {
  const picker = document.getElementById("history-date-picker");
  const d = new Date(picker.value || _fmtDate(new Date()));
  d.setDate(d.getDate() + delta);
  const newKey = _fmtDate(d);
  picker.value = newKey;
  _loadDayLog(newKey);
  renderHistory(newKey);
}

function historyPickDate(dateKey) {
  _loadDayLog(dateKey);
  renderHistory(dateKey);
}

function jumpToDate(dateKey) {
  const picker = document.getElementById("history-date-picker");
  if (picker) picker.value = dateKey;
  _loadDayLog(dateKey);
  renderHistory(dateKey);
}
async function saveLog() {
  if (foodLog.length === 0) {
    showToast("尚未記錄任何食物");
    return;
  }
  const t = totals();
  const entry = {
    date: new Date().toLocaleDateString("zh-TW"),
    cal: Math.round(t.cal),
    protein: Math.round(t.protein),
    carbs: Math.round(t.carbs),
    fat: Math.round(t.fat),
    savedAt: Date.now(),
  };
    try {
        const dateKey = document.getElementById("history-date-picker")?.value
            || _fmtDate(new Date());

        const items = foodLog.map(e => ({
            foodId: e.id,
            grams: e.grams
        }));

        const res = await fetch('/Nutrition/SaveRecords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.__userId || 0,
                date: dateKey,
                items: items
            })
        });

        if (res.status === 401) {
            window.location.href = '/Account';
            return;
        }
        if (!res.ok) {
            showToast("雲端儲存失敗，改存本機");
            const history = getHistory();
            const filtered = history.filter((h) => h.date !== entry.date);
            filtered.unshift(entry);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 7)));
        }
    } catch (err) {
        console.error(err);
        // 網路失敗就存 localStorage
        const history = getHistory();
        const filtered = history.filter((h) => h.date !== entry.date);
        filtered.unshift(entry);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 7)));
    }
  _saveTodayLog();
  showToast("今日記錄已儲存 ✓");
  renderHistory();
}
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}
function renderHistory(activeKey) {
  const list = document.getElementById("history-list");
  const all = JSON.parse(localStorage.getItem(_LOG_KEY) || "{}");
  const today = _fmtDate(new Date());
  const yesterday = _fmtDate(new Date(Date.now() - 86400000));

  const dates = Object.keys(all)
    .filter((k) => all[k] && all[k].length > 0)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7);

  if (dates.length === 0) {
    list.innerHTML = '<p class="history-empty">尚無儲存記錄</p>';
    return;
  }

  const currentKey =
    activeKey ||
    document.getElementById("history-date-picker")?.value ||
    today;

  list.innerHTML = dates
    .map((k) => {
      const items = all[k];
      const t = items.reduce(
        (acc, e) => ({
          cal: acc.cal + (e.actualCal ?? e.cal),
          protein: acc.protein + (e.actualProtein ?? e.protein),
          carbs: acc.carbs + (e.actualCarbs ?? e.carbs),
          fat: acc.fat + (e.actualFat ?? e.fat),
        }),
        { cal: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const isActive = k === currentKey;
      const label =
        k === today
          ? `今天 ${k.slice(5).replace("-", "/")}`
          : k === yesterday
          ? `昨天 ${k.slice(5).replace("-", "/")}`
          : k.replace(/-/g, "/");

      return `
        <div class="history-item ${isActive ? "active" : ""}"
             onclick="jumpToDate('${k}')">
          <span class="history-date">${label}</span>
          <span class="history-cal">${Math.round(t.cal)} kcal</span>
          <span class="history-macros">蛋白 ${Math.round(t.protein)}g · 碳水 ${Math.round(t.carbs)}g · 脂肪 ${Math.round(t.fat)}g</span>
        </div>`;
    })
    .join("");
}

/* ════════ Toast ════════ */
function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

/* ════════ 食物列表 ════════ */
function renderFoodList(list) {
  document.getElementById("food-list").innerHTML =
    // 把陣列每個元素轉成 HTML 字串
    list
      .map(
        (f) => `<div class="food-item">
        <div class="food-item-info">
        <span class="food-item-name">${f.name}</span>
        <span class="food-item-en">${f.en}</span>
        </div>
        <div class="food-item-meta">
        <span class="food-item-cal">${f.cal}</span>
        <span class="food-item-unit">kcal /${f.unit}</span>
        </div>
        <button class="food-add-btn" onclick="addToLog(${f.id})">+</button>
        </div>`,
      )
      // 把所有字串接起來（中間不加任何分隔）
      .join("");
}
function filterFoods() {
  const s = document.getElementById("food-search").value.trim().toLowerCase();
  //拿到 #food-search 的值，去掉前後空白，英文轉小寫
  renderFoodList(
    /*三元運算 s 有值 → 過濾，s 是空字串 → 回傳全部*/
    s
      ? FOOD_DB.filter(
          (f) => f.name.includes(s) || f.en.toLowerCase().includes(s),
        )
      : FOOD_DB, // s 是空的 → 直接用全部資料
  );
}

/* ════════ 記錄 CRUD ════════ */
function addToLog(id, grams = 100) {
  const food = FOOD_DB.find((f) => f.id === id);
  if (!food) return;
  const ratio = grams / 100;
  const newItem = {
    ...food,
    logId: Date.now(),
    grams: grams,
    actualCal: food.cal * ratio,
    actualProtein: food.protein * ratio,
    actualCarbs: food.carbs * ratio,
    actualFat: food.fat * ratio,
    addedAt: Date.now(),
  };
  foodLog.unshift(newItem);

  // ⭐ 不用 renderLog() 整個重建，只插入新的那一筆
  _insertNewLogItem(newItem);
  updateChart();
  _updateLogTotal();
}

// ⭐ 新增:更新已記錄食物的公克數
function updateLogGrams(logId, newGrams) {
  const item = foodLog.find((e) => e.logId === logId);
  if (!item) return;
  newGrams = parseFloat(newGrams);
  if (isNaN(newGrams) || newGrams <= 0) {
    showToast("請輸入有效的公克數");
    renderLog();
    return;
  }
  if (newGrams > 9999) newGrams = 9999;
  const ratio = newGrams / 100;
  item.grams = newGrams;
  item.actualCal = item.cal * ratio;
  item.actualProtein = item.protein * ratio;
  item.actualCarbs = item.carbs * ratio;
  item.actualFat = item.fat * ratio;
  renderLog();
  updateChart();
}
function removeFromLog(logId) {
  foodLog = foodLog.filter((e) => e.logId !== logId);
  renderLog();
  updateChart();
}
function clearLog() {
  if (foodLog.length === 0) return;

  // 從 localStorage 拿已儲存的版本
  const key = document.getElementById("history-date-picker")?.value || _fmtDate(new Date());
  const all = JSON.parse(localStorage.getItem(_LOG_KEY) || "{}");
  const saved = all[key] || [];

  // 如果跟已儲存的一樣，代表沒有未儲存的東西
  if (foodLog.length === saved.length) {
    showToast("沒有未儲存的記錄");
    return;
  }

  // 還原成已儲存的版本
  foodLog = [...saved];
  renderLog();
  updateChart();
  showToast("已清除未儲存的記錄");
}
function _insertNewLogItem(e) {
  const container = document.getElementById("food-log");

  // 如果之前是空的，先清掉「尚未記錄」的提示
  const empty = container.querySelector(".food-log-empty");
  if (empty) empty.remove();

  // 移除前一個 latest 樣式
  document.querySelectorAll('.log-item--latest').forEach(el => el.classList.remove('log-item--latest'));

  // 建立新的 DOM 元素
  const div = document.createElement("div");
  div.className = "log-item log-item-new log-item--latest";
  div.dataset.logid = e.logId;
  div.innerHTML = `
    <div class="log-item-left">
      <div class="log-item-header">
        <span class="log-item-name">${e.name}
          <span class="log-item-time">${_fmtTime(e.addedAt)}</span>
        </span>
        <div class="log-item-grams">
          <input 
            type="number" 
            class="log-grams-input"
            value="${e.grams}" 
            min="1" max="9999" step="1"
            onchange="updateLogGrams(${e.logId}, this.value)"
            onclick="this.select()"
          />
          <span class="log-grams-unit">g</span>
        </div>
      </div>
      <span class="log-item-detail">
        ${Math.round(e.actualCal)} kcal &nbsp;·&nbsp; 
        蛋白 ${e.actualProtein.toFixed(1)}g &nbsp;·&nbsp; 
        碳水 ${e.actualCarbs.toFixed(1)}g &nbsp;·&nbsp; 
        脂肪 ${e.actualFat.toFixed(1)}g
      </span>
    </div>
    <button class="log-remove-btn" onclick="removeFromLog(${e.logId})">×</button>
  `;

  // ⭐ 插在最前面
  container.prepend(div);

  // 顯示總計區塊（如果之前是隱藏的）
  document.getElementById("log-total").classList.remove("hidden");

  // ⭐ 3 秒後移除 log-item-new class，觸發橘色淡出
  setTimeout(() => {
    div.classList.remove("log-item-new");
  }, 3000);
}
function _updateLogTotal() {
  const t = totals();
  document.getElementById("total-cal").textContent = Math.round(t.cal);
  document.getElementById("total-protein").textContent = `蛋白質 ${Math.round(t.protein)}g`;
  document.getElementById("total-carbs").textContent = `碳水 ${Math.round(t.carbs)}g`;
  document.getElementById("total-fat").textContent = `脂肪 ${Math.round(t.fat)}g`;
  document.getElementById("log-total").classList.remove("hidden");
  updateChart();
}
function renderLog() {
  const el = document.getElementById("food-log");
  const totalEl = document.getElementById("log-total");
  if (foodLog.length === 0) {
    el.innerHTML =
      '<div class="food-log-empty"><span>尚未記錄任何食物</span></div>';
    totalEl.classList.add("hidden");
    return;
  }
  el.innerHTML = foodLog
    .map(
      (e, i) => `
   <div class="log-item ${e.isNew ? 'log-item-new' : ''} ${i === 0 ? 'log-item--latest' : ''}">
      <div class="log-item-left">
        <div class="log-item-header">
          <span class="log-item-name">${e.name}<span class="log-item-time">${_fmtTime(e.addedAt)}</span></span>
          <div class="log-item-grams">
            <input 
              type="number" 
              class="log-grams-input"
              value="${e.grams}" 
              min="1" 
              max="9999"
              step="1"
              onchange="updateLogGrams(${e.logId}, this.value)"
              onclick="this.select()"
            />
            <span class="log-grams-unit">g</span>
          </div>
        </div>
        <span class="log-item-detail">
          ${Math.round(e.actualCal)} kcal &nbsp;·&nbsp; 
          蛋白 ${e.actualProtein.toFixed(1)}g &nbsp;·&nbsp; 
          碳水 ${e.actualCarbs.toFixed(1)}g &nbsp;·&nbsp; 
          脂肪 ${e.actualFat.toFixed(1)}g
        </span>
      </div>
      <button class="log-remove-btn" onclick="removeFromLog(${e.logId})">×</button>
    </div>`,
    )
    .join("");
  const t = totals();
  document.getElementById("total-cal").textContent = Math.round(t.cal);
  document.getElementById("total-protein").textContent =
    `蛋白質 ${Math.round(t.protein)}g`;
  document.getElementById("total-carbs").textContent =
    `碳水 ${Math.round(t.carbs)}g`;
  document.getElementById("total-fat").textContent =
    `脂肪 ${Math.round(t.fat)}g`;
  totalEl.classList.remove("hidden");
}
function totals() {
  return foodLog.reduce(
    (acc, e) => ({
      cal: acc.cal + (e.actualCal ?? e.cal),         // 用實際值,沒有就 fallback
      protein: acc.protein + (e.actualProtein ?? e.protein),
      carbs: acc.carbs + (e.actualCarbs ?? e.carbs),
      fat: acc.fat + (e.actualFat ?? e.fat),
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/* ════════ 圓餅圖 + 進度條 ════════ */
function updateChart() {
  const t = totals();
  const C = 301.59;
  const hasTarget = macroTargets.protein > 0;

  // 圓餅圖固定顯示實際攝取
  const total = t.protein + t.carbs + t.fat || 1;
  const pLen = C * (t.protein / total);
  const cLen = C * (t.carbs / total);
  const fLen = C * (t.fat / total);
  setArc("donut-protein", pLen, C, 0);
  setArc("donut-carbs", cLen, C, pLen);
  setArc("donut-fat", fLen, C, pLen + cLen);

  document.getElementById("donut-cal").textContent = Math.round(t.cal);

  // 圖例：有目標時顯示「實際 / 目標Xg」
  if (hasTarget) {
    document.getElementById("legend-protein").textContent =
      `${Math.round(t.protein)}g / 目標 ${macroTargets.protein}g`;
    document.getElementById("legend-carbs").textContent =
      `${Math.round(t.carbs)}g / 目標 ${macroTargets.carbs}g`;
    document.getElementById("legend-fat").textContent =
      `${Math.round(t.fat)}g / 目標 ${macroTargets.fat}g`;
  } else {
    document.getElementById("legend-protein").textContent = `${Math.round(t.protein)}g`;
    document.getElementById("legend-carbs").textContent   = `${Math.round(t.carbs)}g`;
    document.getElementById("legend-fat").textContent     = `${Math.round(t.fat)}g`;
  }

  // 進度條
  const pct = tdeeTarget > 0 ? Math.min((t.cal / tdeeTarget) * 100, 100) : 0;
  document.getElementById("cal-progress-bar").style.width = pct + "%";
  document.getElementById("progress-current").textContent = `${Math.round(t.cal)} kcal`;
  if (tdeeTarget > 0) {
    document.getElementById("progress-target").textContent = `目標 ${tdeeTarget} kcal`;
    document.getElementById("progress-hint").style.display = "none";
  }
}
function setArc(id, arcLen, C, offset) {
  const el = document.getElementById(id);
  el.setAttribute("stroke-dasharray", `${arcLen} ${C - arcLen}`);
  el.setAttribute("transform", `rotate(${(offset / C) * 360 - 90} 60 60)`);
}

/* ════════ TDEE 目標切換器 ════════ */
function setGoalMode(mode) {
  goalMode = mode;
  const offsets = { cut: -300, maintain: 0, bulk: +300 };
  tdeeTarget = tdeeBase + offsets[mode];
  macroTargets = calcMacroTargets(tdeeTarget, mode);
  // 更新按鈕 active 狀態
  document
    .querySelectorAll(".goal-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  updateChart();
  showToast(
    `目標切換為：${mode === "cut" ? "減脂" : mode === "maintain" ? "維持" : "增肌"} ${tdeeTarget} kcal`,
  );
}

/* ════════ BMI ════════ */
function calcBMI() {
  const h = parseFloat(document.getElementById("bmi-height").value);
  const w = parseFloat(document.getElementById("bmi-weight").value);
  if (!h || !w) {
    showToast("請輸入有效的身高與體重");
    return;
  }
  const bmi = w / (h / 100) ** 2;
  document.getElementById("bmi-display").textContent = bmi.toFixed(1);
  const cards = {
    thin: bmi < 18.5,
    normal: bmi >= 18.5 && bmi < 25,
    over: bmi >= 25 && bmi < 30,
    obese: bmi >= 30,
  };
  Object.entries(cards).forEach(([key, active]) => {
    document
      .getElementById(`bmi-card-${key}`)
      .classList.toggle("active", active);
  });
  const colors = {
    thin: "#5b8fa8",
    normal: "#6aab7a",
    over: "#e6a840",
    obese: "#c0544a",
  };
  const activeKey = Object.entries(cards).find(([, v]) => v)?.[0];
  document.getElementById("bmi-display").style.color =
    colors[activeKey] || "var(--color-black)";
}

/* ════════ TDEE ════════ */
function calcTDEE() {
  const gender = document.querySelector(
    'input[name="tdee-gender"]:checked',
  ).value;
  const age = parseFloat(document.getElementById("tdee-age").value);
  const height = parseFloat(document.getElementById("tdee-height").value);
  const weight = parseFloat(document.getElementById("tdee-weight").value);
  const activity = parseFloat(document.getElementById("tdee-activity").value);
  if (!age || !height || !weight) {
    showToast("請填寫所有欄位");
    return;
  }
  let bmr =
    10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);
  const tdee = Math.round(bmr * activity);
  bmr = Math.round(bmr);
  document.getElementById("bmr-display").textContent = bmr;
  document.getElementById("tdee-display").textContent = tdee;
  document.getElementById("tdee-cut").textContent = tdee - 300;
  document.getElementById("tdee-maintain").textContent = tdee;
  document.getElementById("tdee-bulk").textContent = tdee + 300;
  document.getElementById("tdee-empty").classList.add("hidden");
  document.getElementById("tdee-result").classList.remove("hidden");
  tdeeBase = tdee;
  tdeeTarget = tdee; // 預設維持
    goalMode = "maintain";
    sessionStorage.setItem('tdeeBase', tdee);  
  updateChart();
}

function applyTDEETarget() {
  if (!tdeeBase) return;
  // 更新目標切換器數值
  document.getElementById("goal-cut-val").textContent = tdeeBase - 300;
  document.getElementById("goal-maintain-val").textContent = tdeeBase;
  document.getElementById("goal-bulk-val").textContent = tdeeBase + 300;
  document.getElementById("goal-switcher").style.display = "block";
  setGoalMode("maintain");
  switchTab("food");
  showToast(`已套用 TDEE，請選擇目標`);
}

async function saveTDEEToProfile() {
    if (!tdeeBase) {
        showToast("請先計算 TDEE");
        return;
    }
    const gender = document.querySelector('input[name="tdee-gender"]:checked').value;
    const age = parseFloat(document.getElementById("tdee-age").value);
    const height = parseFloat(document.getElementById("tdee-height").value);
    const weight = parseFloat(document.getElementById("tdee-weight").value);
    const activity = document.getElementById("tdee-activity").value;

    try {
        const res = await fetch('/Nutrition/SaveProfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gender, age,
                heightCm: height,
                weightKg: weight,
                activity
            })
        });
        if (res.status === 401) {
            window.location.href = '/Account';
            return;
        }
        if (res.ok) {
            showToast("已儲存至會員資料 ✓");
        } else {
            showToast("儲存失敗，請稍後再試");
        }
    } catch (err) {
        console.error(err);
        showToast("網路錯誤");
    }
}

/* ════════ 初始化 ════════ */

// ① 同步執行：從已填好的 profile 表單計算 TDEE，不等待任何網路請求
function _initTdeeFromProfile() {
    const _h   = parseFloat(document.getElementById("tdee-height").value);
    const _w   = parseFloat(document.getElementById("tdee-weight").value);
    const _age = parseFloat(document.getElementById("tdee-age").value);
    if (!_h || !_w || !_age) return;

    const _g    = document.querySelector('input[name="tdee-gender"]:checked')?.value || 'male';
    const _act  = parseFloat(document.getElementById("tdee-activity").value) || 1.55;
    let   _bmr  = 10 * _w + 6.25 * _h - 5 * _age + (_g === 'male' ? 5 : -161);
    const _tdee = Math.round(_bmr * _act);
    _bmr = Math.round(_bmr);

    // TDEE tab — 結果面板
    document.getElementById("bmr-display").textContent   = _bmr;
    document.getElementById("tdee-display").textContent  = _tdee;
    document.getElementById("tdee-cut").textContent      = _tdee - 300;
    document.getElementById("tdee-maintain").textContent = _tdee;
    document.getElementById("tdee-bulk").textContent     = _tdee + 300;
    document.getElementById("tdee-empty").classList.add("hidden");
    document.getElementById("tdee-result").classList.remove("hidden");

    // Food Log tab — 目標切換器
    tdeeBase     = _tdee;
    tdeeTarget   = _tdee;
    goalMode     = "maintain";
    macroTargets = calcMacroTargets(_tdee, "maintain");
    document.getElementById("goal-cut-val").textContent      = _tdee - 300;
    document.getElementById("goal-maintain-val").textContent = _tdee;
    document.getElementById("goal-bulk-val").textContent     = _tdee + 300;
    document.getElementById("goal-switcher").style.display   = "block";
    document.querySelectorAll(".goal-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.mode === "maintain"));
    updateChart();
}
_initTdeeFromProfile();

// ② 非同步：載入食物清單與歷史記錄
(async () => {
    await loadFoods();
    renderHistory();
    const _picker = document.getElementById("history-date-picker");
    if (_picker) {
        _picker.value = _fmtDate(new Date());
        _kcUpdateDisplay(_picker.value);
    }
})();

/* ══════════════════════════════
   Katachi Custom Calendar
══════════════════════════════ */
(function () {
    let _kcY, _kcM;

    function _kcParse(val) {
        if (!val) return new Date();
        const [y, m, d] = val.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    window._kcUpdateDisplay = function (val) {
        const el = document.getElementById('history-date-display');
        if (!el || !val) return;
        const [y, m, d] = val.split('-');
        el.textContent = `${y}/${m}/${d}`;
    };

    window.kcToggle = function (e) {
        e.stopPropagation();
        const cal = document.getElementById('katachi-cal');
        if (!cal) return;
        if (cal.classList.contains('open')) {
            cal.classList.remove('open');
        } else {
            const v = document.getElementById('history-date-picker')?.value;
            const d = _kcParse(v);
            _kcY = d.getFullYear();
            _kcM = d.getMonth();
            _kcRender();
            cal.classList.add('open');
        }
    };

    window.kcNav = function (delta) {
        _kcM += delta;
        if (_kcM < 0) { _kcM = 11; _kcY--; }
        if (_kcM > 11) { _kcM = 0; _kcY++; }
        _kcRender();
    };

    window.kcSel = function (dateStr) {
        const picker = document.getElementById('history-date-picker');
        if (picker) picker.value = dateStr;
        _kcUpdateDisplay(dateStr);
        document.getElementById('katachi-cal')?.classList.remove('open');
        historyPickDate(dateStr);
    };

    function _kcRender() {
        const cal = document.getElementById('katachi-cal');
        if (!cal) return;
        const sel = document.getElementById('history-date-picker')?.value || '';
        const today = _fmtDate(new Date());
        const firstDow = new Date(_kcY, _kcM, 1).getDay();
        const daysInMonth = new Date(_kcY, _kcM + 1, 0).getDate();
        const mNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
        const wds = ['日','一','二','三','四','五','六'];

        let g = wds.map(w => `<div class="kc-wd">${w}</div>`).join('');
        for (let i = 0; i < firstDow; i++) g += `<div class="kc-d empty"></div>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const mm = String(_kcM + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const key = `${_kcY}-${mm}-${dd}`;
            let cls = 'kc-d';
            if (key === today) cls += ' kc-today';
            if (key === sel) cls += ' kc-sel';
            g += `<div class="${cls}" onclick="kcSel('${key}')">${d}</div>`;
        }

        cal.innerHTML = `
            <div class="kc-head">
                <button onclick="kcNav(-1)">‹</button>
                <span class="kc-month">${_kcY} · ${mNames[_kcM]}</span>
                <button onclick="kcNav(1)">›</button>
            </div>
            <div class="kc-grid">${g}</div>
            <div class="kc-foot"><button onclick="kcSel('${today}')">今天</button></div>
        `;
    }

    // 點外部關閉
    document.addEventListener('click', function (e) {
        const cal = document.getElementById('katachi-cal');
        const btn = document.getElementById('kc-trigger');
        if (cal && btn && !cal.contains(e.target) && !btn.contains(e.target)) {
            cal.classList.remove('open');
        }
    });

    // 修補 historyChangeDate 以同步更新顯示文字
    const _origHCD = window.historyChangeDate;
    window.historyChangeDate = function (delta) {
        _origHCD(delta);
        const v = document.getElementById('history-date-picker')?.value;
        if (v) _kcUpdateDisplay(v);
    };
})();
