
/* ══════════════════════════════
       滾動鎖定（intro 期間攔截所有滾動）
    ══════════════════════════════ */
document.documentElement.classList.add("intro-active");

const lockScroll = (e) => e.preventDefault();
window.addEventListener("wheel", lockScroll, { passive: false });
window.addEventListener("touchmove", lockScroll, { passive: false });

/* ══════════════════════════════
       自動過場邏輯
    ══════════════════════════════ */
const introScreen = document.getElementById("intro-screen");
const nav = document.getElementById("nav");
const homeContent = document.getElementById("home-content");
const transTop = document.getElementById("transition-top");
const transBot = document.getElementById("transition-bot");

function startTransition() {
  /* 步驟 1：intro 畫面淡出 */
  introScreen.classList.add("hide");

  /* 步驟 2：G 過場——上下兩半分開 */
  setTimeout(() => {
    transTop.classList.add("split");
    transBot.classList.add("split");
  }, 200);

  /* 步驟 3：nav 滑入 */
  setTimeout(() => {
    nav.classList.add("visible");
  }, 400);

  /* 步驟 4：過場完成，解除滾動鎖定 */
  setTimeout(() => {
    transTop.classList.add("done");
    transBot.classList.add("done");
    window.removeEventListener("wheel", lockScroll);
    window.removeEventListener("touchmove", lockScroll);
    document.documentElement.classList.remove("intro-active");
  }, 1400);
}

/* 訓練日誌功能選單 accordion（手機） */
const logToggle = document.querySelector('.log-toggle');
if (logToggle) {
    logToggle.addEventListener('click', () => {
        const logLeft = logToggle.closest('.log-left');
        const isOpen = logLeft.classList.toggle('open');
        logToggle.setAttribute('aria-expanded', isOpen);
    });
}

/* 動畫跑完（2s）後自動觸發 */
if (sessionStorage.getItem('katachi_intro_played')) {
  // 已播過 → 直接跳過
  introScreen.style.display = 'none'
  transTop.classList.add('split')
  transBot.classList.add('split')
  transTop.classList.add('done')
  transBot.classList.add('done')
  nav.classList.add('visible')
  window.removeEventListener('wheel', lockScroll)
  window.removeEventListener('touchmove', lockScroll)
  document.documentElement.classList.remove('intro-active')
} else {
  // 第一次 → 播放動畫並記錄
  sessionStorage.setItem('katachi_intro_played', 'true')
  setTimeout(startTransition, 2000)
}
