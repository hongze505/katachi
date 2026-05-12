/*
utils.js - 訓練邏輯層（Core Logic Layer）

用途：
此模組負責整個系統的「資料轉換 + 商業邏輯計算」，不包含 UI 操作，
提供 Page 1 / Page 2 / Page 3 所需的統計、分析與狀態判斷函式。
*/

// ====== 工具函式 ======

// dk(y, m, d): 數字年月日 → 'YYYY-MM-DD' 字串（m 為 0-based）
function dk(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
// pk(k): 'YYYY-MM-DD' → { y, m(0-based), d } 物件
function pk(k) { const [y, m, d] = k.split('-').map(Number); return { y, m: m - 1, d }; }
// isFut(k): 日期 key 是否晚於 TODAY
function isFut(k) { return k > TODAY; }

// dayStatus(k): 計算指定日期的訓練狀態
// 回傳值：'done'(全組完成) / 'partial'(部分完成) / 'planned'(未來已安排) / 'missed'(過去未完成) / null(未安排)
function dayStatus(k) {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (k.startsWith(prefix) && typeof SERVER_TD !== 'undefined') {
        const data = SERVER_TD[k];
        if (!data || !data.length) return null;
        const total = data.reduce((sum, it) => sum + it.d.length, 0);
        const done = data.reduce((sum, it) => sum + it.d.filter(Boolean).length, 0);
        if (done === 0) return k >= TODAY ? 'planned' : 'missed';
        if (done === total) return 'done';
        return 'partial';
    }
    const data = td[k]; if (!data || !data.length) return null;
    const all = data.flatMap(e => e.d), n = all.filter(Boolean).length;
    if (n === 0) return isFut(k) ? 'planned' : 'missed';
    if (n === all.length) return 'done';
    return 'partial';
}
// ====== 業務邏輯：PR / RM 計算 ======

// getPR(ex): 全時段最高重量，回傳 { val, key }
function getPR(ex) { let best = 0, bk = ''; for (const k in td) td[k].forEach(i => { if (i.ex === ex && i.w > best) { best = i.w; bk = k; } }); return { val: best, key: bk }; }
// getRM(ex): 全時段最高次數，回傳 { reps, weight }（weight 為達到最高次數時的重量）
function getRM(ex) { let br = 0, bw = 0; for (const k in td) td[k].forEach(i => { if (i.ex === ex && i.r > br) { br = i.r; bw = i.w; } }); return { reps: br, weight: bw }; }
// isNewPR(ex): 今日最高重量是否超過歷史紀錄（用於顯示 NEW PR 標籤）
function isNewPR(ex) {
    let prevBest = 0;
    for (const k in td) { if (k === TODAY) continue; td[k].forEach(i => { if (i.ex === ex) prevBest = Math.max(prevBest, i.w); }); }
    const todayBest = Math.max(0, ...(td[TODAY] || []).filter(i => i.ex === ex).map(i => i.w));
    return todayBest > prevBest && todayBest > 0;
}

// ====== 完成率 / 活躍度統計 ======

// calcStats(y, m): 統計指定年月已安排日的完成狀況（0-based month）
// planned = 該月總已安排天數（含過去與未來）
// done    = 過去已全部完成的天數
// miss    = 過去有安排但未完成的天數（dayStatus === 'missed'）
// upcoming= 未來已安排天數（dayStatus === 'planned'）
// pct     = done ÷ 過去已安排 × 100（不把未到日期列入分母）
function calcStats(y, m) {
    let pastScheduled = 0, done = 0, partial = 0, miss = 0, upcoming = 0;
    for (const k in td) {
        const { y: ky, m: km } = pk(k);
        if (ky !== y || km !== m) continue;
        const s = dayStatus(k);
        if (s === 'done')         { pastScheduled++; done++; }
        else if (s === 'partial') { pastScheduled++; partial++; }
        else if (s === 'missed')  { pastScheduled++; miss++; }
        else if (s === 'planned') { upcoming++; }
    }
    const planned = pastScheduled + upcoming;
    return { planned, done, partial, miss, upcoming, pct: pastScheduled ? Math.round(done / pastScheduled * 100) : 0 };
}

// calcActivity: 計算下次安排距今、上次訓練距今、本月週均訓練天數
function calcActivity() {
    const { y: ty, m: tm, d: td_ } = pk(TODAY);
    const twToday = new Date(ty, tm, td_);
    const allK = Object.keys(td).filter(k => !isFut(k)).sort();

    // 本月週均訓練天數（本月已完成天數 ÷ 本月已過週數）
    const weeksElapsed = Math.max(1, (twToday - new Date(ty, tm, 1)) / (7 * 864e5));
    const monthDone = allK.filter(k => {
        const { y: ky, m: km } = pk(k);
        const s = dayStatus(k);
        return ky === ty && km === tm && (s === 'done' || s === 'partial');
    }).length;
    const monthAvg = (monthDone / weeksElapsed).toFixed(1);

    // 上次訓練距今（天）：排除今日，只看今日之前的訓練
    const doneDays = allK.filter(k => k < TODAY && (dayStatus(k) === 'done' || dayStatus(k) === 'partial'));
    const lastK = doneDays[doneDays.length - 1];
    let lastAgo = null;
    if (lastK) { const { y: ly, m: lm, d: ld } = pk(lastK); lastAgo = Math.round((twToday - new Date(ly, lm, ld)) / 864e5); }

    // 下次安排距今（天）
    const futureK = Object.keys(td).filter(k => k > TODAY && dayStatus(k) === 'planned').sort();
    let nextIn = null;
    if (futureK.length) { const { y: ny, m: nm, d: nd } = pk(futureK[0]); nextIn = Math.round((new Date(ny, nm, nd) - twToday) / 864e5); }

    return { monthAvg, lastAgo, nextIn };
}

// ====== 共用 helpers ======

// getDataMonths(): 從 td 提取所有出現的 'YYYY-MM' 字串，升序排列
// 供 P2 月份選單和 P3 月份選單共用，避免重複邏輯
function getDataMonths() {
    return [...new Set(Object.keys(td).map(k => k.slice(0, 7)))].sort();
}

// setActive: 移除同群元素 active，對 el 加上 active
function setActive(sel, el) { document.querySelectorAll(sel).forEach(x => x.classList.remove('active')); el.classList.add('active'); }
// closeModal: 關閉指定 id 的 modal（移除 .open）
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
// primaryGroup: 取動作佔比最高的群（主計群），用於目標達成率計算
function primaryGroup(ex) {
    const mu = MU[ex];
    if (!mu) return null;
    return Object.entries(mu).sort((a, b) => b[1] - a[1])[0][0];
}

// exGroups: 回傳動作所有肌群佔比（依佔比降序，用於詳情面板標籤）
function exGroups(ex) {
    const mu = MU[ex];
    if (!mu) return '—';
    return Object.entries(mu)
        .sort((a, b) => b[1] - a[1])
        .map(([g, p]) => `${g} ${p}%`)
        .join(' · ');
}