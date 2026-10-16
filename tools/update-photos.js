// Rebuilds the Photography section from the folder "Photography - put your photos here".
//   node tools/update-photos.js            build once ("Update photos.bat")
//   node tools/update-photos.js --watch    build, then keep watching the folder and rebuild when photos change ("Watch photos.bat")
//
// For every photo (each subfolder is a category, photos are shown in file-name order):
//   1. new or changed photos are detected by their content (renaming or moving a file never re-processes it)
//   2. each photo is analysed on its own and graded, exposed and sharpened to suit it (tools/photo-engine.js);
//      photos listed in tools/photo-finished.json are already hand-edited and only get the signature
//   3. the signature (tools/brand/signature.png) is placed in the quietest bottom corner
//   4. web versions (2400 px and 1400 px WebP) go to assets/media/photos/, the list to assets/js/photos-data.js
// Your photos are never modified. Exact and near-duplicates are skipped. A photo named "cover" opens the section.
// Subfolders starting with "_" (such as "_originals") are ignored. RAW files are used only when no JPG of the same name exists.
// Per-photo overrides (optional) in tools/photo-settings.json, e.g. { "4 Food & details/DSC01.jpg": { "grade": "off" }, "x.jpg": { "ev": 0.2, "k": 1 } }
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { spawnSync } = require('child_process');
const engine = require('./photo-engine.js');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Photography - put your photos here');
const OUT = path.join(ROOT, 'assets', 'media', 'photos');
const LIST = path.join(ROOT, 'assets', 'js', 'photos-data.js');
const CACHE_DIR = path.join(__dirname, '.photo-cache');             // processed results, keyed by photo content (not uploaded)
const FINISHED = path.join(__dirname, 'photo-finished.json');
const SETTINGS = path.join(__dirname, 'photo-settings.json');
const BRAND = path.join(__dirname, 'brand', 'signature.png');
const KNOWN = { classroom: /class/i, events: /event/i, corporate: /recep|corporate/i, food: /food|detail/i, outdoors: /outdoor|nature|travel/i };
const STYLE = { food: 'food', 'c-portraits': 'portrait-v2' };                                        // category -> grading style (everything else: house look)
const IMG = /\.(jpe?g|png|webp|tiff?)$/i, RAW = /\.(arw|nef|cr2|cr3|dng|raf|orf|rw2|srw|pef)$/i;
const NEAR_DUP = 5;                                                    // dHash bits; 0-5 = practically the same frame

const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const md5 = buf => crypto.createHash('md5').update(buf).digest('hex');
const sameBytes = (a, b) => fs.existsSync(b) && fs.statSync(a).size === fs.statSync(b).size && md5(fs.readFileSync(a)) === md5(fs.readFileSync(b));

// largest JPEG embedded in a TIFF-based RAW (Sony ARW, Nikon NEF, Canon CR2, DNG ...)
function rawPreview(file, out) {
  const b = fs.readFileSync(file), le = b[0] === 0x49, u16 = o => le ? b.readUInt16LE(o) : b.readUInt16BE(o), u32 = o => le ? b.readUInt32LE(o) : b.readUInt32BE(o), found = [], seen = new Set();
  const ifd = (off, d) => { if (!off || off + 2 > b.length || seen.has(off) || d > 4) return; seen.add(off); const n = u16(off); let jo = 0, jl = 0; const subs = [];
    for (let i = 0; i < n; i++) { const e = off + 2 + i * 12; if (e + 12 > b.length) return; const tag = u16(e), type = u16(e + 2), cnt = u32(e + 4), val = type === 3 && cnt === 1 ? u16(e + 8) : u32(e + 8);
      if (tag === 0x0201) jo = val; if (tag === 0x0202) jl = val; if (tag === 0x014A) { if (cnt === 1) subs.push(val); else for (let k = 0; k < cnt && val + 4 * k + 4 <= b.length; k++) subs.push(u32(val + 4 * k)); } }
    if (jo && jl && jo + jl <= b.length) found.push({ jo, jl }); subs.forEach(s => ifd(s, d + 1)); ifd(u32(off + 2 + n * 12), d + 1); };
  try { ifd(u32(4), 0); } catch { return false; }
  found.sort((a, c) => c.jl - a.jl); if (!found[0]) return false;
  fs.writeFileSync(out, b.subarray(found[0].jo, found[0].jo + found[0].jl)); return true;
}

function build() {
  if (!fs.existsSync(SRC)) { console.log('Folder not found: ' + SRC); return; }
  if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.log('ffmpeg is not installed or not on PATH.'); return; }
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(CACHE_DIR, { recursive: true });
  const finished = readJSON(FINISHED, {}), settings = readJSON(SETTINGS, {}), brandHash = fs.existsSync(BRAND) ? md5(fs.readFileSync(BRAND)).slice(0, 8) : 'none';
  const index = readJSON(path.join(CACHE_DIR, 'index.json'), {});    // content hash -> { dhash, r }
  const photos = [], cats = [], keep = new Set(), seenHash = new Map(), seenD = [], notes = [];
  let made = 0, reused = 0; const covers = {};   // category -> its big top photo (a file named "cover...")
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-'));

  const process1 = (src, rel, cat, id) => {
    let input = src;
    if (RAW.test(src)) { input = path.join(tmp, id + '.jpg'); if (!rawPreview(src, input)) { notes.push(`could not read RAW ${rel} (export it as JPG)`); return null; } }
    const h = md5(fs.readFileSync(src)), o = settings[rel] || {};
    if (seenHash.has(h)) { notes.push(`skipped duplicate ${rel} (same file as ${seenHash.get(h)})`); return null; }
    const done = !!finished[h] || o.grade === 'off', style = o.style || STYLE[cat] || 'house';
    const key = `${h}-${engine.VERSION}-${brandHash}-${done ? (style.startsWith('portrait') ? 'fp2' : 'f') : style}-${o.ev ?? ''}-${o.k ?? ''}-${o.brand === false ? 'nb' : 'b'}`;
    const lgC = path.join(CACHE_DIR, key + '.webp'), smC = path.join(CACHE_DIR, key + '-sm.webp'), xsC = path.join(CACHE_DIR, key + '-xs.webp');
    let meta = index[h];
    if (!meta || !meta.dhash) { meta = { dhash: engine.dhash(input) }; index[h] = meta; }
    const near = seenD.find(s => engine.hamming(s.d, meta.dhash) <= NEAR_DUP);
    if (near) { notes.push(`skipped near-duplicate ${rel} (looks the same as ${near.rel}; keep the one you prefer in the folder)`); return null; }
    seenHash.set(h, rel); seenD.push({ d: meta.dhash, rel });
    if (!fs.existsSync(lgC) || !fs.existsSync(smC)) {
      process.stdout.write(`  ${done ? 'signing ' : 'editing '} ${rel} ... `);
      const stage = path.join(tmp, id + '.png');
      const r = engine.render(input, stage, { finished: done, style, width: 2400, brand: o.brand !== false, override: { ...(o.ev !== undefined ? { ev: o.ev } : {}), ...(o.k !== undefined ? { k: o.k } : {}) } });
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', stage, '-c:v', 'libwebp', '-quality', '84', lgC]);
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', stage, '-vf', 'scale=1400:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '80', smC]);
      meta.r = +(r.size[0] / r.size[1]).toFixed(3); made++;
      const p = r.params || {}; console.log(done ? 'ok' : `ok  (exposure ${p.ev >= 0 ? '+' : ''}${p.ev} EV, sharpening ${p.k}${p.mono ? ', black & white kept' : ''})`);
      if (r.size[0] < 2000) notes.push(`${rel} is only ${r.size[0]} px wide${RAW.test(src) ? ' (RAW preview): export a full-size JPG for best quality' : ''}`);
    } else reused++;
    // small size for grid tiles (made from the 1400 px version; older cache entries get it here too)
    if (!fs.existsSync(xsC)) spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', smC, '-vf', 'scale=800:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '78', xsC]);
    if (!meta.r) { const d = engine.probe(input); meta.r = +(d.w / d.h).toFixed(3); }
    for (const [c, o2] of [[lgC, id + '.webp'], [smC, id + '-sm.webp'], [xsC, id + '-xs.webp']]) { const dst = path.join(OUT, o2); if (!sameBytes(c, dst)) fs.copyFileSync(c, dst); keep.add(o2); }
    return meta.r;
  };

  const folders = fs.readdirSync(SRC, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  try {
    for (const folder of folders) {
      let label = folder.replace(/^\s*\d+[\s._-]*/, '').trim() || folder; label = label.charAt(0).toUpperCase() + label.slice(1);
      let key = Object.keys(KNOWN).find(k => KNOWN[k].test(label));
      if (!key) key = 'c-' + label.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
      const all = fs.readdirSync(path.join(SRC, folder)).filter(f => IMG.test(f) || RAW.test(f));
      const stems = new Set(all.filter(f => IMG.test(f)).map(f => path.parse(f).name.toLowerCase()));
      const files = all.filter(f => IMG.test(f) || !stems.has(path.parse(f).name.toLowerCase())).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      let n = 0;
      for (const f of files) {
        const src = path.join(SRC, folder, f), rel = `${folder}/${f}`;
        if (!covers[key] && /^cover\b/i.test(path.parse(f).name)) { const id = 'cover-' + key, r = process1(src, rel, key, id); if (r) covers[key] = { id, cat: key, r }; continue; }
        const id = `${key}-${String(n + 1).padStart(2, '0')}`, r = process1(src, rel, key, id);
        if (r) { n++; photos.push({ id, cat: key, r }); }
      }
      if (n || covers[key]) cats.push({ key, label });
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  // remove web photos that are no longer in the folder. Only files this tool creates (cover, <category>-NN) are ever deleted;
  // the site's fixed images (portrait, services, the snow sequence) live in assets/media/site/ and are never touched.
  for (const f of fs.readdirSync(OUT)) if (/^(cover(-[a-z0-9-]+)?|[a-z][a-z0-9-]*-\d{2,})(-sm|-xs)?\.webp$/.test(f) && !/^(me|svc|snow)-/.test(f) && !keep.has(f)) fs.unlinkSync(path.join(OUT, f));
  fs.writeFileSync(path.join(CACHE_DIR, 'index.json'), JSON.stringify(index));
  const list = '/* Generated by tools/update-photos.js. Do not edit: change the photo folder and run "Update photos.bat". */\n' + 'window.PHOTO_LIST = ' + JSON.stringify({ cover: covers.events || Object.values(covers)[0] || null, covers, cats, photos }, null, 1) + ';\n';
  if (!fs.existsSync(LIST) || fs.readFileSync(LIST, 'utf8') !== list) fs.writeFileSync(LIST, list);
  notes.forEach(n => console.log('  note: ' + n));
  console.log(`Done ${new Date().toLocaleTimeString()}: ${Object.keys(covers).length} covers +${photos.length} photos in ${cats.length} categories (${cats.map(c => c.label).join(', ')}); ${made} processed, ${reused} unchanged.`);
}

// ---------- run once, or keep watching ----------
const LOCK = path.join(CACHE_DIR, '.lock');
function locked(fn) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  try { const st = fs.statSync(LOCK); if (Date.now() - st.mtimeMs < 30 * 60e3) { console.log('Another update is running; skipping.'); return; } } catch { }
  fs.writeFileSync(LOCK, String(process.pid));
  try { fn(); } catch (e) { console.log('Update failed: ' + e.message); } finally { try { fs.unlinkSync(LOCK); } catch { } }
}
locked(build);
if (process.argv.includes('--watch')) {
  console.log(`\nWatching "${path.basename(SRC)}" for new or changed photos. Leave this window open (minimised is fine).`);
  let timer = null, sizes = '';
  const snapshot = () => { const out = []; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!e.name.startsWith('_')) walk(p); } else if (IMG.test(e.name) || RAW.test(e.name)) out.push(p + ':' + fs.statSync(p).size); } }; try { walk(SRC); } catch { } return out.sort().join('|'); };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(check, 4000); };
  const check = () => { const s = snapshot(); if (s !== sizes) { sizes = s; return schedule(); } console.log(''); locked(build); };   // rebuild only once files stop growing
  sizes = snapshot();
  fs.watch(SRC, { recursive: true }, (ev, name) => { if (!name || name.split(/[\\/]/).some(p => p.startsWith('_'))) return; if (IMG.test(name) || RAW.test(name) || !path.extname(name)) { sizes = ''; schedule(); } });
}
