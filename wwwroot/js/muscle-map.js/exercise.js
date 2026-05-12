const params = new URLSearchParams(window.location.search)
const muscleName = params.get('muscle')
const equipmentName = params.get('equipment')
const exerciseName = params.get('name')

const muscleNameEl = document.querySelector('#ex-muscle-name')
const titleEl = document.querySelector('#ex-title')
const badgeEl = document.querySelector('#ex-badge')
const imgEl = document.querySelector('#ex-img')
const descEl = document.querySelector('#ex-desc')

const exercises = EXERCISES[muscleName] || []
const exercise = exercises.find(ex => ex.name === exerciseName)

function hideMedia() {
  if (!imgEl || !imgEl.parentElement) return
  imgEl.removeAttribute('src')
  imgEl.alt = ''
  imgEl.parentElement.style.display = 'none'
}

if (muscleNameEl && titleEl && badgeEl && imgEl && descEl && exercise) {
  muscleNameEl.textContent = MUSCLE_LABELS[muscleName] || ''
  titleEl.textContent = exercise.name || exerciseName || ''
  badgeEl.textContent = EQUIPMENT_LABELS[equipmentName] || ''

  if (exercise.img) {
    if (exercise.img.toLowerCase().endsWith('.mp4')) {
      imgEl.outerHTML = `
        <video class="ex-img" controls autoplay muted loop playsinline>
          <source src="${exercise.img}" type="video/mp4">
        </video>
      `
    } else {
      imgEl.src = exercise.img
      imgEl.alt = exercise.name || ''
    }
  } else {
    hideMedia()
  }

  descEl.innerHTML = exercise.desc || '\u66ab\u7121\u8aaa\u660e'

  const hasDifficulty = Boolean(exercise.difficulty)
  if (hasDifficulty) {
    const starsEl = document.querySelector('#ex-stars')
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span')
      star.className = 'ex-star' + (i <= exercise.difficulty ? ' ex-star--filled' : '')
      star.textContent = '\u2605'
      starsEl.appendChild(star)
    }
    document.querySelector('#ex-difficulty-wrap').style.display = ''
  }

  const hasMuscles = Array.isArray(exercise.muscles) && exercise.muscles.length > 0
  if (hasMuscles) {
    const barsEl = document.querySelector('#ex-muscle-bars')
    exercise.muscles.forEach(m => {
      let barColor
      if (m.pct >= 50) {
        barColor = 'linear-gradient(90deg, #ff9146, #d4845a)'
      } else if (m.pct >= 20) {
        barColor = 'linear-gradient(90deg, #ffd76a, #ff9146)'
      } else {
        barColor = 'linear-gradient(90deg, #d4d0ca, #ffd76a)'
      }

      const row = document.createElement('div')
      row.className = 'ex-muscle-row'
      row.innerHTML = `
        <span class="ex-muscle-label">${m.name}</span>
        <div class="ex-muscle-bar-bg">
          <div class="ex-muscle-bar-fill" style="width:${m.pct}%; background:${barColor}"></div>
        </div>
        <span class="ex-muscle-pct">${m.pct}%</span>
      `
      barsEl.appendChild(row)
    })
    document.querySelector('#ex-muscles-wrap').style.display = ''
  }

  if (hasDifficulty || hasMuscles) {
    document.querySelector('#ex-stats-card').style.display = ''
  }

  if (hasDifficulty && hasMuscles) {
    document.querySelector('#ex-stats-divider').style.display = ''
  }
} else {
  hideMedia()
  if (titleEl) titleEl.textContent = exerciseName || ''
  if (badgeEl) badgeEl.textContent = EQUIPMENT_LABELS[equipmentName] || ''
  if (muscleNameEl) muscleNameEl.textContent = MUSCLE_LABELS[muscleName] || ''
  if (descEl) descEl.textContent = '\u627e\u4e0d\u5230\u52d5\u4f5c\u8cc7\u6599'
}
