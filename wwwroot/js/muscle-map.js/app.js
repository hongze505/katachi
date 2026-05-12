// 1. 綁定模式切換按鈕
const btnSimple = document.querySelector('[data-mode="basic"]')
const btnDetailed = document.querySelector('[data-mode="detail"]')
const bodyView = document.querySelector('.body-view')
// 點擊肌群會彈窗
const DETAIL_MODAL_DISABLED_MUSCLES = new Set([])
// 外部詳細 SVG 快取：第一次 fetch 後暫存在記憶體，避免重複讀檔延遲
const DETAIL_SVG_CACHE = new Map()

function switchMode(activate, deactivate) {
  bodyView.classList.add('switching')
  setTimeout(() => {
    activate.classList.add('active')
    deactivate.classList.remove('active')
    resetAll()
    bodyView.classList.remove('switching')
  }, 100)
}

// 1-1. 簡易按鈕
btnSimple.addEventListener('click', () => {
  if (btnSimple.classList.contains('active')) return
  switchMode(btnSimple, btnDetailed)
})

// 1-2. 詳細按鈕
btnDetailed.addEventListener('click', () => {
  if (btnDetailed.classList.contains('active')) return
  switchMode(btnDetailed, btnSimple)
})


// 2. 綁定點擊肌肉按鈕
const musclePairs = document.querySelectorAll('[data-muscle]')

musclePairs.forEach(muscle => {
  // 2-1. hover 進入 → 正反面連動亮起
  muscle.addEventListener('mouseenter', () => {
    const muscleName = muscle.dataset.muscle
    const hoverLinked = MUSCLE_LINK[muscleName] || []
    hoverLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-hover-linked')
    })
  })

  // 2-2. hover 離開 → 移除正反面連動，但保留點擊連動
  muscle.addEventListener('mouseleave', () => {
    const muscleName = muscle.dataset.muscle
    const hoverLinked = MUSCLE_LINK[muscleName] || []
    hoverLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.remove('is-hover-linked')
    })
    // 2-2-1. 恢復點擊連動（如果目前有選中的肌肉）
    const clickLinked = MUSCLE_HOVER_LINK[selectedMuscle] || []
    clickLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-hover-linked')
    })
  })

  // 2-3. 點擊事件
  muscle.addEventListener('focusin', () => {
    const muscleName = muscle.dataset.muscle
    const focusLinked = MUSCLE_HOVER_LINK[muscleName] || []
    focusLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-hover-linked')
    })
  })

  muscle.addEventListener('focusout', () => {
    const muscleName = muscle.dataset.muscle
    const focusLinked = MUSCLE_HOVER_LINK[muscleName] || []
    focusLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.remove('is-hover-linked')
    })
  })

  muscle.addEventListener('click', (event) => {
    const muscleName = muscle.dataset.muscle
    selectedMuscle = muscleName

    // 2-3-1. 先清除所有肌肉的 is-selected，再幫點擊的肌肉加上
    musclePairs.forEach(m => m.classList.remove('is-selected'))
    muscle.classList.add('is-selected')

    // 2-3-2. 清除舊的連動高亮
    musclePairs.forEach(m => m.classList.remove('is-hover-linked'))

    // 2-3-3. 同側成對肌肉一起顯示 is-selected（橘色）
    const linked = MUSCLE_HOVER_LINK[muscleName] || []
    linked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-selected')
    })

    // 2-3-4. 顯示肌肉名稱並渲染動作列表
    document.querySelector('#muscle-name').textContent = MUSCLE_LABELS[muscleName]

    renderExercises()

    // 2-3-5. 詳細模式 → 開啟彈窗
    if (btnDetailed.classList.contains('active') && !DETAIL_MODAL_DISABLED_MUSCLES.has(muscleName)) {
      let detailMuscleName = muscleName

      // 後三角是單一主圖 key，但詳細模式要依照使用者點到左肩或右肩，
      // 分別打開 rearDeltLeft / rearDeltRight 兩張不同的詳細圖。
      if (muscleName === 'rearDelt') {
        const sideGroups = Array.from(muscle.children).filter(el => el.tagName && el.tagName.toLowerCase() === 'g')
        const clickedSideGroup = sideGroups.find(el => el.contains(event.target))
        if (clickedSideGroup === sideGroups[0]) detailMuscleName = 'rearDeltLeft'
        if (clickedSideGroup === sideGroups[1]) detailMuscleName = 'rearDeltRight'
      }

      detailTitle.textContent = MUSCLE_LABELS[detailMuscleName] || MUSCLE_LABELS[muscleName]
      if (detailModal) detailModal.dataset.muscleDetail = detailMuscleName
      detailBackdrop.style.display = 'flex'

      // 2-3-7. 清空彈窗內容
      const detailBody = document.querySelector('#detail-body')
      detailBody.innerHTML = ''

      // 2-3-8. 有細分圖就顯示
      if (DETAIL_SVG_CONFIGS && DETAIL_SVG_CONFIGS[detailMuscleName]) {
        const detailLayout = createDetailLayout('請點選細分肌群')
        detailBody.appendChild(detailLayout.layout)

        const detailConfig = DETAIL_SVG_CONFIGS[detailMuscleName]

        // 載入外部svg檔
        if (detailConfig?.svgSrc) {
          // 將外部 svg 內容插入彈窗
          const renderExternalDetailSvg = (svgText) => {
            detailLayout.figure.innerHTML = svgText

            // 取得外部 svg 根節點
            const externalSvg = detailLayout.figure.querySelector('svg')
            if (externalSvg) {
              externalSvg.classList.add('detail-svg', 'detail-svg--' + detailMuscleName)
              externalSvg.setAttribute('style', detailConfig.svgStyle || '')
              externalSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

              // 把外框補回外部 svg 最底層
              if (detailConfig.outlinePath) {
                const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                outline.setAttribute('d', detailConfig.outlinePath)
                outline.setAttribute('class', 'detail-outline')
                if (detailConfig.outlineFillRule) outline.setAttribute('fill-rule', detailConfig.outlineFillRule)
                if (detailConfig.outlineClipRule) outline.setAttribute('clip-rule', detailConfig.outlineClipRule)

                externalSvg.insertBefore(outline, externalSvg.firstChild)
              }
            }

            // 從 SUB_MUSCLE_DATA 拿到細分區塊名稱，用來對應 hover / click 後右側顯示內容
            const subRegions = (SUB_MUSCLE_DATA[detailMuscleName] && Array.isArray(SUB_MUSCLE_DATA[detailMuscleName].regions))
              ? SUB_MUSCLE_DATA[detailMuscleName].regions
              : []

            externalSvg.querySelectorAll('.detail-region').forEach(regionEl => {
              const regionKey = regionEl.dataset.region
              const matchedRegion = subRegions.find(region => region.key === regionKey)
              const regionLabel = matchedRegion?.label || regionEl.getAttribute('aria-label') || regionKey

              if (!regionEl.hasAttribute('role')) regionEl.setAttribute('role', 'button')
              if (!regionEl.hasAttribute('tabindex')) regionEl.setAttribute('tabindex', '0')
              if (!regionEl.hasAttribute('aria-label')) regionEl.setAttribute('aria-label', regionLabel)

              regionEl.addEventListener('mouseenter', () => {
                if (!regionEl.classList.contains('is-active')) {
                  regionEl.classList.add('is-hovered')
                }
              })

              regionEl.addEventListener('mouseleave', () => {
                regionEl.classList.remove('is-hovered')
              })

              // 點擊某個細分區塊後：清掉其他 active、標記自己、更新右側動作列表
              const selectRegion = () => {
                externalSvg.querySelectorAll('.detail-region').forEach(el => {
                  el.classList.remove('is-active', 'is-hovered')
                })
                regionEl.classList.add('is-active')
                renderDetailSubExercises(detailLayout.actions, detailMuscleName, regionKey, regionLabel)
              }

              regionEl.addEventListener('click', selectRegion)
              regionEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  selectRegion()
                }
              })
            })
          }

          // 先查快取：已載入過就直接使用，沒有才 fetch 檔案
          const cachedSvgText = DETAIL_SVG_CACHE.get(detailConfig.svgSrc)
          if (cachedSvgText) {
            renderExternalDetailSvg(cachedSvgText)
          } else {
            // 讀取detail.svg內容
            fetch(detailConfig.svgSrc, { cache: 'no-cache' })
              .then(res => {
                if (!res.ok) throw new Error(`Detail SVG not found: ${detailConfig.svgSrc}`)
                return res.text()
              })
              .then(svgText => {
                DETAIL_SVG_CACHE.set(detailConfig.svgSrc, svgText)
                renderExternalDetailSvg(svgText)
              })
              .catch(error => {
                console.error(error)
                detailLayout.figure.innerHTML = '<div class="detail-empty">詳細圖載入失敗</div>'
              })
          }

        } else {
          // 2-3-8a. 互動細分 SVG（有子區域可點擊）
          const interactiveSvg = buildInteractiveSVG(detailMuscleName, (regionKey, regionLabel) => {
            renderDetailSubExercises(detailLayout.actions, detailMuscleName, regionKey, regionLabel)
          })
          if (interactiveSvg) detailLayout.figure.appendChild(interactiveSvg)
        }

        detailBackdrop.style.display = 'flex'

      } else if (DETAIL_SVGS[detailMuscleName]) {
        const detailLayout = createDetailLayout('此部位目前沒有可點選的細分肌群')
        detailBody.appendChild(detailLayout.layout)

        // 2-3-8b. 靜態細分圖（無互動）
        const svg = DETAIL_SVGS[detailMuscleName]
        if (svg.viewBox) {
          fetch(svg.src)
            .then(res => res.text())
            .then(svgText => {
              const parser = new DOMParser()
              const doc = parser.parseFromString(svgText, 'image/svg+xml')
              const svgEl = doc.querySelector('svg')
              svgEl.setAttribute('viewBox', svg.viewBox)
              svgEl.setAttribute('style', `height:${svg.height}; width:${svg.width || 'auto'}; display:block; margin:0 auto`)
              detailLayout.figure.appendChild(svgEl)
            })
        } else {
          const img = document.createElement('img')
          img.src = svg.src
          img.alt = MUSCLE_LABELS[muscleName] || ''
          img.style.cssText = `height:${svg.height}; width:${svg.width || 'auto'}; display:block; margin:0 auto`
          detailLayout.figure.appendChild(img)
        }
        detailBackdrop.style.display = 'flex'
      }
    }
  })
})


// 3. 綁定器材按鈕
const equipmentBtns = document.querySelectorAll('.equipment-btn')
// 3-1. 改為陣列，支援多選
let selectedEquipment = []

equipmentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const eq = btn.dataset.eq

    // 3-1-1. 已選 → 取消選取，從陣列移除
    if (selectedEquipment.includes(eq)) {
      selectedEquipment = selectedEquipment.filter(e => e !== eq)
      btn.classList.remove('active')
    } else {
      // 3-1-2. 未選 → 加入陣列
      selectedEquipment.push(eq)
      btn.classList.add('active')
    }

    // 3-1-3. 重新渲染動作列表
    renderExercises()
  })
})

// [右側主面板]
let selectedMuscle = ''


// [詳細彈窗版型] 建立「左圖 + 右側動作面板」的基本結構
function createDetailLayout(emptyText) {
  const layout = document.createElement('div')
  layout.className = 'detail-layout'

  const figure = document.createElement('div')
  figure.className = 'detail-figure'

  const actions = document.createElement('aside')
  actions.className = 'detail-actions'
  actions.appendChild(createDetailEmpty(emptyText))

  layout.appendChild(figure)
  layout.appendChild(actions)

  return { layout, figure, actions }
}

function createDetailEmpty(text) {
  const empty = document.createElement('p')
  empty.className = 'detail-actions-empty'
  empty.textContent = text
  return empty
}


// [主圖動作清單] 根據 selectedMuscle 與 selectedEquipment 渲染右側主清單
function renderExercises() {
  // 先宣告，再使用
  const list = document.querySelector('#exercise-list')
  const countEl = document.querySelector('#exercise-count')

  list.innerHTML = ''
  if (countEl) countEl.textContent = '—'

  if (!selectedMuscle) return

  const exercises = (EXERCISES[selectedMuscle] || []).filter(ex => ex.name && ex.name.trim())
  if (exercises.length === 0) {
    list.innerHTML = '<li class="exercise-empty">尚未建立動作資料</li>'
    return
  }

  if (btnSimple.classList.contains('active') && selectedEquipment.length === 0) {
    list.innerHTML = '<li class="exercise-empty">請選擇器材</li>'
    return
  }

  let filtered = selectedEquipment.length > 0
    ? exercises.filter(ex => selectedEquipment.includes(ex.equipment))
    : exercises

  if (filtered.length === 0) {
    list.innerHTML = '<li class="exercise-empty">此器材無對應動作</li>'
    return
  }

  // 通過所有判斷才更新數字
  if (countEl) countEl.textContent = filtered.length.toString().padStart(2, '0')

  const isSimple = btnSimple.classList.contains('active')
  const groups = selectedEquipment.length > 0
    ? selectedEquipment
    : [...new Set(filtered.map(ex => ex.equipment))]

  groups.forEach(eq => {
    const groupExercises = filtered.filter(ex => ex.equipment === eq)
    if (groupExercises.length === 0) return

    if (selectedEquipment.length > 1) {
      const header = document.createElement('li')
      header.className = 'exercise-group-header'
      header.textContent = EQUIPMENT_LABELS[eq] || eq
      list.appendChild(header)
    }

    groupExercises.forEach(ex => {
      const li = document.createElement('li')
      li.className = 'exercise-item'

      const starsHtml = Array.from({ length: 5 }, (_, i) =>
        `<span class="${i < (ex.difficulty || 0) ? 'ex-list-star--filled' : 'ex-list-star--empty'}">★</span>`
      ).join('')

      if (isSimple) {
          const url = BASE_URL.exerciseDetail + `?muscle=${selectedMuscle}&equipment=${ex.equipment}&name=${encodeURIComponent(ex.name)}`
        li.innerHTML = `
          <a class="exercise-name exercise-link" href="${url}">${ex.name}</a>
          <div class="ex-list-stars">${starsHtml}</div>
        `
      } else {
        li.innerHTML = `
          <span class="exercise-name">${ex.name}</span>
          <div class="ex-list-stars">${starsHtml}</div>
        `
      }
      list.appendChild(li)
    })
  })
}

// -----------------------------------------------------------------------------
// [詳細彈窗控制] 開啟 / 關閉詳細視圖
// -----------------------------------------------------------------------------
const detailBackdrop = document.querySelector('#detail-backdrop')
const detailModal = document.querySelector('#detail-modal')
const detailClose = document.querySelector('#detail-close')
const detailTitle = document.querySelector('#detail-title')

// 5-1. 關閉按鈕
detailClose.addEventListener('click', () => {
  detailBackdrop.style.display = 'none'
})

// 5-2. 按 ESC 關閉彈窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    detailBackdrop.style.display = 'none'
  }
})

// 5-3. 點擊遮罩背景關閉彈窗
detailBackdrop.addEventListener('click', (e) => {
  if (e.target === detailBackdrop) {
    detailBackdrop.style.display = 'none'
  }
})

// -----------------------------------------------------------------------------
// [重置狀態] 切換簡易 / 詳細模式時，清掉目前選取、連動高亮與彈窗
// -----------------------------------------------------------------------------
function resetAll() {
  // 6-1. 清除肌肉高亮
  musclePairs.forEach(m => {
    m.classList.remove('is-selected')
    m.classList.remove('is-hover-linked')
  })
  // 6-2. 清除選中的肌肉與器材
  selectedMuscle = ''
  selectedEquipment = []
  // 6-3. 清除右側面板
  document.querySelector('#muscle-name').textContent = ''
  document.querySelector('#exercise-list').innerHTML = ''
  // 6-4. 清除器材按鈕 active
  equipmentBtns.forEach(b => b.classList.remove('active'))
  // 6-5. 關閉彈窗
  detailBackdrop.style.display = 'none'
}








