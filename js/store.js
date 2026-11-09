// Samslimmer — data store. Everything lives in this browser's localStorage.
const KEY = 'samslimmer.v1';
export const LB = 2.20462;

function blank() {
  return { v: 1, profile: null, days: {}, foods: {}, recents: [], weights: [], settings: { theme: 'auto' } };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) return Object.assign(blank(), s);
    }
  } catch (e) { /* storage unavailable */ }
  return blank();
}

export const state = load();
export let storageOk = true;

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }
  catch (e) { storageOk = false; console.warn('Could not save', e); }
}

export function resetAll() {
  const b = blank();
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, b);
  save();
}

/* ---------- dates ---------- */
export function keyOf(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function todayKey() { return keyOf(new Date()); }
export function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
export const DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function prettyDate(k) {
  const t = todayKey();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  if (k === addDays(t, 1)) return 'Tomorrow';
  const d = parseKey(k);
  return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()];
}
export function longDate(k) { const d = parseKey(k); return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()]; }

/* ---------- days ---------- */
const EMPTY = () => ({ entries: [], water: 0, done: false });
export function day(k) { return state.days[k] || (state.days[k] = EMPTY()); }
export function peekDay(k) { return state.days[k] || EMPTY(); }

export const NUTS = ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'sat', 'salt'];
export function totals(entries) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, salt: 0 };
  entries.forEach(e => NUTS.forEach(n => { t[n] += (e.n && e.n[n]) || 0; }));
  return t;
}

export function streak() {
  let k = todayKey(), n = 0;
  if (!peekDay(k).done) k = addDays(k, -1);
  while (peekDay(k).done) { n++; k = addDays(k, -1); }
  return n;
}
export function bestStreak() {
  const keys = Object.keys(state.days).filter(k => state.days[k].done).sort();
  let best = 0, run = 0, prev = null;
  keys.forEach(k => { run = prev && addDays(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  return best;
}

/* ---------- weight ---------- */
export function latestWeight() {
  if (state.weights.length) return state.weights.slice().sort((a, b) => a[0] < b[0] ? 1 : -1)[0][1];
  return state.profile ? state.profile.startKg : 75;
}

/* ---------- targets ---------- */
export const ACT = [
  [1.2, 'Mostly sitting', 'Desk job, not much exercise'],
  [1.375, 'Lightly active', 'On your feet some of the day, or light exercise 1–3 days a week'],
  [1.55, 'Active', 'On your feet a lot, or exercise 3–5 days a week'],
  [1.725, 'Very active', 'Physical job or hard exercise 6–7 days a week']
];
export const PRESETS = {
  bal: { label: 'Balanced', p: 30, c: 40, f: 30 },
  hp: { label: 'High protein', p: 35, c: 35, f: 30 },
  lc: { label: 'Low carb', p: 30, c: 25, f: 45 }
};

export function calcPlan(p, kgNow) {
  const kg = kgNow != null ? kgNow : p.startKg;
  const bmr = 10 * kg + 6.25 * p.hcm - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * ACT[p.act][0];
  const floor = p.sex === 'm' ? 1500 : 1200;
  const calc = Math.round((tdee + p.pace * 1100) / 10) * 10;
  const kcal = p.own ? p.ownKcal : Math.max(calc, floor);
  const pr = p.preset === 'custom' && p.custom ? p.custom : PRESETS[p.preset] || PRESETS.bal;
  return {
    tdee, floor, calc, floorHit: !p.own && calc < floor, kcal,
    p: Math.round(kcal * pr.p / 100 / 4), c: Math.round(kcal * pr.c / 100 / 4), f: Math.round(kcal * pr.f / 100 / 9),
    fib: 30
  };
}
export function plan() { return state.profile ? calcPlan(state.profile, latestWeight()) : null; }

/* ---------- food library ---------- */
export function rememberFood(food) {
  state.foods[food.id] = Object.assign({}, food, { used: (state.foods[food.id] && state.foods[food.id].used || 0) + 1 });
  state.recents = [food.id].concat(state.recents.filter(id => id !== food.id)).slice(0, 40);
}

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export function meals() {
  const p = state.profile;
  return (p && p.meals) || ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
}
