const CART_STORAGE_KEY = 'katachi-cart-v1';
const currency = new Intl.NumberFormat('zh-TW');

// DOM
const orderItems    = document.getElementById('orderItems');
const oSubtotal     = document.getElementById('oSubtotal');
const oShipping     = document.getElementById('oShipping');
const oDiscount     = document.getElementById('oDiscount');
const oDiscountRow  = document.getElementById('oDiscountRow');
const oCoupon       = document.getElementById('oCoupon');
const oCouponRow    = document.getElementById('oCouponRow');
const oTotal        = document.getElementById('oTotal');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const couponInput   = document.getElementById('couponInput');
const couponApply   = document.getElementById('couponApply');
const couponMsg     = document.getElementById('couponMsg');
const orderModal    = document.getElementById('orderModal');
const orderNumber   = document.getElementById('orderNumber');
const payTabs       = document.getElementById('payTabs');
const shipOptions   = document.querySelectorAll('.ship-option');
const homeDeliveryFields = document.getElementById('homeDeliveryFields');
const convenienceDeliveryFields = document.getElementById('convenienceDeliveryFields');

// 狀態
let couponDiscount = 0;
let selectedShipping = 'home';

const COUPONS = {
  'KATACHI10': { label: '新會員 9 折', rate: 0.1 },
  'TRAIN2024': { label: '訓練者優惠 NT$200', flat: 200 },
};

// ── 讀取購物車 ──
function readCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(i => i.qty > 0) : [];
  } catch { return []; }
}

function syncCartWithProducts() {
  const products = Array.isArray(window.KATACHI_PRODUCTS) ? window.KATACHI_PRODUCTS : [];
  if (products.length === 0) return;

  const productMap = new Map(products.map(product => [product.id, product]));
  const items = readCart();
  let changed = false;

  const syncedItems = items.map(item => {
    const product = productMap.get(item.id);
    if (!product) return item;

    changed = true;
    const isBaseProduct = !item.key || item.key === item.id;

    return {
      ...item,
      name: product.name || item.name,
      subtitle: item.subtitle || product.categoryLabel || '',
      price: isBaseProduct ? Number(product.price ?? item.price) : item.price,
      image: product.image || item.image,
      alt: product.name || item.alt || item.name
    };
  });

  if (changed) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(syncedItems));
  }
}

// ── 計算配送費 ──
function getShippingFee(subtotal) {
  if (subtotal >= 2000) return 0;
  return selectedShipping === 'convenience' ? 60 : 120;
}

// ── 渲染訂單明細 ──
function renderOrder() {
  const items = readCart();

  if (items.length === 0) {
    orderItems.innerHTML = '<div class="empty-cart">購物車沒有商品，請先加入商品再結帳。</div>';
    placeOrderBtn.disabled = true;
    updateTotals(0, 0, 0, 0);
    return;
  }

  placeOrderBtn.disabled = false;

  orderItems.innerHTML = items.map(item => `
    <div class="order-item">
      <img class="order-item__img" src="${item.image}" alt="${item.alt || item.name}">
      <div>
        <div class="order-item__name">${item.name} ×${item.qty}</div>
        <div class="order-item__sub">${item.subtitle || ''}</div>
      </div>
      <div class="order-item__price">NT$ ${currency.format(item.price * item.qty)}</div>
    </div>
  `).join('');

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = getShippingFee(subtotal);
  const memberDiscount = subtotal >= 3000 ? 300 : 0;
  updateTotals(subtotal, shipping, memberDiscount, couponDiscount);
}

function updateTotals(subtotal, shipping, memberDiscount, coupon) {
  const total = Math.max(0, subtotal + shipping - memberDiscount - coupon);
  oSubtotal.textContent  = `NT$ ${currency.format(subtotal)}`;
  oShipping.textContent  = shipping === 0 ? '免費' : `NT$ ${currency.format(shipping)}`;
  oDiscount.textContent  = `-NT$ ${currency.format(memberDiscount)}`;
  oDiscountRow.style.display = memberDiscount > 0 ? 'flex' : 'none';
  oCouponRow.style.display   = coupon > 0 ? 'flex' : 'none';
  oCoupon.textContent        = `-NT$ ${currency.format(coupon)}`;
  oTotal.textContent         = `NT$ ${currency.format(total)}`;
}

// ── 配送方式切換 ──
function clearDeliveryFieldErrors() {
  document
    .querySelectorAll('#homeDeliveryFields .field-input, #convenienceDeliveryFields .field-input')
    .forEach(input => input.classList.remove('field-error'));
}

function updateDeliveryFields() {
  const isConvenience = selectedShipping === 'convenience';
  homeDeliveryFields?.classList.toggle('is-hidden', isConvenience);
  convenienceDeliveryFields?.classList.toggle('is-hidden', !isConvenience);
  clearDeliveryFieldErrors();
}

function selectShipping(value) {
  selectedShipping = value;

  shipOptions.forEach(option => {
    const input = option.querySelector('input');
    const isSelected = input?.value === value;
    option.classList.toggle('is-selected', isSelected);
    if (input) input.checked = isSelected;
  });

  updateDeliveryFields();
  renderOrder();
}

shipOptions.forEach(option => {
  option.addEventListener('click', () => {
    const value = option.querySelector('input')?.value;
    if (!value) return;
    selectShipping(value);
  });
});

// 滿 2000 自動切換免費配送
function autoSelectFreeShipping(subtotal) {
  if (subtotal >= 2000) {
    selectedShipping = 'free';
    shipOptions.forEach(option => {
      const input = option.querySelector('input');
      const isSelected = input?.value === 'free';
      option.classList.toggle('is-selected', isSelected);
      if (input) input.checked = isSelected;
    });
    updateDeliveryFields();
  }
}

// ── 付款方式 tabs ──
payTabs.addEventListener('click', e => {
  const tab = e.target.closest('.pay-tab');
  if (!tab) return;
  const target = tab.dataset.tab;
  document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('is-active'));
  document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('is-active'));
  tab.classList.add('is-active');
  document.getElementById(`panel-${target}`)?.classList.add('is-active');
});

// ── 信用卡號格式化 ──
const cardNumberInput = document.getElementById('cardNumber');
cardNumberInput?.addEventListener('input', e => {
  let val = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = val.replace(/(.{4})/g, '$1  ').trim();
});

const cardExpiryInput = document.getElementById('cardExpiry');
cardExpiryInput?.addEventListener('input', e => {
  let val = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (val.length >= 3) val = val.slice(0,2) + ' / ' + val.slice(2);
  e.target.value = val;
});

// ── 折扣碼 ──
couponApply?.addEventListener('click', () => {
  const code = couponInput.value.trim().toUpperCase();
  const coupon = COUPONS[code];

  if (!coupon) {
    couponMsg.style.color = '#c0392b';
    couponMsg.textContent = '折扣碼無效或已過期';
    couponDiscount = 0;
    renderOrder();
    return;
  }

  const items = readCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  couponDiscount = coupon.flat ?? Math.floor(subtotal * coupon.rate);
  couponMsg.style.color = '#2e7d32';
  couponMsg.textContent = `✓ ${coupon.label} 已套用（折扣 NT$ ${currency.format(couponDiscount)}）`;
  renderOrder();
});

// ── 表單驗證 ──
function validateForm() {
  const required = ['lastName', 'firstName', 'phone', 'email'];
  const deliveryRequired = selectedShipping === 'convenience'
    ? ['storeType', 'storeArea', 'storeBranch']
    : ['address', 'city'];

  for (const id of [...required, ...deliveryRequired]) {
    const el = document.getElementById(id);
    if (!el?.value.trim()) {
      el?.focus();
      el?.classList.add('field-error');
      return false;
    }
    el.classList.remove('field-error');
  }
  return true;
}

function getRecipientAddress() {
  if (selectedShipping === 'convenience') {
    const storeType = document.getElementById('storeType').value.trim();
    const storeArea = document.getElementById('storeArea').value.trim();
    const storeBranch = document.getElementById('storeBranch').value.trim();
    return `超商取貨：${storeType} / ${storeArea} / ${storeBranch}`;
  }

  const address = document.getElementById('address').value.trim();
  const city = document.getElementById('city').value.trim();
  const zipcode = document.getElementById('zipcode').value.trim();
  return `${address}　${city}${zipcode ? '　' + zipcode : ''}`;
}

document.querySelectorAll('.field-input').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('field-error'));
});


// ── 會員資料自動帶入收件資訊 ──
function splitMemberName(name) {
  const cleanName = (name || '').trim();
  if (!cleanName) return { lastName: '', firstName: '' };

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
  }

  if (cleanName.length >= 2) {
    return { lastName: cleanName.slice(0, 1), firstName: cleanName.slice(1) };
  }

  return { lastName: cleanName, firstName: cleanName };
}

function fillInputIfEmpty(id, value) {
  const input = document.getElementById(id);
  if (!input || input.value.trim() || !value) return;
  input.value = value;
}

async function fillCheckoutMemberInfo() {
  try {
    const response = await fetch('/Shop/CurrentMember', {
      credentials: 'same-origin'
    });

    if (!response.ok) return;

    const member = await response.json();
    const names = splitMemberName(member.name);

    fillInputIfEmpty('lastName', names.lastName);
    fillInputIfEmpty('firstName', names.firstName);
    fillInputIfEmpty('email', member.email);
  } catch {
    // 未登入或讀取失敗時，維持手動填寫流程。
  }
}
// ── 下單 ──
placeOrderBtn?.addEventListener('click', async () => {
    if (placeOrderBtn.disabled) return;
    if (!validateForm()) return;

    const items = readCart();
    if (items.length === 0) return;

    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = getShippingFee(sub);
    const mem = sub >= 3000 ? 300 : 0;
    const total = Math.max(0, sub + ship - mem - couponDiscount);

    // 整理訂單資料，先送到 MVC API 寫入資料庫
    const orderData = {
        items,
        subtotal: sub,
        shipping: ship,
        memberDiscount: mem,
        couponDiscount,
        total,
        recipient: {
            name: document.getElementById('lastName').value.trim() + ' ' + document.getElementById('firstName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            address: getRecipientAddress(),
        }
    };

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = '訂單送出中...';

    try {
        const response = await fetch('/api/shop/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const message = await response.text();
            alert(message || '訂單建立失敗，請稍後再試。');
            return;
        }

        const result = await response.json();

        orderData.orderNumber = result.orderNumber;
        sessionStorage.setItem('katachi-order', JSON.stringify(orderData));

        // 清空購物車並跳轉至完成頁
        localStorage.setItem(CART_STORAGE_KEY, '[]');
        window.location.href = '/Shop/OrderComplete';
    } catch (error) {
        alert('訂單送出失敗，請檢查網路或稍後再試。');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = '確認下單';
    }

});


// ── 初始化 ──
async function initCheckoutPage() {
  await fillCheckoutMemberInfo();
  updateDeliveryFields();

  if (typeof window.loadShopProductsFromApi === 'function') {
    await window.loadShopProductsFromApi();
    syncCartWithProducts();
  }

  const items = readCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  autoSelectFreeShipping(subtotal);
  renderOrder();
}

initCheckoutPage();



