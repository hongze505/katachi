/*
muscleAnalysis.js - 肌群分析（Muscle Group Analytics）

主要功能：
1. getWeightedData(y, m) 加權計算各群完成組數（完成組數 × 佔比%），用於 SVG + 圓餅
2. getPrimaryData(y, m)  只計主計群（佔比最高）完成組數，用於目標達成率
3. updateSVG(colorMap)   依 colorMap（群 → 色碼）對 [data-muscle] 元素上色
4. buildP3()             一次渲染 Page 3 全部 UI（SVG / 圓餅 / 目標 / 建議）
                         - colorMap 依訓練量降序排色（最多 → 深橘棕，零訓練量 → 中性灰）
                         - colorMap 由 buildP3 統一計算，updateSVG / 圓餅 / 圖例 / 目標列共用
                         - 圓餅、圖例、目標列依 GROUPS 固定順序顯示（背→胸→核心→肩→手臂→腿→臀）
                         - async：所有月份資料皆由 /TrainingLog/GetP3Data 取得

資料來源：
- /TrainingLog/GetP3Data  各月加權量、主計組數、目標、未完成天數（server API）
- GROUPS                  7 大群 → data-muscle key 陣列（同時定義顯示固定順序）
- userGoals               群 → 月目標組數（當 API 無目標資料時的 fallback）
*/

// ====== PAGE 3 ======

let pieC = null;

// p3Sel: P3 當前選取的年月（0-based month），預設當月
let p3Sel = { y: new Date().getFullYear(), m: new Date().getMonth() };

// getWeightedData(y, m): 加權計算各群完成組數（完成組數 × 佔比%）
// 回傳 { '背': N, '胸': N, ... }，用於 SVG 熱力圖 + 圓餅圖
function getWeightedData(y, m) {
    const now = new Date();
    if (typeof SERVER_WEIGHTED_DATA !== 'undefined'
        && y === now.getFullYear() && m === now.getMonth()) {
        const g = {};
        Object.keys(GROUPS).forEach(grp => { g[grp] = 0; });
        SERVER_WEIGHTED_DATA.forEach(item => {
            if (g[item.groupKey] !== undefined) g[item.groupKey] = item.value;
        });
        return g;
    }
    const g = {};
    Object.keys(GROUPS).forEach(grp => { g[grp] = 0; });
    for (const k in td) {
        const { y: ky, m: km } = pk(k);
        if (ky !== y || km !== m) continue;
        td[k].forEach(it => {
            const mu = MU[it.ex];
            if (!mu) return;
            const done = it.d.filter(Boolean).length;
            Object.entries(mu).forEach(([grp, pct]) => {
                if (g[grp] !== undefined) g[grp] += done * pct / 100;
            });
        });
    }
    return g;
}

// getPrimaryData(y, m): 只計主計群完成組數（佔比最高的群）
// 回傳 { '背': N, '胸': N, ... }，用於目標達成率
function getPrimaryData(y, m) {
    const now = new Date();
    if (typeof SERVER_PRIMARY_DATA !== 'undefined'
        && y === now.getFullYear() && m === now.getMonth()) {
        const g = {};
        Object.keys(GROUPS).forEach(grp => { g[grp] = 0; });
        SERVER_PRIMARY_DATA.forEach(item => {
            if (g[item.groupKey] !== undefined) g[item.groupKey] = item.value;
        });
        return g;
    }
    const g = {};
    Object.keys(GROUPS).forEach(grp => { g[grp] = 0; });
    for (const k in td) {
        const { y: ky, m: km } = pk(k);
        if (ky !== y || km !== m) continue;
        td[k].forEach(it => {
            const grp = primaryGroup(it.ex);
            if (!grp || g[grp] === undefined) return;
            g[grp] += it.d.filter(Boolean).length;
        });
    }
    return g;
}

// updateSVG(colorMap): 依 colorMap（群 → 色碼）對各肌肉 SVG 元素上色
// 顏色由 buildP3() 統一計算後傳入，確保 SVG 與圖表完全一致
function updateSVG(colorMap) {
    // 全部重置為中性底色
    document.querySelectorAll('[data-muscle]').forEach(el => {
        el.setAttribute('fill', '#e6e3de');
    });
    // 依群對應顏色上色
    Object.entries(GROUPS).forEach(([grp, muscles]) => {
        const col = colorMap[grp] || '#e6e3de';
        muscles.forEach(mu => {
            document.querySelectorAll(`[data-muscle="${mu}"]`).forEach(el => {
                el.setAttribute('fill', col);
            });
        });
    });
}

// buildP3: 渲染 Page 3 所有內容
// 顏色邏輯：ranked 依訓練量降序排色建立 colorMap（最多 → 深橘棕，零訓練量 → 中性灰）
// 顯示順序：圓餅 / 圖例 / 目標列統一依 GROUPS 固定順序，colorMap 由群名取色保持一致
async function buildP3() {
    const { y, m } = p3Sel;

    let grpData, goalData, goalTargets, miss;

    const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
    const data = await fetch(`/TrainingLog/GetMuscleAnalysis?month=${monthStr}`).then(r => r.json());
    grpData = {}; Object.keys(GROUPS).forEach(grp => { grpData[grp] = 0; });
    data.weighted.forEach(item => { if (grpData[item.groupKey] !== undefined) grpData[item.groupKey] = item.value; });
    goalData = {}; Object.keys(GROUPS).forEach(grp => { goalData[grp] = 0; });
    data.primary.forEach(item => { if (goalData[item.groupKey] !== undefined) goalData[item.groupKey] = item.value; });
    goalTargets = {};
    data.goals.forEach(g => { goalTargets[g.groupKey] = g.target; });
    if (!Object.keys(goalTargets).length) goalTargets = userGoals;
    miss = data.missed;

    const total = Object.values(grpData).reduce((a, b) => a + b, 0);
    const safeTotal = total || 1;
    if (total === 0) {
        updateSVG({});
        if (pieC) { pieC.destroy(); pieC = null; }
    }

    // ranked 僅用於建立 colorMap（訓練量最多 → 最深色），不控制顯示順序
    const blueScale = ['#a86545', '#c17f5a', '#d49472', '#e3ae90', '#edc4aa', '#f4d6c2', '#fae8da'];
    const ranked = Object.entries(grpData)
        .map(([g, v]) => ({ g, v, pct: Math.round(v / safeTotal * 100) }))
        .sort((a, b) => b.v - a.v);
    let blueIdx = 0;
    const colorMap = {};
    ranked.forEach(({ g, v }) => { colorMap[g] = v > 0 ? blueScale[blueIdx++] : '#e6e3de'; });

    const lbl = document.getElementById('p3-month-label');
    if (lbl) lbl.textContent = `訓練分布圖 · ${y}年 ${String(m + 1).padStart(2, '0')}月`;

    // 1. SVG 熱力圖（colorMap 與圖表完全同步）
    updateSVG(colorMap);

    // 2. 圓餅圖（GROUPS 固定順序，顏色由 colorMap 取）
    const dispGrps = Object.keys(GROUPS);
    const dispVals = dispGrps.map(g => grpData[g] || 0);
    const dispCols = dispGrps.map(g => colorMap[g]);
    if (pieC) pieC.destroy();
    if (total > 0) {
        pieC = new Chart(document.getElementById('pie-chart').getContext('2d'), {
            type: 'doughnut',
            data: { labels: dispGrps, datasets: [{ data: dispVals, backgroundColor: dispCols, borderWidth: 0, hoverOffset: 6 }] },
            options: {
                responsive: true,
                cutout: '62%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = Math.round(ctx.parsed / safeTotal * 100);
                                return ` ${ctx.label}  ${pct}%`;
                            }
                        }
                    }
                }
            },
        });
    } else {
        pieC = null;
    }

    // 3. 圓餅圖右側圖例列表（GROUPS 固定順序）
    const pl = document.getElementById('pie-leg');
    pl.innerHTML = '';
    Object.keys(GROUPS).forEach(g => {
        const pct = Math.round((grpData[g] || 0) / safeTotal * 100);
        pl.innerHTML += `<div class="pie-leg-item">
            <div class="pie-leg-dot" style="background:${colorMap[g]}"></div>
            <div class="pie-leg-name">${g}</div>
            <div class="pie-leg-bar"><div class="pie-leg-fill" style="width:${pct}%;background:${colorMap[g]}"></div></div>
            <div class="pie-leg-pct">${pct}%</div>
        </div>`;
    });

    // 4. 目標達成率（GROUPS 固定順序；以主計群組數計算）
    const gr = document.getElementById('goal-rows');
    gr.innerHTML = '';
    Object.keys(GROUPS)
        .map(grp => ({ grp, goal: goalTargets[grp] || 0, actual: goalData[grp] || 0 }))
        .forEach(({ grp, goal, actual }) => {
            const pct = Math.min(100, Math.round(actual / goal * 100));
            const col = colorMap[grp] || '#e6e3de';
            const tag = pct >= 100
                ? `<span style="color:var(--accent);font-size:11px;font-family:'DM Mono',monospace">達標</span>`
                : pct < 50
                    ? `<span style="color:var(--danger);font-size:11px;font-family:'DM Mono',monospace">需加強</span>`
                    : '';
            gr.innerHTML += `<div class="goal-row">
            <div class="goal-top">
                <div class="goal-name">${grp}</div>
                <div style="display:flex;align-items:center;gap:8px">${tag}<div class="goal-nums">${actual}/${goal} 組 · ${pct}%</div></div>
            </div>
            <div class="goal-bar"><div class="goal-fill" style="width:${pct}%;background:${col}"></div></div>
        </div>`;
        });

    // 5. 訓練建議（依完成率升序排列，不足 50% 才顯示）
    const SUGGEST_EX = {
        '背': '槓鈴划船或引體向上', '胸': '槓鈴臥推或伏地挺身',
        '核心': '棒式或滾輪', '肩': '槓鈴肩推或啞鈴側平舉',
        '手臂': '槓鈴彎舉或雙槓撐體', '腿': '槓鈴深蹲或腿推機',
        '臀': '槓鈴臀推或臀橋',
    };
    const sl = document.getElementById('sug-list');
    sl.innerHTML = '';
    const sugs = [];
    Object.entries(goalTargets).forEach(([grp, goal]) => {
        const actual = goalData[grp] || 0, pct = actual / goal * 100;
        const grpN = (grp === '核心' || grp === '手臂') ? grp : `${grp}部`;
        if (pct < 50)
            sugs.push({ pct, i: '⚠️', t: `${grpN}訓練不足（${actual}/${goal} 組），建議本週加入：${SUGGEST_EX[grp]} × 3 組` });
        else if (pct >= 100)
            sugs.push({ pct, i: '✅', t: `${grpN}目標達成（${actual}/${goal} 組），可維持或適度提高目標。` });
    });
    sugs.sort((a, b) => a.pct - b.pct);
    if (miss > 2) sugs.push({ i: '📅', t: `本月有 ${miss} 天訓練未完成，建議降低計畫強度或增加彈性休息日。` });
    sugs.forEach(s => {
        sl.innerHTML += `<div class="sug-item"><span class="si">${s.i}</span><span>${s.t}</span></div>`;
    });
}

// 正面 / 背面切換
document.querySelectorAll('.body-tog-btn').forEach(b => {
    b.addEventListener('click', () => {
        setActive('.body-tog-btn', b);
        const side = b.dataset.side;
        document.getElementById('fig-front').classList.toggle('active', side === 'front');
        document.getElementById('fig-back').classList.toggle('active', side === 'back');
    });
});

// P3 月份選單：size="10" 顯示 10 列可捲動列表，往上捲查看歷史月份
// 內部 p3Sel.m 仍為 0-based，在讀取 / 寫入選單值時做 ±1 轉換
(function () {
    const sel = document.getElementById('p3-msel');
    if (!sel) return;

    const now = new Date();
    const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const months = typeof SERVER_MONTHS !== 'undefined' ? [...SERVER_MONTHS] : getDataMonths();
    if (!months.includes(nowYM)) months.push(nowYM);
    months.sort().reverse();

    months.forEach(ms => {
        const [y, m] = ms.split('-').map(Number);
        const opt = document.createElement('option');
        opt.value = ms;
        opt.textContent = `${y}年 ${String(m).padStart(2, '0')}月`;
        sel.appendChild(opt);
    });

    sel.value = months.includes(nowYM) ? nowYM : months[0];

    sel.addEventListener('change', () => {
        const [y, m] = sel.value.split('-').map(Number);
        p3Sel = { y, m: m - 1 };
        buildP3();
    });

    const [iy, im] = sel.value.split('-').map(Number);
    p3Sel = { y: iy, m: im - 1 };
})();