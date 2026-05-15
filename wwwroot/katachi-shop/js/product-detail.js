// 商品詳細頁的資料來源：從 product-data.js 讀進所有商品資料
let productSource = window.KATACHI_PRODUCTS || [];

// 切換主圖，圖片切換轉場特效 => 淡入效果
function switchMainImage(src, alt) {
  detailImage.classList.add('is-switching');
  setTimeout(() => {
    detailImage.src = src;
    detailImage.alt = alt;
    detailImage.classList.remove('is-switching');
  }, 150);
}

// 從網址 query string 取出商品 id，例如 ?id=whey-isolate
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

// 抓取商品詳細頁面上會用到的 DOM 元素
const detailImage = document.getElementById('detailImage');
const detailThumbs = document.getElementById('detailThumbs');
const detailCategoryLabel = document.getElementById('detailCategoryLabel');
const detailNameTrail = document.getElementById('detailNameTrail');
const detailCategoryKicker = document.getElementById('detailCategoryKicker');
const detailName = document.getElementById('detailName');
const detailRating = document.getElementById('detailRating');
const detailDescription = document.getElementById('detailDescription');
const detailPrice = document.getElementById('detailPrice');
const detailOriginalPrice = document.getElementById('detailOriginalPrice');
const detailOptions = document.getElementById('detailOptions');
const detailHighlights = document.getElementById('detailHighlights');
const productInfoSection = document.getElementById('productInfoSection');
const productInfoGrid = document.getElementById('productInfoGrid');
const detailSummary = document.getElementById('detailSummary');
const qtyDecrease = document.getElementById('qtyDecrease');
const qtyIncrease = document.getElementById('qtyIncrease');
const qtyValue = document.getElementById('qtyValue');
const detailAddCart = document.getElementById('detailAddCart');
const detailBuyNow = document.getElementById('detailBuyNow');
const detailCartBtn = document.getElementById('detailCartBtn');
const detailCartCount = document.getElementById('detailCartCount');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const summaryList = document.getElementById('summaryList');
const cartItemsLabel = document.getElementById('cartItemsLabel');
const subtotalValue = document.getElementById('subtotalValue');
const shippingValue = document.getElementById('shippingValue');
const discountValue = document.getElementById('discountValue');
const totalValue = document.getElementById('totalValue');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const CART_STORAGE_KEY = 'katachi-cart-v1';
const OPEN_CART_KEY = 'katachi-open-cart';

// 依照網址 id 找到對應商品；如果找不到，就先用第一筆商品當預設
let product = productSource.find((item) => item.id === productId) || productSource[0];

// 紀錄使用者目前已選的規格 / 口味 / 容量等選項
const selectedOptions = {};

// 商品數量與目前畫面顯示中的價格狀態
// 1.預設數量為1
let quantity = 1;
let currentPrice = product ? product.price : 0;
let currentOriginalPrice = product ? product.originalPrice : 0;

// 把數字格式化成台灣常見的金額格式。
function formatMoney(value) {
  return new Intl.NumberFormat('zh-TW').format(value);
}

// 同步更新畫面上的售價與原價。
function updateDisplayedPrice() {
  detailPrice.textContent = `NT$ ${formatMoney(currentPrice)}`;
  detailOriginalPrice.textContent = `NT$ ${formatMoney(currentOriginalPrice)}`;
}

// 讓選項同時支援單純字串和帶價格的物件格式。
function getOptionText(optionValue) {
  return typeof optionValue === 'object' ? optionValue.text : optionValue;
}

// 如果選到的選項值本身有價格，就把價格一起更新。
// 這樣不只「規格 / 容量」，像「份量」這種資料庫命名也能正常改價。
function updatePriceByOption(option, optionValue) {
  if (typeof optionValue !== 'object') return;
  if (optionValue.price == null && optionValue.originalPrice == null) return;

  currentPrice = optionValue.price ?? product.price;
  currentOriginalPrice = optionValue.originalPrice ?? product.originalPrice;
  updateDisplayedPrice();
}

// 把目前已選規格與數量整理成摘要文字。
function renderSummary() {
  const picked = Object.entries(selectedOptions)
    .map(([label, value]) => `${label}：${value}`)
    .join(' / ');

  detailSummary.textContent = `已選擇：${picked || '--'} / 數量：${quantity}`;
  qtyValue.textContent = quantity;
}

// 把目前選項轉成購物車副標，之後首頁購物車就能顯示使用者選了什麼。
function getSelectedOptionsText() {
  return Object.entries(selectedOptions)
    .map(([label, value]) => `${label}：${value}`)
    .join(' / ');
}

function readCartState() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveCartState(cartItems) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

function updateDetailCartCount() {
  if (!detailCartCount) return;
  const cartItems = readCartState();
  const totalQty = cartItems.reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  detailCartCount.textContent = totalQty;
}

// 依照目前商品、選項與數量，組出一筆真正要寫進購物車的資料。
function buildDetailCartItem() {
  const selectedText = getSelectedOptionsText();
  const cartKey = selectedText ? `${product.id}__${selectedText}` : product.id;

  return {
    key: cartKey,
    id: product.id,
    name: product.name,
    subtitle: selectedText || product.categoryLabel,
    price: currentPrice,
    image: detailImage.src,
    alt: detailImage.alt || product.name,
    qty: quantity
  };
}

// detail 頁加入購物車時，若同規格已存在就累加數量。
function addCurrentProductToCart() {
  const cartItems = readCartState();
  const nextItem = buildDetailCartItem();
  const existingItem = cartItems.find((item) => item.key === nextItem.key);

  if (existingItem) {
    existingItem.qty = Math.max(1, Number(existingItem.qty) || 1) + nextItem.qty;
  } else {
    cartItems.push(nextItem);
  }

  saveCartState(cartItems);
  updateDetailCartCount();
}

let detailCartFeedbackTimer = null;

function showDetailAddCartFeedback(productName) {
  let toast = document.querySelector('.cart-feedback-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cart-feedback-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = `${productName || '商品'} 已加入購物車`;
  toast.classList.remove('is-visible');
  window.requestAnimationFrame(() => toast.classList.add('is-visible'));

  detailCartCount?.classList.remove('is-bumping');
  window.requestAnimationFrame(() => detailCartCount?.classList.add('is-bumping'));

  clearTimeout(detailCartFeedbackTimer);
  detailCartFeedbackTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    detailCartCount?.classList.remove('is-bumping');
  }, 1800);
}

// 依照單一選項資料，建立一組按鈕，例如口味、容量、規格。
function createOptionGroup(option) {
  const group = document.createElement('div');
  group.className = 'option-group';

  const label = document.createElement('div');
  label.className = 'option-group__label';
  label.textContent = option.label;

  const values = document.createElement('div');
  values.className = 'option-group__values';

  // 將每個可選值轉成按鈕，並綁定點擊事件。
  option.values.forEach((value, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-value';

    // 預設先選第一個選項，讓畫面一進來就有完整資料。
    if (index === 0) {
      button.classList.add('is-active');
      selectedOptions[option.label] = getOptionText(value);
      updatePriceByOption(option, value);

      // 如果選項有圖片（口味、顏色等），就同步把商品圖換成對應圖片。
      if (typeof value === 'object' && value.image) {
        detailImage.src = value.image;
        detailImage.alt = value.text;
      }
    }
    button.textContent = getOptionText(value);

    // 點不同按鈕時，更新目前已選值、價格與圖片。
    button.addEventListener('click', () => {
      values.querySelectorAll('.option-value').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      selectedOptions[option.label] = getOptionText(value);
      updatePriceByOption(option, value);

      // 如果選項有圖片（口味、顏色等），同步切換主圖並更新縮圖列 active。
      if (typeof value === 'object' && value.image) {
        switchMainImage(value.image, value.text);
        detailThumbs?.querySelectorAll('.detail-thumb').forEach((t) => {
          const thumbImg = t.querySelector('img');
          t.classList.toggle('is-active', thumbImg?.alt === value.text);
        });
      }
      renderSummary();
    });

    values.appendChild(button);
  });

  group.appendChild(label);
  group.appendChild(values);
  return group;
}

// 產生星星 HTML（滿分 5 顆，支援半星）。
function buildStarsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function renderProductInfoSections() {
  const sections = Array.isArray(product.detailSections) ? product.detailSections : [];

  if (!productInfoSection || !productInfoGrid) return;

  productInfoGrid.innerHTML = '';
  productInfoSection.hidden = sections.length === 0;

  sections.forEach((section) => {
    const card = document.createElement('article');
    card.className = 'product-info-card';

    const media = document.createElement('div');
    media.className = 'product-info-media';

    const image = document.createElement('img');
    image.src = section.image || product.image;
    image.alt = section.title || product.name;
    media.appendChild(image);

    const title = document.createElement('h3');
    title.className = 'product-info-title';
    title.textContent = section.title || product.name;

    const price = document.createElement('div');
    price.className = 'product-info-price';
    price.textContent = section.priceText || '';

    const swatches = document.createElement('div');
    swatches.className = 'product-info-swatches';
    (section.colors || []).forEach((color) => {
      const swatch = document.createElement('span');
      swatch.className = 'product-info-swatch';
      swatch.style.setProperty('--swatch-color', color);
      swatches.appendChild(swatch);
    });

    const weight = document.createElement('p');
    weight.className = 'product-info-weight';
    weight.textContent = section.weightText || '';

    const specs = document.createElement('div');
    specs.className = 'product-info-specs';
    (section.specs || []).forEach((line, index) => {
      const row = index === 0 ? document.createElement('strong') : document.createElement('span');
      row.textContent = line;
      specs.appendChild(row);
    });

    card.append(media, title, price, swatches, weight, specs);
    productInfoGrid.appendChild(card);
  });
}

function renderProductHighlights() {
  const highlights = Array.isArray(product.highlights) ? product.highlights : [];

  if (!detailHighlights) return;

  detailHighlights.innerHTML = '';
  detailHighlights.hidden = highlights.length === 0;

  highlights.forEach((text) => {
    const item = document.createElement('div');
    item.className = 'detail-highlight-item';
    item.textContent = text;
    detailHighlights.appendChild(item);
  });
}

// 建立縮圖列（只取有圖片的口味選項）。
function buildThumbs() {
  if (!detailThumbs) return;
  detailThumbs.innerHTML = '';

  const flavorOption = product.options?.find(
    (opt) => opt.values.some((v) => typeof v === 'object' && v.image)
  );
  if (!flavorOption) return;

  const imagedValues = flavorOption.values.filter(
    (v) => typeof v === 'object' && v.image
  );
  if (imagedValues.length < 2) return; // 只有一張圖不需要縮圖列

  imagedValues.forEach((v, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'detail-thumb' + (idx === 0 ? ' is-active' : '');
    btn.setAttribute('aria-label', v.text);

    const img = document.createElement('img');
    img.src = v.image;
    img.alt = v.text;
    btn.appendChild(img);

    btn.addEventListener('click', () => {
      detailThumbs.querySelectorAll('.detail-thumb').forEach((t) => t.classList.remove('is-active'));
      btn.classList.add('is-active');
      switchMainImage(v.image, v.text);

      // 同步選項按鈕 active 狀態
      detailOptions.querySelectorAll('.option-group').forEach((group) => {
        const labelEl = group.querySelector('.option-group__label');
        if (labelEl?.textContent !== flavorOption.label) return;
        group.querySelectorAll('.option-value').forEach((optBtn) => {
          optBtn.classList.toggle('is-active', optBtn.textContent === v.text);
        });
      });
      selectedOptions[flavorOption.label] = v.text;
      renderSummary();
    });

    detailThumbs.appendChild(btn);
  });
}

// 把目前商品資料完整渲染到頁面上。
function renderProduct() {
  if (!product) return;

  document.body.dataset.productId = product.id;
  document.title = `${product.name} | KATACHI SHOP`;
  detailImage.src = product.image;
  detailImage.alt = product.name;
  detailCategoryLabel.textContent = product.categoryLabel;
  detailNameTrail.textContent = product.name;
  detailCategoryKicker.textContent = product.categoryLabel;
  detailName.textContent = product.name;

  // 星星評分
  detailRating.innerHTML = `
    <span class="detail-rating__stars">${buildStarsHTML(product.rating)}</span>
    <span class="detail-rating__score">${product.rating}</span>
    <span class="detail-rating__count">評價</span>
  `;

  detailDescription.textContent = product.description;
  currentPrice = product.price;
  currentOriginalPrice = product.originalPrice;

  // 先清空選項區，再依照資料重新建立按鈕。
  detailOptions.innerHTML = '';
  (product.options || []).forEach((option) => {
    detailOptions.appendChild(createOptionGroup(option));
  });

    buildThumbs();
    updateDisplayedPrice();

    const isSoldOut = (product.stock ?? 0) <= 0;
    detailAddCart.disabled = isSoldOut;
    detailBuyNow.disabled = isSoldOut;
    detailAddCart.textContent = isSoldOut ? '售完' : '加入購物車';
    detailBuyNow.textContent = isSoldOut ? '售完' : '立即購買';

    renderProductHighlights();
    renderProductInfoSections();
    renderSummary();

}

// 數量減少，最少只能到 1。
qtyDecrease.addEventListener('click', () => {
  quantity = Math.max(1, quantity - 1);
  renderSummary();
});

// 數量增加。
qtyIncrease.addEventListener('click', () => {
  quantity += 1;
  renderSummary();
});

// detail 頁也真的寫入購物車，而不是只顯示提示文字。
detailAddCart.addEventListener('click', () => {
    if ((product.stock ?? 0) <= 0) return;

    addCurrentProductToCart();
    showDetailAddCartFeedback(product?.name);
    renderSummary();
    detailSummary.textContent = `${detailSummary.textContent} / 已加入購物車`;
});


// 立即購買：先加入購物車，再前往結帳頁。
detailBuyNow.addEventListener('click', () => {
    if ((product.stock ?? 0) <= 0) return;

    addCurrentProductToCart();
    window.location.href = '/Shop/Checkout';
});


// ── 購物車抽屜開關 ──
function setCartOpen(isOpen) {
  cartOverlay.classList.toggle('is-open', isOpen);
  cartOverlay.setAttribute('aria-hidden', String(!isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (isOpen) renderFullCart();
}

// 完整渲染購物車抽屜內容
function renderFullCart() {
  const currency = new Intl.NumberFormat('zh-TW');
  const items = readCartState().filter(item => item.qty > 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = items.length === 0 ? 0 : (subtotal >= 2000 ? 0 : 120);
  const discount = subtotal >= 3000 ? 300 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  cartItemsLabel.textContent = `${itemCount} Items`;
  subtotalValue.textContent = currency.format(subtotal);
  shippingValue.textContent = currency.format(shipping);
  discountValue.textContent = `-${currency.format(discount)}`;
  totalValue.textContent = currency.format(total);
  checkoutBtn.disabled = items.length === 0;
  clearCartBtn.disabled = items.length === 0;

  if (items.length === 0) {
    summaryList.innerHTML = '<div class="empty-cart">購物車目前沒有商品。</div>';
    return;
  }

  summaryList.innerHTML = items.map(item => `
    <div class="summary-item" data-cart-key="${item.key}">
      <img src="${item.image}" alt="${item.alt || item.name}">
      <div class="summary-main">
        <strong>${item.name}</strong>
        <span>${item.subtitle || ''}</span>
        <div class="qty-controls">
          <button class="qty-btn" type="button" data-action="decrease" data-key="${item.key}">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" type="button" data-action="increase" data-key="${item.key}">+</button>
          <button class="remove-line-btn" type="button" data-action="remove" data-key="${item.key}">刪除</button>
        </div>
      </div>
      <strong class="summary-price">${currency.format(item.price * item.qty)}</strong>
    </div>
  `).join('');
}

// 購物車內加減數量
summaryList.addEventListener('click', (event) => {
  const btn = event.target.closest('.qty-btn');
  const removeBtn = event.target.closest('.remove-line-btn');
  if (btn) {
    const { key, action } = btn.dataset;
    const cart = readCartState();
    const item = cart.find(i => i.key === key);
    if (!item) return;
    if (action === 'increase') item.qty += 1;
    if (action === 'decrease') item.qty = Math.max(1, item.qty - 1);
    saveCartState(cart);
    renderFullCart();
    updateDetailCartCount();
  }
  if (removeBtn) {
    const cart = readCartState().filter(i => i.key !== removeBtn.dataset.key);
    saveCartState(cart);
    renderFullCart();
    updateDetailCartCount();
  }
});

clearCartBtn.addEventListener('click', () => {
  saveCartState([]);
  renderFullCart();
  updateDetailCartCount();
});

checkoutBtn.addEventListener('click', () => {
    window.location.href = '/Shop/Checkout';
});

detailCartBtn?.addEventListener('click', () => setCartOpen(true));
cartClose?.addEventListener('click', () => setCartOpen(false));
cartOverlay?.addEventListener('click', (e) => { if (e.target === cartOverlay) setCartOpen(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setCartOpen(false); });

window.addEventListener('storage', (event) => {
  if (event.key !== CART_STORAGE_KEY) return;
  updateDetailCartCount();
  if (cartOverlay.classList.contains('is-open')) renderFullCart();
});

// 頁面載入後先把商品資料渲染出來。
async function initProductDetailPage() {
  if (typeof window.loadShopProductsFromApi === 'function') {
    await window.loadShopProductsFromApi();
  }

  productSource = window.KATACHI_PRODUCTS || [];
  product = productSource.find((item) => item.id === productId) || productSource[0];
  currentPrice = product ? product.price : 0;
  currentOriginalPrice = product ? product.originalPrice : 0;

  renderProduct();
  updateDetailCartCount();
}

initProductDetailPage();
