// Samslimmer — main app
import * as S from './store.js';
import * as F from './foods.js';
import { startScanner, validBarcode } from './scan.js';
import * as T from './stats.js';
import * as BU from './buddy.js';
import * as RP from './report.js';

const $app = document.getElementById('app');
const $ov = document.getElementById('overlay');
const $toast = document.getElementById('toast-root');

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-GB');
const g1 = n => { const v = Math.round(n * 10) / 10; return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtAmt = n => String(Math.round(n * 100) / 100);
const WEIGHTY = F.MEASURES;
const favUnits = () => S.state.settings.favUnits || F.DEFAULT_FAVS;
const naMg = salt => Math.round((salt || 0) * 400); // salt g -> sodium mg

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
// A little glass: wobbly water with bubbles when full, a ghost "+" when empty. rise = fill up from the bottom.
const cupSvg = (on, i = 'x', rise = false) => {
  const glass = 'M5 5h22l-2.6 29.2a3 3 0 0 1-3 2.8H10.6a3 3 0 0 1-3-2.8z';
  return `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><defs><clipPath id="cg${i}"><path d="${glass}"/></clipPath></defs>
    <path d="${glass}" fill="${on ? 'var(--water-bg)' : 'var(--card)'}"/>
    ${on ? `<g clip-path="url(#cg${i})"><g class="cw-fill ${rise ? 'rise' : ''}">
      <path class="cw-wave2" d="M-24 11 q4 -2.4 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V40 H-24z" fill="var(--water-line)" opacity=".35"/>
      <path class="cw-wave" d="M-24 12.5 q4 2.4 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V40 H-24z" fill="var(--water)"/>
      <circle class="cw-bub" cx="12" cy="32" r="1.5" fill="#fff" opacity=".8"/><circle class="cw-bub b2" cx="19" cy="34" r="1.1" fill="#fff" opacity=".8"/><circle class="cw-bub b3" cx="16" cy="30" r=".9" fill="#fff" opacity=".8"/>
    </g></g>` : `<path d="M16 17v8M12 21h8" stroke="var(--dim2)" stroke-width="2" stroke-linecap="round" opacity=".7"/>`}
    <path d="${glass}" fill="none" stroke="${on ? 'var(--water-line)' : 'var(--dim2)'}" stroke-width="2" stroke-linejoin="round" ${on ? '' : 'stroke-dasharray="3.2 2.6"'}/>
    <path d="M9 9l1.4 18" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="${on ? '.65' : '0'}"/>
  </svg>`;
};

function toast(head, sub = '', cls = '', action = null) {
  toast.action = action ? action.fn : null;
  $toast.innerHTML = `<div class="toast ${cls} ${action ? 'withact' : ''}"><div class="grow" style="display:flex;flex-direction:column;gap:2px"><b>${esc(head)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>${action ? `<button type="button" class="toastbtn" data-a="toastact">${esc(action.label)}</button>` : ''}</div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => { $toast.innerHTML = ''; toast.action = null; }, action ? 5000 : 3000);
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
  buddyEv: null, buddySeed: Math.floor(Math.random() * 6),
  view: S.state.profile ? 'today' : 'setup',
  date: S.todayKey(),
  meal: null, q: '', tab: 'all',
  online: { q: '', status: 'idle', items: [], cnf: [] },
  lastView: null, ringPrev: 603.2, ring2Prev: null, barsPrev: {}, multi: false, sel: [],
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
// While the pad is fresh, keep showing the current value; the first key press replaces it.
function padShown(id) { return pad && pad.id === id && !pad.fresh ? (pad.buf === '' ? '0' : pad.buf) : null; }

/* ---------------- rendering ---------------- */
const NAV_ORDER = ['today', 'dash', 'foods', 'weight', 'me'];
const REDUCED = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
// The old page slides away while the new one slides in. It's only a picture of the old page, so it never catches taps.
function slideOut(dir) {
  const old = $app.querySelector('.screen'); if (!old) return;
  document.querySelectorAll('.pageout').forEach(x => x.remove());
  const c = old.cloneNode(true);
  c.querySelectorAll('.nav, #multibar, [id]').forEach(x => { if (x.classList.contains('nav') || x.id === 'multibar') x.remove(); else x.removeAttribute('id'); });
  const wrap = document.createElement('div');
  wrap.className = 'pageout pageout-' + dir; wrap.setAttribute('aria-hidden', 'true');
  c.style.transform = 'translateY(' + (-window.scrollY) + 'px)';
  const mv = document.createElement('div'); mv.className = 'pomove'; mv.appendChild(c);
  wrap.appendChild(mv); document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 420);
}
function render() {
  const anim = ui.view !== ui.lastView;
  // page change: slide in from the side you're heading to (nav order), never blocking taps
  const a0 = NAV_ORDER.indexOf(ui.lastView), a1 = NAV_ORDER.indexOf(ui.view);
  const dir = !anim || ui.lastView == null ? '' : a0 < 0 || a1 < 0 ? 'up' : a1 > a0 ? 'r' : 'l';
  ui.navFrom = anim && a0 >= 0 ? a0 : (ui.navFrom != null && !anim ? a1 : a1);
  ui.lastView = ui.view;
  if ((dir === 'l' || dir === 'r') && !REDUCED()) slideOut(dir);
  $app.className = anim ? 'anim' + (dir ? ' pagein-' + dir : '') : '';
  $app.innerHTML = (VIEWS[ui.view] || VIEWS.today)();
  afterRender[ui.view] && afterRender[ui.view](anim);
}
function go(v) {
  if (v !== 'setup' && !S.state.profile) v = 'setup';
  ui.view = v; closeSheet(true);
  if (v !== 'recipe' && !(v === 'foods' && ui.pick)) ui.pick = null;
  if (v !== 'foods') { ui.multi = false; ui.sel = []; }
  if (v === 'foods') { ui.q = ''; ui.tab = 'all'; ui.online = { q: '', status: 'idle', items: [], cnf: [] }; }
  try { if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v); } catch (e) {}
  render(); window.scrollTo(0, 0);
}

function nav(on) {
  const it = [['today', 'Today', I.home], ['dash', 'Dashboard', I.chart], ['foods', 'Foods', I.search], ['weight', 'Weight', I.scale], ['me', 'Me', I.user]];
  const to = NAV_ORDER.indexOf(on), from = ui.navFrom != null && ui.navFrom >= 0 ? ui.navFrom : to;
  ui.navFrom = to;
  return `<nav class="nav" aria-label="Main"><span class="navpill" aria-hidden="true" style="--from:${from};--to:${to}"></span>${it.map(([k, l, ic]) => `<a href="#${k}" data-a="go" data-v="${k}" class="${on === k ? 'on' : ''}" ${on === k ? 'aria-current="page"' : ''}>${ic()}${l}</a>`).join('')}</nav>`;
}

/* ================= TODAY ================= */
function weekKeys(k) {
  const d = S.parseKey(k), dow = (d.getDay() + 6) % 7; // Monday first
  const mon = S.addDays(k, -dow);
  return Array.from({ length: 7 }, (_, i) => S.addDays(mon, i));
}

function amountText(e) {
  const u = e.food.units[e.unit] || { short: 'g' };
  const plain = WEIGHTY.indexOf(u.short) >= 0;
  return plain ? `${fmtAmt(e.amt)} ${u.short}` : `${fmtAmt(e.amt)} × ${u.short}`;
}


/* ---------------- buddy (little man in the top bar) ---------------- */
function buddyName() { const p = S.state.profile; return p && p.sex === 'f' ? 'Samira' : 'Samer'; }
function buddyOn() { return S.state.settings.buddy !== false && !!S.state.profile; }
function buddyMood(d, plan, isToday) {
  return BU.moodFor(d, plan, { ev: ui.buddyEv, isToday, waterGoal: S.state.profile.waterGoal || 8 });
}
function buddyProps(mood, size) {
  const p = S.state.profile, st = S.state.settings;
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { mood, sex: p.sex === 'f' ? 'f' : 'm', age: (p.dob ? S.ageOf(p.dob) : p.age) || 35, hcm: p.hcm || 175, kg: S.latestWeight(), size: size || 84, animate: !still, moustache: st.tache !== false, shirt: st.shirt || '#C8553D' };
}
function buddyHtml(d, plan, isToday) {
  const mood = buddyMood(d, plan, isToday);
  return `<button type="button" class="buddy press" id="buddy" data-a="buddy" data-mood="${mood}" aria-label="${buddyName()} looks ${BU.MOOD_NAMES[mood]}. Tap ${S.state.profile.sex === 'f' ? 'her' : 'him'}.">${BU.buddySvg(buddyProps(mood))}</button>`;
}
let buddyTimer = null;
function buddyEvent(mood) {
  ui.buddyEv = { mood, t: Date.now() }; ui.buddySeed++;
  clearTimeout(buddyTimer);
  buddyTimer = setTimeout(() => { ui.buddyEv = null; refreshBuddy(false); }, 9200);
}
function refreshBuddy(poke, say) {
  const b = document.getElementById('buddy'); if (!b || ui.view !== 'today') return;
  const d = S.peekDay(ui.date), plan = S.plan(), isToday = ui.date === S.todayKey();
  const mood = buddyMood(d, plan, isToday);
  if (mood !== b.dataset.mood) { b.innerHTML = BU.buddySvg(buddyProps(mood)); b.dataset.mood = mood; b.setAttribute('aria-label', buddyName() + ' looks ' + BU.MOOD_NAMES[mood] + '. Tap ' + (S.state.profile.sex === 'f' ? 'her' : 'him') + '.'); }
  const bub = document.getElementById('bubble');
  if (bub) { bub.textContent = say || BU.lineFor(mood, ui.buddySeed + parseInt(ui.date.slice(-2), 10), S.state.profile.sex); bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); }
  if (poke) { b.classList.remove('poke'); void b.offsetWidth; b.classList.add('poke'); }
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
  const buddyLine = buddyOn() ? BU.lineFor(buddyMood(d, plan, isToday), ui.buddySeed + parseInt(k.slice(-2), 10), S.state.profile.sex) : '';
  const HEX = { 'var(--prot)': '#6366F1', 'var(--carb)': '#F97316', 'var(--fat)': '#EAB308', 'var(--fib)': '#10B981', 'var(--over)': '#DC2626' };
  const bar = (nm, cur, tgt, col) => { const c = cur > tgt * 1.05 && nm !== 'Protein' && nm !== 'Fibre' ? 'var(--over)' : col, w = clamp(cur / tgt * 100, 0, 100).toFixed(1) + '%', grow = ui.barsPrev[nm] !== w;
    return `<div class="bar"><span class="nm">${nm}</span><div class="tr"><div class="fl ${grow ? 'grow' : ''}" style="width:${w};background-color:${HEX[c]};background-color:${c}"></div></div><span class="vl">${fmt(cur)} / ${tgt}g</span></div>`; };
  const cups = Array.from({ length: p.waterGoal || 8 }, (_, i) => `<button type="button" class="cup ${i < d.water ? 'on' : ''}" data-a="cup" data-i="${i}" aria-label="Cup ${i + 1}${i < d.water ? ', drunk' : ''}">${cupSvg(i < d.water, i)}</button>`).join('');
  const mealsHtml = S.meals().map(m => {
    const es = d.entries.filter(e => e.meal === m);
    const kc = es.reduce((s, e) => s + e.n.kcal, 0);
    return `<div class="card rise"><div class="meal-h"><div class="grow"><div class="h2">${esc(m)}</div><div class="small muted">${es.length ? fmt(kc) + ' kcal' : 'Nothing yet'}</div></div>
      <button type="button" class="addbtn press" data-a="addto" data-meal="${esc(m)}" aria-label="Add food to ${esc(m)}">${I.plus({ s: 18, w: 2.8 })}</button></div>
      ${es.map(e => `<div class="swipe"><button type="button" class="swipe-del" data-a="swdel" data-id="${e.id}" tabindex="-1" aria-hidden="true">${I.trash({ s: 18, c: '#fff' })}Delete</button><button type="button" class="entry" data-a="entry" data-id="${e.id}" aria-label="${esc(e.food.name)}, ${fmt(e.n.kcal)} kcal. Tap to edit, swipe left to delete">${F.foodTile(e.food, 32)}<div class="grow"><div class="nm ell">${esc(e.food.name)}</div><div class="am ell">${esc(amountText(e))}${e.food.brand ? ' · ' + esc(e.food.brand) : ''}</div></div><span class="kc">${fmt(e.n.kcal)}</span></button></div>`).join('')}
    </div>`;
  }).join('');
  const dayDot = key => {
    const dd = S.peekDay(key); if (!dd.entries.length && !dd.done) return 'transparent';
    if (!dd.done) return 'var(--dim)';
    return S.totals(dd.entries).kcal > plan.kcal ? 'var(--over)' : 'var(--ring)';
  };
  return `<div class="screen">
    <div class="top ${buddyOn() ? 'withbuddy' : ''}">${buddyOn() ? buddyHtml(d, plan, isToday) : ''}<div class="grow" style="min-width:0">${buddyOn() ? `<div class="bubble" id="bubble">${esc(buddyLine)}</div>` : ''}<div class="kicker ell">${isToday ? greet : 'Looking back'}</div><h1>samslimmer</h1></div>
      <div class="row" style="gap:8px"><span class="chip" aria-label="${streak} day streak">${I.flame({ s: 16, c: 'var(--flame)', w: 2.4 })}${streak}</span>
        <button type="button" class="chip press" data-a="themeflip" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode" style="width:38px;justify-content:center;padding:7px 0">${isDark() ? svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', { s: 18 }) : I.moon({ s: 17 })}</button></div></div>
    <div class="row" style="padding:0 14px"><button type="button" class="iconbtn ghost" data-a="dayshift" data-n="-1" aria-label="Previous day">${I.back({ s: 20 })}</button>
      <div class="grow" style="text-align:center;font-weight:800;font-size:15px">${S.prettyDate(k)}${isToday ? '' : ` <span class="small muted">· ${S.longDate(k)}</span>`}</div>
      <button type="button" class="iconbtn ghost" data-a="dayshift" data-n="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.25"' : ''}>${I.next({ s: 20 })}</button></div>
    <div class="week">${wk.map(key => { const dd = S.parseKey(key), fut = key > S.todayKey(); return `<button type="button" class="${key === k ? 'sel' : ''}" data-a="day" data-k="${key}" ${fut ? 'disabled style="opacity:.4"' : ''} aria-label="${S.longDate(key)}"><span>${'MTWTFSS'[(dd.getDay() + 6) % 7]}</span><span class="dot" style="background:${key === k && !d.entries.length ? 'transparent' : dayDot(key)}"></span></button>`; }).join('')}</div>
    <div class="content">
      <div class="card rise">
        <div class="ringwrap"><svg width="184" height="184" viewBox="0 0 220 220" role="img" aria-label="${fmt(t.kcal)} of ${fmt(plan.kcal)} calories">
          <circle cx="110" cy="110" r="96" fill="none" stroke="var(--ring-track)" stroke-width="20"/>
          <circle class="prog" id="ring" cx="110" cy="110" r="96" fill="none" stroke="${over ? 'var(--over-light)' : 'var(--ring)'}" stroke-width="20" stroke-linecap="round" stroke-dasharray="603.2" stroke-dashoffset="${ui.ringPrev}" transform="rotate(-90 110 110)" data-off="${(603.2 * (1 - clamp(t.kcal / plan.kcal, 0, 1))).toFixed(1)}"/>
          ${over ? `<circle class="prog lap" id="ring2" cx="110" cy="110" r="96" fill="none" stroke="var(--over)" stroke-width="20" stroke-linecap="round" stroke-dasharray="603.2" stroke-dashoffset="${ui.ring2Prev != null ? ui.ring2Prev : 603.2}" transform="rotate(-90 110 110)" data-off="${(603.2 * (1 - clamp((t.kcal - plan.kcal) / plan.kcal, 0.012, 0.985))).toFixed(1)}"/>` : ''}</svg>
          <div class="ringtext"><span class="k">${over ? 'OVER BY' : 'REMAINING'}</span><span class="n" style="color:${over ? 'var(--over)' : 'var(--ink)'}" data-count="${Math.abs(left)}">${fmt(Math.abs(left))}</span><span class="small muted">${fmt(t.kcal)} of ${fmt(plan.kcal)} kcal</span></div></div>
        <div class="bars">${bar('Protein', t.p, plan.p, 'var(--prot)')}${bar('Carbs', t.c, plan.c, 'var(--carb)')}${bar('Fat', t.f, plan.f, 'var(--fat)')}${bar('Fibre', t.fib, plan.fib, 'var(--fib)')}</div>
        <div class="extras">Sugar ${g1(t.sug)} g · Sat fat ${g1(t.sat)} g · Sodium ${fmt(naMg(t.salt))} mg</div>
      </div>
      <div class="card rise"><div class="row" style="justify-content:space-between;margin-bottom:4px"><span class="h2">Water</span><span class="small muted" id="waterlbl">${d.water} of ${p.waterGoal || 8} cups · ${((d.water * (p.cupMl || 250)) / 1000).toFixed(2).replace(/0$/, '')} L</span></div><div class="cups">${cups}</div></div>
      ${isToday && backupDue() ? (() => { const why = backupDue(), n = Object.values(S.state.days).filter(x => x.entries.length).length;
        const [h, b] = why === 'tonight' ? ['Back up today?', 'Today isn\'t backed up yet. One tap saves a copy of all ' + n + ' days.'] : why === 'yesterday' ? ['Yesterday wasn\'t backed up', 'Save a copy now, so nothing is lost if the browser gets cleared.'] : ['Back up your log?', 'Your ' + n + ' days of logging live only on this phone. Save a copy in case the browser gets cleared.'];
        return `<div class="banner rise"><div><div class="h2" style="color:var(--warm-ink2)">${h}</div><div class="small" style="color:var(--warm-ink)">${b}</div></div>
        <div class="row" style="gap:8px"><button type="button" class="btn press" data-a="backup" style="height:44px;font-size:14px">Back up now</button><button type="button" class="btn quiet press" data-a="snooze" style="height:44px;font-size:14px;width:auto;padding:0 18px">Later</button></div></div>`; })() : ''}
      ${mealsHtml}
      <button type="button" class="btn ${d.done ? 'outline' : ''} press" data-a="done">${d.done ? I.check({ s: 18 }) + (isToday ? ' Day logged · tap to reopen' : ' Marked done · tap to reopen') : I.check({ s: 18, c: '#fff', w: 2.6 }) + (isToday ? ' Done for today' : ' Mark this day as done')}</button>
      ${!S.storageOk ? '<div class="small" style="color:var(--over-ink);text-align:center">This browser is not letting Samslimmer save. Check private browsing.</div>' : ''}
    </div>${nav('today')}</div>`;
};
afterRender.today = (anim) => {
  const r = document.getElementById('ring');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (r) { r.style.strokeDashoffset = r.dataset.off; ui.ringPrev = r.dataset.off; }
    const r2 = document.getElementById('ring2');
    if (r2) { r2.style.strokeDashoffset = r2.dataset.off; ui.ring2Prev = r2.dataset.off; } else ui.ring2Prev = null;
    document.querySelectorAll('.bar .fl').forEach(el => { ui.barsPrev[el.parentNode.previousElementSibling.textContent] = el.style.width; });
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
  f = withEdits(f);
  if (f.recipe && !ui.multi && !ui.pick) return `<div class="swipe rsw"><div class="swipe-acts"><button type="button" class="sw-edit" data-a="editrecipe" data-id="${esc(f.id)}" tabindex="-1">${svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>', { s: 18, c: '#fff' })}Edit</button><button type="button" class="sw-del" data-a="delrecipe" data-id="${esc(f.id)}" tabindex="-1">${I.trash({ s: 18, c: '#fff' })}Delete</button></div>${resRowInner(f, list)}</div>`;
  return resRowInner(f, list);
}
function resRowInner(f, list) {
  const u = f.units && f.units[0];
  const kcal = f.per && u ? f.per.kcal * u.g / 100 : null;
  const picked = ui.multi && ui.sel.some(x => x.food.id === f.id);
  return `<button type="button" class="res ${picked ? 'picked' : ''}" data-a="res" data-id="${esc(f.id)}" data-list="${list}" ${ui.multi ? `aria-pressed="${picked}"` : ''}>
    ${ui.multi ? `<span class="pick ${picked ? 'on' : ''}" data-a="qpick" data-id="${esc(f.id)}" data-list="${list}" title="Quick tick">${picked ? I.check({ s: 14, c: '#fff', w: 3 }) : ''}</span>` : ''}${F.foodTile(f)}
    <div class="grow" style="display:flex;flex-direction:column;gap:3px"><span class="nm ell">${esc(f.name)}</span>
      <span class="row" style="gap:6px;flex-wrap:wrap">${srcBadge(f)}<span class="small muted ell">${f.brand ? esc(f.brand) + ' · ' : ''}${u ? esc(u.label) : 'Tap for details'}${f.recipe ? ' · ' + f.recipe.ings.length + ' ingredients' : ''}</span></span>${(() => { const r = T.ratingFor(f); return r && r.verdict !== 'mixed' ? `<span style="font-size:11px;font-weight:700;color:${r.verdict === 'good' ? 'var(--accent-ink)' : 'var(--over-ink)'}">${r.verdict === 'good' ? 'Helps you stay on track' : 'Usually takes you over your limit'}</span>` : ''; })()}</div>
    ${kcal != null ? `<div style="display:flex;flex-direction:column;align-items:flex-end"><span class="kc">${fmt(kcal)}</span><span class="small muted">kcal</span></div>` : ''}</button>`;
}
function resultsHtml() {
  const local = F.localSearch(ui.q, ui.tab);
  const country = S.state.profile.country;
  const q = ui.q.trim();
  let html = '';
  const tabLbl = { mine: 'Foods you created', recent: 'Logged recently', recipes: (ui.multi || ui.pick) ? 'Your recipes' : 'Your recipes · swipe left to edit or delete' };
  const lbl = q ? (ui.tab === 'all' ? 'Your recipes, foods & everyday basics' : tabLbl[ui.tab])
    : ui.tab === 'all' ? (S.state.recents.length ? 'Recently used' : 'Everyday basics · search for brands & products') : tabLbl[ui.tab];
  if (ui.tab === 'all' && !q) {
    const { used, rest } = F.allFoods();
    if (used.length) html += `<div class="sectionlbl">Your most used</div><div class="list">${used.slice(0, 15).map(f => resRow(f, 'local')).join('')}</div>`;
    const more = used.slice(15).concat(rest).sort((a, b) => a.name.localeCompare(b.name));
    html += `<div class="sectionlbl">${used.length ? 'Everything else, A–Z' : 'All foods, A–Z · search for brands & products'}</div><div class="list">${more.map(f => resRow(f, 'local')).join('')}</div>`;
  } else if (local.length) html += `<div class="sectionlbl">${lbl}</div><div class="list">${local.map(f => resRow(f, 'local')).join('')}</div>`;
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
  return `<div class="screen" ${ui.multi ? 'style="padding-bottom:170px"' : ''}>
    <div class="searchhead">
      <div class="row" style="justify-content:space-between">${pick ? `<button type="button" class="iconbtn" data-a="backrecipe" aria-label="Back to recipe">${I.back({ s: 20, w: 2.4 })}</button>` : ''}<div class="grow"><div class="small muted ell" style="font-weight:700">${esc(kicker)}</div><div style="font-size:22px;font-weight:800;letter-spacing:-.4px;white-space:nowrap">${pick ? 'Add ingredient' : 'Find a food'}</div></div>
        <button type="button" class="pill ${ui.multi ? 'on' : 'unit'} press" data-a="multi" aria-pressed="${!!ui.multi}" style="display:flex;align-items:center;gap:5px;margin-right:6px">${ui.multi ? I.x({ s: 14, w: 2.6 }) + 'Cancel' : svg('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><path d="M3 17l3 3 5-5M14 18h7"/>', { s: 15 }) + '<span class="lg">Select several</span><span class="sm">Select</span>'}</button>
        <button type="button" class="pill unit on press" data-a="country" aria-label="Food country: ${p.country === 'CA' ? 'Canada' : 'UK'}. Tap to switch" style="display:flex;align-items:center;gap:6px">${I.globe({ s: 16 })}${p.country === 'CA' ? 'Canada' : 'UK'}</button></div>
      <div class="row" style="gap:8px"><label class="searchbox">${I.search({ s: 18, c: 'var(--ink2)', w: 2.4 })}<input id="q" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="Search e.g. porridge, Heinz beans…" value="${esc(ui.q)}" data-in="q" aria-label="Search foods"></label>
        <button type="button" class="scan press" data-a="scan" aria-label="Scan a barcode">${I.scan({ c: '#fff' })}</button></div>
      <div class="tabs">${tabs.map(([k, l]) => `<button type="button" class="pill ${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="content"><div id="selstrip">${selStripHtml()}</div><div id="results" style="display:flex;flex-direction:column;gap:8px">${resultsHtml()}</div>
      <div class="row" style="gap:8px"><button type="button" class="btn dashed press" data-a="create">${I.plus({ s: 18, w: 2.6 })}Create food</button>
      ${pick ? '' : `<button type="button" class="btn dashed press" data-a="newrecipe" style="border-color:var(--warm-line);color:var(--warm-ink)">${I.pot({ s: 18 })}Create recipe</button>`}</div>
      <div class="attrib">${F.ATTRIBUTION}</div></div>
    <div id="multibar">${multiBarHtml()}</div>
    ${pick ? '' : nav('foods')}</div>`;
};
function multiBarHtml() {
  if (!ui.multi) return '';
  const n = ui.sel.length;
  const kc = ui.sel.reduce((a, x) => a + x.food.per.kcal * x.food.units[x.unit].g * x.amt / 100, 0);
  return `<div class="multibar ${ui.pick ? 'nonav' : ''}"><div class="grow"><div style="font-weight:800">${n ? n + ' food' + (n > 1 ? 's' : '') + ' ticked · ' + fmt(kc) + ' kcal' : 'Tap foods to tick them'}</div><div class="small" style="opacity:.8">${n ? 'Keep searching to add more, or…' : 'Ticks stay while you search for other things'}</div></div>${n ? `<button type="button" class="btn press" data-a="multireview" style="width:auto;padding:0 16px;height:46px;font-size:15px">Add ${n} ${I.next({ s: 16, c: '#fff', w: 2.6 })}</button>` : ''}</div>`;
}
function selAmt(x) { const u = x.food.units[x.unit] || { short: '' }; return WEIGHTY.indexOf(u.short) >= 0 ? fmtAmt(x.amt) + ' ' + u.short : fmtAmt(x.amt) + '× ' + u.short; }
function selStripHtml() {
  if (!ui.multi || !ui.sel.length) return '';
  return `<div class="selstrip"><span class="small muted" style="font-weight:700;flex:none">Ticked:</span>${ui.sel.map(x => `<span class="selchip ${x.food.id === ui.lastPicked ? 'new' : ''}"><button type="button" class="selchip-main" data-a="selopen" data-id="${esc(x.food.id)}" aria-label="Change amount of ${esc(x.food.name)}">${esc(x.food.name.length > 16 ? x.food.name.slice(0, 15) + '…' : x.food.name)}<b>${esc(selAmt(x))}</b></button><button type="button" class="selchip-x" data-a="unpick" data-id="${esc(x.food.id)}" aria-label="Untick ${esc(x.food.name)}">${I.x({ s: 12, w: 2.8 })}</button></span>`).join('')}</div>`;
}
function markRow(id, on) {
  document.querySelectorAll('#results .res').forEach(row => {
    if (row.dataset.id !== id) return;
    row.classList.toggle('picked', on);
    row.setAttribute('aria-pressed', on);
    const pk = row.querySelector('.pick');
    if (pk) { pk.classList.toggle('on', on); pk.innerHTML = on ? I.check({ s: 14, c: '#fff', w: 3 }) : ''; pk.classList.remove('popnow'); if (on) { void pk.offsetWidth; pk.classList.add('popnow'); } }
  });
}
function refreshMulti(id, on) {
  const m = document.getElementById('multibar'); if (m) m.innerHTML = multiBarHtml();
  const st = document.getElementById('selstrip'); if (st) st.innerHTML = selStripHtml();
  if (id != null) markRow(id, on); else refreshResults();
}
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
  if (list === 'online') return withEdits(ui.online.items.find(f => f.id === id));
  if (list === 'cnf') return withEdits(ui.online.cnf.find(f => f.id === id));
  return S.state.foods[id] || F.BASICS.find(f => f.id === id);
}
// If you corrected a food's numbers, your version wins everywhere.
function withEdits(f) { const s = f && S.state.foods[f.id]; return s && s.edited ? Object.assign({}, f, s, { partial: false }) : f; }
const cleanFood = f => { const c = { id: f.id, name: f.name, brand: f.brand || '', src: f.src, liquid: !!f.liquid, per: f.per, units: f.units, code: f.code, cat: f.cat }; if (f.recipe) c.recipeId = f.id; return c; };

/* ---------- correcting a food's numbers ---------- */
function openEditFood() {
  const f = sheet.food, back = sheet;
  const u0 = f.units && f.units[0], serving = u0 && !F.isMeasure(u0);
  const size = serving ? u0.g : 100, k = size / 100, r1 = v => Math.round((v || 0) * k * 10) / 10;
  sheet = { type: 'create', anim: false, code: f.code || null, name: f.name, brand: f.brand || '', cat: f.cat || null, showBrand: !!f.brand,
    serving: serving ? u0.short : 'serving', basis: serving ? 'serving' : (f.liquid ? '100ml' : '100'), sunit: f.liquid ? 'ml' : 'g', basisOpen: true,
    v: { size: Math.round(size * 10) / 10, kcal: Math.round((f.per.kcal || 0) * k), p: r1(f.per.p), c: r1(f.per.c), f: r1(f.per.f), fib: r1(f.per.fib), sug: r1(f.per.sug), sat: r1(f.per.sat), na: Math.round((f.per.salt || 0) * 400 * k) },
    editing: { food: f, back } };
  pad = null; renderOverlay(true);
}
function saveEdited() {
  const s = sheet, orig = s.editing.food, back = s.editing.back;
  const size = s.basis === 'serving' ? (s.v.size || 100) : 100, per = {};
  ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'sat'].forEach(k => { per[k] = (s.v[k] || 0) * 100 / size; });
  per.salt = (s.v.na || 0) / 400 * 100 / size;
  const liq = cfLiquid(), U = liq ? 'ml' : 'g';
  const old0 = orig.units && orig.units[0], oldServing = old0 && !F.isMeasure(old0);
  let units = (orig.units || []).filter((u, i) => !(i === 0 && oldServing) && !F.isMeasure(u));
  if (s.basis === 'serving') units.unshift({ label: (s.serving || 'serving') + ' (' + g1(size) + ' ' + U + ')', short: s.serving || 'serving', g: size });
  units = units.concat(liq ? [{ label: 'Millilitres', short: 'ml', g: 1 }, { label: 'Fluid ounces', short: 'fl oz', g: 29.57 }] : [{ label: 'Grams', short: 'g', g: 1 }, { label: 'Ounces', short: 'oz', g: 28.35 }]);
  const food = Object.assign({}, orig, { name: s.name.trim() || orig.name, brand: s.brand.trim(), per, units, cat: s.cat || orig.cat, liquid: liq || undefined, edited: true, partial: false });
  delete food._uk;
  const prev = S.state.foods[food.id];
  S.state.foods[food.id] = Object.assign({}, prev || {}, food, { used: (prev && prev.used) || 0 }, prev && prev.recipe ? { recipe: prev.recipe } : {});
  S.save();
  const fresh = back.mode === 'edit' || back.mode === 'ingedit' || back.mode === 'seledit' ? food : F.withUnits(food, favUnits());
  sheet = Object.assign({}, back, { food: fresh, unit: back.unit < fresh.units.length ? back.unit : 0, foodEdited: true, anim: false });
  if (sheet.unit === 0 && F.isMeasure(fresh.units[0]) !== F.isMeasure(back.food.units[back.unit] || {})) sheet.amt = F.startAmt(fresh.units[0]);
  pad = null; renderOverlay(true);
  toast('Numbers corrected', 'Your version is used from now on' + (back.mode === 'edit' ? ' · tap Save changes to fix this entry too' : '') + '.', 'good');
}

/* ================= FOOD SHEET ================= */
function openFoodSheet(food, opts = {}) {
  food = withEdits(food);
  if (!opts.mode || opts.mode === 'add' || opts.mode === 'ingadd') { if (!food.partial) food = F.withUnits(food, favUnits()); }
  if (opts.sel && !opts.mode) opts.mode = 'seladd';
  const u0 = food.units && food.units[0];
  sheet = Object.assign({ type: 'food', food, amt: F.startAmt(u0), unit: 0, meal: ui.meal || defaultMeal(), mode: ui.pick ? 'ingadd' : 'add', anim: true }, opts);
  pad = null;
  renderOverlay();
  if (food.partial) {
    F.cnfDetails(food).then(full => {
      if (sheet && sheet.food === food) { if (sheet.sel && ui.pick && ui.recipe && full.id === ui.recipe.id) { closeSheet(); return; } sheet.food = F.withUnits(full, favUnits()); sheet.amt = F.startAmt(sheet.food.units[0]); sheet.unit = 0; sheet.anim = false; renderOverlay(); }
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
  const plain = WEIGHTY.indexOf(u.short) >= 0;
  const hint = u.short === 'g' ? '≈ ' + g1(grams / 28.35) + ' oz' : u.short === 'ml' ? '≈ ' + g1(grams / 29.57) + ' fl oz' : '= ' + fmt(grams) + (f.liquid ? ' ml' : ' g');
  const mode = sheet.mode, ing = mode === 'ingadd' || mode === 'ingedit' || mode === 'seladd' || mode === 'seledit';
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
    ${padOn ? `<div class="row small" style="justify-content:space-between;background:var(--bg);border-radius:12px;padding:8px 12px;font-weight:700;color:var(--chip-ink)"><span>P ${g1(n.p)} g</span><span>C ${g1(n.c)} g</span><span>F ${g1(n.f)} g</span><span>Fibre ${g1(n.fib)} g</span></div>` : `
    <div class="nutgrid">${[['Protein', n.p], ['Carbs', n.c], ['Fat', n.f], ['Fibre', n.fib], ['Sugar', n.sug], ['Sat fat', n.sat]].map(([l, v]) => `<div><span>${l}</span><span>${g1(v)} g</span></div>`).join('')}<div><span>Sodium</span><span>${fmt(naMg(n.salt))} mg</span></div><div><span>Weight</span><span>${fmt(grams)} ${f.liquid ? 'ml' : 'g'}</span></div></div>
    ${f.recipe || f.src === 'recipe' ? '' : `<button type="button" class="fixlink" data-a="editfood">${svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>', { s: 14, w: 2.4 })}${f.edited ? 'You corrected these numbers · edit again' : 'Numbers look wrong? Fix them'}</button>`}
    ${(() => { const r = mode === 'add' || mode === 'edit' ? T.ratingFor(f) : null; return r && r.verdict !== 'mixed' && !padOn ? `<div style="border-radius:14px;padding:10px 12px;font-size:13px;font-weight:700;background:${r.verdict === 'good' ? 'var(--accent-soft)' : 'var(--over-soft)'};color:${r.verdict === 'good' ? 'var(--accent-ink)' : 'var(--over-ink)'}">${esc(r.note)}</div>` : ''; })()}
    ${rec && mode === 'add' ? `<div class="row" style="background:var(--warm-bg);border-radius:14px;padding:10px 12px"><span class="grow small" style="font-size:13px;color:var(--warm-ink2)">${rec.ings.length} ingredients · makes ${rec.portions} portion${rec.portions > 1 ? 's' : ''}${rec.cookedG ? ' · pot weighed ' + fmt(rec.cookedG) + ' g' : ''}</span><button type="button" class="pill" data-a="editrecipe" data-id="${esc(f.id)}" style="background:var(--warm-chip);color:var(--warm-ink)">Edit recipe</button></div>` : ''}
    ${ing ? '' : `<div class="row" style="gap:6px;flex-wrap:wrap">${S.meals().map(m => `<button type="button" class="pill unit ${m === sheet.meal ? 'on' : ''}" data-a="smeal" data-m="${esc(m)}" style="flex:1">${esc(m)}</button>`).join('')}</div>`}
    ${mode === 'seladd' ? `<button type="button" class="btn press" data-a="seltick" ${sheet.amt > 0 ? '' : 'disabled'}>${I.check({ s: 18, c: '#fff', w: 3 })} Tick it · ${fmt(n.kcal)} kcal</button>`
      : mode === 'seledit' ? `<div class="row" style="gap:8px"><button type="button" class="btn ghost press" data-a="seluntick" style="width:auto;padding:0 16px">Untick</button><button type="button" class="btn press" data-a="seltick" ${sheet.amt > 0 ? '' : 'disabled'}>Save amount</button></div>`
      : mode === 'edit' ? `<div class="row" style="gap:8px"><button type="button" class="btn danger press" data-a="delentry" style="width:auto;padding:0 18px" aria-label="Delete entry">${I.trash({ s: 18 })}</button><button type="button" class="btn press" data-a="saveentry">Save changes</button></div>`
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
  if (sheet.mode !== 'edit') buddyEvent(BU.reactTo([clean], n.kcal));
  const meal = sheet.meal;
  closeSheet(true);
  ui.view = 'today'; render(); window.scrollTo(0, 0);
  if (navigator.vibrate) navigator.vibrate(10);
  toast(f.name + ' added', fmt(n.kcal) + ' kcal to ' + meal, 'good');
  celebrate(3100);
}

/* ================= CREATE FOOD SHEET ================= */
const CF_FIELDS = [['size', 'Serving size', 'g', 0], ['kcal', 'Calories', 'kcal', 0], ['p', 'Protein', 'g', 1], ['c', 'Carbs', 'g', 1], ['f', 'Fat', 'g', 1], ['fib', 'Fibre', 'g', 1], ['sug', 'Sugar', 'g', 1], ['sat', 'Sat fat', 'g', 1], ['na', 'Sodium', 'mg', 0]];
function openCreate(code) {
  sheet = { type: 'create', anim: true, code: code || null, name: ui.q.trim() ? ui.q.trim().replace(/^./, c => c.toUpperCase()) : '', brand: '', serving: 'serving', basis: 'serving', sunit: 'g', basisOpen: true, cat: null, v: { size: 100, kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, na: 0 } };
  pad = null; renderOverlay();
}
const CF_ICONS = ['snack', 'sweet', 'bread', 'grain', 'meal', 'fruit', 'veg', 'meat', 'fish', 'egg', 'dairy', 'cheese', 'nut', 'drink', 'hot', 'pizza', 'oil', 'alcohol'];
function cfFood() { const s = sheet; return { name: s.name || 'x', cat: s.cat || undefined }; }
function cfLiquid() { const s = sheet; return s.basis === '100ml' || (s.basis === 'serving' && s.sunit === 'ml'); }
function createSheetHtml() {
  const s = sheet, padOn = !!pad, liq = cfLiquid(), U = liq ? 'ml' : 'g';
  const box = (k, big) => { const f = CF_FIELDS.find(x => x[0] === k), on = pad && pad.id === 'cf_' + k, sh = padShown('cf_' + k);
    return `<button type="button" class="nl-num ${big ? 'big' : ''} ${on ? 'on' : ''}" data-a="cfpad" data-k="${k}" id="cf_${k}" aria-label="${f[1]}"><span class="v">${esc(sh != null ? sh : (s.v[k] ? g1(s.v[k]) : '0'))}</span>${on ? '<span class="caret" style="height:' + (big ? 26 : 18) + 'px"></span>' : ''}${big ? '' : `<span class="u">${k === 'size' ? U : f[2]}</span>`}</button>`; };
  const row = (k, label, strong, sub) => `<div class="nl-row ${sub ? 'sub' : ''}"><span class="nl-l" style="font-weight:${strong ? 800 : 600}">${label}</span>${box(k)}</div>`;
  const basisTxt = s.basis === 'serving' ? 'per ' + esc(s.serving || 'serving') + (s.v.size ? ' · ' + g1(s.v.size) + ' ' + U : '') : s.basis === '100ml' ? 'per 100 ml' : 'per 100 g';
  return `<div class="sheet ${s.anim ? 'anim' : ''} ${padOn ? 'withpad' : ''}" role="dialog" aria-label="Create a food" id="cfsheet" style="${padOn ? 'max-height:calc(100dvh - 330px)' : ''}">
    <div class="grab"></div>
    <div class="row" style="gap:12px;align-items:center"><button type="button" class="cf-tile press" data-a="cficons" id="cftile" aria-label="Change the icon">${F.foodTile(cfFood(), 52)}</button>
      <div class="grow" style="min-width:0"><input class="cf-name" data-in="cfname" value="${esc(s.name)}" placeholder="Name, e.g. Mum's flapjack" autocomplete="off" aria-label="Food name">
        ${s.showBrand || s.brand ? `<input class="cf-brand" data-in="cfbrand" value="${esc(s.brand)}" placeholder="Brand, e.g. Tesco" autocomplete="off" aria-label="Brand">` : `<button type="button" class="cf-addbrand" data-a="cfbrandon">+ add a brand</button>`}</div>
      <button type="button" class="iconbtn" data-a="${s.editing ? 'cfcancel' : 'close'}" aria-label="${s.editing ? 'Back' : 'Close'}" style="align-self:flex-start">${s.editing ? I.back({ s: 18, w: 2.4 }) : I.x({ s: 18 })}</button></div>
    ${s.editing ? `<div class="fixnote">${svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>', { s: 15, w: 2.4 })}<span>Correcting the numbers. Your version is used every time you log this food from now on.</span></div>` : ''}
    ${s.code ? `<div class="small muted" style="font-weight:600;margin-top:-4px">Barcode ${esc(s.code)} · next time it'll scan straight in</div>` : ''}
    <div class="cf-icons" role="group" aria-label="Pick an icon">${CF_ICONS.map(c => `<button type="button" class="press ${F.catOf(cfFood()) === c ? 'on' : ''}" data-a="cfcat" data-v="${c}" aria-label="${c} icon">${F.foodTile({ name: 'x', cat: c }, 34)}</button>`).join('')}</div>
    <div class="nlabel">
      <div class="row" style="gap:8px"><span class="nl-title grow">Nutrition</span><button type="button" class="pill unit on press nl-basis" data-a="cfbasisopen" aria-expanded="${!!s.basisOpen}">${basisTxt} ${svg('<path d="M7 10l5 5 5-5"/>', { s: 14, w: 2.6 })}</button></div>
      ${s.basisOpen ? `<div class="nl-panel"><div class="small" style="font-weight:700">The packet shows values…</div>
        <div class="seg" style="margin:0;padding:3px">${[['serving', 'Per serving'], ['100', 'Per 100 g'], ['100ml', 'Per 100 ml']].map(([k, l]) => `<button type="button" class="${s.basis === k ? 'on' : ''}" data-a="cfbasis" data-v="${k}" style="height:32px;font-size:12px">${l}</button>`).join('')}</div>
        ${s.basis === 'serving' ? `<div class="row" style="gap:8px"><input class="input" data-in="cfserving" value="${esc(s.serving)}" placeholder="bar, slice, pot…" autocomplete="off" style="flex:1;min-width:0;height:44px" aria-label="Serving name">${box('size')}
          <div class="seg" style="margin:0;padding:3px;flex:none">${['g', 'ml'].map(u => `<button type="button" class="${(s.sunit || 'g') === u ? 'on' : ''}" data-a="cfsunit" data-v="${u}" style="height:32px;padding:0 10px;font-size:12px">${u}</button>`).join('')}</div></div>` : ''}</div>` : ''}
      <div class="nl-cal"><span class="grow" style="font-size:18px;font-weight:900">Calories</span>${box('kcal', true)}<span class="small muted" style="font-weight:800;margin-left:4px">kcal</span></div>
      ${row('f', 'Fat', true)}${row('sat', 'of which saturates', false, true)}${row('c', 'Carbohydrate', true)}${row('sug', 'of which sugars', false, true)}${row('fib', 'Fibre', true)}${row('p', 'Protein', true)}${row('na', 'Sodium', true)}
    </div>
    <span class="small muted" style="text-align:center">Copy the numbers straight from the packet · leave anything you don't know at 0</span>
    <button type="button" class="btn press" data-a="cfsave" ${s.name.trim() ? '' : 'disabled'}>${s.editing ? 'Save corrected numbers' : 'Save &amp; log it'}</button>
  </div>`;
}
function saveCreated() {
  const s = sheet;
  if (!s.name.trim()) { toast('Give it a name first'); return; }
  const size = s.basis === 'serving' ? (s.v.size || 100) : 100;
  const per = {};
  ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'sat'].forEach(k => { per[k] = (s.v[k] || 0) * 100 / size; });
  per.salt = (s.v.na || 0) / 400 * 100 / size; // sodium mg -> salt g
  const liq = cfLiquid(), U = liq ? 'ml' : 'g', units = [];
  if (s.basis === 'serving') units.push({ label: (s.serving || 'serving') + ' (' + g1(size) + ' ' + U + ')', short: s.serving || 'serving', g: size });
  if (liq) units.push({ label: 'Millilitres', short: 'ml', g: 1 }, { label: 'Fluid ounces', short: 'fl oz', g: 29.57 });
  else units.push({ label: 'Grams', short: 'g', g: 1 }, { label: 'Ounces', short: 'oz', g: 28.35 });
  const food = { id: 'mine:' + S.uid(), name: s.name.trim(), brand: s.brand.trim(), src: 'mine', per, units, code: s.code || undefined, liquid: liq || undefined, cat: s.cat || undefined };
  S.state.foods[food.id] = Object.assign({ used: 0 }, food); S.save();
  openFoodSheet(food, s.forRecipe && ui.recipe ? { anim: false, mode: 'ingadd' } : { anim: false });
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
  else if (sheet.type === 'weigh') inner = weighSheetHtml();
  else if (sheet.type === 'multi') inner = multiSheetHtml();
  else if (sheet.type === 'quiz') inner = quizSheetHtml();
  else if (sheet.type === 'export') inner = exportSheetHtml();
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
    { step: 0, name: '', country: 'UK', units: 'metric', sex: 'm', dob: '', hcm: 175, wkg: 80, gkg: 72, act: 1, pace: -0.5, preset: 'bal', own: false, ownKcal: 2000, goalTouched: false };
  if (ui.su.wkg == null) ui.su.wkg = ui.su.startKg;
  if (ui.su.dob) { const [y, m, d] = ui.su.dob.split('-').map(Number); ui.su.by = y; ui.su.bm = m; ui.su.bd = d; }
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
    b_d: { get: () => su.bd || '', set: v => { su.bd = v; syncDob(su); }, unit: 'day', dec: 0, max: 2, ph: 'DD' },
    b_m: { get: () => su.bm || '', set: v => { su.bm = v; syncDob(su); }, unit: 'month', dec: 0, max: 2, ph: 'MM' },
    b_y: { get: () => su.by || '', set: v => { su.by = v; syncDob(su); }, unit: 'year', dec: 0, max: 4, ph: 'YYYY' },
    m_p: { get: () => Math.round(su.mp), set: v => { su.mp = v; }, unit: 'g', dec: 0, max: 3 },
    m_c: { get: () => Math.round(su.mc), set: v => { su.mc = v; }, unit: 'g', dec: 0, max: 3 },
    m_f: { get: () => Math.round(su.mf), set: v => { su.mf = v; }, unit: 'g', dec: 0, max: 3 },
    m_fib: { get: () => Math.round(su.mfib), set: v => { su.mfib = v; }, unit: 'g', dec: 0, max: 3 },
    h_cm: { get: () => Math.round(su.hcm), set: v => { su.hcm = v; }, unit: 'cm', dec: 0, max: 3 },
    h_ft: { get: () => ft, set: v => { su.hcm = (v * 12 + inch) * 2.54; }, unit: 'ft', dec: 0, max: 1 },
    h_in: { get: () => inch, set: v => { su.hcm = (ft * 12 + v) * 2.54; }, unit: 'in', dec: 0, max: 2 },
    own: { get: () => su.ownKcal, set: v => { su.ownKcal = v; }, unit: 'kcal', dec: 0, max: 4 }
  };
  ['w', 'g'].forEach(p => {
    const key = p === 'w' ? 'wkg' : 'gkg';
    const touch = p === 'g' ? () => { su.goalTouched = true; } : () => {};
    B[p + '_kg'] = { get: () => g1(su[key]), set: v => { su[key] = v; touch(); }, unit: 'kg', dec: 1, max: 3 };
    B[p + '_lb'] = { get: () => g1(su[key] * S.LB), set: v => { su[key] = v / S.LB; touch(); }, unit: 'lb', dec: 1, max: 3 };
    B[p + '_st'] = { get: () => stParts(su[key])[0], set: v => { su[key] = (v * 14 + stParts(su[key])[1]) / S.LB; touch(); }, unit: 'st', dec: 0, max: 2 };
    B[p + '_stlb'] = { get: () => stParts(su[key])[1], set: v => { su[key] = (stParts(su[key])[0] * 14 + v) / S.LB; touch(); }, unit: 'lb', dec: 0, max: 2 };
  });
  return B;
}
function syncDob(su) {
  const d = +su.bd, m = +su.bm, y = +su.by;
  const dt = new Date(y, m - 1, d);
  su.dob = y >= 1900 && m >= 1 && m <= 12 && d >= 1 && dt.getMonth() === m - 1 && dt.getDate() === d && dt <= new Date() ? S.keyOf(dt) : '';
}
function suBox(id, B) {
  const b = B[id], on = pad && pad.id === id, sh = padShown(id), val = sh != null ? sh : b.get();
  return `<button type="button" class="numbox ${on ? 'on' : ''}" data-a="supad" data-id="${id}" id="${id}" aria-label="${b.unit}"><span class="v" ${val === '' ? 'style="color:var(--dim)"' : ''}>${esc(val === '' ? (b.ph || '0') : val)}</span>${on ? '<span class="caret" style="height:24px"></span>' : ''}<span class="u">${b.unit}</span></button>`;
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
      <span class="small muted">You can change all of this later in Me.</span></div>
    ${su.editing ? '' : `<div class="restorecard"><div class="grow"><div style="font-weight:800">Used Samslimmer before?</div><div class="small muted">Bring back your log, foods and recipes from a backup file and skip all this.</div></div>
      <button type="button" class="btn outline press" data-a="restore" style="width:auto;padding:0 16px;height:44px;font-size:14px;flex:none">${svg('<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>', { s: 16, w: 2.4 })}Restore</button></div>`}`;
  if (st === 1) body = `
    <div class="field"><span class="label">Sex <span class="muted" style="font-weight:600">(only used in the calorie formula)</span></span><div class="row" style="gap:8px">${opt('sex', 'm', 'Male', '', 'style="flex:1;text-align:center"')}${opt('sex', 'f', 'Female', '', 'style="flex:1;text-align:center"')}</div></div>
    <div class="field"><span class="label">Birthday</span><div class="row dobrow" style="gap:8px">${suBox('b_d', B)}${suBox('b_m', B)}${suBox('b_y', B)}</div><span class="small muted" id="agehint">${su.dob ? 'You\'re ' + S.ageOf(su.dob) + '. Your plan updates itself on your birthday.' : 'Day, month and year — used to work out your age.'}</span></div>
    <div class="field"><span class="label">Height</span><div class="row" style="gap:8px">${hBoxes}</div><span class="small muted">${u === 'metric' ? '≈ ' + B.h_ft.get() + ' ft ' + B.h_in.get() + ' in' : '≈ ' + Math.round(su.hcm) + ' cm'}</span></div>`;
  if (st === 2) {
    let thing = WEIGHT_THINGS[0][1]; WEIGHT_THINGS.forEach(t => { if (diff >= t[0] - 0.3) thing = t[1]; });
    body = `<div class="field"><span class="label">Current weight</span><div class="row" style="gap:8px">${wBoxes('w')}</div></div>
    <div class="field"><span class="label">Goal weight</span><div class="row" style="gap:8px">${wBoxes('g')}</div></div>
    ${(() => { const g = S.suggestGoal(su.hcm, su.wkg, su.sex), rng = fmtW(g.lo, u) + '–' + fmtW(g.hi, u);
      const why = g.why === 'ok' ? 'You\'re already in the healthy range for your height (' + rng + '), so the suggestion is to stay around here.'
        : g.why === 'low' ? 'That\'s a little under the healthy range for your height (' + rng + '), so the suggestion is to gain a bit.'
        : g.why === 'step' ? 'The healthy range for your height is ' + rng + '. A realistic first goal is up to 10% of your weight — set a new one when you get there.'
        : 'That\'s the top of the healthy range for your height (' + rng + ').';
      return `<div class="card" style="display:flex;flex-direction:column;gap:6px;padding:12px 14px"><div class="row"><span class="grow" style="font-weight:800">Suggested goal: ${fmtW(g.goal, u)}</span>${Math.abs(g.goal - su.gkg) > 0.05 ? '<button type="button" class="pill unit on" data-a="usegoal">Use this</button>' : `<span class="small" style="color:var(--accent-ink);font-weight:800">${I.check({ s: 14 })} In use</span>`}</div>
        <div class="small muted">${why} A typical weight for a ${su.sex === 'm' ? 'man' : 'woman'} of your height is about ${fmtW(g.typical, u)}. It's only a guide — pick what feels right.</div></div>`; })()}
    <div style="background:var(--flame-soft);border-radius:16px;padding:12px 14px"><div style="font-size:14px;font-weight:800;color:var(--flame-ink)">${diff < 0.1 ? 'Staying put — nice and simple.' : 'That\'s ' + fmtW(diff, u) + ' to ' + (losing ? 'lose.' : 'gain.')}</div><div class="small" style="color:var(--flame-ink2)">${diff < 0.1 ? 'We\'ll aim to keep you steady.' : 'Hidden milestones along the way will reveal what you\'ve ' + (losing ? 'lost' : 'gained') + ' — no spoilers. You\'ve got this.'}</div></div>`;
  }
  if (st === 3) body = `<button type="button" class="btn dashed press" data-a="quiz" style="height:50px">${svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>', { s: 18 })}Not sure? Answer 3 quick questions</button>` + S.ACT.map((a, i) => `<button type="button" class="opt press ${su.act === i ? 'on' : ''}" data-a="suset" data-f="act" data-v="${i}">${a[1]}<span class="sub">${a[2]}</span></button>`).join('');
  if (st === 4) {
    const PACES = [[-0.25, 'Lose ' + rate(0.25) + ' a week', 'Relaxed'], [-0.5, 'Lose ' + rate(0.5) + ' a week', 'Recommended'], [-0.75, 'Lose ' + rate(0.75) + ' a week', 'Faster'], [-1, 'Lose ' + rate(1) + ' a week', 'Tough'], [0, 'Maintain my weight', ''], [0.25, 'Gain ' + rate(0.25) + ' a week', ''], [0.5, 'Gain ' + rate(0.5) + ' a week', '']]
      .filter(p => losing ? p[0] < 0 : gaining ? p[0] > 0 : p[0] === 0);
    if (!PACES.some(p => p[0] === su.pace)) su.pace = PACES[losing ? 1 : 0][0];
    body = PACES.map(p => {
      const k = S.calcPlan(Object.assign({}, su, { pace: p[0], own: false }), su.wkg);
      const dt = dateFor(p[0]);
      return `<button type="button" class="opt press ${su.pace === p[0] ? 'on' : ''}" data-a="suset" data-f="pace" data-v="${p[0]}"><span class="row"><span class="grow">${p[1]} <span style="font-size:11px;color:${k.floorHit ? 'var(--over-ink)' : p[2] === 'Recommended' ? 'var(--accent-ink)' : 'var(--ink2)'}">${k.floorHit ? 'Too low for you' : p[2]}</span></span><span>${fmt(k.kcal)}</span></span><span class="sub">${p[0] === 0 ? 'Keep things steady' : dt ? 'Reach your goal around ' + dt : ''} · kcal a day</span></button>`;
    }).join('');
  }
  if (st === 5) {
    const pr = S.PRESETS;
    body = `${!pad ? `<div class="card" style="display:flex;align-items:center;gap:16px"><div style="position:relative;width:120px;height:120px;flex:none"><svg width="120" height="120" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="96" fill="none" stroke="var(--ring-track)" stroke-width="20"/><circle cx="110" cy="110" r="96" fill="none" stroke="var(--ring)" stroke-width="20" stroke-linecap="round" stroke-dasharray="603.2" stroke-dashoffset="0" transform="rotate(-90 110 110)" style="animation:none"/></svg>
        <div class="ringtext"><span style="font-size:26px;font-weight:800;letter-spacing:-.8px;line-height:1">${fmt(plan.kcal)}</span><span class="small muted">kcal / day</span></div></div>
        <div class="grow" style="display:flex;flex-direction:column;gap:4px"><span class="small muted" style="font-size:13px">${su.own ? 'Using your own number' : 'You burn ≈ ' + fmt(plan.tdee) + ' kcal/day ' + (su.pace < 0 ? '− ' : '+ ') + Math.abs(Math.round(su.pace * 1100)) + ' for your pace'}</span>
          <span style="font-size:13px;font-weight:800;color:var(--accent-ink)">${su.pace ? 'Goal around ' + (dateFor(su.pace) || '—') : 'Maintaining'}</span>
          ${plan.floorHit ? `<span class="small" style="color:var(--amber-ink)">Raised to a safe minimum of ${fmt(plan.floor)} kcal</span>` : ''}</div></div>
      <div class="field"><span class="label">${su.ownMacros ? 'Your macros' : 'Macro split'}</span>${su.ownMacros ? '' : `<div class="row" style="gap:6px">${Object.keys(pr).map(k => `<button type="button" class="opt press ${su.preset === k ? 'on' : ''}" data-a="suset" data-f="preset" data-v="${k}" style="flex:1;text-align:center;font-size:13px;padding:8px 4px">${pr[k].label}<span class="sub">${pr[k].p}/${pr[k].c}/${pr[k].f}</span></button>`).join('')}</div>`}
        <div class="card" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:10px 12px">${[['Protein', plan.p, 'var(--prot)'], ['Carbs', plan.c, 'var(--carb)'], ['Fat', plan.f, 'var(--fat)'], ['Fibre', plan.fib, 'var(--fib)']].map(([n, v, c]) => `<div><div class="small muted" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:2px;background:${c}"></span>${n}</div><div style="font-weight:800">${v} g</div></div>`).join('')}</div></div>` : ''}
      <div class="row"><div class="grow"><div class="h2">Use my own number</div><div class="small muted">e.g. one a dietitian gave you</div></div><button type="button" class="switch ${su.own ? 'on' : ''}" role="switch" aria-checked="${su.own}" aria-label="Use my own calorie number" data-a="suown"></button></div>
      ${su.own ? `<div class="field"><span class="label">My daily calories</span><div class="row">${suBox('own', B)}</div></div>
      <div class="row"><div class="grow"><div class="h2">Set my own macros too</div><div class="small muted">Protein, carbs, fat and fibre in grams</div></div><button type="button" class="switch ${su.ownMacros ? 'on' : ''}" role="switch" aria-checked="${!!su.ownMacros}" aria-label="Set my own macros" data-a="suownm"></button></div>
      ${su.ownMacros ? `<div class="formgrid">${[['m_p', 'Protein'], ['m_c', 'Carbs'], ['m_f', 'Fat'], ['m_fib', 'Fibre']].map(([id, l]) => `<div class="field"><span class="small" style="font-weight:700">${l}</span>${suBox(id, B)}</div>`).join('')}</div>
        <div class="small" style="font-weight:700;color:${Math.abs(su.mp * 4 + su.mc * 4 + su.mf * 9 - su.ownKcal) > 100 ? 'var(--amber-ink)' : 'var(--ink2)'}">These macros add up to ${fmt(su.mp * 4 + su.mc * 4 + su.mf * 9)} kcal${Math.abs(su.mp * 4 + su.mc * 4 + su.mf * 9 - su.ownKcal) > 100 ? ' — that\'s different from your ' + fmt(su.ownKcal) + ' kcal target, which is fine if that\'s what you were given.' : ', close to your target.'}</div>` : ''}` : ''}`;
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
    name: (su.name || '').trim(), country: su.country, units: su.units, sex: su.sex, dob: su.dob, hcm: su.hcm,
    startKg: prev ? prev.startKg : su.wkg, gkg: su.gkg, act: su.act, pace: su.pace, preset: su.preset, own: su.own, ownKcal: su.ownKcal,
    ownMacros: !!(su.own && su.ownMacros), mp: su.mp, mc: su.mc, mf: su.mf, mfib: su.mfib,
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
        <div class="grow"><div class="small" style="font-weight:800;color:var(--warm-ink);display:flex;align-items:center;gap:5px">${I.pot({ s: 14, c: 'var(--warm-ink)' })}RECIPE</div><div style="font-size:20px;font-weight:800;letter-spacing:-.4px">${r.existing ? 'Edit recipe' : 'New recipe'}</div></div>
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
        <div class="row" style="gap:0"><button type="button" class="btn press" data-a="ingadd" style="background:transparent;color:var(--accent-ink);height:48px;font-size:14px;flex:1">${I.plus({ s: 18, w: 2.6 })}Add ingredient</button><span style="width:1px;height:26px;background:var(--line)"></span><button type="button" class="btn press" data-a="ingscan" style="background:transparent;color:var(--accent-ink);height:48px;font-size:14px;flex:1">${I.scan({ s: 18, w: 2.2 })}Scan barcode</button></div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px">
        <div class="row"><div class="grow"><div class="h2">Weigh the cooked pot</div><div class="small muted">Optional — lets you log it by grams later</div></div>
          <button type="button" class="switch ${r.weigh ? 'on' : ''}" role="switch" aria-checked="${!!r.weigh}" aria-label="Weigh the cooked pot" data-a="rweigh"></button></div>
        ${r.weigh ? `<div class="row" style="gap:10px"><span class="grow small" style="font-size:13px;font-weight:700">Cooked weight<br><span class="muted" style="font-weight:600">Raw ingredients add up to ${fmt(raw)} g</span></span>
          <button type="button" class="numbox ${pad && pad.id === 'rcooked' ? 'on' : ''}" data-a="rcooked" id="rcooked" style="flex:none;width:140px;height:50px"><span class="v">${esc(cookedShown != null ? cookedShown : fmt(r.cookedG))}</span>${pad && pad.id === 'rcooked' ? '<span class="caret" style="height:22px"></span>' : ''}<span class="u">g</span></button></div>
          <div class="small muted">→ about ${fmt(weight / n)} g per portion</div>` : ''}
      </div>
      <div style="background:var(--hero);color:var(--hero-ink);border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:10px">
        <div class="row" style="align-items:flex-end"><div class="grow"><div class="small" style="color:var(--dim)">Per portion</div><div style="font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1.1">${fmt(per('kcal'))} kcal</div></div><span class="small" style="color:var(--dim)">1 of ${n}${weight ? ' · ' + fmt(weight / n) + ' g' : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">${[['Protein', 'p', 'var(--prot)'], ['Carbs', 'c', 'var(--carb)'], ['Fat', 'f', 'var(--fat)'], ['Fibre', 'fib', 'var(--fib)']].map(([l, k, c]) => `<div><div class="small" style="color:var(--hero-ink2);display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:2px;background:${c}"></span>${l}</div><div style="font-weight:800">${g1(per(k))} g</div></div>`).join('')}</div>
      </div>
      <div class="row" style="gap:8px"><button type="button" class="btn press" data-a="rsave" ${r.ings.length ? '' : 'disabled'}>Save recipe</button><button type="button" class="btn outline press" data-a="rsavelog" ${r.ings.length ? '' : 'disabled'}>Save &amp; log</button></div>
    </div>
    ${pad && !sheet ? `<div style="position:fixed;left:0;right:0;bottom:0;z-index:30">${padHtml(pad.shownSetup)}</div>` : ''}
  </div>`;
};
afterRender.recipe = () => { if (pad) { if (!pad.shownSetup) { const el = document.getElementById(pad.id); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } pad.shownSetup = true; } };

function saveRecipe(andLog) {
  buddyEvent('chef');
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
    <div class="small" style="text-align:center;font-weight:700;color:${c.length >= 8 ? (ok ? 'var(--accent-ink)' : 'var(--over-ink)') : 'var(--ink3)'}">${c.length >= 8 ? (ok ? 'Looks like a valid barcode' : 'That doesn\'t look complete yet') : c.length + ' digits'}</div></div>`;
}
function lookupTyped() {
  const c = sheet && sheet.code || '';
  if (!validBarcode(c)) { if (sheet) { openPad('bc', { raw: true, dec: 0, maxInt: 14, doneLabel: 'Look it up', apply: (v, b) => { sheet.code = b; }, rerender: still => renderOverlay(still) }); pad.buf = c; pad.shown = true; renderOverlay(true); } toast('Check the number', 'Barcodes have 8, 12 or 13 digits. The last digit is a check digit.'); return; }
  closeSheet(true);
  lookupBarcode(c);
}
async function lookupBarcode(code) {
  const forRecipe = ui.scanFor === 'recipe' && !!ui.recipe && ui.view === 'recipe';
  ui.scanFor = null;
  const o = forRecipe ? { mode: 'ingadd' } : {};
  const mine = Object.values(S.state.foods).find(f => f.code === code);
  if (mine) { openFoodSheet(mine, o); return; }
  toast('Looking up ' + code + '…');
  try {
    const food = await F.offBarcode(code, S.state.profile.country);
    $toast.innerHTML = '';
    if (food) { openFoodSheet(food, o); return; }
    confirmSheet('We don\'t know this one yet', 'Barcode ' + code + ' isn\'t in Open Food Facts. Add it from the label and it\'ll scan straight in next time.', 'Add from the label', () => { openCreate(code); if (sheet) sheet.forRecipe = forRecipe; });
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
        <div class="small muted">P ${plan.p} g · C ${plan.c} g · F ${plan.f} g · Fibre ${plan.fib} g</div></div></div>
        <button type="button" class="btn outline press" data-a="editplan" style="margin-top:12px">Edit my details & plan</button></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Appearance</div>
        <div class="row" style="gap:6px">${[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => `<button type="button" class="pill unit ${(S.state.settings.theme || 'auto') === k ? 'on' : ''}" data-a="theme" data-v="${k}" style="flex:1">${l}</button>`).join('')}</div>
        <div class="small muted">Auto follows your phone's light or dark setting.</div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:12px"><div class="row" style="gap:12px">${S.state.profile ? `<div class="buddyprev" aria-hidden="true">${BU.buddySvg(buddyProps('happy', 76))}</div>` : ''}<div class="grow"><div class="h2">${buddyName()}</div><div class="small muted">Your little man in the top bar. Tap ${S.state.profile && S.state.profile.sex === 'f' ? 'her' : 'him'} for a line, poke ${S.state.profile && S.state.profile.sex === 'f' ? 'her' : 'him'} three times if you dare. His shape follows your height and weigh-ins; his mood follows how healthy today's choices are.</div></div></div>
        <div class="row"><span class="grow small" style="font-size:14px">Show on Today</span><button type="button" class="switch ${S.state.settings.buddy !== false ? 'on' : ''}" role="switch" aria-checked="${S.state.settings.buddy !== false}" aria-label="Show ${buddyName()}" data-a="buddyset" data-k="buddy"></button></div>
        ${S.state.profile && S.state.profile.sex !== 'f' ? `<div class="row"><span class="grow small" style="font-size:14px">Moustache</span><button type="button" class="switch ${S.state.settings.tache !== false ? 'on' : ''}" role="switch" aria-checked="${S.state.settings.tache !== false}" aria-label="Moustache" data-a="buddyset" data-k="tache"></button></div>` : ''}
        <div class="row"><span class="grow small" style="font-size:14px">Shirt</span><div class="row" style="gap:8px">${[['#C8553D', 'Brick red'], ['#2E8A82', 'Teal'], ['#3B5BA9', 'Blue'], ['#E0A43A', 'Mustard']].map(([c, l]) => `<button type="button" class="swatch press ${(S.state.settings.shirt || '#C8553D') === c ? 'on' : ''}" style="background:${c}" data-a="buddyset" data-k="shirt" data-v="${c}" aria-label="${l} shirt" aria-pressed="${(S.state.settings.shirt || '#C8553D') === c}"></button>`).join('')}</div></div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Food search country</div><div class="row" style="gap:6px">${opt('country', 'UK', 'United Kingdom')}${opt('country', 'CA', 'Canada')}</div>
        <div class="h2" style="margin-top:4px">Units</div><div class="row" style="gap:6px">${opt('units', 'metric', 'kg & cm')}${opt('units', 'uk', 'st & lb')}${opt('units', 'us', 'lb')}</div>
        <div class="h2" style="margin-top:4px">Favourite food units</div><div class="small muted">These show first when you add a food, and the first one that fits is picked for you. Volume units (ml, cup, tbsp…) appear on drinks, sauces, oils, yoghurt and the like.</div>
        <div class="row" style="gap:6px;flex-wrap:wrap">${F.ALL_UNITS.map(([k, l]) => { const on = favUnits().indexOf(k) >= 0; return `<button type="button" class="pill unit ${on ? 'on' : ''}" data-a="favunit" data-v="${k}" aria-pressed="${on}" title="${l}">${k === 'serving' ? 'Servings' : k}</button>`; }).join('')}</div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Water</div>
        <div class="row"><span class="grow small" style="font-size:14px">Daily goal</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="waterGoal" data-d="-1" aria-label="Fewer cups">${I.minus({ s: 18, w: 2.8 })}</button><span style="width:70px;text-align:center;font-weight:800">${p.waterGoal || 8} cups</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="waterGoal" data-d="1" aria-label="More cups">${I.plus({ s: 18, w: 2.8 })}</button></div>
        <div class="row"><span class="grow small" style="font-size:14px">Cup size</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="cupMl" data-d="-50" aria-label="Smaller cup">${I.minus({ s: 18, w: 2.8 })}</button><span style="width:70px;text-align:center;font-weight:800">${p.cupMl || 250} ml</span><button type="button" class="step press" style="height:40px" data-a="water" data-f="cupMl" data-d="50" aria-label="Bigger cup">${I.plus({ s: 18, w: 2.8 })}</button></div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Meals</div><div class="small muted">Breakfast, Lunch, Dinner and Snacks are always there. Add your own, e.g. “Pre-workout”.</div>
        ${custom.map(m => `<div class="row"><span class="grow" style="font-weight:700">${esc(m)}</span><button type="button" class="iconbtn" data-a="delmeal" data-m="${esc(m)}" aria-label="Remove ${esc(m)}">${I.x({ s: 16 })}</button></div>`).join('')}
        <div class="row" style="gap:8px"><input class="input" id="newmeal" placeholder="New meal name" maxlength="20" style="height:44px"><button type="button" class="btn press" data-a="addmeal" style="width:auto;padding:0 18px;height:44px">Add</button></div></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="row" style="gap:12px"><span class="mtile" aria-hidden="true">${svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>', { s: 22, c: 'var(--accent-ink)' })}</span><div class="grow"><div class="h2">Food log for your dietitian</div><div class="small muted">Pick the dates, get a PDF of every meal with full nutrition.</div></div></div>
        <button type="button" class="btn outline press" data-a="exportlog">${svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', { s: 18, w: 2.4 })}Export food log (PDF)</button></div>
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div class="h2">Your data</div><div class="small muted">Everything is saved on this phone only — nothing is uploaded. If the browser's data gets cleared, it's gone, so save a backup now and then.</div>
        <div class="row" style="gap:10px;background:var(--bg);border-radius:14px;padding:10px 12px">${I.check({ s: 18, c: S.state.lastBackup ? 'var(--accent-ink)' : 'var(--dim)' })}<span class="grow small" style="font-size:13px">${S.state.lastBackup ? 'Last backup: ' + S.prettyDate(S.state.lastBackup).toLowerCase().replace(/^(\w)/, c => c.toUpperCase()) : 'No backup yet'}</span></div>
        <button type="button" class="btn press" data-a="backup">${svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', { s: 18, c: '#fff', w: 2.4 })}Save a backup file</button>
        <div class="row"><span class="grow small" style="font-size:14px">Back up when I tap “Done”<div class="muted" style="font-size:12px">${IOS ? 'Opens the Save sheet once a day' : 'Saves a file to Downloads once a day'}, and reminds you in the evening if you forget.</div></span><button type="button" class="switch ${S.state.settings.autoBackup !== false ? 'on' : ''}" role="switch" aria-checked="${S.state.settings.autoBackup !== false}" aria-label="Back up when I tap Done" data-a="autobk"></button></div>
        <button type="button" class="btn outline press" data-a="restore">${svg('<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>', { s: 18, w: 2.4 })}Restore from a backup</button>
        <button type="button" class="btn danger press" data-a="reset" style="margin-top:6px">Delete everything and start again</button></div>
      <div class="attrib" style="text-align:center">Samslimmer 1.0</div>
    </div>${nav('me')}</div>`;
};

/* ================= PLACEHOLDERS ================= */

/* ================= DASHBOARD ================= */
ui.dash = { range: 'week', sel: null, mday: null };
const RANGE_TABS = [['week', 'Week'], ['month', 'Month'], ['m3', '3M'], ['year', 'Year'], ['all', 'All']];
const RANGE_SUB = { week: 'Last 7 days', month: 'Last 30 days', m3: 'Last 3 months', year: 'Last 12 months', all: 'Since you started' };

function shortThing(n) { return n.replace(/^(a|an|two) /, '').replace(/^(newborn|Atlantic|Christmas|house|fully grown|giant|Border|car|sack of) /, '').replace(/… roughly|'s leg/g, ''); }
function wFmt(kg) { return fmtW(kg, S.state.profile.units); }
function wDelta(kg) { const u = S.state.profile.units; return u === 'metric' ? g1(kg) + ' kg' : u === 'us' ? g1(kg * S.LB) + ' lb' : (Math.abs(kg * S.LB) < 14 ? g1(kg * S.LB) + ' lb' : fmtW(kg, 'uk')); }

function calorieCard(keys, plan) {
  const ds = ui.dash, n = keys.length, today = S.todayKey();
  const vals = keys.map(k => T.dayKcal(k));
  const logged = vals.map((v, i) => [v, i]).filter(([v]) => v > 0);
  const avg = logged.length ? logged.reduce((a, [v]) => a + v, 0) / logged.length : 0;
  const overN = logged.filter(([v, i]) => v > plan.kcal && keys[i] !== today).length;
  const doneN = logged.filter(([, i]) => keys[i] !== today).length;
  const H = 150, MAX = Math.max(plan.kcal * 1.35, ...vals) * 1.02;
  const gap = n <= 7 ? 10 : n <= 31 ? 3 : n <= 92 ? 1 : 0;
  const rad = n <= 7 ? '8px 8px 4px 4px' : n <= 31 ? '3px 3px 1px 1px' : '1px';
  const bars = vals.map((v, i) => {
    const sel = ds.sel === keys[i], dim = ds.sel && !sel;
    const h = v ? Math.max(4, v / MAX * H) : 3;
    const col = !v ? 'var(--line2)' : v > plan.kcal ? 'var(--over-bar)' : 'var(--ring)';
    return `<button type="button" class="dbar" data-a="dsel" data-k="${keys[i]}" aria-label="${S.longDate(keys[i])}: ${fmt(v)} kcal" style="height:${h.toFixed(1)}px;background:${col};border-radius:${rad};opacity:${dim ? .4 : 1};animation-delay:${n > 60 ? 0 : (i * (n > 10 ? 0.012 : 0.05)).toFixed(3)}s"></button>`;
  }).join('');
  let info;
  if (ds.sel && keys.indexOf(ds.sel) >= 0) {
    const v = T.dayKcal(ds.sel), d = v - plan.kcal;
    info = `<span style="color:${!v ? 'var(--ink2)' : d > 0 ? 'var(--over-ink)' : 'var(--accent-ink)'}">${S.longDate(ds.sel)} · ${v ? fmt(v) + ' kcal · ' + (d > 0 ? fmt(d) + ' over' : fmt(-d) + ' under') : 'nothing logged'}</span>`;
  } else info = doneN ? `${overN} of ${doneN} logged days over goal · tap a bar for details` : 'Log a few days to see your pattern';
  const axis = n <= 7 ? `<div class="row" style="gap:${gap}px">${keys.map(k => `<span style="flex:1;text-align:center;font-size:11px;font-weight:700;color:var(--ink2)">${k === today ? 'Today' : 'MTWTFSS'[(S.parseKey(k).getDay() + 6) % 7]}</span>`).join('')}</div>`
    : `<div class="row small muted" style="justify-content:space-between;font-size:11px;font-weight:700"><span>${S.longDate(keys[0]).slice(4)}</span><span>${S.longDate(keys[Math.floor(n / 2)]).slice(4)}</span><span>Today</span></div>`;
  return `<div class="card rise" style="display:flex;flex-direction:column;gap:12px">
    <div class="row" style="align-items:flex-start"><div class="grow"><div style="font-size:16px;font-weight:800">Calories</div><div class="small muted">${RANGE_SUB[ds.range]}</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:800;letter-spacing:-.5px">${logged.length ? fmt(avg) : '—'}</div><div class="small muted" style="font-size:11px">avg per logged day</div></div></div>
    <div style="background:var(--bg);border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700">${info}</div>
    <div class="dbars" style="gap:${gap}px"><div class="goalline" style="bottom:${(plan.kcal / MAX * H).toFixed(1)}px"><span>Goal ${fmt(plan.kcal)}</span></div>${bars}</div>
    ${axis}
    <div class="row small muted" style="gap:14px;font-size:11px"><span class="row" style="gap:5px"><i class="key" style="background:var(--ring)"></i>On track</span><span class="row" style="gap:5px"><i class="key" style="background:var(--over-bar)"></i>Over goal</span><span style="margin-left:auto">One bar = one day</span></div></div>`;
}

function macroCard(plan) {
  const ds = ui.dash, today = S.todayKey();
  const week = Array.from({ length: 7 }, (_, i) => S.addDays(today, i - 6));
  const tots = week.map(k => S.totals(S.peekDay(k).entries));
  // Pie: average of logged days in the chosen range, or one day if you tapped a bar.
  const day = ds.mday && week.indexOf(ds.mday) >= 0 ? ds.mday : null;
  const rk = T.rangeKeys(ds.range).filter(k => S.peekDay(k).entries.length);
  let t;
  if (day) t = S.totals(S.peekDay(day).entries);
  else { t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, salt: 0 }; rk.forEach(k => { const x = S.totals(S.peekDay(k).entries); Object.keys(t).forEach(n => { t[n] += x[n] || 0; }); }); const n = Math.max(1, rk.length); Object.keys(t).forEach(k => { t[k] /= n; }); }
  const pk = t.p * 4, ck = t.c * 4, fk = t.f * 9, tk = pk + ck + fk;
  const wedge = (a0, a1, col) => {
    if (a1 - a0 >= 0.9999) return `<circle cx="50" cy="50" r="50" fill="${col}"/>`;
    const P = a => [50 + 50 * Math.cos(2 * Math.PI * a - Math.PI / 2), 50 + 50 * Math.sin(2 * Math.PI * a - Math.PI / 2)].map(v => v.toFixed(2)).join(' ');
    return `<path d="M50 50 L${P(a0)} A50 50 0 ${a1 - a0 > 0.5 ? 1 : 0} 1 ${P(a1)} Z" fill="${col}"/>`;
  };
  let acc = 0;
  const slices = tk ? [[pk, '#6366F1'], [ck, '#F97316'], [fk, '#EAB308']].filter(x => x[0] > 0).map(([v, c]) => { const a0 = acc; acc += v / tk; return wedge(a0, acc, c); }).join('')
    : `<circle cx="50" cy="50" r="50" fill="${isDark() ? '#2A3433' : '#E9ECEC'}"/>`;
  const pct = v => tk ? Math.round(v / tk * 100) + '% of kcal' : '—';
  // Bars: last 7 days, drawn as plain SVG rectangles so every phone shows them.
  const MAXK = Math.max(plan.kcal, ...tots.map(x => x.p * 4 + x.c * 4 + x.f * 9)), WH = 116, dark = isDark();
  const cols = week.map((k, i) => {
    const x = tots[i], tot = x.p * 4 + x.c * 4 + x.f * 9, h = tot ? Math.max(6, tot / MAXK * WH) : 4, on = k === day;
    let y = WH, rects = '';
    if (tot) [[x.p * 4, '#6366F1'], [x.c * 4, '#F97316'], [x.f * 9, '#EAB308']].forEach(([v, c]) => { const hh = v / tot * h; y -= hh; rects += `<rect x="0" y="${y.toFixed(1)}" width="20" height="${(hh + 0.4).toFixed(1)}" fill="${c}"/>`; });
    else rects = `<rect x="0" y="${WH - 4}" width="20" height="4" fill="${dark ? '#2A3433' : '#E9ECEC'}"/>`;
    return `<button type="button" class="mcol2 ${on ? 'on' : ''}" data-a="mday" data-k="${k}" aria-label="${S.longDate(k)} macros" aria-pressed="${on}"><svg viewBox="0 0 20 ${WH}" preserveAspectRatio="none" width="100%" height="${WH}"><defs><clipPath id="mc${i}"><rect x="0" y="${(WH - h).toFixed(1)}" width="20" height="${h.toFixed(1)}" rx="4"/></clipPath></defs><g clip-path="url(#mc${i})">${rects}</g></svg></button>`;
  }).join('');
  const labels = week.map(k => `<span style="flex:1;text-align:center;font-size:11px;font-weight:${k === day ? 800 : 600};color:${k === day ? 'var(--ink)' : 'var(--ink2)'}">${k === today ? 'Today' : 'MTWTFSS'[(S.parseKey(k).getDay() + 6) % 7]}</span>`).join('');
  const RL = { week: '7 days', month: '30 days', m3: '3 months', year: '12 months', all: 'all time' };
  const lbl = day ? (day === today ? 'Today' : S.longDate(day)) : 'Average · ' + RL[ds.range];
  const sub = day ? 'Tap the day again for the average' : rk.length ? 'Daily average of ' + rk.length + ' logged day' + (rk.length > 1 ? 's' : '') + ' · tap a bar for one day' : 'Nothing logged in this period yet';
  return `<div class="card rise" style="display:flex;flex-direction:column;gap:12px">
    <div class="row" style="align-items:flex-start;gap:8px"><div class="grow"><div style="font-size:16px;font-weight:800">Macros</div><div class="small muted">${sub}</div></div><button type="button" class="pill press" data-a="mday" data-k="" style="background:var(--accent-soft);color:var(--accent-ink);height:28px;display:flex;align-items:center;border:0;font-weight:800;white-space:nowrap">${esc(lbl)}${day ? ' ✕' : ''}</button></div>
    <div class="row" style="gap:14px;align-items:center">
      <div style="position:relative;width:128px;height:128px;flex:none"><svg class="pie" width="128" height="128" viewBox="0 0 100 100" role="img" aria-label="Macro split, ${esc(lbl)}">${slices}<circle cx="50" cy="50" r="27" fill="${dark ? '#182124' : '#FFFFFF'}"/></svg>
        <div class="ringtext"><span style="font-size:19px;font-weight:800;letter-spacing:-.5px;line-height:1.1">${tk ? fmt(t.kcal) : '0'}</span><span class="small muted" style="font-size:10px">${day ? 'kcal' : 'kcal / day'}</span></div></div>
      <div class="grow" style="display:flex;flex-direction:column;gap:6px;min-width:0"><div class="row" style="height:${WH + 4}px;align-items:flex-end;gap:5px">${cols}</div><div class="row" style="gap:5px">${labels}</div></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">${[['Protein', t.p, plan.p, '#6366F1', pct(pk)], ['Carbs', t.c, plan.c, '#F97316', pct(ck)], ['Fat', t.f, plan.f, '#EAB308', pct(fk)], ['Fibre', t.fib, plan.fib, '#10B981', t.fib >= plan.fib ? 'Target hit' : fmt(plan.fib - t.fib) + ' g to go']].map(([l, v, tg, c, s2]) =>
      `<div><div class="small" style="display:flex;align-items:center;gap:5px;font-weight:700"><i class="key" style="background-color:${c}"></i>${l}</div><div style="font-size:13px;font-weight:800">${fmt(v)} / ${tg}g</div><div class="muted" style="font-size:10px;font-weight:600">${s2}</div></div>`).join('')}</div>
    <div class="extras" style="border-top:1px solid var(--line);padding-top:8px;margin-top:0">${day ? 'Also on ' + (day === today ? 'today' : S.longDate(day)) : 'Average per day'}: sugar ${g1(t.sug)} g · sat fat ${g1(t.sat)} g · sodium ${fmt(naMg(t.salt))} mg</div></div>`;
}

function journeyCard() {
  const j = T.journey();
  const units = S.state.profile.units;
  const recent = T.recentMilestones(3);
  const nx = T.nextMilestones(2);
  const nextHtml = nx.length ? `<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:10px"><div class="small muted" style="font-weight:700">Next up</div>${nx.map(m => `<div class="row" style="gap:10px"><span class="mdot ${m.kind}"></span><div class="grow" style="display:flex;flex-direction:column;gap:5px"><div style="font-size:13px;font-weight:700">${esc(m.text)}</div><div class="nxbar"><i style="width:${Math.max(4, Math.round(m.frac * 100))}%"></i></div></div></div>`).join('')}</div>` : '';
  const recentHtml0 = recent.length ? `<div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:10px"><div class="small muted" style="font-weight:700">Recent milestones</div>${recent.map(m => `<div class="row" style="gap:10px"><span class="mdot ${m.kind}"></span><div class="grow"><div style="font-size:13px;font-weight:700">${esc(m.text)}</div><div class="muted" style="font-size:11px;font-weight:600">${esc(m.sub)} · ${S.prettyDate(m.when)}</div></div></div>`).join('')}</div>` : '';
  const recentHtml = nextHtml + recentHtml0;
  if (j.maintaining) {
    const d = j.now - j.goal;
    return `<div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div style="font-size:16px;font-weight:800">Milestones</div>
      <div style="background:var(--bg);border-radius:16px;padding:12px 14px"><div style="font-weight:800">${Math.abs(d) < 1 ? 'Holding steady. Lovely.' : 'You\'re ' + wDelta(Math.abs(d)) + (d > 0 ? ' above' : ' below') + ' your target weight.'}</div><div class="small muted">Maintaining around ${wFmt(j.goal)}</div></div>${recentHtml}</div>`;
  }
  const pct = clamp(j.progress / j.total, 0, 1) * 100;
  const passed = j.marks.filter(m => j.progress >= m.kg - 0.05).pop();
  const next = j.marks.find(m => j.progress < m.kg - 0.05);
  let head, sub, bg = 'var(--flame-soft)', fg = 'var(--flame-ink)', sfg = 'var(--flame-ink2)';
  if (j.progress < -0.05) {
    const th = T.thingFor(-j.progress, j.losing) || ['', j.losing ? 'a bag of flour' : 'a bag of pasta'];
    head = (j.losing ? 'Up ' : 'Down ') + wDelta(-j.progress) + '. That\'s ' + th[1] + ' sneaking ' + (j.losing ? 'back in.' : 'off.');
    sub = 'No drama — one good week and it\'s gone.'; bg = 'var(--over-soft)'; fg = 'var(--over-ink2)'; sfg = 'var(--over-ink)';
  } else if (!passed) {
    head = j.progress < 0.05 ? 'Right at the start line.' : wDelta(j.progress) + (j.losing ? ' down' : ' up') + '. Warming up!';
    sub = next ? (next.goal ? 'Next stop: your goal at ' + wDelta(next.kg) : 'First surprise at ' + wDelta(next.kg) + ' — what will it be?') : '';
    bg = 'var(--bg)'; fg = 'var(--ink)'; sfg = 'var(--ink2)';
  } else if (passed.goal) { head = 'Goal reached! ' + wDelta(j.total) + (j.losing ? ' gone.' : ' gained.'); sub = 'Time to pick a new goal in Me — or just enjoy it.'; }
  else { head = wDelta(j.progress) + (j.losing ? ' gone' : ' gained') + '. That\'s ' + passed.name + '!'; sub = next ? (next.goal ? 'Next stop: your goal · ' : 'Next surprise in ') + wDelta(next.kg - j.progress) + (next.goal ? ' to go' : '') : ''; }
  const marks = j.marks.map((m, i) => { const left = (m.kg / j.total * 100).toFixed(1), done = j.progress >= m.kg - 0.05;
    return `<span class="jdot" style="left:${left}%;border-color:${done ? 'var(--accent-ink)' : 'var(--dim)'}"></span><span class="jlbl" style="left:${left}%;top:${i % 2 ? '0' : '46px'};color:${done ? 'var(--accent-ink)' : 'var(--ink3)'};transform:translateX(${m.goal ? '-100%' : left < 14 ? '-15%' : left > 86 ? '-85%' : '-50%'})">${m.goal ? 'Goal · ' + wDelta(m.kg).replace(' ', '') : done ? '✓ ' + wDelta(m.kg).replace(' ', '') : wDelta(m.kg).replace(' ', '') + ' · ?'}</span>`; }).join('');
  return `<div class="card rise" style="display:flex;flex-direction:column;gap:12px">
    <div class="row"><span class="grow" style="font-size:16px;font-weight:800">Milestone journey</span><span class="small muted" style="font-weight:700">${wDelta(Math.max(0, j.progress))} of ${wDelta(j.total)}</span></div>
    <div style="background:${bg};border-radius:16px;padding:12px 14px"><div style="font-size:15px;font-weight:800;color:${fg}">${esc(head)}</div>${sub ? `<div class="small" style="color:${sfg}">${esc(sub)}</div>` : ''}</div>
    <div class="journey"><div class="jtrack"><div class="jfill" style="width:${ui.jPrev != null ? ui.jPrev : 0}%" data-w="${pct.toFixed(1)}"></div></div>${marks}<div class="jrunner" style="left:${ui.jPrev != null ? ui.jPrev : 0}%" data-w="${pct.toFixed(1)}">${svg('<path d="M13 4a1.5 1.5 0 1 0 0 .01M9 21l2-6 3 3v3M7 12l3-3 3 1 2 3h3"/>', { s: 16, c: '#fff', w: 2.6 })}</div></div>
    <div class="row small muted" style="justify-content:space-between;font-size:11px;font-weight:700"><span>Start ${wFmt(j.start)}</span><span>Now ${wFmt(j.now)}</span><span>Goal ${wFmt(j.goal)}</span></div>
    ${recentHtml}</div>`;
}

function streakCard() {
  const cells = T.streakCells(), cur = S.streak(), best = S.bestStreak();
  return `<div class="card rise" style="display:flex;flex-direction:column;gap:12px">
    <div class="row"><span class="grow" style="font-size:16px;font-weight:800">Streak</span><span class="small muted">Best: ${best} day${best === 1 ? '' : 's'}</span></div>
    <div class="row" style="gap:16px"><div style="width:84px;height:84px;border-radius:24px;background:var(--flame-soft);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none">${I.flame({ s: 26, c: 'var(--flame)' })}<span style="font-size:24px;font-weight:800;line-height:1.1">${cur}</span><span style="font-size:10px;font-weight:700;color:var(--flame-ink2)">day${cur === 1 ? '' : 's'}</span></div>
      <div class="grow" style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px">${cells.map((c, i) => `<span class="scell" title="${S.longDate(c.k)}" style="background:${c.future ? 'var(--card)' : c.done ? 'var(--ring)' : c.logged ? 'var(--ring-soft)' : 'var(--line2)'};border:${c.today ? '2px solid var(--flame)' : c.future ? '1px dashed var(--dim2)' : '0'};animation-delay:${(i * 0.015).toFixed(2)}s"></span>`).join('')}</div></div>
    <div class="row small muted" style="gap:12px;font-size:11px;flex-wrap:wrap"><span class="row" style="gap:5px"><i class="key" style="background:var(--ring)"></i>Marked done</span><span class="row" style="gap:5px"><i class="key" style="background:var(--ring-soft)"></i>Logged, not done</span><span class="row" style="gap:5px"><i class="key" style="background:var(--line2)"></i>Missed</span></div></div>`;
}

function weightChart(keys) {
  const ws = T.weightsSorted(), inRange = ws.filter(w => w[0] >= keys[0]);
  const pts = inRange.length >= 2 ? inRange : ws.slice(-8);
  if (pts.length < 2) return `<div class="small muted" style="padding:10px 0">Log your weight a few times to see the trend line here.</div>`;
  const vals = pts.map(w => w[1]), mn = Math.min(...vals) - 0.4, mx = Math.max(...vals) + 0.4;
  const t0 = S.parseKey(pts[0][0]).getTime(), t1 = S.parseKey(pts[pts.length - 1][0]).getTime() || t0 + 1;
  const xy = pts.map(w => [(12 + (S.parseKey(w[0]).getTime() - t0) / Math.max(1, t1 - t0) * 334).toFixed(1), (16 + (mx - w[1]) / (mx - mn) * 94).toFixed(1)]);
  const line = xy.map(p => p.join(',')).join(' '), last = xy[xy.length - 1];
  return `<svg width="100%" height="130" viewBox="0 0 358 130" preserveAspectRatio="none" role="img" aria-label="Weight trend"><line x1="0" y1="16" x2="358" y2="16" stroke="var(--line)"/><line x1="0" y1="63" x2="358" y2="63" stroke="var(--line)"/><line x1="0" y1="110" x2="358" y2="110" stroke="var(--line)"/>
    <polygon points="12,120 ${line} ${last[0]},120" fill="var(--ring)" fill-opacity=".12"/><polyline class="wline" points="${line}" fill="none" stroke="var(--accent-ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="6" fill="var(--card)" stroke="var(--accent-ink)" stroke-width="3"/></svg>
    <div class="row small muted" style="justify-content:space-between;font-size:11px;font-weight:700"><span>${S.longDate(pts[0][0]).slice(4)}</span><span>Goal ${wFmt(S.state.profile.gkg)}</span><span>${S.prettyDate(pts[pts.length - 1][0])}</span></div>`;
}

function ratingsCard() {
  const all = Object.values(T.foodRatings());
  const good = all.filter(r => r.verdict === 'good').sort((a, b) => b.days - a.days).slice(0, 3);
  const bad = all.filter(r => r.verdict === 'bad').sort((a, b) => b.days - a.days).slice(0, 3);
  const row = (r, ok) => `<div class="row" style="gap:10px">${F.foodTile(r.food, 32)}<div class="grow"><div style="font-size:14px;font-weight:700" class="ell">${esc(r.name)}</div><div class="muted" style="font-size:11px;font-weight:600">${esc(r.note)}</div></div></div>`;
  let body;
  if (!good.length && !bad.length) {
    const near = Object.values(T.foodRatings(1)).sort((a, b) => b.days - a.days)[0];
    body = `<div class="small muted">Ratings appear once a food has been logged on 5 different days (today doesn't count until it's over).${near ? ` Closest so far: <b>${esc(near.name)}</b> — ${near.days} of 5 days.` : ''}</div>`;
  } else body = `${good.length ? `<div style="font-size:12px;font-weight:800;color:var(--accent-ink);letter-spacing:.5px">HELPS YOU STAY ON TRACK</div>${good.map(r => row(r, 1)).join('')}` : ''}
    ${bad.length ? `<div style="font-size:12px;font-weight:800;color:var(--over-ink);letter-spacing:.5px;margin-top:4px">USUALLY TIPS YOU OVER</div>${bad.map(r => row(r, 0)).join('')}` : ''}`;
  return `<div class="card rise" style="display:flex;flex-direction:column;gap:10px"><div><div style="font-size:16px;font-weight:800">Your foods, rated</div><div class="small muted">Based on how your day went when you ate them</div></div>${body}</div>`;
}

VIEWS.dash = () => {
  const plan = S.plan(), ds = ui.dash, keys = T.rangeKeys(ds.range), p = S.state.profile;
  const wk = Array.from({ length: 7 }, (_, i) => S.addDays(S.todayKey(), i - 6));
  const cups = wk.map(k => S.peekDay(k).water || 0), hit = cups.filter(c => c >= (p.waterGoal || 8)).length;
  const ws = T.weightsSorted(), latest = S.latestWeight();
  const inR = ws.filter(w => w[0] >= keys[0]), base = inR.length ? inR[0][1] : (ws.length ? ws[0][1] : p.startKg);
  const delta = latest - base;
  return `<div class="screen"><div class="top"><div><div class="kicker">How you're doing</div><h1>Dashboard</h1></div><span class="chip">${I.flame({ s: 16, c: 'var(--flame)', w: 2.4 })}${S.streak()}</span></div>
    <div class="seg" role="tablist">${RANGE_TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${ds.range === k}" class="${ds.range === k ? 'on' : ''}" data-a="drange" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="content">
      ${calorieCard(keys, plan)}
      ${macroCard(plan)}
      ${journeyCard()}
      ${streakCard()}
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px">
        <div class="row" style="align-items:flex-start"><div class="grow"><div style="font-size:16px;font-weight:800">Weight</div><div class="small muted">${RANGE_SUB[ds.range]}</div></div>
          <div style="text-align:right"><div style="font-size:22px;font-weight:800;letter-spacing:-.5px">${wFmt(latest)}</div><div class="small" style="font-weight:800;color:${(delta <= 0) === (p.gkg <= p.startKg) ? 'var(--accent-ink)' : 'var(--over-ink)'}">${Math.abs(delta) < 0.05 ? 'no change' : (delta < 0 ? '▼ ' : '▲ ') + wDelta(Math.abs(delta))}</div></div></div>
        ${weightChart(keys)}
        <button type="button" class="btn outline press" data-a="logweight" style="height:46px;font-size:14px">${I.plus({ s: 16, w: 2.6 })}Log today's weight</button></div>
      ${ratingsCard()}
      <div class="card rise row" style="gap:14px">${cupSvg(true)}<div class="grow"><div class="h2">Water</div><div class="small muted">${g1(cups.reduce((a, b) => a + b, 0) / 7)} cups a day this week · goal hit ${hit} of 7 days</div></div></div>
    </div>${nav('dash')}</div>`;
};
afterRender.dash = () => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('[data-w]').forEach(el => { if (el.classList.contains('jfill')) el.style.width = el.dataset.w + '%'; else if (el.classList.contains('jrunner')) el.style.left = el.dataset.w + '%'; });
    const f = document.querySelector('.jfill'); if (f) ui.jPrev = f.dataset.w;
  }));
};

/* ================= WEIGHT ================= */
VIEWS.weight = () => {
  const p = S.state.profile, ws = T.weightsSorted().reverse(), latest = S.latestWeight();
  const since = latest - p.startKg, losing = p.gkg < p.startKg;
  const toGoal = losing ? latest - p.gkg : p.gkg - latest;
  const sp = ws.slice(0, 10).reverse();
  let spark = '';
  if (sp.length >= 2) {
    const v = sp.map(w => w[1]), mn = Math.min(...v) - 0.2, mx = Math.max(...v) + 0.2;
    const xy = sp.map((w, i) => [(8 + i / (sp.length - 1) * 310).toFixed(1), (8 + (mx - w[1]) / (mx - mn) * 54).toFixed(1)]);
    spark = `<svg width="100%" height="70" viewBox="0 0 326 70" preserveAspectRatio="none" aria-hidden="true"><polyline class="wline" points="${xy.map(x => x.join(',')).join(' ')}" fill="none" stroke="var(--ring)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  }
  const unitTabs = [['metric', 'kg'], ['uk', 'st & lb'], ['us', 'lb']];
  return `<div class="screen"><div class="top"><div><div class="kicker">Weigh-ins</div><h1>Weight</h1></div>
      <div class="seg" style="margin:0;padding:3px">${unitTabs.map(([k, l]) => `<button type="button" class="${p.units === k ? 'on' : ''}" data-a="wunits" data-v="${k}" style="height:30px;padding:0 10px;font-size:12px">${l}</button>`).join('')}</div></div>
    <div class="content">
      <div class="card rise" style="display:flex;flex-direction:column;gap:10px">
        <div class="row" style="align-items:flex-end"><div class="grow"><div class="small muted" style="font-weight:700">Latest · ${ws.length ? S.prettyDate(ws[0][0]) : 'start'}</div><div style="font-size:36px;font-weight:800;letter-spacing:-1.2px;line-height:1.1">${wFmt(latest)}</div></div>
          <div style="text-align:right"><div style="font-size:13px;font-weight:800;color:${Math.abs(since) < 0.05 ? 'var(--ink2)' : (since < 0) === losing ? 'var(--accent-ink)' : 'var(--over-ink)'}">${Math.abs(since) < 0.05 ? 'Same as start' : (since < 0 ? '▼ ' : '▲ ') + wDelta(Math.abs(since)) + ' since start'}</div><div class="small muted">${toGoal > 0.05 ? wDelta(toGoal) + ' to goal' : 'Goal reached!'}</div></div></div>
        ${spark}
        <button type="button" class="btn press" data-a="logweight">${I.plus({ s: 18, c: '#fff', w: 2.6 })}Log today's weight</button></div>
      <div class="row" style="justify-content:space-between;padding:0 4px"><span class="h2">History</span><span class="small muted">Weigh at the same time each day</span></div>
      <div class="list">${ws.length ? ws.map((w, i) => { const prev = ws[i + 1], d = prev ? Math.round((w[1] - prev[1]) * 10) / 10 : null; const dd = S.parseKey(w[0]);
        return `<div class="row" style="padding:10px 8px 10px 16px;border-bottom:1px solid var(--line);gap:12px"><div style="width:44px;background:var(--bg);border-radius:12px;padding:4px 0;text-align:center;flex:none"><div style="font-size:10px;font-weight:700;color:var(--ink2)">${S.MN[dd.getMonth()]}</div><div style="font-size:16px;font-weight:800;line-height:1.1">${dd.getDate()}</div></div>
          <span class="grow" style="font-size:16px;font-weight:800">${wFmt(w[1])}</span>
          <span class="wchip" style="background:${d == null || d === 0 ? 'var(--soft)' : (d < 0) === losing ? 'var(--accent-soft)' : 'var(--over-soft)'};color:${d == null || d === 0 ? 'var(--ink2)' : (d < 0) === losing ? 'var(--accent-ink)' : 'var(--over-ink)'}">${d == null ? 'first' : d === 0 ? 'same' : (d > 0 ? '+' : '−') + wDelta(Math.abs(d))}</span>
          <button type="button" class="iconbtn ghost" data-a="delweight" data-k="${w[0]}" aria-label="Delete weigh-in ${S.longDate(w[0])}" style="width:34px;height:34px;color:var(--ink3)">${I.x({ s: 15 })}</button></div>`; }).join('')
        : '<div class="empty small muted">No weigh-ins yet.</div>'}</div>
    </div>${nav('weight')}</div>`;
};

function openWeighIn() {
  const u = S.state.profile.units;
  sheet = { type: 'weigh', anim: true, a: '', b: '' };
  const first = u === 'uk' ? 'wst' : 'w1';
  weighPad(first);
  renderOverlay();
}
function weighPad(id) {
  const u = S.state.profile.units, was = !!pad;
  openPad(id, { dec: id === 'wst' || id === 'wlb' ? 0 : 1, maxInt: id === 'wst' || id === 'wlb' ? 2 : 3, doneLabel: 'Save weigh-in', apply: (v, b) => { if (id === 'wlb') sheet.b = b; else sheet.a = b; }, rerender: still => renderOverlay(still) });
  pad.buf = id === 'wlb' ? sheet.b : sheet.a; pad.fresh = false;
  if (was) pad.shown = true;
}
function weighKg() {
  const u = S.state.profile.units, a = parseFloat(sheet.a), b = parseFloat(sheet.b);
  if (u === 'metric') return isNaN(a) ? null : a;
  if (u === 'us') return isNaN(a) ? null : a / S.LB;
  if (isNaN(a) && isNaN(b)) return null;
  return ((isNaN(a) ? 0 : a) * 14 + (isNaN(b) ? 0 : b)) / S.LB;
}
function weighSheetHtml() {
  const u = S.state.profile.units, kg = weighKg(), last = S.latestWeight(), losing = S.state.profile.gkg < S.state.profile.startKg;
  const box = (id, val, unit) => `<button type="button" class="numbox ${pad && pad.id === id ? 'on' : ''}" data-a="wbox" data-id="${id}" style="height:64px"><span class="v" style="font-size:30px">${esc(val || '0')}</span>${pad && pad.id === id ? '<span class="caret" style="height:30px"></span>' : ''}<span class="u" style="font-size:16px">${unit}</span></button>`;
  let prev = 'Type your weight', pc = 'var(--ink2)';
  if (kg && kg > 25) {
    const d = Math.round((kg - last) * 10) / 10;
    if (d === 0) prev = 'Same as last time. Steady!';
    else if ((d < 0) === losing) { prev = (d < 0 ? '−' : '+') + wDelta(Math.abs(d)) + ' since last time — that\'s ' + T.smallThing(Math.abs(d)) + '!'; pc = 'var(--accent)'; }
    else { prev = (d < 0 ? '−' : '+') + wDelta(Math.abs(d)) + ' since last time. Normal day-to-day wobble.'; pc = 'var(--amber-ink)'; }
  }
  return `<div class="sheet ${sheet.anim ? 'anim' : ''} withpad" role="dialog" aria-label="Log today's weight"><div class="grab"></div>
    <div class="row"><h3 class="grow">Today's weight</h3><span class="small muted">${S.longDate(S.todayKey())}</span></div>
    <div class="row" style="gap:8px">${u === 'uk' ? box('wst', sheet.a, 'st') + box('wlb', sheet.b, 'lb') : box('w1', sheet.a, u === 'us' ? 'lb' : 'kg')}</div>
    <div class="small" style="text-align:center;font-weight:700;color:${pc}">${esc(prev)}</div></div>`;
}
function saveWeighIn() {
  const kg = weighKg();
  if (!kg || kg < 25 || kg > 350) { toast('Check that number', 'It doesn\'t look like a weight in ' + ({ metric: 'kg', us: 'lb', uk: 'stone & pounds' })[S.state.profile.units] + '.'); weighPad(pad ? pad.id : 'w1'); renderOverlay(true); return; }
  const v = Math.round(kg * 10) / 10, last = S.latestWeight(), t = S.todayKey();
  S.state.weights = S.state.weights.filter(w => w[0] !== t).concat([[t, v]]); S.save();
  closeSheet(true); render();
  const fresh = T.newMilestones(), wm = fresh.filter(m => m.kind === 'weight').pop();
  const losing = S.state.profile.gkg < S.state.profile.startKg, d = Math.round((v - last) * 10) / 10;
  if (wm) { toast('Milestone! ' + wm.text, 'The journey bar on your Dashboard just moved.', 'warm'); confetti(); }
  else if (d !== 0 && (d < 0) === losing) toast((d < 0 ? 'Down ' : 'Up ') + wDelta(Math.abs(d)) + '. That\'s ' + T.smallThing(Math.abs(d)) + '!', 'Saved. Keep it rolling.', 'good');
  else if (d !== 0) toast((d > 0 ? 'Up ' : 'Down ') + wDelta(Math.abs(d)) + '. Probably water, honestly.', 'Saved. One weigh-in never tells the whole story.');
  else toast('Rock steady.', 'Saved.');
}

/* ---------- milestone celebrations ---------- */
function celebrate(delay = 900) {
  const fresh = T.newMilestones().filter(m => m.kind !== 'streak');
  if (!fresh.length) return;
  const m = fresh[fresh.length - 1];
  setTimeout(() => { toast(m.text, m.sub + (fresh.length > 1 ? ' · +' + (fresh.length - 1) + ' more on your Dashboard' : ''), 'warm'); confetti(); }, delay);
}

/* ================= THEME ================= */
const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function isDark() { const t = S.state.settings.theme || 'auto'; return t === 'dark' || (t === 'auto' && !!(darkMQ && darkMQ.matches)); }
function applyTheme() {
  const dark = isDark();
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0E1416' : '#F5F6F6');
}
if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', () => { if ((S.state.settings.theme || 'auto') === 'auto') { applyTheme(); if (!sheet) render(); } });

/* ================= BACKUP & RESTORE ================= */
function backupDue() {
  const st = S.state, t = S.todayKey(), logged = Object.values(st.days).filter(d => d.entries.length).length;
  if (st.settings.backupSnooze && st.settings.backupSnooze > t) return null;
  if (st.lastBackup === t || !logged) return null;
  if (st.settings.autoBackup !== false) {
    const today = st.days[t], y = S.addDays(t, -1), yd = st.days[y];
    if (new Date().getHours() >= 21 && today && today.entries.length) return 'tonight';
    if (yd && yd.entries.length && (!st.lastBackup || st.lastBackup < y)) return 'yesterday';
    return null;
  }
  if (logged < 7) return null;
  if (!st.lastBackup) return 'first';
  return (S.parseKey(t) - S.parseKey(st.lastBackup)) / 864e5 >= 14 ? 'old' : null;
}
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Hand a file to the phone: share sheet (iPhone, or when asked) or a straight download.
async function saveFile(blob, name, title, preferShare) {
  let file = null;
  try { file = new File([blob], name, { type: blob.type }); } catch (e) {}
  if ((preferShare || IOS) && file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'ok'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  }
  try {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    return 'ok';
  } catch (e) { return 'fail'; }
}
async function exportBackup(auto) {
  const name = 'samslimmer-backup-' + S.todayKey() + '.json';
  const data = JSON.stringify({ app: 'samslimmer', version: 1, exported: new Date().toISOString(), data: S.state });
  const r = await saveFile(new Blob([data], { type: 'application/json' }), name, 'Samslimmer backup', !auto);
  if (r === 'ok') {
    S.state.lastBackup = S.todayKey(); S.save(); if (!sheet) render();
    toast(auto ? 'Day done & backed up' : 'Backup saved', name + (IOS ? ' · save it to Files or iCloud.' : ' · it\'s in your Downloads.'), 'good');
  } else if (r === 'fail') toast('Couldn\'t save the file here', 'Try again from the installed app or a normal browser tab.');
}

/* ---------- food log PDF for a dietitian ---------- */
function openExport() {
  const t = S.todayKey();
  sheet = { type: 'export', anim: true, preset: '7', from: S.addDays(t, -6), to: t };
  pad = null; renderOverlay();
}
function exportRange(preset) {
  const t = S.todayKey();
  if (preset === '7') return [S.addDays(t, -6), t];
  if (preset === '14') return [S.addDays(t, -13), t];
  if (preset === '30') return [S.addDays(t, -29), t];
  if (preset === 'month') return [t.slice(0, 8) + '01', t];
  if (preset === 'last') { const d = S.parseKey(t); const first = new Date(d.getFullYear(), d.getMonth() - 1, 1), last = new Date(d.getFullYear(), d.getMonth(), 0); return [S.keyOf(first), S.keyOf(last)]; }
  return [sheet.from, sheet.to];
}
function exportSheetHtml() {
  const s = sheet, [from, to] = s.preset === 'custom' ? [s.from, s.to] : exportRange(s.preset);
  const ok = from && to && from <= to;
  const days = ok ? RP.daysInRange(from, to) : [], logged = days.filter(k => S.state.days[k] && S.state.days[k].entries.length).length;
  const pre = [['7', 'Last 7 days'], ['14', 'Last 14 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['last', 'Last month'], ['custom', 'Pick dates']];
  return `<div class="sheet ${s.anim ? 'anim' : ''}" role="dialog" aria-label="Food log for your dietitian"><div class="grab"></div>
    <div class="row"><h3 class="grow">Food log for your dietitian</h3><button type="button" class="iconbtn" data-a="close" aria-label="Close">${I.x({ s: 18 })}</button></div>
    <div class="small muted">A tidy PDF: every meal and food with amounts, calories, protein, carbs, fat, fibre, sugar and sodium, daily totals, water, and your averages.</div>
    <div class="row" style="gap:6px;flex-wrap:wrap">${pre.map(([k, l]) => `<button type="button" class="pill unit ${s.preset === k ? 'on' : ''}" data-a="expreset" data-v="${k}">${l}</button>`).join('')}</div>
    ${s.preset === 'custom' ? `<div class="row" style="gap:10px"><label class="field" style="flex:1"><span class="small" style="font-weight:700">From</span><input class="input" type="date" data-in="exfrom" value="${s.from}" max="${S.todayKey()}"></label><label class="field" style="flex:1"><span class="small" style="font-weight:700">To</span><input class="input" type="date" data-in="exto" value="${s.to}" max="${S.todayKey()}"></label></div>` : ''}
    <div id="exinfo" style="background:var(--bg);border-radius:14px;padding:12px 14px;font-size:14px;font-weight:700">${ok ? `${S.longDate(from)} – ${S.longDate(to)}<div class="small muted" style="font-weight:600">${logged} of ${days.length} days have food logged</div>` : 'Pick a start date before the end date'}</div>
    <button type="button" class="btn press" data-a="exgo" ${ok && logged ? '' : 'disabled'}>${svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', { s: 18, c: '#fff', w: 2.4 })}Make the PDF</button></div>`;
}
async function makeLogPdf() {
  const s = sheet, [from, to] = s.preset === 'custom' ? [s.from, s.to] : exportRange(s.preset);
  let blob;
  try { blob = RP.buildLogPdf(from, to); } catch (e) { toast('Couldn\'t make the PDF', String(e && e.message || e)); return; }
  const nm = (S.state.profile.name || 'food').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const r = await saveFile(blob, nm + '-food-log-' + from + '-to-' + to + '.pdf', 'Food log', true);
  if (r === 'ok') { closeSheet(); toast('Food log ready', 'Send it to your dietitian by email or WhatsApp.', 'good'); }
  else if (r === 'fail') toast('Couldn\'t save the PDF here', 'Try again from the installed app or a normal browser tab.');
}

function summarise(d) {
  const days = Object.values(d.days || {}), logged = days.filter(x => x.entries && x.entries.length).length;
  const foods = days.reduce((a, x) => a + ((x.entries && x.entries.length) || 0), 0);
  return `${logged} days logged · ${foods} foods · ${(d.weights || []).length} weigh-ins · ${Object.values(d.foods || {}).filter(f => f.src === 'recipe').length} recipes`;
}
function onRestoreFile(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    let b = null;
    try { b = JSON.parse(rd.result); } catch (e) {}
    if (!b || b.app !== 'samslimmer' || !b.data || b.data.v !== 1 || !b.data.days) { toast('That isn\'t a Samslimmer backup', 'Pick the .json file you saved from Me › Save a backup file.'); return; }
    const when = b.exported ? new Date(b.exported) : null;
    confirmSheet('Restore this backup?', (when ? 'Saved ' + when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '. ' : '') + summarise(b.data) + '. This replaces everything currently on this phone.', 'Restore', () => {
      S.replaceAll(b.data); if (when && !isNaN(when)) { S.state.lastBackup = S.keyOf(when); S.save(); } applyTheme(); ui.su = null; ui.recipe = null; ui.pick = null; ui.date = S.todayKey();
      T.newMilestones();
      go(S.state.profile ? 'today' : 'setup');
      toast('Backup restored', summarise(S.state) + '.', 'good');
    }, true);
  };
  rd.onerror = () => toast('Couldn\'t read that file');
  rd.readAsText(file);
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'restorefile') { onRestoreFile(e.target.files[0]); e.target.value = ''; } });

/* ================= SWIPE TO DELETE ================= */
let sw = null, swipeJustEnded = false;
function closeSwipes(except) { document.querySelectorAll('.swipe .entry, .swipe .res').forEach(el => { if (el !== except && el._open) { el.style.transform = ''; el._open = false; } }); }
document.addEventListener('pointerdown', e => {
  const en = e.target.closest('.swipe .entry, .swipe .res');
  if (!en) { if (!e.target.closest('.swipe-del, .swipe-acts')) closeSwipes(); return; }
  const rsw = !!en.closest('.rsw'), open = rsw ? 172 : 88;
  sw = { el: en, x: e.clientX, y: e.clientY, dx: 0, active: false, open, rsw, base: en._open ? -open : 0 };
});
document.addEventListener('pointermove', e => {
  if (!sw) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (!sw.active) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) { sw.active = true; sw.el.style.transition = 'none'; closeSwipes(sw.el); }
    else if (Math.abs(dy) > 12) { sw = null; return; }
  }
  if (sw.active) { sw.dx = Math.min(0, sw.base + dx); if (sw.rsw) sw.dx = Math.max(sw.dx, -sw.open - 30); sw.el.style.transform = `translateX(${sw.dx}px)`; e.preventDefault(); }
}, { passive: false });
function endSwipe() {
  if (!sw) return;
  const s = sw; sw = null;
  if (!s.active) return;
  swipeJustEnded = true; setTimeout(() => { swipeJustEnded = false; }, 80);
  s.el.style.transition = '';
  const w = s.el.offsetWidth;
  if (s.rsw) { if (s.dx < -60) { s.el.style.transform = `translateX(-${s.open}px)`; s.el._open = true; } else { s.el.style.transform = ''; s.el._open = false; } return; }
  if (s.dx < -w * 0.45) { s.el.style.transform = `translateX(-${w}px)`; if (navigator.vibrate) navigator.vibrate(10); setTimeout(() => removeEntry(s.el.dataset.id), 170); }
  else if (s.dx < -44) { s.el.style.transform = 'translateX(-88px)'; s.el._open = true; }
  else { s.el.style.transform = ''; s.el._open = false; }
}
document.addEventListener('pointerup', endSwipe);
document.addEventListener('pointercancel', endSwipe);
function removeEntry(id) {
  const key = ui.date, day = S.day(key), i = day.entries.findIndex(x => x.id === id);
  if (i < 0) return;
  const [e] = day.entries.splice(i, 1); S.save(); render();
  toast(e.food.name + ' removed', fmt(e.n.kcal) + ' kcal taken off ' + e.meal, '', { label: 'Undo', fn: () => { const d2 = S.day(key); d2.entries.splice(Math.min(i, d2.entries.length), 0, e); S.save(); if (ui.view === 'today') render(); } });
}

/* ================= SWIPE DOWN TO CLOSE CARDS ================= */
// Touch events (not pointer events) so we can stop the page scrolling while a card is dragged.
let drag = null;
function dragStart(x, y, target) {
  const ov = target.closest && target.closest('#overlay .ov');
  if (!ov || !sheet) return;
  const sh = ov.querySelector('.sheet'); if (!sh) return;
  const inSheet = target.closest('.sheet'), onGrab = target.closest('.grab');
  if (!inSheet && !target.closest('.pad')) return;
  drag = { x, y, dy: 0, t: Date.now(), active: false, ov, sh, pad: ov.querySelector('.pad'), fromTop: onGrab || sh.scrollTop <= 0 };
}
function dragMove(x, y, e) {
  if (!drag) return;
  const dy = y - drag.y, dx = x - drag.x;
  if (!drag.active) {
    if (dy > 8 && Math.abs(dx) < dy && drag.fromTop && drag.sh.scrollTop <= 0) {
      drag.active = true;
      [drag.sh, drag.pad].forEach(el => { if (el) { el.style.transition = 'none'; el.style.animation = 'none'; } });
    } else if (Math.abs(dy) > 8 || Math.abs(dx) > 8) { drag = null; return; }
    else return;
  }
  if (e && e.cancelable) e.preventDefault();
  drag.dy = dy;
  const t = dy > 0 ? dy : dy * 0.2;
  [drag.sh, drag.pad].forEach(el => { if (el) el.style.transform = `translateY(${t}px)`; });
  drag.ov.style.background = `rgba(31,42,46,${(0.45 * Math.max(0, 1 - dy / 500)).toFixed(3)})`;
}
function dragEnd() {
  if (!drag) return;
  const d = drag; drag = null;
  if (!d.active) return;
  swipeJustEnded = true; setTimeout(() => { swipeJustEnded = false; }, 80);
  const fast = d.dy / Math.max(1, Date.now() - d.t) > 0.6;
  const els = [d.sh, d.pad].filter(Boolean);
  if (d.dy > 110 || (d.dy > 45 && fast)) {
    els.forEach(el => { el.style.transition = 'transform .2s ease-in'; el.style.transform = 'translateY(110%)'; });
    d.ov.style.transition = 'background .2s'; d.ov.style.background = 'rgba(31,42,46,0)';
    setTimeout(() => closeSheet(), 190);
  } else {
    els.forEach(el => { el.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; });
    d.ov.style.background = '';
  }
}
document.addEventListener('touchstart', e => { if (e.touches.length === 1) dragStart(e.touches[0].clientX, e.touches[0].clientY, e.target); }, { passive: true });
document.addEventListener('touchmove', e => { if (drag && e.touches.length === 1) dragMove(e.touches[0].clientX, e.touches[0].clientY, e); }, { passive: false });
document.addEventListener('touchend', dragEnd);
document.addEventListener('touchcancel', dragEnd);
// Mouse support (desktop testing)
document.addEventListener('mousedown', e => dragStart(e.clientX, e.clientY, e.target));
document.addEventListener('mousemove', e => { if (drag) dragMove(e.clientX, e.clientY, e); });
document.addEventListener('mouseup', dragEnd);

/* ================= SELECT SEVERAL ================= */
let lp = null;
document.addEventListener('pointerdown', e => {
  const row = e.target.closest('#results .res');
  if (!row || ui.multi || ui.view !== 'foods') return;
  lp = { x: e.clientX, y: e.clientY, row, timer: setTimeout(() => {
    lp = null; swipeJustEnded = true; setTimeout(() => { swipeJustEnded = false; }, 400);
    if (navigator.vibrate) navigator.vibrate(15);
    ui.multi = true; ui.sel = []; render();
    const again = document.querySelector('#results .res[data-id="' + CSS.escape(row.dataset.id) + '"]');
    if (again) A.res(again.dataset, again);
    S.state.settings.multiTip = 1; S.save();
  }, 480) };
});
document.addEventListener('pointermove', e => { if (lp && (Math.abs(e.clientX - lp.x) > 8 || Math.abs(e.clientY - lp.y) > 8)) { clearTimeout(lp.timer); lp = null; } });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { if (lp) { clearTimeout(lp.timer); lp = null; } }));
document.addEventListener('animationend', e => { if (e.target.classList && (e.target.classList.contains('popnow') || e.target.classList.contains('new'))) e.target.classList.remove('popnow', 'new'); });
document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('#results .res')) e.preventDefault(); });

function multiSheetHtml() {
  const pick = ui.pick && ui.recipe;
  let tot = 0;
  const rows = ui.sel.map((x, i) => {
    const u = x.food.units[x.unit], kc = x.food.per.kcal * u.g * x.amt / 100; tot += kc;
    return `<div class="mrow">
      <div class="row" style="gap:10px">${F.foodTile(x.food, 34)}<div class="grow" style="min-width:0"><div style="font-size:14px;font-weight:700" class="ell">${esc(x.food.name)}</div><div class="muted" style="font-size:12px;font-weight:700">${fmt(kc)} kcal</div></div>
        <button type="button" class="iconbtn ghost" data-a="mremove" data-i="${i}" aria-label="Remove ${esc(x.food.name)}" style="width:32px;height:32px;color:var(--ink3);flex:none">${I.x({ s: 15 })}</button></div>
      <div class="row" style="gap:8px;padding-left:44px">
        <button type="button" class="pill unit mu" data-a="selopen" data-id="${esc(x.food.id)}" data-back="multi" aria-label="Change amount or unit, now ${esc(selAmt(x))}"><span class="ell">${esc(u.label)}</span>${svg('<path d="M7 10l5 5 5-5"/>', { s: 14 })}</button>
        <div class="mstepper"><button type="button" class="step press" data-a="mstep" data-i="${i}" data-d="-1" aria-label="Less">${I.minus({ s: 16, w: 2.8 })}</button>
        <button type="button" class="mamt" data-a="selopen" data-id="${esc(x.food.id)}" data-back="multi" aria-label="Type an amount">${esc(selAmt(x).replace(' ' + u.short, '').replace('× ' + u.short, '×'))}</button>
        <button type="button" class="step press" data-a="mstep" data-i="${i}" data-d="1" aria-label="More">${I.plus({ s: 16, w: 2.8 })}</button></div></div></div>`;
  }).join('');
  return `<div class="sheet ${sheet.anim ? 'anim' : ''}" role="dialog" aria-label="Review selected foods"><div class="grab"></div>
    <div class="row"><h3 class="grow">${ui.sel.length} foods · ${fmt(tot)} kcal</h3><button type="button" class="iconbtn" data-a="close" aria-label="Close">${I.x({ s: 18 })}</button></div>
    <div class="mlist">${rows}</div>
    ${pick ? '' : `<div class="row" style="gap:6px;flex-wrap:wrap">${S.meals().map(m => `<button type="button" class="pill unit ${m === sheet.meal ? 'on' : ''}" data-a="mmeal" data-m="${esc(m)}" style="flex:1">${esc(m)}</button>`).join('')}</div>`}
    <button type="button" class="btn press" data-a="maddall">${pick ? I.pot({ s: 18, c: '#fff' }) + ' Add all to recipe' : 'Add all to ' + esc(sheet.meal)}</button></div>`;
}
function addAllSelected() {
  const pick = ui.pick && ui.recipe, meal = sheet.meal, n = ui.sel.length;
  let kcal = 0;
  ui.lastAdded = ui.sel.map(x => x.food);
  ui.sel.forEach(x => {
    const f = x.food, u = f.units[x.unit], grams = x.amt * u.g, nn = {};
    S.NUTS.forEach(k => { nn[k] = (f.per[k] || 0) * grams / 100; }); kcal += nn.kcal;
    const clean = { id: f.id, name: f.name, brand: f.brand || '', src: f.src, liquid: !!f.liquid, per: f.per, units: f.units, code: f.code, cat: f.cat };
    if (f.recipe) clean.recipeId = f.id;
    if (f.src !== 'recipe' || !pick) S.rememberFood(clean);
    if (pick) ui.recipe.ings.push({ id: S.uid(), food: clean, amt: x.amt, unit: x.unit, grams, n: nn });
    else S.day(ui.date).entries.push({ id: S.uid(), meal, food: clean, amt: x.amt, unit: x.unit, grams, n: nn, t: Date.now() });
  });
  S.save();
  ui.sel = []; ui.multi = false; closeSheet(true);
  if (pick) { ui.pick = null; ui.view = 'recipe'; render(); toast(n + ' ingredients added', fmt(kcal) + ' kcal', 'good'); return; }
  buddyEvent(BU.reactTo(ui.lastAdded || [], kcal));
  ui.view = 'today'; render(); window.scrollTo(0, 0);
  if (navigator.vibrate) navigator.vibrate(10);
  toast(n + ' foods added to ' + meal, fmt(kcal) + ' kcal', 'good');
  celebrate(3100);
}

/* ================= ACTIVITY QUIZ ================= */
const QUIZ = [
  ['job', 'What\'s a normal day mostly like?', [['Sitting most of the day', 'Desk work, driving, studying'], ['A mix of sitting and moving', 'Some walking about, some sitting'], ['On my feet most of the day', 'Shop, teaching, nursing, fieldwork'], ['Physical work', 'Building, farming, lifting, labouring']]],
  ['steps', 'Roughly how many steps a day?', [['Under 5,000', ''], ['5,000 – 8,000', ''], ['8,000 – 12,000', ''], ['Over 12,000', '']], true],
  ['ex', 'How often do you exercise on purpose?', [['Rarely', ''], ['1–2 times a week', ''], ['3–4 times a week', ''], ['5 or more times a week', '']]]
];
function quizLevel(a) {
  const W = { job: 0.4, steps: 0.3, ex: 0.3 };
  let sum = 0, wt = 0;
  Object.keys(W).forEach(k => { if (a[k] != null) { sum += a[k] * W[k]; wt += W[k]; } });
  return wt ? clamp(Math.round(sum / wt), 0, 3) : 1;
}
function quizSheetHtml() {
  const a = sheet.a, ans = sheet.answered || {}, done = QUIZ.every(q => ans[q[0]]);
  const lvl = quizLevel(a);
  return `<div class="sheet ${sheet.anim ? 'anim' : ''}" role="dialog" aria-label="Activity quiz"><div class="grab"></div>
    <div class="row"><h3 class="grow">How active are you?</h3><button type="button" class="iconbtn" data-a="close" aria-label="Close">${I.x({ s: 18 })}</button></div>
    ${QUIZ.map(([k, q, opts, unsure], qi) => `<div class="field"><span class="label">${qi + 1}. ${q}</span>
      ${opts.map((o, i) => `<button type="button" class="opt press ${ans[k] && a[k] === i ? 'on' : ''}" data-a="qans" data-q="${k}" data-v="${i}" style="padding:9px 14px;font-size:14px">${o[0]}${o[1] ? `<span class="sub">${o[1]}</span>` : ''}</button>`).join('')}
      ${unsure ? `<button type="button" class="opt press ${ans[k] && a[k] == null ? 'on' : ''}" data-a="qans" data-q="${k}" data-v="x" style="padding:9px 14px;font-size:14px">No idea</button>` : ''}</div>`).join('')}
    ${done ? `<div class="card" style="background:var(--accent-soft);box-shadow:none"><div class="small" style="font-weight:700;color:var(--accent-ink)">Your result</div><div style="font-size:20px;font-weight:800">${S.ACT[lvl][1]}</div><div class="small muted">${S.ACT[lvl][2]}</div></div>
      <button type="button" class="btn press" data-a="quse">Use this</button>` : `<div class="small muted" style="text-align:center">Answer all three to see your result.</div>`}</div>`;
}

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
      if (on !== (j < before)) { c.innerHTML = cupSvg(on, j, on); c.classList.toggle('on', on); c.setAttribute('aria-label', 'Cup ' + (j + 1) + (on ? ', drunk' : '')); }
    });
    el.classList.remove('popnow'); void el.offsetWidth; el.classList.add('popnow');
    if (day.water > before && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const sp = document.createElement('span'); sp.className = 'splash'; sp.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; el.appendChild(sp); setTimeout(() => sp.remove(), 700); }
    const lbl = document.getElementById('waterlbl');
    if (lbl) lbl.textContent = day.water + ' of ' + (p.waterGoal || 8) + ' cups · ' + ((day.water * (p.cupMl || 250)) / 1000).toFixed(2).replace(/0$/, '') + ' L';
    if (day.water > before) buddyEvent(day.water === (p.waterGoal || 8) ? 'dance' : 'splash');
    refreshBuddy(day.water > before);
    const goal = S.state.profile.waterGoal || 8;
    celebrate(day.water === goal ? 3100 : 300);
    if (day.water === goal) toast('Water goal hit!', 'That\'s ' + ((goal * (S.state.profile.cupMl || 250)) / 1000) + ' litres. You\'re basically a cucumber.', 'good');
  },
  addto: d => { ui.meal = d.meal; ui.view = 'foods'; ui.q = ''; ui.tab = 'all'; ui.online = { q: '', status: 'idle', items: [], cnf: [] }; render(); window.scrollTo(0, 0); },
  entry: (d, el) => {
    if (el && el._open) { el.style.transform = ''; el._open = false; return; }
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
  scan: () => { ui.scanFor = null; openScanner(); },
  ingscan: () => { ui.scanFor = 'recipe'; openScanner(); },
  theme: d => { S.state.settings.theme = d.v; S.save(); applyTheme(); render(); },
  favunit: d => {
    const cur = favUnits().slice(), i = cur.indexOf(d.v);
    if (i >= 0) { if (cur.length === 1) { toast('Keep at least one favourite'); return; } cur.splice(i, 1); } else cur.push(d.v);
    S.state.settings.favUnits = F.ALL_UNITS.map(x => x[0]).filter(k => cur.indexOf(k) >= 0); S.save(); render();
  },
  buddy: () => {
    const now = Date.now(); ui.pokes = (ui.pokes || []).filter(t => now - t < 1600).concat(now);
    if (navigator.vibrate) navigator.vibrate(8);
    if (ui.pokes.length >= 3) { ui.pokes = []; buddyEvent('shock'); refreshBuddy(true, BU.POKE[Math.floor(Math.random() * BU.POKE.length)]); return; }
    ui.buddySeed++; refreshBuddy(true);
  },
  buddyset: d => { const st = S.state.settings; if (d.k === 'shirt') st.shirt = d.v; else st[d.k] = st[d.k] === false; S.save(); render(); },
  themeflip: () => { S.state.settings.theme = isDark() ? 'light' : 'dark'; S.save(); applyTheme(); render(); },
  backup: () => exportBackup(),
  exportlog: () => openExport(),
  expreset: d => { sheet.preset = d.v; if (d.v === 'custom' && !sheet.from) { sheet.from = S.addDays(S.todayKey(), -6); sheet.to = S.todayKey(); } renderOverlay(true); },
  exgo: () => makeLogPdf(),
  autobk: () => { S.state.settings.autoBackup = S.state.settings.autoBackup === false; S.save(); render(); },
  restore: () => { const el = document.getElementById('restorefile'); if (el) el.click(); },
  snooze: () => { const daily = S.state.settings.autoBackup !== false; S.state.settings.backupSnooze = S.addDays(S.todayKey(), daily ? 1 : 7); S.save(); render(); toast('No problem', daily ? 'I\'ll ask again tomorrow. Backups live in Me.' : 'I\'ll remind you in a week. Backups live in Me.'); },
  drange: d => { ui.dash.range = d.v; ui.dash.sel = null; ui.dash.mday = null; render(); },
  dsel: d => { ui.dash.sel = ui.dash.sel === d.k ? null : d.k; render(); },
  mday: d => { ui.dash.mday = d.k && ui.dash.mday !== d.k ? d.k : null; render(); },
  logweight: () => openWeighIn(),
  wbox: d => { weighPad(d.id); renderOverlay(true); },
  wunits: d => { S.state.profile.units = d.v; S.save(); render(); },
  delweight: d => confirmSheet('Delete this weigh-in?', S.longDate(d.k) + ' · ' + wFmt((S.state.weights.find(w => w[0] === d.k) || [0, 0])[1]), 'Delete', () => { S.state.weights = S.state.weights.filter(w => w[0] !== d.k); S.save(); render(); }, true),
  scanclose: () => closeScanner(),
  scantype: () => { closeScanner(); openBarcodeEntry(); },
  bclookup: () => { pad = null; lookupTyped(); },
  newrecipe: () => { startRecipe(null); },
  editrecipe: d => { const f = S.state.foods[d.id]; if (f) { closeSheet(true); startRecipe(f); } },
  delrecipe: d => { const f = S.state.foods[d.id]; if (!f) return; closeSwipes(); confirmSheet('Delete “' + f.name + '”?', 'It disappears from your recipes. Anything you already logged stays in your history.', 'Delete recipe', () => { delete S.state.foods[f.id]; S.state.recents = S.state.recents.filter(id => id !== f.id); S.save(); refreshResults(); toast('Recipe deleted'); }, true); },
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
  res: d => {
    const f = findListed(d.id, d.list); if (!f) return;
    if (!ui.multi) { openFoodSheet(f); return; }
    const i = ui.sel.findIndex(x => x.food.id === f.id);
    if (ui.pick && ui.recipe && f.id === ui.recipe.id) { toast('A recipe can\'t include itself'); return; }
    if (i >= 0) { const x = ui.sel[i]; openFoodSheet(x.food, { sel: true, selIdx: i, amt: x.amt, unit: x.unit, mode: 'seledit' }); return; }
    openFoodSheet(f, { sel: true });
  },
  qpick: d => {
    const f = findListed(d.id, d.list); if (!f) return;
    const i = ui.sel.findIndex(x => x.food.id === f.id);
    if (i >= 0) { ui.sel.splice(i, 1); refreshMulti(f.id, false); return; }
    if (ui.pick && ui.recipe && f.id === ui.recipe.id) { toast('A recipe can\'t include itself'); return; }
    const add = food => { food = F.withUnits(withEdits(food), favUnits()); const u0 = food.units[0]; ui.sel.push({ food, unit: 0, amt: F.startAmt(u0) }); ui.lastPicked = f.id; refreshMulti(f.id, true); ui.lastPicked = null; if (navigator.vibrate) navigator.vibrate(6); };
    if (f.partial) F.cnfDetails(f).then(add).catch(() => toast('Couldn\'t load that food', 'Health Canada\'s database didn\'t answer.'));
    else add(f);
  },
  multi: () => {
    ui.multi = !ui.multi; if (!ui.multi) ui.sel = []; render();
    if (ui.multi && !S.state.settings.multiTip) { S.state.settings.multiTip = 1; S.save(); toast('Tick as many foods as you like', 'Tip: you can also press and hold any food to start selecting.'); }
  },
  selopen: d => { const i = ui.sel.findIndex(x => x.food.id === d.id); if (i < 0) return; const x = ui.sel[i]; openFoodSheet(x.food, { sel: true, selIdx: i, amt: x.amt, unit: x.unit, mode: 'seledit', back: d.back || null }); },
  seltick: () => {
    if (!(sheet.amt > 0)) return;
    const f = sheet.food, item = { food: f, unit: sheet.unit, amt: sheet.amt }, back = sheet.back;
    if (sheet.selIdx != null && ui.sel[sheet.selIdx]) ui.sel[sheet.selIdx] = item; else ui.sel.push(item);
    const isNew = sheet.selIdx == null;
    if (back === 'multi') { sheet = { type: 'multi', anim: false, meal: ui.multiMeal || ui.meal || defaultMeal() }; pad = null; renderOverlay(true); }
    else closeSheet();
    ui.lastPicked = isNew ? f.id : null; refreshMulti(f.id, true); ui.lastPicked = null;
    if (navigator.vibrate) navigator.vibrate(6);
  },
  seluntick: () => {
    const f = sheet.food, back = sheet.back; ui.sel.splice(sheet.selIdx, 1);
    if (back === 'multi' && ui.sel.length) { sheet = { type: 'multi', anim: false, meal: ui.multiMeal || ui.meal || defaultMeal() }; pad = null; renderOverlay(true); }
    else closeSheet();
    refreshMulti(f.id, false);
  },
  unpick: d => { ui.sel = ui.sel.filter(x => x.food.id !== d.id); refreshMulti(d.id, false); },
  multireview: () => { sheet = { type: 'multi', anim: true, meal: ui.multiMeal || ui.meal || defaultMeal() }; pad = null; renderOverlay(); },
  mstep: d => { const x = ui.sel[+d.i]; if (!x) return; const u = x.food.units[x.unit], step = (u.short === 'g' || u.short === 'ml') ? 10 : ['oz', 'fl oz', 'tbsp', 'tsp'].indexOf(u.short) >= 0 ? 1 : ['kg', 'l', 'lb'].indexOf(u.short) >= 0 ? 0.1 : 0.5; x.amt = Math.max(step, Math.round((x.amt + step * +d.d) * 100) / 100); renderOverlay(true); },
  munit: d => { const x = ui.sel[+d.i]; if (!x) return; const grams = x.amt * x.food.units[x.unit].g; x.unit = (x.unit + 1) % x.food.units.length; const nu = x.food.units[x.unit]; x.amt = nu.g === 1 ? Math.max(1, Math.round(grams)) : Math.max(0.25, Math.round(grams / nu.g * 4) / 4); renderOverlay(true); },
  mremove: d => { const x = ui.sel.splice(+d.i, 1)[0]; if (!ui.sel.length) { closeSheet(); refreshMulti(x && x.food.id, false); return; } renderOverlay(true); refreshMulti(x && x.food.id, false); },
  mmeal: d => { sheet.meal = d.m; ui.multiMeal = d.m; renderOverlay(true); },
  maddall: () => addAllSelected(),
  toastact: () => { const f = toast.action; $toast.innerHTML = ''; toast.action = null; if (f) f(); },
  swdel: d => removeEntry(d.id),
  quiz: () => { sheet = { type: 'quiz', anim: true, a: {} }; pad = null; renderOverlay(); },
  qans: d => { sheet.a[d.q] = d.v === 'x' ? null : +d.v; sheet.answered = Object.assign(sheet.answered || {}, { [d.q]: true }); renderOverlay(true); },
  quse: () => { ui.su.act = quizLevel(sheet.a); closeSheet(); render(); toast('Activity set: ' + S.ACT[ui.su.act][1], 'You can still pick a different one.'); },
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
    else { a = grams / nu.g; a = (nu.short === 'g' || nu.short === 'ml') ? Math.round(a) : newW ? Math.round(a * 10) / 10 : Math.round(a * 4) / 4; }
    sheet.unit = +d.i; sheet.amt = a > 0 ? a : F.startAmt(nu);
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
    if (e) { const { grams, n } = sheetNumbers(); Object.assign(e, { amt: sheet.amt, unit: sheet.unit, grams, n, meal: sheet.meal }); if (sheet.foodEdited) e.food = cleanFood(sheet.food); S.save(); }
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
    if (sheet && sheet.type === 'weigh') { pad = { id }; saveWeighIn(); pad = null; return; }
    if (!sheet) render(); else if (r) renderOverlay(true);
  },
  // create food
  cfpad: d => {
    const k = d.k, f = CF_FIELDS.find(x => x[0] === k), was = !!pad;
    openPad('cf_' + k, { dec: f[3], maxInt: k === 'kcal' || k === 'size' ? 4 : 3, apply: v => { sheet.v[k] = v; }, rerender: still => renderOverlay(still) });
    if (was) pad.shown = true;
    renderOverlay(true);
    const el = document.getElementById('cf_' + k); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  },
  cfbasis: d => { sheet.basis = d.v; pad = null; renderOverlay(true); },
  cfbasisopen: () => { sheet.basisOpen = !sheet.basisOpen; pad = null; renderOverlay(true); },
  cfsunit: d => { sheet.sunit = d.v; renderOverlay(true); },
  cfbrandon: () => { sheet.showBrand = true; renderOverlay(true); const el = document.querySelector('[data-in="cfbrand"]'); if (el) el.focus(); },
  cficons: () => { const r = document.querySelector('.cf-icons'); if (r) { r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); } },
  cfcat: d => { sheet.cat = d.v; renderOverlay(true); },
  cfsave: () => { pad = null; if (sheet.editing) saveEdited(); else saveCreated(); },
  editfood: () => openEditFood(),
  cfcancel: () => { const b = sheet.editing && sheet.editing.back; pad = null; if (b) { sheet = Object.assign({}, b, { anim: false }); renderOverlay(true); } else closeSheet(); },
  // setup
  suset: d => { const su = ui.su; const v = d.v; su[d.f] = (d.f === 'act' || d.f === 'pace') ? +v : v; if (d.f === 'country' && v === 'CA' && su.units === 'uk') su.units = 'us'; pad = null; render(); },
  supad: d => {
    const B = suFields(ui.su), b = B[d.id], was = !!pad;
    const NEXT = { b_d: 'b_m', b_m: 'b_y' };
    openPad(d.id, { dec: b.dec, maxInt: b.max, raw: d.id.startsWith('b_'), apply: (v, buf) => {
      suFields(ui.su)[d.id].set(v);
      if (NEXT[d.id] && buf.length >= 2) setTimeout(() => A.supad({ id: NEXT[d.id] }), 0);
    }, rerender: () => render() });
    if (was) pad.shownSetup = true;
    render();
  },
  suown: () => { ui.su.own = !ui.su.own; if (!ui.su.own) ui.su.ownMacros = false; pad = null; render(); },
  suownm: () => {
    const su = ui.su; su.ownMacros = !su.ownMacros; pad = null;
    if (su.ownMacros && su.mp == null) { const pl = S.calcPlan(Object.assign({}, su, { own: false }), su.wkg), k = su.ownKcal / pl.kcal; su.mp = Math.round(pl.p * k); su.mc = Math.round(pl.c * k); su.mf = Math.round(pl.f * k); su.mfib = 30; }
    render();
  },
  usegoal: () => { const su = ui.su; su.gkg = S.suggestGoal(su.hcm, su.wkg, su.sex).goal; su.goalTouched = true; pad = null; render(); },
  sunext: () => {
    const su = ui.su;
    if (su.step === 1 && !su.dob) { toast(su.bd || su.bm || su.by ? 'Check your birthday' : 'Add your birthday', su.bd || su.bm || su.by ? 'That date doesn\'t look right — day, month, then a 4-digit year.' : 'It\'s used to work out your calorie needs.'); return; }
    if (su.step === 1 && (S.ageOf(su.dob) < 13 || S.ageOf(su.dob) > 110)) { toast('Check your birthday', 'Samslimmer is made for adults.'); return; }
    if (su.step === 1 && !su.goalTouched && !su.editing) su.gkg = S.suggestGoal(su.hcm, su.wkg, su.sex).goal;
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
  if (navigator.vibrate) navigator.vibrate([12, 60, 18]);
  const n = S.streak(), isToday = ui.date === S.todayKey();
  buddyEvent('proud');
  render(); confetti();
  if (S.state.settings.autoBackup !== false && S.state.lastBackup !== S.todayKey()) { exportBackup(true); return; }
  const line = STREAK_LINES[n];
  if (isToday && line) toast(line[0], line[1], 'warm');
  else toast(isToday ? DONE_LINES[Math.floor(Math.random() * DONE_LINES.length)] : 'Day marked as done', n + '-day streak' + (n > 1 ? ' 🔥' : ''), 'warm');
}

document.addEventListener('click', e => {
  if (swipeJustEnded) { swipeJustEnded = false; e.preventDefault(); return; }
  const t = e.target.closest('[data-a]');
  if (!t || t.disabled) return;
  const fn = A[t.dataset.a];
  const key = t.matches(BOUNCE) ? bounceKey(t) : null;
  const from = !t.classList.contains('on') && t.matches(GLIDE) ? glideFrom(t) : null;
  if (fn) fn(t.dataset, t, e);
  if (key) boing(key, t);
  if (from && key) glideTo(from, key);
});
// The selected bubble glides from the old choice to the new one.
const GLIDE = '.pill, .seg button';
function glideFrom(t) {
  const par = t.parentElement; if (!par || REDUCED()) return null;
  const prev = Array.prototype.find.call(par.children, c => c !== t && c.classList.contains('on') && c.matches(GLIDE));
  return prev ? prev.getBoundingClientRect() : null;
}
function glideTo(r0, key) {
  requestAnimationFrame(() => {
    let el = null; try { el = document.querySelector(key); } catch (e) {}
    if (!el || !el.classList.contains('on')) return;
    const par = el.parentElement, r1 = el.getBoundingClientRect(), pr = par.getBoundingClientRect();
    if (Math.abs(r1.top - r0.top) > 160 || !r1.width) return;
    const cs = getComputedStyle(el), g = document.createElement('span');
    g.className = 'glider'; g.setAttribute('aria-hidden', 'true');
    const at = r => ({ left: (r.left - pr.left + par.scrollLeft) + 'px', top: (r.top - pr.top + par.scrollTop) + 'px', width: r.width + 'px', height: r.height + 'px' });
    Object.assign(g.style, at(r0), { background: cs.backgroundColor, borderRadius: cs.borderRadius, boxShadow: cs.boxShadow, border: cs.borderTopWidth + ' solid ' + cs.borderTopColor });
    par.classList.add('glidegrp'); par.insertBefore(g, par.firstChild);
    el.classList.add('gliding');
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(g.style, at(r1))));
    let fin = false;
    const done = () => { if (fin) return; fin = true; g.remove(); el.classList.remove('gliding'); if (!par.querySelector('.glider')) par.classList.remove('glidegrp'); };
    g.addEventListener('transitionend', e => { if (e.propertyName === 'left') done(); });
    setTimeout(done, 480);
  });
}
// Little springy bounce on chips, tabs and toggles, re-found after a re-render so it always plays.
const BOUNCE = '.pill, .seg button, .swatch, .nav a, .mcol2, .switch, .selchip-main, .cf-icons button, .step, .iconbtn, .scell';
function bounceKey(t) {
  let k = '[data-a="' + t.dataset.a + '"]';
  ['v', 'k', 'm', 'i', 'f', 'd', 'id'].forEach(n => { if (t.dataset[n] != null) k += '[data-' + n + '="' + (window.CSS && CSS.escape ? CSS.escape(t.dataset[n]) : t.dataset[n]) + '"]'; });
  return k;
}
function boing(key, t) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  requestAnimationFrame(() => {
    let el = null; try { el = document.querySelector(key); } catch (e) {}
    if (!el && t.isConnected) el = t;
    if (!el) return;
    el.classList.remove('boing'); void el.offsetWidth; el.classList.add('boing');
  });
}
document.addEventListener('animationend', e => { if (e.animationName === 'boing' && e.target.classList) e.target.classList.remove('boing'); });
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (!k) return;
  const v = e.target.value;
  if (k === 'q') onQuery(v);
  else if (k === 'suname') ui.su.name = v;
  else if (k === 'sudob') { ui.su.dob = v; const h = document.getElementById('agehint'); if (h && v) h.textContent = 'You\'re ' + S.ageOf(v) + '. Your plan updates itself on your birthday.'; }
  else if (k === 'cfname') { sheet.name = v; const b = document.querySelector('[data-a="cfsave"]'); if (b) b.disabled = !v.trim(); if (!sheet.cat) { const t = document.getElementById('cftile'); if (t) t.innerHTML = F.foodTile(cfFood(), 52); document.querySelectorAll('.cf-icons button').forEach(x => x.classList.toggle('on', x.dataset.v === F.catOf(cfFood()))); } }
  else if (k === 'cfbrand') sheet.brand = v;
  else if (k === 'exfrom' || k === 'exto') { sheet[k === 'exfrom' ? 'from' : 'to'] = v; const st = $ov.querySelector('.sheet'), y = st ? st.scrollTop : 0; renderOverlay(true); const el = document.querySelector('[data-in="' + k + '"]'); if (el) el.focus(); }
  else if (k === 'cfserving') { sheet.serving = v; const bt = document.querySelector('.nl-basis'); if (bt && bt.firstChild) bt.firstChild.textContent = 'per ' + (v || 'serving') + (sheet.v.size ? ' · ' + g1(sheet.v.size) + ' ' + (cfLiquid() ? 'ml' : 'g') : '') + ' '; }
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
(() => { const f = document.createElement('input'); f.type = 'file'; f.id = 'restorefile'; f.accept = 'application/json,.json'; f.hidden = true; document.body.appendChild(f); })();
applyTheme();
if (!S.state.profile) startSetup();
else T.newMilestones();
const h = (location.hash || '').slice(1);
if (S.state.profile && ['today', 'dash', 'foods', 'weight', 'me'].indexOf(h) >= 0) ui.view = h;
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
}
