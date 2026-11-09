// Samslimmer — numbers behind the Dashboard, Weight and milestones.
import * as S from './store.js';

/* ---------- ranges ---------- */
export const RANGES = { week: 7, month: 30, m3: 91, year: 365 };
export function rangeKeys(range) {
  const today = S.todayKey();
  let n = RANGES[range];
  if (!n) { // "all": from the first thing ever logged
    const ks = Object.keys(S.state.days).filter(k => S.state.days[k].entries.length || S.state.days[k].done).sort();
    const first = [ks[0], S.state.profile && S.state.profile.created, S.state.weights.length ? S.state.weights.map(w => w[0]).sort()[0] : null].filter(Boolean).sort()[0] || today;
    n = Math.max(7, Math.round((S.parseKey(today) - S.parseKey(first)) / 864e5) + 1);
  }
  return Array.from({ length: n }, (_, i) => S.addDays(today, i - n + 1));
}

export function dayKcal(k) { return S.totals(S.peekDay(k).entries).kcal; }

/* ---------- streak calendar: last 5 weeks, Monday first ---------- */
export function streakCells() {
  const t = S.todayKey(), d = S.parseKey(t), dow = (d.getDay() + 6) % 7;
  const start = S.addDays(t, -dow - 28);
  return Array.from({ length: 35 }, (_, i) => {
    const k = S.addDays(start, i), dd = S.peekDay(k);
    return { k, future: k > t, today: k === t, done: dd.done, logged: dd.entries.length > 0 };
  });
}

/* ---------- weight ---------- */
export function weightsSorted() { return S.state.weights.slice().sort((a, b) => a[0] < b[0] ? -1 : 1); }

const LOSE_THINGS = [[0.5, 'a bag of pasta'], [1, 'a pineapple'], [2, 'a newborn lamb'], [3, 'an Atlantic salmon'], [4, 'a house cat'], [5, 'a Christmas turkey'], [7, 'a bowling ball'], [10, 'a corgi'], [12, 'a car tyre'], [15, 'a Border collie'], [20, 'a sack of potatoes'], [25, 'a fully grown Labrador'], [30, 'a baby elephant\'s leg… roughly'], [40, 'a giant panda cub']];
const GAIN_THINGS = [[0.5, 'a bag of pasta'], [1, 'a bag of flour'], [2, 'two bags of sugar'], [3, 'a watermelon'], [5, 'a Christmas turkey'], [7, 'a bowling ball'], [10, 'a corgi'], [15, 'a car tyre'], [20, 'a sack of potatoes']];
export function thingFor(kg, gaining) {
  const L = gaining ? GAIN_THINGS : LOSE_THINGS;
  let best = null; L.forEach(t => { if (kg >= t[0] - 0.05) best = t; });
  return best;
}
const SMALL = [[0.1, 'an apple'], [0.2, 'a banana or two'], [0.4, 'a tin of beans'], [0.5, 'a bag of pasta'], [0.8, 'a bag of rice'], [1, 'a pineapple'], [1.5, 'a bag of sugar and change'], [2, 'a newborn lamb']];
export function smallThing(kg) { let b = SMALL[0][1]; SMALL.forEach(t => { if (kg >= t[0] - 0.04) b = t[1]; }); return b; }

// The journey bar from start weight to goal weight.
export function journey() {
  const p = S.state.profile;
  const start = p.startKg, goal = p.gkg, now = S.latestWeight();
  const losing = goal < start - 0.05, total = Math.abs(goal - start);
  const progress = losing ? start - now : now - start; // positive = towards goal
  const L = losing ? LOSE_THINGS : GAIN_THINGS;
  // Pick markers spread out along the bar so their labels never collide.
  const marks = [];
  L.forEach(t => {
    const pos = t[0] / total, last = marks.length ? marks[marks.length - 1].kg / total : 0;
    if (pos >= 0.08 && pos <= 0.86 && pos - last >= 0.16) marks.push({ kg: t[0], name: t[1] });
  });
  marks.push({ kg: total, name: 'goal', goal: true });
  return { start, goal, now, losing, total, progress, marks, maintaining: total < 0.1 };
}

/* ---------- food ratings ---------- */
// For every food logged on 5+ days, how often those days ended over target.
export function foodRatings(minDays = 5) {
  const plan = S.plan(); if (!plan) return {};
  const today = S.todayKey();
  const per = {};
  Object.keys(S.state.days).forEach(k => {
    if (k === today) return; // today isn't finished yet
    const d = S.state.days[k]; if (!d.entries.length) return;
    const over = S.totals(d.entries).kcal > plan.kcal * 1.02;
    const seen = new Set();
    d.entries.forEach(e => {
      const id = e.food.recipeId || e.food.id;
      if (seen.has(id)) return; seen.add(id);
      const r = per[id] || (per[id] = { id, name: e.food.name, food: e.food, days: 0, over: 0, kcal: 0 });
      r.days++; if (over) r.over++; r.kcal += e.n.kcal;
    });
  });
  const out = {};
  Object.values(per).forEach(r => {
    if (r.days < minDays) return;
    const share = r.over / r.days;
    r.avgKcal = r.kcal / r.days;
    r.verdict = share >= 0.6 ? 'bad' : share <= 0.25 ? 'good' : 'mixed';
    r.note = r.verdict === 'bad' ? `Eating this usually takes you over your limit (${r.over} of ${r.days} days)`
      : r.verdict === 'good' ? `This helps you stay on track (on target ${r.days - r.over} of ${r.days} days)`
      : `Mixed — over on ${r.over} of ${r.days} days`;
    out[r.id] = r;
  });
  return out;
}
let ratingCache = null, ratingStamp = '';
export function ratingFor(food) {
  const stamp = Object.keys(S.state.days).length + ':' + JSON.stringify(Object.values(S.state.days).map(d => d.entries.length).reduce((a, b) => a + b, 0)) + ':' + S.todayKey();
  if (!ratingCache || stamp !== ratingStamp) { ratingCache = foodRatings(); ratingStamp = stamp; }
  return ratingCache[food.recipeId || food.id] || null;
}

/* ---------- milestones ---------- */
function streakNow() { return S.streak(); }
function counts() {
  let foods = 0, cups = 0, days = 0, protRun = 0, protBest = 0, fibDays = 0;
  const plan = S.plan(), p = S.state.profile;
  const keys = Object.keys(S.state.days).sort();
  let prev = null;
  keys.forEach(k => {
    const d = S.state.days[k]; foods += d.entries.length; cups += d.water || 0; if (d.entries.length) days++;
    const t = S.totals(d.entries);
    const hit = plan && t.p >= plan.p;
    protRun = hit ? (prev && S.addDays(prev, 1) === k ? protRun + 1 : 1) : 0; protBest = Math.max(protBest, protRun); prev = hit ? k : null;
    if (t.fib >= 30) fibDays++;
  });
  return { foods, litres: cups * ((p && p.cupMl) || 250) / 1000, days, protBest, fibDays };
}
export function allMilestones() {
  const out = [];
  const c = counts(), st = Math.max(streakNow(), S.bestStreak());
  [[3, 'A three-day streak. A hat-trick of honesty.'], [7, 'A full week logged!'], [14, 'Two weeks straight.'], [30, 'A month of logging. Absolute machine.'], [50, '50-day streak.'], [100, '100 days. Frame this.'], [365, 'A whole year!']]
    .forEach(([n, t]) => { if (st >= n) out.push({ id: 'streak' + n, kind: 'streak', text: t, sub: n + '-day streak' }); });
  [[50, 'You\'ve logged 50 foods.'], [100, '100 foods logged — basically a nutrition label now.'], [250, '250 foods logged!'], [500, '500 foods logged. Legend.'], [1000, '1,000 foods. The spreadsheet bows to you.']]
    .forEach(([n, t]) => { if (c.foods >= n) out.push({ id: 'foods' + n, kind: 'log', text: t, sub: 'Logging total' }); });
  [[10, '10 litres of water. That\'s a big bucket.'], [50, '50 litres of water. You\'re part fish now.'], [100, '100 litres — a full bathtub!'], [250, '250 litres of water. A hot tub\'s worth.']]
    .forEach(([n, t]) => { if (c.litres >= n) out.push({ id: 'water' + n, kind: 'water', text: t, sub: 'Water total' }); });
  [[3, 'Protein target three days running.'], [7, 'Protein target hit 7 days in a row!']]
    .forEach(([n, t]) => { if (c.protBest >= n) out.push({ id: 'prot' + n, kind: 'target', text: t, sub: 'Hitting targets' }); });
  [[5, 'Fibre goal hit on 5 days. Your gut says thanks.'], [20, 'Fibre goal hit 20 times. Beans are your friend.']]
    .forEach(([n, t]) => { if (c.fibDays >= n) out.push({ id: 'fib' + n, kind: 'target', text: t, sub: 'Hitting targets' }); });
  if (S.state.profile) {
    const j = journey();
    if (!j.maintaining) j.marks.forEach(m => { if (j.progress >= m.kg - 0.05) out.push({ id: 'w' + (j.losing ? 'l' : 'g') + m.kg, kind: 'weight', text: m.goal ? 'GOAL REACHED! ' + g1(j.total) + ' kg ' + (j.losing ? 'gone' : 'gained') + '!' : g1(m.kg) + ' kg ' + (j.losing ? 'gone' : 'gained') + ' — that\'s ' + m.name + '!', sub: 'Weight journey' }); });
  }
  return out;
}
function g1(n) { const v = Math.round(n * 10) / 10; return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1); }

// Returns milestones reached since last time, and remembers them.
export function newMilestones() {
  const all = allMilestones();
  const seen = S.state.milestones || (S.state.milestones = {});
  const first = Object.keys(seen).length === 0 && all.length > 0 && !S.state.milestonesInit;
  const fresh = all.filter(m => !seen[m.id]);
  fresh.forEach(m => { seen[m.id] = S.todayKey(); });
  S.state.milestonesInit = true;
  if (fresh.length) S.save();
  return first ? [] : fresh;
}
export function recentMilestones(n = 3) {
  const seen = S.state.milestones || {};
  return allMilestones().reverse().filter(m => seen[m.id]).sort((a, b) => (seen[b.id] > seen[a.id] ? 1 : seen[b.id] < seen[a.id] ? -1 : 0)).slice(0, n).map(m => Object.assign({ when: seen[m.id] }, m));
}
