// Turns the videos in "Videos - put your videos here" into website files, the same way "Update photos.bat" does for photos.
//
//   Reels/<Almaahed | Funleem | Masaar | Memo Bac | Dil Zone | Cinematic | On camera | any new name>/<Title>.mp4
//   Films/<Title>.mp4
//
// The file name is the title (a leading "01 " is ignored, it only sets the order). Optional: a text file with the same
// name ("<Title>.txt") next to the video, with any of these lines:
//   fr: titre en français        ar: العنوان بالعربية        de: Titel auf Deutsch
//   youtube: https://youtu.be/...   (films: the site plays it from YouTube; the file is only used for the preview and cover)
//   preview: 12                     (second where the 5 s hover preview starts; otherwise picked automatically)
//   cover: 14                       (second used for the cover image; otherwise = preview + 1 s)
//   type: event | documentary | short film | vlog | podcast | lecture | promo | ad   (films only, default event)
//   text: one line describing the film (shown under the film title)
//
// For every video it makes: <slug>.mp4 (web version), <slug>-preview.mp4 (+ -preview-hd.mp4 for films), <slug>.webp (cover),
// and writes assets/js/videos-data.js. Work is cached: unchanged videos are not encoded again.
// Videos removed from the folder disappear from the site (only files this tool made, starting with "v-", are deleted).
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'), SRC = path.join(ROOT, 'Videos - put your videos here'), OUT = path.join(ROOT, 'assets', 'media', 'video');
const DATA = path.join(ROOT, 'assets', 'js', 'videos-data.js'), CACHE = path.join(__dirname, '.video-cache.json');
const VID = /\.(mp4|mov|m4v|mkv|avi|mts)$/i;
// folder name -> reel group (and client, when the group is a client)
const GROUPS = { almaahed: 'almaahed', funleem: 'funleem', masaar: 'masaar', masar: 'masaar', 'memo bac': 'memo', memo: 'memo', memobac: 'memo',
  'dil zone': 'dilzone', dilzone: 'dilzone', cinematic: 'cinematic', 'on camera': 'oncam', oncam: 'oncam', voices: 'voices' };
const TYPES = { event: 'event', documentary: 'doc', doc: 'doc', shortfilm: 'short', short: 'short', promo: 'promo', vlog: 'vlog', ad: 'ad', commercial: 'ad', podcast: 'podcast', lecture: 'lecture', archive: 'archive' };
const CLIENTS = new Set(['almaahed', 'funleem', 'masaar', 'memo', 'dilzone']);

const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const run = args => spawnSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args], { encoding: 'utf8' });
const probe = f => { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration', '-of', 'json', f], { encoding: 'utf8' });
  const j = JSON.parse(r.stdout || '{}'), s = (j.streams || [])[0] || {}, rot = Math.abs(+(((s.side_data_list || [])[0] || {}).rotation || 0));
  const [w, h] = rot === 90 ? [s.height, s.width] : [s.width, s.height];
  return { w, h, rate: s.r_frame_rate || '25/1', dur: +((j.format || {}).duration || 0) }; };
const slugify = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'video';
const clock = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const readInfo = f => { const o = {}; if (!fs.existsSync(f)) return o;
  for (const line of fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) { const m = line.match(/^\s*([a-z]+)\s*:\s*(.+?)\s*$/i); if (m) o[m[1].toLowerCase()] = m[2]; } return o; };
const ytId = s => { const m = String(s || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; };

function build() {
  if (!fs.existsSync(SRC)) { console.log('Folder not found: ' + SRC); return; }
  if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.log('ffmpeg is not installed or not on PATH.'); return; }
  const cache = readJSON(CACHE, {}), keep = new Set(), used = new Set(), out = { reels: [], films: [] };
  let made = 0, reused = 0;
  const list = [];
  for (const kind of ['Reels', 'Films']) {
    const base = path.join(SRC, kind); if (!fs.existsSync(base)) continue;
    const walk = (dir, group) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
        if (e.name.startsWith('_')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, group || e.name);
        else if (VID.test(e.name)) list.push({ kind, group, file: p });
      }
    };
    walk(base, null);
  }
  for (const it of list) {
    const name = path.parse(it.file).name, title = name.replace(/^\d+[\s._-]+/, '').trim();
    const info = readInfo(path.join(path.dirname(it.file), name + '.txt'));
    const st = fs.statSync(it.file), key = crypto.createHash('md5').update([it.file, st.size, st.mtimeMs, JSON.stringify({ p: info.preview, c: info.cover })].join('|')).digest('hex');
    let slug = 'v-' + slugify(title); for (let n = 2; used.has(slug); n++) slug = 'v-' + slugify(title) + '-' + n; used.add(slug);
    const film = it.kind === 'Films', yt = ytId(info.youtube);
    const files = [slug + '.webp', slug + '-preview.mp4', ...(film ? [slug + '-preview-hd.mp4'] : []), ...(film && yt ? [] : [slug + '.mp4'])];
    files.forEach(f => keep.add(f));
    let meta = cache[slug];
    const fresh = meta && meta.key === key && files.every(f => fs.existsSync(path.join(OUT, f)));
    if (fresh) reused++;
    else {
      const m = probe(it.file); if (!m.w || !m.dur) { console.log('  could not read ' + path.relative(SRC, it.file)); continue; }
      const vert = m.h > m.w, [num, den] = m.rate.split('/').map(Number), fps = num / (den || 1), rate = fps > 50 ? `${num}/${(den || 1) * 2}` : m.rate;
      const ps = Math.min(Math.max(0, m.dur - 5.2), info.preview != null ? +info.preview : Math.max(1, m.dur * .25)), cs = Math.min(m.dur - .1, info.cover != null ? +info.cover : ps + 1);
      process.stdout.write(`  ${path.relative(SRC, it.file)} ... `);
      // web version: 1080p at web bitrates (keeps the site small enough for GitHub Pages), sound kept
      if (!(film && yt)) {
        const fit = vert ? 'scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2' : 'scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
        const r = run(['-i', it.file, '-vf', fit + `,fps=${rate}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-maxrate', vert ? '3500k' : '4800k', '-bufsize', vert ? '7000k' : '9600k', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-movflags', '+faststart', path.join(OUT, slug + '.mp4')]);
        if (r.status) { console.log('error: ' + r.stderr.slice(0, 200)); continue; }
      }
      // hover preview: 5 s, silent, at the source frame rate
      const pv = (w, h, crf, file) => run(['-ss', String(ps), '-i', it.file, '-t', '5', '-an', '-vf', `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h},fps=${rate}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, file)]);
      if (vert) pv(720, 1280, 24, slug + '-preview.mp4'); else pv(960, 540, 26, slug + '-preview.mp4');
      if (film) { if (vert) pv(1080, 1920, 23, slug + '-preview-hd.mp4'); else pv(1920, 1080, 23, slug + '-preview-hd.mp4'); }
      run(['-ss', String(cs), '-i', it.file, '-frames:v', '1', '-vf', vert ? 'scale=1080:-2' : 'scale=1920:-2', '-c:v', 'libwebp', '-quality', '86', path.join(OUT, slug + '.webp')]);
      // a light copy for the small reel cards (a 1080 x 1920 cover per card was heavy for phones to decode while scrolling)
      if (vert) run(['-i', path.join(OUT, slug + '.webp'), '-vf', 'scale=540:-2', '-c:v', 'libwebp', '-quality', '80', path.join(OUT, slug + '-card.webp')]);
      meta = cache[slug] = { key, dur: clock(m.dur), vert };
      made++; console.log('ok');
    }
    const t = { en: title, fr: info.fr || title, ar: info.ar || title, de: info.de || title };
    const groupKey = it.group ? (GROUPS[it.group.toLowerCase().trim()] || it.group.trim()) : null;
    if (film) {
      const f = { slug, type: TYPES[(info.type || 'event').toLowerCase().replace(/[\s-]/g, '')] || 'event', dur: meta.dur, preview: true, title: t, desc: info.text ? { en: info.text, fr: info.text, ar: info.text, de: info.text } : { en: '', fr: '', ar: '', de: '' } };
      if (yt) f.youtube = yt;
      if (groupKey && CLIENTS.has(groupKey)) f.client = groupKey;
      out.films.push(f);
    } else {
      const r = { slug, group: groupKey || 'oncam', dur: meta.dur, title: t };
      if (groupKey && CLIENTS.has(groupKey)) r.client = groupKey;
      out.reels.push(r);
    }
  }
  // tidy up: files this tool made for videos that are no longer in the folder
  let removed = 0;
  for (const f of fs.readdirSync(OUT)) if (/^v-/.test(f) && !keep.has(f)) { fs.unlinkSync(path.join(OUT, f)); removed++; }
  for (const s of Object.keys(cache)) if (!used.has(s)) delete cache[s];
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  fs.writeFileSync(DATA, '/* Generated by tools/update-videos.js. Do not edit: change the video folder and run "Update videos.bat". */\nwindow.VIDEO_LIST = ' + JSON.stringify(out, null, 1) + ';\n');
  console.log(`Done ${new Date().toLocaleTimeString()}: ${out.reels.length} reels, ${out.films.length} films from the folder; ${made} processed, ${reused} unchanged${removed ? ', ' + removed + ' old files removed' : ''}.`);
}
build();
