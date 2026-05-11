 function switchTab(name, btn) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
      document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('show'));
    document.getElementById('panel-' + name).classList.add('show');
}
document.addEventListener("DOMContentLoaded", () => {
    const left = document.getElementById("auth-enter-left");
    const right = document.getElementById("auth-enter-right");
    const form = document.getElementById("auth-form-wrap");

    // 用 setTimeout 確保瀏覽器渲染完才加 class
    setTimeout(() => {
        left.classList.add("enter");
        right.classList.add("enter");
    }, 50);

    // 屏風展開後顯示表單
    setTimeout(() => {
        form.classList.add("visible");
    }, 650);
});