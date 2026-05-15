// ── 顯示 / 隱藏密碼 ──
const togglePw = document.getElementById('togglePw');
const pwInput  = document.getElementById('login-password');

togglePw?.addEventListener('click', () => {
  const isHidden = pwInput.type === 'password';
  pwInput.type = isHidden ? 'text' : 'password';
  togglePw.querySelector('i').className = isHidden ? 'fa fa-eye-slash' : 'fa fa-eye';
});

// ── 移除錯誤狀態 ──
['login-email', 'login-password'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', function () {
    this.classList.remove('field-error');
    document.getElementById('loginError').style.display = 'none';
  });
});

// ── 顯示錯誤 ──
function showError(msg) {
  const el = document.getElementById('loginError');
  document.getElementById('loginErrorMsg').textContent = msg;
  el.style.display = 'block';
}

// ── 表單送出 ──
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  let hasError   = false;

  if (!email) {
    document.getElementById('login-email').classList.add('field-error');
    hasError = true;
  }
  if (!password) {
    document.getElementById('login-password').classList.add('field-error');
    hasError = true;
  }
  if (hasError) {
    showError('請填寫電子郵件與密碼。');
    return;
  }

  // Demo：任何格式正確的帳密都能登入，儲存假會員資訊後跳回商店
  const name = email.split('@')[0];
  sessionStorage.setItem('katachi-user', JSON.stringify({ email, name }));

  // 若有 redirect 來源頁，跳回去；否則跳回商店首頁
    const returnUrl = new URLSearchParams(window.location.search).get('return') || '/Shop/Index';
    window.location.href = returnUrl;

});
