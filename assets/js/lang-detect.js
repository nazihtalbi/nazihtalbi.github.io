/* Picks the starting language before the page is drawn (so Arabic never flashes left-to-right).
   Order of priority:
   1. ?lang=xx in the address (useful for sharing a link in a given language)
   3. Algeria (from the browser's region or time zone): Arabic
   4. the browser's preferred language, if it is Arabic, French or German
   5. the country's language (from region or time zone): Arabic / French / German
   6. English */
(function () {
  // every visit opens on the intro at the top of the page: the browser must not jump back to where the
  // visitor was (or to a #section in the address) while the intro is drawn over the hero
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
  window.scrollTo(0, 0);
  var LANGS = ['en', 'fr', 'ar', 'de'];
  var AR = 'DZ MA TN LY EG SD MR SA AE QA KW BH OM YE IQ JO LB SY PS'.split(' ');
  var FR = 'FR BE MC LU SN CI ML NE BF GN TG BJ GA CG CD CM CF TD MG DJ KM HT RE GP MQ GF NC PF'.split(' ');
  var DE = 'DE AT LI CH'.split(' ');
  var TZ = {
    'Africa/Algiers': 'DZ', 'Africa/Casablanca': 'MA', 'Africa/El_Aaiun': 'MA', 'Africa/Tunis': 'TN', 'Africa/Tripoli': 'LY', 'Africa/Cairo': 'EG',
    'Africa/Khartoum': 'SD', 'Africa/Nouakchott': 'MR', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW',
    'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM', 'Asia/Aden': 'YE', 'Asia/Baghdad': 'IQ', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB',
    'Asia/Damascus': 'SY', 'Asia/Gaza': 'PS', 'Asia/Hebron': 'PS',
    'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Monaco': 'MC', 'Europe/Luxembourg': 'LU', 'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI',
    'Africa/Bamako': 'ML', 'Africa/Niamey': 'NE', 'Africa/Ouagadougou': 'BF', 'Africa/Conakry': 'GN', 'Africa/Lome': 'TG', 'Africa/Porto-Novo': 'BJ',
    'Africa/Libreville': 'GA', 'Africa/Brazzaville': 'CG', 'Africa/Kinshasa': 'CD', 'Africa/Douala': 'CM', 'Africa/Bangui': 'CF', 'Africa/Ndjamena': 'TD',
    'Indian/Antananarivo': 'MG', 'Africa/Djibouti': 'DJ', 'Indian/Comoro': 'KM', 'America/Port-au-Prince': 'HT',
    'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE', 'Europe/Vienna': 'AT', 'Europe/Vaduz': 'LI', 'Europe/Zurich': 'CH'
  };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']).map(function (l) { return String(l); });
  var country = null;
  for (var i = 0; i < prefs.length && !country; i++) { var m = prefs[i].match(/^[a-z]{2,3}[-_](?:[A-Za-z]{4}[-_])?([A-Za-z]{2})\b/); if (m) country = m[1].toUpperCase(); }
  var tz = null; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  var tzCountry = tz && TZ[tz];
  // the time zone says where the visitor is right now; the language region can be a device setting from elsewhere
  var where = tzCountry || country;
  var countryLang = function (c) { return !c ? null : AR.indexOf(c) > -1 ? 'ar' : FR.indexOf(c) > -1 ? 'fr' : DE.indexOf(c) > -1 ? 'de' : null; };
  var base = prefs.map(function (l) { return l.slice(0, 2).toLowerCase(); });

  function suggest() {
    if (where === 'DZ' || country === 'DZ') return { lang: 'ar', why: 'country' };
    if (base[0] === 'ar' || base[0] === 'fr' || base[0] === 'de') return { lang: base[0], why: 'browser' };
    var byCountry = countryLang(where) || countryLang(country);
    if (byCountry) return { lang: byCountry, why: 'country' };
    if (base[0] === 'en') return { lang: 'en', why: 'browser' };
    for (var j = 1; j < base.length; j++) if (LANGS.indexOf(base[j]) > -1) return { lang: base[j], why: 'browser' };
    return { lang: 'en', why: 'default' };
  }

  var fromUrl = (location.search.match(/[?&]lang=(en|fr|ar|de)\b/) || [])[1];
  // the language is not remembered between visits: every visit starts with the welcome screen.
  // A ?lang=xx link only changes which language is suggested.
  try { localStorage.removeItem('lang'); } catch (e) {}
  var saved = null;
  var s = fromUrl ? { lang: fromUrl, why: 'link' } : suggest();
  window.LANG_START = { lang: saved || s.lang, saved: !!saved, suggested: s.lang, why: s.why, country: where || null };
  var root = document.documentElement;
  root.lang = window.LANG_START.lang;
  root.dir = window.LANG_START.lang === 'ar' ? 'rtl' : 'ltr';
  if (saved) root.classList.add('lang-known');
  try { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('motion'); } catch (e) {}
})();
