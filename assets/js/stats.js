/* Visitor statistics with GoatCounter: free, no cookies, no personal data, so no consent banner is needed.
   Put your GoatCounter code below (for https://nazih.goatcounter.com the code is 'nazih').
   Counted: page visits, every film / reel / showreel opened (play/<name>), WhatsApp and email clicks, contact form sent.
   Nothing is counted while the code is empty or when the site is opened from your own computer. */
(() => {
  const CODE = '';
  const queue = [];
  window.stat = (path, title) => {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title, event: true });
    else queue.push([path, title]);
  };
  if (!CODE || !/^https?:$/.test(location.protocol) || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
  const s = document.createElement('script');
  s.async = true; s.src = 'https://gc.zgo.at/count.js'; s.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
  s.onload = () => queue.splice(0).forEach(([p, t]) => window.stat(p, t));
  document.head.append(s);
  // WhatsApp and email links anywhere on the page
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="wa.me"], a[href^="mailto:"]');
    if (a) window.stat(a.dataset.stat || (a.href.includes('wa.me') ? 'whatsapp' : 'email'), a.href.includes('wa.me') ? 'WhatsApp' : 'Email');
  });
})();
