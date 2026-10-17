/* Mini Nazih: a small illustrated Nazih that lives on the edge of the screen and watches the work with the visitor.
   - flies in after the hero, leans into the scroll and trails gold sparks
   - alive when idle: drifts up and down, looks around, blinks
   - when the visitor hovers or stops on a film, reel or photo, he flies level with it, turns to it and takes
     a photo of it (camera up, flash, sparks)
   - a tap: he says hello in the visitor's language; near Contact he points to WhatsApp once
   - only animates while something happens; still and spark-free for visitors who ask for reduced motion */
(() => {
  const $ = s => document.querySelector(s);
  const box = $('#buddy'); if (!box) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover)').matches, lite = !hover || innerWidth <= 760;
  const me = box.querySelector('.buddy__me'), say = box.querySelector('.buddy__say'), cv = box.querySelector('.buddy__trail'), g = cv.getContext('2d');
  const T = k => { const I = window.I18N || {}, l = document.documentElement.lang; return (I[l] && I[l][k]) || (I.en && I.en[k]) || ''; };
  const WORK = '.playlist__item, .screen__stage, .vcard, .spot__media, .tile, .lead, .case__media, .case__bts figure, .snow__frame, .cmp';

  // poses from his character sheet: one sprite, one cell per pose (front, turnaround, wave, arms crossed, walk, wow, joy)
  const F = { front: 0, q3: 1, left: 2, right: 3, back: 4, q3back: 5, wave: 6, crossed: 7, walk: 8, wow: 9, joy: 10 };
  const img = me.querySelector('img'), sheet = ((img && img.getAttribute('src')) || 'assets/media/site/mini-nazih.svg').replace(/mini-nazih\.svg$/, 'mini-sprite.webp');
  me.innerHTML = '<span class="buddy__bob"><span class="buddy__pose"></span></span>';
  const pose = me.querySelector('.buddy__pose'); pose.style.backgroundImage = `url("${sheet}")`;
  const show = (name, flip) => { pose.style.setProperty('--f', F[name]); pose.style.setProperty('--flip', flip ? -1 : 1); };
  // the page is on his left when he stands on the right edge (and the other way round in Arabic)
  const toPage = () => document.documentElement.dir !== 'rtl';
  let idlePose = 'front', busy = false, seqT = [];
  const rest = () => { if (busy) return;
    if (box.classList.contains('is-watching') || box.classList.contains('is-talking')) show('q3', toPage()); else show(idlePose); };
  // a short sequence of poses, then back to rest
  const play = (frames, step = 110, hold = 0) => {
    seqT.forEach(clearTimeout); seqT = []; busy = true;
    frames.forEach(([n, fl], i) => seqT.push(setTimeout(() => show(n, fl), i * step)));
    seqT.push(setTimeout(() => { busy = false; rest(); }, (frames.length - 1) * step + step + hold));
  };
  const wave = () => play([['wave', toPage()]], 0, 1700);
  // a real turn on the spot, through the turnaround views of the sheet
  const spin = () => play([['front'], ['q3'], ['left'], ['q3back'], ['back'], ['q3back', true], ['right'], ['q3', true], ['front']], 95);
  new MutationObserver(rest).observe(box, { attributes: true, attributeFilter: ['class'] });
  show('front');

  // show after the hero, hide while the welcome screen or the phone menu is up
  let past = false;
  const top = $('#top');
  const sync = () => {
    box.classList.toggle('is-on', past && !document.body.classList.contains('is-gated') && !document.body.classList.contains('menu-open'));
    box.style.setProperty('--face', document.documentElement.dir === 'rtl' ? -1 : 1);
  };
  if (top && 'IntersectionObserver' in window) new IntersectionObserver(es => { past = !es[0].isIntersecting; sync(); }, { threshold: .2 }).observe(top);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });

  // speech bubble
  let sayT = 0;
  const speak = (text, ms = 3200) => { say.textContent = text; box.classList.add('is-talking'); clearTimeout(sayT); sayT = setTimeout(() => box.classList.remove('is-talking'), ms); };
  const once = (cls, ms) => { box.classList.remove(cls); void box.offsetWidth; box.classList.add(cls); setTimeout(() => box.classList.remove(cls), ms); };
  me.addEventListener('click', () => { speak(T('buddyHi')); once('is-hop', 800); wave(); });
  const contact = $('#contact'); let pointed = false;
  if (contact && 'IntersectionObserver' in window) new IntersectionObserver(es => { if (es[0].isIntersecting && !pointed && box.classList.contains('is-on')) { pointed = true; speak(T('buddyContact'), 4200); wave(); } }, { threshold: .35 }).observe(contact);
  document.addEventListener('click', e => { if (e.target.closest('#nav a, .gate__opt, .client__go, .case__item--reels')) { once('is-dash', 1000); play([['walk']], 0, 900); } });
  // arriving in a section for the first time: he turns to it and says a word about the work there
  const said = new Set(); let here = null, sayIn = 0;
  if ('IntersectionObserver' in window) {
    const secIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; here = e.target.id; clearTimeout(sayIn);
      sayIn = setTimeout(() => {
        const id = here; if (said.has(id) || !box.classList.contains('is-on') || box.classList.contains('is-talking')) return;
        const line = T('buddy.' + id); if (!line || line === 'buddy.' + id) return;
        said.add(id); speak(line, 4800); wave();
      }, 700);
    }), { rootMargin: '-42% 0px -42% 0px' });
    ['films', 'reels', 'cases', 'grade', 'snow', 'photos', 'clients', 'about', 'services'].forEach(id => { const s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  if (reduce) return;

  // ---------- where he floats: a vertical spot on the edge (moved by --by, eased in CSS) ----------
  const range = () => innerHeight * (lite ? .12 : .2);
  const band = () => { const h = box.offsetHeight, base = box.getBoundingClientRect().top - (parseFloat(box.style.getPropertyValue('--by')) || 0);
    return [Math.max(-range(), 96 - base), Math.min(range(), innerHeight - 24 - h - base)]; };
  const goTo = y => { const [lo, hi] = band(); box.style.setProperty('--by', Math.round(Math.max(lo, Math.min(hi, y))) + 'px'); };
  // idle life: drift to a new spot, look around, now and then a photo
  let watching = null, idleLife = 0;
  const life = () => {
    clearTimeout(idleLife);
    idleLife = setTimeout(() => {
      if (box.classList.contains('is-on') && !watching && !document.hidden) {
        const r = Math.random();
        if (r < .3) goTo((Math.random() * 2 - 1) * range());      // drift to a new spot
        else if (r < .44) play([['q3', toPage()], ['front'], ['q3', !toPage()], ['front']], 520);   // look around
        else if (r < .56) play([['q3', toPage()]], 0, 2400);     // turn towards the page for a moment
        else if (r < .62) spin();                                 // a full turn around (rare)
        else if (r < .74) wave();                                 // a wave
        else if (r < .86) { idlePose = idlePose === 'front' ? 'crossed' : 'front'; rest(); }   // arms crossed, or back
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

  // ---------- a reaction to the work: wow or joy, with a little burst of sparks ----------
  function snap() {
    if (!box.classList.contains('is-on')) return;
    play([[Math.random() < .5 ? 'wow' : 'joy']], 0, 1300); once('is-hop', 800);
    setTimeout(() => { const b = me.getBoundingClientRect(), c = cv.getBoundingClientRect();
      burst(b.left - c.left + b.width * .5, b.top - c.top + b.height * .22, 14); }, 200);
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
  const wake = () => { box.classList.remove('is-resting'); clearTimeout(idleT); idleT = setTimeout(() => box.classList.add('is-resting'), 5000); run(); };
  addEventListener('scroll', () => { if (box.classList.contains('is-on')) { wake(); settle(); } }, { passive: true });
  addEventListener('resize', size);

  function step(now) {
    const dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (dy / Math.max(dt, .001) - vel) * .18;
    const target = Math.max(-46, Math.min(46, vel * .035));
    offV += ((target - off) * 90 - offV * 14) * dt; off += offV * dt;
    rot += (Math.max(-9, Math.min(9, vel * .006)) - rot) * Math.min(1, dt * 6);
    me.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    if (!CW) size();
    const speed = Math.abs(vel);
    // flying fast: he strides through the air
    const fast = speed > 900; if (fast !== striding) { striding = fast; if (fast && !busy) show('walk'); else rest(); }
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
    else { running = false; me.style.transform = ''; off = offV = rot = 0; g.clearRect(0, 0, CW, CH); }
  }
})();
