

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

