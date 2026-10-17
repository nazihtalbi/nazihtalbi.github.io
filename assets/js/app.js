(() => {
  const D = window.DATA, I = window.I18N, LANGS = ['en', 'fr', 'ar', 'de'];
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverable = matchMedia('(hover: hover)').matches;
  // touch devices: no hover previews to prepare, smaller video files, and video decoders released as soon as they are not needed
  const lite = !hoverable || innerWidth <= 760;
  let lang = 'en';
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  const t = k => (I[lang] && I[lang][k] != null ? I[lang][k] : I.en[k] != null ? I.en[k] : (k.startsWith('cat.') ? (window.DATA.CAT_LABELS[k.slice(4)] || k.slice(4)) : k));
  const tx = v => (v == null ? '' : typeof v === 'string' ? v : v[lang] || v.en);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clientName = id => (id ? tx(D.CLIENTS[id].name) : '');

  /* ---------- language ---------- */
  let applied = null;
  function applyLang(next) {
    next = LANGS.includes(next) ? next : 'en';
    if (next === applied) return;   // already rendered in this language: nothing to redo
    applied = next; lang = next;
    const root = document.documentElement;
    root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(n => { const v = t(n.dataset.i18n); if (typeof v === 'string') n.textContent = v; });
    $$('[data-i18n-ph]').forEach(n => (n.placeholder = t(n.dataset.i18nPh)));
    $$('[data-i18n-label]').forEach(n => n.setAttribute('aria-label', t(n.dataset.i18nLabel)));
    $('#langCode').textContent = lang.toUpperCase();
    $$('#langMenu button').forEach(b => b.setAttribute('aria-current', b.dataset.lang === lang ? 'true' : 'false'));
    document.title = t('seoTitle'); { const m = document.querySelector('meta[name="description"]'); if (m) m.content = t('seoDesc'); } $('.about__portrait img').alt = t('fullName');
    syncHeroPause();
    renderFilms(); renderSpot(); renderReelChips(); renderReels(); renderPhotoChips(); renderWall(); renderClients(); renderCases(); renderTypes();
  }

  /* ---------- gate ---------- */
  const gate = $('#gate'), main = $('#main'), bar = $('#bar'), foot = $('.foot');
  // scrolling is held while the opening plays, but a link clicked during it (e.g. "Watch the films") ends the opening at once
  document.addEventListener('click', e => { if (document.body.classList.contains('is-entering') && e.target.closest('a[href^="#"]')) document.body.classList.remove('is-entering'); }, true);
  function enter(choice, quick) {
    applyLang(choice);
    document.body.classList.remove('is-gated');
    document.body.classList.add('is-entering');
    [main, bar, foot].forEach(n => (n.inert = false));
    gate.inert = true;
    // quick: the visitor picked a section, so the welcome leaves in 0.35 s and is removed (it must never sit over the work)
    if (quick) gate.classList.add('is-leaving');
    setTimeout(() => { document.body.classList.remove('is-entering'); gate.hidden = true; }, reduceMotion ? 0 : quick ? 380 : 1400);
    $('.hero__title').setAttribute('tabindex', '-1'); $('.hero__title').focus({ preventScroll: true });
  }
  const WELCOME = {
    en: { a: "Hey, I'm", name: 'Nazih', b: 'and this is my portfolio.', go: 'Continue in English', change: 'Change language', back: 'Back' },
    fr: { a: 'Salut, je suis', name: 'Nazih', b: 'et voici mon portfolio.', go: 'Continuer en français', change: 'Changer de langue', back: 'Retour' },
    ar: { a: 'أهلًا، أنا', name: 'نزيه', b: 'وهذا معرض أعمالي.', go: 'المتابعة بالعربية', change: 'تغيير اللغة', back: 'رجوع' },
    de: { a: 'Hey, ich bin', name: 'Nazih', b: 'und das ist mein Portfolio.', go: 'Auf Deutsch weiter', change: 'Sprache ändern', back: 'Zurück' },
  };
  const SUGGEST_LABEL = { en: 'Suggested for you', fr: 'Suggéré pour vous', ar: 'مقترحة لك', de: 'Für Sie empfohlen' };
  // smooth, eased scroll to a section; it keeps re-aiming while images above it load, and stops if the visitor scrolls
  function glideTo(target, done) {
    const barH = () => ($('#bar') ? $('#bar').offsetHeight : 0);
    const aim = () => Math.max(0, target.getBoundingClientRect().top + scrollY - barH() + 2);
    if (window.__smoothStop) window.__smoothStop();
    if (reduceMotion) { scrollTo(0, aim()); return done && done(); }
    const root = document.documentElement, prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
    const from = scrollY, dist = Math.abs(aim() - from), dur = Math.min(1700, Math.max(850, dist * .35)), t0 = performance.now();
    let stop = false; const cancel = () => (stop = true);
    addEventListener('wheel', cancel, { passive: true, once: true }); addEventListener('touchstart', cancel, { passive: true, once: true });
    const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const frame = now => {
      const p = Math.min(1, (now - t0) / dur);
      if (!stop) scrollTo(0, from + (aim() - from) * ease(p));
      if (p < 1 && !stop) requestAnimationFrame(frame);
      else { root.style.scrollBehavior = prev; removeEventListener('wheel', cancel); removeEventListener('touchstart', cancel); done && done(); }
    };
    requestAnimationFrame(frame);
  }
  let choosing = false, chosen = 'en';
  // after the language: "what would you like to see?" (films, photography, reels or everything)
  function choose(b) {
    if (choosing) return; choosing = true; chosen = b.dataset.lang;
    // only the welcome texts change now; re-rendering the whole page in the new language waits until the
    // welcome animation has settled (on a phone it is a few hundred ms of work that would freeze the animation)
    lang = chosen;
    setTimeout(() => (window.requestIdleCallback || (f => setTimeout(f, 0)))(() => applyLang(chosen), { timeout: 1500 }), 900);
    const ask = () => { gate.classList.remove('is-choosing'); gate.dispatchEvent(new CustomEvent('gate:step', { detail: 'intent' })); };
    if (reduceMotion || gate.dataset.step !== 'pick') return ask();
    gate.classList.add('is-choosing'); b.classList.add('is-picked');
    setTimeout(ask, 600);
  }
  $$('.gate__opt').forEach(o => o.addEventListener('click', () => {
    const go = o.dataset.go;
    if (go === 'all') return enter(chosen);
    enter(chosen, true);
    // skip the hero's opening and glide to the chosen section while the welcome screen fades away
    document.body.classList.remove('is-entering');
    const target = document.getElementById(go);
    // the glide starts once the welcome is gone
    setTimeout(() => glideTo(target, () => { const h = target.querySelector('.sec-title'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }), reduceMotion ? 0 : 400);
  }));
  function initGate() {
    const start = window.LANG_START || { lang: 'en', saved: false, suggested: 'en' };
    if (start.saved) { // returning visitor: their own choice wins, no gate
      document.documentElement.classList.add('instant');
      document.body.classList.remove('is-gated'); gate.hidden = true; gate.inert = true;
      requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('instant')));
      return;
    }
    [main, bar, foot].forEach(n => (n.inert = true));
    scrollTo(0, 0); addEventListener('load', () => { if (document.body.classList.contains('is-gated')) scrollTo(0, 0); });
    const btns = $$('.gate__lang');
    btns.forEach((b, i) => {
      b.addEventListener('click', () => choose(b));
      if (b.dataset.lang === start.suggested) {
        b.classList.add('is-suggested');
        const tag = el('em', 'gate__tag', SUGGEST_LABEL[b.dataset.lang]); b.append(tag);
        b.setAttribute('aria-describedby', 'gate-name');
      }
      b.addEventListener('keydown', e => {
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (dir) { e.preventDefault(); btns[(i + dir + btns.length) % btns.length].focus(); }
      });
    });
    const tc = $('#gateTc'), t0 = performance.now();
    const tick = () => { if (document.body.classList.contains('is-gated') === false) return; const f = Math.floor((performance.now() - t0) / (1000 / 24)), s = Math.floor(f / 24);
      tc.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f % 24].map(n => String(n).padStart(2, '0')).join(':'); setTimeout(tick, 1000 / 12); };
    tick();
    const onKey = e => { if (!document.body.classList.contains('is-gated')) return; if (e.key === 'Escape' && gate.dataset.step === 'pick') return step('hello'); const k = +e.key; if (gate.dataset.step === 'pick' && k >= 1 && k <= btns.length) choose(btns[k - 1]); };
    document.addEventListener('keydown', onKey);
    // step 1: welcome in the suggested language, with "continue" or "change language"
    const hello = $('#gateHello');
    // the greeting is built as a small title sequence: letters rise, "Hey" waves, the name pulls into focus
    // under an autofocus box, then the second line types in. Arabic is animated by words (letters must stay joined).
    let greeted = null;
    const greet = l => {
      if (l === greeted) return;
      const g = WELCOME[l] || WELCOME.en, top = $('#gateTop'), rtl = l === 'ar', swap = greeted !== null; greeted = l;
      top.lang = l; top.dir = rtl ? 'rtl' : 'ltr';
      const units = w => (rtl ? [w] : [...w]);
      let n = 0;
      $('#heyA').innerHTML = g.a.split(' ').map((w, k) => `<span class="gw${k === 0 ? ' gw--wave' : ''}">${units(w).map(c => `<span class="gl" style="--i:${n++}">${esc(c)}</span>`).join('')}</span>`).join(' ');
      $('#heyName').innerHTML = units(g.name).map((c, k) => `<span class="gn" style="--i:${k}">${esc(c)}</span>`).join('') + '<span class="gaf" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
      const words = g.b.split(' ');
      $('#heyB').innerHTML = words.map((w, k) => `<span class="gb" style="--i:${k}">${esc(w)}</span>`).join(' ') + `<span class="gcaret" style="--i:${words.length}" aria-hidden="true"></span>`;
      $('#gateSr').textContent = `${g.a} ${g.name} ${g.b}`;
      // replaying for a language preview: restart the sequence, faster
      top.classList.remove('is-swap'); if (swap) { void top.offsetWidth; top.classList.add('is-swap'); }
    };
    // the welcome opens in English, then every 3 s it greets the visitor in the next language (French, Arabic, German, ...)
    // until they choose. "Continue" always continues in the language currently shown. It pauses briefly while the mouse
    // rests on the buttons or someone uses the keyboard.
    const ORDER = ['en', 'fr', 'ar', 'de']; let cur = 'en', ci = 0, cycleT = null;
    const setHello = l => {
      cur = l; greet(l); const g = WELCOME[l];
      hello.lang = l; hello.dir = l === 'ar' ? 'rtl' : 'ltr';
      $('#gateContinueTx').textContent = g.go; $('#gateChangeTx').textContent = g.change; $('#gateBackTx').textContent = g.back;
      const acts = $('.gate__actions'); if (acts) { acts.classList.remove('is-relabel'); void acts.offsetWidth; acts.classList.add('is-relabel'); }
      $('#gateBack').lang = l; $('#gateBack').dir = hello.dir;
    };
    // the greeting and the Continue button keep the size of their longest language, so nothing jumps while it cycles
    const lockSizes = () => {
      const top = $('#gateTop'), probe = top.cloneNode(true);
      probe.removeAttribute('id'); probe.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', minHeight: '0', width: top.offsetWidth + 'px' });
      top.parentNode.append(probe);
      const go = $('#gateContinue'), goTx = $('#gateContinueTx'), keep = goTx.textContent; go.style.minWidth = '';
      const ch = $('#gateChange'), chTx = $('#gateChangeTx'), keepCh = chTx.textContent; ch.style.minWidth = ''; let wc = 0;
      let h = 0, w = 0;
      for (const l of ORDER) {
        const g = WELCOME[l], [a, n] = probe.querySelectorAll('.gate__hey1 > span'), b = probe.querySelector('.gate__hey2');
        probe.lang = l; probe.dir = l === 'ar' ? 'rtl' : 'ltr'; a.textContent = g.a; n.textContent = g.name; b.textContent = g.b;
        h = Math.max(h, probe.offsetHeight); goTx.textContent = g.go; w = Math.max(w, go.offsetWidth); chTx.textContent = g.change; wc = Math.max(wc, ch.offsetWidth);
      }
      probe.remove(); goTx.textContent = keep; chTx.textContent = keepCh; top.style.minHeight = h + 'px'; go.style.minWidth = Math.ceil(w) + 'px'; ch.style.minWidth = Math.ceil(wc) + 'px';
    };
    // English first, except on the /fr/, /ar/ and /de/ pages (or a ?lang= link), which start in their own language
    const first = start.why === 'link' && ORDER.includes(start.lang) ? start.lang : 'en';
    ci = ORDER.indexOf(first); setHello(first); lockSizes();
    cycleT = setInterval(() => {
      if (window.__gateHold || gate.dataset.step !== 'hello' || document.hidden || !document.body.classList.contains('is-gated')) return;
      ci = (ci + 1) % ORDER.length; setHello(ORDER[ci]);
    }, 3000);
    // a mouse resting on the buttons pauses the cycle for at most 6 s, a key press for 10 s; touch never pauses it
    // (a tap is already the choice), so the greeting can never get stuck on one language
    const actions = $('.gate__actions'); let holdUntil = 0;
    actions.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') holdUntil = performance.now() + 6000; });
    actions.addEventListener('pointerleave', () => (holdUntil = 0));
    gate.addEventListener('keydown', () => (holdUntil = performance.now() + 10000));
    Object.defineProperty(window, '__gateHold', { get: () => performance.now() < holdUntil, configurable: true });
    // on the language step, hovering or focusing a card previews the greeting in that language
    btns.forEach(b => { const show = () => greet(b.dataset.lang); b.addEventListener('mouseenter', show); b.addEventListener('focus', show); });
    $('#gatePick').addEventListener('mouseleave', () => greet(cur));
    const suggestedBtn = btns.find(b => b.dataset.lang === start.suggested) || btns[0];
    const root = document.documentElement, chooseBox = $('.gate__choose');
    // the camera frame: under the buttons on the welcome step, between greeting and cards on the language step
    // positions are measured without transforms, so running entrance animations don't throw them off
    const absTop = n => { let y = 0; for (; n; n = n.offsetParent) y += n.offsetTop; return y; };
    const fitFrame = () => {
      if (!document.body.classList.contains('is-gated')) { ['--vf-t', '--vf-b', '--vf-x'].forEach(v => root.style.removeProperty(v)); return; }
      const W = innerWidth, H = innerHeight, gap = Math.max(20, H * .035), phone = W <= 760, tablet = !phone && W <= 1000;
      let t, b, x;
      if (gate.dataset.step !== 'pick') { // under the buttons (or the "what to see" choices), centred in what is left
        const top = absTop(chooseBox) + chooseBox.offsetHeight + gap, space = H - top - 16;
        const h = Math.min(H * (phone ? .5 : tablet ? .52 : .54), space); t = top + Math.max(0, (space - h) / 2); b = H - t - h; x = W * (phone ? .06 : tablet ? .1 : .22);
      } else { // between the greeting and the language cards
        const top = $('#gateTop'), back = $('#gateBack'), ask = $('#gatePick .gate__ask');
        t = absTop(top) + top.offsetHeight + gap;
        const lowest = Math.min(absTop(chooseBox), absTop(back) || Infinity, ask ? absTop(ask) : Infinity);
        b = H - lowest + gap; x = W * (phone ? .06 : tablet ? .08 : .29);
      }
      root.style.setProperty('--vf-t', Math.round(t) + 'px'); root.style.setProperty('--vf-b', Math.round(Math.max(b, 12)) + 'px'); root.style.setProperty('--vf-x', Math.round(x) + 'px');
    };
    let rz = 0;
    addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (document.body.classList.contains('is-gated')) lockSizes(); fitFrame(); }); });
    if (document.fonts) document.fonts.ready.then(() => { lockSizes(); fitFrame(); });
    const intent = $('#gateIntent');
    const step = s => {
      // going to "explore": the old buttons fade out first, then the frame moves (see the CSS for the full order)
      gate.dataset.step = s; document.documentElement.classList.toggle('vf-fast', s === 'intent'); if (s === 'intent') setTimeout(fitFrame, 120); else fitFrame();
      $('#gatePick').inert = s !== 'pick'; hello.inert = s !== 'hello'; intent.inert = s !== 'intent';
      requestAnimationFrame(() => (s === 'pick' ? suggestedBtn : s === 'intent' ? $('.gate__opt--all') : $('#gateContinue')).focus({ preventScroll: true }));
    };
    gate.addEventListener('gate:step', e => {
      clearInterval(cycleT); greet(chosen); $$('.gate__opt span, #gateQ').forEach(n => (n.textContent = t(n.dataset.i18n)));
      intent.lang = chosen; intent.dir = chosen === 'ar' ? 'rtl' : 'ltr'; step(e.detail);
    });
    $('#gateContinue').addEventListener('click', () => choose(btns.find(b => b.dataset.lang === cur) || btns[0]));
    $('#gateChange').addEventListener('click', () => step('pick'));
    $('#gateBack').addEventListener('click', () => step('hello'));
    step('hello');
    // the suggested language goes first in the row on small screens, and gets focus so Enter accepts it
  }

  /* ---------- top bar ---------- */
  const langBtn = $('#langBtn'), langMenu = $('#langMenu'), menuBtn = $('#menuBtn'), nav = $('#nav');
  langBtn.addEventListener('click', () => { const open = langMenu.hidden; langMenu.hidden = !open; langBtn.setAttribute('aria-expanded', String(open)); if (open) langMenu.querySelector('button').focus(); });
  $$('#langMenu button').forEach(b => b.addEventListener('click', () => { applyLang(b.dataset.lang); langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); langBtn.focus(); }));
  document.addEventListener('click', e => { if (!langMenu.hidden && !e.target.closest('.bar__lang')) { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); } });
  menuBtn.addEventListener('click', () => { const open = !document.body.classList.contains('menu-open'); document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); }));
  let solid = null;
  const onScroll = () => { const on = scrollY > innerHeight * 0.6; if (on !== solid) { solid = on; bar.classList.toggle('is-solid', on); } };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- hero video ---------- */
  const heroVideo = $('#heroVideo'), heroPause = $('#heroPause');
  function syncHeroPause() { const paused = heroVideo.paused; heroPause.setAttribute('aria-pressed', String(paused)); heroPause.querySelector('.sr').textContent = t(paused ? 'playHero' : 'pauseHero'); heroPause.classList.toggle('is-paused', paused); }
  heroPause.addEventListener('click', () => { heroVideo.paused ? heroVideo.play() : heroVideo.pause(); syncHeroPause(); });
  if (reduceMotion) heroVideo.removeAttribute('autoplay'), heroVideo.pause();
  heroVideo.addEventListener('play', syncHeroPause); heroVideo.addEventListener('pause', syncHeroPause);
  // the header video only plays while it is on screen (no decoding for nobody)
  // starting a video makes the graphics chip set up a decoder (~0.1 s); never do that mid-scroll, wait for the page to settle
  let lastScroll = 0; addEventListener('scroll', () => (lastScroll = performance.now()), { passive: true });
  const afterScroll = window.afterScroll = fn => { const wait = () => (performance.now() - lastScroll > 200 ? fn() : setTimeout(wait, 120)); wait(); };
  let heroVisible = true;
  const heroResume = () => afterScroll(() => { if (heroVisible && !reduceMotion && !heroPause.classList.contains('user-paused') && !$('#player').open) heroVideo.play().catch(() => {}); });
  // pause the header video once half of it has scrolled away, so it never decodes at the same time as the film previews
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { heroVisible = es[0].intersectionRatio >= .5; if (!heroVisible) heroVideo.pause(); else heroResume(); }, { threshold: [0, .5] }).observe($('.hero'));

  /* ---------- player ---------- */
  const player = $('#player'), pMedia = $('#playerMedia');
  let lastFocus = null;
  function openPlayer(item, kind) {
    // YouTube refuses to play inside a page opened as a file (no web address), so open it on YouTube instead
    if (item.youtube && !/^https?:$/.test(location.protocol)) { window.open('https://www.youtube.com/watch?v=' + item.youtube, '_blank', 'noopener'); return; }
    lastFocus = document.activeElement;
    pMedia.innerHTML = '';
    player.classList.toggle('is-vertical', kind === 'vertical');
    if (item.youtube || item.driveVideo) {
      const f = el('iframe'); f.src = item.youtube ? `https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0&playsinline=1` : `https://drive.google.com/file/d/${item.driveVideo}/preview`; f.referrerPolicy = 'strict-origin-when-cross-origin'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = tx(item.title);
      pMedia.append(f);
    } else {
      const v = el('video'); v.src = D.V + item.slug + '.mp4'; v.poster = D.V + item.slug + '.webp'; v.controls = true; v.autoplay = true; v.playsInline = true;
      pMedia.append(v);
    }
    $('#playerClient').textContent = [clientName(item.client), item.dur].filter(Boolean).join('  /  ');
    $('#playerTitle').textContent = tx(item.title);
    player.showModal();
    heroVideo.pause();
    window.stat && window.stat('play/' + item.slug, tx(item.title));
  }
  function closePlayer() { pMedia.innerHTML = ''; player.close(); }
  player.addEventListener('close', () => { pMedia.innerHTML = ''; heroResume(); lastFocus && lastFocus.focus(); });
  $('#playerClose').addEventListener('click', closePlayer);
  player.addEventListener('click', e => { if (e.target === player) closePlayer(); });
  heroPause.addEventListener('click', () => heroPause.classList.toggle('user-paused', heroVideo.paused));

  /* ---------- showreel: the hero's main button plays it in the same player as the films ---------- */
  const reelTitle = () => Object.fromEntries(Object.keys(window.I18N).map(l => [l, window.I18N[l].reelTitle]));
  $('#reelBtn').addEventListener('click', () => openPlayer({ slug: 'showreel', title: reelTitle(), dur: '1:22' }));

  /* ---------- WhatsApp button on phones: appears once the visitor scrolls past the hero ---------- */
  const waFloat = $('#waFloat');
  let tipShown = false;
  new IntersectionObserver(es => {
    const show = !es[0].isIntersecting; waFloat.classList.toggle('is-shown', show);
    // the first time it appears, the bubble says hello for a few seconds
    if (show && !tipShown) { tipShown = true; setTimeout(() => { waFloat.classList.add('tip-on'); setTimeout(() => waFloat.classList.remove('tip-on'), 5000); }, 1800); }
  }, { threshold: .15 }).observe($('#top'));

  /* ---------- films screen ---------- */
  let filmIdx = 0;
  const playlist = $('#playlist'), poster = $('#screenPoster'), stage = $('.screen__stage');
  // one preloaded <video> per film, so hovering a title starts its preview instantly
  const filmHasPreview = f => f.preview || (!f.youtube && !f.drive && !f.driveVideo);
  const pv = {};
  const filmPreview = f => {
    if (!pv[f.slug]) {
      const v = el('video', 'screen__preview'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('aria-hidden', 'true');
      // big or sharp screens get the 1080p preview (falls back to the small one if a film has none); only metadata until it is shown
      const sd = D.V + f.slug + '-preview.mp4';
      v.preload = 'none'; v.src = !lite && stage.clientWidth * (devicePixelRatio || 1) > 1100 ? D.V + f.slug + '-preview-hd.mp4' : sd;
      v.addEventListener('error', () => { if (!v.src.endsWith(sd)) { v.src = sd; if (shown === v) v.play().catch(() => {}); } });
      pv[f.slug] = v; stage.insertBefore(v, $('#screenPlay'));
    }
    return pv[f.slug];
  };
  let shown = null;
  $('#screenPreview').remove();
  if (!reduceMotion && 'IntersectionObserver' in window) {
    // creating every preview player at once made the scroll stall; prepare the first one, then the rest one by one when idle
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 300));
    const warm = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return; warm.disconnect();
      if (lite) return; // on touch screens only the selected film's preview is ever loaded
      const rest = D.FILMS.filter(filmHasPreview); filmPreview(D.FILMS[filmIdx] && filmHasPreview(D.FILMS[filmIdx]) ? D.FILMS[filmIdx] : rest[0]);
      const next = () => afterScroll(() => { const f = rest.find(x => !pv[x.slug]); if (f) { filmPreview(f); setTimeout(() => idle(next, { timeout: 2000 }), 400); } });
      setTimeout(() => idle(next, { timeout: 2000 }), 1200);
    }, { rootMargin: '600px 0px' });
    warm.observe($('#films'));
    // pause the film preview while the films screen is off screen
    let stageIn = false;
    new IntersectionObserver(es => { stageIn = es[0].intersectionRatio >= .45; if (!shown) return; if (stageIn) afterScroll(() => { if (stageIn && shown) shown.play().catch(() => {}); }); else shown.pause(); }, { threshold: [0, .45] }).observe(stage);
  }
  function renderFilms() {
    playlist.innerHTML = '';
    D.FILMS.forEach((f, i) => {
      const li = el('li'), b = el('button', 'playlist__item');
      b.innerHTML = `<span class="playlist__title">${esc(tx(f.title))}</span><span class="playlist__meta">${esc(tx(D.TYPE[f.type]))}${f.dur ? `<span dir="ltr">${f.dur}</span>` : ''}</span>`;
      b.addEventListener('click', () => selectFilm(i, true));
      if (hoverable) b.addEventListener('mouseenter', () => selectFilm(i, false));
      li.append(b); playlist.append(li);
    });
    selectFilm(filmIdx, false);
  }
  function selectFilm(i, fromClick) {
    filmIdx = i; const f = D.FILMS[i];
    $$('.playlist__item').forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
    $('#screenTitle').textContent = tx(f.title);
    $('#screenClient').textContent = clientName(f.client) || tx(D.TYPE[f.type]);
    $('#screenDesc').textContent = tx(f.desc);
    const posterSrc = f.poster === undefined ? D.V + f.slug + '.webp' : f.poster;
    $('.screen__stage').classList.toggle('is-blank', !posterSrc);
    const still = !filmHasPreview(f); stage.classList.remove('is-still'); if (still) { void stage.offsetWidth; stage.classList.add('is-still'); }
    if (posterSrc) { poster.onerror = () => $('.screen__stage').classList.add('is-blank'); poster.src = posterSrc; poster.alt = tx(f.title); } else { poster.removeAttribute('src'); poster.alt = ''; }
    if (shown) {
      shown.pause(); shown.classList.remove('is-on');
      // phones: free the old preview's video decoder instead of keeping every film loaded
      if (lite) { const old = shown, slug = Object.keys(pv).find(k => pv[k] === old); setTimeout(() => { old.removeAttribute('src'); old.load(); old.remove(); }, 500); if (slug) delete pv[slug]; }
      shown = null;
    }
    if (filmHasPreview(f) && !reduceMotion) {
      const v = filmPreview(f);
      shown = v; v.preload = 'auto';
      const reveal = () => { if (shown === v) v.classList.add('is-on'); };
      if (v.readyState >= 2) reveal(); else { v.addEventListener('canplay', reveal, { once: true }); v.addEventListener('playing', reveal, { once: true }); }
      afterScroll(() => { if (shown === v) v.play().catch(() => {}); });
    }
    $('#screenPlayLabel').textContent = f.drive ? t('openDrive') : f.type === 'podcast' ? t('watchYoutube') : t('playFilm');
    $('#screenPlay').classList.toggle('is-external', !!f.drive);
    if (fromClick && innerWidth < 900) $('.screen__stage').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }
  $('#screenPlay').addEventListener('click', () => { const f = D.FILMS[filmIdx]; if (f.drive) window.open(f.drive, '_blank', 'noopener'); else openPlayer(f, 'horizontal'); });

  /* ---------- vertical cards (on camera + reels) ---------- */
  // prepare reel previews one at a time when the browser is idle, never all at once
  const idleQ = []; let idleBusy = false;
  const idle = fn => { idleQ.push(fn); if (idleBusy) return; idleBusy = true; const run = () => { const f = idleQ.shift(); if (!f) { idleBusy = false; return; } f(); (window.requestIdleCallback || (cb => setTimeout(cb, 120)))(run, { timeout: 600 }); }; (window.requestIdleCallback || (cb => setTimeout(cb, 120)))(run, { timeout: 600 }); };
  function vcard(item) {
    const b = el('button', 'vcard');
    b.innerHTML = `<span class="vcard__media"><img src="${D.V + item.slug}.webp" alt="" loading="lazy"></span><span class="vcard__cap"><span class="vcard__title">${esc(tx(item.title))}</span><span class="vcard__dur" dir="ltr">${item.dur}</span></span><span class="sr">${esc(t('play'))}</span>`;
    let v = null, want = false;
    const make = () => { if (!v) { v = el('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.src = D.V + item.slug + '-preview.mp4'; b.firstElementChild.append(v); } };
    const start = () => { if (reduceMotion) return; want = true; make(); v.preload = 'auto'; const show = () => { b.classList.remove('is-loading'); if (want) b.classList.add('is-playing'); }; if (v.readyState >= 2) show(); else { b.classList.add('is-loading'); v.addEventListener('canplay', show, { once: true }); v.addEventListener('playing', show, { once: true }); } afterScroll(() => { if (want) v.play().catch(() => {}); }); };
    const stop = () => { want = false; if (v) { v.pause(); b.classList.remove('is-playing', 'is-loading'); } };
    // on mouse devices, load the preview as soon as the card is on screen so hover starts instantly
    if (hoverable && !reduceMotion && 'IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { idle(make); io.disconnect(); } }, { rootMargin: '200px 0px' }); io.observe(b); }
    if (hoverable) { b.addEventListener('mouseenter', start); b.addEventListener('mouseleave', stop); }
    b.addEventListener('focus', start); b.addEventListener('blur', stop);
    b.addEventListener('click', () => { stop(); openPlayer(item, 'vertical'); });
    return b;
  }
  const spotItem = D.REELS.find(r => r.slug === D.SPOTLIGHT.slug);
  function renderSpot() {
    if (!spotItem) { $('#spot').hidden = true; return; }
    $('#spotPoster').src = D.V + spotItem.slug + '.webp'; $('#spotPoster').alt = tx(spotItem.title);
    $('#spotTitle').textContent = tx(spotItem.title); $('#spotDesc').textContent = tx(D.SPOTLIGHT.desc);
    $('#spotCredits').textContent = tx(D.SPOTLIGHT.credits); $('#spotClient').textContent = clientName(spotItem.client); $('#spotDur').textContent = spotItem.dur;
  }
  { const sv = $('#spotPreview'), sm = $('#spotPlay');
    const go = () => { if (reduceMotion) return; if (!sv.src) sv.src = D.V + D.SPOTLIGHT.slug + '-preview.mp4'; afterScroll(() => sv.play().then(() => sm.classList.add('is-playing')).catch(() => {})); };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) go(); else { sv.pause(); sm.classList.remove('is-playing'); } }), { threshold: .4 }).observe(sm);
    const open = () => spotItem && openPlayer(spotItem, 'vertical'); sm.addEventListener('click', open); $('#spotBtn').addEventListener('click', open); }
  let reelFilter = 'all';
  function chips(container, items, current, onPick) {
    container.innerHTML = '';
    items.forEach(([id, label, n]) => { const c = el('button', 'chip', `${esc(label)}<span class="chip__n">${n}</span>`); c.setAttribute('aria-pressed', String(id === current)); c.addEventListener('click', () => onPick(id)); container.append(c); });
  }
  function renderReelChips() {
    const label = g => (I.en['grp.' + g] ? t('grp.' + g) : clientName(g));
    chips($('#reelChips'), [['all', t('all'), D.REELS.length], ...D.REEL_GROUPS.map(g => [g, label(g), D.REELS.filter(r => r.group === g).length]).filter(c => c[2])], reelFilter, id => { reelFilter = id; renderReelChips(); renderReels(); });
  }
  let reelsOpen = false; const REEL_LIMIT = 12;
  function renderReels() {
    const g = $('#reelGrid'); g.innerHTML = '';
    const list = D.REELS.filter(r => reelFilter === 'all' || r.group === reelFilter);
    (reelFilter === 'all' && !reelsOpen ? list.slice(0, REEL_LIMIT) : list).forEach(r => g.append(vcard(r)));
    const m = $('#reelMore'); m.hidden = !(reelFilter === 'all' && list.length > REEL_LIMIT); m.textContent = reelsOpen ? t('showLessReels') : t('showMoreReels');
  }
  $('#reelMore').addEventListener('click', () => { reelsOpen = !reelsOpen; renderReels(); if (!reelsOpen) $('#reelChips').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); });

  /* ---------- photo wall ---------- */
  let photoFilter = 'all', expanded = false, visible = [];
  const LIMIT = 20;
  function renderPhotoChips() {
    // the cover photo opens the gallery, so it counts towards All and its own category
    const withCover = [...Object.values(D.COVERS || {}), ...D.PHOTOS];
    chips($('#photoChips'), [['all', t('all'), withCover.length], ...D.CATS.map(c => [c, t('cat.' + c), withCover.filter(p => p.cat === c).length])], photoFilter, id => { photoFilter = id; expanded = false; renderPhotoChips(); renderWall(); });
  }
  // tile rhythm in a 4-column grid: big 2x2, wide 2x1, small 1x1 (dense packing keeps rows full)
  const SHAPE = ['big', 's', 's', 's', 's', 's', 's', 'wide', 'wide', 'big', 's', 's'];
  const phoneWall = matchMedia('(max-width: 760px)');
  // the rhythm above, except that the last few tiles are resized so the wall always ends on a full row (no holes)
  function wallShapes(n) {
    const cols = phoneWall.matches ? 2 : 4, dim = phoneWall.matches ? { s: [1, 1], wide: [2, 2], big: [2, 2] } : { s: [1, 1], wide: [2, 1], big: [2, 2] };
    const holes = shapes => { // same placement as CSS grid "dense": each tile goes in the first free spot from the top
      const used = []; let last = 0;
      const free = (r, c, w, h) => { if (c + w > cols) return false; for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (used[y * cols + x]) return false; return true; };
      for (const s of shapes) { const [w, h] = dim[s]; let r = 0, c = 0;
        while (!free(r, c, w, h)) { c++; if (c >= cols) { c = 0; r++; } }
        for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) used[y * cols + x] = 1; last = Math.max(last, r + h); }
      let empty = 0; for (let i = 0; i < last * cols; i++) if (!used[i]) empty++; return empty;
    };
    const base = Array.from({ length: n }, (_, i) => SHAPE[i % SHAPE.length]);
    if (!n || !holes(base)) return base;
    const k = Math.min(4, n), opts = ['s', 'wide', 'big']; let best = base, bestScore = Infinity;
    for (let m = 0; m < 3 ** k; m++) {
      const tail = Array.from({ length: k }, (_, j) => opts[Math.floor(m / 3 ** j) % 3]), cand = base.slice(0, n - k).concat(tail);
      const score = holes(cand) * 100 + tail.filter((s, j) => s !== base[n - k + j]).length;
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    return best;
  }
  phoneWall.addEventListener('change', () => renderWall());
  function renderWall() {
    const wall = $('#wall'); wall.innerHTML = '';
    const covers = D.COVERS || {};
    // the big photo on top: Events' cover for "All", otherwise the category's own cover
    const leadP = photoFilter === 'all' ? D.COVER : covers[photoFilter] || null;
    const pool = D.PHOTOS.filter(p => photoFilter === 'all' || p.cat === photoFilter);
    // in "All", the other categories' covers join the wall, spread through it
    if (photoFilter === 'all') Object.values(covers).filter(c => c !== leadP).forEach((c, k) => pool.splice(Math.min(pool.length, 3 + k * 9), 0, c));
    const showCover = !!leadP;
    visible = showCover ? [leadP, ...pool] : pool;
    const lead = $('#lead'); lead.hidden = !showCover;
    if (showCover) {
      const img = $('#leadImg'); img.alt = t('cat.' + leadP.cat);
      $('#leadCat').textContent = t('cat.' + leadP.cat); $('#leadTitle').textContent = t('cat.' + leadP.cat);
      if (lead.dataset.cat !== leadP.id) {
        const id = leadP.id, SIZES = '(max-width: 1500px) 100vw, 1440px', SET = `${leadP.sm} 1400w, ${leadP.lg} 2400w`;
        lead.dataset.cat = id;
        // on a slow connection: the small copy shows at once (softly blurred), the sharp photo swaps in once it has arrived
        img.loading = 'eager'; img.removeAttribute('srcset'); img.src = leadP.xs; lead.classList.add('is-loading');
        const hi = new Image(); hi.fetchPriority = 'high'; hi.sizes = SIZES; hi.srcset = SET; hi.src = leadP.sm;
        const done = () => { if (lead.dataset.cat !== id) return; img.sizes = SIZES; img.srcset = SET; img.src = leadP.sm; lead.classList.remove('is-loading'); };
        (hi.decode ? hi.decode() : new Promise((ok, no) => { hi.onload = ok; hi.onerror = no; })).then(done, done);
        // replay the reveal each time the category changes
        lead.classList.remove('is-swap'); void lead.offsetWidth; lead.classList.add('is-swap');
      }
    }
    const shown = !expanded ? pool.slice(0, LIMIT) : pool;
    const shapes = wallShapes(shown.length);
    shown.forEach((p, i) => {
      const b = el('button', 'tile tile--' + shapes[i] + (p.r < 1 ? ' tile--portrait' : ''));
      const shape = shapes[i], sizes = shape === 'big' ? '(max-width: 760px) 100vw, 50vw' : shape === 'wide' ? '(max-width: 760px) 100vw, 50vw' : '(max-width: 760px) 50vw, 25vw';
      b.innerHTML = `<img src="${p.xs}" srcset="${p.xs} 800w, ${p.sm} 1400w" sizes="${sizes}" alt="${esc(t('cat.' + p.cat))}" loading="lazy" decoding="async"><span class="tile__cat">${esc(t('cat.' + p.cat))}</span>`;
      const idx = i + (showCover ? 1 : 0);
      b.setAttribute('aria-label', `${t('cat.' + p.cat)}. ${t('photoOf').replace('{n}', idx + 1).replace('{t}', visible.length)}`);
      b.addEventListener('click', () => openLightbox(idx));
      // each photo fades in when it has arrived (instead of popping in over a grey box)
      const im = b.firstElementChild, ok = () => im.classList.add('is-ok');
      if (im.complete && im.naturalWidth) ok(); else { im.addEventListener('load', ok, { once: true }); im.addEventListener('error', ok, { once: true }); }
      wall.append(b);
    });
    $('#photoCount').textContent = t('nPhotos').replace('{n}', visible.length);
    const more = $('#moreBtn');
    more.hidden = pool.length <= LIMIT;
    more.textContent = expanded ? t('showLess') : t('showMore');
  }
  $('#leadBtn').addEventListener('click', () => openLightbox(0));
  // when Photography comes near, fetch the small copy of each category's cover, so a category opens at once
  if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect();
    const go = () => Object.values(D.COVERS || {}).forEach(c => { const i = new Image(); i.src = c.xs; });
    'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 600); }, { rootMargin: '1500px 0px' }).observe($('#photos'));
  // the header photo's reveal waits until it is actually on screen
  if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { $('#lead').classList.add('is-seen'); o.disconnect(); } }, { threshold: .25 }).observe($('#lead')); else $('#lead').classList.add('is-seen');
  $('#moreBtn').addEventListener('click', () => { expanded = !expanded; renderWall(); if (!expanded) $('#photos').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  let lbIdx = 0;
  const big = () => innerWidth * (devicePixelRatio || 1) > 1500;
  function showPhoto(i) {
    lbIdx = (i + visible.length) % visible.length; const p = visible[lbIdx];
    lbImg.classList.remove('is-loaded'); lbImg.sizes = '100vw'; lbImg.srcset = `${p.sm} 1400w, ${p.lg} 2400w`; lbImg.src = big() ? p.lg : p.sm; lbImg.alt = t('cat.' + p.cat);
    $('#lbCap').textContent = `${t('cat.' + p.cat)}   ${t('photoOf').replace('{n}', lbIdx + 1).replace('{t}', visible.length)}`;
    [visible[lbIdx + 1], visible[lbIdx - 1]].forEach(n => { if (n) new Image().src = big() ? n.lg : n.sm; });
  }
  lbImg.addEventListener('load', () => lbImg.classList.add('is-loaded'));
  function openLightbox(i) { lastFocus = document.activeElement; showPhoto(i); lb.showModal(); }
  const step = d => showPhoto(lbIdx + (document.documentElement.dir === 'rtl' ? -d : d));
  $('#lbPrev').addEventListener('click', () => step(-1)); $('#lbNext').addEventListener('click', () => step(1));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('close', () => lastFocus && lastFocus.focus());
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__fig')) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  let tx0 = null;
  lb.addEventListener('touchstart', e => (tx0 = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', e => { if (tx0 == null) return; const dx = e.changedTouches[0].clientX - tx0; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx0 = null; });

  /* ---------- clients ---------- */
  function renderClients() {
    const ul = $('#clientList'); ul.innerHTML = '';
    Object.entries(D.CLIENT_INFO).forEach(([id, info]) => {
      const c = D.CLIENTS[id], li = el('li', 'client');
      li.innerHTML = `<span class="client__logo"><img src="${c.logo}" alt="${esc(tx(c.name))}" loading="lazy"></span>
        <div class="client__head"><h3 class="client__name">${esc(tx(c.name))}</h3><p class="client__role">${esc(tx(info.role))}</p></div>
        <div class="client__body"><p class="client__work">${esc(tx(info.summary))}</p>
          <ul class="client__tags">${info.services.map(s => `<li>${esc(tx(s))}</li>`).join('')}</ul></div>`;
      const link = D.CLIENT_FILM[id] || '';
      if (link.startsWith('reels:') || D.FILMS.some(f => f.slug === link)) {
        const go = el('button', 'client__go', esc(t('seeWork')));
        go.addEventListener('click', () => {
          if (link.startsWith('reels:')) { reelFilter = link.slice(6); renderReelChips(); renderReels(); $('#reels').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
          const i = D.FILMS.findIndex(f => f.slug === link); selectFilm(i, false);
          $('#films').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
          setTimeout(() => $$('.playlist__item')[i].focus({ preventScroll: true }), reduceMotion ? 0 : 700);
        });
        li.querySelector('.client__body').append(go);
      }
      ul.append(li);
    });
  }

  /* ---------- menu: highlight the link of the section in the middle of the screen ---------- */
  {
    const OWNER = { films: 'films', reels: 'reels', cases: 'reels', grade: 'reels', snow: 'photos', photos: 'photos', clients: 'about', about: 'about', services: 'about', contact: 'contact' };
    const links = $$('#nav a[href^="#"]'), mark = id => links.forEach(l => l.classList.toggle('is-here', !!id && l.getAttribute('href') === '#' + id));
    // a thin line across the middle of the screen: whichever section crosses it owns the menu
    const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) mark(OWNER[e.target.id]); }), { rootMargin: '-45% 0px -54% 0px' });
    ['top', ...Object.keys(OWNER)].forEach(id => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- case studies ---------- */
  function renderCases() {
    const box = $('#caseList'); if (!box) return; box.innerHTML = '';
    D.CASES.forEach((cs, k) => {
      const c = D.CLIENTS[cs.client], film = s => D.FILMS.find(f => f.slug === s), reels = D.REELS.filter(r => r.client === cs.client);
      const art = el('article', 'case' + (k % 2 ? ' case--flip' : ''));
      art.innerHTML = `<header class="case__head"><span class="case__logo"><img src="${c.logo}" alt="" loading="lazy"></span>
          <div><p class="case__client">${esc(tx(c.name))}</p><h3 class="case__title">${esc(tx(cs.title))}</h3></div></header>
        <div class="case__grid">
          <button class="case__media" type="button"><img src="${D.V + cs.cover}.webp" alt="" loading="lazy"><span class="case__play"><span class="sr">${esc(t('casePlay'))}</span></span></button>
          <div class="case__text"><h4 class="case__h">${esc(t('caseBrief'))}</h4><p class="case__brief">${esc(tx(cs.brief))}</p>
            <h4 class="case__h">${esc(t('caseDid'))}</h4><ul class="case__did">${cs.did.map(d => `<li>${esc(tx(d))}</li>`).join('')}</ul></div>
        </div>
        <h4 class="case__h">${esc(t('caseBts'))}</h4>
        <div class="case__bts">${cs.bts.map(([src, cap]) => `<figure><img src="${src}" alt="${esc(tx(cap))}" loading="lazy" width="1200" height="900"><figcaption>${esc(tx(cap))}</figcaption></figure>`).join('')}</div>
        <h4 class="case__h">${esc(t('caseResult'))}</h4><ul class="case__out"></ul>`;
      art.querySelector('.case__media').addEventListener('click', () => openPlayer(film(cs.play), 'horizontal'));
      const out = art.querySelector('.case__out');
      cs.films.map(film).filter(Boolean).forEach(f => {
        const b = el('button', 'case__item'); b.type = 'button';
        b.innerHTML = `<span class="case__item-play" aria-hidden="true"></span><span>${esc(tx(f.title))}</span><small dir="ltr">${esc(f.dur || '')}</small>`;
        b.addEventListener('click', () => openPlayer(f, 'horizontal')); { const li = el('li'); li.append(b); out.append(li); }
      });
      if (reels.length) {
        const b = el('button', 'case__item case__item--reels'); b.type = 'button';
        b.innerHTML = `<span class="case__item-play" aria-hidden="true"></span><span>${esc(t('caseReels').replace('{n}', reels.length))}</span>`;
        b.addEventListener('click', () => { reelFilter = reels.every(r => r.group === reels[0].group) ? reels[0].group : 'all'; renderReelChips(); renderReels(); $('#reels').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
        { const li = el('li'); li.append(b); out.append(li); }
      }
      box.append(art);
    });
  }

  /* ---------- contact composer ---------- */
  function renderTypes() { const s = $('#fTypeSel'), cur = s.selectedIndex; s.innerHTML = t('fTypes').map(o => `<option>${esc(o)}</option>`).join(''); s.selectedIndex = Math.max(0, cur); }
  // "Send message" delivers straight to Nazih's inbox through Web3Forms (D.FORM_KEY in data.js);
  // "Send on WhatsApp" opens WhatsApp with the message written out
  let via = 'send', sending = false;
  $$('#composer button[type=submit]').forEach(b => b.addEventListener('click', () => (via = b.value)));
  const err = $('#composerErr'), ok = $('#composerOk'), sendBtn = $('#composerSend');
  // success: the form steps back and the thank-you plays over it (words split so they can rise one by one)
  const words = (s, from) => s.split(' ').map((w, k) => `<span class="sent__w" style="--i:${from + k}">${esc(w)}</span>`).join(' ');
  function showSent() {
    const form = $('#composer');
    $('#sentTitle').innerHTML = words(t('sentTitle'), 0); $('#sentBody').innerHTML = words(t('sentBody'), 2);
    ok.hidden = false; form.classList.remove('is-sent'); void form.offsetWidth; form.classList.add('is-sent');
    [...form.elements].forEach(n => { if (!n.closest('.sent')) n.tabIndex = -1; });
    ok.focus({ preventScroll: true });
  }
  $('#sentAgain').addEventListener('click', () => {
    const form = $('#composer'); form.classList.remove('is-sent'); ok.hidden = true;
    [...form.elements].forEach(n => { if (!n.closest('.sent') && n.name !== 'botcheck') n.removeAttribute('tabindex'); });
    form.name.focus();
  });
  const fail = (field, key) => { err.textContent = t(key); err.hidden = false; if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); } };
  $('#composer').addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    const f = e.target, msg = f.msg.value.trim(), name = f.name.value.trim(), contact = f.contact.value.trim();
    ok.hidden = true; err.hidden = true; [f.msg, f.contact].forEach(n => n.removeAttribute('aria-invalid'));
    if (!msg) return fail(f.msg, 'fErr');
    const body = [t('msgHello'), '', msg, '', name ? `${t('msgFrom')}: ${name}` : '', contact ? `${t('fContact')}: ${contact}` : '', `${t('msgType')}: ${f.type.value}`].filter((l, i, a) => l || a[i - 1]).join('\n');
    if (via === 'wa') { window.open('https://wa.me/213779072740?text=' + encodeURIComponent(body), '_blank', 'noopener'); return; }
    if (!contact) return fail(f.contact, 'fContactErr');
    if (!D.FORM_KEY) { location.href = `mailto:nazihhtalbi@gmail.com?subject=${encodeURIComponent(t('mailSubject') + ': ' + f.type.value)}&body=${encodeURIComponent(body)}`; return; }
    sending = true; sendBtn.disabled = true; sendBtn.textContent = t('sending');
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: D.FORM_KEY, subject: `${t('mailSubject')}: ${f.type.value}${name ? ' (' + name + ')' : ''}`, from_name: name || 'Portfolio visitor',
          name, contact, ...(/@/.test(contact) ? { email: contact } : {}), project_type: f.type.value, message: msg, language: document.documentElement.lang, botcheck: f.botcheck.checked }),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || res.success === false) throw new Error(res.message || r.status);
      f.reset(); renderTypes(); showSent(); window.stat && window.stat('message-sent', 'Contact form sent');
    } catch { fail(null, 'sendFail'); }
    finally { sending = false; sendBtn.disabled = false; sendBtn.textContent = t('send'); }
  });
  $$('#composer textarea, #composer input').forEach(n => n.addEventListener('input', () => { if (n.value.trim()) { err.hidden = true; n.removeAttribute('aria-invalid'); } }));

  $('#year').textContent = new Date().getFullYear();

  /* ---------- start ---------- */
  applyLang((window.LANG_START && window.LANG_START.lang) || 'en');
  initGate();
})();
