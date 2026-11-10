/* Samslimmer: food log PDF for a dietitian.
   A tiny hand-written PDF maker (built-in Helvetica, A4) so it works offline with no extra library. */
import * as S from './store.js';

const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

// Map text to the PDF's WinAnsi font encoding; anything it can't show becomes '?'.
const WIN = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '™': 153 };
function enc(str) {
  let o = '';
  for (const ch of String(str)) {
    let c = ch.charCodeAt(0);
    if (WIN[ch]) c = WIN[ch];
    else if (c > 255) {
      const plain = ch.normalize ? ch.normalize('NFD').replace(/[̀-ͯ]/g, '') : '';
      c = plain && plain.charCodeAt(0) < 256 ? plain.charCodeAt(0) : 63;
    }
    if (c === 40 || c === 41 || c === 92) o += '\\' + String.fromCharCode(c);
    else if (c < 32) o += ' ';
    else o += String.fromCharCode(c);
  }
  return o;
}
function width(str, size, bold) {
  const t = bold ? W_BOLD : W_REG; let w = 0;
  for (const ch of String(str)) { const c = ch.charCodeAt(0); w += c >= 32 && c <= 126 ? t[c - 32] : 556; }
  return w * size / 1000;
}
function fit(str, size, bold, max) {
  str = String(str);
  if (width(str, size, bold) <= max) return str;
  while (str.length > 1 && width(str + '…', size, bold) > max) str = str.slice(0, -1);
  return str.trimEnd() + '…';
}
const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(v => v.toFixed(3)).join(' '); };

class Doc {
  constructor() { this.pages = []; this.W = 595.28; this.H = 841.89; this.add(); }
  add() { this.ops = []; this.pages.push(this.ops); }
  text(x, y, str, o = {}) {
    const size = o.size || 9, bold = !!o.bold;
    let s = o.max ? fit(str, size, bold, o.max) : String(str);
    if (o.align === 'right') x -= width(s, size, bold);
    else if (o.align === 'center') x -= width(s, size, bold) / 2;
    this.ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${hex(o.color || '#1F2A2E')} rg ${x.toFixed(2)} ${(this.H - y).toFixed(2)} Td (${enc(s)}) Tj ET`);
  }
  rect(x, y, w, h, color) { this.ops.push(`${hex(color)} rg ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); }
  line(x1, y1, x2, y2, color, lw) { this.ops.push(`${hex(color || '#D9DEDF')} RG ${lw || 0.6} w ${x1.toFixed(2)} ${(this.H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.H - y2).toFixed(2)} l S`); }
  blob() {
    const objs = [];
    const add = s => { objs.push(s); return objs.length; };
    const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pagesId = objs.length + 1; objs.push(null);
    const kids = [];
    this.pages.forEach(ops => {
      const content = ops.join('\n');
      const c = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`));
    });
    objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
    const cat = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return new Blob([bytes], { type: 'application/pdf' });
  }
}

const r0 = v => Math.round(v || 0).toLocaleString('en-GB');
const r1 = v => { const x = Math.round((v || 0) * 10) / 10; return (x % 1 ? x.toFixed(1) : String(x)); };
const na = salt => Math.round((salt || 0) * 400);
function amountOf(e) {
  const u = (e.food.units || [])[e.unit] || { short: 'g', g: 1 };
  const plainUnit = ['g', 'ml', 'oz', 'fl oz', 'kg', 'lb', 'l', 'cup', 'tbsp', 'tsp'].indexOf(u.short) >= 0;
  const a = Math.round(e.amt * 100) / 100;
  const txt = plainUnit ? `${a} ${u.short}` : `${a} x ${u.short}`;
  return u.short === 'g' || u.short === 'ml' ? txt : `${txt} (${Math.round(e.grams)} ${e.food.liquid ? 'ml' : 'g'})`;
}

export function daysInRange(from, to) {
  const out = []; let k = from;
  while (k <= to && out.length < 400) { out.push(k); k = S.addDays(k, 1); }
  return out;
}

export function buildLogPdf(from, to) {
  const st = S.state, p = st.profile || {}, plan = S.plan();
  const keys = daysInRange(from, to);
  const logged = keys.filter(k => st.days[k] && st.days[k].entries.length);
  const doc = new Doc(), M = 36, R = doc.W - M;
  const fmtD = k => S.parseKey(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const short = k => S.parseKey(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  let y = 0, pageNo = 1;
  const footer = () => { doc.text(M, doc.H - 22, 'Samslimmer food log · ' + (p.name || '') + ' · ' + short(from) + ' – ' + short(to), { size: 7.5, color: '#7A888D' }); doc.text(R, doc.H - 22, 'Page ' + pageNo, { size: 7.5, color: '#7A888D', align: 'right' }); };
  const newPage = () => { footer(); doc.add(); pageNo++; y = M + 6; };
  const need = h => { if (y + h > doc.H - 44) { newPage(); return true; } return false; };

  // ---- header ----
  doc.rect(0, 0, doc.W, 92, '#2E6F69');
  doc.text(M, 40, 'Food log' + (p.name ? ' – ' + p.name : ''), { size: 22, bold: true, color: '#FFFFFF' });
  doc.text(M, 60, short(from) + '  to  ' + short(to) + '   ·   ' + logged.length + ' of ' + keys.length + ' days logged', { size: 10, color: '#DDEFEC' });
  doc.text(M, 76, 'Made with Samslimmer on ' + short(S.todayKey()) + '. Amounts are as logged by the user; nutrition comes from food labels, Open Food Facts and Health Canada.', { size: 7.5, color: '#BFE0DB', max: R - M });
  y = 112;

  // ---- summary ----
  const tot = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, salt: 0 }; let water = 0;
  logged.forEach(k => { const t = S.totals(st.days[k].entries); Object.keys(tot).forEach(n => { tot[n] += t[n] || 0; }); water += st.days[k].water || 0; });
  const n = Math.max(1, logged.length);
  const cards = [['Average energy', r0(tot.kcal / n) + ' kcal', 'Target ' + r0(plan.kcal) + ' kcal'], ['Protein', r1(tot.p / n) + ' g', 'Target ' + plan.p + ' g'], ['Carbohydrate', r1(tot.c / n) + ' g', 'Target ' + plan.c + ' g'], ['Fat', r1(tot.f / n) + ' g', 'Target ' + plan.f + ' g'],
    ['Fibre', r1(tot.fib / n) + ' g', 'Target ' + plan.fib + ' g'], ['Sugars', r1(tot.sug / n) + ' g', 'per day'], ['Saturated fat', r1(tot.sat / n) + ' g', 'per day'], ['Sodium', r0(na(tot.salt / n)) + ' mg', 'per day']];
  doc.text(M, y, 'Daily averages (logged days only)', { size: 11, bold: true }); y += 10;
  const cw = (R - M - 3 * 8) / 4;
  cards.forEach((c, i) => {
    const cx = M + (i % 4) * (cw + 8), cy = y + Math.floor(i / 4) * 52;
    doc.rect(cx, cy, cw, 44, '#F1F4F4');
    doc.text(cx + 9, cy + 14, c[0], { size: 7.5, color: '#55646A' });
    doc.text(cx + 9, cy + 29, c[1], { size: 13, bold: true });
    doc.text(cx + 9, cy + 39, c[2], { size: 7, color: '#7A888D' });
  });
  y += 2 * 52 + 6;
  const ws = (st.weights || []).filter(w => w[0] >= from && w[0] <= to).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const info = [];
  if (p.sex) info.push((p.sex === 'f' ? 'Female' : 'Male') + (p.dob ? ', age ' + S.ageOf(p.dob) : p.age ? ', age ' + p.age : '') + (p.hcm ? ', height ' + p.hcm + ' cm' : ''));
  info.push('Water: average ' + r1(water / n) + ' cups a day (' + (p.cupMl || 250) + ' ml cups)');
  if (ws.length) info.push('Weight: ' + ws.map(w => short(w[0]).replace(/ \d{4}$/, '') + ' ' + r1(w[1]) + ' kg').slice(0, 8).join(' · ') + (ws.length > 8 ? ' …' : ''));
  info.forEach(t => { doc.text(M, y, t, { size: 8.5, color: '#55646A', max: R - M }); y += 13; });
  y += 8;

  // ---- per-day tables ----
  const cols = [['Meal', M, 'left', 54], ['Food', M + 56, 'left', 160], ['Amount', M + 218, 'left', 92], ['kcal', M + 334, 'right'], ['Prot g', M + 366, 'right'], ['Carb g', M + 398, 'right'], ['Fat g', M + 428, 'right'], ['Fibre g', M + 460, 'right'], ['Sugar g', M + 492, 'right'], ['Sodium mg', R, 'right']];
  const head = () => { doc.rect(M, y - 9, R - M, 13, '#E6ECEB'); cols.forEach(([l, x, a]) => doc.text(a === 'right' ? x - 2 : x + 2, y, l, { size: 7, bold: true, color: '#55646A', align: a })); y += 12; };
  if (!logged.length) { doc.text(M, y + 10, 'Nothing was logged in this period.', { size: 11, color: '#55646A' }); }
  keys.forEach(k => {
    const d = st.days[k];
    if (!d || !d.entries.length) return;
    need(60);
    doc.text(M, y + 4, fmtD(k), { size: 11, bold: true });
    doc.text(R, y + 4, (d.water || 0) + ' cups of water' + (d.done ? ' · day marked complete' : ''), { size: 8, color: '#55646A', align: 'right' });
    y += 18; head();
    const meals = S.meals().concat([...new Set(d.entries.map(e => e.meal))].filter(m => S.meals().indexOf(m) < 0));
    meals.forEach(m => {
      const es = d.entries.filter(e => e.meal === m);
      es.forEach((e, i) => {
        if (need(14)) { doc.text(M, y + 4, fmtD(k) + ' (continued)', { size: 9, bold: true, color: '#55646A' }); y += 16; head(); }
        const nn = e.n || {};
        const row = [i === 0 ? m : '', e.food.name + (e.food.brand ? ' (' + e.food.brand + ')' : ''), amountOf(e), r0(nn.kcal), r1(nn.p), r1(nn.c), r1(nn.f), r1(nn.fib), r1(nn.sug), r0(na(nn.salt))];
        cols.forEach(([, x, a, max], j) => doc.text(a === 'right' ? x - 2 : x + 2, y, row[j], { size: 7.8, bold: j === 0, align: a, max: max ? max - 4 : undefined, color: j === 0 ? '#2E6F69' : '#1F2A2E' }));
        y += 4; doc.line(M, y, R, y, '#EEF1F1'); y += 9;
      });
    });
    const t = S.totals(d.entries);
    need(16);
    doc.rect(M, y - 9, R - M, 14, '#F7F1E6');
    const trow = ['Total', '', '', r0(t.kcal), r1(t.p), r1(t.c), r1(t.f), r1(t.fib), r1(t.sug), r0(na(t.salt))];
    cols.forEach(([, x, a], j) => { if (trow[j]) doc.text(a === 'right' ? x - 2 : x + 2, y, trow[j], { size: 8, bold: true, align: a }); });
    y += 26;
  });
  footer();
  return doc.blob();
}
