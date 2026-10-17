/* Mini Nazih: a small illustrated Nazih that flies along the edge of the screen with the visitor.
   - appears once the visitor is past the hero, slides along the edge, leans into the scroll and trails gold sparks
   - rests (gently bobbing) when scrolling stops, then fades to half strength so it never nags
   - a tap makes him say hello in the visitor's language; near Contact he points to WhatsApp once
   - only animates while something is happening; still and spark-free for visitors who ask for reduced motion */
(() => {
  const $ = s => document.querySelector(s);
  const box = $('#buddy'); if (!box) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = !matchMedia('(hover: hover)').matches || innerWidth <= 760;
  const me = box.querySelector('.buddy__me'), say = box.querySelector('.buddy__say'), cv = box.querySelector('.buddy__trail'), g = cv.getContext('2d');
  const T = k => { const I = window.I18N || {}, l = document.documentElement.lang; return (I[l] && I[l][k]) || (I.en && I.en[k]) || ''; };

  // show after the hero, hide while the welcome screen is up
  let past = false;
  const top = $('#top');
  if (top && 'IntersectionObserver' in window) new IntersectionObserver(es => { past = !es[0].isIntersecting; sync(); }, { threshold: .2 }).observe(top);
  const sync = () => box.classList.toggle('is-on', past && !document.body.classList.contains('is-gated') && !document.body.classList.contains('menu-open'));
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // speech bubble
  let sayT = 0;
  const speak = (text, ms = 3200) => { say.textContent = text; box.classList.add('is-talking'); clearTimeout(sayT); sayT = setTimeout(() => box.classList.remove('is-talking'), ms); };
  me.addEventListener('click', () => { speak(T('buddyHi')); box.classList.remove('is-hop'); void box.offsetWidth; box.classList.add('is-hop'); wake(); });
  const contact = $('#contact'); let pointed = false;
  if (contact && 'IntersectionObserver' in window) new IntersectionObserver(es => { if (es[0].isIntersecting && !pointed && box.classList.contains('is-on')) { pointed = true; speak(T('buddyContact'), 4200); } }, { threshold: .35 }).observe(contact);

  // menu links and "explore" choices: he dashes ahead
  document.addEventListener('click', e => { if (e.target.closest('#nav a, .gate__opt, .client__go, .case__item--reels')) { box.classList.remove('is-dash'); void box.offsetWidth; box.classList.add('is-dash'); } });

  if (reduce) return;

  // ---------- flight: follows scroll speed with a soft spring, leaning into the direction of travel ----------
  let lastY = scrollY, vel = 0, off = 0, offV = 0, rot = 0, running = false, idleT = 0, lastT = 0;
  const P = [], sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
  { const s = sprite.getContext('2d'), rg = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,246,220,1)'); rg.addColorStop(.25, 'rgba(246,214,150,.85)'); rg.addColorStop(1, 'rgba(226,170,90,0)'); s.fillStyle = rg; s.fillRect(0, 0, 32, 32); }
  let CW = 0, CH = 0;
  const size = () => { CW = cv.clientWidth; CH = cv.clientHeight; cv.width = CW; cv.height = CH; };
  const MAX = lite ? 22 : 40;
  const wake = () => { box.classList.remove('is-resting'); clearTimeout(idleT); idleT = setTimeout(() => box.classList.add('is-resting'), 4000); if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(step); } };
  addEventListener('scroll', () => { if (box.classList.contains('is-on')) wake(); }, { passive: true });
  addEventListener('resize', size);

  function step(now) {
    const dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (dy / Math.max(dt, .001) - vel) * .18;                  // px per second, smoothed
    const target = Math.max(-110, Math.min(110, vel * .07));          // flies a little ahead in the scroll direction
    offV += ((target - off) * 90 - offV * 14) * dt; off += offV * dt;  // spring
    rot += (Math.max(-22, Math.min(22, vel * .012)) - rot) * Math.min(1, dt * 8);
    me.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    // sparks leave from his feet, drifting against the direction of flight
    if (!CW) size();
    const speed = Math.abs(vel);
    if (speed > 60 && P.length < MAX) {
      const n = Math.min(3, 1 + (speed / 900) | 0);
      for (let i = 0; i < n; i++) P.push({ x: CW / 2 + (Math.random() - .5) * 18, y: CH / 2 + off + 34 + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 30, vy: -Math.sign(vel) * (30 + Math.random() * 60) + (Math.random() - .5) * 20, life: 0, max: .6 + Math.random() * .9, r: .8 + Math.random() * 1.8 });
    }
    g.clearRect(0, 0, CW, CH); g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life += dt; if (p.life > p.max) { P.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= .97;
      const a = Math.sin(Math.PI * p.life / p.max), s = p.r * 7; g.globalAlpha = a; g.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
    }
    g.globalAlpha = 1;
    // keep going while moving or while sparks are alive; then stop completely
    if (speed > 4 || Math.abs(off) > .5 || Math.abs(rot) > .2 || P.length) requestAnimationFrame(step);
    else { running = false; me.style.transform = ''; off = offV = rot = 0; g.clearRect(0, 0, CW, CH); }
  }
})();
