// Cut Mini Nazih poses out of the green-screen renders (camera-green.jpg, crossed-green.jpg, sheet-green.jpg, saved as s4/s5/s6.png) and pack them into one sprite (one cell per pose).
// run in headless Chrome through cdp.js: the page does the keying with canvas.
const fs = require('fs'), path = require('path');
const SRC = {
  s4: { camera: [630, 500] },
  s5: { crossed: [690, 500] },
  s6: { q3: [320, 250], left: [500, 250], right: [650, 250], back: [785, 250], q3back: [920, 250], wave: [135, 600], walk: [665, 600], wow: [858, 600], joy: [1060, 600] },
};
const ORDER = ['camera', 'crossed', 'q3', 'left', 'right', 'back', 'q3back', 'wave', 'walk', 'wow', 'joy'];
// the height a standing figure gets in its cell, per source (measured on a standing pose of that source)
const STAND = { s4: 'camera', s5: 'crossed', s6: 'q3' };
module.exports = async (ev) => {
  const files = {}; for (const k of Object.keys(SRC)) files[k] = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, k + '.png')).toString('base64');
  const r = await ev(`
    const SRC = ${JSON.stringify(SRC)}, ORDER = ${JSON.stringify(ORDER)}, STAND = ${JSON.stringify(STAND)}, files = ${JSON.stringify(files)};
    const CW = 260, CH = 400, FIG = 352, cuts = {}, info = {};
    for (const k of Object.keys(SRC)) {
      const img = new Image(); img.src = files[k]; await img.decode();
      const W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0); const id = g.getImageData(0, 0, W, H), d = id.data;
      const A = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) { const R = d[i*4], G = d[i*4+1], B = d[i*4+2], gn = G - Math.max(R, B);
        A[i] = gn >= 60 ? 0 : gn <= 8 ? 1 : 1 - (gn - 8) / 52; }
      // guide lines and labels: rows (and columns) crossed by a long run of bright grey pixels; remove the thin parts
      const bright = i => { const R = d[i*4], G = d[i*4+1], B = d[i*4+2]; return Math.min(R, G, B) > 150 && Math.max(R, G, B) - Math.min(R, G, B) < 50; };
      for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x++) if (bright(y*W+x)) n++;
        if (n > W * .3) for (let x = 0; x < W; x++) for (let yy = Math.max(0, y - 2); yy <= Math.min(H - 1, y + 2); yy++) { const i = yy*W+x;
          if (bright(i) && ((yy > 4 && A[(yy-4)*W+x] === 0) || (yy < H - 5 && A[(yy+4)*W+x] === 0))) A[i] = 0; } }
      for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y++) if (bright(y*W+x)) n++;
        if (n > H * .3) for (let y = 0; y < H; y++) for (let xx = Math.max(0, x - 2); xx <= Math.min(W - 1, x + 2); xx++) { const i = y*W+xx;
          if (bright(i) && ((xx > 4 && A[y*W+xx-4] === 0) || (xx < W - 5 && A[y*W+xx+4] === 0))) A[i] = 0; } }
      // components of the solid part
      const lab = new Int32Array(W * H), q = new Int32Array(W * H), comps = []; let L = 0;
      for (let i = 0; i < W * H; i++) { if (A[i] < .5 || lab[i]) continue; L++; let h = 0, t = 0; q[t++] = i; lab[i] = L; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
        while (h < t) { const p = q[h++], x = p % W, y = (p / W) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const m = ny*W+nx; if (A[m] >= .5 && !lab[m]) { lab[m] = L; q[t++] = m; } } }
        if (n > 2000) comps.push({ L, n, x0, y0, x1, y1 }); }
      // soften the edge by one pixel (3x3 average of the alpha)
      const S = new Float32Array(W * H); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { let t = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) t += A[(y+dy)*W+x+dx]; S[y*W+x] = t / 9; }
      // un-spill: no pixel greener than its red/blue; colour unmixed from the green at soft edges
      const BGc = [d[(10*W+10)*4], d[(10*W+10)*4+1], d[(10*W+10)*4+2]];
      const pick = ([px, py]) => comps.filter(c => c.x0 <= px && px <= c.x1 && c.y0 <= py && py <= c.y1).sort((a, b) => b.n - a.n)[0];
      const scale = FIG / ((cp => cp.y1 - cp.y0)(pick(SRC[k][STAND[k]])));
      for (const [name, pt] of Object.entries(SRC[k])) {
        const cp = pick(pt), pad = 3, x0 = Math.max(0, cp.x0 - pad), y0 = Math.max(0, cp.y0 - pad), x1 = Math.min(W - 1, cp.x1 + pad), y1 = Math.min(H - 1, cp.y1 + pad);
        const cw = x1 - x0 + 1, chh = y1 - y0 + 1, cc = document.createElement('canvas'); cc.width = cw; cc.height = chh;
        const cg = cc.getContext('2d'), od = cg.createImageData(cw, chh), o = od.data;
        // keep only pixels near this component (soft edge allowed one step outside)
        const near = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && lab[yy*W+xx] === cp.L) return true; } return false; };
        let hx = 0, hn = 0;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y*W+x; if (!A[i] || !(lab[i] === cp.L || (A[i] < .5 && near(x, y)))) continue;
          const a = Math.min(A[i], S[i] * 1.15), j = ((y - y0) * cw + (x - x0)) * 4;
          let R = d[i*4], G = d[i*4+1], B = d[i*4+2];
          G = Math.min(G, Math.max(R, B) + 4); if (a < 1) { G = Math.min(G, B + .6 * Math.max(0, R - B), Math.max(R, B)); const m = .55 + .45 * a; R *= m; G *= m; B *= m; }
          o[j] = Math.max(0, Math.min(255, R)); o[j+1] = Math.max(0, Math.min(255, G)); o[j+2] = Math.max(0, Math.min(255, B)); o[j+3] = Math.round(a * 255);
          if (y < cp.y0 + (cp.y1 - cp.y0) * .18 && lab[i] === cp.L) { hx += x; hn++; } }
        cg.putImageData(od, 0, 0);
        cuts[name] = { cc, scale, headX: hx / hn - x0, feet: cp.y1 - y0 };
        info[name] = { src: k, box: [cp.x0, cp.y0, cp.x1, cp.y1], scale: +scale.toFixed(3) };
      }
    }
    const sp = document.createElement('canvas'); sp.width = CW * ORDER.length; sp.height = CH;
    const sg = sp.getContext('2d'); sg.imageSmoothingQuality = 'high';
    ORDER.forEach((name, k) => { const u = cuts[name], w = u.cc.width * u.scale, h = u.cc.height * u.scale;
      const dx = k * CW + CW / 2 - u.headX * u.scale, dy = CH - 6 - u.feet * u.scale;
      sg.save(); sg.beginPath(); sg.rect(k * CW, 0, CW, CH); sg.clip(); sg.drawImage(u.cc, dx, dy, w, h); sg.restore();
      info[name].cell = [Math.round(dx - k * CW), Math.round(dy), Math.round(w), Math.round(h)]; });
    return { info, webp: sp.toDataURL('image/webp', .9), png: sp.toDataURL('image/png') };
  `);
  fs.writeFileSync(path.join(__dirname, 'mini-sprite.webp'), Buffer.from(r.webp.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(__dirname, 'mini-sprite.png'), Buffer.from(r.png.split(',')[1], 'base64'));
  return r.info;
};
