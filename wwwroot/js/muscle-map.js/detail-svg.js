// 細分肌群資料：右側面板顯示的訓練動作
const SUB_MUSCLE_DATA = {
  // 正面斜方肌
  frontTrapezius: {
        regions: [
            {
                key: 'trapezius-upper',
                label: '上斜方肌',
                exercises: []
            }
        ]
    },

  // 胸
  chest: {
    regions: [
      {
        key: 'chest-upper',
        label: '上胸',
        exercises: [
          { name: '上斜槓鈴臥推', equipment: 'barbell', difficulty: 3 },
          { name: '上斜啞鈴臥推', equipment: 'dumbbell', difficulty: 2 },
          { name: '上斜啞鈴飛鳥', equipment: 'dumbbell', difficulty: 2 },
        ]
      },
      {
        key: 'chest-mid',
        label: '中胸',
        exercises: [
          { name: '槓鈴臥推', equipment: 'barbell', difficulty: 3 },
          { name: '啞鈴飛鳥', equipment: 'dumbbell', difficulty: 2 },
          { name: '伏地挺身', equipment: 'bodyweight', difficulty: 1 },
        ]
      },
      {
        key: 'chest-lower',
        label: '下胸',
        exercises: [
          { name: '下斜槓鈴臥推', equipment: 'barbell', difficulty: 3 },
          { name: '下斜啞鈴臥推', equipment: 'dumbbell', difficulty: 2 },
          { name: '雙槓撐體', equipment: 'bodyweight', difficulty: 2 },
        ]
      }
    ]
  },

  // 前三角
  frontDeltoidLeft: {
    regions: [
      {
        key: 'shoulders-front',
        label: '前束',
        exercises: [
          { name: '啞鈴前平舉', equipment: 'dumbbell', difficulty: 1 },
          { name: '肩推', equipment: 'barbell', difficulty: 2 },
          { name: '啞鈴肩推', equipment: 'dumbbell', difficulty: 3 },
        ]
      },
      {
        key: 'shoulders-mid',
        label: '中束',
        exercises: [
          { name: '啞鈴側平舉', equipment: 'dumbbell', difficulty: 1 },
          { name: '槓鈴直立划船', equipment: 'barbell', difficulty: 2 },
        ]
      }
    ]
  },
  frontDeltoidRight: {
    regions: [
      {
        key: 'shoulders-front',
        label: '前束',
        exercises: [
          { name: '啞鈴前平舉', equipment: 'dumbbell', difficulty: 1 },
          { name: '肩推', equipment: 'barbell', difficulty: 2 },
          { name: '啞鈴肩推', equipment: 'dumbbell', difficulty: 3 },
        ]
      },
      {
        key: 'shoulders-mid',
        label: '中束',
        exercises: [
          { name: '啞鈴側平舉', equipment: 'dumbbell', difficulty: 1 },
          { name: '槓鈴直立划船', equipment: 'barbell', difficulty: 2 },
        ]
      }
    ]
  },

  // 肱二頭
  bicepsLeft: {
    regions: [
      {
        key: 'biceps-long-head',
        label: '長頭',
        exercises: [
          { name: '上斜啞鈴彎舉', equipment: 'dumbbell', difficulty: 2 },
          { name: '槓鈴彎舉', equipment: 'barbell', difficulty: 2 },
          { name: '錘式彎舉', equipment: 'dumbbell', difficulty: 1 },
        ]
      },
      {
        key: 'biceps-short-head',
        label: '短頭',
        exercises: [
          { name: '集中彎舉', equipment: 'dumbbell', difficulty: 2 },
          { name: '牧師椅彎舉', equipment: 'barbell', difficulty: 1 },
          { name: '斜板彎舉', equipment: 'dumbbell', difficulty: 2 },
        ]
      }
    ]
  },
  bicepsRight: {
    regions: [
      {
        key: 'biceps-long-head',
        label: '長頭',
        exercises: [
          { name: '上斜啞鈴彎舉', equipment: 'dumbbell', difficulty: 2 },
          { name: '槓鈴彎舉', equipment: 'barbell', difficulty: 2 },
          { name: '錘式彎舉', equipment: 'dumbbell', difficulty: 1 },
        ]
      },
      {
        key: 'biceps-short-head',
        label: '短頭',
        exercises: [
          { name: '集中彎舉', equipment: 'dumbbell', difficulty: 2 },
          { name: '牧師椅彎舉', equipment: 'barbell', difficulty: 1 },
          { name: '斜板彎舉', equipment: 'dumbbell', difficulty: 2 },
        ]
      }
    ]
  },

  // 手臂
  frontForearm: {
    regions: [
      {
        key: 'forearm-wrist-flexors',
        label: '腕屈肌群',
        exercises: [
          { name: '啞鈴腕屈曲', equipment: 'dumbbell', difficulty: 1, }
        ]
      },
      {
        key: 'forearm-brachioradialis',
        label: '肱橈肌',
        exercises: [
          { name: '上錘式彎舉', equipment: 'dumbbell', difficulty: 1 }
        ]
      }
    ]
  },

   // 腹肌
  abs: {
    regions: [
      {
      key: 'abs-up',
      label: '上腹',
      exercises: []
      },
      {
      key: 'abs-down',
      label: '下腹',
      exercises: []
      }
    ]
  },

  // 側腹
  sideabs: {
    regions: [
      {
        key: 'serratus-anterior',
        label: '前鋸肌',
        exercises: []
      },
      {
        key: 'external-oblique',
        label: '腹外斜肌',
        exercises: []
      }
    ]
  },

   // 股四頭
   quads: {
        regions: [
            {
                key: 'quads-vastus-medialis',
                label: '股內側肌',
                exercises: []
            },
            {
                key: 'quads-vastus-lateralis',
                label: '股外側肌',
                exercises: []
            },
            {
                key: 'quads-rectus-intermedius',
                label: '股直肌、股中間肌',
                exercises: []
            }
        ]
    },

   // 小腿前側
   shin: {
        regions: [
            {
                key: 'tibialis-anterior',
                label: '脛前肌',
                exercises: []
            }
        ]
    },

  // 斜方
  backTrapezius: {
    regions: [
      {
        key: 'trapezius-upper',
        label: '上斜方肌',
        exercises: []
      },
      {
        key: 'trapezius-middle',
        label: '中斜方肌',
        exercises: []
      },
      {
        key: 'trapezius-lower',
        label: '下斜方肌',
        exercises: []
      }
    ]
  },

  // 後三角
  rearDelt: {
    regions: [
      {
        key: 'rearDeltLeft',
        label: '左後束',
        exercises: []
      },
      {
        key: 'rearDeltRight',
        label: '右後束',
        exercises: []
      }
    ]
  },
  rearDeltLeft: {
    regions: [
      {
        key: 'rearDeltLeft',
        label: '左後束',
        exercises: []
      }
    ]
  },
  rearDeltRight: {
    regions: [
      {
        key: 'rearDeltRight',
        label: '右後束',
        exercises: []
      }
    ]
  },

  // 小腿後側
  calves: {
    regions: [
      {
        key: 'gastrocnemius',
        label: '腓腸肌',
        exercises: []
      },
      {
        key: 'soleus',
        label: '比目魚肌',
        exercises: []
      }
    ]
  },

}

// 各部位細分 SVG 設定
const DETAIL_SVG_CONFIGS = {
    // 正面斜方肌
    frontTrapezius: {
        svgStyle: 'width:min(100%,420px);height:auto;max-height:min(62vh,520px);display:block;margin:0 auto;overflow:visible',
        svgSrc: '/svg/detail/frontTrapezius.svg?v=20260507'
    },

  // 前三角
  frontDeltoidLeft: {
    svgStyle: 'height:min(64vh,560px);width:auto;max-width:340px;display:block;margin:0 auto;overflow:visible',
        svgSrc: '/svg/detail/frontDeltoidLeft.svg',
  },
  frontDeltoidRight: {
    svgStyle: 'height:min(64vh,560px);width:auto;max-width:340px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/frontDeltoidRight.svg',
  },

  // 肱二頭肌
  bicepsLeft: {
    svgStyle: 'height:min(72vh,620px);width:auto;max-width:100%;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/bicepsLeft.svg'
  },
  bicepsRight: {
    svgStyle: 'height:min(72vh,620px);width:auto;max-width:100%;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/bicepsRight.svg'
  },

  // 胸肌
  chest: {
    svgStyle: 'height:450px;width:100%;max-width:520px;display:block;margin:0 auto;overflow:hidden',
    svgSrc: '/svg/detail/chest.svg'
    },

    // 腹肌
    abs: {
        svgStyle: 'width:min(100%,440px);height:auto;max-height:min(62vh,540px);display:block;margin:0 auto;overflow:visible',
        svgSrc: '/svg/detail/abs.svg?v=20260507'
    },

  // 側腹
  sideabs: {
    svgStyle: 'height:min(70vh,620px);width:auto;max-width:320px;display:block;margin:0 auto;overflow:visible',
      svgSrc: '/svg/detail/sideabs.svg'
  },

  // 股四頭肌
  quads: {
    svgStyle: 'height:min(50vh,450px);width:auto;max-width:450px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/quads.svg'
  },

  // 小腿前側
  shin: {
    svgStyle: 'height:min(62vh,560px);width:auto;max-width:320px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/shin.svg',
  },

  // 背面斜方肌
  backTrapezius: {
    svgStyle: 'height:min(74vh,660px);width:auto;max-width:380px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/backTrapezius.svg'
  },

  // 後三角
  rearDeltLeft: {
    svgStyle: 'height:min(64vh,560px);width:auto;max-width:340px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/rearDeltLeft.svg'
  },
  rearDeltRight: {
    svgStyle: 'height:min(64vh,560px);width:auto;max-width:340px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/rearDeltRight.svg'
  },

  // 小腿後側
  calves: {
    viewBox: '',
    svgStyle: 'height:min(62vh,560px);width:auto;max-width:300px;display:block;margin:0 auto;overflow:visible',
    svgSrc: '/svg/detail/calvesBack.svg'
  },
}

// SVG 建立工具
const svgNS = 'http://www.w3.org/2000/svg'

// 建立互動式細分 SVG 元素，onRegionSelect(regionKey) 為點擊回呼
function buildInteractiveSVG(muscleName, onRegionSelect) {
  const config = DETAIL_SVG_CONFIGS[muscleName]
  if (!config) return null

  // 建立 SVG 元素
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('viewBox', config.viewBox || '0 0 1089 974')
  svg.setAttribute('xmlns', svgNS)
  svg.style.cssText = config.svgStyle || 'width:100%;height:auto;display:block;margin:0 auto;overflow:hidden'
  svg.classList.add('detail-svg', `detail-svg--${muscleName}`)

  // hover 光暈濾鏡
  const defs = document.createElementNS(svgNS, 'defs')
  defs.innerHTML = `<filter id="detail-glow" x="-12%" y="-12%" width="124%" height="124%">
    <feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="#ffd76a" flood-opacity="0.28" />
  </filter>`
  svg.appendChild(defs)

  // 外框路徑
  if (config.outlinePath) {
    const outline = document.createElementNS(svgNS, 'path')
    outline.setAttribute('d', config.outlinePath)
    outline.setAttribute('class', 'detail-outline')
    if (config.outlineFillRule) outline.setAttribute('fill-rule', config.outlineFillRule)
    if (config.outlineClipRule) outline.setAttribute('clip-rule', config.outlineClipRule)
    svg.appendChild(outline)
  }

  // 可互動分區
  const regions = Array.isArray(config.regions) ? config.regions : []
  regions.forEach(region => {
    const g = document.createElementNS(svgNS, 'g')
    const regionGroupKey = region.groupKey || region.key
    g.setAttribute('class', 'detail-region')
    g.setAttribute('data-region', region.key)
    g.setAttribute('data-region-group', regionGroupKey)
    g.setAttribute('role', 'button')
    g.setAttribute('tabindex', '0')
    g.setAttribute('aria-label', region.label)
    if (region.transform) g.setAttribute('transform', region.transform)

    if (region.outlinePath) {
      const outline = document.createElementNS(svgNS, 'path')
      outline.setAttribute('d', region.outlinePath)
      outline.setAttribute('class', 'detail-outline')
      if (region.outlineFillRule) outline.setAttribute('fill-rule', region.outlineFillRule)
      if (region.outlineClipRule) outline.setAttribute('clip-rule', region.outlineClipRule)
      g.appendChild(outline)
    }

    region.paths.forEach(pathDef => {
      const innerG = document.createElementNS(svgNS, 'g')
      innerG.setAttribute('transform', pathDef.transform)
      const path = document.createElementNS(svgNS, 'path')
      path.setAttribute('d', pathDef.d)
      innerG.appendChild(path)
      g.appendChild(innerG)
    })

    // Hover 效果
    g.addEventListener('mouseenter', () => {
      svg.querySelectorAll(`[data-region-group="${regionGroupKey}"]`).forEach(el => {
        if (!el.classList.contains('is-active')) {
          el.classList.add('is-hovered')
        }
      })
    })

    g.addEventListener('mouseleave', () => {
      svg.querySelectorAll(`[data-region-group="${regionGroupKey}"]`).forEach(el => {
        el.classList.remove('is-hovered')
      })
    })

    const selectRegion = () => {
      // 移除其他 active 狀態
      svg.querySelectorAll('.detail-region').forEach(el => {
        el.classList.remove('is-active', 'is-hovered')
      })
      svg.querySelectorAll(`[data-region-group="${regionGroupKey}"]`).forEach(el => {
        el.classList.add('is-active')
      })
      if (onRegionSelect) onRegionSelect(regionGroupKey, region.label)
    }

    // 點擊與鍵盤操作
    g.addEventListener('click', selectRegion)

    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        selectRegion()
      }
    })

    svg.appendChild(g)
  })

  if (config.linePaths) {
    const guideGroup = document.createElementNS(svgNS, 'g')
    guideGroup.setAttribute('class', 'detail-guide-lines')
    guideGroup.setAttribute('aria-hidden', 'true')

    config.linePaths.forEach(d => {
      const guideLine = document.createElementNS(svgNS, 'path')
      guideLine.setAttribute('class', 'detail-guide-line')
      guideLine.setAttribute('d', d)
      guideGroup.appendChild(guideLine)
    })

    svg.appendChild(guideGroup)
  }

  return svg
}

// 右側動作列表
// 在 modal 右側渲染細分肌群動作
function renderDetailSubExercises(container, muscleName, regionKey, regionLabel) {
  const muscleData = SUB_MUSCLE_DATA[muscleName]
  if (!muscleData) return

  const region = muscleData.regions.find(r => r.key === regionKey)
  if (!region) return

  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'detail-sub-exercises'

  // 標題
  const title = document.createElement('h3')
  title.className = 'detail-sub-title'
  title.textContent = regionLabel + ' 訓練動作'
  wrapper.appendChild(title)

  // 動作列表
  const ul = document.createElement('ul')
  ul.className = 'detail-sub-list'

  if (region.exercises.length === 0) {
    const li = document.createElement('li')
    li.className = 'detail-sub-item'
    li.textContent = '尚未建立動作資料'
    ul.appendChild(li)
  } else {
    region.exercises.forEach(ex => {
      const li = document.createElement('li')
      li.className = 'detail-sub-item'

      const left = document.createElement('div')
      left.className = 'detail-sub-left'

      const nameLink = document.createElement('a')
      nameLink.className = 'detail-sub-name detail-sub-link'

      // 用詳細模式動作名稱 ex.name 去簡易模式 EXERCISES[muscleName] 裡找同名動作
      const linkedExercise = (EXERCISES[muscleName] || []).find(mainEx => mainEx.name === ex.name)
      //找到同名動作就用簡易模式的器材，沒有找到才用詳細模式的器材
      const targetEquipment = linkedExercise?.equipment || ex.equipment
      nameLink.href = (typeof BASE_URL !== 'undefined' ? BASE_URL.exerciseDetail : '/MuscleMap/Exercise') + `?muscle=${muscleName}&equipment=${targetEquipment}&name=${encodeURIComponent(ex.name)}`
      nameLink.textContent = ex.name

      const starsEl = document.createElement('div')
      starsEl.className = 'detail-sub-stars'
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement('span')
        s.textContent = '\u2605'
        s.className = i <= (ex.difficulty || 0) ? 'detail-sub-star--filled' : 'detail-sub-star--empty'
        starsEl.appendChild(s)
      }

      left.appendChild(nameLink)
      left.appendChild(starsEl)

      const eqSpan = document.createElement('span')
      eqSpan.className = 'detail-sub-eq'
      eqSpan.textContent = EQUIPMENT_LABELS[ex.equipment] || ex.equipment

      li.appendChild(left)
      li.appendChild(eqSpan)
      ul.appendChild(li)
    })
  }

  wrapper.appendChild(ul)
  container.appendChild(wrapper)
}












