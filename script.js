// Constants and DOM references
const STORAGE_KEY = 'calorieItems_v1';
const COOKIE_KEY = 'calorieItemsBackup';
const foodForm = document.getElementById('foodForm');
const foodNameInput = document.getElementById('foodName');
const foodCaloriesInput = document.getElementById('foodCalories');
const foodList = document.getElementById('foodList');
const totalCaloriesEl = document.getElementById('totalCalories');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const clearCookiesBtn = document.getElementById('clearCookies');
const lastSavedEl = document.getElementById('lastSaved');
const progressPath = document.getElementById('ringProgress');
const themeToggle = document.getElementById('themeToggle');

let items = loadItems();
let dailyGoal = 2000; // default goal


// Utility helpers
function readCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}
function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// Persistence
function saveItems(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  try {
    setCookie(COOKIE_KEY, JSON.stringify(list.slice(-10)), 7);
  } catch (e) {}
  lastSavedEl.textContent = `Saved ${formatTime(Date.now())}`;
}
function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  const cookie = readCookie(COOKIE_KEY);
  if (cookie) {
    try { return JSON.parse(cookie); } catch (e) {}
  }
  return [];
}


// Fetch simulation for calorie estimates
async function fetchCalorieEstimate(foodName) {
  const endpoint = `https://api.example.com/calories?food=${encodeURIComponent(foodName)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1400);

  try {
    const resp = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error('Bad response');
    const data = await resp.json();
    if (data && typeof data.calories === 'number') return Math.round(data.calories);
    throw new Error('Unexpected payload');
  } catch (err) {
    const name = foodName.toLowerCase();
    if (name.includes('banana')) return 105;
    if (name.includes('apple')) return 95;
    if (name.includes('egg')) return 78;
    if (name.includes('bread')) return 80;
    const words = name.split(/\s+/).filter(Boolean).length || 1;
    const avgLen = Math.max(3, Math.round(name.replace(/\s+/g, '').length / words));
    return Math.max(20, Math.round(50 + 10 * words + 2 * avgLen));
  }
}


// UI helpers
function updateProgressRing(total) {
  const pct = Math.min(100, Math.round((total / dailyGoal) * 100));
  const dash = `${pct} ${100 - pct}`;
  progressPath.setAttribute('stroke-dasharray', dash);
}
function updateTotal() {
  const total = items.reduce((s, it) => s + Number(it.calories || 0), 0);
  totalCaloriesEl.textContent = total;
  totalCaloriesEl.classList.remove('total-pulse');
  void totalCaloriesEl.offsetWidth;
  totalCaloriesEl.classList.add('total-pulse');
  updateProgressRing(total);
}


// Rendering
function renderList() {
  foodList.innerHTML = '';
  if (items.length === 0) {
    foodList.innerHTML = `<li class="text-center text-slate-400 py-6">No foods yet — add something tasty.</li>`;
    updateTotal();
    return;
  }

  items.slice().reverse().forEach(item => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-white';
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 font-semibold">${escapeHtml(String(item.calories))}</div>
        <div>
          <div class="font-medium text-slate-800">${escapeHtml(item.name)}</div>
          <div class="text-xs text-slate-400">Added ${new Date(item.addedAt).toLocaleTimeString()}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="editBtn text-slate-500 hover:text-rose-600" data-id="${item.id}">Edit</button>
        <button class="removeBtn text-rose-600 font-semibold" data-id="${item.id}">Remove</button>
      </div>
    `;
    foodList.appendChild(li);
  });

  foodList.querySelectorAll('.removeBtn').forEach(btn => {
    btn.addEventListener('click', (e) => removeItem(e.currentTarget.dataset.id));
  });
  foodList.querySelectorAll('.editBtn').forEach(btn => {
    btn.addEventListener('click', (e) => editItemPrompt(e.currentTarget.dataset.id));
  });

  updateTotal();
}


// CRUD operations
async function addItem(name, calories = null) {
  const id = crypto.randomUUID();
  const addedAt = Date.now();
  let cal = calories;
  if (cal === null || cal === '' || Number.isNaN(Number(cal))) {
    const placeholder = { id, name, calories: '…', addedAt };
    items.push(placeholder);
    saveItems(items);
    renderList();
    cal = await fetchCalorieEstimate(name);
    items = items.map(it => it.id === id ? { ...it, calories: cal } : it);
  } else {
    cal = Math.max(0, Math.round(Number(cal)));
    items.push({ id, name, calories: cal, addedAt });
  }
  saveItems(items);
  renderList();
}
function removeItem(id) {
  items = items.filter(it => it.id !== id);
  saveItems(items);
  renderList();
}
function editItemPrompt(id) {
  const item = items.find(it => it.id === id);
  if (!item) return;
  const newName = prompt('Edit food name:', item.name);
  if (newName === null) return;
  const newCaloriesRaw = prompt('Edit calories leave blank to re-estimate:', item.calories);
  if (newCaloriesRaw === null) return;
  if (newCaloriesRaw.trim() === '') {
    addItem(newName, null);
    items = items.filter(it => it.id !== id);
  } else {
    item.name = newName;
    item.calories = Math.max(0, Math.round(Number(newCaloriesRaw)));
  }
  saveItems(items);
  renderList();
}
function resetAll() {
  if (!confirm('Reset all items for today? This cannot be undone.')) return;
  items = [];
  saveItems(items);
  renderList();
  deleteCookie(COOKIE_KEY);
  lastSavedEl.textContent = 'Reset now';
}


// Event listeners
foodForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = foodNameInput.value.trim();
  const calories = foodCaloriesInput.value.trim();
  if (!name) {
    alert('Please enter a food name.');
    return;
  }
  await addItem(name, calories === '' ? null : Number(calories));
  foodNameInput.value = '';
  foodCaloriesInput.value = '';
  foodNameInput.focus();
});

resetBtn.addEventListener('click', resetAll);

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(items, null, 2);
  navigator.clipboard.writeText(data).then(() => {
    alert('JSON copied to clipboard. Paste into a file to save.');
  }).catch(() => {
    const w = window.open();
    w.document.write(`<pre>${escapeHtml(data)}</pre>`);
  });
});

clearCookiesBtn.addEventListener('click', () => {
  deleteCookie(COOKIE_KEY);
  alert('Cookies cleared.');
  lastSavedEl.textContent = 'Cookies cleared';
});

themeToggle.addEventListener('click', () => {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  if (current === 'dark') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', 'dark');
  }
});

// Initialization
renderList();
updateTotal();
