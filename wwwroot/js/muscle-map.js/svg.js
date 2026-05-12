function loadMusclePart(src, slotSelector) {
  const slot = document.querySelector(slotSelector)
  if (!slot) return

  fetch(src)
    .then(res => res.text())
    .then(svgText => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${svgText}</svg>`,
        'image/svg+xml'
      )

      const loadedGroup = doc.querySelector('g')
      if (!loadedGroup) return

      slot.appendChild(loadedGroup)
    })
    .catch(err => {
      console.error(`載入失敗: ${src}`, err)
    })
}
// 斜方
loadMusclePart('/svg/simple/frontTrapeziusLeft.svg', '#frontTrapezius-slot')
loadMusclePart('/svg/simple/frontTrapeziusRight.svg', '#frontTrapezius-slot')
// 三角肌
loadMusclePart('/svg/simple/frontDeltoidLeft.svg', '#frontDeltoidLeft-slot')
loadMusclePart('/svg/simple/frontDeltoidRight.svg', '#frontDeltoidRight-slot')
// 二頭
loadMusclePart('/svg/simple/bicepsLeft.svg', '#bicepsLeft-slot')
loadMusclePart('/svg/simple/bicepsRight.svg', '#bicepsRight-slot')
// 前臂
loadMusclePart('/svg/simple/frontForearmLeft.svg', '#frontForearm-slot')
loadMusclePart('/svg/simple/frontForearmRight.svg', '#frontForearm-slot')
// 胸大肌
loadMusclePart('/svg/simple/chestLeft.svg', '#chest-slot')
loadMusclePart('/svg/simple/chestRight.svg', '#chest-slot')
// 腹肌
loadMusclePart('/svg/simple/absLeftUp.svg', '#abs-slot')
loadMusclePart('/svg/simple/absLeftMid.svg', '#abs-slot')
loadMusclePart('/svg/simple/absLeftDown.svg', '#abs-slot')
loadMusclePart('/svg/simple/absRightUp.svg', '#abs-slot')
loadMusclePart('/svg/simple/absRightMid.svg', '#abs-slot')
loadMusclePart('/svg/simple/absRightDown.svg', '#abs-slot')
loadMusclePart('/svg/simple/absDown.svg', '#abs-slot')
// 側腹
loadMusclePart('/svg/simple/sideabsLeft.svg', '#sideabs-slot')
loadMusclePart('/svg/simple/sideabsRight.svg', '#sideabs-slot')
// 股四頭
loadMusclePart('/svg/simple/quadsLeft.svg', '#quads-slot')
loadMusclePart('/svg/simple/quadsRight.svg', '#quads-slot')
// 小腿前側
loadMusclePart('/svg/simple/shinLeftLeft.svg', '#shin-slot')
loadMusclePart('/svg/simple/shinLeftRight.svg', '#shin-slot')
loadMusclePart('/svg/simple/shinRightLeft.svg', '#shin-slot')
loadMusclePart('/svg/simple/shinRightRight.svg', '#shin-slot')
// 背部斜方肌
loadMusclePart('/svg/simple/backTrapeziusLeft.svg', '#backTrapezius-slot')
loadMusclePart('/svg/simple/backTrapeziusRight.svg', '#backTrapezius-slot')
// 後三角
loadMusclePart('/svg/simple/rearDeltLeft.svg', '#rearDelt-slot')
loadMusclePart('/svg/simple/rearDeltRight.svg', '#rearDelt-slot')
// 肱三頭
loadMusclePart('/svg/simple/tricepsLeft.svg', '#triceps-slot')
loadMusclePart('/svg/simple/tricepsRight.svg', '#triceps-slot')
// 背面前臂
loadMusclePart('/svg/simple/backForearmLeft.svg', '#backForearm-slot')
loadMusclePart('/svg/simple/backForearmRight.svg', '#backForearm-slot')
// 菱形肌
loadMusclePart('/svg/simple/rhomboidLeft.svg', '#rhomboid-slot')
loadMusclePart('/svg/simple/rhomboidRight.svg', '#rhomboid-slot')
// 背闊肌
loadMusclePart('/svg/simple/latsLeft.svg', '#lats-slot')
loadMusclePart('/svg/simple/latsRight.svg', '#lats-slot')
// 臀肌
loadMusclePart('/svg/simple/gluteLeft.svg', '#glute-slot')
loadMusclePart('/svg/simple/gluteRight.svg', '#glute-slot')
// 大腿後側
loadMusclePart('/svg/simple/hamstringLeft.svg', '#hamstring-slot')
loadMusclePart('/svg/simple/hamstringRight.svg', '#hamstring-slot')
// 小腿後側
loadMusclePart('/svg/simple/calvesLeft.svg', '#calves-slot')
loadMusclePart('/svg/simple/calvesRight.svg', '#calves-slot')

