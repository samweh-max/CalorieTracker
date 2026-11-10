// Samslimmer — numbers behind the Dashboard, Weight and milestones.
import * as S from './store.js';
import * as F from './foods.js';

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

/* ---------- milestones ----------
   Lots of easy wins early on, then they get spaced out and harder. */
function streakNow() { return S.streak(); }
function counts() {
  let foods = 0, cups = 0, days = 0, protRun = 0, protBest = 0, fibDays = 0, waterDays = 0, onTarget = 0, fv = 0, done = 0, fullDays = 0;
  const plan = S.plan(), p = S.state.profile, goal = (p && p.waterGoal) || 8, today = S.todayKey();
  const keys = Object.keys(S.state.days).sort();
  let prev = null;
  keys.forEach(k => {
    const d = S.state.days[k]; foods += d.entries.length; cups += d.water || 0; if (d.entries.length) days++;
    if (d.done) done++;
    if ((d.water || 0) >= goal) waterDays++;
    const t = S.totals(d.entries);
    const hit = plan && t.p >= plan.p;
    protRun = hit ? (prev && S.addDays(prev, 1) === k ? protRun + 1 : 1) : 0; protBest = Math.max(protBest, protRun); prev = hit ? k : null;
    if (plan && t.fib >= plan.fib) fibDays++;
    if (plan && d.entries.length && (d.done || k < today) && t.kcal >= plan.kcal * 0.85 && t.kcal <= plan.kcal * 1.05) onTarget++;
    if (new Set(d.entries.map(e => e.meal)).size >= 3) fullDays++;
    d.entries.forEach(e => { const c = F.catOf(e.food); if (c === 'fruit' || c === 'veg') fv++; });
  });
  const foodsAll = Object.values(S.state.foods || {});
  return { foods, litres: cups * ((p && p.cupMl) || 250) / 1000, days, protBest, fibDays, waterDays, onTarget, fv, done, fullDays,
    weighins: (S.state.weights || []).length, recipes: foodsAll.filter(f => f.src === 'recipe').length, mine: foodsAll.filter(f => f.src === 'mine').length };
}
// Each series: a value, the steps to hit, and what to say. Old ids are kept so nothing re-celebrates.
function series(c, st) {
  return [
    { key: 'streak', kind: 'streak', sub: n => n + '-day streak', v: st, steps: [
      [2, 'Two days in a row. It\'s a pattern now.'], [3, 'A three-day streak. A hat-trick of honesty.'], [5, 'Five days straight. High five!'], [7, 'A full week logged!'], [10, 'Ten days. Double digits, baby.'],
      [14, 'Two weeks straight.'], [21, 'Three weeks. They say that\'s how habits are made.'], [30, 'A month of logging. Absolute machine.'], [45, '45 days. You don\'t miss.'], [50, '50-day streak.'], [60, 'Two months without missing a day.'],
      [90, '90 days. A whole season of you.'], [100, '100 days. Frame this.'], [150, '150 days. Your phone is proud of you.'], [200, '200 days. Legendary consistency.'], [365, 'A whole year!'], [500, '500 days. Statues have been built for less.']],
      id: n => 'streak' + n, next: (n, left) => left + ' more day' + (left > 1 ? 's' : '') + ' to a ' + n + '-day streak' },
    { key: 'foods', kind: 'log', sub: () => 'Logging total', v: c.foods, steps: [
      [1, 'First food logged. Every journey starts with a bite.'], [10, '10 foods logged. You\'re getting the hang of this.'], [25, '25 foods logged!'], [50, 'You\'ve logged 50 foods.'],
      [100, '100 foods logged — basically a nutrition label now.'], [200, '200 foods logged. Your thumbs are in great shape.'], [250, '250 foods logged!'], [500, '500 foods logged. Legend.'],
      [750, '750 foods. That\'s a lot of lunches.'], [1000, '1,000 foods. The spreadsheet bows to you.'], [1500, '1,500 foods logged!'], [2500, '2,500 foods. A small library of meals.']],
      id: n => 'foods' + n, next: (n, left) => left + ' more food' + (left > 1 ? 's' : '') + ' to ' + n + ' logged' },
    { key: 'days', kind: 'log', sub: () => 'Days logged', v: c.days, steps: [
      [1, 'Day one done. The hardest one!'], [3, 'Three days logged.'], [7, 'Seven days logged in total.'], [14, 'Two weeks of logging.'], [30, '30 days logged.'], [60, '60 days logged.'], [100, '100 days logged!'], [200, '200 days logged.'], [365, 'A year\'s worth of days logged.']],
      id: n => 'days' + n, next: (n, left) => left + ' more day' + (left > 1 ? 's' : '') + ' logged to reach ' + n },
    { key: 'full', kind: 'log', sub: () => 'Full days', v: c.fullDays, steps: [[1, 'First full day: three meals logged!'], [5, 'Five full days of logging.'], [20, '20 full days. Nothing gets past you.'], [60, '60 full days logged.']],
      id: n => 'full' + n, next: (n, left) => left + ' more day' + (left > 1 ? 's' : '') + ' with 3 meals logged' },
    { key: 'done', kind: 'log', sub: () => 'Days marked done', v: c.done, steps: [[1, 'First day marked done. Feels good, right?'], [10, '10 days marked done.'], [50, '50 days marked done.'], [150, '150 days marked done.']],
      id: n => 'done' + n, next: (n, left) => 'Mark ' + left + ' more day' + (left > 1 ? 's' : '') + ' as done' },
    { key: 'water', kind: 'water', sub: () => 'Water total', v: c.litres, steps: [
      [2, 'Two litres of water. Splash!'], [5, 'Five litres. A big paddling pool for a hamster.'], [10, '10 litres of water. That\'s a big bucket.'], [25, '25 litres. A whole water-cooler bottle and then some.'],
      [50, '50 litres of water. You\'re part fish now.'], [100, '100 litres — a full bathtub!'], [175, '175 litres. A garden water butt!'], [250, '250 litres of water. A hot tub\'s worth.'], [500, '500 litres. Half a tonne of water!'], [1000, '1,000 litres. Basically a small pond.']],
      id: n => 'water' + n, next: (n, left) => Math.ceil(left) + ' more litre' + (Math.ceil(left) > 1 ? 's' : '') + ' to ' + n + ' L of water' },
    { key: 'wgoal', kind: 'water', sub: () => 'Water goal', v: c.waterDays, steps: [[1, 'First day hitting your water goal!'], [3, 'Water goal hit three times.'], [7, 'Water goal hit on 7 days.'], [20, 'Water goal hit 20 times.'], [50, 'Water goal hit 50 times. Hydration royalty.'], [100, '100 days of full water. Incredible.']],
      id: n => 'wgoal' + n, next: (n, left) => 'Hit your water goal ' + left + ' more time' + (left > 1 ? 's' : '') },
    { key: 'target', kind: 'target', sub: () => 'On target', v: c.onTarget, steps: [[1, 'First day on target. Nailed it!'], [3, 'Three days on target.'], [7, 'A week\'s worth of on-target days.'], [14, '14 days on target.'], [30, '30 days on target. Machine.'], [60, '60 on-target days.'], [100, '100 days on target!'], [200, '200 on-target days. Unreal.']],
      id: n => 'target' + n, next: (n, left) => left + ' more on-target day' + (left > 1 ? 's' : '') },
    { key: 'prot', kind: 'target', sub: () => 'Hitting targets', v: c.protBest, steps: [[1, 'Protein target hit! Muscles say shukran.'], [3, 'Protein target three days running.'], [7, 'Protein target hit 7 days in a row!'], [14, 'Protein target two weeks in a row!'], [30, 'Protein target hit 30 days running. Built different.']],
      id: n => 'prot' + n, next: (n, left) => 'Protein target ' + n + ' days in a row' },
    { key: 'fib', kind: 'target', sub: () => 'Hitting targets', v: c.fibDays, steps: [[1, 'Fibre goal hit! Your gut is clapping.'], [5, 'Fibre goal hit on 5 days. Your gut says thanks.'], [10, 'Fibre goal hit 10 times.'], [20, 'Fibre goal hit 20 times. Beans are your friend.'], [40, '40 high-fibre days.'], [75, '75 high-fibre days. Gut of steel.'], [150, '150 high-fibre days!']],
      id: n => 'fib' + n, next: (n, left) => 'Hit your fibre goal ' + left + ' more time' + (left > 1 ? 's' : '') },
    { key: 'fv', kind: 'target', sub: () => 'Fruit & veg', v: c.fv, steps: [[1, 'First fruit or veg logged. Popeye approves.'], [10, '10 portions of fruit & veg.'], [30, '30 portions of fruit & veg.'], [75, '75 portions. Basically a market stall.'], [150, '150 portions of fruit & veg!'], [300, '300 portions. A whole greengrocer\'s.'], [600, '600 portions of fruit & veg. Legendary.']],
      id: n => 'fv' + n, next: (n, left) => left + ' more fruit or veg to ' + n },
    { key: 'weigh', kind: 'weight', sub: () => 'Weigh-ins', v: c.weighins, steps: [[1, 'First weigh-in done. Now we have a starting line.'], [5, 'Five weigh-ins.'], [12, '12 weigh-ins. Very scientific.'], [30, '30 weigh-ins.'], [75, '75 weigh-ins. The scales know you well.']],
      id: n => 'weigh' + n, next: (n, left) => left + ' more weigh-in' + (left > 1 ? 's' : '') },
    { key: 'cook', kind: 'log', sub: () => 'Cooking', v: c.recipes, steps: [[1, 'First recipe saved. Chef Samer!'], [5, 'Five recipes saved. Cookbook loading…'], [15, '15 recipes. Open a restaurant.']],
      id: n => 'cook' + n, next: (n, left) => left + ' more recipe' + (left > 1 ? 's' : '') + ' to save' }
  ];
}
export function allMilestones() {
  const out = [];
  const c = counts(), st = Math.max(streakNow(), S.bestStreak());
  series(c, st).forEach(s => s.steps.forEach(([n, t]) => { if (s.v >= n) out.push({ id: s.id(n), kind: s.kind, text: t, sub: s.sub(n) }); }));
  if (S.state.profile) {
    const j = journey();
    if (!j.maintaining) {
      const L = j.losing ? LOSE_THINGS : GAIN_THINGS, verb = j.losing ? 'gone' : 'gained';
      // every "thing" up to the goal, plus 10 / 25 / 50 / 75 % of the way
      L.forEach(([kg, name]) => { if (kg < j.total - 0.05 && j.progress >= kg - 0.05) out.push({ id: 'w' + (j.losing ? 'l' : 'g') + kg, kind: 'weight', text: g1(kg) + ' kg ' + verb + ' — that\'s ' + name + '!', sub: 'Weight journey' }); });
      [[0.1, 'Ten percent of the way there!'], [0.25, 'A quarter of the way to your goal!'], [0.5, 'HALFWAY! Downhill from here.'], [0.75, 'Three quarters done. Smell the finish line.']]
        .forEach(([f, t]) => { if (j.total * f >= 0.5 && j.progress >= j.total * f - 0.05) out.push({ id: 'wp' + f, kind: 'weight', text: t, sub: 'Weight journey' }); });
      if (j.progress >= j.total - 0.05) out.push({ id: 'w' + (j.losing ? 'l' : 'g') + j.total, kind: 'weight', text: 'GOAL REACHED! ' + g1(j.total) + ' kg ' + verb + '!', sub: 'Weight journey' });
    }
  }
  return out;
}
// The closest things to unlock next, to keep you going.
export function nextMilestones(n = 2) {
  const c = counts(), st = streakNow();
  const out = [];
  series(c, st).forEach(s => {
    const step = s.steps.find(([k]) => s.v < k); if (!step) return;
    const prevStep = s.steps.filter(([k]) => k <= s.v).pop();
    const from = prevStep ? prevStep[0] : 0, frac = (s.v - from) / (step[0] - from);
    const left = step[0] - s.v;
    out.push({ kind: s.kind, text: s.next(step[0], s.key === 'water' ? left : Math.ceil(left)), frac: Math.max(0, Math.min(1, frac)), left });
  });
  return out.sort((a, b) => b.frac - a.frac).slice(0, n);
}
function g1(n) { const v = Math.round(n * 10) / 10; return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1); }

// Returns milestones reached since last time, and remembers them.
export function newMilestones() {
  const all = allMilestones();
  const seen = S.state.milestones || (S.state.milestones = {});
  if (S.state.milestonesInit && S.state.msVer !== 2) { all.forEach(m => { if (!seen[m.id]) seen[m.id] = S.todayKey(); }); S.state.msVer = 2; S.save(); return []; }
  S.state.msVer = 2;
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
