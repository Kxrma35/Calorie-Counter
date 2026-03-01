
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
let dailyGoal = 2000; 


