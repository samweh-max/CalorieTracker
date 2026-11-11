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

// Shrink big photos, make them grey and punchy: OCR is faster and more accurate.
function prepare(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const max = 1800, k = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * k), h = Math.round(img.height * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
      try {
        const d = x.getImageData(0, 0, w, h), p = d.data;
        let sum = 0; for (let i = 0; i < p.length; i += 4) sum += 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        const mean = sum / (p.length / 4);
        for (let i = 0; i < p.length; i += 4) {
          let g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
          g = Math.max(0, Math.min(255, (g - mean) * 1.6 + 128));
          p[i] = p[i + 1] = p[i + 2] = g;
        }
        x.putImageData(d, 0, 0);
      } catch (e) {}
      URL.revokeObjectURL(url); res(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Couldn\'t open that photo')); };
    img.src = url;
  });
}

export async function readLabel(file, onProgress) {
  onProgress && onProgress(0.02, 'Getting the label reader ready…');
  const T = await loadTesseract();
  const canvas = await prepare(file);
  const worker = await T.createWorker('eng', 1, {
    logger: m => { if (onProgress && m.status === 'recognizing text') onProgress(0.15 + m.progress * 0.85, 'Reading the label…'); else if (onProgress && /load|initializ/.test(m.status || '')) onProgress(0.05 + (m.progress || 0) * 0.1, 'Getting the label reader ready…'); }
  });
  try {
    try { await worker.setParameters({ tessedit_pageseg_mode: '6' }); } catch (e) {} // read tables row by row
    const { data } = await worker.recognize(canvas);
    return data.text || '';
  } finally { worker.terminate(); }
}

/* ---------- turning label text into numbers ---------- */
const NUM = '(\\d{1,4}(?:[.,]\\d{1,2})?)';
function clean(text) {
  return text
    .replace(/\r/g, '')
    .replace(/(\d)\s*[,](\d)/g, '$1.$2')          // 2,5 g -> 2.5 g
    .replace(/(\d)[oO](?=\s*(g|mg|kcal|kj)\b)/gi, '$10') // 1Og -> 10g
    .replace(/(\s)[oO](?=[.,]\d)/g, '$10')        // O.5g -> 0.5g
    .replace(/(\d)\s*[lI](?=\s*g\b)/g, '$11')        // 1lg -> 11g (rare)
    .replace(/<\s*(\d)/g, '$1')                     // <0.5 g -> 0.5 g
    .replace(/[|]/g, ' ');
}
const lineOf = (lines, re) => lines.find(l => re.test(l));
function firstNum(line, after) {
  if (!line) return null;
  const s = after ? line.slice(line.search(after)) : line;
  const m = s.match(new RegExp(NUM));
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}
// Grams value that follows the nutrient name (skips % daily values).
// OCR often reads "g" as "9": "33 g" -> "339", "18.6g" -> "18.69". With no unit after it, a trailing 9 is the g.
function gramsOn(line, name) {
  if (!line) return null;
  const s = line.slice(Math.max(0, line.search(name)));
  const re = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(mg|g)?(\s*%)?/gi;
  let m;
  while ((m = re.exec(s))) {
    if (m[3]) continue; // a % daily value
    let t = m[1].replace(',', '.'), unit = m[2] && m[2].toLowerCase();
    if (!unit && /9$/.test(t) && (/\.\d9$/.test(t) || /^\d{2,3}$/.test(t))) { t = t.slice(0, -1).replace(/\.$/, ''); unit = 'g'; }
    let v = parseFloat(t);
    if (isNaN(v)) continue;
    if (unit === 'mg') v = v / 1000;
    return v;
  }
  return null;
}

export function parseLabel(raw) {
  const text = clean(raw || '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const all = lines.join(' \n ');
  const v = {}, out = { v, found: [] };

  // what the numbers are "per"
  const per100 = /per\s*100\s*(g|ml)\b|100\s*(g|ml)\b/i.exec(all);
  const perServ = /per\s+([^()\n]{1,30}?)\s*\(\s*(\d{1,4}(?:\.\d)?)\s*(g|ml|9|mL)\s*\)/i.exec(all);
  const ukStyle = /energy|of which|saturates|kj/i.test(all);
  if (per100 && (ukStyle || !perServ)) { out.basis = /ml/i.test(per100[1] || per100[2] || '') ? '100ml' : '100'; }
  else if (perServ) { out.basis = 'serving'; out.serving = perServ[1].replace(/\s+/g, ' ').trim() || 'serving'; out.size = parseFloat(perServ[2]); out.sunit = /ml/i.test(perServ[3]) ? 'ml' : 'g'; }
  else if (per100) out.basis = /ml/i.test(per100[1] || per100[2] || '') ? '100ml' : '100';

  // energy
  let kcal = null;
  const kc = all.match(new RegExp(NUM + '\\s*kcal', 'i'));
  if (kc) kcal = parseFloat(kc[1]);
  if (kcal == null) { const cl = lineOf(lines, /calories|calorie/i); kcal = firstNum(cl, /calori/i); }
  if (kcal == null) { const kj = all.match(new RegExp(NUM + '\\s*kj', 'i')); if (kj) kcal = Math.round(parseFloat(kj[1]) / 4.184); }
  if (kcal != null && kcal < 1200) { v.kcal = Math.round(kcal); out.found.push('kcal'); }

  const take = (key, re, name) => { const l = lineOf(lines, re); const g = gramsOn(l, name || re); if (g != null && g < 1000) { v[key] = Math.round(g * 10) / 10; out.found.push(key); } };
  take('sat', /saturate|saturated|satur/i, /satur/i);
  take('sug', /sugar|sucres/i, /sugar|sucres/i);
  take('fib', /fibre|fiber|fibres/i, /fib/i);
  take('p', /protein|protéines|proteines/i, /prot/i);
  // fat/carbs: the line that is NOT the "of which" one
  const fatLine = lines.find(l => /\bfat\b|lipides|total fat/i.test(l) && !/saturat|trans|satur/i.test(l));
  { const g = gramsOn(fatLine, /fat|lipides/i); if (g != null && g < 1000) { v.f = Math.round(g * 10) / 10; out.found.push('f'); } }
  const carbLine = lines.find(l => /carbohydrate|glucides|carbs/i.test(l) && !/sugar/i.test(l));
  { const g = gramsOn(carbLine, /carb|glucides/i); if (g != null && g < 1000) { v.c = Math.round(g * 10) / 10; out.found.push('c'); } }

  // sodium in mg (UK labels give salt in g: sodium = salt / 2.5)
  const naLine = lineOf(lines, /sodium/i);
  if (naLine) {
    const m = naLine.slice(naLine.search(/sodium/i)).match(new RegExp(NUM + '\\s*(mg|g)\\b', 'i'));
    if (m) { v.na = Math.round(parseFloat(m[1]) * (m[2].toLowerCase() === 'g' ? 1000 : 1)); out.found.push('na'); }
  }
  if (v.na == null) { const sl = lineOf(lines, /\bsalt\b|\bsel\b/i); const g = gramsOn(sl, /salt|sel/i); if (g != null && g < 100) { v.na = Math.round(g * 400); out.found.push('na'); } }
  return out;
}
