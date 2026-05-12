/*
main.js - 應用控制層（Application Orchestrator / State Manager）

用途：
此模組負責整個訓練系統的「全局狀態管理 + 頁面切換 + UI 初始化流程」，
為 Page 1 / Page 2 / Page 3 提供統一入口與互動控制。
*/

// ====== 狀態變數 ======

const _tw = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
const TODAY = `${_tw.getFullYear()}-${String(_tw.getMonth() + 1).padStart(2, '0')}-${String(_tw.getDate()).padStart(2, '0')}`;
let curMon = new Date(_tw.getFullYear(), _tw.getMonth(), 1), selDate = TODAY;
let prmrMode = 'pr', statsMode = 'completion';       // Page 1 卡片切換模式
let p2period = 'month', p2metric = 'weight', p2ex = 'row-bar', p2lm = '2026-03', p2rm = '2026-04';  // Page 2 月檢視狀態
let p2ly = '2025', p2ry = '2026';  // Page 2 年檢視狀態
let addEx = null, addS = 3, addR = 8;                // 新增訓練 modal 暫存值

// ====== 頁籤導覽 ======
// 點擊 subnav-tab 切換 .page，切換到 p2/p3 時延遲初始化圖表
document.querySelectorAll('.subnav-tab').forEach(t => {
    t.addEventListener('click', () => {
        setActive('.subnav-tab', t);
        document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
        document.getElementById('page-' + t.dataset.page).classList.add('active');
        if (t.dataset.page === 'p2') buildCharts();   // Chart.js 需在元素可見後才能正確渲染
        if (t.dataset.page === 'p3') buildP3();
        if (t.dataset.page === 'p4') loadGoalPage();
    });
});

// ====== 個人資料 Modal ======

let goalSettings = {};

async function loadGoalPage() {
    goalSettings = await fetch('/TrainingLog/GetGoals').then(r => r.json());
    buildGoalGrid();
}

document.getElementById('mo-profile-save').addEventListener('click', async () => {
    await fetch('/TrainingLog/SaveGoals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalSettings)
    });
    if (document.getElementById('page-p3').classList.contains('active')) buildP3();
});

function buildGoalGrid() {
    const g = document.getElementById('goal-setting-grid'); g.innerHTML = '';
    Object.entries(goalSettings).forEach(([mu, val]) => {
        g.innerHTML += `<div class="gs-item"><div class="gs-name">${mu}</div><div class="gs-ctrl"><button class="gs-btn" onclick="adjGoal('${mu}',-1)">-</button><span><span class="gs-val" id="gsv-${mu}">${val}</span><span class="gs-unit"> 組/月</span></span><button class="gs-btn" onclick="adjGoal('${mu}',1)">+</button></div></div>`;
    });
}

function adjGoal(mu, delta) {
    const el = document.getElementById('gsv-' + mu);
    if (!el) return;
    goalSettings[mu] = Math.max(5, goalSettings[mu] + delta);
    el.textContent = goalSettings[mu];
}
// ====== 初始化 ======

// 頁面載入後依序執行：填充月份選單 → 填充年份選單 → 統計 → 月曆 → 詳情
buildMonthOpts(); buildYearOpts(); renderStats(); renderCal(); renderDetail();