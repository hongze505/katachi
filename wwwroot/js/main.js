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
        if (t.dataset.page === 'p2') buildCharts();
        if (t.dataset.page === 'p3') buildP3();
        if (t.dataset.page === 'p4') loadGoalPage();
        if (window.innerWidth <= 1024) closeDrawer();
    });
});

// ====== 漢堡 FAB（可拖動）======
const fab = document.getElementById('fab-menu');
const drawerOverlay = document.getElementById('drawer-overlay');
const sidebarL = document.querySelector('.sidebar-l');

// 初始位置：logo 下方左側（從 localStorage 還原或預設）
(function initFabPos() {
    const x = localStorage.getItem('fab-x');
    const y = localStorage.getItem('fab-y');
    const navH = document.getElementById('nav')?.offsetHeight ?? 52;
    fab.style.left = (x ?? 16) + 'px';
    fab.style.top  = (y ?? navH + 16) + 'px';
})();

function openDrawer() {
    sidebarL.classList.add('open');
    drawerOverlay.classList.add('show');
    fab.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    sidebarL.classList.remove('open');
    drawerOverlay.classList.remove('show');
    fab.classList.remove('open');
    document.body.style.overflow = '';
}

drawerOverlay.addEventListener('click', closeDrawer);

// 拖動邏輯
let isDragging = false, hasMoved = false, ox = 0, oy = 0;

fab.addEventListener('mousedown', startDrag);
fab.addEventListener('touchstart', startDrag, { passive: false });

function startDrag(e) {
    isDragging = true; hasMoved = false;
    const p = e.touches ? e.touches[0] : e;
    const r = fab.getBoundingClientRect();
    ox = p.clientX - r.left;
    oy = p.clientY - r.top;
    e.preventDefault();
}

document.addEventListener('mousemove', onDrag);
document.addEventListener('touchmove', onDrag, { passive: false });

function onDrag(e) {
    if (!isDragging) return;
    hasMoved = true;
    const p = e.touches ? e.touches[0] : e;
    const x = Math.max(0, Math.min(window.innerWidth  - fab.offsetWidth,  p.clientX - ox));
    const y = Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, p.clientY - oy));
    fab.style.left = x + 'px';
    fab.style.top  = y + 'px';
    e.preventDefault();
}

document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    if (hasMoved) {
        localStorage.setItem('fab-x', parseInt(fab.style.left));
        localStorage.setItem('fab-y', parseInt(fab.style.top));
    } else {
        sidebarL.classList.contains('open') ? closeDrawer() : openDrawer();
    }
}

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
    goalSettings[mu] = Math.max(0, goalSettings[mu] + delta);
    el.textContent = goalSettings[mu];
}
// ====== 手機板 P1 切換 ======

document.querySelectorAll('.p1-mob-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const idx = btn.dataset.idx;
        // 同步兩張卡裡所有的切換按鈕狀態
        document.querySelectorAll('.p1-mob-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.idx === idx);
        });
        document.querySelector('.p1-top').classList.toggle('mob-act', idx === '1');
    });
});

// ====== 初始化 ======

// 頁面載入後依序執行：填充月份選單 → 填充年份選單 → 統計 → 月曆 → 詳情
buildMonthOpts(); buildYearOpts(); renderStats(); renderCal(); renderDetail();