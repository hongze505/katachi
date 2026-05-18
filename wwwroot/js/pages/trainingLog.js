/*
trainingLog.js - 訓練日誌（Training Log & Calendar System）

用途：
此模組負責「訓練記錄頁（Page 1）」的所有互動與資料呈現，
包含月曆檢視、每日訓練詳情、PR/RM 顯示、統計面板，以及新增/編輯訓練流程。

主要功能：

1. 全頁渲染控制
   - renderAll()：同步更新月曆、詳情、統計、PR/RM 四大區塊

2. PR / RM 系統
   - PR（Personal Record）：單項動作最高重量紀錄
   - RM（Rep Max）：最大次數紀錄（含重量 × 次數）
   - 支援模式切換（pr / mr）
   - 即時顯示 NEW PR 標記

3. 統計面板（Stats）
   - 完成率（Completion Rate）
   - 訓練完成 / 計畫 / 遺漏統計
   - 活躍度分析（週次、平均、最長連續訓練 / 休息）

4. 月曆系統（Calendar）
   - 月視圖動態生成
   - 狀態標示（done / partial / planned / missed）
   - 今日與選取日期高亮
   - 支援前後月切換

5. 日期詳情面板（Detail View）
   - 顯示當日訓練列表
   - 組數完成進度
   - 狀態徽章（未安排 / 已安排 / 已完成等）
   - 點擊進入組數管理 Modal

6. 組數管理（Sets Modal）
   - 單組勾選完成狀態
   - 即時更新資料結構 td
   - 觸發全頁重繪（renderAll）

7. 新增訓練 Modal
   - 選擇動作（bench / squat / dead）
   - 設定重量、組數、次數
   - 初始化未完成組數資料
   - 即時寫入 td 資料結構

8. 資料來源與依賴
   - td：主要訓練紀錄資料（以日期為 key）
   - EX：動作名稱對照表
   - MU：肌群分類對照
   - TODAY / selDate / curMon：UI 狀態控制變數
   - getPR / getRM / isNewPR：統計工具函式（utils.js）

9. UI 更新策略
   - 所有變更最終統一呼叫 renderAll()
   - 確保月曆 / 詳情 / 統計 / PRMR 同步更新
   - Modal 採 overlay + click-outside 關閉

注意事項：
- td 為核心資料結構，所有操作皆為「即時修改 + 重繪」
- 月曆與詳情高度耦合（選日期即觸發 renderDetail）
- PR/RM 與統計依賴全域計算函式（避免重複計算）
- Modal 操作需注意 DOM state 與資料同步一致性
*/

// ====== PAGE 1 ======

// renderAll: 同步更新月曆、詳情、統計、PR/RM 四個區塊
function renderAll() { renderDetail(); renderCal(); renderStats(); renderPRMR(); }

// ====== PR / RM 卡片 ======
// PREX: 顯示在 PR/RM 卡片中的動作列表（槓鈴三大動作）
const PREX = ['bench-bar', 'squat-bar', 'row-bar'];
const TODAY_DATE = new Date();

// renderPRMR: 依 prmrMode 渲染最佳重量（PR）或最大次數（RM）列表
function renderPRMR() {
    document.getElementById('prmr-rows').innerHTML = PREX.map(ex => {
        if (prmrMode === 'pr') {
            const rec = (typeof SERVER_PR !== 'undefined') ? SERVER_PR.find(p => p.exKey === ex) : null;
            const val = rec ? rec.prWeight : (getPR(ex).val || '-');
            const np = isNewPR(ex);
            return `<div class="prmr-row"><span class="prmr-exname">${EX[ex]}</span><div class="prmr-vwrap">${np ? '<span class="pr-badge">NEW PR</span>' : ''}<span class="prmr-num">${val}</span><span class="prmr-unit">kg</span></div></div>`;
        } else {
            const rec = (typeof SERVER_RM !== 'undefined') ? SERVER_RM.find(p => p.exKey === ex) : null;
            const reps = rec ? rec.rmReps : (getRM(ex).reps || '-');
            const weight = rec ? rec.rmWeight : (getRM(ex).weight || '-');
            return `<div class="prmr-row"><span class="prmr-exname">${EX[ex]}</span><div class="prmr-vwrap"><span class="prmr-num">${weight}</span><span class="prmr-unit">kg</span><span class="prmr-x">x</span><span class="prmr-num sm">${reps}</span><span class="prmr-unit">下</span></div></div>`;
        }
    }).join('');
}
// PR ↔ RM 切換按鈕
document.querySelectorAll('[data-prmr]').forEach(b => { b.addEventListener('click', () => { setActive('[data-prmr]', b); prmrMode = b.dataset.prmr; renderPRMR(); }); });

// renderStats: 將 calcStats / calcActivity 結果寫入 DOM（函式定義在 utils.js）
// 依 curMon（目前月曆檢視月份）計算，切換月份時同步更新
function renderStats() {
    const y = curMon.getFullYear(), m = curMon.getMonth();
    const lbl = document.getElementById('cmp-sub-lbl');
    if (lbl) lbl.textContent = `完成率 · ${y}年 ${String(m + 1).padStart(2, '0')}月`;

    const isCurrentMonth = y === TODAY_DATE.getFullYear() && m === TODAY_DATE.getMonth();

    // Completion stats: calculate from live SERVER_TD for current month so deletions/additions reflect immediately
    const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
    if (isCurrentMonth && typeof SERVER_TD !== 'undefined') {
        let totalScheduled = 0, doneCount = 0, partialCount = 0, missedCount = 0, pendingCount = 0;
        Object.keys(SERVER_TD).filter(k => k.startsWith(ym)).forEach(k => {
            const items = SERVER_TD[k];
            if (!items || !items.length) return;
            const allD = items.flatMap(it => it.d);
            const doneSets = allD.filter(Boolean).length, totalSets = allD.length;
            totalScheduled++;
            if (k > TODAY) pendingCount++;
            else if (k === TODAY && doneSets === 0) pendingCount++;
            else if (totalSets > 0 && doneSets === totalSets) doneCount++;
            else if (doneSets > 0) partialCount++;
            else missedCount++;
        });
        const pastScheduled = doneCount + partialCount + missedCount;
        const pct = pastScheduled > 0 ? Math.round(doneCount / pastScheduled * 100) : 0;
        document.getElementById('cmp-num').textContent = pct;
        document.getElementById('cmp-bar').style.width = pct + '%';
        document.getElementById('cmp-frac').textContent = `${doneCount} / ${totalScheduled}`;
        document.getElementById('st-upcoming').textContent = pendingCount;
        document.getElementById('st-partial').textContent = partialCount;
        document.getElementById('st-miss').textContent = missedCount;
    } else {
        const { planned, done, partial, miss, upcoming, pct } = calcStats(y, m);
        document.getElementById('cmp-num').textContent = pct;
        document.getElementById('cmp-bar').style.width = pct + '%';
        document.getElementById('cmp-frac').textContent = `${done} / ${planned}`;
        document.getElementById('st-upcoming').textContent = upcoming;
        document.getElementById('st-partial').textContent = partial;
        document.getElementById('st-miss').textContent = miss;
    }

    // Activity stats: calculate from live data (SERVER_TD for current month, td for past months)
    const source = isCurrentMonth && typeof SERVER_TD !== 'undefined' ? SERVER_TD : td;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayD = isCurrentMonth ? TODAY_DATE.getDate() : daysInMonth;

    let totalSets = 0, trainingDayCount = 0, restDays = 0;
    for (let d = 1; d <= todayD; d++) {
        const k = `${ym}-${String(d).padStart(2, '0')}`;
        const items = source[k] || [];
        const doneSets = items.reduce((s, it) => s + it.d.filter(Boolean).length, 0);
        totalSets += doneSets;
        if (doneSets > 0) trainingDayCount++;
        else if (!isCurrentMonth || d < todayD) restDays++;
    }
    const monthAvg = Math.round(trainingDayCount / Math.max(1, (todayD - 1) / 7) * 10) / 10;

    document.getElementById('act-sets').textContent = totalSets;
    document.getElementById('act-rest').textContent = restDays;
    document.getElementById('act-avg').textContent = monthAvg;

    if (typeof SERVER_ACTIVITY !== 'undefined') {
        document.getElementById('act-streak').textContent = SERVER_ACTIVITY.weekStreak;
        const nextEl = document.getElementById('act-next'), nextUnit = document.getElementById('act-next-unit');

        // Recalculate daysUntilNext from SERVER_TD so in-session deletions are reflected
        let daysUntilNext = SERVER_ACTIVITY.daysUntilNext;
        if (typeof SERVER_TD !== 'undefined') {
            const todayYm2 = `${TODAY_DATE.getFullYear()}-${String(TODAY_DATE.getMonth() + 1).padStart(2, '0')}`;
            const curMonFutureKeys = Object.keys(SERVER_TD).filter(k => k > TODAY && k.startsWith(todayYm2) && (SERVER_TD[k] || []).length > 0).sort();
            if (curMonFutureKeys.length > 0) {
                const [fy, fm, fd] = curMonFutureKeys[0].split('-').map(Number);
                daysUntilNext = Math.round((new Date(fy, fm - 1, fd) - new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), TODAY_DATE.getDate())) / 86400000);
            } else {
                // Check if SERVER_ACTIVITY was pointing to a session in the current month (now deleted)
                const actDate = SERVER_ACTIVITY.daysUntilNext >= 0
                    ? new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), TODAY_DATE.getDate() + SERVER_ACTIVITY.daysUntilNext) : null;
                const actYm = actDate ? `${actDate.getFullYear()}-${String(actDate.getMonth() + 1).padStart(2, '0')}` : null;
                if (actYm === todayYm2) daysUntilNext = -1;
            }
        }

        if (daysUntilNext >= 0) { nextEl.textContent = daysUntilNext; nextEl.style.fontSize = ''; nextUnit.textContent = ' 天'; }
        else { nextEl.textContent = '暫無安排'; nextEl.style.fontSize = '27px'; nextUnit.textContent = ''; }
    }

    // daysSinceLast: always recalculate from SERVER_TD using TODAY's month, regardless of viewed month
    let daysSinceLast = typeof SERVER_ACTIVITY !== 'undefined' ? SERVER_ACTIVITY.daysSinceLast : -1;
    if (typeof SERVER_TD !== 'undefined') {
        const todayYm = `${TODAY_DATE.getFullYear()}-${String(TODAY_DATE.getMonth() + 1).padStart(2, '0')}`;
        daysSinceLast = -1;
        for (let d = TODAY_DATE.getDate(); d >= 1; d--) {
            const k = `${todayYm}-${String(d).padStart(2, '0')}`;
            if ((SERVER_TD[k] || []).some(it => it.d.some(Boolean))) { daysSinceLast = TODAY_DATE.getDate() - d; break; }
        }
        if (daysSinceLast < 0 && typeof SERVER_ACTIVITY !== 'undefined' && SERVER_ACTIVITY.daysSinceLast > 0)
            daysSinceLast = SERVER_ACTIVITY.daysSinceLast;
    }

    const lastEl = document.getElementById('act-last'), lastUnit = document.getElementById('act-last-unit');
    if (daysSinceLast === 0) { lastEl.textContent = '今日'; lastEl.style.fontSize = '27px'; lastUnit.textContent = ''; }
    else if (daysSinceLast > 0) { lastEl.textContent = daysSinceLast; lastEl.style.fontSize = ''; lastUnit.textContent = ' 天'; }
    else { lastEl.textContent = '—'; lastEl.style.fontSize = ''; lastUnit.textContent = ''; }
}

// 完成率 ↔ 活躍度切換：互斥顯示 cmp-view / act-view
document.querySelectorAll('[data-stats]').forEach(b => {
    b.addEventListener('click', () => {
        setActive('[data-stats]', b); statsMode = b.dataset.stats;
        document.getElementById('cmp-view').style.display = statsMode === 'completion' ? 'block' : 'none';
        document.getElementById('act-view').style.display = statsMode === 'activity' ? 'block' : 'none';
    });
});

// ====== 月曆 ======

// renderCal: 依 curMon 重繪月曆格子
// 每格依 dayStatus 加上對應狀態 class（done/partial/planned/missed）
// today 加上 .today，selDate 加上 .selected
function renderCal() {
    const y = curMon.getFullYear(), m = curMon.getMonth();
    document.getElementById('cal-mlbl').textContent = `${y}年 ${String(m + 1).padStart(2, '0')}月`;
    const cells = document.getElementById('cal-cells'); cells.innerHTML = '';

    // 月初星期幾 → 前置空白格
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) { const e = document.createElement('div'); e.className = 'cal-cell empty'; cells.appendChild(e); }

    // 本月每天格子
    for (let d = 1; d <= days; d++) {
        const k = dk(y, m, d), s = dayStatus(k);
        const cell = document.createElement('div');
        cell.className = 'cal-cell' + (s ? ' ' + s : '') + (k === TODAY ? ' today' : '') + (k === selDate ? ' selected' : '');
        cell.innerHTML = `<div class="cn">${d}</div>`;
        // 點擊格子：更新 selDate，重繪月曆（更新 selected 標示）和詳情面板
        cell.addEventListener('click', () => { selDate = k; renderCal(); renderDetail(); });
        cells.appendChild(cell);
    }

    // 補齊最後一列的空白格（trailing），與月初前置格外觀一致
    const trailing = (7 - (first + days) % 7) % 7;
    for (let i = 0; i < trailing; i++) { const e = document.createElement('div'); e.className = 'cal-cell empty'; cells.appendChild(e); }
}
// 上 / 下月導覽按鈕
const monthCache = new Set();

async function loadMonth(ym) {
    if (monthCache.has(ym)) return;
    monthCache.add(ym);
    Object.keys(td).forEach(k => { if (k.startsWith(ym)) delete td[k]; });
    const data = await fetch(`/TrainingLog/GetMonthData?month=${ym}`).then(r => r.json());
    Object.assign(td, data);
}
const CUR_YM = `${TODAY_DATE.getFullYear()}-${String(TODAY_DATE.getMonth() + 1).padStart(2, '0')}`;

document.getElementById('cal-prev').addEventListener('click', async () => {
    curMon = new Date(curMon.getFullYear(), curMon.getMonth() - 1, 1);
    const ym = `${curMon.getFullYear()}-${String(curMon.getMonth() + 1).padStart(2, '0')}`;
    if (ym !== CUR_YM) await loadMonth(ym);
    renderCal(); renderStats();
});
document.getElementById('cal-next').addEventListener('click', async () => {
    curMon = new Date(curMon.getFullYear(), curMon.getMonth() + 1, 1);
    const ym = `${curMon.getFullYear()}-${String(curMon.getMonth() + 1).padStart(2, '0')}`;
    if (ym !== CUR_YM) await loadMonth(ym);
    renderCal(); renderStats();
});

// ====== 日期詳情面板 ======

// renderDetail: 渲染 selDate 當天的狀態徽章與訓練項目列表
function renderDetail() {
    // 更新日期文字與狀態徽章
    const { y, m, d } = pk(selDate);
    document.getElementById('detail-date').textContent = `${y}.${String(m + 1).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    const curMonPrefix = `${TODAY_DATE.getFullYear()}-${String(TODAY_DATE.getMonth() + 1).padStart(2, '0')}`;
    const data = (selDate.startsWith(curMonPrefix) && typeof SERVER_TD !== 'undefined')
        ? (SERVER_TD[selDate] || [])
        : (td[selDate] || []);
    const s = dayStatus(selDate);
    const badge = document.getElementById('dbadge');
    // bmap: 狀態 → [顯示文字, CSS class]
    const bmap = { done: ['已完成', 'done'], partial: ['部分完成', 'partial'], planned: ['已安排', 'planned'], missed: ['未完成', 'missed'], null: ['未安排', 'none'] };
    let [txt, cls] = bmap[s] || bmap[null];
    if (s === 'planned' && selDate === TODAY) txt = '待完成';
    badge.textContent = txt; badge.className = 'dbadge ' + cls;

    const wrap = document.getElementById('ex-wrap');
    // 無訓練資料時顯示空狀態提示
    if (!data.length) { wrap.innerHTML = '<div class="detail-empty">尚未安排訓練，點下方按鈕新增</div>'; return; }

    // 逐一渲染訓練項目列（點擊可開啟 SETS modal）
    wrap.innerHTML = '';
    data.forEach((item, idx) => {
        const dc = item.d.filter(Boolean).length, all = item.d.length, fin = dc === all;
        const wLabel = NO_WEIGHT_EX.has(item.ex) ? '無重量' : BW_EX.has(item.ex) ? '自重' : `${item.w}kg`;
        const row = document.createElement('div');
        row.innerHTML = `<div class="ex-row"><div class="ex-check ${fin ? 'checked' : ''}">${fin ? 'v' : ''}</div><div class="ex-info"><div class="ex-name">${EX[item.ex]}</div><div class="ex-meta">${wLabel} x ${item.r}下 x ${item.s}組</div></div><span class="ex-muscle">${exGroups(item.ex)}</span><span class="ex-prog">${dc}/${all}組</span><span class="ex-arr">></span></div>`;
        row.querySelector('.ex-row').addEventListener('click', () => openSets(selDate, idx));
        wrap.appendChild(row);
    });
}

// ====== 組數詳情 Modal ======

let _setsDate = null, _setsIdx = null, _stagingD = null;

// renderSetsList: 依 _stagingD 重繪組數列表，勾選只更新暫存不寫入 td
function renderSetsList() {
    const curMonPrefix = `${TODAY_DATE.getFullYear()}-${String(TODAY_DATE.getMonth() + 1).padStart(2, '0')}`;
    const source = (_setsDate && _setsDate.startsWith(curMonPrefix) && typeof SERVER_TD !== 'undefined')
        ? SERVER_TD : td;
    const item = source[_setsDate][_setsIdx];
    const list = document.getElementById('sets-list'); list.innerHTML = '';
    _stagingD.forEach((dn, i) => {
        const row = document.createElement('div'); row.className = 'set-row';
        const wLabel = NO_WEIGHT_EX.has(item.ex) ? '無重量' : BW_EX.has(item.ex) ? '自重' : `${item.w}<span>kg</span>`;
        row.innerHTML = `<div class="set-num">組 ${i + 1}</div><div class="set-info">${wLabel} x ${item.r}<span>下</span></div><button class="set-chk ${dn ? 'done' : ''}" data-i="${i}">${dn ? 'v' : ''}</button>`;
        list.appendChild(row);
    });
    list.querySelectorAll('.set-chk').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = +btn.dataset.i;
            _stagingD[i] = _stagingD[i] ? 0 : 1;
            btn.classList.toggle('done', !!_stagingD[i]);
            btn.textContent = _stagingD[i] ? 'v' : '';
        });
    });
}

// openSets(dateKey, idx): 開啟指定日期第 idx 項訓練的組數 modal
function openSets(dateKey, idx) {
    _setsDate = dateKey; _setsIdx = idx;
    const curMonPrefix = `${TODAY_DATE.getFullYear()}-${String(TODAY_DATE.getMonth() + 1).padStart(2, '0')}`;
    const source = (dateKey.startsWith(curMonPrefix) && typeof SERVER_TD !== 'undefined')
        ? SERVER_TD : td;
    _stagingD = [...source[dateKey][idx].d];
    document.getElementById('sets-title').textContent = `${EX[source[dateKey][idx].ex]} 訓練組`;
    renderSetsList();
    document.getElementById('mo-sets').classList.add('open');
}
// 關閉按鈕 & 點擊遮罩關閉：丟棄暫存
document.getElementById('mo-sets-close').addEventListener('click', () => closeModal('mo-sets'));
document.getElementById('mo-sets').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('mo-sets'); });
// 全部完成：更新暫存並重繪，不寫入 td
document.getElementById('sets-complete-all').addEventListener('click', () => {
    if (_setsDate === null) return;
    _stagingD = _stagingD.map(() => 1);
    renderSetsList();
});
// 刪除項目（標題列）：確認後才刪除
document.getElementById('sets-delete').addEventListener('click', async () => {
    if (_setsDate === null) return;
    if (!confirm('確定要刪除此訓練項目？')) return;

    const now2 = new Date();
    const prefix = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = _setsDate.startsWith(prefix);
    const dayData = isCurrentMonth && typeof SERVER_TD !== 'undefined' && SERVER_TD[_setsDate]
        ? SERVER_TD[_setsDate]
        : (td[_setsDate] || []);
    const item = dayData[_setsIdx];

    if (item && item.itemId) {
        await fetch('/TrainingLog/DeleteItem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.itemId })
        });
        dayData.splice(_setsIdx, 1);
    } else {
        if (td[_setsDate]) {
            td[_setsDate].splice(_setsIdx, 1);
            if (!td[_setsDate].length) delete td[_setsDate];
        }
    }

    closeModal('mo-sets');
    renderAll();
});
// 確定：將暫存寫入 td 後關閉
document.getElementById('sets-confirm').addEventListener('click', async () => {
    if (_setsDate === null) return;

    const now2 = new Date();
    const prefix = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = _setsDate.startsWith(prefix);
    const dayData = isCurrentMonth && typeof SERVER_TD !== 'undefined' && SERVER_TD[_setsDate]
        ? SERVER_TD[_setsDate]
        : (td[_setsDate] || []);
    const item = dayData[_setsIdx];

    if (item.itemId) {
        for (let i = 0; i < _stagingD.length; i++) {
            await fetch('/TrainingLog/UpdateSet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.itemId, setIndex: i + 1, isDone: !!_stagingD[i] })
            });
        }
    }

    if (isCurrentMonth && typeof SERVER_TD !== 'undefined' && SERVER_TD[_setsDate])
        SERVER_TD[_setsDate][_setsIdx].d = [..._stagingD];
    else if (td[_setsDate])
        td[_setsDate][_setsIdx].d = [..._stagingD];
    closeModal('mo-sets');
    renderAll();
});

// ====== 新增訓練 Modal ======

// 開啟前重置所有輸入狀態
document.getElementById('add-btn').addEventListener('click', () => {
    document.getElementById('mo-add-date').textContent = selDate.replace(/-/g, '.');
    addEx = null; addS = 3; addR = 8;
    document.getElementById('sets-v').textContent = 3; document.getElementById('reps-v').textContent = 8;
    const inp = document.getElementById('winp'); inp.value = ''; inp.style.display = '';
    document.getElementById('w-mode-lbl').style.display = 'none';
    document.querySelectorAll('.ex-cell').forEach(c => c.classList.remove('sel'));
    document.getElementById('mo-add').classList.add('open');
});
// 關閉按鈕 & 點擊遮罩關閉
document.getElementById('mo-add-close').addEventListener('click', () => closeModal('mo-add'));
document.getElementById('mo-add').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('mo-add'); });

// 動作格點選：單選動作，更新 addEx，並依類型切換重量顯示
const BW_EX = new Set(['pushup', 'pullup', 'squat-bw', 'plank', 'hspu', 'glutebridge', 'dip']);
const NO_WEIGHT_EX = new Set(['rollout']);

function updateWeightDisplay(ex) {
    const inp = document.getElementById('winp');
    const lbl = document.getElementById('w-mode-lbl');
    if (NO_WEIGHT_EX.has(ex)) {
        inp.style.display = 'none'; lbl.style.display = 'block'; lbl.textContent = '無重量';
    } else if (BW_EX.has(ex)) {
        inp.style.display = 'none'; lbl.style.display = 'block'; lbl.textContent = '自重';
    } else {
        inp.style.display = ''; lbl.style.display = 'none';
    }
}

document.querySelectorAll('.ex-cell').forEach(c => {
    c.addEventListener('click', () => {
        document.querySelectorAll('.ex-cell').forEach(x => x.classList.remove('sel'));
        c.classList.add('sel');
        addEx = c.dataset.ex;
        updateWeightDisplay(addEx);
        if (!BW_EX.has(addEx) && !NO_WEIGHT_EX.has(addEx)) {
            fetch(`/TrainingLog/GetLastWeight?exKey=${addEx}`)
                .then(r => r.json())
                .then(data => { document.getElementById('winp').value = data.weight ?? ''; });
        }
    });
});

// +/- 步進按鈕：更新 addS（組數）或 addR（次數），下限為 1
document.querySelectorAll('.num-btn').forEach(b => {
    b.addEventListener('click', () => {
        const t = b.dataset.t, dir = b.dataset.d === '+' ? 1 : -1;
        if (t === 'sets') { addS = Math.max(1, addS + dir); document.getElementById('sets-v').textContent = addS; }
        else { addR = Math.max(1, addR + dir); document.getElementById('reps-v').textContent = addR; }
    });
});

// 確認加入項目：建立新訓練記錄，d[] 全部初始化為 0（未完成），觸發全頁重繪
document.getElementById('mo-add-sub').addEventListener('click', async () => {
    if (!addEx) { alert('請選擇訓練動作'); return; }
    const w = parseFloat(document.getElementById('winp').value) || 0;

    const now2 = new Date();
    const prefix = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = selDate.startsWith(prefix);

    if (isCurrentMonth) {
        const res = await fetch('/TrainingLog/AddItem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionDate: selDate, exKey: addEx, weightKg: w, sets: addS, reps: addR })
        });
        const data = await res.json();
        if (!SERVER_TD[selDate]) SERVER_TD[selDate] = [];
        SERVER_TD[selDate].push({ itemId: data.itemId, ex: addEx, w, s: addS, r: addR, d: Array(addS).fill(0) });
    } else {
        if (!td[selDate]) td[selDate] = [];
        td[selDate].push({ ex: addEx, w, s: addS, r: addR, d: Array(addS).fill(0) });
    }

    closeModal('mo-add');
    renderAll();
});