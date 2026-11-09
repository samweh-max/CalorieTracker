// Samslimmer — main app
import * as S from './store.js';
import * as F from './foods.js';
import { startScanner, validBarcode } from './scan.js';

const $app = document.getElementById('app');
const $ov = document.getElementById('overlay');
const $toast = document.getElementById('toast-root');

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-GB');
const g1 = n => { const v = Math.round(n * 10) / 10; return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtAmt = n => String(Math.round(n * 100) / 100);
const WEIGHTY = ['g', 'ml', 'oz', 'fl oz'];

const svg = (d, o = {}) => `<svg width="${o.s || 22}" height="${o.s || 22}" viewBox="0 0 24 24" fill="none" stroke="${o.c || 'currentColor'}" stroke-width="${o.w || 2.2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  home: o => svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', o),
  chart: o => svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', o),
  search: o => svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', o),
  scale: o => svg('<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M9 10a3 3 0 0 1 6 0M12 10l1.5-2"/>', o),
  user: o => svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', o),
  flame: o => svg('<path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 1-3 6a6 6 0 0 0 12 0c0-6-6-8-6-12z"/>', o),
  plus: o => svg('<path d="M12 5v14M5 12h14"/>', o),
  minus: o => svg('<path d="M5 12h14"/>', o),
  pot: o => svg('<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/>', o),
  back: o => svg('<path d="M15 5l-7 7 7 7"/>', o),
  next: o => svg('<path d="M9 5l7 7-7 7"/>', o),
  check: o => svg('<path d="M5 12l5 5L20 7"/>', o),
  x: o => svg('<path d="M6 6l12 12M18 6L6 18"/>', o),
  scan: o => svg('<path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M17 8v8"/>', o),
  globe: o => svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', o),
  apple: o => svg('<path d="M12 7c-3-2-8-1-8 5 0 5 3 9 5 9 1 0 2-.6 3-.6s2 .6 3 .6c2 0 5-4 5-9 0-6-5-7-8-5z"/><path d="M12 7c0-2 1-4 3-4"/>', o),
  moon: o => svg('<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>', o),
  trash: o => svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', o)
};
const cupSvg = (on) => `<svg width="26" height="32" viewBox="0 0 26 32" aria-hidden="true"><path d="M3 3h20l-2.5 26h-15z" fill="${on ? 'var(--water)' : 'var(--card)'}" stroke="${on ? 'var(--water-line)' : '#D3D9DB'}" stroke-width="2" stroke-linejoin="round"/></svg>`;

function toast(head, sub = '', cls = '') {
  $toast.innerHTML = `<div class="toast ${cls}"><b>${esc(head)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => { $toast.innerHTML = ''; }, 3000);
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.id = 'confetti';
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.appendChild(c);
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  const cols = ['#5FA39B', '#F97316', '#6366F1', '#EAB308', '#10B981', '#7DB9E8'];
  const ps = Array.from({ length: 130 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[Math.random() * cols.length | 0] }));
  const t0 = performance.now();
  (function f(t) {
    const el = t - t0; x.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach(p => { p.vy += 0.38; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.globalAlpha = Math.max(0, 1 - el / 1800); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (el < 1800) requestAnimationFrame(f); else c.remove();
  })(t0);
}

/* ---------------- UI state ---------------- */
const ui = {
  view: S.state.profile ? 'today' : 'setup',
  date: S.todayKey(),
  meal: null, q: '', tab: 'all',
  online: { q: '', status: 'idle', items: [], cnf: [] },
  lastView: null, ringPrev: 603.2, barsPrev: {},
  su: null
};
let sheet = null;   // the open bottom sheet
let pad = null;     // the open number pad

function defaultMeal() {
  const h = new Date().getHours(), ms = S.meals();
  const m = h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 17 ? 'Snacks' : h < 21 ? 'Dinner' : 'Snacks';
  return ms.indexOf(m) >= 0 ? m : ms[0];
}

/* ---------------- number pad ---------------- */
// pad = { id, buf, dec, maxInt, apply(value), rerender() }
function openPad(id, opts) {
  pad = Object.assign({ id, buf: '', dec: 1, maxInt: 4, fresh: true }, opts);
}
function padHtml(still) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  return `<div class="pad ${still ? 'still' : ''}" role="group" aria-label="Number pad">${keys.map(k =>
    `<button type="button" data-a="padkey" data-k="${k}" class="${k === '.' || k === 'del' ? 'alt' : ''}" aria-label="${k === 'del' ? 'Delete' : k === '.' ? 'Decimal point' : k}" ${k === '.' && !pad.dec ? 'disabled style="opacity:.35"' : ''}>${k === 'del' ? '⌫' : k}</button>`).join('')}
    <button type="button" data-a="paddone" class="done">${esc(pad.doneLabel || 'Done')}</button></div>`;
}
function padKey(k) {
  if (!pad) return;
  let b = pad.buf;
  if (k === 'del') b = b.slice(0, -1);
  else if (k === '.') { if (!pad.dec || b.indexOf('.') >= 0) return; b = (b || '0') + '.'; }
  else {
    const [i, d] = b.split('.');
    if (d != null && d.length >= pad.dec) return;
    if (d == null && (i || '').length >= pad.maxInt) return;
    b = b === '0' && !pad.raw ? k : b + k;
  }
  pad.buf = b; pad.fresh = false;
  const v = parseFloat(b);
  pad.apply(isNaN(v) ? 0 : v, b);
  pad.rerender(true);
}
function padShown(id) { return pad && pad.id === id ? (pad.buf === '' ? '0' : pad.buf) : null; }

/* ---------------- rendering ---------------- */
function render() {
  const anim = ui.view !== ui.lastView;
  ui.lastView = ui.view;
  $app.className = anim ? 'anim' : '';
  $app.innerHTML = (VIEWS[ui.view] || VIEWS.today)();
  afterRender[ui.view] && afterRender[ui.view](anim);
}
function go(v) {
  if (v !== 'setup' && !S.state.profile) v = 'setup';
  ui.view = v; closeSheet(true);
  if (v !== 'recipe' && !(v === 'foods' && ui.pick)) ui.pick = null;
  if (v === 'foods') { ui.q = ''; ui.tab = 'all'; ui.online = { q: '', status: 'idle', items: [], cnf: [] }; }
  try { if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v); } catch (e) {}
  render(); window.scrollTo(0, 0);
}

function nav(on) {
  const it = [['today', 'Today', I.home], ['dash', 'Dashboard', I.chart], ['foods', 'Foods', I.search], ['weight', 'Weight', I.scale], ['me', 'Me', I.user]];
  return `<nav class="nav" aria-label="Main">${it.map(([k, l, ic]) => `<a href="#${k}" data-a="go" data-v="${k}" class="${on === k ? 'on' : ''}" ${on === k ? 'aria-current="page"' : ''}>${ic()}${l}</a>`).join('')}</nav>`;
}

/* ================= TODAY ================= */
function weekKeys(k) {
  const d = S.parseKey(k), dow = (d.getDay() + 6) % 7; // Monday first
  const mon = S.addDays(k, -dow);
  return Array.from({ length: 7 }, (_, i) => S.addDays(mon, i));
}

function amountText(e) {
  const u = e.food.units[e.unit] || { short: 'g' };
  const plain = ['g', 'ml', 'oz', 'fl oz'].indexOf(u.short) >= 0;
  return plain ? `${fmtAmt(e.amt)} ${u.short}` : `${fmtAmt(e.amt)} × ${u.short}`;
}

const VIEWS = {};
const afterRender = {};

VIEWS.today = () => {
  const p = S.state.profile, plan = S.plan();
  const k = ui.date, d = S.peekDay(k), t = S.totals(d.entries);
  const over = t.kcal > plan.kcal;
  const left = plan.kcal - t.kcal;
  const isToday = k === S.todayKey();
  const hr = new Date().getHours();
  const greet = (hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') + (p.name ? ', ' + esc(p.name) : '');
  const wk = weekKeys(k);
  const streak = S.streak();
  const bar = (nm, cur, tgt, col) => `<div class="bar"><span class="nm">${nm}</span><div class="tr"><div class="fl" data-w="${clamp(cur / tgt * 100, 0, 100).toFixed(1)}%" style="width:${ui.barsPrev[nm] || '0%'};background:${cur > tgt * 1.05 && nm !== 'Protein' && nm !== 'Fibre' ? 'var(--over)' : col}"></div></div><span class="vl">${fmt(cur)} / ${tgt}g</span></div>`;
  const cups = Array.from({ length: p.waterGoal || 8 }, (_, i) => `<button type="button" class="cup ${i < d.water ? 'on' : ''}" data-a="cup" data-i="${i}" aria-label="Cup ${i + 1}${i < d.water ? ', drunk' : ''}">${cupSvg(i < d.water)}</button>`).join('');
  const mealsHtml = S.meals().map(m => {
    const es = d.entries.filter(e => e.meal === m);
    const kc = es.reduce((s, e) => s + e.n.kcal, 0);
    return `<div class="card rise"><div class="meal-h"><div class="grow"><div class="h2">${esc(m)}</div><div class="small muted">${es.length ? fmt(kc) + ' kcal' : 'Nothing yet'}</div></div>
      <button type="button" class="addbtn press" data-a="addto" data-meal="${esc(m)}" aria-label="Add food to ${esc(m)}">${I.plus({ s: 18, w: 2.8 })}</button></div>
      ${es.map(e => `<button type="button" class="entry" data-a="entry" data-id="${e.id}">${F.foodTile(e.food, 32)}<div class="grow"><div class="nm ell">${esc(e.food.name)}</div><div class="am ell">${esc(amountText(e))}${e.food.brand ? ' · ' + esc(e.food.brand) : ''}</div></div><span class="kc">${fmt(e.n.kcal)}</span></button>`).join('')}
    </div>`;
  }).join('');
  const dayDot = key => {
    const dd = S.peekDay(key); if (!dd.entries.length && !dd.done) return 'transparent';
    if (!dd.done) return '#B9C6CA';
    return S.totals(dd.entries).kcal > plan.kcal ? 'var(--over)' : 'var(--ring)';
  };
  return `<div class="screen">
    <div class="top"><div><div class="kicker">${isToday ? greet : 'Looking back'}</div><h1>samslimmer</h1></div>
      <span class="chip" aria-label="${streak} day streak">${I.flame({ s: 16, c: 'var(--flame)', w: 2.4 })}${streak}</span></div>
    <div class="row" style="padding:0 14px"><button type="button" class="iconbtn ghost" data-a="dayshift" data-n="-1" aria-label="Previous day">${I.back({ s: 20 })}</button>
      <div class="grow" style="text-align:center;font-weight:800;font-size:15px">${S.prettyDate(k)}${isToday ? '' : ` <span class="small muted">· ${S.longDate(k)}</span>`}</div>
      <button type="button" class="iconbtn ghost" data-a="dayshift" data-n="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.25"' : ''}>${I.next({ s: 20 })}</button></div>
    <div class="week">${wk.map(key => { const dd = S.parseKey(key), fut = key > S.todayKey(); return `<button type="button" class="${key === k ? 'sel' : ''}" data-a="day" data-k="${key}" ${fut ? 'disabled style="opacity:.4"' : ''} aria-label="${S.longDate(key)}"><span>${'MTWTFSS'[(dd.getDay() + 6) % 7]}</span><span class="dot" style="background:${key === k && !d.entries.length ? 'transparent' : dayDot(key)}"></span></button>`; }).join('')}</div>
    <div class="content">
      <div class="card rise">
        <div class="ringwrap"><svg width="184" height="184" viewBox="0 0 220 220" role="img" aria-label="${fmt(t.kcal)} of ${fmt(plan.kcal)} calories">
          <circle cx="110" cy="110" r="96" fill="none" stroke="var(--ring-track)" stroke-width="20"/>
          <circle class="prog" id="ring" cx="110" cy="110" r="96" fill="none" stroke="${over ? 'var(--over)' : 'var(--ring)'}" stroke-width="20" stroke-linecap="round" stroke-dasharray="603.2" stroke-dashoffset="${ui.ringPrev}" transform="rotate(-90 110 110)" data-off="${(603.2 * (1 - clamp(t.kcal / plan.kcal, 0, 1))).toFixed(1)}"/></svg>
          <div class="ringtext"><span class="k">${over ? 'OVER BY' : 'REMAINING'}</span><span class="n" style="color:${over ? 'var(--over)' : 'var(--ink)'}" data-count="${Math.abs(left)}">${fmt(Math.abs(left))}</span><span class="small muted">${fmt(t.kcal)} of ${fmt(plan.kcal)} kcal</span></div></div>
        <div class="bars">${bar('Protein', t.p, plan.p, 'var(--prot)')}${bar('Carbs', t.c, plan.c, 'var(--carb)')}${bar('Fat', t.f, plan.f, 'var(--fat)')}${bar('Fibre', t.fib, plan.fib, 'var(--fib)')}</div>
        <div class="extras">Sugar ${g1(t.sug)} g · Sat fat ${g1(t.sat)} g · Salt ${g1(t.salt)} g</div>
      </div>
      <div class="card rise"><div class="row" style="justify-content:space-between;margin-bottom:4px"><span class="h2">Water</span><span class="small muted" id="waterlbl">${d.water} of ${p.waterGoal || 8} cups · ${((d.water * (p.cupMl || 250)) / 1000).toFixed(2).replace(/0$/, '')} L</span></div><div class="cups">${cups}</div></div>
      ${mealsHtml}
      <button type="button" class="btn ${d.done ? 'outline' : ''} press" data-a="done">${d.done ? I.check({ s: 18 }) + (isToday ? ' Day logged · tap to reopen' : ' Marked done · tap to reopen') : I.check({ s: 18, c: '#fff', w: 2.6 }) + (isToday ? ' Done for today' : ' Mark this day as done')}</button>
      ${!S.storageOk ? '<div class="small" style="color:var(--over-ink);text-align:center">This browser is not letting Samslimmer save. Check private browsing.</div>' : ''}
    </div>${nav('today')}</div>`;
};
afterRender.today = (anim) => {
  const r = document.getElementById('ring');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (r) { r.style.strokeDashoffset = r.dataset.off; ui.ringPrev = r.dataset.off; }
    document.querySelectorAll('.bar .fl').forEach(el => { el.style.width = el.dataset.w; ui.barsPrev[el.parentNode.previousElementSibling.textContent] = el.dataset.w; });
  }));
  if (anim) {
    const n = document.querySelector('.ringtext .n[data-count]');
    if (n) { const to = +n.dataset.count, t0 = performance.now(); (function f(t) { const p = Math.min(1, (t - t0) / 900); n.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0); }
  }
};

const STREAK_LINES = {
  1: ['Day one. Every streak starts somewhere.', 'Come back tomorrow and make it two.'],
  3: ['Three days! A hat-trick of honesty.', 'Keep it rolling.'],
  7: ['A whole week logged!', 'Seven days in a row. That\'s a proper habit forming.'],
  14: ['Two weeks straight!', 'You\'ve basically become a nutrition label.'],
  21: ['21 days. They say that\'s a habit now.', 'Science-ish agrees with you.'],
  30: ['A month of logging!', 'Thirty days. Absolute machine.'],
  50: ['50 days!', 'Half a century of honesty.'],
  100: ['100-day streak!!', 'Triple digits. Frame this.'],
  365: ['A YEAR.', 'Every single day for a year. Legendary.']
};
const DONE_LINES = ['Logged and locked in.', 'Another one for the streak.', 'Day done. Go put your feet up.', 'Nice. Same again tomorrow?', 'Streak fed. It purrs.'];

/* ================= FOOD SEARCH ================= */
function srcBadge(f) { const s = F.SRC[f.src] || F.SRC.off; return `<span class="badge" style="background:${s.bg};color:${s.fg}">${s.label}</span>`; }
function resRow(f, list) {
  const u = f.units && f.units[0];
  const kcal = f.per && u ? f.per.kcal * u.g / 100 : null;
  return `<button type="button" class="res" data-a="res" data-id="${esc(f.id)}" data-list="${list}">
    ${F.foodTile(f)}
    <div class="grow" style="display:flex;flex-direction:column;gap:3px"><span class="nm ell">${esc(f.name)}</span>
      <span class="row" style="gap:6px;flex-wrap:wrap">${srcBadge(f)}<span class="small muted ell">${f.brand ? esc(f.brand) + ' · ' : ''}${u ? esc(u.label) : 'Tap for details'}${f.recipe ? ' · ' + f.recipe.ings.length + ' ingredients' : ''}</span></span></div>
    ${kcal != null ? `<div style="display:flex;flex-direction:column;align-items:flex-end"><span class="kc">${fmt(kcal)}</span><span class="small muted">kcal</span></div>` : ''}</button>`;
}
function resultsHtml() {
  const local = F.localSearch(ui.q, ui.tab);
  const country = S.state.profile.country;
  const q = ui.q.trim();
  let html = '';
  const tabLbl = { mine: 'Foods you created', recent: 'Logged recently', recipes: 'Your recipes' };
  const lbl = q ? (ui.tab === 'all' ? 'Your recipes, foods & everyday basics' : tabLbl[ui.tab])
    : ui.tab === 'all' ? (S.state.recents.length ? 'Recently used' : 'Everyday basics · search for brands & products') : tabLbl[ui.tab];
  if (local.length) html += `<div class="sectionlbl">${lbl}</div><div class="list">${local.map(f => resRow(f, 'local')).join('')}</div>`;
  else if (ui.tab !== 'all' || !q) html += `<div class="card empty"><span class="h2">${ui.tab === 'mine' ? 'No foods of your own yet' : ui.tab === 'recipes' ? 'No recipes yet' : ui.tab === 'recent' ? 'Nothing logged yet' : 'Nothing here yet'}</span><span class="small muted">${ui.tab === 'mine' ? 'Tap “Create food” to add one from a label.' : ui.tab === 'recipes' ? 'Cooked something? Tap “Create recipe”, add the ingredients, and log it by the portion.' : 'Foods you log will show up here.'}</span></div>`;
  if (ui.tab === 'all' && q.length >= 2) {
    const o = ui.online;
    const cn = country === 'CA' ? 'Canada' : 'the UK';
    if (o.status === 'loading') html += `<div class="sectionlbl">Searching products in ${cn}…</div><div class="list"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`;
    else if (o.status === 'done') {
      if (o.cnf.length) html += `<div class="sectionlbl">Canadian Nutrient File (Health Canada)</div><div class="list">${o.cnf.map(f => resRow(f, 'cnf')).join('')}</div>`;
      if (o.items.length) html += `<div class="sectionlbl">Products in ${cn} · Open Food Facts</div><div class="list">${o.items.map(f => resRow(f, 'online')).join('')}</div>`;
      if (!o.items.length && !o.cnf.length && !local.length) html += `<div class="card empty"><span class="h2">Nothing found for “${esc(q)}”</span><span class="small muted">Try another word, or create it yourself from the label.</span></div>`;
    } else if (o.status === 'error') html += `<div class="card empty"><span class="h2">Couldn't reach the online food database</span><span class="small muted">Check your connection. Your own foods and the basics still work offline.</span><button type="button" class="pill" data-a="retry" style="margin-top:6px">Try again</button></div>`;
    else if (o.status === 'wait' && q.length >= 2) html += `<div class="sectionlbl">Searching products in ${cn}…</div>`;
  }
  return html;
}
VIEWS.foods = () => {
  const p = S.state.profile;
  if (!ui.meal) ui.meal = defaultMeal();
  const tabs = [['all', 'All'], ['recent', 'Recent'], ['mine', 'My foods'], ['recipes', 'Recipes']];
  const pick = ui.pick && ui.recipe;
  const kicker = pick ? 'Adding an ingredient to ' + (ui.recipe.name || 'your recipe') : 'Adding to ' + (S.prettyDate(ui.date).toLowerCase() === 'today' ? '' : S.prettyDate(ui.date) + ' · ') + ui.meal;
  return `<div class="screen">
    <div class="searchhead">
      <div class="row" style="justify-content:space-between">${pick ? `<button type="button" class="iconbtn" data-a="backrecipe" aria-label="Back to recipe">${I.back({ s: 20, w: 2.4 })}</button>` : ''}<div class="grow"><div class="small muted ell" style="font-weight:700">${esc(kicker)}</div><div style="font-size:22px;font-weight:800;letter-spacing:-.4px">${pick ? 'Add ingredient' : 'Find a food'}</div></div>
        <button type="button" class="pill unit on press" data-a="country" aria-label="Food country: ${p.country === 'CA' ? 'Canada' : 'UK'}. Tap to switch" style="display:flex;align-items:center;gap:6px">${I.globe({ s: 16 })}${p.country === 'CA' ? 'Canada' : 'UK'}</button></div>
      <div class="row" style="gap:8px"><label class="searchbox">${I.search({ s: 18, c: '#55646A', w: 2.4 })}<input id="q" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="Search e.g. porridge, Heinz beans…" value="${esc(ui.q)}" data-in="q" aria-label="Search foods"></label>
        <button type="button" class="scan press" data-a="scan" aria-label="Scan a barcode">${I.scan({ c: '#fff' })}</button></div>
      <div class="tabs">${tabs.map(([k, l]) => `<button type="button" class="pill ${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="content"><div id="results" style="display:flex;flex-direction:column;gap:8px">${resultsHtml()}</div>
      <div class="row" style="gap:8px"><button type="button" class="btn dashed press" data-a="create">${I.plus({ s: 18, w: 2.6 })}Create food</button>
      ${pick ? '' : `<button type="button" class="btn dashed press" data-a="newrecipe" style="border-color:#F5C68A;color:#92400E">${I.pot({ s: 18 })}Create recipe</button>`}</div>
      <div class="attrib">${F.ATTRIBUTION}</div></div>
    ${pick ? '' : nav('foods')}</div>`;
};
function refreshResults() { const r = document.getElementById('results'); if (r) r.innerHTML = resultsHtml(); }

let searchTimer = null, searchCtl = null;
function onQuery(v) {
  ui.q = v;
  clearTimeout(searchTimer);
  if (searchCtl) searchCtl.abort();
  const q = v.trim();
  if (ui.tab !== 'all' || q.length < 2) { ui.online = { q: '', status: 'idle', items: [], cnf: [] }; refreshResults(); return; }
  ui.online = { q, status: 'wait', items: [], cnf: [] };
  refreshResults();
  searchTimer = setTimeout(() => runOnline(q), 700);
}
async function runOnline(q) {
  const country = S.state.profile.country;
  searchCtl = new AbortController();
  ui.online = { q, status: 'loading', items: [], cnf: [] }; refreshResults();
  let items = [], cnf = [], err = null;
  await Promise.all([
    F.offSearch(q, country, searchCtl.signal).then(r => { items = r; }).catch(e => { if (e.name !== 'AbortError') err = e; }),
    country === 'CA' ? F.cnfSearch(q).then(r => { cnf = r; }) : Promise.resolve()
  ]);
  if (ui.q.trim() !== q || ui.view !== 'foods') return;
  ui.online = { q, status: err && !cnf.length ? 'error' : 'done', items, cnf };
  refreshResults();
}

function findListed(id, list) {
  if (list === 'online') return ui.online.items.find(f => f.id === id);
  if (list === 'cnf') return ui.online.cnf.find(f => f.id === id);
  return S.state.foods[id] || F.BASICS.find(f => f.id === id);
}

/* ================= FOOD SHEET ================= */
function openFoodSheet(food, opts = {}) {
  sheet = Object.assign({ type: 'food', food, amt: 1, unit: 0, meal: ui.meal || defaultMeal(), mode: ui.pick ? 'ingadd' : 'add', anim: true }, opts);
  pad = null;
  renderOverlay();
  if (food.partial) {
    F.cnfDetails(food).then(full => {
      if (sheet && sheet.food === food) { sheet.food = full; sheet.anim = false; renderOverlay(); }
    }).catch(() => { if (sheet && sheet.food === food) { closeSheet(); toast('Couldn\'t load that food', 'Health Canada\'s database didn\'t answer. Try again in a moment.'); } });
  }
}
function sheetNumbers() {
  const f = sheet.food, u = f.units[sheet.unit] || { g: 100 };
  const grams = sheet.amt * u.g, r = grams / 100, n = {};
  S.NUTS.forEach(k => { n[k] = (f.per[k] || 0) * r; });
  return { grams, n, u };
}
function foodSheetHtml() {
  const f = sheet.food;
  if (f.partial) return `<div class="sheet ${sheet.anim ? 'anim' : ''}"><div class="grab"></div><h3>${esc(f.name)}</h3><div class="skel"></div><div class="skel"></div><div class="small muted" style="text-align:center">Loading from Health Canada…</div></div>`;
  const { grams, n, u } = sheetNumbers();
  const padOn = pad && pad.id === 'amt';
  const shown = padShown('amt');
  const amtTxt = shown != null ? shown : fmtAmt(sheet.amt);
  const plain = ['g', 'ml', 'oz', 'fl oz'].indexOf(u.short) >= 0;
  const hint = u.short === 'g' ? '≈ ' + g1(grams / 28.35) + ' oz' : u.short === 'ml' ? '≈ ' + g1(grams / 29.57) + ' fl oz' : '= ' + fmt(grams) + (f.liquid ? ' ml' : ' g');
  const mode = sheet.mode, ing = mode === 'ingadd' || mode === 'ingedit';
  const rec = f.recipe;
  return `<div class="sheet ${sheet.anim ? 'anim' : ''} ${padOn ? 'withpad' : ''}" role="dialog" aria-label="${esc(f.name)}">
    <div class="grab"></div>
    <div class="row" style="align-items:flex-start"><div class="grow" style="display:flex;flex-direction:column;gap:4px"><h3>${esc(f.name)}</h3><div class="row" style="gap:6px">${srcBadge(f)}${f.brand ? `<span class="small muted">${esc(f.brand)}</span>` : ''}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end"><span style="font-size:26px;font-weight:800;letter-spacing:-.5px">${fmt(n.kcal)}</span><span class="small muted">kcal</span></div></div>
    <div class="field"><span class="small muted" style="font-weight:700">How much?</span>
      <div class="row" style="gap:8px;align-items:stretch"><button type="button" class="step press" data-a="amtstep" data-d="-1" aria-label="Less">${I.minus({ s: 20, w: 2.8 })}</button>
        <button type="button" class="amt ${padOn ? 'on' : ''}" data-a="amtpad" aria-label="Amount ${amtTxt} ${esc(u.short)}. Tap to type"><span class="v">${esc(amtTxt)}</span>${padOn ? '<span class="caret" style="height:26px"></span>' : ''}<span class="u">${plain ? esc(u.short) : '× ' + esc(u.short)}</span></button>
        <button type="button" class="step press" data-a="amtstep" data-d="1" aria-label="More">${I.plus({ s: 20, w: 2.8 })}</button></div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${f.units.map((x, i) => `<button type="button" class="pill unit ${i === sheet.unit ? 'on' : ''}" data-a="unit" data-i="${i}">${esc(x.label)}</button>`).join('')}</div>
      <span class="small muted">${hint}</span></div>
    ${padOn ? `<div class="row small" style="justify-content:space-between;background:var(--bg);border-radius:12px;padding:8px 12px;font-weight:700;color:#3D4B50"><span>P ${g1(n.p)} g</span><span>C ${g1(n.c)} g</span><span>F ${g1(n.f)} g</span><span>Fibre ${g1(n.fib)} g</span></div>` : `
    <div class="nutgrid">${[['Protein', n.p], ['Carbs', n.c], ['Fat', n.f], ['Fibre', n.fib], ['Sugar', n.sug], ['Sat fat', n.sat], ['Salt', n.salt]].map(([l, v]) => `<div><span>${l}</span><span>${g1(v)} g</span></div>`).join('')}<div><span>Weight</span><span>${fmt(grams)} ${f.liquid ? 'ml' : 'g'}</span></div></div>
    ${rec && mode === 'add' ? `<div class="row" style="background:#FFF7EC;border-radius:14px;padding:10px 12px"><span class="grow small" style="font-size:13px;color:#7C2D12">${rec.ings.length} ingredients · makes ${rec.portions} portion${rec.portions > 1 ? 's' : ''}${rec.cookedG ? ' · pot weighed ' + fmt(rec.cookedG) + ' g' : ''}</span><button type="button" class="pill" data-a="editrecipe" data-id="${esc(f.id)}" style="background:#FFEBD2;color:#92400E">Edit recipe</button></div>` : ''}
    ${ing ? '' : `<div class="row" style="gap:6px;flex-wrap:wrap">${S.meals().map(m => `<button type="button" class="pill unit ${m === sheet.meal ? 'on' : ''}" data-a="smeal" data-m="${esc(m)}" style="flex:1">${esc(m)}</button>`).join('')}</div>`}
    ${mode === 'edit' ? `<div class="row" style="gap:8px"><button type="button" class="btn danger press" data-a="delentry" style="width:auto;padding:0 18px" aria-label="Delete entry">${I.trash({ s: 18 })}</button><button type="button" class="btn press" data-a="saveentry">Save changes</button></div>`
      : mode === 'ingedit' ? `<div class="row" style="gap:8px"><button type="button" class="btn danger press" data-a="delING" style="width:auto;padding:0 18px" aria-label="Remove ingredient">${I.trash({ s: 18 })}</button><button type="button" class="btn press" data-a="saveING">Save ingredient</button></div>`
      : mode === 'ingadd' ? `<button type="button" class="btn press" data-a="addfood" ${sheet.amt > 0 ? '' : 'disabled'}>${I.pot({ s: 18, c: '#fff' })} Add to recipe</button>`
      : `<button type="button" class="btn press" data-a="addfood" ${sheet.amt > 0 ? '' : 'disabled'}>Add to ${esc(sheet.meal)}</button>`}`}
  </div>`;
}

function addFoodNow() {
  const { grams, n } = sheetNumbers();
  if (!(grams > 0)) return;
  const f = sheet.food;
  const clean = { id: f.id, name: f.name, brand: f.brand || '', src: f.src, liquid: !!f.liquid, per: f.per, units: f.units, code: f.code, cat: f.cat };
  if (f.recipe) clean.recipeId = f.id;
  if (sheet.mode === 'ingadd' && ui.recipe) {
    if (f.recipe && ui.recipe.id === f.id) { toast('A recipe can\'t include itself'); return; }
    if (f.src !== 'recipe') S.rememberFood(clean);
    ui.recipe.ings.push({ id: S.uid(), food: clean, amt: sheet.amt, unit: sheet.unit, grams, n });
    closeSheet(true); ui.pick = null; ui.view = 'recipe'; render(); window.scrollTo(0, document.body.scrollHeight);
    toast(f.name + ' added to the recipe', fmt(n.kcal) + ' kcal', 'good');
    return;
  }
  S.rememberFood(clean);
  const d = S.day(ui.date);
  d.entries.push({ id: S.uid(), meal: sheet.meal, food: clean, amt: sheet.amt, unit: sheet.unit, grams, n, t: Date.now() });
  S.save();
  const meal = sheet.meal;
  closeSheet(true);
  ui.view = 'today'; render(); window.scrollTo(0, 0);
  toast(f.name + ' added', fmt(n.kcal) + ' kcal to ' + meal, 'good');
}

/* ================= CREATE FOOD SHEET ================= */
const CF_FIELDS = [['size', 'Serving size', 'g', 1], ['kcal', 'Calories', 'kcal', 0], ['p', 'Protein', 'g', 1], ['c', 'Carbs', 'g', 1], ['f', 'Fat', 'g', 1], ['fib', 'Fibre', 'g', 1], ['sug', 'Sugar', 'g', 1], ['sat', 'Sat fat', 'g', 1], ['salt', 'Salt', 'g', 2]];
function openCreate(code) {
  sheet = { type: 'create', anim: true, code: code || null, name: ui.q.trim() ? ui.q.trim().replace(/^./, c => c.toUpperCase()) : '', brand: '', serving: 'serving', basis: 'serving', v: { size: 100, kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, salt: 0 } };
  pad = null; renderOverlay();
}
function createSheetHtml() {
  const s = sheet, padOn = !!pad;
  const box = ([k, l, u]) => { const sh = padShown('cf_' + k); return `<div class="field"><span class="small" style="font-weight:700">${l}</span><button type="button" class="numbox ${pad && pad.id === 'cf_' + k ? 'on' : ''}" data-a="cfpad" data-k="${k}" id="cf_${k}"><span class="v">${esc(sh != null ? sh : g1(s.v[k]))}</span>${pad && pad.id === 'cf_' + k ? '<span class="caret" style="height:22px"></span>' : ''}<span class="u">${u}</span></button></div>`; };
  return `<div class="sheet ${s.anim ? 'anim' : ''} ${padOn ? 'withpad' : ''}" role="dialog" aria-label="Create a food" id="cfsheet" style="${padOn ? 'max-height:calc(100dvh - 330px)' : ''}">
    <div class="grab"></div><div class="row"><h3 class="grow">Create a food${s.code ? `<div class="small muted" style="font-weight:600;margin-top:2px">Barcode ${esc(s.code)} · next time it'll scan straight in</div>` : ''}</h3><button type="button" class="iconbtn" data-a="close" aria-label="Close">${I.x({ s: 18 })}</button></div>
    <label class="field"><span class="small" style="font-weight:700">Name</span><input class="input" data-in="cfname" value="${esc(s.name)}" placeholder="e.g. Mum's flapjack" autocomplete="off"></label>
    <label class="field"><span class="small" style="font-weight:700">Brand <span class="muted">(optional)</span></span><input class="input" data-in="cfbrand" value="${esc(s.brand)}" placeholder="e.g. Tesco" autocomplete="off"></label>
    <div class="field"><span class="small" style="font-weight:700">The label shows values…</span><div class="row" style="gap:6px">
      <button type="button" class="pill unit ${s.basis === 'serving' ? 'on' : ''}" data-a="cfbasis" data-v="serving" style="flex:1">Per serving</button>
      <button type="button" class="pill unit ${s.basis === '100' ? 'on' : ''}" data-a="cfbasis" data-v="100" style="flex:1">Per 100 g</button></div></div>
    ${s.basis === 'serving' ? `<label class="field"><span class="small" style="font-weight:700">Serving name</span><input class="input" data-in="cfserving" value="${esc(s.serving)}" placeholder="e.g. bar, slice, pot" autocomplete="off"></label>` : ''}
    <div class="formgrid">${CF_FIELDS.filter(f => s.basis === 'serving' || f[0] !== 'size').map(box).join('')}</div>
    <span class="small muted">${s.basis === 'serving' ? 'Fill in what one ' + esc(s.serving || 'serving') + ' contains. Leave anything you don\'t know at 0.' : 'Fill in the per-100 g column from the label.'}</span>
    <button type="button" class="btn press" data-a="cfsave" ${s.name.trim() && s.v.kcal >= 0 ? '' : 'disabled'}>Save &amp; log it</button>
  </div>`;
}
function saveCreated() {
  const s = sheet;
  if (!s.name.trim()) { toast('Give it a name first'); return; }
  const size = s.basis === 'serving' ? (s.v.size || 100) : 100;
  const per = {};
  ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'sat', 'salt'].forEach(k => { per[k] = (s.v[k] || 0) * 100 / size; });
  const units = [];
  if (s.basis === 'serving') units.push({ label: (s.serving || 'serving') + ' (' + g1(size) + ' g)', short: s.serving || 'serving', g: size });
  units.push({ label: 'Grams', short: 'g', g: 1 }, { label: 'Ounces', short: 'oz', g: 28.35 });
  const food = { id: 'mine:' + S.uid(), name: s.name.trim(), brand: s.brand.trim(), src: 'mine', per, units, code: s.code || undefined };
  S.state.foods[food.id] = Object.assign({ used: 0 }, food); S.save();
  openFoodSheet(food, { anim: false });
}

/* ================= CONFIRM SHEET ================= */
function confirmSheet(title, body, yes, onYes, danger) {
  sheet = { type: 'confirm', title, body, yes, onYes, danger, anim: true }; pad = null; renderOverlay();
}

/* ================= OVERLAY ================= */
function renderOverlay(fromPad) {
  if (!sheet) { $ov.innerHTML = ''; document.body.style.overflow = ''; return; }
  document.body.style.overflow = 'hidden';
  let inner = '';
  if (sheet.type === 'food') inner = foodSheetHtml();
  else if (sheet.type === 'create') inner = createSheetHtml();
  else if (sheet.type === 'barcode') inner = barcodeSheetHtml();
  else if (sheet.type === 'confirm') inner = `<div class="sheet ${sheet.anim ? 'anim' : ''}" role="alertdialog"><div class="grab"></div><h3>${esc(sheet.title)}</h3><div class="small muted" style="font-size:14px">${esc(sheet.body)}</div><div class="row" style="gap:8px"><button type="button" class="btn quiet press" data-a="close">Cancel</button><button type="button" class="btn ${sheet.danger ? 'danger' : ''} press" data-a="confirmyes">${esc(sheet.yes)}</button></div></div>`;
  const keepScroll = document.querySelector('#overlay .sheet');
  const st = keepScroll ? keepScroll.scrollTop : 0;
  const already = !!$ov.querySelector('.ov');
  $ov.innerHTML = `<div class="ov ${already ? 'still' : ''}"><button type="button" class="backdrop" data-a="backdrop" aria-label="Close"></button>${inner}${pad ? padHtml(fromPad || pad.shown) : ''}</div>`;
  if (pad) pad.shown = true;
  const sh = document.querySelector('#overlay .sheet');
  if (sh && keepScroll) sh.scrollTop = st;
  if (pad && sh) { const el = document.getElementById(pad.id); if (el && !fromPad) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  sheet.anim = false;
}
function closeSheet(silent) {
  sheet = null; pad = null;
  if (!silent || $ov.innerHTML) renderOverlay();
}

/* ================= SETUP ================= */
function startSetup(edit) {
  const p = S.state.profile;
  ui.su = p ? Object.assign({ step: edit ? 1 : 0, wkg: S.latestWeight(), editing: true }, JSON.parse(JSON.stringify(p))) :
    { step: 0, name: '', country: 'UK', units: 'metric', sex: 'm', age: 30, hcm: 175, wkg: 80, gkg: 72, act: 1, pace: -0.5, preset: 'bal', own: false, ownKcal: 2000 };
  if (ui.su.wkg == null) ui.su.wkg = ui.su.startKg;
  pad = null;
}
const SU_TITLES = [
  ['Welcome to Samslimmer', 'A few quick questions so we can work out your daily calories.'],
  ['About you', 'This feeds the calorie maths. It stays on your phone.'],
  ['Your weight', 'Where you are now and where you\'d like to be.'],
  ['How active are you?', 'On a normal week, not your best one.'],
  ['How fast?', 'Slower is easier to stick to. You can change this any time.'],
  ['Your plan', '']
];
const WEIGHT_THINGS = [[1, 'a pineapple'], [2, 'a newborn lamb'], [3, 'an Atlantic salmon'], [5, 'a Christmas turkey'], [7, 'a bowling ball'], [10, 'a corgi'], [15, 'a car tyre'], [20, 'a sack of potatoes'], [30, 'a fully grown Labrador']];
function stParts(kg) { const lb = kg * S.LB; let s = Math.floor(lb / 14), r = Math.round(lb - s * 14); if (r === 14) { s++; r = 0; } return [s, r]; }
function fmtW(kg, units) { if (units === 'metric') return g1(kg) + ' kg'; if (units === 'us') return g1(kg * S.LB) + ' lb'; const p = stParts(kg); return p[0] + ' st ' + p[1] + ' lb'; }

function suFields(su) {
  const inches = su.hcm / 2.54; let ft = Math.floor(inches / 12), inch = Math.round(inches - ft * 12); if (inch === 12) { ft++; inch = 0; }
  const B = {
    age: { get: () => su.age, set: v => { su.age = v; }, unit: 'years', dec: 0, max: 3 },
    h_cm: { get: () => Math.round(su.hcm), set: v => { su.hcm = v; }, unit: 'cm', dec: 0, max: 3 },
    h_ft: { get: () => ft, set: v => { su.hcm = (v * 12 + inch) * 2.54; }, unit: 'ft', dec: 0, max: 1 },
    h_in: { get: () => inch, set: v => { su.hcm = (ft * 12 + v) * 2.54; }, unit: 'in', dec: 0, max: 2 },
    own: { get: () => su.ownKcal, set: v => { su.ownKcal = v; }, unit: 'kcal', dec: 0, max: 4 }
  };
  ['w', 'g'].forEach(p => {
    const key = p === 'w' ? 'wkg' : 'gkg';
    B[p + '_kg'] = { get: () => g1(su[key]), set: v => { su[key] = v; }, unit: 'kg', dec: 1, max: 3 };
    B[p + '_lb'] = { get: () => g1(su[key] * S.LB), set: v => { su[key] = v / S.LB; }, unit: 'lb', dec: 1, max: 3 };
    B[p + '_st'] = { get: () => stParts(su[key])[0], set: v => { su[key] = (v * 14 + stParts(su[key])[1]) / S.LB; }, unit: 'st', dec: 0, max: 2 };
    B[p + '_stlb'] = { get: () => stParts(su[key])[1], set: v => { su[key] = (stParts(su[key])[0] * 14 + v) / S.LB; }, unit: 'lb', dec: 0, max: 2 };
  });
  return B;
}
function suBox(id, B) {
  const b = B[id], on = pad && pad.id === id, sh = padShown(id);
  return `<button type="button" class="numbox ${on ? 'on' : ''}" data-a="supad" data-id="${id}" id="${id}" aria-label="${b.unit}"><span class="v">${esc(sh != null ? sh : b.get())}</span>${on ? '<span class="caret" style="height:24px"></span>' : ''}<span class="u">${b.unit}</span></button>`;
}
VIEWS.setup = () => {
  const su = ui.su || (startSetup(), ui.su);
  const B = suFields(su), u = su.units, st = su.step;
  const opt = (field, val, label, sub, extra = '') => `<button type="button" class="opt press ${su[field] === val ? 'on' : ''}" data-a="suset" data-f="${field}" data-v="${val}" ${extra}>${label}${sub ? `<span class="sub">${sub}</span>` : ''}</button>`;
  const hBoxes = u === 'metric' ? suBox('h_cm', B) : suBox('h_ft', B) + suBox('h_in', B);
  const wBoxes = p => u === 'metric' ? suBox(p + '_kg', B) : u === 'us' ? suBox(p + '_lb', B) : suBox(p + '_st', B) + suBox(p + '_stlb', B);
  const plan = S.calcPlan(Object.assign({}, su, { startKg: su.wkg }), su.wkg);
  const diff = Math.abs(su.wkg - su.gkg), losing = su.gkg < su.wkg - 0.05, gaining = su.gkg > su.wkg + 0.05;
  const dateFor = r => { if (!r || diff < 0.1) return null; const d = new Date(); d.setDate(d.getDate() + Math.round(diff / Math.abs(r) * 7)); return S.MN[d.getMonth()] + ' ' + d.getFullYear(); };
  const rate = kg => u === 'metric' ? kg + ' kg' : (Math.round(kg * S.LB * 4) / 4) + ' lb';
  let body = '';
  if (st === 0) body = `
    <label class="field"><span class="label">Your first name</span><input class="input" data-in="suname" value="${esc(su.name)}" placeholder="e.g. Sam" autocomplete="given-name"></label>
    <div class="field"><span class="label">Where do you buy food?</span><div class="row" style="gap:8px">${opt('country', 'UK', 'United Kingdom', 'UK products first', 'style="flex:1"')}${opt('country', 'CA', 'Canada', 'Canadian products first', 'style="flex:1"')}</div></div>
    <div class="field"><span class="label">Units</span><div class="row" style="gap:8px">${opt('units', 'metric', 'kg & cm', 'Metric', 'style="flex:1"')}${opt('units', 'uk', 'st, lb & ft', 'UK style', 'style="flex:1"')}${opt('units', 'us', 'lb & ft', 'Canada style', 'style="flex:1"')}</div>
      <span class="small muted">You can change all of this later in Me.</span></div>`;
  if (st === 1) body = `
    <div class="field"><span class="label">Sex <span class="muted" style="font-weight:600">(only used in the calorie formula)</span></span><div class="row" style="gap:8px">${opt('sex', 'm', 'Male', '', 'style="flex:1;text-align:center"')}${opt('sex', 'f', 'Female', '', 'style="flex:1;text-align:center"')}</div></div>
    <div class="field"><span class="label">Age</span><div class="row">${suBox('age', B)}</div></div>
    <div class="field"><span class="label">Height</span><div class="row" style="gap:8px">${hBoxes}</div><span class="small muted">${u === 'metric' ? '≈ ' + B.h_ft.get() + ' ft ' + B.h_in.get() + ' in' : '≈ ' + Math.round(su.hcm) + ' cm'}</span></div>`;
  if (st === 2) {
    let thing = WEIGHT_THINGS[0][1]; WEIGHT_THINGS.forEach(t => { if (diff >= t[0] - 0.3) thing = t[1]; });
    body = `<div class="field"><span class="label">Current weight</span><div class="row" style="gap:8px">${wBoxes('w')}</div></div>
    <div class="field"><span class="label">Goal weight</span><div class="row" style="gap:8px">${wBoxes('g')}</div></div>
    <div style="background:var(--flame-soft);border-radius:16px;padding:12px 14px"><div style="font-size:14px;font-weight:800;color:#431407">${diff < 0.1 ? 'Staying put — nice and simple.' : 'That\'s ' + fmtW(diff, u) + ' to ' + (losing ? 'lose.' : 'gain.')}</div><div class="small" style="color:#9A3412">${diff < 0.1 ? 'We\'ll aim to keep you steady.' : 'About the weight of ' + thing + '. You\'ve got this.'}</div></div>`;
  }
  if (st === 3) body = S.ACT.map((a, i) => `<button type="button" class="opt press ${su.act === i ? 'on' : ''}" data-a="suset" data-f="act" data-v="${i}">${a[1]}<span class="sub">${a[2]}</span></button>`).join('');
  if (st === 4) {
    const PACES = [[-0.25, 'Lose ' + rate(0.25) + ' a week', 'Relaxed'], [-0.5, 'Lose ' + rate(0.5) + ' a week', 'Recommended'], [-0.75, 'Lose ' + rate(0.75) + ' a week', 'Faster'], [-1, 'Lose ' + rate(1) + ' a week', 'Tough'], [0, 'Maintain my weight', ''], [0.25, 'Gain ' + rate(0.25) + ' a week', ''], [0.5, 'Gain ' + rate(0.5) + ' a week', '']]
      .filter(p => losing ? p[0] < 0 : gaining ? p[0] > 0 : p[0] === 0);
    if (!PACES.some(p => p[0] === su.pace)) su.pace = PACES[losing ? 1 : 0][0];
    body = PACES.map(p => {
      const k = S.calcPlan(Object.assign({}, su, { pace: p[0], own: false }), su.wkg);
      const dt = dateFor(p[0]);
      return `<button type="button" class="opt press ${su.pace === p[0] ? 'on' : ''}" data-a="suset" data-f="pace" data-v="${p[0]}"><span class="row"><span class="grow">${p[1]} <span style="font-size:11px;color:${k.floorHit ? 'var(--over-ink)' : p[2] === 'Recommended' ? 'var(--accent)' : 'var(--ink2)'}">${k.floorHit ? 'Too low for you' : p[2]}</span></span><span>${fmt(k.kcal)}</span></span><span class="sub">${p[0] === 0 ? 'Keep things steady' : dt ? 'Reach your goal around ' + dt : ''} · kcal a day</span></button>`;
    }).join('');
  }
  if (st === 5) {
    const pr = S.PRESETS;
    body = `${!pad ? `<div class="card" style="display:flex;align-items:center;gap:16px"><div style="position:relative;width:120px;height:120px;flex:none"><svg width="120" height="120" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="96" fill="none" stroke="var(--ring-track)" stroke-width="20"/><circle cx="110" cy="110" r="96" fill="none" stroke="var(--ring)" stroke-width="20" stroke-linecap="round" stroke-dasharray="603.2" stroke-dashoffset="0" transform="rotate(-90 110 110)" style="animation:none"/></svg>
        <div class="ringtext"><span style="font-size:26px;font-weight:800;letter-spacing:-.8px;line-height:1">${fmt(plan.kcal)}</span><span class="small muted">kcal / day</span></div></div>
        <div class="grow" style="display:flex;flex-direction:column;gap:4px"><span class="small muted" style="font-size:13px">${su.own ? 'Using your own number' : 'You burn ≈ ' + fmt(plan.tdee) + ' kcal/day ' + (su.pace < 0 ? '− ' : '+ ') + Math.abs(Math.round(su.pace * 1100)) + ' for your pace'}</span>
          <span style="font-size:13px;font-weight:800;color:var(--accent)">${su.pace ? 'Goal around ' + (dateFor(su.pace) || '—') : 'Maintaining'}</span>
          ${plan.floorHit ? `<span class="small" style="color:#B45309">Raised to a safe minimum of ${fmt(plan.floor)} kcal</span>` : ''}</div></div>
      <div class="field"><span class="label">Macro split</span><div class="row" style="gap:6px">${Object.keys(pr).map(k => `<button type="button" class="opt press ${su.preset === k ? 'on' : ''}" data-a="suset" data-f="preset" data-v="${k}" style="flex:1;text-align:center;font-size:13px;padding:8px 4px">${pr[k].label}<span class="sub">${pr[k].p}/${pr[k].c}/${pr[k].f}</span></button>`).join('')}</div>
        <div class="card" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:10px 12px">${[['Protein', plan.p, 'var(--prot)'], ['Carbs', plan.c, 'var(--carb)'], ['Fat', plan.f, 'var(--fat)'], ['Fibre', 30, 'var(--fib)']].map(([n, v, c]) => `<div><div class="small muted" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:2px;background:${c}"></span>${n}</div><div style="font-weight:800">${v} g</div></div>`).join('')}</div></div>` : ''}
      <div class="row"><div class="grow"><div class="h2">Use my own number</div><div class="small muted">e.g. one a dietitian gave you</div></div><button type="button" class="switch ${su.own ? 'on' : ''}" role="switch" aria-checked="${su.own}" aria-label="Use my own calorie number" data-a="suown"></button></div>
      ${su.own ? `<div class="field"><span class="label">My daily calories</span><div class="row">${suBox('own', B)}</div></div>` : ''}`;
  }
  const title = st === 5 ? ['Your plan', 'Here\'s your daily target' + (su.name ? ', ' + su.name : '') + '.'] : SU_TITLES[st];
  return `<div class="setup">
    <div class="top" style="padding-bottom:10px"><button type="button" class="iconbtn ${st === 0 && !su.editing ? 'ghost' : ''}" data-a="suback" aria-label="Back" ${st === 0 && !su.editing ? 'style="visibility:hidden"' : ''}>${I.back({ s: 20, w: 2.4 })}</button>
      <div class="progress">${[0, 1, 2, 3, 4, 5].map(i => `<span class="${i <= st ? 'on' : ''}"></span>`).join('')}</div><span class="small muted" style="width:34px;text-align:right">${st + 1}/6</span></div>
    <div class="body ${ui.suAnim ? 'anim' : ''}"><div><h2>${esc(title[0])}</h2><div class="muted" style="font-size:14px;font-weight:600;margin-top:4px">${esc(title[1])}</div></div>${body}</div>
    ${pad ? padHtml(pad.shownSetup) : `<div class="foot"><button type="button" class="btn press" data-a="sunext">${st === 5 ? (su.editing ? 'Save my plan' : 'Start logging' + (su.name ? ', ' + esc(su.name) : '')) : 'Continue'}</button></div>`}
  </div>`;
};
afterRender.setup = () => { ui.suAnim = false; if (pad) { pad.shownSetup = true; const el = document.getElementById(pad.id); if (el) el.scrollIntoView({ block: 'center' }); } };

function finishSetup() {
  const su = ui.su;
  const prev = S.state.profile;
  const p = {
    name: (su.name || '').trim(), country: su.country, units: su.units, sex: su.sex, age: su.age, hcm: su.hcm,
    startKg: prev ? prev.startKg : su.wkg, gkg: su.gkg, act: su.act, pace: su.pace, preset: su.preset, own: su.own, ownKcal: su.ownKcal,
    waterGoal: prev ? prev.waterGoal : 8, cupMl: prev ? prev.cupMl : 250, meals: prev ? prev.meals : ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
    created: prev ? prev.created : S.todayKey()
  };
  S.state.profile = p;
  const tk = S.todayKey();
  if (!prev || Math.abs(S.latestWeight() - su.wkg) > 0.05) {
    S.state.weights = S.state.weights.filter(w => w[0] !== tk).concat([[tk, Math.round(su.wkg * 10) / 10]]);
  }
  S.save();
  ui.su = null; pad = null;
  go('today');
  toast(prev ? 'Plan updated' : 'You\'re all set' + (p.name ? ', ' + p.name : '') + '!', fmt(S.plan().kcal) + ' kcal a day.' + (prev ? '' : ' Log your first food with the + buttons.'), 'good');
}

/* ================= RECIPES ================= */
function startRecipe(food) {
  const r = food && food.recipe;
  ui.recipe = r ? { id: food.id, name: food.name, portions: r.portions, weigh: !!r.cookedG, cookedG: r.cookedG || 0, ings: JSON.parse(JSON.stringify(r.ings)), existing: true }
    : { id: 'recipe:' + S.uid(), name: '', portions: 4, weigh: false, cookedG: 0, ings: [], existing: false };
  ui.pick = null; pad = null; closeSheet(true);
  ui.view = 'recipe'; render(); window.scrollTo(0, 0);
}
function recipeTotals(r) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, salt: 0 };
  let raw = 0;
  r.ings.forEach(x => { S.NUTS.forEach(k => { t[k] += x.n[k] || 0; }); raw += x.grams; });
  const weight = r.weigh && r.cookedG > 0 ? r.cookedG : raw;
  return { t, raw, weight };
}
VIEWS.recipe = () => {
  const r = ui.recipe;
  if (!r) { ui.view = 'foods'; return VIEWS.foods(); }
  const { t, raw, weight } = recipeTotals(r);
  const n = r.portions, per = k => t[k] / n;
  const cookedShown = padShown('rcooked');
  return `<div class="screen" style="padding-bottom:${pad ? '330px' : 'calc(24px + var(--safe-b))'}">
    <div class="searchhead" style="gap:12px;position:static">
      <div class="row"><button type="button" class="iconbtn" data-a="rback" aria-label="Back">${I.back({ s: 20, w: 2.4 })}</button>
        <div class="grow"><div class="small" style="font-weight:800;color:#92400E;display:flex;align-items:center;gap:5px">${I.pot({ s: 14, c: '#92400E' })}RECIPE</div><div style="font-size:20px;font-weight:800;letter-spacing:-.4px">${r.existing ? 'Edit recipe' : 'New recipe'}</div></div>
        ${r.existing ? `<button type="button" class="iconbtn" data-a="rdelete" aria-label="Delete recipe" style="color:var(--over-ink)">${I.trash({ s: 18 })}</button>` : ''}</div>
      <label class="field"><span class="small" style="font-weight:700">Recipe name</span><input class="input" data-in="rname" value="${esc(r.name)}" placeholder="e.g. Mum's lentil soup" autocomplete="off" maxlength="60"></label>
      <div class="row"><div class="grow"><div class="h2">Makes</div><div class="small muted">How many portions you split it into</div></div>
        <button type="button" class="step press" style="height:44px" data-a="rportions" data-d="-1" aria-label="Fewer portions">${I.minus({ s: 18, w: 2.8 })}</button>
        <span style="width:56px;text-align:center;font-size:18px;font-weight:800">${n}</span>
        <button type="button" class="step press" style="height:44px" data-a="rportions" data-d="1" aria-label="More portions">${I.plus({ s: 18, w: 2.8 })}</button></div>
    </div>
    <div class="content">
      <div class="row" style="justify-content:space-between;padding:0 4px"><span class="h2">Ingredients (${r.ings.length})</span><span class="small muted">Whole pot: ${fmt(t.kcal)} kcal</span></div>
      <div class="list">
        ${r.ings.map(x => `<div class="row" style="padding:8px 8px 8px 14px;border-bottom:1px solid var(--line)"><button type="button" class="entry" data-a="ing" data-id="${x.id}" style="border:0;padding:0;flex:1;min-width:0">${F.foodTile(x.food, 32)}<div class="grow"><div class="nm ell">${esc(x.food.name)}</div><div class="am ell">${esc(amountText(x))}</div></div><span class="kc">${fmt(x.n.kcal)}</span></button>
          <button type="button" class="iconbtn ghost" data-a="ingx" data-id="${x.id}" aria-label="Remove ${esc(x.food.name)}" style="width:34px;height:34px;color:var(--ink3)">${I.x({ s: 16 })}</button></div>`).join('')}
        ${r.ings.length ? '' : `<div class="empty"><span class="small muted">Add everything that goes in the pot. Weigh things <b>before</b> cooking — rice and pasta change a lot once cooked.</span></div>`}
        <button type="button" class="btn press" data-a="ingadd" style="background:transparent;color:var(--accent);height:48px;font-size:14px">${I.plus({ s: 18, w: 2.6 })}Add ingredient</button>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px">
        <div class="row"><div class="grow"><div class="h2">Weigh the cooked pot</div><div class="small muted">Optional — lets you log it by grams later</div></div>
          <button type="button" class="switch ${r.weigh ? 'on' : ''}" role="switch" aria-checked="${!!r.weigh}" aria-label="Weigh the cooked pot" data-a="rweigh"></button></div>
        ${r.weigh ? `<div class="row" style="gap:10px"><span class="grow small" style="font-size:13px;font-weight:700">Cooked weight<br><span class="muted" style="font-weight:600">Raw ingredients add up to ${fmt(raw)} g</span></span>
          <button type="button" class="numbox ${pad && pad.id === 'rcooked' ? 'on' : ''}" data-a="rcooked" id="rcooked" style="flex:none;width:140px;height:50px"><span class="v">${esc(cookedShown != null ? cookedShown : fmt(r.cookedG))}</span>${pad && pad.id === 'rcooked' ? '<span class="caret" style="height:22px"></span>' : ''}<span class="u">g</span></button></div>
          <div class="small muted">→ about ${fmt(weight / n)} g per portion</div>` : ''}
      </div>
      <div style="background:var(--ink);color:#fff;border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:10px">
        <div class="row" style="align-items:flex-end"><div class="grow"><div class="small" style="color:#B9C6CA">Per portion</div><div style="font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1.1">${fmt(per('kcal'))} kcal</div></div><span class="small" style="color:#B9C6CA">1 of ${n}${weight ? ' · ' + fmt(weight / n) + ' g' : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">${[['Protein', 'p', 'var(--prot)'], ['Carbs', 'c', 'var(--carb)'], ['Fat', 'f', 'var(--fat)'], ['Fibre', 'fib', 'var(--fib)']].map(([l, k, c]) => `<div><div class="small" style="color:#D6DEE0;display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:2px;background:${c}"></span>${l}</div><div style="font-weight:800">${g1(per(k))} g</div></div>`).join('')}</div>
      </div>
      <div class="row" style="gap:8px"><button type="button" class="btn press" data-a="rsave" ${r.ings.length ? '' : 'disabled'}>Save recipe</button><button type="button" class="btn outline press" data-a="rsavelog" ${r.ings.length ? '' : 'disabled'}>Save &amp; log</button></div>
    </div>
    ${pad && !sheet ? `<div style="position:fixed;left:0;right:0;bottom:0;z-index:30">${padHtml(pad.shownSetup)}</div>` : ''}
  </div>`;
};
afterRender.recipe = () => { if (pad) { if (!pad.shownSetup) { const el = document.getElementById(pad.id); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } pad.shownSetup = true; } };

function saveRecipe(andLog) {
  const r = ui.recipe;
  if (!r.name.trim()) { toast('Give your recipe a name'); const el = document.querySelector('[data-in="rname"]'); if (el) el.focus(); return; }
  if (!r.ings.length) return;
  const { t, weight } = recipeTotals(r);
  if (!(weight > 0)) { toast('Check the ingredient amounts'); return; }
  const per = {};
  S.NUTS.forEach(k => { per[k] = t[k] / weight * 100; });
  const portionG = weight / r.portions;
  const units = [
    { label: 'Portion (' + fmt(portionG) + ' g)', short: r.portions > 1 ? 'portions' : 'portion', g: portionG },
    { label: 'Whole pot (' + fmt(weight) + ' g)', short: 'pots', g: weight },
    { label: 'Grams', short: 'g', g: 1 }
  ];
  const food = { id: r.id, name: r.name.trim(), src: 'recipe', cat: 'recipe', per, units,
    recipe: { portions: r.portions, cookedG: r.weigh ? r.cookedG : 0, ings: r.ings }, used: (S.state.foods[r.id] && S.state.foods[r.id].used) || 0 };
  S.state.foods[r.id] = food; S.save();
  r.saved = true;
  ui.recipe = null; ui.pick = null; pad = null;
  ui.view = 'foods'; ui.q = ''; ui.tab = 'recipes'; ui.online = { q: '', status: 'idle', items: [], cnf: [] };
  render(); window.scrollTo(0, 0);
  if (andLog) openFoodSheet(food, { mode: 'add' });
  else toast(food.name + ' saved', fmt(per.kcal * portionG / 100) + ' kcal a portion · find it under Recipes', 'good');
}

/* ================= BARCODES ================= */
let stopScan = null;
function openScanner() {
  closeScanner();
  const el = document.createElement('div');
  el.id = 'scanner';
  el.innerHTML = `<div class="scanner" role="dialog" aria-label="Barcode scanner">
    <video playsinline muted></video>
    <div class="scan-shade"></div>
    <div class="scan-frame"><i></i><i></i><i></i><i></i><span class="scan-line"></span></div>
    <div class="scan-top"><span id="scanmsg">Starting the camera…</span></div>
    <div class="scan-bottom"><button type="button" class="btn quiet press" data-a="scantype">Type the barcode number</button><button type="button" class="btn press" data-a="scanclose" style="background:#3A4A4F">Cancel</button></div></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  const msg = t => { const m = document.getElementById('scanmsg'); if (m) m.textContent = t; };
  startScanner({ video: el.querySelector('video'), onStatus: msg, onCode: code => { if (navigator.vibrate) navigator.vibrate(60); closeScanner(); lookupBarcode(code); } })
    .then(stop => { if (document.getElementById('scanner')) stopScan = stop; else stop(); })
    .catch(e => {
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      msg(e && e.message === 'nocamera' ? 'This browser can\'t use the camera here.' : denied ? 'Camera permission was refused. Allow it in your browser settings, or type the number.' : e && /barcode reader/.test(e.message) ? 'Couldn\'t download the barcode reader (are you online?). You can type the number instead.' : 'The camera didn\'t start. You can type the number instead.');
      el.querySelector('.scanner').classList.add('failed');
    });
}
function closeScanner() {
  if (stopScan) { try { stopScan(); } catch (e) {} stopScan = null; }
  const el = document.getElementById('scanner');
  if (el) { const v = el.querySelector('video'); if (v && v.srcObject) v.srcObject.getTracks().forEach(t => t.stop()); el.remove(); }
  if (!sheet) document.body.style.overflow = '';
}
function openBarcodeEntry() {
  sheet = { type: 'barcode', anim: true, code: '' };
  openPad('bc', { raw: true, dec: 0, maxInt: 14, doneLabel: 'Look it up', apply: (v, b) => { sheet.code = b; }, rerender: still => renderOverlay(still) });
  renderOverlay();
}
function barcodeSheetHtml() {
  const c = sheet.code || '';
  const ok = validBarcode(c);
  return `<div class="sheet ${sheet.anim ? 'anim' : ''} withpad" role="dialog" aria-label="Type a barcode"><div class="grab"></div>
    <div class="row"><h3 class="grow">Type the barcode</h3><button type="button" class="iconbtn" data-a="close" aria-label="Close">${I.x({ s: 18 })}</button></div>
    <div class="small muted">The numbers printed under the stripes, usually 13 digits.</div>
    <button type="button" class="numbox on" style="height:60px;flex:none"><span class="v" style="letter-spacing:2px">${esc(c || ' ')}</span><span class="caret" style="height:26px"></span></button>
    <div class="small" style="text-align:center;font-weight:700;color:${c.length >= 8 ? (ok ? 'var(--accent)' : 'var(--over-ink)') : 'var(--ink3)'}">${c.length >= 8 ? (ok ? 'Looks like a valid barcode' : 'That doesn\'t look complete yet') : c.length + ' digits'}</div></div>`;
}
function lookupTyped() {
  const c = sheet && sheet.code || '';
  if (!validBarcode(c)) { if (sheet) { openPad('bc', { raw: true, dec: 0, maxInt: 14, doneLabel: 'Look it up', apply: (v, b) => { sheet.code = b; }, rerender: still => renderOverlay(still) }); pad.buf = c; pad.shown = true; renderOverlay(true); } toast('Check the number', 'Barcodes have 8, 12 or 13 digits. The last digit is a check digit.'); return; }
  closeSheet(true);
  lookupBarcode(c);
}
async function lookupBarcode(code) {
  const mine = Object.values(S.state.foods).find(f => f.code === code);
  if (mine) { openFoodSheet(mine); return; }
  toast('Looking up ' + code + '…');
  try {
    const food = await F.offBarcode(code, S.state.profile.country);
    $toast.innerHTML = '';
    if (food) { openFoodSheet(food); return; }
    confirmSheet('We don\'t know this one yet', 'Barcode ' + code + ' isn\'t in Open Food Facts. Add it from the label and it\'ll scan straight in next time.', 'Add from the label', () => openCreate(code));
  } catch (e) {
    toast('Couldn\'t look that up', 'Check your connection and try again.');
  }
}

/* ================= ME ================= */
VIEWS.me = () => {
  const p = S.state.profile, plan = S.plan();
  const custom = (p.meals || []).filter(m => ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].indexOf(m) < 0);
  const opt = (field, val, label) => `<button type="button" class="pill unit ${p[field] === val ? 'on' : ''}" data-a="meset" data-f="${field}" data-v="${val}" style="flex:1">${label}</button>`;
  return `<div class="screen"><div class="top"><div><div class="kicker">Settings & plan</div><h1>${esc(p.name || 'Me')}</h1></div></div>
    <div class="content">
      <div class="card rise"><div class="row"><div class="grow"><div class="small muted" style="font-weight:700">Daily target</div><div style="font-size:28px;font-weight:800;letter-spacing:-.8px">${fmt(plan.kcal)} kcal</div>
        <div class="small muted">P ${plan.p} g · C ${plan.c} g · F ${plan.f} g · Fibre 30 g</div></div></div>
        <button type="button" class="btn outline press" data-a="editplan" style="margin-top:12px">Edit my details & plan</button></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Food search country</div><div class="row" style="gap:6px">${opt('country', 'UK', 'United Kingdom')}${opt('country', 'CA', 'Canada')}</div>
        <div class="h2" style="margin-top:4px">Units</div><div class="row" style="gap:6px">${opt('units', 'metric', 'kg & cm')}${opt('units', 'uk', 'st & lb')}${opt('units', 'us', 'lb')}</div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Water</div>
        <div class="row"><span class="grow small" style="font-size:14px">Daily goal</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="waterGoal" data-d="-1" aria-label="Fewer cups">${I.minus({ s: 18, w: 2.8 })}</button><span style="width:70px;text-align:center;font-weight:800">${p.waterGoal || 8} cups</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="waterGoal" data-d="1" aria-label="More cups">${I.plus({ s: 18, w: 2.8 })}</button></div>
        <div class="row"><span class="grow small" style="font-size:14px">Cup size</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="cupMl" data-d="-50" aria-label="Smaller cup">${I.minus({ s: 18, w: 2.8 })}</button><span style="width:70px;text-align:center;font-weight:800">${p.cupMl || 250} ml</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="cupMl" data-d="50" aria-label="Bigger cup">${I.plus({ s: 18, w: 2.8 })}</button></div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Meals</div><div class="small muted">Breakfast, Lunch, Dinner and Snacks are always there. Add your own, e.g. “Pre-workout”.</div>
        ${custom.map(m => `<div class="row"><span class="grow" style="font-weight:700">${esc(m)}</span><button type="button" class="iconbtn" data-a="delmeal" data-m="${esc(m)}" aria-label="Remove ${esc(m)}">${I.x({ s: 16 })}</button></div>`).join('')}
        <div class="row" style="gap:8px"><input class="input" id="newmeal" placeholder="New meal name" maxlength="20" style="height:44px"><button type="button" class="btn press" data-a="addmeal" style="width:auto;padding:0 18px;height:44px">Add</button></div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Your data</div><div class="small muted">Everything is saved on this phone only — nothing is uploaded. Backup &amp; restore arrives in a later update.</div>
        <button type="button" class="btn danger press" data-a="reset">Delete everything and start again</button></div>
      <div class="attrib" style="text-align:center">Samslimmer · stage 2 preview</div>
    </div>${nav('me')}</div>`;
};

/* ================= PLACEHOLDERS ================= */
VIEWS.dash = () => `<div class="screen"><div class="top"><div><div class="kicker">How you're doing</div><h1>Dashboard</h1></div></div><div class="content"><div class="card soon rise">${I.chart({ s: 40, c: 'var(--ring)' })}<div class="h2">Charts are coming in stage 3</div><div class="small muted">Calories per day, macro pie and weekly bars, streak calendar, weight trend, the milestone journey and your food ratings. Everything you log now will show up there.</div></div></div>${nav('dash')}</div>`;
VIEWS.weight = () => `<div class="screen"><div class="top"><div><div class="kicker">Weigh-ins</div><h1>Weight</h1></div></div><div class="content"><div class="card soon rise">${I.scale({ s: 40, c: 'var(--ring)' })}<div class="h2">The weight logger arrives in stage 3</div><div class="small muted">Starting weight saved: ${fmtW(S.latestWeight(), S.state.profile.units)}.</div></div></div>${nav('weight')}</div>`;

/* ================= EVENTS ================= */
const A = {
  go: (d, el, e) => { e.preventDefault(); if (d.v === 'foods') ui.meal = null; go(d.v); },
  // today
  day: d => { ui.date = d.k; render(); },
  dayshift: d => { const k = S.addDays(ui.date, +d.n); if (k <= S.todayKey()) { ui.date = k; render(); } },
  cup: (d, el) => {
    const day = S.day(ui.date), i = +d.i, before = day.water;
    day.water = day.water === i + 1 ? i : i + 1; S.save();
    const p = S.state.profile;
    document.querySelectorAll('.cup').forEach((c, j) => {
      const on = j < day.water;
      if (on !== (j < before)) { c.innerHTML = cupSvg(on); c.classList.toggle('on', on); c.setAttribute('aria-label', 'Cup ' + (j + 1) + (on ? ', drunk' : '')); }
    });
    el.classList.remove('popnow'); void el.offsetWidth; el.classList.add('popnow');
    const lbl = document.getElementById('waterlbl');
    if (lbl) lbl.textContent = day.water + ' of ' + (p.waterGoal || 8) + ' cups · ' + ((day.water * (p.cupMl || 250)) / 1000).toFixed(2).replace(/0$/, '') + ' L';
    const goal = S.state.profile.waterGoal || 8;
    if (day.water === goal) toast('Water goal hit!', 'That\'s ' + ((goal * (S.state.profile.cupMl || 250)) / 1000) + ' litres. You\'re basically a cucumber.', 'good');
  },
  addto: d => { ui.meal = d.meal; ui.view = 'foods'; ui.q = ''; ui.tab = 'all'; ui.online = { q: '', status: 'idle', items: [], cnf: [] }; render(); window.scrollTo(0, 0); },
  entry: d => {
    const e = S.day(ui.date).entries.find(x => x.id === d.id);
    if (e) { ui.meal = e.meal; openFoodSheet(e.food, { mode: 'edit', entryId: e.id, amt: e.amt, unit: e.unit, meal: e.meal }); }
  },
  done: () => {
    const day = S.day(ui.date);
    if (day.done) { day.done = false; S.save(); render(); toast('Day reopened', 'Mark it done again when you\'re finished.'); return; }
    if (!day.entries.length) { confirmSheet('Mark an empty day as done?', 'Nothing is logged for this day yet. It\'ll still count towards your streak.', 'Mark as done', () => markDone()); return; }
    markDone();
  },
  // foods
  tab: d => { ui.tab = d.v; onQuery(ui.q); document.querySelectorAll('.tabs .pill').forEach(b => b.classList.toggle('on', b.dataset.v === d.v)); },
  country: () => { const p = S.state.profile; p.country = p.country === 'CA' ? 'UK' : 'CA'; S.save(); render(); onQuery(ui.q); toast('Food search: ' + (p.country === 'CA' ? 'Canada' : 'UK'), 'Products from ' + (p.country === 'CA' ? 'Canada' : 'the UK') + ' show first.'); },
  retry: () => runOnline(ui.q.trim()),
  scan: () => openScanner(),
  scanclose: () => closeScanner(),
  scantype: () => { closeScanner(); openBarcodeEntry(); },
  bclookup: () => { pad = null; lookupTyped(); },
  newrecipe: () => { startRecipe(null); },
  editrecipe: d => { const f = S.state.foods[d.id]; if (f) { closeSheet(true); startRecipe(f); } },
  backrecipe: () => { ui.pick = null; ui.view = 'recipe'; render(); },
  ingadd: () => { ui.pick = { type: 'recipe' }; ui.view = 'foods'; ui.q = ''; ui.tab = 'all'; ui.online = { q: '', status: 'idle', items: [], cnf: [] }; render(); window.scrollTo(0, 0); },
  ing: d => { const it = ui.recipe.ings.find(x => x.id === d.id); if (it) openFoodSheet(it.food, { mode: 'ingedit', ingId: it.id, amt: it.amt, unit: it.unit }); },
  ingx: d => { const it = ui.recipe.ings.find(x => x.id === d.id); ui.recipe.ings = ui.recipe.ings.filter(x => x.id !== d.id); render(); if (it) toast(it.food.name + ' removed'); },
  saveING: () => { const it = ui.recipe.ings.find(x => x.id === sheet.ingId); if (it) { const { grams, n } = sheetNumbers(); Object.assign(it, { amt: sheet.amt, unit: sheet.unit, grams, n }); } closeSheet(); render(); },
  delING: () => { ui.recipe.ings = ui.recipe.ings.filter(x => x.id !== sheet.ingId); closeSheet(); render(); },
  rportions: d => { ui.recipe.portions = clamp(ui.recipe.portions + +d.d, 1, 30); render(); },
  rweigh: () => { const r = ui.recipe; r.weigh = !r.weigh; if (r.weigh && !r.cookedG) r.cookedG = Math.round(r.ings.reduce((a, x) => a + x.grams, 0)); pad = null; render(); },
  rcooked: () => { openPad('rcooked', { dec: 0, maxInt: 5, apply: v => { ui.recipe.cookedG = v; }, rerender: () => render() }); render(); },
  rsave: () => saveRecipe(false),
  rsavelog: () => saveRecipe(true),
  rdelete: () => { const r = ui.recipe; confirmSheet('Delete “' + (r.name || 'this recipe') + '”?', 'It disappears from your recipes. Anything you already logged stays in your history.', 'Delete recipe', () => { delete S.state.foods[r.id]; S.state.recents = S.state.recents.filter(id => id !== r.id); S.save(); ui.recipe = null; go('foods'); ui.tab = 'recipes'; refreshResults(); document.querySelectorAll('.tabs .pill').forEach(b => b.classList.toggle('on', b.dataset.v === 'recipes')); toast('Recipe deleted'); }, true); },
  rback: () => {
    const r = ui.recipe;
    const leave = () => { ui.recipe = null; ui.pick = null; go('foods'); };
    if (r && r.dirty !== false && r.ings.length && !r.saved) confirmSheet('Leave without saving?', 'Your recipe changes will be lost.', 'Leave', leave, true); else leave();
  },
  res: d => { const f = findListed(d.id, d.list); if (f) openFoodSheet(f); },
  create: () => openCreate(),
  // sheet
  backdrop: () => { if (pad) { pad = null; renderOverlay(); } else closeSheet(); },
  close: () => closeSheet(),
  confirmyes: () => { const f = sheet.onYes; closeSheet(); f(); },
  unit: d => {
    const f = sheet.food, oldU = f.units[sheet.unit], nu = f.units[+d.i];
    const grams = sheet.amt * oldU.g;
    const oldW = WEIGHTY.indexOf(oldU.short) >= 0, newW = WEIGHTY.indexOf(nu.short) >= 0;
    let a;
    if (!oldW && !newW) a = 1;                       // slice -> cup: just start at 1
    else { a = grams / nu.g; a = nu.g === 1 ? Math.round(a) : newW ? Math.round(a * 10) / 10 : Math.round(a * 4) / 4; }
    sheet.unit = +d.i; sheet.amt = a > 0 ? a : (nu.g === 1 ? 100 : 1);
    if (pad) pad = null;
    renderOverlay();
  },
  amtstep: d => {
    const u = sheet.food.units[sheet.unit], step = u.g === 1 ? 10 : (u.short === 'oz' || u.short === 'fl oz') ? 1 : 0.5;
    sheet.amt = Math.max(0, Math.round((sheet.amt + step * +d.d) * 100) / 100);
    if (pad) pad.buf = '';
    renderOverlay(true);
  },
  amtpad: () => {
    if (pad && pad.id === 'amt') return;
    const u = sheet.food.units[sheet.unit];
    openPad('amt', { dec: u.g === 1 ? 0 : 2, maxInt: u.g === 1 ? 5 : 3, apply: v => { sheet.amt = v; }, rerender: still => renderOverlay(still) });
    renderOverlay();
  },
  smeal: d => { sheet.meal = d.m; renderOverlay(true); },
  addfood: () => addFoodNow(),
  saveentry: () => {
    const day = S.day(ui.date), e = day.entries.find(x => x.id === sheet.entryId);
    if (e) { const { grams, n } = sheetNumbers(); Object.assign(e, { amt: sheet.amt, unit: sheet.unit, grams, n, meal: sheet.meal }); S.save(); }
    closeSheet(); render(); toast('Updated');
  },
  delentry: () => {
    const day = S.day(ui.date), e = day.entries.find(x => x.id === sheet.entryId);
    day.entries = day.entries.filter(x => x.id !== sheet.entryId); S.save(); closeSheet(); render();
    if (e) toast(e.food.name + ' removed');
  },
  padkey: d => padKey(d.k),
  paddone: () => {
    const r = pad && pad.rerender, id = pad && pad.id; pad = null;
    if (id === 'bc') { lookupTyped(); return; }
    if (!sheet) render(); else if (r) renderOverlay(true);
  },
  // create food
  cfpad: d => {
    const k = d.k, f = CF_FIELDS.find(x => x[0] === k), was = !!pad;
    openPad('cf_' + k, { dec: f[3], maxInt: k === 'kcal' || k === 'size' ? 4 : 3, apply: v => { sheet.v[k] = v; }, rerender: still => renderOverlay(still) });
    if (was) pad.shown = true;
    renderOverlay();
  },
  cfbasis: d => { sheet.basis = d.v; pad = null; renderOverlay(); },
  cfsave: () => { pad = null; saveCreated(); },
  // setup
  suset: d => { const su = ui.su; const v = d.v; su[d.f] = (d.f === 'act' || d.f === 'pace') ? +v : v; if (d.f === 'country' && v === 'CA' && su.units === 'uk') su.units = 'us'; pad = null; render(); },
  supad: d => {
    const B = suFields(ui.su), b = B[d.id], was = !!pad;
    openPad(d.id, { dec: b.dec, maxInt: b.max, apply: v => { suFields(ui.su)[d.id].set(v); }, rerender: () => render() });
    if (was) pad.shownSetup = true;
    render();
  },
  suown: () => { ui.su.own = !ui.su.own; pad = null; render(); },
  sunext: () => {
    const su = ui.su;
    if (su.step === 1 && (su.age < 13 || su.age > 110)) { toast('Check your age', 'Samslimmer is made for adults.'); return; }
    if (su.step === 1 && (su.hcm < 120 || su.hcm > 230)) { toast('Check your height', 'That height looks unusual — double-check the units.'); return; }
    if (su.step === 2 && (su.wkg < 35 || su.wkg > 300 || su.gkg < 35 || su.gkg > 300)) { toast('Check your weights', 'Those numbers look unusual — double-check the units.'); return; }
    if (su.step === 5 && su.own && su.ownKcal < 1000) { toast('That number is very low', 'Please use at least 1,000 kcal, or switch back to the calculated plan.'); return; }
    pad = null;
    if (su.step === 5) { finishSetup(); return; }
    su.step++; ui.suAnim = true; render(); window.scrollTo(0, 0);
  },
  suback: () => { const su = ui.su; pad = null; if (su.step === 0 || (su.editing && su.step === 1)) { if (su.editing) { ui.su = null; go('me'); } return; } su.step--; ui.suAnim = true; render(); },
  // me
  editplan: () => { startSetup(true); ui.suAnim = true; ui.view = 'setup'; render(); window.scrollTo(0, 0); },
  meset: d => { S.state.profile[d.f] = d.v; S.save(); render(); },
  water: d => { const p = S.state.profile; const v = (p[d.f] || (d.f === 'cupMl' ? 250 : 8)) + +d.d; p[d.f] = d.f === 'cupMl' ? clamp(v, 100, 1000) : clamp(v, 1, 16); S.save(); render(); },
  addmeal: () => {
    const el = document.getElementById('newmeal'), v = (el.value || '').trim();
    const p = S.state.profile; p.meals = p.meals || ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    if (!v) return; if (p.meals.some(m => m.toLowerCase() === v.toLowerCase())) { toast('You already have that meal'); return; }
    p.meals.push(v); S.save(); render(); toast(v + ' added', 'It\'ll show on your Today screen.');
  },
  delmeal: d => {
    const p = S.state.profile; const used = Object.values(S.state.days).some(day => day.entries.some(e => e.meal === d.m));
    const doIt = () => { p.meals = p.meals.filter(m => m !== d.m); S.save(); render(); };
    if (used) confirmSheet('Remove “' + d.m + '”?', 'Foods you logged under it stay in your history, but won\'t show on Today.', 'Remove', doIt, true); else doIt();
  },
  reset: () => confirmSheet('Delete everything?', 'This wipes your plan, every logged food, your streak and weights from this phone. It can\'t be undone.', 'Delete everything', () => { S.resetAll(); ui.su = null; startSetup(); go('setup'); }, true)
};

function markDone() {
  const day = S.day(ui.date); day.done = true; S.save();
  const n = S.streak(), isToday = ui.date === S.todayKey();
  render(); confetti();
  const line = STREAK_LINES[n];
  if (isToday && line) toast(line[0], line[1], 'warm');
  else toast(isToday ? DONE_LINES[Math.floor(Math.random() * DONE_LINES.length)] : 'Day marked as done', n + '-day streak' + (n > 1 ? ' 🔥' : ''), 'warm');
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t || t.disabled) return;
  const fn = A[t.dataset.a];
  if (fn) fn(t.dataset, t, e);
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (!k) return;
  const v = e.target.value;
  if (k === 'q') onQuery(v);
  else if (k === 'suname') ui.su.name = v;
  else if (k === 'cfname') { sheet.name = v; const b = document.querySelector('[data-a="cfsave"]'); if (b) b.disabled = !v.trim(); }
  else if (k === 'cfbrand') sheet.brand = v;
  else if (k === 'cfserving') sheet.serving = v;
  else if (k === 'rname' && ui.recipe) ui.recipe.name = v;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'newmeal') A.addmeal();
  if (e.key === 'Enter' && e.target.id === 'q') { clearTimeout(searchTimer); const q = ui.q.trim(); if (q.length >= 2 && ui.tab === 'all') runOnline(q); e.target.blur(); }
  if (e.key === 'Escape' && document.getElementById('scanner')) closeScanner();
  else if (e.key === 'Escape' && sheet) closeSheet();
  if (pad && !e.target.matches('input') && /^[0-9.]$|^Backspace$/.test(e.key)) { padKey(e.key === 'Backspace' ? 'del' : e.key); e.preventDefault(); }
  if (pad && e.key === 'Enter' && !e.target.matches('input')) A.paddone();
});

// Midnight rollover: if the app stays open past midnight, move "today" along.
let lastToday = S.todayKey();
setInterval(() => { const t = S.todayKey(); if (t !== lastToday) { if (ui.date === lastToday) ui.date = t; lastToday = t; if (ui.view === 'today' && !sheet) render(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { const t = S.todayKey(); if (t !== lastToday) { if (ui.date === lastToday) ui.date = t; lastToday = t; if (!sheet) render(); } } });

/* ================= START ================= */
if (!S.state.profile) startSetup();
const h = (location.hash || '').slice(1);
if (S.state.profile && ['today', 'dash', 'foods', 'weight', 'me'].indexOf(h) >= 0) ui.view = h;
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
}
