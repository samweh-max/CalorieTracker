/* Samslimmer: read a nutrition label from a photo.
   Uses Tesseract.js (free, runs on the phone). It is fetched from the jsDelivr CDN the first time
   you scan (a few MB), then the browser keeps it. Nothing is uploaded anywhere. */

const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let loading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (loading) return loading;
  loading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = TESS; s.async = true;
    s.onload = () => window.Tesseract ? res(window.Tesseract) : rej(new Error('Label reader did not load'));
    s.onerror = () => { loading = null; rej(new Error('Couldn\'t download the label reader. Check your internet and try again.')); };
    document.head.appendChild(s);
  });
  return loading;
}

// Get any image (file, blob, canvas) onto a canvas, scaled so text is a good size for reading.
function toCanvas(src) {
  if (src && src.getContext) return Promise.resolve(src);
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(src), img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); URL.revokeObjectURL(url); res(c); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Couldn\'t open that photo')); };
    img.src = url;
  });
}
// mode 'old': simple contrast. 'norm': evens out shadows and glare by dividing by the blurred background.
// 'bin': 'norm' then a local black/white threshold.
// Find where the text actually is (rows/columns with lots of light-dark changes), so we can zoom in on it.
function findTextBox(c0) {
  const S = Math.min(1, 700 / Math.max(c0.width, c0.height)), w = Math.max(1, Math.round(c0.width * S)), h = Math.max(1, Math.round(c0.height * S));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(c0, 0, 0, w, h);
  let p; try { p = x.getImageData(0, 0, w, h).data; } catch (e) { return null; }
  const g = new Float32Array(w * h); for (let i = 0, j = 0; j < w * h; i += 4, j++) g[j] = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
  const I = new Float64Array((w + 1) * (h + 1));
  for (let yy = 1; yy <= h; yy++) { let row = 0; for (let xx = 1; xx <= w; xx++) { row += g[(yy - 1) * w + xx - 1]; I[yy * (w + 1) + xx] = I[(yy - 1) * (w + 1) + xx] + row; } }
  const r = 6, ink = new Uint8Array(w * h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const x1 = Math.max(0, xx - r), y1 = Math.max(0, yy - r), x2 = Math.min(w, xx + r + 1), y2 = Math.min(h, yy + r + 1);
    const m = (I[y2 * (w + 1) + x2] - I[y1 * (w + 1) + x2] - I[y2 * (w + 1) + x1] + I[y1 * (w + 1) + x1]) / ((x2 - x1) * (y2 - y1));
    ink[yy * w + xx] = g[yy * w + xx] < m * 0.8 ? 1 : 0;
  }
  const rowT = new Float32Array(h), colT = new Float32Array(w);
  for (let yy = 0; yy < h; yy++) for (let xx = 1; xx < w; xx++) if (ink[yy * w + xx] !== ink[yy * w + xx - 1]) { rowT[yy]++; colT[xx]++; }
  const rowOk = i => rowT[i] > Math.max(6, w * 0.02), colOk = i => colT[i] > Math.max(3, h * 0.01);
  let y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
  while (y0 < h && !rowOk(y0)) y0++; while (y1 > y0 && !rowOk(y1)) y1--;
  while (x0 < w && !colOk(x0)) x0++; while (x1 > x0 && !colOk(x1)) x1--;
  if (y1 - y0 < h * 0.08 || x1 - x0 < w * 0.15) return null;
  const mx = (x1 - x0) * 0.04 + 4, my = (y1 - y0) * 0.04 + 4;
  return { x: Math.max(0, (x0 - mx) / S), y: Math.max(0, (y0 - my) / S), w: Math.min(c0.width, (x1 - x0 + 2 * mx) / S), h: Math.min(c0.height, (y1 - y0 + 2 * my) / S) };
}
async function prepare(src, mode) {
  let c0 = await toCanvas(src);
  if (mode !== 'old') {
    const b = findTextBox(c0);
    if (b && b.w * b.h < c0.width * c0.height * 0.85) {
      const cc = document.createElement('canvas'); cc.width = Math.round(Math.min(b.w, c0.width - b.x)); cc.height = Math.round(Math.min(b.h, c0.height - b.y));
      cc.getContext('2d').drawImage(c0, b.x, b.y, cc.width, cc.height, 0, 0, cc.width, cc.height); c0 = cc;
    }
  }
  const long = Math.max(c0.width, c0.height), target = mode === 'old' ? Math.min(long, 1800) : Math.max(1800, Math.min(2400, long));
  const k = mode === 'old' ? target / long : Math.max(target / long, Math.min(3, 1700 / c0.width)), w = Math.round(c0.width * k), h = Math.round(c0.height * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(c0, 0, 0, w, h);
  let d; try { d = x.getImageData(0, 0, w, h); } catch (e) { return c; }
  const p = d.data, n = w * h, g = new Float32Array(n);
  for (let i = 0, j = 0; j < n; i += 4, j++) g[j] = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
  if (mode === 'old') {
    let sum = 0; for (let j = 0; j < n; j++) sum += g[j]; const mean = sum / n;
    for (let j = 0; j < n; j++) g[j] = (g[j] - mean) * 1.6 + 128;
  } else {
    // integral image -> fast box blur of the background
    const I = new Float64Array((w + 1) * (h + 1));
    for (let yy = 1; yy <= h; yy++) { let row = 0; for (let xx = 1; xx <= w; xx++) { row += g[(yy - 1) * w + xx - 1]; I[yy * (w + 1) + xx] = I[(yy - 1) * (w + 1) + xx] + row; } }
    const r = Math.max(12, Math.round(Math.min(w, h) / 22));
    const box = (xx, yy) => { const x1 = Math.max(0, xx - r), y1 = Math.max(0, yy - r), x2 = Math.min(w, xx + r + 1), y2 = Math.min(h, yy + r + 1);
      return (I[y2 * (w + 1) + x2] - I[y1 * (w + 1) + x2] - I[y2 * (w + 1) + x1] + I[y1 * (w + 1) + x1]) / ((x2 - x1) * (y2 - y1)); };
    // is the label light text on dark? then flip it
    let s2 = 0; for (let j = 0; j < n; j += 7) s2 += g[j]; const dark = s2 / Math.ceil(n / 7) < 100;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const j = yy * w + xx, m = box(xx, yy) + 1;
      let v = dark ? (255 - g[j]) / (256 - m) : g[j] / m; // ~1 for background, lower for ink
      if (mode === 'bin') g[j] = v < 0.82 ? 0 : 255;
      else g[j] = Math.min(255, Math.max(0, (v - 0.55) / 0.45 * 255));
    }
  }
  for (let i = 0, j = 0; j < n; i += 4, j++) { const v = g[j] < 0 ? 0 : g[j] > 255 ? 255 : g[j]; p[i] = p[i + 1] = p[i + 2] = v; }
  x.putImageData(d, 0, 0);
  return c;
}

// Test hooks: same prep the app uses
export async function __prepFor(blob, mode) { return prepare(blob, mode); }
export function parseBest(texts) {
  const rs = (Array.isArray(texts) ? texts : [texts]).map(parseLabel).sort((a, b) => b.found.length - a.found.length);
  const best = rs[0] || { v: {}, found: [] };
  rs.slice(1).forEach(r => r.found.forEach(k => { if (best.v[k] == null) { best.v[k] = r.v[k]; best.found.push(k); } if (!best.basis && r.basis) Object.assign(best, { basis: r.basis, serving: r.serving, size: r.size, sunit: r.sunit }); }));
  return best;
}
export async function readLabel(file, onProgress) {
  onProgress && onProgress(0.02, 'Getting the label reader ready…');
  const T = await loadTesseract();
  let phase = [0.15, 0.95];
  const worker = await T.createWorker('eng', 1, {
    logger: m => { if (onProgress && m.status === 'recognizing text') onProgress(phase[0] + m.progress * (phase[1] - phase[0]), 'Reading the label…'); else if (onProgress && /load|initializ/.test(m.status || '')) onProgress(0.05 + (m.progress || 0) * 0.1, 'Getting the label reader ready…'); }
  });
  try {
    try { await worker.setParameters({ tessedit_pageseg_mode: '6' }); } catch (e) {} // read tables row by row
    const texts = [];
    const passes = [['norm', 0.15, 0.6], ['bin', 0.6, 0.95]];
    for (const [mode, a, b] of passes) {
      phase = [a, b];
      const c = await prepare(file, mode);
      const { data } = await worker.recognize(c, { rotateAuto: true });
      texts.push(data.text || '');
      const r = parseBest(texts);
      if (r.found.length >= 8) break; // good enough, skip the second pass
    }
    return texts;
  } finally { worker.terminate(); }
}

/* ---------- turning label text into numbers ---------- */
function clean(text) {
  let t = (text || '').replace(/\r/g, '').replace(/[|]/g, ' ').replace(/[‘’]/g, "'");
  t = t.replace(/(\d)\s*,\s*(\d)/g, '$1.$2');                // 2,5 -> 2.5
  for (let k = 0; k < 2; k++) t = t.replace(/(\d)[oO]/g, '$10').replace(/[oO](\d)/g, '0$1').replace(/(\d)[lI](?=\d|\s*g\b)/g, '$11'); // 1O -> 10, l1 -> 11
  t = t.replace(/(\s)[oO](?=\.\d)/g, '$10');                 // O.5 -> 0.5
  t = t.replace(/\b(\d{1,3}) (\d{1,2})\s*g\b/g, '$1.$2g').replace(/\b(\d{1,3}) (\d)9\b/g, '$1.$2g'); // "18 6g"/"18 69" -> 18.6g (lost decimal point)
  t = t.replace(/<\s*(\d)/g, '$1').replace(/\btr(ace|\.)?\b/gi, '0');
  return t;
}
const NUM_RE = /(\d{1,5}(?:\.\d{1,2})?)\s*(mg|g|kcal|kj|9)?\b(\s*%)?/gi;
// First sensible number after position `from` (skips % values; "339" with no unit = "33 g").
function numAfter(t, from, opts) {
  const max = (opts && opts.within) || 40, seg = t.slice(from, from + max);
  // stop at the next nutrient word so we never steal its number
  const stop = seg.slice(2).search(/\b(fat|lipid|satur|carbo|glucid|sugar|sucre|fib|prot|salt|sodium|energy|calori|cholest)/i);
  const s = stop >= 0 ? seg.slice(0, stop + 2) : seg;
  NUM_RE.lastIndex = 0; let m;
  while ((m = NUM_RE.exec(s))) {
    if (m[3]) continue;
    let tok = m[1], unit = (m[2] || '').toLowerCase();
    if (unit === 'kj') continue;
    if (unit === '9') unit = 'g';
    if (!unit && /9$/.test(tok) && (/\.\d9$/.test(tok) || /^\d{2,4}$/.test(tok)) && !(opts && opts.plain)) { tok = tok.slice(0, -1).replace(/\.$/, ''); unit = 'g'; }
    const v = parseFloat(tok); if (isNaN(v)) continue;
    return { v, unit };
  }
  return null;
}
function findAll(t, re) { const out = []; let m; const r = new RegExp(re.source, 'gi'); while ((m = r.exec(t))) out.push({ i: m.index, end: m.index + m[0].length, s: m[0] }); return out; }

// Labels obey simple rules (saturates <= fat, sugars <= carbs, per 100 g nothing over 100 g...).
// When a value breaks them it's usually a lost decimal point, so try dividing by 10.
function sanity(v, basis) {
  const per100 = basis === '100' || basis === '100ml';
  const tenth = k => { if (v[k] != null) v[k] = Math.round(v[k]) / 10; };
  ['f', 'c', 'p', 'fib', 'sug', 'sat'].forEach(k => { if (v[k] != null && per100 && v[k] > 100) tenth(k); });
  if (v.sat != null && v.f != null && v.sat > v.f && v.sat / 10 <= v.f) tenth('sat');
  if (v.sug != null && v.c != null && v.sug > v.c && v.sug / 10 <= v.c) tenth('sug');
  if (v.fib != null && ((per100 && v.fib > 50) || (v.c != null && v.c > 0 && v.fib > v.c * 1.5 && v.fib > 15))) tenth('fib');
  if (v.sat != null && v.f != null && v.f < v.sat && v.f * 10 >= v.sat && v.f * 10 <= 100) v.f = v.f; // leave: can't tell which is wrong
  // energy check: 4p + 4c + 9f should be near the calories
  if (v.kcal && v.p != null && v.c != null && v.f != null) {
    const est = () => 4 * v.p + 4 * v.c + 9 * v.f;
    if (est() > v.kcal * 1.6) {
      for (const k of ['f', 'c', 'p']) { const old = v[k]; v[k] = old / 10; if (Math.abs(est() - v.kcal) < v.kcal * 0.3) { v[k] = Math.round(v[k] * 10) / 10; break; } v[k] = old; }
    }
  }
}
export function parseLabel(raw) {
  const t = clean(raw);
  const v = {}, out = { v, found: [] };
  const put = (k, val, max) => { if (val != null && !isNaN(val) && val >= 0 && val < max && v[k] == null) { v[k] = Math.round(val * 10) / 10; out.found.push(k); } };

  // what the numbers are "per"
  const per100 = /(?:per|\/)\s*100\s*(g|ml)\b|100\s*(g|ml)\s*(contains|provides)|\b100\s*(g|ml)\s*:/i.exec(t) || /\b100\s*(g|ml)\b/i.exec(t);
  const perServ = /(?:per|serving size|portion|each)\s+([^()\n]{0,30}?)\s*\(\s*(\d{1,4}(?:\.\d)?)\s*(g|ml|9)\s*\)/i.exec(t);
  const ukStyle = /energy|of which|saturates|\bkj\b|typical/i.test(t);
  if (per100 && (ukStyle || !perServ)) out.basis = /ml/i.test(per100[0]) ? '100ml' : '100';
  else if (perServ) { out.basis = 'serving'; out.serving = (perServ[1] || '').replace(/\s+/g, ' ').replace(/^(size|serving)\s*/i, '').trim() || 'serving'; out.size = parseFloat(perServ[2]); out.sunit = /ml/i.test(perServ[3]) ? 'ml' : 'g'; }

  // energy: first "kcal" figure, else "Calories N", else kJ / 4.184
  const calw = /calori\w*\s*[:\-]?\s*(\d{1,4})\b/i.exec(t);
  if (calw && !/kcal/i.test(t)) put('kcal', parseInt(calw[1], 10), 1200);
  const kc = /(\d{1,4}(?:\.\d)?)\s*(k\s*c\s*a\s*[l1i]|kcal|keal|kcai)/i.exec(t);
  if (kc && v.kcal == null) put('kcal', Math.round(parseFloat(kc[1])), 1200);
  if (v.kcal == null) { const cal = findAll(t, /calori\w*/)[0]; if (cal) { const n = numAfter(t, cal.end, { plain: true, within: 30 }); if (n) put('kcal', Math.round(n.v), 1200); } }
  if (v.kcal == null) { const kj = /(\d{2,4})\s*k\s*j/i.exec(t); if (kj) put('kcal', Math.round(parseFloat(kj[1]) / 4.184), 1200); }

  const grams = (k, re, skipIf) => {
    for (const h of findAll(t, re)) {
      if (skipIf && skipIf.test(t.slice(Math.max(0, h.i - 14), h.i))) continue;
      const n = numAfter(t, h.end);
      if (n) { put(k, n.unit === 'mg' ? n.v / 1000 : n.v, 1000); if (v[k] != null) return; }
    }
  };
  grams('sat', /satur\w*|saturés|satures/);
  grams('sug', /sugars?|sucres|sugar5/);
  grams('fib', /f[il1]b(?:re|er|res|ras)?\b|dietary f\w*|\bfibr\w*|\bfore\b/);
  grams('p', /prot[eé]in\w*|prot[eé]ines|\bprot\w*|\bpr[o0]te\w*/);
  grams('f', /\b(?:total\s+)?fat\b|lipides|\bfats?\b/, /satur|trans|which/i);
  grams('c', /carbohydrates?|carbo\w*|glucides/);
  // sodium in mg (UK labels give salt in g: sodium = salt / 2.5)
  for (const h of findAll(t, /sodium/)) { const n = numAfter(t, h.end); if (n) { put('na', n.unit === 'g' && n.v < 10 ? n.v * 1000 : n.v, 20000); break; } }
  if (v.na == null) for (const h of findAll(t, /\bsalt\b|\bsel\b|\bsa[l1i]t\b|\bsan\b/)) { const n = numAfter(t, h.end); if (n && n.v < 60) { v.na = Math.round(n.v * 400); out.found.push('na'); break; } }
  if (v.na != null) v.na = Math.round(v.na);
  sanity(v, out.basis);
  return out;
}
