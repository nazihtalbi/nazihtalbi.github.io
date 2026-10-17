const fs = require('fs'), path = require('path');
module.exports = async (ev) => {
  const src = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'ref.png')).toString('base64');
  const out = await ev(`
    const img = new Image(); img.src = ${JSON.stringify(src)}; await img.decode();
    const W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const id = g.getImageData(0, 0, W, H), d = id.data;
    const bg = new Uint8Array(W * H), q = new Int32Array(W * H); let qh = 0, qt = 0;
    const lum = i => (d[i*4] + d[i*4+1] + d[i*4+2]) / 3, sat = i => Math.max(d[i*4], d[i*4+1], d[i*4+2]) - Math.min(d[i*4], d[i*4+1], d[i*4+2]);
    const ok = i => lum(i) > 150 && sat(i) < 24;
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const i = y * W + x; if (ok(i)) { bg[i] = 1; q[qt++] = i; } }
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const i = y * W + x; if (!bg[i] && ok(i)) { bg[i] = 1; q[qt++] = i; } }
    for (const x of [15, 150, 272, 390, 500, 618, 740]) for (let y = 30; y < 322; y += 3) { const i = y * W + x; if (!bg[i] && ok(i)) { bg[i] = 1; q[qt++] = i; } }
    const T = ${process.env.T || 6};
    while (qh < qt) { const p = q[qh++], x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx; if (bg[n] || !ok(n)) continue;
        if (Math.max(Math.abs(d[n*4]-d[p*4]), Math.abs(d[n*4+1]-d[p*4+1]), Math.abs(d[n*4+2]-d[p*4+2])) > T) continue;
        bg[n] = 1; q[qt++] = n; } }
    // thin horizontal guide lines and text: grey fg runs at most 3 px tall
    for (let x = 0; x < W; x++) { let y = 0; while (y < H) { if (bg[y*W+x]) { y++; continue; } let e = y; while (e < H && !bg[e*W+x]) e++;
      if (e - y <= 3) { let grey = true; for (let k = y; k < e; k++) if (sat(k*W+x) > 20 || lum(k*W+x) < 120) grey = false; if (grey) for (let k = y; k < e; k++) bg[k*W+x] = 1; } y = e; } }

    for (let y = 0; y <= 27; y++) for (let x = 0; x < 750; x++) bg[y*W+x] = 1;
    // grey pockets between the legs (enclosed, so the flood never reached them)
    const legs = (x, y) => (y > 170 && y < 330 && x < 750) || y > 515; const strict = (x, y) => !((y > 225 && y < 330) || y > 585);
    const seen = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { const x0 = i % W, y0 = (i / W) | 0; if (bg[i] || seen[i] || !legs(x0, y0)) continue;
      // local background: the nearest flooded pixel to the left on this row
      let k = i; while (k % W && !bg[k]) k--; if (!bg[k]) continue;
      const near = j => ok(j) && Math.max(Math.abs(d[j*4]-d[k*4]), Math.abs(d[j*4+1]-d[k*4+1]), Math.abs(d[j*4+2]-d[k*4+2])) < (strict(j % W, (j / W) | 0) ? 5 : 12);
      if (!near(i)) continue;
      const blob = []; let h = 0; blob.push(i); seen[i] = 1;
      while (h < blob.length) { const p = blob[h++], x = p % W, y = (p / W) | 0;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const m = (y+dy)*W + x+dx; if (seen[m] || bg[m] || !legs(x+dx, y+dy) || !near(m)) continue; seen[m] = 1; blob.push(m); } }
      if (blob.length > 25) blob.forEach(p => bg[p] = 1); }
    // components
    const lab = new Int32Array(W * H), comps = []; let L = 0;
    for (let i = 0; i < W * H; i++) { if (bg[i] || lab[i]) continue; L++; let h = 0, t = 0; q[t++] = i; lab[i] = L; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
      while (h < t) { const p = q[h++], x = p % W, y = (p / W) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const m = ny * W + nx; if (!bg[m] && !lab[m]) { lab[m] = L; q[t++] = m; } } }
      if (n > 800) comps.push({ L, n, x0, y0, x1, y1 }); }

    // sprite: one cell per pose, feet on the bottom line, head centred; soft 1px edge with the grey unmixed
    const BG = [d[(5*W+5)*4], d[(5*W+5)*4+1], d[(5*W+5)*4+2]];
    const POSES = { front: [86,175], q3: [211,175], left: [326,175], right: [447,175], back: [558,175], q3back: [682,175], wave: [95,515], crossed: [256,515], walk: [583,515], wow: [748,515], joy: [910,515] };
    const CW = 200, CHh = 312, names = Object.keys(POSES), sp = document.createElement('canvas'); sp.width = CW * names.length; sp.height = CHh;
    const sg = sp.getContext('2d'), od = sg.createImageData(sp.width, CHh), o = od.data;
    names.forEach((nm, k) => { const [px, py] = POSES[nm], cp = comps.filter(c => c.x0 <= px && px <= c.x1 && c.y0 <= py && py <= c.y1).sort((a, b) => b.n - a.n)[0];
      // head centre: mean x of the top 18% rows
      let sx = 0, sn = 0; for (let y = cp.y0; y < cp.y0 + (cp.y1 - cp.y0) * .18; y++) for (let x = cp.x0; x <= cp.x1; x++) if (lab[y*W+x] === cp.L) { sx += x; sn++; }
      const hx = Math.round(sx / sn), ox = k * CW + CW / 2 - hx, oy = CHh - 3 - cp.y1;
      for (let y = cp.y0; y <= cp.y1; y++) for (let x = cp.x0; x <= cp.x1; x++) { const i = y*W+x; if (lab[i] !== cp.L) continue;
        const X = x + ox, Y = y + oy; if (X < k*CW || X >= (k+1)*CW || Y < 0) continue;
        let edge = false; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const m = (y+dy)*W + x+dx; if (lab[m] !== cp.L) edge = true; }
        let a = 1; if (edge) { const dist = Math.max(Math.abs(d[i*4]-BG[0]), Math.abs(d[i*4+1]-BG[1]), Math.abs(d[i*4+2]-BG[2])); if (dist < 45) continue; a = Math.min(1, dist / 110); }
        const j = (Y * sp.width + X) * 4;
        for (let ch = 0; ch < 3; ch++) o[j+ch] = Math.max(0, Math.min(255, Math.round((d[i*4+ch] - BG[ch] * (1 - a)) / a)));
        o[j+3] = Math.round(a * 255); } });
    sg.putImageData(od, 0, 0);
    const sprite = sp.toDataURL('image/webp', .92), spritePng = sp.toDataURL('image/png');
    // debug: fg on magenta
    for (let i = 0; i < W * H; i++) if (bg[i]) { d[i*4] = 255; d[i*4+1] = 0; d[i*4+2] = 255; }
    g.putImageData(id, 0, 0);
    return { comps, dbg: c.toDataURL('image/png'), sprite, spritePng };
  `);
  fs.writeFileSync(path.join(__dirname, 'dbg.png'), Buffer.from(out.dbg.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(__dirname, 'mini-sprite.webp'), Buffer.from(out.sprite.split(',')[1], 'base64')); fs.writeFileSync(path.join(__dirname, 'mini-sprite.png'), Buffer.from(out.spritePng.split(',')[1], 'base64')); return out.comps.length;
};
