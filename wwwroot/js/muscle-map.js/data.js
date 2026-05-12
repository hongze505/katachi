// [資料層 1] 主圖 key / 詳細彈窗 key 對應的顯示名稱
const MUSCLE_LABELS = {
  // 正面
  frontTrapezius: '斜方肌',
  frontDeltoidLeft: '三角肌',
  frontDeltoidRight: '三角肌',
  chest: '胸大肌',
  bicepsLeft: '肱二頭肌',
  bicepsRight: '肱二頭肌',
  frontForearm: '前臂',
  abs: '腹直肌',
  sideabs: '腹斜肌',
  quads: '股四頭肌',
  shin: '小腿前側',
  // 背面
  backTrapezius: '斜方肌（背面）',
  rhomboid: '菱形肌',
  lats: '背闊肌',
  rearDelt: '後三角肌',
  rearDeltLeft: '後三角肌',
  rearDeltRight: '後三角肌',
  triceps: '肱三頭肌',
  backForearm: '前臂（背面）',
  glute: '臀大肌',
  hamstring: '大腿後側',
  calves: '小腿後側',
}


// [靜態詳細圖] 沒有互動細分時，彈窗直接載入的 SVG 檔
const DETAIL_SVGS = {
  chest: { src: 'svg/detail/chest.svg', height: '450px' },
  bicepsLeft: { src: 'svg/detail/biceps-detail-left.svg', height: '620px', width: 'auto', viewBox: '0 0 317 1149' },
  bicepsRight: { src: 'svg/detail/biceps-detail-right.svg', height: '620px', width: 'auto', viewBox: '0 0 315 1150' },
  // frontDeltoidLeft: { src: 'svg/detail/shoulder-left.svg', height: '400px' },
  // frontDeltoidRight: { src: 'svg/detail/shoulder-right.svg', height: '400px' },
  calves: { src: 'svg/detail/calvesBack.svg', height: '400px' }
}


// [主圖連動] 
const MUSCLE_LINK = {
  // 三角
  frontDeltoidLeft: ['frontDeltoidRight'],
  frontDeltoidRight: ['frontDeltoidLeft'],
  // 二頭
  bicepsLeft: ['bicepsRight'],
  bicepsRight: ['bicepsLeft']
}


// [器材] 
const EQUIPMENT_LABELS = {
  dumbbell: '啞鈴',
  barbell: '槓鈴',
  bodyweight: '徒手訓練'
}


// [主圖 hover 同側連動] 
const MUSCLE_HOVER_LINK = {
  // 三角
  frontDeltoidLeft: ['frontDeltoidRight'],
  frontDeltoidRight: ['frontDeltoidLeft'],
  // 二頭肌
  bicepsLeft: ['bicepsRight'],
  bicepsRight: ['bicepsLeft'],
  // 腓腸肌
  gastrocnemiusLeft: ['gastrocnemiusRight'],
  gastrocnemiusRight: ['gastrocnemiusLeft'],
  // 比目魚肌
  soleusLeft: ['soleusRight'],
  soleusRight: ['soleusLeft']
}


// [動作資料]
const EXERCISES = {
  frontTrapezius: [],
  frontDeltoidLeft: [],
  frontDeltoidRight: [],
  chest: [
    {
      name: '啞鈴臥推',
      equipment: 'dumbbell',
      difficulty: 2,
      muscles: [
        { name: '胸大肌', pct: 70 },
        { name: '肱三頭肌', pct: 20 },
        { name: '前三角肌', pct: 10 },
      ],
      desc: '平躺於臥推椅上，雙手各握一個啞鈴置於胸口兩側。將啞鈴<strong>向上推至手臂伸直</strong>，再<strong>緩慢下放</strong>回起始位置。全程保持<strong>核心收緊</strong>，<strong>下背貼緊椅面</strong>。',
      img: ''
    },
    {
      name: '槓鈴臥推',
      equipment: 'barbell',
      difficulty: 3,
      muscles: [
        { name: '胸大肌', pct: 65 },
        { name: '肱三頭肌', pct: 25 },
        { name: '前三角肌', pct: 10 },
      ],
      desc: '平躺於臥推椅上，雙手握槓距離<strong>略寬於肩</strong>。將槓鈴從架上取下，<strong>下放至胸口輕觸</strong>後推起至手臂伸直。保持<strong>肩胛收緊</strong>、<strong>腳踩地面</strong>穩定發力。',
      img: ''
    },
    {
      name: '伏地挺身',
      equipment: 'bodyweight',
      difficulty: 1,
      muscles: [
        { name: '胸大肌', pct: 60 },
        { name: '肱三頭肌', pct: 25 },
        { name: '前三角肌', pct: 15 },
      ],
      desc: '1.雙手放在地板上，略寬於肩。 \n 2.從頭到腳，將身體伸展成一條直線。 \n 3.保持肩膀位於手腕正上方（不要向前或向後）。 \n 4.收緊核心肌群，臀部內收，肋骨收緊。 \n 5.將重量均勻分佈在全身，而不僅僅是手腕上。',
        img: '/images/push-up.png'

    }
  ],
  bicepsLeft: [],
  bicepsRight: [],
  frontForearm: [],
  abs: [],
  sideabs: [],
  quads: [],
  shin: [],
  backTrapezius: [],
  rhomboid: [],
  lats: [],
  rearDelt: [],
  triceps: [],
  backForearm: [],
  glute: [],
  hamstring: [],
  calves: [],
}




