/* ── 屏風選單 ── */
const byobu = document.getElementById("byobu");
const menuContent = document.getElementById("menu-content");

function openMenu() {
    // byobu.style.pointerEvents = 'all';
    byobu.classList.remove("closing");
    byobu.classList.add("open");
    setTimeout(() => menuContent.classList.add("open"), 400);
    document.body.style.overflow = "hidden";
}

function closeMenu() {
    const closeBtn = document.querySelector(".mc-close");
    if (closeBtn) {
        closeBtn.classList.add("spinning");
        setTimeout(() => closeBtn.classList.remove("spinning"), 400);
    }
    menuContent.classList.remove("open");
    byobu.classList.remove("open");
    byobu.classList.add("closing");
    setTimeout(() => {
        byobu.style.pointerEvents = "none";
        byobu.classList.remove("closing");
        document.body.style.overflow = "";
    }, 800);
}
const navbar = document.getElementById("nav");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        navbar.classList.add("shrink");
    } else {
        navbar.classList.remove("shrink");
    }
});
/* ESC 鍵關閉選單 */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
});

/* 非首頁直接顯示 nav */
document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("nav");
    if (!document.getElementById("intro-screen")) {
        nav.classList.add("visible");
    }
});

function toggleUserMenu() {
    const menu = document.getElementById("user-menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", (e) => {
    const wrap = document.querySelector(".nav-user-wrap");
    const menu = document.getElementById("user-menu");
    if (wrap && menu && !wrap.contains(e.target)) {
        menu.style.display = "none";
    }
});
const MC_DESC = {
    muscle: {
        title: "Muscle Wiki",
        text: "完整的肌肉解剖圖鑑，<br>互動式人體圖點選肌群，<br>查看對應的訓練動作。"
    },
    log: {
        title: "Training Log",
        text: "記錄每日訓練內容，<br>追蹤 PR、組數、總量，<br>讓進步看得見。"
    },
    plan: {
        title: "Training Plans",
        text: "依照目標、天數、器材，<br>自動產生專屬訓練計畫，<br>科學化編排你的課表。"
    },
    nutrition: {
        title: "Nutrition",
        text: "TDEE、BMI 一鍵計算，<br>飲食記錄與目標管理，<br>讓營養配合訓練成長。"
    },
    shop: {
        title: "Shop & Member",
        text: "會員專屬內容，<br>訓練周邊與裝備推薦，<br>打造完整訓練生態系。"
    }
};

function showMcDesc(key) {
    const desc = MC_DESC[key];
    if (!desc) return;

    document.getElementById("mc-quote-default").style.display = "none";
    const descBox = document.getElementById("mc-desc");
    const titleEl = document.getElementById("mc-desc-title");
    const textEl = document.getElementById("mc-desc-text");

    titleEl.textContent = desc.title;
    textEl.innerHTML = desc.text;
    descBox.style.display = "block";

    // 強制重新觸發動畫：移除 class → reflow → 加回 class
    titleEl.style.animation = "none";
    textEl.style.animation = "none";
    void descBox.offsetWidth;  // 強制 reflow
    titleEl.style.animation = "";
    textEl.style.animation = "";
}
document.querySelector(".mc-left")?.addEventListener("mouseleave", () => {
    document.getElementById("mc-desc").style.display = "none";
});