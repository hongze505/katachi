const currency = new Intl.NumberFormat('zh-TW');

// 從 sessionStorage 讀取訂單資料
let order = null;
try {
    const raw = sessionStorage.getItem('katachi-order');
    if (raw) order = JSON.parse(raw);
} catch (e) { /* ignore */ }

if (order) {
    // 訂單編號
    document.getElementById('displayOrderNum').textContent = order.orderNumber;
    document.title = `訂單 ${order.orderNumber} | KATACHI SHOP`;

    // 商品列表
    const itemsEl = document.getElementById('completeItems');
    if (order.items && order.items.length > 0) {
        itemsEl.innerHTML = order.items.map(item => `
      <div class="summary-row">
        <img src="${item.image}" alt="${item.alt || item.name}">
        <div class="summary-row__info">
          <div class="summary-row__name">${item.name} ×${item.qty}</div>
          <div class="summary-row__sub">${item.subtitle || ''}</div>
        </div>
        <div class="summary-row__price">NT$ ${currency.format(item.price * item.qty)}</div>
      </div>
    `).join('');
    } else {
        itemsEl.innerHTML = '<div style="color:var(--color-grey-mid);font-size:0.85rem;">無商品資料</div>';
    }

    // 金額明細
    const pricesEl = document.getElementById('completePrices');
    const memberDiscount = order.memberDiscount || 0;
    const couponDiscount = order.couponDiscount || 0;
    pricesEl.innerHTML = `
    <div class="price-line"><span>商品金額</span><span>NT$ ${currency.format(order.subtotal)}</span></div>
    <div class="price-line"><span>運費</span><span>${order.shipping === 0 ? '免費' : 'NT$ ' + currency.format(order.shipping)}</span></div>
    ${memberDiscount > 0 ? `<div class="price-line is-discount"><span>會員折扣</span><span>-NT$ ${currency.format(memberDiscount)}</span></div>` : ''}
    ${couponDiscount > 0 ? `<div class="price-line is-discount"><span>折扣碼優惠</span><span>-NT$ ${currency.format(couponDiscount)}</span></div>` : ''}
    <div class="price-total">
      <span>應付總額</span>
      <strong>NT$ ${currency.format(order.total)}</strong>
    </div>
  `;

    // 收件資訊
    if (order.recipient) {
        const r = order.recipient;
        document.getElementById('completeShipInfo').innerHTML = `
      <div class="ship-info__title">收件資訊</div>
      <div class="ship-info__row"><strong>收件人</strong><span>${r.name}</span></div>
      <div class="ship-info__row"><strong>聯絡電話</strong><span>${r.phone}</span></div>
      <div class="ship-info__row"><strong>電子郵件</strong><span>${r.email}</span></div>
      <div class="ship-info__row"><strong>收件地址</strong><span>${r.address}</span></div>
    `;
    }
} else {
    // 沒有訂單資料（直接進入此頁）
    document.getElementById('completeItems').innerHTML =
        '<div style="color:var(--color-grey-mid);font-size:0.85rem;padding:8px 0;">查無訂單資料，請從結帳頁完成下單流程。</div>';
    document.getElementById('completePrices').innerHTML = '';
}