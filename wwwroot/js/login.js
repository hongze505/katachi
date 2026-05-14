 function switchTab(name, btn) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
      document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('show'));
    document.getElementById('panel-' + name).classList.add('show');
}
document.addEventListener("DOMContentLoaded", () => {
    const left = document.getElementById("auth-enter-left");
    const right = document.getElementById("auth-enter-right");
   

    // 用 setTimeout 確保瀏覽器渲染完才加 class
    setTimeout(() => {
        left.classList.add("enter");
        right.classList.add("enter");
    }, 50);

    // 屏風展開後顯示表單
    setTimeout(() => {
        document.getElementById("auth-form-wrap").classList.add("visible");
    }, 650);
});

function toggleUserMenu() {
    const menu = document.getElementById("user-menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// 點外面關閉
document.addEventListener("click", (e) => {
    const wrap = document.querySelector(".nav-user-wrap");
    const menu = document.getElementById("user-menu");
    if (wrap && menu && !wrap.contains(e.target)) {
        menu.style.display = "none";
    }
});