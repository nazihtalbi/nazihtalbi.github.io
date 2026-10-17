/* Smooth wheel scrolling. A mouse wheel on Windows moves the page in hard 100 px jumps; here each notch glides
   (eased, about a third of a second) for a calmer, premium feel. Only for a real mouse wheel: touchpads and touch
   screens already scroll smoothly and keep their native feel. Keyboard, scrollbar, links and the page's own glides
   all still work: any scroll this script did not make simply becomes the new starting point. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  let target = scrollY, current = scrollY, raf = 0, last = 0, mine = -1;
  const max = () => root.scrollHeight - innerHeight;
  // a mouse wheel sends whole steps (usually 100 or 120 px, or lines); a touchpad sends many small or fractional deltas
  const isWheel = e => e.deltaMode !== 0 || (Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
  // let an inner scrollable box (a list, a dialog) scroll natively while it still can
  const innerScroller = (el, dy) => {
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0)) return true;
    }
    return false;
  };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; root.style.scrollBehavior = ''; target = current = scrollY; };
  window.__smoothStop = stop;
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    current += (target - current) * (1 - Math.exp(-dt * 10));
    if (Math.abs(target - current) < .5) current = target;
    mine = Math.round(current); scrollTo(0, current);
    if (current !== target) raf = requestAnimationFrame(tick); else { raf = 0; root.style.scrollBehavior = ''; }
  }
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !isWheel(e)) return;
    const b = document.body;
    if (b.classList.contains('is-gated') || b.classList.contains('is-entering') || b.classList.contains('menu-open') || document.querySelector('dialog[open]')) return;
    if (innerScroller(e.target, e.deltaY)) return;
    e.preventDefault();
    if (!raf) { target = current = scrollY; root.style.scrollBehavior = 'auto'; last = performance.now(); raf = requestAnimationFrame(tick); }
    const step = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    target = Math.max(0, Math.min(max(), target + step));
  }, { passive: false });
  // a scroll we did not make (keyboard, scrollbar, a link, the page's own glide): follow it instead of fighting it
  addEventListener('scroll', () => { if (Math.abs(scrollY - mine) > 2 && raf) stop(); else if (!raf) target = current = scrollY; }, { passive: true });
  addEventListener('resize', () => { target = Math.min(target, max()); });
})();
