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