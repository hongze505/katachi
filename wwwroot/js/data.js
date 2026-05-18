/*
data.js - 訓練資料（Data Layer / Static Dictionary & Seed Data）

用途：
此檔案為整個訓練系統的「資料來源」，負責提供：
- 動作與中文名稱對照
- 動作對應肌群分類（多對多）
- 人體 SVG 肌群映射（7 大群 A–G）
- 使用者目標設定
- 訓練紀錄資料（time-series dataset）

注意：
- 肌群顏色不再使用固定色表（MC），改由 buildP3() 依佔比排名動態指派藍色階

此層不包含任何 UI 邏輯，只提供純資料結構。
*/

// ====== 靜態對照表 ======

// EX: 動作 key → 中文名稱（用於 UI 顯示）
// 依 7 大群分類：背 / 胸 / 核心 / 肩 / 手臂 / 腿 / 臀，每群 4 種器材
const EX = {
    // 背
    'row-bar':       '槓鈴划船',
    'row-db':        '單手啞鈴划船',
    'pullup':        '引體向上',
    'lat':           '滑輪下拉',
    // 胸
    'bench-bar':     '槓鈴臥推',
    'bench-db':      '啞鈴臥推',
    'pushup':        '伏地挺身',
    'chestpress':    '胸推機',
    // 核心
    'rollout':       '槓鈴滾輪',
    'sidebend':      '啞鈴側彎',
    'plank':         '棒式',
    'crunch':        '捲腹機',
    // 肩
    'ohp-bar':       '槓鈴肩推',
    'lateral-db':    '啞鈴側平舉',
    'hspu':          '倒立撐',
    'shoulderpress': '肩推機',
    // 臂
    'curl-bar':      '槓鈴彎舉',
    'curl-db':       '啞鈴彎舉',
    'dip':           '雙槓撐體',
    'curl-mach':     '二頭彎舉機',
    // 腿
    'squat-bar':     '槓鈴深蹲',
    'squat-db':      '啞鈴深蹲',
    'squat-bw':      '自重深蹲',
    'legpress':      '腿推機',
    // 臀
    'hipthrust-bar': '槓鈴臀推',
    'hipthrust-db':  '啞鈴臀推',
    'glutebridge':   '臀橋',
    'abduction':     '臀外展機',
};

// MU: 動作 key → 各肌群佔比（%, 加總 = 100）
// 用於：SVG 熱力圖 + 圓餅圖（加權計算）
// 主計群（佔比最高）另由 primaryGroup() 取出，用於目標達成率
const MU = {
    // 背
    'row-bar':       { '背': 60, '手臂': 20, '肩': 10, '核心': 10 },
    'row-db':        { '背': 65, '手臂': 20, '核心': 10, '肩': 5 },
    'pullup':        { '背': 60, '手臂': 30, '核心': 10 },
    'lat':           { '背': 65, '手臂': 25, '核心': 10 },
    // 胸
    'bench-bar':     { '胸': 60, '手臂': 25, '肩': 10, '核心': 5 },
    'bench-db':      { '胸': 55, '手臂': 25, '肩': 15, '核心': 5 },
    'pushup':        { '胸': 50, '手臂': 30, '肩': 15, '核心': 5 },
    'chestpress':    { '胸': 65, '手臂': 25, '肩': 10 },
    // 核心
    'rollout':       { '核心': 70, '肩': 15, '背': 10, '手臂': 5 },
    'sidebend':      { '核心': 80, '背': 20 },
    'plank':         { '核心': 70, '肩': 15, '背': 10, '臀': 5 },
    'crunch':        { '核心': 90, '臀': 5, '背': 5 },
    // 肩
    'ohp-bar':       { '肩': 60, '手臂': 25, '核心': 10, '背': 5 },
    'lateral-db':    { '肩': 85, '背': 10, '核心': 5 },
    'hspu':          { '肩': 65, '手臂': 25, '核心': 10 },
    'shoulderpress': { '肩': 70, '手臂': 20, '核心': 10 },
    // 臂
    'curl-bar':      { '手臂': 85, '肩': 10, '核心': 5 },
    'curl-db':       { '手臂': 85, '肩': 10, '核心': 5 },
    'dip':           { '手臂': 50, '胸': 30, '肩': 15, '核心': 5 },
    'curl-mach':     { '手臂': 90, '肩': 5, '核心': 5 },
    // 腿
    'squat-bar':     { '腿': 50, '臀': 30, '核心': 15, '背': 5 },
    'squat-db':      { '腿': 45, '臀': 30, '核心': 20, '手臂': 5 },
    'squat-bw':      { '腿': 50, '臀': 30, '核心': 20 },
    'legpress':      { '腿': 60, '臀': 30, '核心': 10 },
    // 臀
    'hipthrust-bar': { '臀': 70, '腿': 20, '核心': 10 },
    'hipthrust-db':  { '臀': 65, '腿': 25, '核心': 10 },
    'glutebridge':   { '臀': 70, '腿': 20, '核心': 10 },
    'abduction':     { '臀': 85, '腿': 10, '核心': 5 },
};

// GROUPS: 7 大群（A–G）→ 所含 data-muscle key 陣列
// 同群所有 SVG 元素一起上色，圓餅圖 / 目標達成率 / 建議也依此分群
const GROUPS = {
    '背':  ['frontTrapezius', 'backTrapezius', 'rhomboid', 'lats'],
    '胸':  ['chest'],
    '核心': ['abs', 'sideabs'],
    '肩':  ['frontDeltoidLeft', 'frontDeltoidRight', 'rearDelt'],
    '手臂':  ['bicepsLeft', 'bicepsRight', 'frontForearm', 'triceps', 'backForearm'],
    '腿':  ['quads', 'shin', 'hamstring', 'calves'],
    '臀':  ['glute'],
};

// userGoals: 使用者每月各群目標組數（可在個人設定 modal 中修改）
let userGoals = {
    '背':  20,
    '胸':  20,
    '核心': 20,
    '肩':  20,
    '手臂':  20,
    '腿':  20,
    '臀':  20,
};

// ====== 訓練記錄 ======
// td 由 recordMockData.js 程式化生成（2025 全年 + 2026 Jan–Apr）
let td = {};