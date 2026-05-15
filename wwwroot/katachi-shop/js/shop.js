// 一、DOM 元素區
const shopShell = document.querySelector('.shop-shell');
// navbar滾動收合動態效果
const topbar = document.querySelector('.topbar');
const categoryRow = document.getElementById('categoryRow');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const productGrid = document.getElementById('productGrid');
const resultsShell = document.getElementById('resultsShell');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCopy = document.getElementById('resultsCopy');
const cartToggle = document.getElementById('cartToggle');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const summaryList = document.getElementById('summaryList');
const cartCount = document.getElementById('cartCount');
const cartItemsLabel = document.getElementById('cartItemsLabel');
const subtotalValue = document.getElementById('subtotalValue');
const shippingValue = document.getElementById('shippingValue');
const discountValue = document.getElementById('discountValue');
const totalValue = document.getElementById('totalValue');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const bundleCheckoutBtn = document.getElementById('bundleCheckoutBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const heroSlider = document.getElementById('heroSlider');
const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
const heroDots = Array.from(document.querySelectorAll('.hero-slider__dot'));
const heroPrev = document.getElementById('heroPrev');
const heroNext = document.getElementById('heroNext');
let products = Array.from(productGrid.querySelectorAll('.product-card'));
const CART_STORAGE_KEY = 'katachi-cart-v1';
const OPEN_CART_KEY = 'katachi-open-cart';

// 二、商品卡初始化區
products.forEach((card, index) => {
  card.dataset.order = index;
  card.setAttribute('role', 'link');
  card.tabIndex = 0;
});

const currency = new Intl.NumberFormat('zh-TW');

// 三、資料整理區
// 先整理出商品資料表，讓購物車渲染與價格計算都共用同一份資料。
let productMap = new Map();

function refreshProductsFromDom() {
  products = Array.from(productGrid.querySelectorAll('.product-card'));

  products.forEach((card, index) => {
    card.dataset.order = card.dataset.order || String(index);
    card.setAttribute('role', 'link');
    card.tabIndex = 0;
  });

  productMap = new Map(
    products.map((card) => {
      const id = card.dataset.id;
      const image = card.querySelector('.product-thumb img');
      const meta = card.querySelector('.product-meta span');
      return [id, {
        id,
        name: card.querySelector('.product-name').textContent.trim(),
        subtitle: meta ? meta.textContent.trim() : '',
        price: Number(card.dataset.price || 0),
        image: image ? image.src : '',
        alt: image ? image.alt : card.dataset.name
      }];
    })
  );
}

refreshProductsFromDom();

// 將商品卡資料整理成購物車可直接使用的結構。
function buildCartItemFromProduct(productId, overrides = {}) {
  const product = productMap.get(productId);
  if (!product) return null;

  return {
    key: overrides.key || productId,
    id: productId,
    name: overrides.name || product.name,
    subtitle: overrides.subtitle || product.subtitle,
    price: Number(overrides.price ?? product.price),
    image: overrides.image || product.image,
    alt: overrides.alt || product.alt,
    qty: Math.max(1, Number(overrides.qty) || 1)
  };
}

function buildStarterBundleCartItem() {
  refreshProductsFromDom();
  const baseProduct = productMap.get('whey-isolate')
    || productMap.get('creatine')
    || productMap.values().next().value;

  return {
    key: 'bundle-starter-set',
    id: 'bundle-starter-set',
    name: '補給入門組',
    subtitle: '乳清蛋白 / 肌酸 / 魚油 / 搖搖杯',
    price: 3280,
    image: baseProduct?.image || '/katachi-shop/img/Protein/protein.jpg',
    alt: '補給入門組',
    qty: 1
  };
}

// 第一次進站時，先放幾筆示範商品到購物車。
function createDefaultCartState() {
  return ['whey-isolate', 'creatine', 'shaker-bottle']
    .map((id) => buildCartItemFromProduct(id))
    .filter(Boolean);
}

// 把 localStorage 內的資料修正成固定格式，避免舊資料格式混亂。
function normalizeCartItem(item) {
  if (!item?.id) return null;
  const product = productMap.get(item.id);

  return {
    key: String(item.key || item.id),
    id: item.id,
    name: item.name || product?.name || '',
    subtitle: item.subtitle || product?.subtitle || '',
    price: Number(item.price ?? product?.price ?? 0),
    image: item.image || product?.image || '',
    alt: item.alt || product?.alt || item.name || '',
    qty: Math.max(1, Number(item.qty) || 1)
  };
}

function saveCartState() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
}

// 讀取購物車；正式購物流程不再自動建立示範商品。
function readCartState({ seedDefault = false } = {}) {
  const raw = localStorage.getItem(CART_STORAGE_KEY);

  if (raw === null) {
    if (!seedDefault) return [];
    const defaults = createDefaultCartState();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean);
  } catch (error) {
    return [];
  }
}

// 四、狀態區
let cartState = readCartState();

const categoryMeta = {
  all: {
    title: '全部商品',
    copy: '目前顯示全部補給品、營養品、運動用品與沖泡配件，方便先快速瀏覽完整商品列表。（瀏覽圖皆為示意圖）'
  },
  protein: {
    title: '高蛋白',
    copy: '集中查看乳清、酪蛋白這類以蛋白質補充為主的商品，適合先從訓練後恢復需求開始選。'
  },
  performance: {
    title: '訓練補給',
    copy: '這區以肌酸、訓練前補給和胺基酸為主，適合訓練期想補強發力與表現的人。'
  },
  wellness: {
    title: '日常營養',
    copy: '魚油與綜合維他命這類日常保養商品會集中顯示，方便和訓練補給做區隔。'
  },
  sports: {
    title: '運動用品',
    copy: '啞鈴與訓練器材會集中顯示，適合想補齊居家訓練設備的人快速瀏覽。'
  },
  accessories: {
    title: '沖泡配件',
    copy: '搖搖杯與相關配件會獨立顯示，讓補給品本體和工具類商品能快速分流。'
  }
};

let activeCategory = 'all';
let backHomeIdleTimer = null;

// 五、工具函式區
function getNumericValue(card, key) {
  return Number(card.dataset[key] || 0);
}

function formatMoney(value) {
  return currency.format(value);
}

// 頁面往下捲時，讓頂部導覽縮成中間膠囊狀。
function updateNavbarShrink() {
  if (!topbar) return;
  topbar.classList.toggle('shrink', window.scrollY > 80);
}

// 回到這個電商頁的最上方。
function scrollToShopTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// 進入單一商品詳細頁。
function openProductDetail(productId) {
  if (!productId) return;
    window.location.href = `/Shop/ProductDetail?id=${encodeURIComponent(productId)}`;
}

// 只有在頁面已經往下捲時，才顯示右下角按鈕。
function updateBackHomeButtonVisibility() {
  if (!backHomeBtn) return;
  if (window.scrollY <= 0) {
    backHomeBtn.classList.remove('is-visible');
  }
}

// 只要滑鼠滾動，就短暫顯示置頂按鈕。
function handleBackHomeWheel() {
  if (!backHomeBtn) return;

  backHomeBtn.classList.add('is-visible');
  clearTimeout(backHomeIdleTimer);
  backHomeIdleTimer = setTimeout(() => {
    backHomeBtn.classList.remove('is-visible');
  }, 900);
}

// 平滑捲動到商品列表區。
function scrollToProducts() {
  (resultsShell || productGrid)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// 同步更新上下兩排分類按鈕的啟用狀態。
function syncCategoryButtons(category) {
  [categoryRow].forEach((row) => {
    if (!row) return;
    row.querySelectorAll('.category-pill').forEach((pill) => {
      pill.classList.toggle('is-active', pill.dataset.category === category);
    });
  });
}

// 更新商品區上方的目前分類標題與說明。
function updateResultsHeader(category) {
  const meta = categoryMeta[category] || categoryMeta.all;
  if (resultsTitle) resultsTitle.textContent = meta.title;
  if (resultsCopy) resultsCopy.textContent = meta.copy;
}

// 切換分類時，同步更新按鈕、商品清單與商品區標題。
function setActiveCategory(category, { scroll = false } = {}) {
  activeCategory = category;
  syncCategoryButtons(category);
  updateResultsHeader(category);
  applyFilters();
  if (scroll) scrollToProducts();
}

// 輪播目前顯示到哪一張，以及自動播放計時器。
let currentHeroIndex = 0;
let heroTimer = null;

// 六、輪播功能區

// 切換到指定輪播頁，並同步更新圓點狀態
function showHeroSlide(index) {
  if (!heroSlides.length) return;

  currentHeroIndex = (index + heroSlides.length) % heroSlides.length;

  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-active', slideIndex === currentHeroIndex);
  });

  heroDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === currentHeroIndex);
  });
}

// 啟動自動輪播；每 3 秒切下一張。
function startHeroSlider() {
  if (!heroSlides.length) return;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    showHeroSlide(currentHeroIndex + 1);
  }, 3000);
}

// 暫停自動輪播。
function stopHeroSlider() {
  clearInterval(heroTimer);
}

// 七、購物車核心區

// 把購物車數量狀態轉成可直接渲染的商品陣列。
function getCartEntries() {
  return cartState.filter((item) => item.qty > 0);
}

// 依照目前購物車狀態重新渲染，並同步重算件數、運費、折扣與總額。
function renderCart() {
  const items = getCartEntries();
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = items.length === 0 ? 0 : (subtotal >= 2000 ? 0 : 120);
  const discount = subtotal >= 3000 ? 300 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  cartCount.textContent = itemCount;
  cartItemsLabel.textContent = `${itemCount} Items`;
  subtotalValue.textContent = formatMoney(subtotal);
  shippingValue.textContent = formatMoney(shipping);
  discountValue.textContent = `-${formatMoney(discount)}`;
  totalValue.textContent = formatMoney(total);
  checkoutBtn.disabled = items.length === 0;
  checkoutBtn.style.opacity = items.length === 0 ? '0.5' : '1';
  checkoutBtn.style.pointerEvents = items.length === 0 ? 'none' : 'auto';
  clearCartBtn.disabled = items.length === 0;
  clearCartBtn.style.opacity = items.length === 0 ? '0.5' : '1';
  clearCartBtn.style.pointerEvents = items.length === 0 ? 'none' : 'auto';

  if (items.length === 0) {
    summaryList.innerHTML = '<div class="empty-cart">購物車目前沒有商品。回到商品區加入想要的器材、配件或補給品。</div>';
    return;
  }

  // 將購物車每筆商品渲染成html字串
    summaryList.innerHTML = items.map((item) => {
      const itemHref = item.id?.startsWith('bundle-')
        ? '/Shop'
        : `/Shop/ProductDetail?id=${encodeURIComponent(item.id)}`;

      return `
        <div class="summary-item" data-cart-key="${item.key}">
          <a href="${itemHref}" class="summary-item__thumb">
            <img src="${item.image}" alt="${item.alt}">
          </a>

          <div class="summary-main">
            <strong>${item.name}</strong>
            <span>${item.subtitle}</span>
            <div class="qty-controls">
              <button class="qty-btn" type="button" data-action="decrease" data-key="${item.key}">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" type="button" data-action="increase" data-key="${item.key}">+</button>
              <button class="remove-line-btn" type="button" data-action="remove" data-key="${item.key}">刪除</button>
            </div>
          </div>
          <strong class="summary-price">${formatMoney(item.price * item.qty)}</strong>
        </div>
      `;
    }).join('');
}

// 商品卡加入購物車時，若同商品已存在就直接累加數量。
function addCartItem(nextItem) {
  if (!nextItem) return;

  const existingItem = cartState.find((item) => item.key === nextItem.key);
  if (existingItem) {
    existingItem.qty += nextItem.qty;
  } else {
    cartState.push(nextItem);
  }

  saveCartState();
  renderCart();
}

// 數量加減最少只到 1；如果要刪整筆商品，交給另一個函式處理。
function updateCartItem(key, delta) {
  const targetItem = cartState.find((item) => item.key === key);
  if (!targetItem) return;

  targetItem.qty = Math.max(1, targetItem.qty + delta);
  saveCartState();
  renderCart();
}

// 刪除單一商品整筆資料。
function removeCartItem(key) {
  cartState = cartState.filter((item) => item.key !== key);
  saveCartState();
  renderCart();
}

// 一次清空購物車所有商品。
function clearCart() {
  cartState = [];
  saveCartState();
  renderCart();
}

function addStarterBundle({ openCart = true } = {}) {
  const bundleItem = buildStarterBundleCartItem();
  addCartItem(bundleItem);
  showAddCartFeedback(bundleItem.name);
  if (openCart) setCartOpen(true);
}

let cartFeedbackTimer = null;

function showAddCartFeedback(productName) {
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

  cartCount.classList.remove('is-bumping');
  window.requestAnimationFrame(() => cartCount.classList.add('is-bumping'));

  clearTimeout(cartFeedbackTimer);
  cartFeedbackTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    cartCount.classList.remove('is-bumping');
  }, 1800);
}

// 八、商品列表篩選 / 排序區

// 模糊字串搜尋：完整命中優先，否則只要有任一字元對到也算符合。
function matchesSearchKeyword(keyword, text) {
  const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
  const normalizedText = text.replace(/\s+/g, '').toLowerCase();

  if (normalizedKeyword === '') return true;
  // 先判斷是否有完整連續命中。
  if (normalizedText.includes(normalizedKeyword)) return true;

  // 如果沒有完整命中，只要輸入內容中有任一字元出現在商品文字裡也算符合。
  return [...normalizedKeyword].some((char) => normalizedText.includes(char));
}

// 先做分類與搜尋過濾，再套用目前的排序方式。
function applyFilters() {
  refreshProductsFromDom();
  const keyword = searchInput.value.trim();

  products.forEach((card) => {
    const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
    const text = `${card.dataset.name} ${card.innerText}`;
    const keywordMatch = matchesSearchKeyword(keyword, text);
    card.classList.toggle('hide', !(categoryMatch && keywordMatch));
  });

  applySort();
}

// 只排序目前有顯示的商品；精選推薦模式會回到原本順序。
function applySort() {
  const visibleCards = products.filter((card) => !card.classList.contains('hide'));
  const mode = sortSelect.value;

  visibleCards.sort((a, b) => {
    if (mode === 'featured') return getNumericValue(a, 'order') - getNumericValue(b, 'order');
    if (mode === 'price-low') return getNumericValue(a, 'price') - getNumericValue(b, 'price');
    if (mode === 'price-high') return getNumericValue(b, 'price') - getNumericValue(a, 'price');
    if (mode === 'rating') return getNumericValue(b, 'rating') - getNumericValue(a, 'rating');
    return getNumericValue(a, 'order') - getNumericValue(b, 'order');
  });

  visibleCards.forEach((card) => productGrid.appendChild(card));
}

// 九、事件綁定區

// 上下兩排分類按鈕共用同一套點擊邏輯。
function handleCategoryClick(event) {
  const target = event.target.closest('.category-pill');
  if (!target) return;
  setActiveCategory(target.dataset.category || 'all', { scroll: true });
}

categoryRow.addEventListener('click', handleCategoryClick);

['input', 'keyup', 'change', 'search', 'compositionend'].forEach((eventName) => {
  searchInput.addEventListener(eventName, applyFilters);
});

window.addEventListener('shop-products-rendered', () => {
  refreshProductsFromDom();
  applyFilters();
  renderCart();
});

window.applyShopFilters = applyFilters;
window.refreshShopProductsFromDom = refreshProductsFromDom;

// 排序切換時，重新依目前分類 / 搜尋條件下的商品做排序。
sortSelect.addEventListener('change', () => {
  applyFilters();
  scrollToProducts();
});

bundleCheckoutBtn?.addEventListener('click', () => {
  addStarterBundle({ openCart: false });
  window.location.href = '/Shop/Checkout';
});

// 從商品列表加入購物車，並直接打開右側抽屜。
productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.add-cart-btn');
  if (button) {
    // 阻止按鈕預設行為
    event.preventDefault();
    // 避免點擊事件冒泡到商品卡，導致同時觸發開啟商品詳細頁的行為
    event.stopPropagation();

    // 如果按鈕被禁用（例如庫存不足），就不執行任何動作
    if (button.disabled) return;

    const card = button.closest('.product-card');
    if (!card?.dataset.id) return;

    const stock = Number(card.dataset.stock ?? 0);
    if (stock <= 0) return;

    const cartItem = buildCartItemFromProduct(card.dataset.id);
    addCartItem(cartItem);
    showAddCartFeedback(cartItem?.name);
    setCartOpen(true);
    return;
  }

  const card = event.target.closest('.product-card');
  if (!card?.dataset.id) return;
  openProductDetail(card.dataset.id);
});

// 商品卡支援鍵盤操作，行為更像真正可點擊的商品頁。
productGrid.addEventListener('keydown', (event) => {
  const card = event.target.closest('.product-card');
  if (!card?.dataset.id) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openProductDetail(card.dataset.id);
});

// 用事件代理統一處理購物車內的加、減、刪除按鈕。
summaryList.addEventListener('click', (event) => {
  const button = event.target.closest('.qty-btn');
  const removeButton = event.target.closest('.remove-line-btn');

  if (button) {
    const { key, action } = button.dataset;
    if (action === 'increase') updateCartItem(key, 1);
    if (action === 'decrease') updateCartItem(key, -1);
  }

  if (removeButton) {
    removeCartItem(removeButton.dataset.key);
  }
});

// 控制購物車抽屜開關，同步切換遮罩與主介面的淡化效果。
function setCartOpen(isOpen) {
  shopShell.classList.toggle('is-cart-open', isOpen);
  cartOverlay.classList.toggle('is-open', isOpen);
  cartOverlay.setAttribute('aria-hidden', String(!isOpen));
  cartToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

cartToggle.addEventListener('click', () => {
  setCartOpen(!cartOverlay.classList.contains('is-open'));
});

cartClose.addEventListener('click', () => {
  setCartOpen(false);
});

cartOverlay.addEventListener('click', (event) => {
  if (event.target === cartOverlay) {
    setCartOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setCartOpen(false);
  }
});

clearCartBtn.addEventListener('click', () => {
  clearCart();
});

checkoutBtn.addEventListener('click', () => {
    window.location.href = '/Shop/Checkout';
});

if (backHomeBtn) {
  backHomeBtn.addEventListener('click', scrollToShopTop);
  window.addEventListener('scroll', updateBackHomeButtonVisibility, { passive: true });
  window.addEventListener('wheel', handleBackHomeWheel, { passive: true });
  updateBackHomeButtonVisibility();
}

window.addEventListener('scroll', updateNavbarShrink, { passive: true });
updateNavbarShrink();

// 若從 detail 頁點購物車返回商店，就直接打開右側購物車。
if (sessionStorage.getItem(OPEN_CART_KEY) === '1') {
  sessionStorage.removeItem(OPEN_CART_KEY);
  setCartOpen(true);
}

// 其他頁面若有寫入購物車，回到商店頁時也同步更新。
window.addEventListener('storage', (event) => {
  if (event.key !== CART_STORAGE_KEY) return;
  cartState = readCartState({ seedDefault: false });
  renderCart();
});

// 只有輪播存在時才綁定事件，避免其他頁面載入同支 JS 出錯。
if (heroSlider && heroSlides.length) {
  heroPrev?.addEventListener('click', () => {
    showHeroSlide(currentHeroIndex - 1);
    startHeroSlider();
  });

  heroNext?.addEventListener('click', () => {
    showHeroSlide(currentHeroIndex + 1);
    startHeroSlider();
  });

  heroDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showHeroSlide(Number(dot.dataset.slide || 0));
      startHeroSlider();
    });
  });

  heroSlider.addEventListener('mouseenter', stopHeroSlider);
  heroSlider.addEventListener('mouseleave', startHeroSlider);
  heroSlider.addEventListener('focusin', stopHeroSlider);
  heroSlider.addEventListener('focusout', startHeroSlider);

  showHeroSlide(0);
  startHeroSlider();
}

updateResultsHeader(activeCategory);
syncCategoryButtons(activeCategory);

async function initShopPage() {
    if (typeof window.loadShopProductsFromApi === 'function') {
        await window.loadShopProductsFromApi();
    }

    renderCart();
}

initShopPage();
