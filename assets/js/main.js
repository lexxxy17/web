// Utility: localStorage cart
const CART_KEY = 'cartItems';
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }
function updateCartCount() {
  const n = getCart().reduce((acc, it) => acc + (it.qty || 1), 0);
  const el = qs('#cart-count');
  if (el) el.textContent = String(n);
}

function setActiveNav() {
  const page = document.body.getAttribute('data-page');
  qsa('.nav a').forEach(a => {
    const link = a.getAttribute('data-link');
    if (link === page) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    } else {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });
}

// Shop page: add to cart
function initShop() {
  const grid = qs('#product-grid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    const name = card.getAttribute('data-name');
    const price = Number(card.getAttribute('data-price')) || 0;
    const items = getCart();
    const found = items.find(i => i.id === id);
    if (found) found.qty += 1; else items.push({ id, name, price, qty: 1 });
    saveCart(items);
    updateCartCount();
    btn.textContent = 'Добавлено!';
    setTimeout(() => (btn.textContent = 'В корзину'), 900);
  });
}

// Cart page rendering
function money(n) { return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; }
function renderCart() {
  const list = qs('#cart-items');
  if (!list) return;
  let items = getCart();
  const empty = qs('#cart-empty');
  const summary = qs('#cart-summary');

  if (!items.length) {
    list.innerHTML = '';
    empty?.classList.remove('hidden');
    summary?.classList.add('hidden');
    return;
  }

  empty?.classList.add('hidden');
  summary?.classList.remove('hidden');

  list.innerHTML = items.map(it => `
    <div class="cart-item" data-id="${it.id}">
      <div>
        <div><strong>${it.name}</strong></div>
        <div class="muted">${money(it.price)}</div>
      </div>
      <div class="qty">
        <button class="dec" aria-label="Уменьшить">−</button>
        <input class="q" type="text" inputmode="numeric" value="${it.qty}" aria-label="Количество" />
        <button class="inc" aria-label="Увеличить">+</button>
      </div>
      <div><strong>${money(it.qty * it.price)}</strong></div>
      <div><button class="btn remove">Удалить</button></div>
    </div>
  `).join('');

  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const totalEl = qs('#cart-total');
  if (totalEl) totalEl.textContent = money(total);

  list.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const id = row.getAttribute('data-id');
    let items = getCart();
    const index = items.findIndex(i => i.id === id);
    if (index < 0) return;
    if (e.target.closest('.remove')) { items.splice(index, 1); }
    if (e.target.closest('.inc')) { items[index].qty += 1; }
    if (e.target.closest('.dec')) { items[index].qty = Math.max(1, items[index].qty - 1); }
    saveCart(items);
    updateCartCount();
    renderCart();
  });

  list.addEventListener('change', (e) => {
    const input = e.target.closest('.q');
    if (!input) return;
    const row = e.target.closest('.cart-item');
    const id = row.getAttribute('data-id');
    let items = getCart();
    const index = items.findIndex(i => i.id === id);
    let val = parseInt(input.value.replace(/\D+/g, ''), 10);
    if (!Number.isFinite(val) || val <= 0) val = 1;
    items[index].qty = val;
    saveCart(items);
    updateCartCount();
    renderCart();
  });

  qs('#clear-cart')?.addEventListener('click', () => {
    saveCart([]); updateCartCount(); renderCart();
  });
  qs('#checkout')?.addEventListener('click', () => {
    alert('Демо: оформление заказа не реализовано.');
  });
}

// Contacts validation
function initContactsForm() {
  const form = qs('#contact-form');
  if (!form) return;
  const name = qs('#name');
  const email = qs('#email');
  const phone = qs('#phone');
  const msg = qs('#message');
  const success = qs('#form-success');

  const show = (id, text) => { const el = qs('#error-' + id); if (el) el.textContent = text || ''; };
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const phoneRx = /^\+?\d[\d\s\-()]{7,}$/;

  function validateName() {
    const v = name.value.trim();
    if (v.length < 2) { show('name', 'Введите имя (мин. 2 символа)'); return false; }
    show('name', ''); return true;
  }
  function validateEmail() {
    const v = email.value.trim();
    if (!emailRx.test(v)) { show('email', 'Введите корректный email'); return false; }
    show('email', ''); return true;
  }
  function validatePhone() {
    const v = phone.value.trim();
    if (!v) { show('phone', ''); return true; }
    if (!phoneRx.test(v)) { show('phone', 'Введите телефон в международном формате'); return false; }
    show('phone', ''); return true;
  }
  function validateMsg() {
    const v = msg.value.trim();
    if (v.length < 10) { show('message', 'Сообщение слишком короткое (мин. 10 символов)'); return false; }
    show('message', ''); return true;
  }

  name.addEventListener('input', validateName);
  email.addEventListener('input', validateEmail);
  phone.addEventListener('input', validatePhone);
  msg.addEventListener('input', validateMsg);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = [validateName(), validateEmail(), validatePhone(), validateMsg()].every(Boolean);
    if (!ok) return;
    success?.classList.remove('hidden');
    // Demo: persist request
    const reqs = JSON.parse(localStorage.getItem('contactRequests') || '[]');
    reqs.push({ name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), message: msg.value.trim(), ts: Date.now() });
    localStorage.setItem('contactRequests', JSON.stringify(reqs));
    form.reset();
    updateCartCount();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  updateCartCount();
  initShop();
  renderCart();
  initContactsForm();
});
