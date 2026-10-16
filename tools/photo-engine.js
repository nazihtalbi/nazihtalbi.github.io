// Photo engine: analyses one photograph and produces a graded, sharpened, signed web version.
// Used by update-photos.js; also usable on its own:
//   node tools/photo-engine.js analyse <photo>
//   node tools/photo-engine.js render  <photo> <out.jpg|png> [--style house|food] [--finished] [--no-brand] [--width 3000] [--k 1.2] [--ev 0.2]
//
// Nothing here ever writes to the source photo. Every decision is measured from the photo itself:
//   exposure  - anchored on skin tones when people are in frame, otherwise on the mid-tones; highlights are protected
//   levels    - only lifts milky blacks / stretches dull whites when they are actually milky or dull
//   colour    - white balance from neutral surfaces (walls, paper, shirts), corrected halfway so the mood survives
//   contrast  - gentle S-curve, softer for already-punchy photos; vibrance that favours muted colours and spares skin
//   detail    - sharpness is measured; soft photos get noise reduction + multi-scale deblur, sharp ones a light finish
//   signature - bottom corner with the least detail, light or dark ink depending on what is behind it
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { spawnSync } = require('child_process');
const VERSION = 'e7';
const BRAND = path.join(__dirname, 'brand', 'signature.png');

const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const gam = v => { v = Math.max(0, Math.min(1, v)); return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ff = (args, opts = {}) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 1 << 30, ...opts }); if (r.status) throw new Error('ffmpeg: ' + (r.stderr || '').toString().slice(0, 600)); return r; };
const raw = (file, vf, fmt = 'rgb24') => ff(['-i', file, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', fmt, '-']).stdout;
const probe = f => { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], { encoding: 'utf8' }); const [w, h] = (r.stdout || '').trim().split(',').map(Number); return { w, h }; };
const hue = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (d < 1e-6) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; return h < 0 ? h + 360 : h; };

// ---------- analysis ----------
function analyse(file) {
  const { w, h } = probe(file), TW = 480, TH = Math.round(TW * h / w / 2) * 2;
  const b = raw(file, `scale=${TW}:${TH}:flags=area`), N = TW * TH;
  const L = new Float32Array(N), skinL = []; let sat = 0, gray = 0, clip = 0, nr = 0, ng = 0, nb = 0, nn = 0;
  for (let i = 0, k = 0; k < N; i += 3, k++) {
    const R = b[i] / 255, G = b[i + 1] / 255, B = b[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), s = mx > 0 ? (mx - mn) / mx : 0;
    const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B; L[k] = Y; sat += s; if (s < 0.06) gray++; if (mx > 0.985) clip++;
    if (mx > 0.35 && mx < 0.97 && s < 0.12) { nr += lin(R); ng += lin(G); nb += lin(B); nn++; }
    const hh = hue(R, G, B); if (hh > 8 && hh < 48 && s > 0.16 && s < 0.62 && Y > 0.16 && Y < 0.92 && R > G && G > B) skinL.push(Y);
  }
  const sorted = Float32Array.from(L).sort(), q = p => sorted[Math.min(N - 1, Math.floor(N * p))];
  skinL.sort((a, c) => a - c);
  // sharpness: Laplacian energy per tile on a 1500 px version; the focus peak is the best tile
  const SW = 1500, SH = Math.round(SW * h / w), g = raw(file, `scale=${SW}:${SH}:flags=area`, 'gray'), T = 10, tw = Math.floor(SW / T), th = Math.floor(SH / T), tiles = [];
  for (let ty = 0; ty < T; ty++) for (let tx = 0; tx < T; tx++) { let s = 0, n = 0; for (let y = ty * th + 1; y < (ty + 1) * th - 1; y += 2) for (let x = tx * tw + 1; x < (tx + 1) * tw - 1; x += 2) { const i = y * SW + x, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - SW] - g[i + SW]; s += l * l; n++; } tiles.push(Math.sqrt(s / n)); }
  tiles.sort((a, c) => c - a);
  // noise: median absolute high-pass in the flattest tiles
  return {
    w, h, med: q(0.5), p35: q(0.35), subjMed: (() => { const a = sorted.filter(v => v > 0.1); return a.length ? a[a.length >> 1] : q(0.5); })(), p005: q(0.005), p03: q(0.03), p97: q(0.97), p995: q(0.995), meanSat: sat / N, grayFrac: gray / N, clipFrac: clip / N,
    skinFrac: skinL.length / N, skinP60: skinL.length ? skinL[Math.floor(skinL.length * 0.6)] : null,
    neutral: nn > N * 0.02 ? [ng / nr, ng / nb] : null, sharpPeak: tiles[0], sharp90: tiles[9],
    dhash: dhash(file),
  };
}
function dhash(file) { const b = raw(file, 'scale=9:8:flags=area', 'gray'); let s = ''; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) s += b[y * 9 + x] > b[y * 9 + x + 1] ? '1' : '0'; return BigInt('0b' + s).toString(16).padStart(16, '0'); }
const hamming = (a, b) => { let x = BigInt('0x' + a) ^ BigInt('0x' + b), n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };

// ---------- decisions ----------
function decide(st, style, over = {}) {
  const mono = st.meanSat < 0.06 && st.grayFrac > 0.75, food = style === 'food', P = { style, mono };
  P.black = st.p005 > 0.035 ? clamp(st.p005 - 0.015, 0, 0.07) : 0;
  P.white = st.p995 < 0.94 ? clamp(st.p995 + 0.02, 0.82, 1) : 1;
  const norm = v => (v - P.black) / (P.white - P.black);
  let ev;
  if (st.skinFrac > 0.015 && st.skinP60 && !food) ev = 0.8 * Math.log2(lin(0.62) / lin(norm(st.skinP60)));     // people: put faces at a natural brightness
  else if (st.p35 < 0.08) ev = clamp(0.6 * Math.log2(lin(0.42) / lin(clamp(norm(st.subjMed), 0.02, 0.98))), -0.3, 0.3);   // low-key: expose the subject, keep the dark background
  else ev = 0.6 * Math.log2(lin(food ? 0.55 : 0.5) / lin(clamp(norm(st.med), 0.02, 0.98)));
  ev = clamp(ev, -0.4, st.p35 < 0.08 ? 0.3 : 0.7);                                                                 // never lift a deliberately dark scene much
  const cap = Math.log2(lin(0.975) / lin(clamp(norm(st.p97), 0.05, 0.999))) + 0.25;                                // keep the brightest 3 % from blowing out
  if (ev > cap) ev = Math.max(0, cap);
  P.ev = +(over.ev !== undefined ? over.ev : ev).toFixed(3);
  P.shoulder = st.clipFrac > 0.04 || st.p97 > 0.96 ? 0.8 : 0.88;
  P.wb = !mono && st.neutral ? [clamp(Math.pow(st.neutral[0], 0.5), 0.94, 1.06), clamp(Math.pow(st.neutral[1], 0.5), 0.94, 1.06)] : [1, 1];
  P.contrast = food ? (st.meanSat > 0.42 ? 1.12 : 1.2) : (st.meanSat > 0.42 ? 1.04 : 1.1);
  P.vib = mono ? 0 : st.meanSat > 0.42 ? 0.04 : st.meanSat > 0.3 ? 0.12 : 0.2;
  P.split = food ? [[1.04, 1, 0.92], [0.95, 1, 1.04]] : [[1.02, 1, 0.97], [0.97, 1, 1.03]];                       // warm highlights, cool shadows (house look)
  // detail: 24+ is crisp for this camera at 1500 px; below that, deblur in proportion to how soft it is
  // portraits: no extra sharpening (skin should look smooth, not crunchy); everything else is sharpened by how soft it is
  const k = over.k !== undefined ? over.k : style.startsWith('portrait') ? 0 : clamp((24 - st.sharpPeak) / 15 * 1.1 + 0.3, 0.3, 1.4);
  P.k = +k.toFixed(2); P.denoise = k > 0.8 ? 'nlmeans' : 'light';
  P.vignette = food ? 'PI/5.5' : 'PI/6.5';
  return P;
}

function grade(P, R, G, B) {
  const e = Math.pow(2, P.ev);
  let c = [R, G, B].map(v => clamp((v - P.black) / (P.white - P.black), 0, 1));
  c = [gam(lin(c[0]) * e * P.wb[0]), gam(lin(c[1]) * e), gam(lin(c[2]) * e * P.wb[1])];
  const Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], piv = 0.45, ct = P.contrast;
  let x = Y <= piv ? piv * Math.pow(Y / piv, ct) : 1 - (1 - piv) * Math.pow((1 - Y) / (1 - piv), ct);
  if (x > P.shoulder) { const t = (x - P.shoulder) / (1 - P.shoulder); x = P.shoulder + (1 - P.shoulder) * (1 - Math.pow(1 - t, 1.6)) * 0.985; }
  c = c.map(v => v * (Y > 1e-5 ? x / Y : 1));
  if (!P.mono) { const hi = sstep(0.45, 0.95, x), lo = 1 - sstep(0.05, 0.45, x); c = c.map((v, i) => v * (1 + (P.split[0][i] - 1) * hi + (P.split[1][i] - 1) * lo)); }
  const mx = Math.max(...c), mn = Math.min(...c), s = mx > 0 ? (mx - mn) / mx : 0, hh = hue(...c);
  const skin = hh > 8 && hh < 48 && s > 0.12 && s < 0.6 ? 0.5 : 1, f = 1 + P.vib * (1 - s) * skin, Yv = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  c = c.map(v => Yv + (v - Yv) * f);
  const m = Math.max(...c); if (m > 1) c = c.map(v => Yv + (v - Yv) * clamp((1 - Yv) / Math.max(1e-6, m - Yv), 0, 1));   // desaturate instead of clipping
  return c.map(v => clamp(v, 0, 1));
}
function writeCube(P, file) {
  const n = 41, out = ['LUT_3D_SIZE ' + n];
  for (let b = 0; b < n; b++) for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) out.push(grade(P, r / (n - 1), g / (n - 1), b / (n - 1)).map(v => v.toFixed(5)).join(' '));
  fs.writeFileSync(file, out.join('\n') + '\n');
}

// ---------- signature placement ----------
function markPlan(file, W, H) {
  const bd = probe(BRAND), mw = Math.round(W * 0.135), mh = Math.round(mw * bd.h / bd.w), m = Math.round(W * 0.026), b = raw(file, `scale=${W}:${H}`, 'rgb24');
  const region = (x0) => { let s = 0, e = 0, n = 0, skin = 0; const y0 = H - m - mh - 4, x1 = x0 + mw;
    for (let y = y0; y < H - m + 4; y += 2) for (let x = x0; x < x1; x += 2) { const i = (y * W + x) * 3, R = b[i] / 255, G = b[i + 1] / 255, B = b[i + 2] / 255, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B; s += Y; n++;
      const j = i + 6; e += Math.abs(b[i + 1] - b[j + 1]); const hh = hue(R, G, B), mx = Math.max(R, G, B), sa = mx ? (mx - Math.min(R, G, B)) / mx : 0; if (hh > 8 && hh < 48 && sa > 0.16 && sa < 0.62 && R > G && G > B) skin++; }
    return { lum: s / n, busy: e / n + 60 * skin / n }; };
  const right = region(W - m - mw), left = region(m), useLeft = right.busy > left.busy * 1.6 && right.busy > 9;
  const zone = useLeft ? left : right;
  return { x: useLeft ? m : W - m - mw, y: H - m - mh, w: mw, dark: zone.lum > 0.7 };
}

// ---------- render ----------
function render(src, out, opts = {}) {
  const st = opts.stats || analyse(src), style = opts.style || 'house', finished = !!opts.finished;
  const WW = Math.min(st.w, opts.width || 3000), WH = Math.round(WW * st.h / st.w / 2) * 2;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pe-')), stage = path.join(tmp, 'stage.png');
  let P = null;
  try {
    // portraits get a gentle edge-preserving smoothing (evens skin texture, keeps eyes and outlines)
    const smooth = style.startsWith('portrait') ? `,format=gbrp,bilateral=sigmaS=${Math.max(2.5, 6.5 * WW / 3000).toFixed(1)}:sigmaR=0.075` : '';
    if (finished) ff(['-i', src, '-vf', `scale=${WW}:${WH}:flags=${style.startsWith('portrait') ? 'bicubic' : 'lanczos'}${smooth},format=rgb24`, stage]);
    else {
      P = decide(st, style, opts.override || {}); const cube = path.join(tmp, 'look.cube'); writeCube(P, cube);
      const k = P.k, a1 = (1.0 * k).toFixed(2), a2 = (0.6 * k).toFixed(2), a3 = (0.25 * k).toFixed(2), sc = WW / 3000;
      const dn = P.denoise === 'nlmeans' ? 'nlmeans=s=3:p=5:r=9' : 'hqdn3d=1.5:1.2:0:0';
      const fc = `[0:v]scale=${WW}:${WH}:flags=lanczos,format=gbrp,${dn}${smooth},split=4[a][b][c][d];` +
        `[b]gblur=sigma=${(1.4 * sc).toFixed(2)}[b1];[c]gblur=sigma=${(3.5 * sc).toFixed(2)}[c1];[d]gblur=sigma=${(9 * sc).toFixed(2)}[d1];` +
        `[a][b1]blend=all_expr='clip(A+${a1}*(A-B),0,255)'[ab];[ab][c1]blend=all_expr='clip(A+${a2}*(A-B),0,255)'[abc];[abc][d1]blend=all_expr='clip(A+${a3}*(A-B),0,255)',` +
        `lut3d='${cube.replace(/\\/g, '/').replace(/:/g, '\\:')}':interp=tetrahedral,format=rgb24,vignette=angle=${P.vignette}:eval=init[o]`;
      ff(['-i', src, '-filter_complex', fc, '-map', '[o]', stage]);
    }
    let final = stage;
    if (opts.brand !== false) {
      const pl = markPlan(stage, WW, WH), ink = pl.dark ? 'r=21:g=21:b=21:a=val*0.6' : 'r=237:g=233:b=225:a=val*0.86', sh = pl.dark ? 'r=255:g=255:b=255:a=val*0.25' : 'r=0:g=0:b=0:a=val*0.38';
      const sb = Math.max(1, WW / 1400).toFixed(2), branded = path.join(tmp, 'branded.png');
      ff(['-i', stage, '-i', BRAND, '-filter_complex', `[1:v]scale=${pl.w}:-1:flags=lanczos,format=rgba,split[m1][m2];[m1]lutrgb=${sh},gblur=sigma=${sb}:planes=15[s];[m2]lutrgb=${ink}[k];[0:v][s]overlay=${pl.x}:${pl.y + 1}[t];[t][k]overlay=${pl.x}:${pl.y},format=rgb24[o]`, '-map', '[o]', branded]);
      final = branded; if (P) P.mark = pl; else P = { mark: pl };
    }
    if (/\.webp$/i.test(out)) ff(['-i', final, '-c:v', 'libwebp', '-quality', String(opts.quality || 84), out]);
    else if (/\.jpe?g$/i.test(out)) ff(['-i', final, '-vf', 'scale=out_range=full,format=yuvj444p', '-qmin', '1', '-q:v', '2', out]);
    else fs.copyFileSync(final, out);
    return { stats: st, params: P, size: [WW, WH] };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
const fileHash = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
module.exports = { VERSION, analyse, decide, render, dhash, hamming, fileHash, probe };

if (require.main === module) {
  const [cmd, src, out, ...rest] = process.argv.slice(2), o = {};
  for (let i = 0; i < rest.length; i++) { const a = rest[i]; if (a === '--finished') o.finished = true; else if (a === '--no-brand') o.brand = false; else if (a === '--style') o.style = rest[++i]; else if (a === '--width') o.width = +rest[++i]; else if (a === '--k') (o.override = o.override || {}).k = +rest[++i]; else if (a === '--ev') (o.override = o.override || {}).ev = +rest[++i]; }
  if (cmd === 'analyse') console.log(JSON.stringify(analyse(src), null, 1));
  else if (cmd === 'render') { const r = render(src, out, o); console.log(JSON.stringify(r.params)); }
  else console.log('usage: node photo-engine.js analyse <photo> | render <photo> <out> [--style food] [--finished] [--no-brand]');
}
