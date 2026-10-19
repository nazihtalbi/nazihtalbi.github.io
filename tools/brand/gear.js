// The photography gear that orbits big Nazih in the hero: small, shaded illustrations (not icons), written into
// index.html between the <!-- gear --> markers. Run: node tools/brand/gear.js (then "Update website.bat" / build-pages).
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');

const G = {
  // DSLR body seen from the front, lens pointing at you
  camera: `<svg viewBox="0 0 140 100">
    <defs><linearGradient id="gcB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c4f57"/><stop offset=".3" stop-color="#25272d"/><stop offset="1" stop-color="#0b0c0f"/></linearGradient>
    <linearGradient id="gcH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5e67"/><stop offset="1" stop-color="#1c1e23"/></linearGradient>
    <radialGradient id="gcL" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".3" stop-color="#2a3a74"/><stop offset=".7" stop-color="#080b16"/><stop offset="1" stop-color="#000"/></radialGradient>
    <linearGradient id="gcG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1cc"/><stop offset=".5" stop-color="#e2b865"/><stop offset="1" stop-color="#9c6e2c"/></linearGradient></defs>
    <path d="M52 21 58 7h30l6 14z" fill="url(#gcH)"/><rect x="65" y="11" width="16" height="4" rx="1" fill="#c9cdd6" opacity=".8"/>
    <rect x="98" y="12" width="16" height="7" rx="2" fill="#3a3d44"/><ellipse cx="25" cy="18" rx="7" ry="2.6" fill="#8a8f99"/>
    <rect x="8" y="19" width="124" height="66" rx="11" fill="url(#gcB)"/>
    <path d="M8 31q0-12 12-12h18v66H20q-12 0-12-12z" fill="#141519"/>
    <g stroke="#2a2c32" stroke-width="2"><path d="M14 32h18"/><path d="M14 39h18"/><path d="M14 46h18"/><path d="M14 53h18"/><path d="M14 60h18"/><path d="M14 67h18"/><path d="M14 74h18"/></g>
    <path d="M14 21h112" stroke="#fff" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/>
    <circle cx="80" cy="53" r="31" fill="#08090b"/>
    <circle cx="80" cy="53" r="28" fill="none" stroke="#2c2e34" stroke-width="6" stroke-dasharray="2.2 1.6"/>
    <circle cx="80" cy="53" r="22.5" fill="none" stroke="url(#gcG)" stroke-width="3.2"/>
    <circle cx="80" cy="53" r="20" fill="#111216"/><circle cx="80" cy="53" r="16" fill="url(#gcL)"/>
    <ellipse cx="74" cy="47" rx="5.5" ry="3" fill="#fff" opacity=".55" transform="rotate(-32 74 47)"/><circle cx="86" cy="59" r="1.6" fill="#9fb7ff" opacity=".6"/>
    <circle cx="121" cy="32" r="3" fill="#e2584f"/></svg>`,
  // a prime lens on its side: mount, focus ring, gold band, front glass
  lens: `<svg viewBox="0 0 120 90">
    <defs><linearGradient id="glB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55585f"/><stop offset=".45" stop-color="#1d1f24"/><stop offset="1" stop-color="#08090b"/></linearGradient>
    <radialGradient id="glF" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#9fb7ff"/><stop offset=".4" stop-color="#26346a"/><stop offset="1" stop-color="#05060c"/></radialGradient></defs>
    <rect x="12" y="26" width="16" height="38" rx="3" fill="#8a8f99"/>
    <rect x="26" y="18" width="70" height="54" rx="6" fill="url(#glB)"/>
    <g stroke="#000" stroke-opacity=".55" stroke-width="2">${Array.from({ length: 9 }, (_, i) => `<path d="M${38 + i * 4} 19v52"/>`).join('')}</g>
    <rect x="76" y="18" width="5" height="54" fill="#d9a441"/>
    <ellipse cx="98" cy="45" rx="10" ry="27" fill="#0c0d10"/><ellipse cx="98" cy="45" rx="7" ry="21" fill="url(#glF)"/>
    <ellipse cx="96" cy="37" rx="2" ry="6" fill="#fff" opacity=".5"/></svg>`,
  // speedlight flash: foot, body, tilting head with a white window
  flash: `<svg viewBox="0 0 90 120">
    <defs><linearGradient id="gfB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3c3f46"/><stop offset=".5" stop-color="#1b1d22"/><stop offset="1" stop-color="#0b0c0f"/></linearGradient>
    <linearGradient id="gfW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#e9e2d2"/></linearGradient></defs>
    <rect x="16" y="8" width="58" height="34" rx="5" fill="url(#gfB)"/>
    <rect x="21" y="13" width="48" height="24" rx="3" fill="url(#gfW)"/>
    <path d="M24 16h42" stroke="#fff" stroke-width="2"/>
    <rect x="34" y="42" width="22" height="8" fill="#15161a"/>
    <rect x="24" y="50" width="42" height="54" rx="5" fill="url(#gfB)"/>
    <rect x="31" y="58" width="28" height="14" rx="2" fill="#2f6b4a"/><circle cx="45" cy="86" r="5" fill="#2b2d33" stroke="#5b5f69"/>
    <rect x="30" y="104" width="30" height="8" rx="2" fill="#8a8f99"/></svg>`,
  // tripod: head, centre column and three legs
  tripod: `<svg viewBox="0 0 100 130">
    <defs><linearGradient id="gtL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2c31"/><stop offset=".5" stop-color="#5a5e67"/><stop offset="1" stop-color="#1a1b1f"/></linearGradient></defs>
    <rect x="34" y="8" width="32" height="10" rx="3" fill="#1b1d22"/><rect x="44" y="18" width="12" height="12" fill="#3a3d44"/>
    <path d="M50 30 18 120" stroke="url(#gtL)" stroke-width="7" stroke-linecap="round"/>
    <path d="M50 30 82 120" stroke="url(#gtL)" stroke-width="7" stroke-linecap="round"/>
    <path d="M50 30v84" stroke="url(#gtL)" stroke-width="7" stroke-linecap="round"/>
    <g fill="#d9a441"><rect x="27" y="78" width="9" height="5" rx="1" transform="rotate(20 31 80)"/><rect x="64" y="78" width="9" height="5" rx="1" transform="rotate(-20 68 80)"/><rect x="46" y="80" width="8" height="5" rx="1"/></g></svg>`,
  // drone: body, four arms, spinning propellers, gimbal camera
  drone: `<svg viewBox="0 0 140 90">
    <defs><linearGradient id="gdB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5e67"/><stop offset="1" stop-color="#16171b"/></linearGradient></defs>
    <path d="M70 44 26 24M70 44 114 24M70 44 30 62M70 44 110 62" stroke="#2b2d33" stroke-width="6" stroke-linecap="round"/>
    <g fill="#9aa0aa" opacity=".55"><ellipse cx="26" cy="22" rx="22" ry="3.5"/><ellipse cx="114" cy="22" rx="22" ry="3.5"/><ellipse cx="30" cy="60" rx="20" ry="3"/><ellipse cx="110" cy="60" rx="20" ry="3"/></g>
    <g fill="#111"><circle cx="26" cy="24" r="4"/><circle cx="114" cy="24" r="4"/><circle cx="30" cy="62" r="4"/><circle cx="110" cy="62" r="4"/></g>
    <rect x="50" y="34" width="40" height="20" rx="8" fill="url(#gdB)"/>
    <rect x="62" y="56" width="16" height="12" rx="3" fill="#1b1d22"/><circle cx="70" cy="62" r="4.5" fill="#26346a" stroke="#d9a441" stroke-width="1.5"/>
    <circle cx="82" cy="40" r="2" fill="#e2584f"/></svg>`,
  // memory card
  card: `<svg viewBox="0 0 90 120">
    <defs><linearGradient id="gsB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3036"/><stop offset="1" stop-color="#0d0e11"/></linearGradient></defs>
    <path d="M14 8h46l16 16v86a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="url(#gsB)"/>
    <g fill="#e2b865">${Array.from({ length: 5 }, (_, i) => `<rect x="${18 + i * 9}" y="14" width="6" height="16" rx="1"/>`).join('')}</g>
    <rect x="16" y="44" width="56" height="44" rx="3" fill="#c8102e"/>
    <text x="44" y="72" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="18" fill="#fff">128</text>
    <text x="44" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8" fill="#fff">GB  V90</text></svg>`,
};

const items = Object.entries(G).map(([k, svg], i) => `<i class="orb orb--${i + 1} orb--${k}"><span class="orb__d"><span class="orb__c">${svg.replace(/\s*\n\s*/g, ' ')}</span></span></i>`).join('');
let html = fs.readFileSync(FILE, 'utf8');
const block = `<div class="orbit">${['a', 'b', 'c'].map(o => `<i class="ring ring--${o} ring--back"></i><i class="ring ring--${o} ring--front"></i>`).join('')}${items}</div>`;
if (/<div class="orbit">[\s\S]*?<\/i><\/div>(?=<div class="hero__float">)/.test(html)) html = html.replace(/<div class="orbit">[\s\S]*?<\/i><\/div>(?=<div class="hero__float">)/, () => block);
else throw new Error('orbit block not found in index.html');
fs.writeFileSync(FILE, html);
console.log('gear written:', Object.keys(G).join(', '));
