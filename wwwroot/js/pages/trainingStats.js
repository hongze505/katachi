/* 
trainingStats.js - 訓練統計（Training Statistics Dashboard）

用途：
此模組負責「訓練數據分析頁（Page 2）」的所有視覺化與資料計算，
包含月/年比較圖表、訓練指標切換、以及個人紀錄統計摘要。

主要功能：

1. 時間區間控制
   - 月 / 年 檢視切換（p2period）
   - 左右對比月份或年度資料
   - 年份選單動態生成（buildYearOpts）

2. 指標切換
   - 最高重量（weight）
   - 最大次數（reps）
   - 總訓練量（volume）

3. 動作類型分析
   - 動態顯示當前期間有資料的所有動作（EX 中所有 key）

4. 數據處理
   - getMonData()：取得單月每日訓練數據
   - getYrData()：取得年度每月最佳數據

5. 圖表系統（Chart.js）
   - 左右雙折線圖對比
   - 自動計算 Y 軸範圍
   - 動態重建避免記憶體洩漏

6. 統計摘要區（Summary Grid）
   - 當期最高值
   - 與前期差異（百分比）
   - 歷史 PR（Personal Record）

7. 互動控制
   - 月份選單（動態生成，月檢視用）
   - 年份選單（動態生成，年檢視用）
   - 指標切換（segmented control）
   - 動作切換（select）

依賴：
- Chart.js（圖表渲染）
- 全域資料：td（訓練紀錄資料）
- 全域常數：EX（動作名稱映射）
- 全域函數：getPR()

注意事項：
- 圖表實例需 destroy 後再重建（避免 memory leak）
- 月份/年度資料需動態過濾空值日期
- UI 更新依賴 buildCharts() 作為統一入口
- 月/年選單切換時互相隱藏，避免同時顯示
*/

// ====== PAGE 2 ======

// buildYearOpts: 從 td 資料動態填充年份選單（p2-ly / p2-ry），預設左=倒數第二年、右=最新年
// 年份由 td 的 key 前4碼去重後升序排列，初始化後綁定 change 事件同步全域 p2ly / p2ry
function buildYearOpts() {
    const years = typeof SERVER_YEARS !== 'undefined'
        ? SERVER_YEARS.map(String).reverse()
        : [...new Set(Object.keys(td).map(k => k.slice(0, 4)))].sort();
    ['p2-ly', 'p2-ry'].forEach((id, i) => {
        const sel = document.getElementById(id); sel.innerHTML = '';
        years.forEach(yr => {
            const o = document.createElement('option');
            o.value = yr; o.textContent = `${yr}年`;
            sel.appendChild(o);
        });
        const last = years[years.length - 1];
        const prev = years.length > 1 ? years[years.length - 2] : last;
        sel.value = i === 0 ? prev : last;
    });
    // 初始化全域狀態變數以與選單同步
    p2ly = document.getElementById('p2-ly').value;
    p2ry = document.getElementById('p2-ry').value;
    document.getElementById('p2-ly').addEventListener('change', e => { p2ly = e.target.value; buildCharts(); });
    document.getElementById('p2-ry').addEventListener('change', e => { p2ry = e.target.value; buildCharts(); });
}

// buildMonthOpts: 從 td 資料動態填充月份選單（p2-lm / p2-rm），預設左=倒數第二月、右=最新月
function buildMonthOpts() {
    const months = (typeof SERVER_MONTHS !== 'undefined' ? SERVER_MONTHS : getDataMonths()).slice();
    ['p2-lm', 'p2-rm'].forEach((id, i) => {
        const sel = document.getElementById(id); sel.innerHTML = '';
        months.forEach(ms => {
            const [y, m] = ms.split('-').map(Number);
            const o = document.createElement('option');
            o.value = ms;
            o.textContent = `${y}年 ${String(m).padStart(2, '0')}月`;
            sel.appendChild(o);
        });
        const last = months[0];
        const prev = months.length > 1 ? months[1] : last;
        sel.value = i === 0 ? prev : last;
    });
    // 初始化全域狀態變數以與選單同步
    p2lm = document.getElementById('p2-lm').value;
    p2rm = document.getElementById('p2-rm').value;
    document.getElementById('p2-lm').addEventListener('change', e => { p2lm = e.target.value; buildCharts(); });
    document.getElementById('p2-rm').addEventListener('change', e => { p2rm = e.target.value; buildCharts(); });
}

// getMonData(ms, ex, metric): 取得指定月份(YYYY-MM)、動作、指標的每日數據
// metric: 'weight'(最高重量) / 'reps'(最高次數) / 'volume'(總訓練量=重量×次數×組數)
// 回傳 { labels: ['M/D'...], vals: [數值...] }，只包含有訓練資料的日期
function getMonData(ms, ex, metric) {
    const [y, m] = ms.split('-').map(Number), days = new Date(y, m, 0).getDate();
    const labels = [], vals = [];
    for (let d = 1; d <= days; d++) {
        const k = `${ms}-${String(d).padStart(2, '0')}`; if (!td[k]) continue;
        const items = td[k].filter(i => i.ex === ex); if (!items.length) continue;
        labels.push(`${m}/${d}`); let v = 0;
        items.forEach(it => { if (metric === 'weight') v = Math.max(v, it.w); else if (metric === 'reps') v = Math.max(v, it.r); else v += it.w * it.r * it.s; });
        vals.push(v);
    }
    return { labels, vals };
}

// getYrData(yr, ex, metric): 取得指定年份、動作、指標的每月最佳值
// 回傳 { labels: ['N月'...], vals: [數值...] }，只包含有資料的月份
function getYrData(yr, ex, metric) {
    const labels = [], vals = [];
    for (let mo = 1; mo <= 12; mo++) {
        const ms = `${yr}-${String(mo).padStart(2, '0')}`, days = new Date(yr, mo, 0).getDate();
        let best = 0;
        for (let d = 1; d <= days; d++) { const k = `${ms}-${String(d).padStart(2, '0')}`; if (!td[k]) continue; td[k].filter(i => i.ex === ex).forEach(it => { if (metric === 'weight') best = Math.max(best, it.w); else if (metric === 'reps') best = Math.max(best, it.r); else best += it.w * it.r * it.s; }); }
        if (best > 0) { labels.push(`${mo}月`); vals.push(best); }
    }
    return { labels, vals };
}

const EQ_GROUPS = {
    '槓鈴': ['row-bar', 'bench-bar', 'rollout', 'ohp-bar', 'curl-bar', 'squat-bar', 'hipthrust-bar'],
    '啞鈴': ['row-db', 'bench-db', 'sidebend', 'lateral-db', 'curl-db', 'squat-db', 'hipthrust-db'],
    '徒手': ['pullup', 'pushup', 'plank', 'hspu', 'dip', 'squat-bw', 'glutebridge'],
    '機械': ['lat', 'chestpress', 'crunch', 'shoulderpress', 'curl-mach', 'legpress', 'abduction'],
};

// buildP2Summary: 依器材分組（槓鈴/啞鈴/徒手/機械）渲染摘要對比表
async function buildP2Summary() {
    const formulaMap = {
        weight: '當期最高重量　歷史最高即為個人 PR',
        rm:     '估算 1RM ＝ 重量 × ( 1 ＋ 次數 ÷ 30 )　／　徒手動作取最大次數',
        volume: '有重量：重量 × 次數 × 組數　／　徒手動作：次數 × 組數',
    };
    const formulaEl = document.getElementById('p2-sum-formula');
    if (formulaEl) formulaEl.textContent = formulaMap[p2metric] || '';

    const left = p2period === 'month' ? p2lm : p2ly;
    const right = p2period === 'month' ? p2rm : p2ry;
    const grid = document.getElementById('p2-sum-grid'); grid.innerHTML = '';

    const data = await fetch(`/TrainingLog/GetSummary?left=${left}&right=${right}&metric=${p2metric}&mode=${p2period}`).then(r => r.json());
    const dataMap = {};
    data.forEach(item => { dataMap[item.exKey] = item; });

    const bwKeys = new Set(['pushup', 'pullup', 'squat-bw', 'plank', 'hspu', 'glutebridge', 'dip', 'rollout']);
    const lbl = p2period === 'month' ? { l: '對比月', r: '主月' } : { l: '對比年', r: '主年' };

    function getUnit(ex) {
        if (p2metric === 'weight') return bwKeys.has(ex) ? '' : 'kg';
        if (p2metric === 'rm') return bwKeys.has(ex) ? '次' : 'kg';
        return bwKeys.has(ex) ? '下' : 'kg';
    }
    function fmt(n, unit) {
        return n > 0 ? `${n}${unit ? `<span class="p2-eq-unit"> ${unit}</span>` : ''}` : '-';
    }

    Object.entries(EQ_GROUPS).forEach(([eqName, exKeys]) => {
        const rows = [];
        exKeys.forEach(ex => {
            if (p2metric === 'weight' && bwKeys.has(ex)) return;
            const item = dataMap[ex];
            if (!item || (!item.curMax && !item.prevMax)) return;
            const cur = item.curMax ?? 0, prev = item.prevMax ?? 0, pr = item.prMax ?? 0;
            const diff = cur - prev, pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : null;
            const unit = getUnit(ex);
            const trend = pct === null ? '<span class="p2-eq-neutral">-</span>'
                : diff > 0 ? `<span class="arrow-up">▲${pct}%</span>`
                : diff < 0 ? `<span class="arrow-dn">▼${Math.abs(pct)}%</span>`
                : `<span class="p2-eq-neutral">-</span>`;
            rows.push(`<div class="p2-eq-row"><span class="p2-eq-name">${EX[ex] || ex}</span><span class="p2-eq-prev">${fmt(prev, unit)}</span><span class="p2-eq-trend">${trend}</span><span class="p2-eq-cur">${fmt(cur, unit)}</span><span class="p2-eq-pr">${fmt(pr, unit)}</span></div>`);
        });
        if (!rows.length) return;
        grid.innerHTML += `<div class="p2-eq-group"><div class="p2-eq-header">${eqName}</div><div class="p2-eq-col-hdr"><span></span><span>${lbl.l}</span><span></span><span>${lbl.r}</span><span>歷史最高</span></div>${rows.join('')}</div>`;
    });
}

// cL / cR: Chart.js 實例（需 destroy 後才能重建，避免記憶體洩漏）
let cL = null, cR = null;

// buildCharts: 依當前 p2period / p2metric / p2ex 重建左右折線圖
// Y 軸範圍由兩圖資料共同計算，確保視覺上可比較
async function buildCharts() {
    const exN = EX[p2ex], mL = { weight: '最高重量', rm: '最大重複', volume: '總訓練量' }[p2metric];
    let dL, dR;
    if (p2period === 'month') {
        [dL, dR] = await Promise.all([
            fetch(`/TrainingLog/GetMonData?month=${p2lm}&exKey=${p2ex}&metric=${p2metric}`).then(r => r.json()),
            fetch(`/TrainingLog/GetMonData?month=${p2rm}&exKey=${p2ex}&metric=${p2metric}`).then(r => r.json())
        ]);
        document.getElementById('p2-lt').textContent = `對比月 · ${exN} ${mL}`;
        document.getElementById('p2-rt').textContent = `主月 · ${exN} ${mL}`;
        document.getElementById('p2-lm').style.display = ''; document.getElementById('p2-rm').style.display = '';
        document.getElementById('p2-ly').style.display = 'none'; document.getElementById('p2-ry').style.display = 'none';
    } else {
        [dL, dR] = await Promise.all([
            fetch(`/TrainingLog/GetYrData?year=${p2ly}&exKey=${p2ex}&metric=${p2metric}`).then(r => r.json()),
            fetch(`/TrainingLog/GetYrData?year=${p2ry}&exKey=${p2ex}&metric=${p2metric}`).then(r => r.json())
        ]);
        document.getElementById('p2-lt').textContent = `對比年 · ${exN} ${mL}`;
        document.getElementById('p2-rt').textContent = `主年 · ${exN} ${mL}`;
        document.getElementById('p2-lm').style.display = 'none'; document.getElementById('p2-rm').style.display = 'none';
        document.getElementById('p2-ly').style.display = ''; document.getElementById('p2-ry').style.display = '';
    }
    const all = [...dL.vals, ...dR.vals];
    const minY = all.length ? Math.floor(Math.min(...all) * .88) : 0;
    const maxY = all.length ? Math.ceil(Math.max(...all) * 1.06) : 100;
    const mkC = (labels, vals, col) => ({
        type: 'line', data: { labels, datasets: [{ data: vals, borderColor: col, backgroundColor: col + '18', borderWidth: 2.5, pointBackgroundColor: col, pointRadius: 5, tension: .35, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#aaaaaa', font: { family: 'Noto Sans JP', size: 11 } }, grid: { color: '#e6e3de' } }, y: { min: minY, max: maxY, ticks: { color: '#aaaaaa', font: { family: 'Noto Sans JP', size: 11 } }, grid: { color: '#e6e3de' } } } }
    });
    if (cL) cL.destroy(); if (cR) cR.destroy();
    cL = new Chart(document.getElementById('chart-l').getContext('2d'), mkC(dL.labels, dL.vals, '#888888'));
    cR = new Chart(document.getElementById('chart-r').getContext('2d'), mkC(dR.labels, dR.vals, '#181818'));
    await buildP2Summary();
}
// 月/年切換、指標切換、動作切換 → 重建圖表
document.getElementById('ctrl-period').querySelectorAll('.seg-btn').forEach(b => { b.addEventListener('click', () => { setActive('#ctrl-period .seg-btn', b); p2period = b.dataset.v; buildCharts(); }); });
document.getElementById('ctrl-metric').querySelectorAll('.seg-btn').forEach(b => { b.addEventListener('click', () => { setActive('#ctrl-metric .seg-btn', b); p2metric = b.dataset.v; buildCharts(); }); });
document.getElementById('p2-ex').addEventListener('change', e => { p2ex = e.target.value; buildCharts(); });