/* Samslimmer buddy: an original hand-inked caricature for the Today top bar.
   Body shape comes from height, weight, age and sex (Deurenberg body-fat estimate);
   mood comes from how healthy today's choices are, plus water, logging and calories. */
import * as S from './store.js';
import * as F from './foods.js';

const TPL = `<svg width="{{w}}" height="{{h}}" aria-hidden="true" focusable="false" viewBox="0 0 140 190" class="{{stillCls}}">
<defs>
<filter id="kboil" x="-5%" y="-5%" width="110%" height="110%">
<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="1">
<animate attributeName="seed" values="1;3;5;2" dur="0.5s" calcMode="discrete" repeatCount="indefinite"></animate>
</feTurbulence>
<feDisplacementMap in="SourceGraphic" scale="{{boil}}"></feDisplacementMap>
</filter>
</defs>
<ellipse cx="70" cy="184" rx="{{shadowRx}}" ry="4.5" fill="rgba(26,26,26,.13)"></ellipse>
<g opacity="{{cloudOp}}" transform="translate(-26 -2) scale(.85)">
<path d="M42 18 a9 9 0 0 1 14 -6 a12 12 0 0 1 22 2 a9 9 0 0 1 8 15 H44 a8 8 0 0 1 -2 -11 z" fill="#B8C2CC" stroke="#1A1A1A" stroke-width="2"></path>
<path class="k-rain" d="M50 34 l-2 6" stroke="#5B8DB8" stroke-width="2.4" stroke-linecap="round"></path>
<path class="k-rain k-rain2" d="M62 34 l-2 6" stroke="#5B8DB8" stroke-width="2.4" stroke-linecap="round"></path>
<path class="k-rain k-rain3" d="M74 34 l-2 6" stroke="#5B8DB8" stroke-width="2.4" stroke-linecap="round"></path>
</g>
<g class="{{bodyAnim}}">
<g style="filter:url(#kboil)">
<g transform="{{scaleT}}">
<path d="{{legsD}}" fill="{{pantsCol}}" class="k-inkf"></path>
<path d="{{shoeL}}" fill="#2B2B2B" class="k-inkf"></path>
<path d="{{shoeR}}" fill="#2B2B2B" class="k-inkf"></path>
<g class="{{armBackAnim}}" style="transform-origin:{{shBx}}px {{shY}}px">
<path d="{{armBackD}}" class="k-ink" style="stroke-width:{{armW}};stroke:#1A1A1A"></path>
<path d="{{armBackD}}" fill="none" stroke="{{shirtCol}}" stroke-width="{{armWin}}" stroke-linecap="round"></path>
<circle cx="{{handBx}}" cy="{{handBy}}" r="5.2" fill="#F3D2B3" class="k-inkf"></circle>
</g>
<g class="{{bellyAnim}}">
<path d="{{bodyD}}" fill="{{shirtCol}}" class="k-inkf"></path>
<path d="{{beltD}}" class="k-ink"></path>
<path d="{{buttonsD}}" class="k-thin"></path>
<path d="{{bellyLineD}}" class="k-thin" opacity=".55"></path>
</g>
<g class="{{armFrontAnim}}" style="transform-origin:{{shFx}}px {{shY}}px">
<path d="{{armFrontD}}" class="k-ink" style="stroke-width:{{armW}};stroke:#1A1A1A"></path>
<path d="{{armFrontD}}" fill="none" stroke="{{shirtCol}}" stroke-width="{{armWin}}" stroke-linecap="round"></path>
<circle cx="{{handFx}}" cy="{{handFy}}" r="5.2" fill="#F3D2B3" class="k-inkf"></circle>
<g opacity="{{vegOp}}"><circle cx="{{vegX}}" cy="{{vegY}}" r="6" fill="#3FA34D" class="k-inkf"></circle><circle cx="{{vegX2}}" cy="{{vegY2}}" r="5" fill="#3FA34D" class="k-inkf"></circle><path d="{{vegStem}}" stroke="#1A1A1A" stroke-width="2.2" fill="#9BD18B"></path></g>
<g opacity="{{cupOp}}"><path d="{{cupD}}" fill="#BFE3F7" class="k-inkf"></path></g>
<g opacity="{{appleOp}}"><path d="{{appleD}}" fill="#E0412E" class="k-inkf"></path><path d="{{appleLeaf}}" fill="#5BAE4A" class="k-inkf"></path></g>
<g opacity="{{sweetOp}}"><rect x="{{sweetX}}" y="{{sweetY}}" width="12" height="16" rx="2" fill="#7A3E1D" class="k-inkf"></rect><path d="{{sweetFoil}}" fill="#E5E7EB" class="k-inkf"></path></g>
</g>
<path d="M64 100 Q70 106 76 100 L76 108 Q70 111 64 108 Z" fill="#F3D2B3" class="k-inkf"></path>
<g class="{{headAnim}}">
<path d="{{hairBackD}}" fill="{{hairCol}}" class="k-inkf"></path>
<path d="M33 62 q-9 -3 -9 7 q1 10 10 8" fill="#F3D2B3" class="k-inkf"></path>
<path d="{{headD}}" fill="#F3D2B3" class="k-inkf"></path>
<path d="{{jowlD}}" class="k-thin" opacity=".7"></path>
<ellipse cx="50" cy="76" rx="6" ry="3.5" fill="#E8907E" opacity="{{blushOp}}"></ellipse>
<ellipse cx="94" cy="74" rx="5" ry="3" fill="#E8907E" opacity="{{blushOp}}"></ellipse>
<path d="{{hairTopD}}" fill="{{hairCol}}" class="k-inkf"></path>
<path d="{{hairStrands}}" class="k-ink" style="stroke:{{hairStroke}}"></path>
<g opacity="{{hatOp}}"><path d="M42 34 Q36 14 52 14 Q56 2 70 6 Q84 0 90 12 Q106 12 98 34 Z" fill="#FFFFFF" class="k-inkf"></path><path d="M42 30 Q70 38 98 30 L98 38 Q70 46 42 38 Z" fill="#F4F4F2" class="k-inkf"></path><path d="M60 16 q2 6 0 12 M76 12 q2 8 0 14" class="k-thin" opacity=".6"></path></g>
<g class="{{eyeAnim}}">
<ellipse cx="58" cy="58" rx="{{eyeRx}}" ry="{{eyeRy}}" fill="#FFFFFF" class="k-inkf"></ellipse>
<ellipse cx="82" cy="57" rx="{{eyeRx2}}" ry="{{eyeRy2}}" fill="#FFFFFF" class="k-inkf"></ellipse>
<circle cx="{{pupLx}}" cy="{{pupY}}" r="{{pupR}}" class="k-blk"></circle>
<circle cx="{{pupRx}}" cy="{{pupY2}}" r="{{pupR}}" class="k-blk"></circle>
</g>
<path d="{{lidsD}}" fill="#F3D2B3" class="k-inkf" opacity="{{lidsOp}}"></path>
<g opacity="{{heartEyesOp}}" class="{{heartEyesAnim}}"><path d="M58 54c-2.6-4.4-10-3.2-10 2.4 0 4.2 5.4 7.4 10 11.6 4.6-4.2 10-7.4 10-11.6 0-5.6-7.4-6.8-10-2.4z" fill="#E2483D" class="k-inkf"></path><path d="M82 53c-2.4-4-9-2.9-9 2.2 0 3.8 4.9 6.7 9 10.5 4.1-3.8 9-6.7 9-10.5 0-5.1-6.6-6.2-9-2.2z" fill="#E2483D" class="k-inkf"></path></g>
<path d="{{spiralD}}" class="k-thin" opacity="{{spiralOp}}"></path>
<path d="{{bagsD}}" class="k-thin" opacity="{{bagsOp}}"></path>
<g class="{{browAnim}}"><path d="{{browsD}}" class="k-ink" style="stroke-width:4.2;stroke:{{browCol}}"></path></g>
<path d="M70 58 Q66 72 70 80 Q78 88 88 82 Q93 76 88 70 Q84 66 78 68" fill="#ECBB97" class="k-inkf"></path>
<path d="M79 79 q3 2 6 0" class="k-thin"></path>
<path d="{{tacheD}}" fill="{{hairCol}}" class="k-inkf" opacity="{{tacheOp}}"></path>
<g class="{{talkA}}"><path d="{{mouthA}}" fill="{{mouthFill}}" class="k-inkf"></path><path d="{{teethA}}" fill="#FFFFFF" class="k-thin"></path></g>
<g class="{{talkB}}" opacity="{{mouthBOp}}"><path d="{{mouthB}}" fill="#7A1F1F" class="k-inkf"></path></g>
<path d="{{tongueD}}" fill="#E86A8A" class="k-inkf" opacity="{{tongueOp}}"></path>
<path d="M44 66 c1.6 2.6 2.4 3.8 2.4 5a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.4 2.4-5z" fill="#7DB9E8" stroke="#1A1A1A" stroke-width="1.2" opacity="{{tearOp}}"></path>
</g>
</g>
</g>
</g>
<g opacity="{{starsOp}}"><path class="k-pop" d="M24 40l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z" fill="#F5B82E" stroke="#1A1A1A" stroke-width="1.4"></path><path class="k-pop k-pop2" d="M116 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F5B82E" stroke="#1A1A1A" stroke-width="1.4"></path><path class="k-pop k-pop3" d="M118 92l1.8 4.4 4.4 1.8-4.4 1.8-1.8 4.4-1.8-4.4-4.4-1.8 4.4-1.8z" fill="#F5B82E" stroke="#1A1A1A" stroke-width="1.4"></path></g>
<g opacity="{{zzzOp}}" style="font:900 15px Georgia,serif" fill="#1A1A1A"><text class="k-fl" x="102" y="36">z</text><text class="k-fl k-fl2" x="110" y="26">z</text><text class="k-fl k-fl3" x="118" y="16">Z</text></g>
<g opacity="{{dropsOp}}"><path class="k-fa" d="M44 6c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#7DB9E8" stroke="#1A1A1A" stroke-width="1.4"></path><path class="k-fa k-fa2" d="M70 0c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#7DB9E8" stroke="#1A1A1A" stroke-width="1.4"></path><path class="k-fa k-fa3" d="M96 6c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#7DB9E8" stroke="#1A1A1A" stroke-width="1.4"></path></g>
<g opacity="{{sweatOp}}"><path class="k-fly" d="M104 46c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#7DB9E8" stroke="#1A1A1A" stroke-width="1.4"></path><path class="k-fly k-fly2" d="M36 44c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#7DB9E8" stroke="#1A1A1A" stroke-width="1.4"></path></g>
<g opacity="{{linesOp}}" class="k-lines" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round"><path d="M18 60 h-10 M16 76 h-12 M18 92 h-10 M122 60 h10 M124 76 h12 M122 92 h10"></path></g>
<g opacity="{{boingOp}}" class="k-lines" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" fill="none"><path d="M112 70 q6 -4 12 0 M114 78 q6 -4 12 0 M112 86 q6 -4 12 0"></path></g>
<g opacity="{{exclOp}}" style="font:900 22px Georgia,serif" fill="#E2483D" stroke="#1A1A1A" stroke-width="1.2"><text class="k-pop" x="108" y="30">!</text><text class="k-pop k-pop2" x="118" y="40">!</text><text class="k-pop k-pop3" x="22" y="34">?</text></g>
<g opacity="{{notesOp}}" fill="#1A1A1A"><path class="k-fl" d="M112 40 v-16 l10 -3 v15 M112 40 a3.4 2.6 0 1 1 -0.1 0 M122 36 a3.4 2.6 0 1 1 -0.1 0" stroke="#1A1A1A" stroke-width="2" fill="#1A1A1A"></path><path class="k-fl k-fl2" d="M22 50 v-14 l2 0 q6 4 8 0 M22 50 a3.4 2.6 0 1 1 -0.1 0" stroke="#1A1A1A" stroke-width="2"></path><path class="k-fl k-fl3" d="M120 70 v-12 M120 70 a3 2.4 0 1 1 -0.1 0" stroke="#1A1A1A" stroke-width="2"></path></g>
<g opacity="{{growlOp}}" style="font:900 11px Georgia,serif" fill="#1A1A1A"><text class="k-lines" x="98" y="142">grr</text><text class="k-lines" x="14" y="150">rrr</text><text class="k-fl" x="104" y="126" style="font-size:9px">rumble</text></g>
<g opacity="{{heartsOp}}"><path class="k-fl" fill="#E2483D" stroke="#1A1A1A" stroke-width="1.4" d="M26 40c-2-3-7-2-7 2 0 3 4 5 7 8 3-3 7-5 7-8 0-4-5-5-7-2z"></path><path class="k-fl k-fl2" fill="#F07A9A" stroke="#1A1A1A" stroke-width="1.4" d="M118 30c-1.6-2.4-5.6-1.6-5.6 1.6 0 2.4 3.2 4 5.6 6.4 2.4-2.4 5.6-4 5.6-6.4 0-3.2-4-4-5.6-1.6z"></path></g>
<g opacity="{{heartOp}}"><path class="k-fl" fill="#E2483D" stroke="#1A1A1A" stroke-width="1.4" d="M112 46c-2-3-7-2-7 2 0 3 4 5 7 8 3-3 7-5 7-8 0-4-5-5-7-2z"></path></g>
</svg>`;

function vals(props) {
    var P = props, f = function (n) { return Math.round(n * 10) / 10; };
    var mood = P.mood || 'happy', sex = P.sex || 'm';
    var age = P.age != null ? +P.age : 34, hcm = P.hcm != null ? +P.hcm : 180, kg = P.kg != null ? +P.kg : 87;
    var size = P.size != null ? +P.size : 190, animate = P.animate !== false && P.animate !== 'false';
    var tache = sex === 'm' && P.moustache !== false && P.moustache !== 'false';
    var shirt = P.shirt || '#C8553D';
    var bmi = kg / Math.pow(hcm / 100, 2);
    var bf = 1.2 * bmi + 0.23 * age - (sex === 'm' ? 10.8 : 0) - 5.4;
    var w = Math.max(0, Math.min(1, (bf - (sex === 'm' ? 8 : 18)) / 26));
    if (mood === 'coma') w = Math.min(1.1, w + 0.12);
    var hs = Math.max(0.9, Math.min(1.06, hcm / 178));
    // ---------- body: pear shape ----------
    var shX = 15 + 5 * w, bellyX = 21 + 24 * w, hipX = 19 + 15 * w;
    var top = 104, mid = 136 + 3 * w, bot = 160;
    var bodyD = 'M' + f(70 - shX) + ' ' + top + ' Q70 ' + (top - 5) + ' ' + f(70 + shX) + ' ' + top +
      ' C' + f(70 + bellyX + 2) + ' ' + f(top + 12) + ' ' + f(70 + bellyX + 4) + ' ' + f(mid + 10) + ' ' + f(70 + hipX) + ' ' + bot +
      ' Q70 ' + (bot + 6) + ' ' + f(70 - hipX) + ' ' + bot +
      ' C' + f(70 - bellyX - 4) + ' ' + f(mid + 10) + ' ' + f(70 - bellyX - 2) + ' ' + f(top + 12) + ' ' + f(70 - shX) + ' ' + top + ' Z';
    var beltY = bot - 7;
    var beltD = 'M' + f(70 - hipX - 2) + ' ' + f(beltY) + ' Q70 ' + f(beltY + 5) + ' ' + f(70 + hipX + 2) + ' ' + f(beltY);
    var buttonsD = 'M70 ' + (top + 6) + ' v0.1 M70 ' + (top + 18) + ' v0.1 M70 ' + (top + 30) + ' v0.1 M70 ' + (top + 42) + ' v0.1';
    var bellyLineD = w > 0.35 ? 'M' + f(70 - bellyX * 0.55) + ' ' + f(mid + 6) + ' Q70 ' + f(mid + 14) + ' ' + f(70 + bellyX * 0.55) + ' ' + f(mid + 6) : '';
    // legs: short trousers, gap grows with width
    var lw = 9 + 6 * w, gap = 2 + 4 * w, ly = bot - 2, lb = 178;
    var lL = 70 - gap / 2 - lw, lR = 70 + gap / 2;
    var legsD = 'M' + f(lL) + ' ' + ly + ' L' + f(lL + 1) + ' ' + lb + ' L' + f(lL + lw) + ' ' + lb + ' L' + f(lL + lw + 1) + ' ' + ly + ' Z M' + f(lR - 1) + ' ' + ly + ' L' + f(lR) + ' ' + lb + ' L' + f(lR + lw - 1) + ' ' + lb + ' L' + f(lR + lw) + ' ' + ly + ' Z';
    var shoeL = 'M' + f(lL - 9) + ' 184 Q' + f(lL - 10) + ' 175 ' + f(lL + 2) + ' 176 L' + f(lL + lw + 1) + ' 177 Q' + f(lL + lw + 3) + ' 184 ' + f(lL + lw) + ' 185 Z';
    var shoeR = 'M' + f(lR) + ' 185 Q' + f(lR - 2) + ' 177 ' + f(lR + 1) + ' 177 L' + f(lR + lw + 2) + ' 176 Q' + f(lR + lw + 14) + ' 175 ' + f(lR + lw + 13) + ' 184 Z';
    // ---------- arms ----------
    var shY = top + 4, shBx = 70 - shX + 1, shFx = 70 + shX - 1;
    var arm = function (x, y, ex, ey, hx, hy) { return { d: 'M' + f(x) + ' ' + f(y) + ' Q' + f(ex) + ' ' + f(ey) + ' ' + f(hx) + ' ' + f(hy), hx: hx, hy: hy }; };
    var bx = shBx, fx = shFx, wb = bellyX * 0.6;
    var A = {
      down: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 10 + wb * 0.3, shY + 20, fx + 6 + wb * 0.25, shY + 40)],
      up: [arm(bx, shY, bx - 30, shY - 2, bx - 34, shY - 26), arm(fx, shY, fx + 30, shY - 2, fx + 34, shY - 26)],
      wave: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 20, shY - 2, fx + 18, shY - 28)],
      flex: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 24, shY + 4, fx + 18, shY - 22)],
      belly: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 8, shY + 26, 72, mid + 2)],
      brow: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 26, shY - 10, 92, 46)],
      cup: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 22, shY + 4, fx + 18, shY - 14)],
      limp: [arm(bx, shY, bx - 6, shY + 24, bx - 2, shY + 44), arm(fx, shY, fx + 6, shY + 24, fx + 2, shY + 44)],
      sweet: [arm(bx, shY, bx - 10 - wb * 0.3, shY + 20, bx - 6 - wb * 0.25, shY + 40), arm(fx, shY, fx + 22, shY, fx + 20, shY - 18)]
    };
    var pose = { love: 'sweet', shock: 'up', dance: 'up', chef: 'wave', hungry: 'belly', neutral: 'down', happy: 'wave', proud: 'up', flex: 'flex', splash: 'cup', thirsty: 'brow', sugar: 'sweet', coma: 'belly', sad: 'limp', sleepy: 'limp' }[mood] || 'down';
    var aB = A[pose][0], aF = A[pose][1];
    // ---------- head ----------
    var jw = 4 * w;
    var headD = 'M70 ' + f(22 - 1) + ' C' + f(100 + jw) + ' 20 ' + f(108 + jw) + ' 48 ' + f(104 + jw) + ' 70 C' + f(100 + jw) + ' ' + f(92 + 2 * jw) + ' ' + f(84 + jw) + ' ' + f(100 + jw) + ' 70 ' + f(100 + jw) +
      ' C' + f(54 - jw) + ' ' + f(100 + jw) + ' ' + f(36 - jw) + ' ' + f(92 + 2 * jw) + ' ' + f(34 - jw) + ' 70 C' + f(32 - jw) + ' 46 40 21 70 21 Z';
    var jowlD = w > 0.4 ? 'M' + f(44 - jw) + ' ' + f(86 + jw) + ' Q70 ' + f(104 + jw) + ' ' + f(98 + jw) + ' ' + f(86 + jw) : '';
    var hairCol = age >= 60 ? '#D7D7D2' : age >= 45 ? '#7B6F66' : '#2B211C';
    var hairTopD, hairBackD = '', hairStrands;
    if (sex === 'm') {
      hairTopD = age >= 45
        ? 'M34 56 Q30 40 40 34 Q44 44 40 58 Z M106 56 Q110 40 100 34 Q96 44 100 58 Z'
        : 'M34 58 Q28 30 52 22 Q70 10 92 20 Q112 30 106 58 Q100 40 88 34 Q74 42 60 32 Q46 40 40 58 Z';
      hairStrands = age >= 45 ? 'M62 22 Q66 12 74 14 M68 21 Q74 10 82 16' : 'M58 26 q4 -8 12 -6 M74 22 q6 -6 12 0';
    } else {
      hairBackD = 'M30 70 Q22 40 44 22 Q70 6 96 22 Q118 40 110 72 Q116 92 104 98 Q108 76 100 60 L40 60 Q32 76 36 98 Q24 92 30 70 Z';
      hairTopD = 'M34 58 Q30 30 56 22 Q72 14 90 22 Q112 32 106 58 Q98 40 84 36 Q70 44 58 34 Q44 42 40 58 Z';
      hairStrands = 'M56 30 q6 -6 14 -4 M76 28 q8 -4 14 2';
    }
    // eyes, brows, mouth per mood
    var look = { love: [0, 0], shock: [0, 0], dance: [0, -1], chef: [1, -1], hungry: [0, -3], neutral: [0, 0], happy: [1, -1], proud: [0, -2], flex: [2, 0], splash: [0, -2], thirsty: [0, 1], sugar: [0, 0], coma: [0, 2], sad: [0, 2], sleepy: [0, 2] }[mood] || [0, 0];
    var eyeBig = mood === 'sugar' || mood === 'splash' || mood === 'proud' || mood === 'shock' || mood === 'hungry';
    var closed = mood === 'sleepy' || mood === 'coma' || mood === 'happy' || mood === 'proud' || mood === 'dance' || mood === 'chef' || mood === 'love';
    var lidsD = mood === 'coma' || mood === 'sleepy' ? 'M49 58 Q58 48 67 58 Q58 60 49 58 Z M75 57 Q82 48 89 57 Q82 59 75 57 Z'
        : mood === 'happy' || mood === 'proud' || mood === 'dance' || mood === 'chef' ? 'M49 59 Q58 50 67 59 Q58 54 49 59 Z M75 58 Q82 49 89 58 Q82 53 75 58 Z'
      : mood === 'thirsty' || mood === 'sad' ? 'M49 56 Q58 49 67 54 Q58 54 49 56 Z M75 54 Q82 49 89 56 Q82 54 75 54 Z' : '';
    var B = {
      love: 'M47 44 Q57 37 66 42 M75 41 Q83 36 91 41', shock: 'M46 35 Q57 27 66 34 M75 33 Q83 26 92 33', dance: 'M47 42 Q57 35 66 40 M75 39 Q83 34 91 39', chef: 'M47 42 Q57 36 66 41 M75 40 Q83 35 91 40', hungry: 'M48 44 Q57 41 66 44 M76 43 Q83 40 90 43',
      neutral: 'M48 46 Q57 41 66 45 M76 44 Q83 40 90 44', happy: 'M47 44 Q57 37 66 42 M75 41 Q83 36 91 41', proud: 'M47 42 Q57 35 66 40 M75 39 Q83 34 91 39',
      flex: 'M48 42 L66 47 M75 47 L91 41', splash: 'M47 41 Q57 34 66 40 M75 39 Q83 33 91 39', thirsty: 'M49 47 L65 43 M76 43 L90 47',
      sugar: 'M47 40 Q57 32 66 39 M75 38 Q83 31 91 38', coma: 'M48 48 Q57 46 66 48 M76 47 Q83 45 90 47', sad: 'M49 46 L65 41 M76 41 L90 46', sleepy: 'M48 48 Q57 46 66 48 M76 47 Q83 45 90 47'
    };
    var mouth = {
      love: ['M58 90 Q72 104 88 89 Q72 96 58 90 Z', 'M62 91 Q72 95 84 90'], shock: ['M66 95 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', ''], dance: ['M56 89 Q72 108 90 88 Q72 94 56 89 Z', 'M60 90 Q72 94 86 89'], chef: ['M58 90 Q72 104 88 89 Q72 96 58 90 Z', 'M62 91 Q72 95 84 90'], hungry: ['M60 93 Q66 88 72 93 Q78 98 84 92', ''],
      neutral: ['M62 92 Q72 95 84 91', ''], happy: ['M58 90 Q72 104 88 89 Q72 96 58 90 Z', 'M62 91 Q72 95 84 90'], proud: ['M56 89 Q72 108 90 88 Q72 94 56 89 Z', 'M60 90 Q72 94 86 89'],
      flex: ['M60 90 L86 90 L85 97 Q72 100 61 97 Z', 'M60 90 L86 90 L85 93 L61 93 Z'], splash: ['M60 90 Q72 104 86 90 Z', ''], thirsty: ['M62 90 Q72 98 84 90 Z', ''],
      sugar: ['M58 92 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4', ''], coma: ['M66 92 a5 6 0 1 0 10 0 a5 6 0 1 0 -10 0 Z', ''], sad: ['M60 98 Q72 86 86 97', ''], sleepy: ['M64 93 Q72 95 80 92', '']
    }[mood];
    var filled = /Z$/.test(mouth[0]);
    var talk = animate && (mood === 'happy' || mood === 'proud' || mood === 'splash' || mood === 'neutral' || mood === 'love' || mood === 'dance' || mood === 'chef');
    var mouthB = { love: 'M60 89 Q72 102 86 89 Z', dance: 'M58 89 Q72 104 88 89 Z', chef: 'M60 89 Q72 102 86 89 Z', neutral: 'M64 90 Q73 98 82 90 Z', happy: 'M60 89 Q72 102 86 89 Z', proud: 'M58 89 Q72 104 88 89 Z', splash: 'M62 89 Q72 98 84 89 Z' }[mood] || 'M0 0';
    var tacheD = 'M58 86 Q62 78 72 82 Q80 77 88 84 Q90 90 84 88 Q78 85 72 87 Q64 85 60 90 Q55 90 58 86 Z';
    // hand-held props
    var hx = aF.hx, hy = aF.hy;
    var BODYANIM = { love: 'k-a-bob', shock: 'k-a-shake', dance: 'k-a-hop', chef: 'k-a-nod', hungry: 'k-a-droop', neutral: 'k-a-nod', happy: 'k-a-bob', proud: 'k-a-hop', flex: 'k-a-nod', splash: 'k-a-hop', thirsty: 'k-a-droop', sugar: 'k-a-shake', coma: 'k-a-sway', sad: 'k-a-droop', sleepy: 'k-a-sway' };
    var L = { love: 'In love', shock: 'Shocked', dance: 'Dancing', chef: 'Chef', hungry: 'Hungry', neutral: 'Calm', happy: 'Happy', proud: 'Proud', flex: 'Veggie power', splash: 'Refreshed', thirsty: 'Thirsty', sugar: 'Sugar rush', coma: 'Food coma', sad: 'Glum', sleepy: 'Sleepy' };
    return {
      w: Math.round(size * 140 / 190), h: size, label: (sex === 'm' ? 'Man' : 'Woman') + ', ' + L[mood], stillCls: animate ? '' : 'k-still',
      boil: animate ? 1.6 : 1.2,
      scaleT: 'translate(70 184) scale(' + f(hs) + ') translate(-70 -184)', shadowRx: f(26 + 18 * w),
      bodyAnim: animate ? BODYANIM[mood] : '', headAnim: '', bellyAnim: animate && mood === 'coma' ? 'k-belly' : '',
      bodyD: bodyD, beltD: beltD, buttonsD: buttonsD, bellyLineD: bellyLineD, shirtCol: shirt, pantsCol: '#3A3F4A',
      legsD: legsD, shoeL: shoeL, shoeR: shoeR,
      armW: f(9 + 4 * w), armWin: f(9 + 4 * w - 4.6), shY: f(shY), shBx: f(shBx), shFx: f(shFx),
      armBackD: aB.d, armFrontD: aF.d, handBx: f(aB.hx), handBy: f(aB.hy), handFx: f(aF.hx), handFy: f(aF.hy),
      armBackAnim: '', armFrontAnim: animate ? (mood === 'happy' || mood === 'chef' || mood === 'dance' ? 'k-wave' : mood === 'flex' ? 'k-pump' : '') : '',
      vegOp: mood === 'flex' ? 1 : 0, vegX: f(hx + 1), vegY: f(hy - 9), vegX2: f(hx + 7), vegY2: f(hy - 13), vegStem: 'M' + f(hx + 2) + ' ' + f(hy - 4) + ' l2 -6 l3 1 z',
      cupOp: mood === 'splash' ? 1 : 0, cupD: 'M' + f(hx - 5) + ' ' + f(hy - 18) + ' h12 l-2 16 h-8 z',
      sweetOp: mood === 'sugar' ? 1 : 0, sweetX: f(hx - 4), sweetY: f(hy - 20), sweetFoil: 'M' + f(hx - 5) + ' ' + f(hy - 10) + ' h14 v6 h-14 z',
      headD: headD, jowlD: jowlD, hairCol: hairCol, hairTopD: hairTopD, hairBackD: hairBackD, hairStrands: hairStrands, hairStroke: '#1A1A1A',
      blushOp: (mood === 'happy' || mood === 'proud' || mood === 'splash' || mood === 'coma' || mood === 'flex' || mood === 'love' || mood === 'dance' || mood === 'chef') ? 0.6 : 0.2,
      eyeRx: eyeBig ? 10 : 8.5, eyeRy: eyeBig ? 11 : 9.5, eyeRx2: eyeBig ? 8 : 7, eyeRy2: eyeBig ? 9.5 : 8.5,
      pupLx: f(58 + look[0]), pupRx: f(83 + look[0]), pupY: f(59 + look[1]), pupY2: f(58 + look[1]), pupR: mood === 'sugar' || mood === 'shock' ? 1.6 : eyeBig ? 3.6 : 3.2,
      eyeAnim: animate && !closed && mood !== 'sugar' ? 'k-blink' : '',
      lidsD: lidsD, lidsOp: lidsD ? 1 : 0,
      spiralD: 'M58 59 m-1 0 a1.2 1.2 0 1 1 2 1 a3 3 0 1 1 -4.4 -3 a5 5 0 1 1 6.6 5.6 M83 58 m-1 0 a1.2 1.2 0 1 1 2 1 a3 3 0 1 1 -4.4 -3 a4.4 4.4 0 1 1 5.8 5', spiralOp: mood === 'sugar' ? 1 : 0,
      bagsD: 'M50 70 Q58 74 66 70 M76 69 Q82 72 88 69', bagsOp: (mood === 'coma' || mood === 'sleepy' || mood === 'thirsty' || age >= 55) ? 0.8 : 0,
      browsD: B[mood], browCol: sex === 'm' ? '#1A1A1A' : hairCol === '#D7D7D2' ? '#9A9A94' : '#1A1A1A', browAnim: animate && (mood === 'sugar' || mood === 'proud' || mood === 'splash') ? 'k-browjump' : '',
      tacheD: tacheD, tacheOp: tache ? 1 : 0,
      mouthA: mouth[0], mouthFill: filled ? '#7A1F1F' : 'none', teethA: mood === 'flex' ? 'M62 91 H84 V94 H62 Z M68 91 V94 M74 91 V94 M80 91 V94' : '',
      talkA: talk ? 'k-talkA' : '', talkB: talk ? 'k-talkB' : '', mouthB: mouthB, mouthBOp: talk ? 1 : 0,
      tongueD: 'M68 95 Q72 106 78 96 Z', tongueOp: mood === 'thirsty' || mood === 'hungry' ? 1 : 0, tearOp: mood === 'sad' ? 1 : 0,
      starsOp: mood === 'proud' || mood === 'chef' ? 1 : 0, zzzOp: (mood === 'coma' || mood === 'sleepy') ? 1 : 0, dropsOp: mood === 'splash' ? 1 : 0,
      sweatOp: (mood === 'thirsty' || mood === 'sugar') ? 1 : 0, linesOp: mood === 'sugar' || mood === 'shock' ? 1 : 0, boingOp: mood === 'flex' ? 1 : 0,
      heartOp: mood === 'happy' ? 1 : 0, cloudOp: mood === 'sad' ? 1 : 0,
      heartEyesOp: mood === 'love' ? 1 : 0, heartEyesAnim: animate && mood === 'love' ? 'k-pump' : '', heartsOp: mood === 'love' ? 1 : 0, exclOp: mood === 'shock' ? 1 : 0, notesOp: mood === 'dance' ? 1 : 0, hatOp: mood === 'chef' ? 1 : 0, growlOp: mood === 'hungry' ? 1 : 0,
      appleOp: mood === 'love' ? 1 : 0, appleD: 'M' + f(hx + 1) + ' ' + f(hy - 14) + ' c-3 -3 -9 -2 -9 4 c0 5 4 9 9 8 c5 1 9 -3 9 -8 c0 -6 -6 -7 -9 -4 z', appleLeaf: 'M' + f(hx + 2) + ' ' + f(hy - 15) + ' q5 -5 9 -1 q-5 4 -9 1 z'
    };
}

let seq = 0;
export function buddySvg(props) {
  const v = vals(props), n = ++seq;
  return TPL.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => v[k] == null ? '' : v[k]).replace(/kboil/g, 'kboil' + n);
}

/* ---------------- mood engine ---------------- */
export const MOOD_NAMES = { neutral: 'calm', happy: 'happy', proud: 'proud', flex: 'strong', splash: 'refreshed', thirsty: 'thirsty', sugar: 'hyper on sugar', coma: 'stuffed', sad: 'glum', sleepy: 'sleepy', love: 'in love', shock: 'shocked', dance: 'like dancing', chef: 'like a chef', hungry: 'hungry' };
export const LINES = {
  happy: ['Sahtein! Eating like a village grandma.', 'Ten out of ten. Teta would be proud.', 'Look at all that colour on the plate!', 'My cholesterol just sent a thank-you card.', 'This is going on the family WhatsApp.', 'I feel like a tabbouleh: fresh and full of parsley.'],
  flex: ['Broccoli? Feel this arm. FEEL IT.', 'Foul for breakfast. I am made of iron now.', 'Fibre! My insides are throwing a party.', 'Lentils: tiny, brown, and absolutely ripped.', 'One more spinach and I can lift the car.', 'Popeye who? Never heard of him.'],
  proud: ['Another day done. Frame me, put me on the wall.', 'Streak! Tell the whole family WhatsApp group.', 'Logged and locked. Bravo alaik.', 'Someone call my mother. Actually, I will.', 'I would like to thank the academy. And hummus.', 'Day: completed. Ego: slightly inflated.'],
  splash: ['Ahh. Like a cold jug from the fridge in August.', 'Hydration station, yalla!', 'Glug glug. I am 60% water and 40% opinions.', 'My kidneys just did a little dance.', 'Refreshing. Like jumping into the sea at Byblos.', 'Water: the original diet drink.'],
  thirsty: ['Is this the desert? Water, habibi.', 'My tongue is a dried apricot.', 'A cup of water would be lovely. Just saying.', 'I am basically a raisin with a moustache.', 'Even my moustache is thirsty.', 'Water. Now. Please. Thank you.'],
  sugar: ['WHO PUT BAKLAVA IN MY BLOOD?', 'I CAN HEAR COLOURS.', 'Sugar! I could run to Beirut and back.', 'My teeth are writing a strongly worded letter.', 'I AM VIBRATING AT A HIGHER FREQUENCY.', 'One more maamoul and I achieve flight.'],
  coma: ['Just resting my eyes. And my belly. Wallah.', 'I live on this sofa now. Bring the argileh.', 'Unbutton… everything…', 'Wake me up when it’s time to eat again. Joking. Mostly.', 'I have become one with the cushion.', 'Was it the third helping? It was the third helping.'],
  sad: ['Is a crisp a vegetable? Asking for me.', 'So much salt I could cure a fish.', 'Some green would cheer me up. Even parsley.', 'My arteries filed a complaint.', 'Fried again? My heart is making a sad trumpet noise.', 'A cucumber would fix me. Probably.'],
  sleepy: ['Wake me when there’s man’oushe.', 'Five more minutes, mama…', 'Zzz… is it breakfast yet?', 'I was not asleep. I was resting with intent.', 'Dreaming of a cheese man’oushe. Don’t wake me.', 'Brain loading… please wait…'],
  neutral: ['Yalla, what are we eating?', 'Ready when you are, chef.', 'Hungry? Me too. Log it first.', 'I’m just standing here. Looking handsome.', 'Tell me something tasty.', 'Tap me. I dare you.'],
  love: ['An apple a day keeps the doctor in Beirut.', 'Fruit! My heart goes boom boom.', 'Nature’s sweets. No wrapper, no guilt.', 'I would marry this banana.', 'Juicy, sweet, healthy. Like me.', 'Fruit salad in my soul.'],
  shock: ['HOW MANY CALORIES?!', 'Habibi… was that one portion or the whole tray?', 'My belt just gasped.', 'Mama? Is that you? Did you cook this?', 'That’s not a portion, that’s a weekend.', 'Wallah I need to sit down.'],
  dance: ['Water goal! Dabke time!', 'Look at me go! Fully hydrated!', 'Eight cups! I am basically a river.', 'Shake it like a bottle of ayran!', 'Hands up if you’re hydrated!', 'Party in my kidneys and everyone’s invited.'],
  chef: ['Recipe saved. Somebody give me a cooking show.', 'Homemade! Mama would approve. Maybe.', 'Chef’s kiss. Mwah.', 'Gordon Ramsay could never.', 'From the pot to the app. Beautiful.', 'Cooked with love and a lot of garlic.'],
  hungry: ['Is it lunch? It feels like lunch.', 'My stomach is speaking Arabic and it’s angry.', 'Grrr. That was my belly, not me.', 'You haven’t fed me in ages! Log something!', 'I could eat a whole sheep. A small one.', 'Starving. Okay, slightly peckish. But still.']
};
export const POKE = ['Oi! Personal space!', 'Stop poking, I’m digesting.', 'That tickles, habibi!', 'One more poke and I’m calling my mother.', 'Do I look like a button to you?', 'Hey! I bruise like a peach.'];

// How healthy is a list of entries? 0 (rough) to 100 (great), judged per 1000 kcal so it is fair early in the day.
export function healthScore(entries) {
  const t = S.totals(entries);
  if (!entries.length || t.kcal < 50) return null;
  const per = 1000 / t.kcal;
  let s = 50;
  s += Math.max(-10, Math.min(18, (t.fib * per - 10) * 2.2));          // fibre: ~14 g per 1000 kcal is great
  s += Math.max(-8, Math.min(12, ((t.p * 4) / t.kcal * 100 - 15) * 1.2)); // protein share of calories
  const fv = entries.filter(e => { const c = F.catOf(e.food); return c === 'fruit' || c === 'veg'; }).length;
  s += Math.min(16, fv * 6);                                             // fruit & veg portions
  s -= Math.max(0, Math.min(20, (t.sug * per - 45) * 0.6));             // sugar
  s -= Math.max(0, Math.min(14, (t.sat * per - 12) * 1.4));             // saturated fat
  s -= Math.max(0, Math.min(12, (t.salt * per - 3) * 5));               // salt
  return Math.round(Math.max(0, Math.min(100, s)));
}

// What did the food(s) just logged feel like? kcal = calories just added.
export function reactTo(foods, kcal) {
  let fruit = 0, veg = 0, sweet = 0, salty = 0, recipe = 0;
  foods.filter(Boolean).forEach(f => {
    const c = F.catOf(f), p = f.per || {};
    if (c === 'recipe' || f.recipe || f.recipeId) recipe++;
    if (c === 'fruit') fruit++;
    else if (c === 'veg' || (p.fib || 0) >= 6) veg++;
    if (c === 'sweet' || (p.sug || 0) >= 22) sweet++;
    if (c === 'snack' || c === 'pizza' || (p.salt || 0) >= 1.5 || (p.sat || 0) >= 10) salty++;
  });
  if (kcal >= 750) return 'shock';
  if (recipe) return 'chef';
  if (sweet > veg + fruit && sweet >= salty) return 'sugar';
  if (fruit && fruit >= veg && fruit >= salty) return 'love';
  if (veg && veg >= salty) return 'flex';
  if (salty) return 'sad';
  return 'happy';
}

// Pick the mood for a day. ev = a recent event reaction ({ mood, t }).
export function moodFor(day, plan, opts) {
  const o = opts || {}, now = new Date(), hr = now.getHours();
  if (o.ev && Date.now() - o.ev.t < 9000) return o.ev.mood;
  const t = S.totals(day.entries), goal = o.waterGoal || 8;
  if (!day.entries.length) return o.isToday && (hr < 9 || hr >= 22) ? 'sleepy' : day.done ? 'proud' : o.isToday && hr >= 13 ? 'hungry' : 'neutral';
  if (t.kcal > plan.kcal * 1.08) return 'coma';
  const per = 1000 / Math.max(1, t.kcal);
  if (t.sug * per > 75 && t.sug > 40) return 'sugar';
  if (o.isToday && hr >= 14 && day.water < goal / 2) return 'thirsty';
  if (o.isToday && hr >= 15 && hr < 22 && t.kcal < plan.kcal * 0.3 && !day.done) return 'hungry';
  const sc = healthScore(day.entries);
  if (sc != null && sc < 38) return 'sad';
  if (sc != null && sc >= 62) return 'happy';
  if (day.done) return 'proud';
  return 'neutral';
}

export function lineFor(mood, seed) {
  const l = LINES[mood] || LINES.neutral;
  return l[Math.abs(seed | 0) % l.length];
}
