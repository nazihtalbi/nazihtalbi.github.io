/* Colour grading section: before / after comparison of one S-Log3 shot.
   One video holds both versions stacked (S-Log3 on top, graded underneath), drawn into a canvas, so the two sides
   can never drift out of sync. Before the video is ready, two still frames do the same job with CSS. */
(() => {
  const cmp = document.getElementById('cmp'); if (!cmp) return;
  const canvas = document.getElementById('cmpCanvas'), ctx = canvas.getContext('2d', { alpha: false }), video = document.getElementById('cmpVideo'), range = document.getElementById('cmpRange');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, V = (window.SITE_ROOT || '') + 'assets/media/video/';
  // the shots: Blackmagic RAW (Pocket Cinema Camera 4K) and Sony S-Log3 (ZV-E10)
  // phones get a lighter copy (800 px wide instead of 1600): much easier to decode and draw while dragging
  const M = matchMedia('(max-width: 900px)').matches ? '-m' : '';
  const CLIPS = {
    braw: { src: V + 'grade-braw' + M + '.mp4', before: V + 'grade-braw-before.webp', after: V + 'grade-braw-after.webp', label: 'gradeBeforeBraw', shot: 'gradeShotBraw' },
    slog: { src: V + 'grade-compare' + M + '.mp4', before: V + 'grade-before.webp', after: V + 'grade-after.webp', label: 'gradeBefore', shot: 'gradeShot' },
  };
  let clip = 'braw', SRC = CLIPS.braw.src;
  const tr = k => { const I = window.I18N || {}, l = document.documentElement.lang; return (I[l] && I[l][k]) || (I.en && I.en[k]) || ''; };
  let dragging = false, pos = 0.5, visible = false, touched = false, sweeping = 0, drawQueued = false;

  // ---- drawing ------------------------------------------------------------------------------
  let boxW = 0; const line = cmp.querySelector('.cmp__line');
  const size = () => { boxW = cmp.clientWidth; line.style.transform = 'translate3d(' + Math.round(boxW * pos) + 'px,0,0)';
    const w = Math.min(M ? 900 : 1600, Math.round(boxW * Math.min(2, devicePixelRatio || 1))); canvas.width = w; canvas.height = Math.round(w * 9 / 16); draw(); };
  function draw() {
    if (video.readyState < 2 || !canvas.width) return;
    if (!cmp.classList.contains('is-video')) cmp.classList.add('is-video');
    const vw = video.videoWidth, vh = video.videoHeight / 2, cw = canvas.width, ch = canvas.height, x = Math.round(cw * pos);
    if (x > 0) ctx.drawImage(video, 0, 0, vw * pos, vh, 0, 0, x, ch);                       // left: S-Log3 original
    if (x < cw) ctx.drawImage(video, vw * pos, vh, vw * (1 - pos), vh, x, 0, cw - x, ch);  // right: graded
  }
  const queue = () => { if (drawQueued) return; drawQueued = true; requestAnimationFrame(() => { drawQueued = false; draw(); }); };
  // redraw on every new video frame (only while it plays); at most one drawing per screen frame, shared with the divider
  const frameLoop = () => { if (!visible || video.paused) return; queue(); 'requestVideoFrameCallback' in video ? video.requestVideoFrameCallback(frameLoop) : requestAnimationFrame(frameLoop); };
  video.addEventListener('playing', () => { cmp.classList.add('is-video'); frameLoop(); });
  video.addEventListener('loadeddata', () => { cmp.classList.add('is-video'); draw(); });

  // ---- the divider --------------------------------------------------------------------------
  function setPos(p, fromUser) {
    pos = Math.min(1, Math.max(0, p));
    // the divider moves with a transform (no layout); the stills are only re-cut while they are what is showing
    line.style.transform = 'translate3d(' + Math.round(boxW * pos) + 'px,0,0)';
    if (!cmp.classList.contains('is-video')) cmp.style.setProperty('--pos', (pos * 100).toFixed(2) + '%');
    const b = pos > 0.12, a = pos < 0.88;
    if (b !== cmp.classList.contains('show-before')) cmp.classList.toggle('show-before', b);
    if (a !== cmp.classList.contains('show-after')) cmp.classList.toggle('show-after', a);
    if (!dragging) range.value = (pos * 100).toFixed(1);
    if (fromUser && !touched) { touched = true; cmp.classList.add('is-touched'); cancelAnimationFrame(sweeping); }
    queue();
  }
  const fromX = clientX => { const r = cmp.getBoundingClientRect(); return (clientX - r.left) / r.width; };
  cmp.addEventListener('pointerdown', e => { if (e.button !== 0) return; dragging = true; cmp.setPointerCapture(e.pointerId); cmp.classList.add('is-dragging'); setPos(fromX(e.clientX), true); });
  cmp.addEventListener('pointermove', e => { if (dragging) setPos(fromX(e.clientX), true); });
  const end = () => { if (!dragging) return; dragging = false; cmp.classList.remove('is-dragging'); range.value = (pos * 100).toFixed(1); };
  cmp.addEventListener('pointerup', end); cmp.addEventListener('pointercancel', end);
  range.addEventListener('input', () => setPos(range.value / 100, true));   // keyboard and screen readers

  // ---- the reveal: when the section arrives, the divider sweeps across once to show the transformation ----
  function sweep() {
    if (reduce || touched) return;
    const keys = [[0, pos], [800, 0.96], [2100, 0.05], [3100, 0.5]], ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, t0 = performance.now();
    cmp.classList.add('is-sweeping');
    const step = now => {
      if (touched) return;
      const t = now - t0; let k = 1; while (k < keys.length - 1 && t > keys[k][0]) k++;
      const [ta, pa] = keys[k - 1], [tb, pb] = keys[k], f = Math.min(1, Math.max(0, (t - ta) / (tb - ta)));
      setPos(pa + (pb - pa) * ease(f), false);
      if (t < keys[keys.length - 1][0]) sweeping = requestAnimationFrame(step); else cmp.classList.remove('is-sweeping');
    };
    sweeping = requestAnimationFrame(step);
  }

  // ---- only work while on screen ---------------------------------------------------------------
  // the box fades in as soon as it starts to appear; the reveal sweep waits until it is well in view and settled
  let swept = false, shown = false;
  new IntersectionObserver(es => {
    const r = es[0].intersectionRatio;
    if (!shown && r > .05) { shown = true; cmp.classList.add('is-in'); cmp.closest('.grade').classList.add('is-in'); }
    visible = r >= .35;   // play only once the comparison is well on screen
    if (visible) {
      (window.afterScroll || (f => f()))(() => { if (!visible) return; if (!video.src) { video.src = SRC; video.preload = 'auto'; } if (!reduce) video.play().then(frameLoop).catch(() => {}); });
      if (!swept && r > .55) { swept = true; (window.afterScroll || (f => f()))(() => setTimeout(sweep, 250)); }
    } else video.pause();
  }, { threshold: [0, .06, .35, .56] }).observe(cmp);
  // ---- switching shots: the image dips, the new shot loads, then fades back in --------------------
  const tabs = [...document.querySelectorAll('.grade__tab')];
  const label = document.getElementById('cmpBefore'), shot = document.getElementById('gradeShot');
  const imgB = cmp.querySelector('.cmp__img--before'), imgA = cmp.querySelector('.cmp__img--after');
  tabs.forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.clip; if (id === clip) return;
    clip = id; const c = CLIPS[id]; SRC = c.src;
    tabs.forEach(t => t.setAttribute('aria-pressed', String(t === b)));
    label.dataset.i18n = c.label; label.textContent = tr(c.label);
    shot.dataset.i18n = c.shot; shot.textContent = tr(c.shot);
    cmp.classList.add('is-switching');
    setTimeout(() => {
      cmp.classList.remove('is-video'); cmp.style.setProperty('--pos', (pos * 100).toFixed(2) + '%'); imgB.src = c.before; imgA.src = c.after;
      video.src = c.src; video.preload = 'auto';
      const back = () => { cmp.classList.remove('is-switching'); draw(); };
      video.addEventListener('loadeddata', back, { once: true });
      if (visible && !reduce) video.play().then(frameLoop).catch(() => {}); else video.load();
      setTimeout(back, 1500);   // in case the video is slow, the stills show meanwhile
    }, 280);
  }));

  if ('ResizeObserver' in window) new ResizeObserver(size).observe(cmp); else addEventListener('resize', size);
  size(); setPos(0.5, false);
})();
