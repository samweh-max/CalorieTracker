// Samslimmer — barcode scanning.
// Uses the phone's built-in BarcodeDetector where it exists (Chrome on Android),
// otherwise loads the open-source ZXing library (needed on iPhone).
const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

let zxingPromise = null;
function loadZxing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  if (!zxingPromise) {
    zxingPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = ZXING_URL; s.async = true;
      s.onload = () => window.ZXing ? res(window.ZXing) : rej(new Error('ZXing did not load'));
      s.onerror = () => { zxingPromise = null; rej(new Error('Could not download the barcode reader')); };
      document.head.appendChild(s);
    });
  }
  return zxingPromise;
}

async function makeDecoder() {
  if ('BarcodeDetector' in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const fm = FORMATS.filter(f => supported.indexOf(f) >= 0);
      if (fm.length) {
        const det = new window.BarcodeDetector({ formats: fm });
        return async video => { const r = await det.detect(video); return r.length ? r[0].rawValue : null; };
      }
    } catch (e) { /* fall through to ZXing */ }
  }
  const Z = await loadZxing();
  const hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const reader = new Z.MultiFormatReader(); reader.setHints(hints);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async video => {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return null;
    // Only read the middle band of the picture, where the guide box is.
    const cw = Math.round(w * 0.8), ch = Math.round(h * 0.4);
    canvas.width = cw; canvas.height = ch;
    ctx.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);
    try {
      const lum = new Z.HTMLCanvasElementLuminanceSource(canvas);
      const bmp = new Z.BinaryBitmap(new Z.HybridBinarizer(lum));
      return reader.decode(bmp).getText();
    } catch (e) { return null; } // nothing found in this frame
  };
}

// Valid EAN/UPC check digit, so a half-read barcode is never accepted.
export function validBarcode(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const d = code.split('').map(Number), check = d.pop();
  const sum = d.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// start({ video, onCode, onError }) -> stop()
export async function startScanner({ video, onCode, onStatus }) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocamera');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  video.srcObject = stream;
  video.setAttribute('playsinline', ''); video.muted = true;
  await video.play().catch(() => {});
  let stopped = false, decode = null, last = null, hits = 0;
  onStatus && onStatus('Loading the barcode reader…');
  try { decode = await makeDecoder(); }
  catch (e) { stream.getTracks().forEach(t => t.stop()); throw e; }
  onStatus && onStatus('Point at a barcode');
  const tick = async () => {
    if (stopped) return;
    let code = null;
    try { code = await decode(video); } catch (e) { code = null; }
    if (code && validBarcode(code)) {
      // Require the same number twice in a row to avoid misreads.
      hits = code === last ? hits + 1 : 1; last = code;
      if (hits >= 2 || ('BarcodeDetector' in window)) { stop(); onCode(code); return; }
    }
    setTimeout(tick, 120);
  };
  const stop = () => { stopped = true; stream.getTracks().forEach(t => t.stop()); video.srcObject = null; };
  tick();
  return stop;
}
