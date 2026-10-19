/* Mini Nazih: a small illustrated Nazih that lives on the edge of the screen and watches the work with the visitor.
   - flies in after the hero, leans into the scroll and trails gold sparks
   - alive when idle: drifts up and down, looks around, blinks
   - when the visitor hovers or stops on a film, reel or photo, he flies level with it, turns to it and takes
     a photo of it (camera up, flash, sparks)
   - a tap: he says hello in the visitor's language; near Contact he points to WhatsApp once
   - only animates while something happens; still and spark-free for visitors who ask for reduced motion */
(() => {
  const $ = s => document.querySelector(s);
  // the big Nazih beside the name leans a little towards the pointer (mouse only, not for reduced motion)
  const big = $('.hero__me');
  // phones: he stands behind the end of the name, so the name's distance from the bottom of the first screen is measured
  const title = $('.hero__title'), heroEl = $('#top');
  // on the welcome screen he stands beside "Hey, I'm Nazih": its position is measured too, so he sits right next to it on any phone
  const hey = $('#gate-name');
  const placeBig = () => { if (!big || !heroEl) return; const hb = heroEl.getBoundingClientRect().bottom;
    if (title) { const r = title.getBoundingClientRect(); big.style.setProperty('--name-b', Math.round(hb - r.bottom) + 'px'); big.style.setProperty('--name-t', Math.round(hb - r.top) + 'px'); }
    if (hey && document.body.classList.contains('is-gated')) { const r = hey.getBoundingClientRect(); if (r.height) big.style.setProperty('--hey-b', Math.round(hb - r.bottom) + 'px'); } };
  placeBig(); addEventListener('resize', placeBig); addEventListener('load', placeBig); if (document.fonts) document.fonts.ready.then(placeBig);
  setTimeout(placeBig, 600); setTimeout(placeBig, 1800);
  if (big && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let raf = 0;
    addEventListener('pointermove', e => { if (raf || scrollY > innerHeight) return; raf = requestAnimationFrame(() => { raf = 0;
      big.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3)); big.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3)); }); }, { passive: true });
  }
  const box = $('#buddy'); if (!box) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover)').matches, lite = !hover || innerWidth <= 760;
  const me = box.querySelector('.buddy__me'), say = box.querySelector('.buddy__say'), cv = box.querySelector('.buddy__trail'), g = cv.getContext('2d');
  const T = k => { const I = window.I18N || {}, l = document.documentElement.lang; return (I[l] && I[l][k]) || (I.en && I.en[k]) || ''; };
  const WORK = '.playlist__item, .screen__stage, .vcard, .spot__media, .tile, .lead, .case__media, .case__bts figure, .snow__frame, .cmp';

  // poses from his character sheet: one sprite, one cell per pose (front, turnaround, wave, arms crossed, walk, wow, joy)
  const F = { camera: 0, crossed: 1, q3: 2, left: 3, right: 4, back: 5, q3back: 6, wave: 7, walk: 8, wow: 9, present: 10 };
  const img = me.querySelector('img'), sheet = ((img && img.getAttribute('src')) || 'assets/media/site/mini-nazih.svg').replace(/mini-nazih\.svg$/, 'mini-sprite.webp');
  // two layers: a new pose fades in over the last one, so he changes smoothly instead of jumping
  me.innerHTML = '<span class="buddy__bob"><span class="buddy__pose is-shown"></span><span class="buddy__pose"></span></span>';
  const layers = [...me.querySelectorAll('.buddy__pose')]; let front = 0, cur = '';
  layers.forEach(l => { l.style.backgroundImage = `url("${sheet}")`; });
  const show = (name, flip) => {
    const key = name + (flip ? '-' : '+'); if (key === cur) return; cur = key;
    const next = layers[1 - front]; next.style.setProperty('--f', F[name]); next.style.setProperty('--flip', flip ? -1 : 1);
    next.classList.add('is-shown'); layers[front].classList.remove('is-shown'); front = 1 - front; };
  // the page is on his left when he stands on the right edge (and the other way round in Arabic)
  const toPage = () => document.documentElement.dir !== 'rtl';
  let idlePose = 'camera', busy = false, seqT = [];
  const rest = () => { if (busy) return;
    // talking: he presents the section with an open hand towards the page; watching: he turns to the work
    if (box.classList.contains('is-talking')) show('present', !toPage());
    else if (box.classList.contains('is-watching')) show('q3', toPage()); else show(idlePose); };
  // a short sequence of poses, then back to rest
  const play = (frames, step = 110, hold = 0) => {
    seqT.forEach(clearTimeout); seqT = []; busy = true; me.classList.toggle('is-quick', frames.length > 1 && step < 200);
    frames.forEach(([n, fl], i) => seqT.push(setTimeout(() => show(n, fl), i * step)));
    seqT.push(setTimeout(() => { busy = false; me.classList.remove('is-quick'); rest(); }, (frames.length - 1) * step + step + hold));
  };
  const wave = () => play([['wave', toPage()]], 0, 1700);
  // a real turn on the spot, through the turnaround views of the sheet
  const spin = () => play([['camera'], ['q3'], ['left'], ['q3back'], ['back'], ['q3back', true], ['right'], ['q3', true], ['camera']], 95);
  new MutationObserver(rest).observe(box, { attributes: true, attributeFilter: ['class'] });
  show('camera');

  // show after the hero, hide while the welcome screen or the phone menu is up
  let past = false;
  const top = $('#top');
  const sync = () => {
    box.classList.toggle('is-on', past && !document.body.classList.contains('is-gated') && !document.body.classList.contains('menu-open'));
    box.style.setProperty('--face', document.documentElement.dir === 'rtl' ? -1 : 1);
  };
  if (top && 'IntersectionObserver' in window) new IntersectionObserver(es => { past = !es[0].isIntersecting; document.body.classList.toggle('hero-off', past); sync(); }, { threshold: .2 }).observe(top);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });

  // speech bubble
  let sayT = 0;
  // the bubble stays long enough to read comfortably: about 1 s per 12 characters, never less than 6 s
  const speak = (text, ms = 6000) => { ms = Math.max(ms, 2500 + text.length * 85); if (box.classList.contains('is-talking') && say.textContent !== text) { say.classList.remove('is-swap'); void say.offsetWidth; say.classList.add('is-swap'); }
    say.textContent = text; box.classList.add('is-talking'); clearTimeout(sayT); sayT = setTimeout(() => box.classList.remove('is-talking'), ms); };
  const once = (cls, ms) => { box.classList.remove(cls); void box.offsetWidth; box.classList.add(cls); setTimeout(() => box.classList.remove(cls), ms); };
  me.addEventListener('click', () => { speak(T('buddyHi')); once('is-hop', 800); wave(); });
  document.addEventListener('click', e => { if (e.target.closest('#nav a, .gate__opt, .client__go, .case__item--reels')) { once('is-dash', 1000); play([['walk']], 0, 900); } });
  // arriving in a section (also when scrolling back to it): he presents it and says a word about the work there
  let here = null, sayIn = 0;
  if ('IntersectionObserver' in window) {
    const secIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) { if (e.target.id === here) { here = null; clearTimeout(sayIn); } return; }
      if (e.target.id === here) return; here = e.target.id; clearTimeout(sayIn);
      sayIn = setTimeout(() => {
        const id = here; if (!id || !box.classList.contains('is-on')) return;
        // at Contact he waves and invites the visitor to write on WhatsApp
        const line = id === 'contact' ? T('buddyContact') : T('buddy.' + id); if (!line || line === 'buddy.' + id) return;
        speak(line, 8000); if (id === 'contact') wave();
      }, 650);
    }), { rootMargin: '-42% 0px -42% 0px' });
    ['films', 'reels', 'cases', 'grade', 'snow', 'photos', 'clients', 'about', 'services', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  if (reduce) return;

  // ---------- where he floats: a vertical spot on the edge (moved by --by, eased in CSS) ----------
  const range = () => innerHeight * (lite ? .12 : .2);
  // the lowest his feet may go: above the WhatsApp button when it is showing, so it never covers him
  const wa = $('#waFloat');
  const floor = () => { if (wa && wa.classList.contains('is-shown')) { const r = wa.getBoundingClientRect(); if (r.width && r.left < box.getBoundingClientRect().right + 40) return r.top - 26; } return innerHeight - 24; };
  const band = () => { const h = box.offsetHeight, base = box.getBoundingClientRect().top - (parseFloat(box.style.getPropertyValue('--by')) || 0);
    return [Math.max(-range(), 96 - base), Math.min(range(), floor() - h - base)]; };
  const goTo = y => { const [lo, hi] = band(); box.style.setProperty('--by', Math.round(Math.max(lo, Math.min(hi, y))) + 'px'); };
  // idle life: drift to a new spot, look around, now and then a photo
  let watching = null, idleLife = 0;
  const life = () => {
    clearTimeout(idleLife);
    idleLife = setTimeout(() => {
      if (box.classList.contains('is-on') && !watching && !document.hidden) {
        const r = Math.random();
        if (r < .3) goTo((Math.random() * 2 - 1) * range());      // drift to a new spot
        else if (r < .44) play([['q3', toPage()], [idlePose], ['q3', !toPage()], [idlePose]], 520);   // look around
        else if (r < .56) play([['q3', toPage()]], 0, 2400);     // turn towards the page for a moment
        else if (r < .62) spin();                                 // a full turn around (rare)
        else if (r < .74) wave();                                 // a wave
        else if (r < .86) { idlePose = idlePose === 'camera' ? 'crossed' : 'camera'; rest(); }   // arms crossed, or back
        else snap();                                             // a reaction
      }
      life();
    }, 3500 + Math.random() * 3500);
  };
  life();

  // ---------- watching the work ----------
  let snapT = 0, unwatchT = 0;
  function watch(el) {
    if (!box.classList.contains('is-on')) return;
    clearTimeout(unwatchT);
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    goTo(r.top + r.height / 2 - innerHeight / 2);
    if (watching === el) return;
    watching = el; box.classList.add('is-watching');
    clearInterval(snapT); setTimeout(() => watching === el && snap(), 900); snapT = setInterval(() => watching === el && snap(), 4200);
  }
  function unwatch(delay = 1200) { clearTimeout(unwatchT); unwatchT = setTimeout(() => { watching = null; clearInterval(snapT); box.classList.remove('is-watching'); }, delay); }
  if (hover) {
    document.addEventListener('pointerover', e => { const w = e.target.closest && e.target.closest(WORK); if (w) watch(w); }, { passive: true });
    document.addEventListener('pointerout', e => { const w = e.target.closest && e.target.closest(WORK); if (w && !(e.relatedTarget && w.contains(e.relatedTarget))) unwatch(); }, { passive: true });
  }
  // when the visitor stops scrolling on a piece of work, he looks at it too (this is how it works on phones)
  let settleT = 0;
  const settle = () => { clearTimeout(settleT); settleT = setTimeout(() => {
    if (!box.classList.contains('is-on')) return;
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2), w = el && el.closest(WORK);
    if (w) { watch(w); unwatch(6500); } else if (!hover) unwatch(0);
  }, 900); };

  // ---------- taking a photo of the work (camera up, flash, sparks from the lens), and now and then a reaction ----------
  let shots = 0;
  function snap() {
    if (!box.classList.contains('is-on')) return;
    if (++shots % 3 === 0) { play([['wow']], 0, 1300); once('is-hop', 800);
      setTimeout(() => { const b = me.getBoundingClientRect(), c = cv.getBoundingClientRect(); burst(b.left - c.left + b.width * .5, b.top - c.top + b.height * .22, 14); }, 200);
      return; }
    play([['camera']], 0, 1100);
    setTimeout(() => { once('is-flash', 600); const b = me.getBoundingClientRect(), c = cv.getBoundingClientRect();
      burst(b.left - c.left + b.width * .51, b.top - c.top + b.height * .55, 16); }, 300);
  }

  // ---------- flight: follows scroll speed with a soft spring, leaning into the direction of travel ----------
  let lastY = scrollY, vel = 0, off = 0, offV = 0, rot = 0, running = false, idleT = 0, lastT = 0, striding = false;
  const P = [], sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
  { const s = sprite.getContext('2d'), rg = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,246,220,1)'); rg.addColorStop(.25, 'rgba(246,214,150,.85)'); rg.addColorStop(1, 'rgba(226,170,90,0)'); s.fillStyle = rg; s.fillRect(0, 0, 32, 32); }
  let CW = 0, CH = 0;
  const size = () => { CW = cv.clientWidth; CH = cv.clientHeight; cv.width = CW; cv.height = CH; };
  const MAX = lite ? 26 : 46;
  function burst(x, y, n) {
    for (let i = 0; i < n && P.length < MAX + 20; i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 90;
      P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: .4 + Math.random() * .6, r: .8 + Math.random() * 1.6 }); }
    run();
  }
  const run = () => { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(step); } };
  let room = 46;   // how far the flight may carry him down before reaching the floor
  const wake = () => { if (!running) room = Math.max(0, Math.min(46, floor() - box.getBoundingClientRect().bottom)); box.classList.remove('is-resting'); clearTimeout(idleT); idleT = setTimeout(() => box.classList.add('is-resting'), 5000); run(); };
  addEventListener('scroll', () => { if (box.classList.contains('is-on')) { wake(); settle(); } }, { passive: true });
  addEventListener('resize', size);

  function step(now) {
    const dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (dy / Math.max(dt, .001) - vel) * .18;
    const target = Math.max(-46, Math.min(room, vel * .035));
    offV += ((target - off) * 90 - offV * 14) * dt; off += offV * dt; if (off > room) { off = room; offV = Math.min(0, offV); }
    rot += (Math.max(-9, Math.min(9, vel * .006)) - rot) * Math.min(1, dt * 6);
    me.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    say.style.translate = `0 calc(-50% + ${off.toFixed(1)}px)`;   // the speech bubble travels with him, so it stays beside his head
    if (!CW) size();
    const speed = Math.abs(vel);
    // flying fast: he strides through the air
    const fast = striding ? speed > 550 : speed > 1100; if (fast !== striding) { striding = fast; if (fast && !busy) show('walk'); else rest(); }
    if (speed > 60 && P.length < MAX) {
      const n = Math.min(3, 1 + (speed / 900) | 0), b = me.getBoundingClientRect(), c = cv.getBoundingClientRect();
      for (let i = 0; i < n; i++) P.push({ x: b.left - c.left + b.width / 2 + (Math.random() - .5) * 18, y: b.top - c.top + b.height * .88 + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 30, vy: -Math.sign(vel) * (30 + Math.random() * 60) + (Math.random() - .5) * 20, life: 0, max: .6 + Math.random() * .9, r: .8 + Math.random() * 1.8 });
    }
    g.clearRect(0, 0, CW, CH); g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life += dt; if (p.life > p.max) { P.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97;
      const a = Math.sin(Math.PI * p.life / p.max), s = p.r * 7; g.globalAlpha = a; g.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
    }
    g.globalAlpha = 1;
    if (speed > 4 || Math.abs(off) > .5 || Math.abs(rot) > .2 || P.length) requestAnimationFrame(step);
    else { running = false; me.style.transform = ''; say.style.translate = ''; off = offV = rot = 0; g.clearRect(0, 0, CW, CH); }
  }
})();
