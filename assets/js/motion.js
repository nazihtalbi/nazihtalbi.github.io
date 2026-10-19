/* Motion: scroll progress line, title reveals, staggered card/photo entrances, and the "First snow" sequence.
   Everything here is decorative and switches off for visitors who ask their device for reduced motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = !matchMedia('(hover: hover)').matches || innerWidth <= 760;   // phones / tablets
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  document.documentElement.classList.toggle('motion', !reduce);

  /* ---------- scroll progress + first snow sequence share one scroll handler ---------- */
  const progress = $('#progress');
  const snow = $('#snow'), track = $('.snow__track'), frames = $$('.snow__frame'), now = $('#snowNow'), thumbs = $$('.snow__thumb');
  $('#snowAll').textContent = String(frames.length).padStart(2, '0');
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  let current = -1, lastS = -1;
  // progress through the sequence -> how far each photo has wiped in (a short hold at each end)
  const snowAt = p => Math.min(1, Math.max(0, (p - .05) / .88)) * (frames.length - 1);
  // all reads happen before any write, and work is batched to one update per frame (no forced layouts)
  let docH = document.documentElement.scrollHeight, trackTop = 0, trackH = 0;
  const measure = () => { docH = document.documentElement.scrollHeight; if (track) { trackTop = track.getBoundingClientRect().top + scrollY; trackH = track.offsetHeight; } };
  function onScroll() {
    const y = scrollY, vh = innerHeight, max = docH - vh;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!snow || reduce) return;
    const r = { top: trackTop - y, height: trackH }, span = r.height - vh;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    if (r.top > vh || r.top + r.height < 0) return; // sequence off screen: nothing to update
    const sAt = snowAt(p); if (Math.abs(sAt - lastS) < .002) return; lastS = sAt;
    for (let k = 1; k < frames.length; k++) frames[k].style.setProperty('--t', ease(Math.min(1, Math.max(0, sAt - (k - 1)))).toFixed(4));
    const i = Math.round(sAt);
    if (i !== current) { current = i; now.textContent = String(i + 1).padStart(2, '0'); thumbs.forEach((t, k) => t.classList.toggle('is-on', k === i)); }
  }
  let queued = false;
  addEventListener('scroll', () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; onScroll(); }); }, { passive: true });
  // filmstrip: jump to a photo
  thumbs.forEach((t, k) => t.addEventListener('click', () => {
    const top = track.getBoundingClientRect().top + scrollY, span = track.offsetHeight - innerHeight;
    scrollTo({ top: top + span * (.05 + .88 * k / (frames.length - 1)), behavior: reduce ? 'auto' : 'smooth' });
  }));
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); onScroll(); });
  // page height changes as images load and galleries are filtered
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
  measure(); onScroll();

  // keep the alt text in the visitor's language (the page language can change without reload)
  const setAlt = () => { const alt = (window.I18N[document.documentElement.lang] || window.I18N.en).snowAlt; frames.forEach(f => f.querySelectorAll('img').forEach(im => (im.alt = alt))); };
  setAlt(); new MutationObserver(setAlt).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  if (reduce) return;

  /* ---------- reveal titles and stagger cards/photos as they enter ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  const watch = () => {
    $$('.sec-title, .contact__title, .steps__title, .snow__title, .spot, .lead').forEach(n => { if (!n.dataset.rv) { n.dataset.rv = 1; io.observe(n); } });
    ['#wall .tile', '#reelGrid .vcard', '.client', '.svc li', '.steps li'].forEach(sel => $$(sel).forEach((n, k) => {
      if (n.dataset.rv) return; n.dataset.rv = 1; n.classList.add('rise'); n.style.setProperty('--d', (k % 8) * 70 + 'ms'); io.observe(n);
    }));
  };
  watch();
  // galleries are re-rendered on filter / language change: pick up the new nodes
  const mo = new MutationObserver(watch); ['#wall', '#reelGrid', '#clientList'].forEach(sel => { const n = $(sel); if (n) mo.observe(n, { childList: true }); });

  /* ---------- "The eye behind the camera": an aperture opens on the portrait, and the glasses reflect the films ---------- */
  const lens = $('#lens'), fig = lens && lens.parentElement;
  if (lens && window.DATA) {
    // glasses lenses in the 900 x 600 portrait: [left, top, width, height]; the photo is drawn with object-fit: cover at 50% 30%
    const NW = 900, NH = 600, GLASS = [[414, 169, 61, 50], [490, 167, 54, 50]];
    const reel = window.DATA.FILMS.filter(f => f.preview).map(f => f.slug);
    let at = 0;
    const blades = Array.from({ length: 7 }, (_, k) => `<g class="iris__b" style="--k:${k}"><path d="M-260 0H260V260H-260Z"/><path class="iris__edge" d="M-260 0H260"/></g>`).join('');
    lens.innerHTML = GLASS.map((_, k) => `<span class="lens__glass lens__glass--${k ? 'r' : 'l'}"><video muted playsinline preload="none"></video><i></i></span>`).join('') +
      `<svg class="iris" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="irisMetal" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stop-color="#2a2622"/><stop offset=".55" stop-color="#0d0c0b"/><stop offset="1" stop-color="#1c1915"/></linearGradient></defs>${blades}</svg>`;
    const glasses = $$('.lens__glass', lens), vids = $$('video', lens), iris = $('.iris', lens);
    const place = () => {
      const w = fig.clientWidth, h = fig.clientHeight; if (!w) return;
      const s = Math.max(w / NW, h / NH), ox = (w - NW * s) * .5, oy = (h - NH * s) * .3;
      GLASS.forEach(([x, y, gw, gh], k) => Object.assign(glasses[k].style, { left: ox + x * s + 'px', top: oy + y * s + 'px', width: gw * s + 'px', height: gh * s + 'px' }));
      // the aperture opens from between the eyes: a square iris, big enough to cover the whole portrait from there
      const ex = ox + 479 * s, ey = oy + 193 * s, S = 2.3 * Math.hypot(w, h);
      Object.assign(iris.style, { left: ex - S / 2 + 'px', top: ey - S / 2 + 'px', width: S + 'px', height: S + 'px' });
    };
    // phones skip the two reflection videos (two extra decoders for a detail too small to see there)
    const load = () => lite ? null : vids.forEach(v => { v.src = window.DATA.V + reel[at % reel.length] + '-preview.mp4'; v.playbackRate = .6; v.play().catch(() => {}); });
    // when a clip ends, both lenses move on to the next film together
    vids[0].addEventListener('ended', () => { at++; load(); });
    let started = false;
    place(); if ('ResizeObserver' in window) new ResizeObserver(place).observe(fig);
    new IntersectionObserver(es => {
      const on = es[0].isIntersecting;
      if (on && !started) { started = true; place(); fig.classList.add('lens-on'); load(); }
      else if (started) vids.forEach(v => (on ? v.play().catch(() => {}) : v.pause()));
    }, { threshold: .35 }).observe(fig);
  }

  /* ---------- decode big images ahead of time (about two screens early), so they never decode mid-scroll ---------- */
  if ('decode' in HTMLImageElement.prototype) {
    const pre = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; pre.unobserve(e.target); const im = e.target; im.loading = 'eager'; im.decode().catch(() => {}); }), { rootMargin: lite ? '700px 0px' : '1800px 0px' });
    const watchImgs = () => $$('main img').forEach(im => { if (!im.dataset.pre) { im.dataset.pre = 1; pre.observe(im); } });
    watchImgs(); new MutationObserver(watchImgs).observe($('main'), { childList: true, subtree: true });
  }

  /* ---------- glow halos only animate while they are on screen ---------- */
  const live = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-live', e.isIntersecting)), { rootMargin: '100px 0px' });
  $$('.glow').forEach(g => live.observe(g));

  /* ---------- welcome: gold sparks drifting off the viewfinder, and cards that follow the finger ---------- */
  $$('.gate__opt').forEach(o => o.addEventListener('pointermove', e => {
    const r = o.getBoundingClientRect();
    o.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); o.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }));
  const sc = $('.vfx__sparks');
  if (sc && document.body.classList.contains('is-gated')) {
    const g = sc.getContext('2d'), M = 70, N = lite ? 26 : 50, P = [];
    // one soft glow sprite, drawn once, reused for every spark
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
    { const s = sprite.getContext('2d'), rg = s.createRadialGradient(16, 16, 0, 16, 16, 16);
      rg.addColorStop(0, 'rgba(255,246,220,1)'); rg.addColorStop(.25, 'rgba(246,214,150,.85)'); rg.addColorStop(1, 'rgba(226,170,90,0)'); s.fillStyle = rg; s.fillRect(0, 0, 32, 32); }
    let W = 0, Hh = 0;
    const size = () => { const d = 1; W = sc.clientWidth; Hh = sc.clientHeight; sc.width = W * d; sc.height = Hh * d; g.setTransform(d, 0, 0, d, 0, 0); };
    // a spark is born on the edge of the frame and drifts outwards (and slightly up), twinkling as it fades
    const born = p => {
      const w = W - 2 * M, h = Hh - 2 * M, per = 2 * (w + h); let d = Math.random() * per, x, y, nx, ny;
      if (d < w) { x = M + d; y = M; nx = 0; ny = -1; } else if ((d -= w) < h) { x = M + w; y = M + d; nx = 1; ny = 0; }
      else if ((d -= h) < w) { x = M + w - d; y = M + h; nx = 0; ny = 1; } else { d -= w; x = M; y = M + h - d; nx = -1; ny = 0; }
      const sp = 8 + Math.random() * 26;
      Object.assign(p, { x, y, vx: nx * sp + (Math.random() - .5) * 10, vy: ny * sp - 6 - Math.random() * 8, life: 0, max: 1.4 + Math.random() * 2.2, r: Math.random() < .12 ? 3 + Math.random() * 3 : .9 + Math.random() * 2, tw: Math.random() * 6.28 });
      p.big = p.r > 3;
    };
    let last = 0;
    const tick = now => {
      if (!document.body.classList.contains('is-gated')) { g.clearRect(0, 0, W, Hh); return; }   // stops for good once the visitor is in
      requestAnimationFrame(tick);
      if (document.hidden) return;
      // 30 frames a second is plenty for drifting sparks and halves the work
      if (now - last < 30) return;
      const dt = Math.min(.07, (now - last) / 1000 || 0); last = now;
      while (P.length < N) { const p = {}; born(p); p.life = Math.random() * p.max; P.push(p); }
      g.clearRect(0, 0, W, Hh); g.globalCompositeOperation = 'lighter';
      for (const p of P) {
        p.life += dt; if (p.life > p.max) { born(p); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .995;
        const k = p.life / p.max, a = Math.sin(Math.PI * k) * (p.big ? .35 : .7 + .3 * Math.sin(p.tw + p.life * 9)), s = p.r * 8;
        g.globalAlpha = Math.max(0, a); g.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      g.globalAlpha = 1;
    };
    // the canvas size is watched instead of read on every frame (reading it forced a layout of the page 30 times a second)
    size(); if ('ResizeObserver' in window) new ResizeObserver(size).observe(sc); else addEventListener('resize', size);
    requestAnimationFrame(tick);
  }

  /* ---------- falling snow over the sequence ---------- */
  const cv = $('#snowFlakes'); if (!cv) return;
  const ctx = cv.getContext('2d'); let flakes = [], W = 0, H = 0, running = false, last = 0;
  const make = (y) => ({ x: Math.random() * W, y: y ?? Math.random() * H, r: Math.random() * 2.2 + .6, s: Math.random() * 28 + 22, w: Math.random() * 2 * Math.PI, a: Math.random() * .5 + .35 });
  function size() {
    const dpr = 1; W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, W * H / 16000)); flakes = Array.from({ length: n }, () => make());
  }
  function frame(t) {
    if (!running) return;
    const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#fff';
    for (const f of flakes) {
      f.y += f.s * dt; f.w += dt * .8; f.x += Math.sin(f.w) * 12 * dt;
      if (f.y > H + 4) Object.assign(f, make(-4));
      ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(es => { const on = es[0].isIntersecting; if (on && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); } else if (!on) running = false; }).observe(snow);
  addEventListener('resize', size); size();
})();
