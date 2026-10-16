/* Portfolio content. Media lives in assets/media/ (web-optimised copies of the originals).
   Text fields take { en, fr, ar, de }. To add a film: add an entry to FILMS with a slug whose
   files exist in assets/media/video/ (<slug>.mp4, <slug>-preview.mp4, <slug>.webp). */
window.DATA = (() => {
  // Contact form: paste the Web3Forms access key here (web3forms.com, sent to nazihhtalbi@gmail.com).
  // While it is empty, "Send message" opens the visitor's email app instead.
  const FORM_KEY = '5f5e5b51-6deb-44fd-84a2-9a055283fe1b';

  // pages in a language folder (fr/, ar/, de/) set window.SITE_ROOT = '../'
  const R = window.SITE_ROOT || '';
  const V = R + 'assets/media/video/', P = R + 'assets/media/photos/', L = R + 'assets/media/logos/';

  const CLIENTS = {
    almaahed: { name: 'Almaahed International', logo: L + 'almaahed.png' },
    aapi: { name: { en: 'Algerian Investment Promotion Agency (AAPI)', fr: "Agence algérienne de promotion de l'investissement (AAPI)", ar: 'الوكالة الجزائرية لترقية الاستثمار', de: 'Algerische Agentur für Investitionsförderung (AAPI)' }, logo: L + 'aapi.png' },
    dilzone: { name: 'Dil Zone Academy', logo: L + 'dilzone.png' },
    masaar: { name: { en: 'Masaar', fr: 'Masaar', ar: 'مسار', de: 'Masaar' }, logo: L + 'masaar.png' },
    memo: { name: 'Memo Bac', logo: L + 'memo.svg' },
    funleem: { name: { en: 'Funleem', fr: 'Funleem', ar: 'فن ليم', de: 'Funleem' }, logo: L + 'funleem.png' },
  };

  const TYPE = {
    event: { en: 'Event film', fr: 'Film événementiel', ar: 'فيلم فعالية', de: 'Eventfilm' },
    doc: { en: 'Documentary', fr: 'Documentaire', ar: 'فيلم وثائقي', de: 'Dokumentarfilm' },
    short: { en: 'Short film', fr: 'Court métrage', ar: 'فيلم قصير', de: 'Kurzfilm' },
    promo: { en: 'Promo film', fr: 'Film promotionnel', ar: 'فيلم ترويجي', de: 'Imagefilm' },
    vlog: { en: 'Event vlog', fr: 'Vlog événementiel', ar: 'فلوغ فعالية', de: 'Event-Vlog' },
    ad: { en: 'App ad', fr: "Publicité d'application", ar: 'إعلان تطبيق', de: 'App-Werbung' },
    podcast: { en: 'Podcast', fr: 'Podcast', ar: 'بودكاست', de: 'Podcast' },
    archive: { en: 'Photo & video', fr: 'Photo et vidéo', ar: 'صور وفيديو', de: 'Foto & Video' },
    lecture: { en: 'Lecture', fr: 'Conférence', ar: 'درس', de: 'Vortrag' },
  };

  const FILMS = [
    { slug: 'graduation-2026', youtube: 'ku6pvqQO4W0', preview: true, client: 'almaahed', type: 'event', dur: '3:43',
      title: { en: "Graduation & World Teachers' Day", fr: 'Remise des diplômes et Journée des enseignants', ar: 'حفل التخرج واليوم العالمي للمعلم', de: 'Abschlussfeier & Weltlehrertag' },
      desc: { en: 'The graduation day of Almaahed International: speeches, certificates and the families who came to celebrate.', fr: "La journée de remise des diplômes d'Almaahed International : discours, certificats et familles venues célébrer.", ar: 'يوم تخرج طلبة المعهد الدولي Almaahed: كلمات وشهادات وعائلات حضرت للاحتفال.', de: 'Der Abschlusstag von Almaahed International: Reden, Zertifikate und die Familien, die mitgefeiert haben.' } },
    { slug: 'almaahed-documentary', youtube: 'dMOPadsR2ic', preview: true, client: 'almaahed', type: 'doc', dur: '5:26',
      title: { en: 'Almaahed, in their words', fr: 'Almaahed, par ceux qui la font', ar: 'Almaahed بأصوات أهله', de: 'Almaahed, in eigenen Worten' },
      desc: { en: 'Teachers, students and parents tell what the institute means to them. Interviews, classroom scenes and a careful grade.', fr: "Enseignants, élèves et parents racontent ce que l'institut représente pour eux. Interviews, scènes de classe et étalonnage soigné.", ar: 'أساتذة وطلبة وأولياء يروون ما يعنيه المعهد لهم. مقابلات ومشاهد من الأقسام وتدريج لوني دقيق.', de: 'Lehrkräfte, Schüler und Eltern erzählen, was das Institut für sie bedeutet. Interviews, Szenen aus dem Unterricht und sorgfältiges Grading.' } },
    { slug: 'almaahed-shortfilm', youtube: 'YafX7TqXUL8', preview: true, client: 'almaahed', type: 'short', dur: '2:12',
      title: { en: 'Almaahed short film', fr: 'Le court métrage Almaahed', ar: 'فيلم Almaahed القصير', de: 'Der Almaahed-Kurzfilm' },
      desc: { en: 'The official short film of Almaahed International: what the institute is, told through its classrooms, its team and its students.', fr: "Le court métrage officiel d'Almaahed International : l'institut raconté à travers ses classes, son équipe et ses élèves.", ar: 'الفيلم القصير الرسمي للمعهد الدولي Almaahed: المعهد من خلال أقسامه وفريقه وطلبته.', de: 'Der offizielle Kurzfilm von Almaahed International: das Institut, erzählt durch seine Klassen, sein Team und seine Schüler.' } },
    { slug: 'ramadan', youtube: 'asVJ5UMyG7E', preview: true, client: 'almaahed', type: 'event', dur: '3:05',
      title: { en: 'The beauty of Ramadan at Almaahed', fr: 'La beauté du Ramadan à Almaahed', ar: 'جمال رمضان في Almaahed', de: 'Die Schönheit des Ramadan bei Almaahed' },
      desc: { en: 'Special moments and lasting memories from the holy month at Almaahed International.', fr: "Des moments particuliers et des souvenirs durables du mois sacré à Almaahed International.", ar: 'لحظات مميزة وذكريات باقية من الشهر الفضيل في المعهد الدولي Almaahed.', de: 'Besondere Momente und bleibende Erinnerungen aus dem heiligen Monat bei Almaahed International.' } },
    { slug: 'masaar-shortfilm', youtube: 'yniXm5om_OA', preview: true, client: 'masaar', type: 'short', dur: '3:15',
      title: { en: 'Masaar', fr: 'Masaar', ar: 'مسار', de: 'Masaar' },
      desc: { en: 'A short film about the young team behind Masaar and the night the results were announced. English subtitles.', fr: "Un court métrage sur la jeune équipe derrière Masaar et le soir de l'annonce des résultats. Sous-titres en anglais.", ar: 'فيلم قصير عن الفريق الشاب وراء مسار وليلة إعلان النتائج. بترجمة إنجليزية.', de: 'Ein Kurzfilm über das junge Team hinter Masaar und den Abend der Ergebnisverkündung. Englische Untertitel.' } },
    { slug: 'masaar-event', youtube: 'S-TVGpOUOXQ', preview: true, client: 'masaar', type: 'event', dur: '4:44',
      title: { en: 'Masaar opening ceremony', fr: "Cérémonie d'ouverture de Masaar", ar: 'حفل افتتاح مشروع مسار', de: 'Eröffnungsfeier von Masaar' },
      desc: { en: 'Stage, speakers and audience at the launch of Masaar, covered from the sound desk to the front row.', fr: 'Scène, intervenants et public au lancement de Masaar, filmés de la régie son jusqu\'au premier rang.', ar: 'المنصة والمتحدثون والجمهور في حفل إطلاق مسار، من طاولة الصوت حتى الصف الأول.', de: 'Bühne, Redner und Publikum beim Launch von Masaar, gefilmt vom Tonpult bis zur ersten Reihe.' } },
    { slug: 'aapi-promo', client: 'aapi', hidden: true, type: 'promo', dur: '2:40',
      title: { en: 'Industrial land for investors', fr: 'Foncier industriel pour investisseurs', ar: 'العقار الصناعي للمستثمرين', de: 'Industrieflächen für Investoren' },
      desc: { en: 'A promotional film presenting available industrial plots, with drone footage and 3D motion graphics that map each plot.', fr: 'Un film promotionnel qui présente les parcelles industrielles disponibles, avec images de drone et motion design 3D pour situer chaque parcelle.', ar: 'فيلم ترويجي يعرض القطع الصناعية المتاحة، بلقطات درون وموشن غرافيك ثلاثي الأبعاد يحدّد كل قطعة.', de: 'Ein Imagefilm über verfügbare Industrieflächen, mit Drohnenaufnahmen und 3D-Motion-Graphics, die jede Parzelle verorten.' } },
    { slug: 'dilzone-vlog', client: 'dilzone', type: 'vlog', dur: '2:26',
      title: { en: 'Dil Zone Academy launch', fr: 'Lancement de Dil Zone Academy', ar: 'إطلاق أكاديمية Dil Zone', de: 'Eröffnung der Dil Zone Academy' },
      desc: { en: "The official launch of a Turkish language school, attended by prominent Turkish figures and members of parliament: the guests' arrival, the flowers and a long table of conversation.", fr: "Le lancement officiel d'une école de langue turque, en présence de personnalités turques et de membres du parlement : l'arrivée des invités, les fleurs et une longue table de discussions.", ar: 'الإطلاق الرسمي لمدرسة لتعليم اللغة التركية بحضور شخصيات تركية بارزة وأعضاء في البرلمان: وصول الضيوف والورود ومائدة طويلة من الحوار.', de: 'Der offizielle Start einer Türkisch-Sprachschule in Anwesenheit namhafter türkischer Persönlichkeiten und Parlamentsabgeordneter: die Ankunft der Gäste, Blumen und eine lange Tafel voller Gespräche.' } },
    { slug: 'funleem-podcast', client: 'memo', type: 'podcast', youtube: 'nVQ2vl1cMPc', preview: true, poster: 'https://i.ytimg.com/vi/nVQ2vl1cMPc/maxresdefault.jpg',
      title: { en: 'Secrets of baccalaureate success', fr: 'Les secrets de la réussite au bac', ar: 'أسرار التفوق في البكالوريا', de: 'Erfolgreich durchs Abitur' },
      desc: { en: 'A podcast episode with Manal Belkadi on tips, strategies and motivation for baccalaureate students. Filmed with several cameras and published on YouTube.', fr: 'Un épisode de podcast avec Manal Belkadi : conseils, stratégies et motivation pour les élèves du bac. Tourné en multicaméra et publié sur YouTube.', ar: 'حلقة بودكاست مع منال بلقاضي: نصائح واستراتيجيات وتحفيز لطلبة البكالوريا. مصوّرة بعدة كاميرات ومنشورة على يوتيوب.', de: 'Eine Podcast-Folge mit Manal Belkadi über Tipps, Strategien und Motivation fürs Abitur. Mit mehreren Kameras gedreht und auf YouTube veröffentlicht.' } },
    { slug: 'masjid', client: null, type: 'lecture', dur: '1:01', preview: true,
      title: { en: 'A lecture at the mosque', fr: 'Une conférence à la mosquée', ar: 'درس في المسجد', de: 'Ein Vortrag in der Moschee' },
      desc: { en: 'Highlights of an evening lecture: the welcome, the audience and the most powerful moments of the talk, filmed with several cameras and cut into one minute.', fr: "Les temps forts d'une conférence du soir : l'accueil, le public et les moments les plus forts de l'intervention, filmés en multicaméra et montés en une minute.", ar: 'أبرز لحظات درس مسائي: الاستقبال والحضور وأقوى لحظات الدرس، مصوّرة بعدة كاميرات ومختصرة في دقيقة واحدة.', de: 'Höhepunkte eines Abendvortrags: die Begrüßung, das Publikum und die stärksten Momente, mit mehreren Kameras gefilmt und auf eine Minute geschnitten.' } },
  ];

  const REELS = [
    { slug: 'oncam-italian', group: 'cinematic', client: 'almaahed', dur: '0:30', title: { en: "Italian classes are open", fr: "Les cours d'italien sont ouverts", ar: "دروس الإيطالية متاحة الآن", de: "Italienischkurse starten" } },
    { slug: 'oncam-kidnapping', group: 'cinematic', client: 'almaahed', dur: '0:41', title: { en: "Kidnapped, part 1", fr: "Enlevé, partie 1", ar: "الاختطاف، الجزء الأول", de: "Entführt, Teil 1" } },
    { slug: 'oncam-announcement', group: 'cinematic', client: 'almaahed', dur: '0:23', title: { en: "Something is coming", fr: "Quelque chose se prépare", ar: "شيء ما قادم", de: "Es kommt etwas" } },
    { slug: 'oncam-khem', group: 'cinematic', client: 'almaahed', dur: '1:07', title: { en: "Think again", fr: "Réfléchis bien", ar: "خمّم مليح", de: "Denk nochmal nach" } },
    { slug: 'oncam-awareness', group: 'cinematic', client: 'almaahed', dur: '0:37', title: { en: "Keep them in school", fr: "Gardez-les à l'école", ar: "لا تترك ابنك يضيع", de: "Lasst sie lernen" } },
    { slug: 'reel-voices-widad', group: 'voices', client: 'almaahed', dur: '0:39', title: { en: "Widad, English teacher", fr: "Widad, professeure d'anglais", ar: "وداد، أستاذة الإنجليزية", de: "Widad, Englischlehrerin" } },
    { slug: 'reel-voices-hamid', group: 'voices', client: 'almaahed', dur: '0:20', title: { en: "Hamid, German student", fr: "Hamid, élève d'allemand", ar: "حميد، طالب اللغة الألمانية", de: "Hamid, Deutschschüler" } },
    { slug: 'reel-voices-yasmine', group: 'voices', client: 'almaahed', dur: '0:33', title: { en: "Yasmine, former student", fr: "Yasmine, ancienne élève", ar: "ياسمين، طالبة سابقة", de: "Yasmine, ehemalige Schülerin" } },
    { slug: 'reel-voices-hacen', group: 'voices', client: 'almaahed', dur: '0:30', title: { en: "Hacen, head of teaching", fr: "Hacen, responsable pédagogique", ar: "حسن، المسؤول التربوي", de: "Hacen, pädagogischer Leiter" } },
    { slug: 'reel-voices-mohamed', group: 'voices', client: 'almaahed', dur: '0:50', title: { en: "Mohamed, English teacher", fr: "Mohamed, professeur d'anglais", ar: "محمد، أستاذ الإنجليزية", de: "Mohamed, Englischlehrer" } },
    { slug: 'reel-voices-ilyes', group: 'voices', client: 'almaahed', dur: '0:20', title: { en: "Ilyes, Spanish teacher", fr: "Ilyes, professeur d'espagnol", ar: "إلياس، أستاذ الإسبانية", de: "Ilyes, Spanischlehrer" } },
    { slug: 'reel-voices-raouf', group: 'voices', client: 'almaahed', dur: '0:19', title: { en: "Raouf, Italian teacher", fr: "Raouf, professeur d'italien", ar: "رؤوف، أستاذ الإيطالية", de: "Raouf, Italienischlehrer" } },
    { slug: 'oncam-summer', group: 'oncam', client: 'almaahed', dur: '0:36', title: { en: "Summer intensive classes", fr: "Les cours intensifs d'été", ar: "الأفواج الصيفية المكثفة", de: "Sommer-Intensivkurse" } },
    { slug: 'oncam-photo-training', group: 'oncam', client: 'almaahed', dur: '0:53', title: { en: "Photography training", fr: "Formation en photographie", ar: "تكوين في التصوير الفوتوغرافي", de: "Fotografie-Workshop" } },
    { slug: 'reel-restaurant', group: 'almaahed', client: 'almaahed', dur: '0:51', title: { en: "English at the restaurant", fr: "L'anglais au restaurant", ar: "الإنجليزية في المطعم", de: "Englisch im Restaurant" } },
    { slug: 'almaahed-event-reel', group: 'almaahed', client: 'almaahed', dur: '1:25', title: { en: "At the employment fair", fr: "Au salon de l'emploi", ar: "في صالون التشغيل", de: "Auf der Jobmesse" } },
    { slug: 'reel-houssam', group: 'almaahed', client: 'almaahed', dur: '1:18', title: { en: "Houssam's story", fr: "L'histoire de Houssam", ar: "قصة حسام", de: "Houssams Geschichte" } },
    { slug: 'reel-bac-prep', group: 'almaahed', client: 'almaahed', dur: '1:59', title: { en: "Baccalaureate prep course", fr: "La préparation au bac", ar: "دورة التحضير للبكالوريا", de: "Abitur-Vorbereitungskurs" } },
    { slug: 'reel-trip', group: 'almaahed', client: 'almaahed', dur: '0:28', title: { en: "Field trip", fr: "Sortie découverte", ar: "رحلة استكشافية", de: "Ausflug" } },
    { slug: 'reel-funleem-1', group: 'funleem', client: 'funleem', dur: '0:14', title: { en: "Pictominos cards", fr: "Les cartes Pictominos", ar: "بطاقات Pictominos", de: "Pictominos-Karten" } },
    { slug: 'reel-funleem-2', group: 'funleem', client: 'funleem', dur: '0:30', title: { en: "Learn English through play", fr: "Apprendre l'anglais en jouant", ar: "تعلّم الإنجليزية باللعب", de: "Englisch spielend lernen" } },
    { slug: 'reel-masaar-app', group: 'masaar', client: 'masaar', dur: '0:39', title: { en: "The Masaar app", fr: "L'application Masaar", ar: "تطبيق مسار", de: "Die Masaar-App" } },
    { slug: 'reel-memobac-2', group: 'memo', client: 'memo', dur: '0:58', title: { en: "Memo Bac podcast clip", fr: "Extrait du podcast Memo Bac", ar: "مقطع من بودكاست Memo Bac", de: "Clip aus dem Memo-Bac-Podcast" } },
  ];
  const SPOTLIGHT = { slug: 'oncam-italian',
    desc: { en: 'A one-minute film noir to open Italian classes: a sealed box, a man who will not talk, and one word that changes everything. Lit with a single practical lamp and graded dark, in the spirit of a crime drama.', fr: "Un film noir d'une minute pour annoncer les cours d'italien : une boîte scellée, un homme qui refuse de parler et un mot qui change tout. Éclairé par une seule lampe et étalonné sombre, dans l'esprit d'un film policier.", ar: 'فيلم نوار قصير للإعلان عن دروس اللغة الإيطالية: صندوق مغلق، ورجل يرفض الكلام، وكلمة واحدة تغيّر كل شيء. مضاء بمصباح واحد وبتدريج لوني داكن بروح أفلام الجريمة.', de: 'Ein einminütiger Film noir zum Start der Italienischkurse: eine versiegelte Schachtel, ein Mann, der schweigt, und ein Wort, das alles ändert. Mit einer einzigen Lampe beleuchtet und dunkel gegradet, im Stil eines Krimis.' },
    credits: { en: 'Concept, lighting, camera, edit and colour grade', fr: 'Concept, lumière, caméra, montage et étalonnage', ar: 'الفكرة، الإضاءة، التصوير، المونتاج والتدريج اللوني', de: 'Konzept, Licht, Kamera, Schnitt und Color Grading' } };
  const REEL_GROUPS = ['cinematic', 'voices', 'oncam', 'almaahed', 'funleem', 'masaar', 'memo'];
  // videos added through the folder ("Update videos.bat" -> videos-data.js) come first
  const VL = window.VIDEO_LIST || { reels: [], films: [] };
  REELS.unshift(...VL.reels); FILMS.unshift(...VL.films);
  VL.reels.forEach(r => { if (!REEL_GROUPS.includes(r.group)) REEL_GROUPS.push(r.group); });


  // order here = order on the site
  const CLIENT_INFO = {
   "almaahed": {
    "role": {
     "en": "Photographer & videographer, since 2024",
     "fr": "Photographe et vidéaste, depuis 2024",
     "ar": "مصوّر وصانع فيديو، منذ 2024",
     "de": "Fotograf & Videograf, seit 2024"
    },
    "summary": {
     "en": "I am the in-house photographer and filmmaker of this language and training institute. I cover its events, produced its official documentary and short film, and create its social media content, sometimes in front of the camera.",
     "fr": "Je suis le photographe et vidéaste attitré de cet institut de langues et de formation. Je couvre ses événements, j'ai réalisé son documentaire et son court métrage officiels, et je crée ses contenus pour les réseaux sociaux, parfois devant la caméra.",
     "ar": "أنا المصوّر وصانع الأفلام الخاص بهذا المعهد للغات والتكوين. أغطي فعالياته، وأنجزت فيلمه الوثائقي وفيلمه القصير الرسميين، وأصنع محتواه لمواقع التواصل، وأحيانًا أمام الكاميرا.",
     "de": "Ich bin der hauseigene Fotograf und Filmemacher dieses Sprach- und Bildungsinstituts. Ich begleite seine Veranstaltungen, habe die offizielle Dokumentation und den Kurzfilm gedreht und produziere seine Social-Media-Inhalte, manchmal vor der Kamera."
    },
    "services": [
     {
      "en": "Event coverage",
      "fr": "Couverture d’événements",
      "ar": "تغطية الفعاليات",
      "de": "Eventbegleitung"
     },
     {
      "en": "Documentary",
      "fr": "Documentaire",
      "ar": "فيلم وثائقي",
      "de": "Dokumentarfilm"
     },
     {
      "en": "Short film",
      "fr": "Court métrage",
      "ar": "فيلم قصير",
      "de": "Kurzfilm"
     },
     {
      "en": "Reels",
      "fr": "Reels",
      "ar": "ريلز",
      "de": "Reels"
     },
     {
      "en": "Presenting",
      "fr": "Présentation",
      "ar": "تقديم",
      "de": "Moderation"
     }
    ]
   },
   "masaar": {
    "role": {
     "en": "Principal photographer",
     "fr": "Photographe principal",
     "ar": "المصوّر الرئيسي",
     "de": "Hauptfotograf"
    },
    "summary": {
     "en": "As the principal photographer of the Masaar project, I covered its official opening ceremony, produced its short film and created numerous reels for its social media platforms.",
     "fr": "Photographe principal du projet Masaar, j'ai couvert sa cérémonie d'ouverture officielle, réalisé son court métrage et créé de nombreux reels pour ses réseaux sociaux.",
     "ar": "بصفتي المصوّر الرئيسي لمشروع مسار، غطّيت حفل افتتاحه الرسمي، وأنجزت فيلمه القصير، وصنعت العديد من الريلز لمنصاته على مواقع التواصل.",
     "de": "Als Hauptfotograf des Projekts Masaar habe ich die offizielle Eröffnungsfeier begleitet, den Kurzfilm produziert und zahlreiche Reels für seine Social-Media-Kanäle erstellt."
    },
    "services": [
     {
      "en": "Opening ceremony",
      "fr": "Cérémonie d’ouverture",
      "ar": "حفل الافتتاح",
      "de": "Eröffnungsfeier"
     },
     {
      "en": "Short film",
      "fr": "Court métrage",
      "ar": "فيلم قصير",
      "de": "Kurzfilm"
     },
     {
      "en": "Social media reels",
      "fr": "Reels pour les réseaux sociaux",
      "ar": "ريلز لمواقع التواصل",
      "de": "Social-Media-Reels"
     }
    ]
   },
   "dilzone": {
    "role": {
     "en": "Launch event photography & film",
     "fr": "Photo et film du lancement",
     "ar": "تصوير وفيلم حفل الإطلاق",
     "de": "Foto & Film zur Eröffnung"
    },
    "summary": {
     "en": "I covered the official launch of Dil Zone Academy, a Turkish language school. It was a landmark evening for Turkish–Algerian cultural exchange, attended by prominent Turkish figures and members of parliament, and I captured it in both photos and an event film.",
     "fr": "J'ai couvert le lancement officiel de Dil Zone Academy, une école de langue turque. Une soirée marquante pour les échanges culturels turco-algériens, en présence de personnalités turques de premier plan et de membres du parlement, que j'ai immortalisée en photos et en film.",
     "ar": "غطّيت الإطلاق الرسمي لأكاديمية Dil Zone لتعليم اللغة التركية، في أمسية بارزة للتبادل الثقافي التركي الجزائري حضرتها شخصيات تركية مرموقة وأعضاء في البرلمان، ووثّقتها بالصور وبفيلم للحدث.",
     "de": "Ich habe den offiziellen Start der Dil Zone Academy, einer Türkisch-Sprachschule, begleitet. Ein bedeutender Abend für den türkisch-algerischen Kulturaustausch, an dem namhafte türkische Persönlichkeiten und Parlamentsabgeordnete teilnahmen, festgehalten in Fotos und einem Eventfilm."
    },
    "services": [
     {
      "en": "Event photography",
      "fr": "Photographie d’événement",
      "ar": "تصوير الفعالية",
      "de": "Eventfotografie"
     },
     {
      "en": "Event film",
      "fr": "Film événementiel",
      "ar": "فيلم الفعالية",
      "de": "Eventfilm"
     },
     {
      "en": "VIP guests",
      "fr": "Invités de marque",
      "ar": "ضيوف بارزون",
      "de": "Ehrengäste"
     }
    ]
   },
   "funleem": {
    "role": {
     "en": "Reels & product photography",
     "fr": "Reels et photographie produit",
     "ar": "ريلز وتصوير المنتجات",
     "de": "Reels & Produktfotografie"
    },
    "summary": {
     "en": "Funleem is a brand specialising in educational games. I created reels for its social media and photographed its products and the activities where children and adults play and learn with them.",
     "fr": "Funleem est une marque spécialisée dans les jeux éducatifs. J'ai créé des reels pour ses réseaux sociaux et photographié ses produits ainsi que les activités où enfants et adultes jouent et apprennent avec eux.",
     "ar": "فن ليم علامة متخصصة في الألعاب التعليمية. صنعت ريلز لمواقع التواصل الخاصة بها، وصوّرت منتجاتها والأنشطة التي يلعب فيها الأطفال والكبار ويتعلمون بها.",
     "de": "Funleem ist eine Marke für Lernspiele. Ich habe Reels für ihre sozialen Medien erstellt und ihre Produkte sowie Aktivitäten fotografiert, bei denen Kinder und Erwachsene damit spielen und lernen."
    },
    "services": [
     {
      "en": "Reels",
      "fr": "Reels",
      "ar": "ريلز",
      "de": "Reels"
     },
     {
      "en": "Product photography",
      "fr": "Photographie produit",
      "ar": "تصوير المنتجات",
      "de": "Produktfotografie"
     },
     {
      "en": "Activity photography",
      "fr": "Photographie d’activités",
      "ar": "تصوير الأنشطة",
      "de": "Aktivitätsfotografie"
     }
    ]
   },
   "memo": {
    "role": {
     "en": "Podcast & social media video",
     "fr": "Podcast et vidéo pour les réseaux",
     "ar": "بودكاست وفيديو لمواقع التواصل",
     "de": "Podcast & Social-Media-Video"
    },
    "summary": {
     "en": "For this baccalaureate revision brand, I filmed a podcast episode for students with a multicamera setup, then produced reels from it and for its other content on social media.",
     "fr": "Pour cette marque de révision du bac, j'ai filmé un épisode de podcast destiné aux élèves avec un dispositif multicaméra, puis réalisé des reels à partir de celui-ci et pour ses autres contenus sur les réseaux sociaux.",
     "ar": "لصالح هذه العلامة المختصة في التحضير للبكالوريا، صوّرت حلقة بودكاست موجّهة للطلبة بعدة كاميرات، ثم أنجزت منها ومن محتواها الآخر ريلز لمواقع التواصل.",
     "de": "Für diese Abitur-Lernmarke habe ich eine Podcast-Folge für Schüler mit mehreren Kameras gedreht und daraus sowie für weitere Inhalte Reels für die sozialen Medien produziert."
    },
    "services": [
     {
      "en": "Multicamera podcast",
      "fr": "Podcast multicaméra",
      "ar": "بودكاست بعدة كاميرات",
      "de": "Multikamera-Podcast"
     },
     {
      "en": "Reels",
      "fr": "Reels",
      "ar": "ريلز",
      "de": "Reels"
     }
    ]
   },
   "aapi": {
    "role": {
     "en": "Promotional film",
     "fr": "Film promotionnel",
     "ar": "فيلم ترويجي",
     "de": "Imagefilm"
    },
    "summary": {
     "en": "A promotional film for the Algerian Investment Promotion Agency presenting industrial land available to investors, combining drone footage with 3D motion graphics that map each plot.",
     "fr": "Un film promotionnel pour l'Agence algérienne de promotion de l'investissement présentant le foncier industriel disponible, mêlant images de drone et motion design 3D qui situe chaque parcelle.",
     "ar": "فيلم ترويجي للوكالة الجزائرية لترقية الاستثمار يعرض العقار الصناعي المتاح للمستثمرين، يجمع بين لقطات الدرون وموشن غرافيك ثلاثي الأبعاد يحدّد كل قطعة.",
     "de": "Ein Imagefilm für die Algerische Agentur für Investitionsförderung über verfügbare Industrieflächen, mit Drohnenaufnahmen und 3D-Motion-Graphics, die jede Parzelle verorten."
    },
    "services": [
     {
      "en": "Drone filming",
      "fr": "Prises de vue par drone",
      "ar": "تصوير بالدرون",
      "de": "Drohnenaufnahmen"
     },
     {
      "en": "3D motion graphics",
      "fr": "Motion design 3D",
      "ar": "موشن غرافيك ثلاثي الأبعاد",
      "de": "3D-Motion-Graphics"
     },
     {
      "en": "Editing",
      "fr": "Montage",
      "ar": "مونتاج",
      "de": "Schnitt"
     }
    ]
   }
  };
  const CLIENT_FILM = {"almaahed":"graduation-2026","masaar":"masaar-event","dilzone":"dilzone-vlog","funleem":"reels:funleem","memo":"funleem-podcast","aapi":null};

  // Photos come from assets/js/photos-data.js, generated by "Update photos.bat"
  const PL = window.PHOTO_LIST || { cats: [], photos: [] };
  // each category can have its own big photo at the top (a file named cover... in its folder); 'All' opens with the Events one
  const withPaths = c => ({ ...c, xs: P + c.id + '-xs.webp', sm: P + c.id + '-sm.webp', lg: P + c.id + '.webp' });
  const COVERS = Object.fromEntries(Object.entries(PL.covers || (PL.cover ? { [PL.cover.cat]: PL.cover } : {})).map(([k, c]) => [k, withPaths(c)]));
  const COVER = COVERS.events || (PL.cover && COVERS[PL.cover.cat]) || Object.values(COVERS)[0] || null;
  const PHOTOS = PL.photos.map(p => ({ ...p, xs: P + p.id + '-xs.webp', sm: P + p.id + '-sm.webp', lg: P + p.id + '.webp' }));
  const CAT_LABELS = Object.fromEntries(PL.cats.map(c => [c.key, c.label]));
  // interleave categories for the "All" view so the wall reads as a mix
  const pools = {}; PHOTOS.forEach(p => (pools[p.cat] = pools[p.cat] || []).push(p));
  const keys = PL.cats.map(c => c.key), weight = { events: 3, classroom: 2 };
  const order = keys.flatMap(k => Array(weight[k] || 1).fill(k));
  const MIXED = []; let k = 0;
  while (MIXED.length < PHOTOS.length && k < 100000) { const c = order[k++ % order.length]; if (pools[c] && pools[c].length) MIXED.push(pools[c].shift()); }

  // Case studies: the brief, what I did, behind-the-scenes stills (assets/media/site/) and the finished work.
  const S = R + 'assets/media/site/';
  const CASES = [
    { client: 'masaar', cover: 'masaar-event', play: 'masaar-shortfilm',
      title: { en: 'Launching Masaar', fr: 'Le lancement de Masaar', ar: 'إطلاق مسار', de: 'Der Start von Masaar' },
      brief: { en: 'Masaar is a youth programme with its own app. They needed to introduce the young team behind it, cover the public launch with speakers on stage and a full hall, and keep their pages alive in the weeks after.',
        fr: "Masaar est un programme pour les jeunes, avec sa propre application. Il fallait présenter la jeune équipe qui le porte, couvrir le lancement public, avec des intervenants sur scène et une salle comble, puis faire vivre leurs pages les semaines suivantes.",
        ar: 'مسار برنامج موجّه للشباب وله تطبيقه الخاص. كان المطلوب تقديم الفريق الشاب الذي يقف وراءه، وتغطية حفل الإطلاق بمتحدثيه وقاعته الممتلئة، ثم إبقاء صفحاتهم نشطة في الأسابيع التالية.',
        de: 'Masaar ist ein Jugendprogramm mit eigener App. Es galt, das junge Team dahinter vorzustellen, den öffentlichen Launch mit Rednern auf der Bühne und vollem Saal zu filmen und die Kanäle in den Wochen danach zu bespielen.' },
      did: [
        { en: 'A short film about the team, from their first meeting to the night the results were announced', fr: "Un court métrage sur l'équipe, de la première réunion au soir de l'annonce des résultats", ar: 'فيلم قصير عن الفريق، من أول لقاء إلى ليلة إعلان النتائج', de: 'Ein Kurzfilm über das Team, vom ersten Treffen bis zum Abend der Ergebnisse' },
        { en: 'The opening ceremony filmed from the stage to the back row, with drone shots inside the hall', fr: "La cérémonie d'ouverture filmée de la scène au dernier rang, avec des plans de drone dans la salle", ar: 'حفل الافتتاح مصوَّرًا من المنصة إلى آخر صف، مع لقطات درون داخل القاعة', de: 'Die Eröffnungsfeier, gefilmt von der Bühne bis zur letzten Reihe, mit Drohnenaufnahmen im Saal' },
        { en: 'Reels for the app launch and the weeks that followed', fr: "Des reels pour le lancement de l'application et les semaines suivantes", ar: 'ريلز لإطلاق التطبيق وللأسابيع التي تلته', de: 'Reels zum App-Launch und für die Wochen danach' } ],
      bts: [
        [S + 'case-masaar-1.webp', { en: 'On set', fr: 'Sur le tournage', ar: 'أثناء التصوير', de: 'Am Set' }],
        [S + 'case-masaar-2.webp', { en: 'A drone flight inside the hall', fr: 'Un vol de drone dans la salle', ar: 'تحليق الدرون داخل القاعة', de: 'Drohnenflug im Saal' }],
        [S + 'case-masaar-3.webp', { en: "The drone's live view", fr: 'Le retour vidéo du drone', ar: 'البث المباشر من الدرون', de: 'Das Livebild der Drohne' }],
        [S + 'case-masaar-4.webp', { en: 'At the sound desk', fr: 'À la régie son', ar: 'عند طاولة الصوت', de: 'Am Tonpult' }] ],
      films: ['masaar-shortfilm', 'masaar-event'] },
    { client: 'almaahed', cover: 'almaahed-documentary', play: 'almaahed-documentary',
      title: { en: 'Almaahed International, all year round', fr: "Almaahed International, toute l'année", ar: 'Almaahed International على مدار السنة', de: 'Almaahed International, das ganze Jahr' },
      brief: { en: 'A language institute that wanted a steady flow of films and photos: who they are, their big days, and regular content for their social media.',
        fr: 'Un institut de langues qui voulait des films et des photos en continu : qui ils sont, leurs grands jours et du contenu régulier pour leurs réseaux sociaux.',
        ar: 'معهد لغات أراد تدفقًا مستمرًا من الأفلام والصور: من هم، وأيامهم الكبرى، ومحتوى منتظمًا لمنصاتهم.',
        de: 'Ein Sprachinstitut, das laufend Filme und Fotos wollte: wer sie sind, ihre großen Tage und regelmäßige Inhalte für Social Media.' },
      did: [
        { en: "A documentary in which teachers, students and parents speak, and the institute's official short film", fr: "Un documentaire où parlent enseignants, élèves et parents, et le court métrage officiel de l'institut", ar: 'فيلم وثائقي يتحدث فيه الأساتذة والطلبة والأولياء، والفيلم القصير الرسمي للمعهد', de: 'Ein Dokumentarfilm, in dem Lehrkräfte, Schüler und Eltern zu Wort kommen, und der offizielle Kurzfilm des Instituts' },
        { en: "Event films: graduation and World Teachers' Day, Ramadan", fr: "Des films d'événements : remise des diplômes et Journée des enseignants, Ramadan", ar: 'أفلام فعاليات: حفل التخرج واليوم العالمي للمعلم، ورمضان', de: 'Eventfilme: Abschlussfeier und Weltlehrertag, Ramadan' },
        { en: 'Reel series: announcements I present on camera, and testimonials from teachers and students', fr: "Des séries de reels : des annonces que je présente face caméra et des témoignages d'enseignants et d'élèves", ar: 'سلاسل ريلز: إعلانات أقدّمها أمام الكاميرا، وشهادات أساتذة وطلبة', de: 'Reel-Serien: Ankündigungen, die ich vor der Kamera präsentiere, und Stimmen von Lehrkräften und Schülern' },
        { en: 'Photography in classes and at events', fr: 'Des photos en classe et lors des événements', ar: 'تصوير فوتوغرافي في الأقسام وخلال الفعاليات', de: 'Fotos im Unterricht und bei Veranstaltungen' } ],
      bts: [
        [S + 'case-almaahed-1.webp', { en: 'A camera running quietly during class', fr: 'Une caméra qui tourne discrètement pendant le cours', ar: 'كاميرا تصوّر بهدوء أثناء الدرس', de: 'Eine Kamera läuft leise im Unterricht' }],
        [S + 'case-almaahed-2.webp', { en: "Filming at the students' eye level", fr: 'Filmer à hauteur des élèves', ar: 'التصوير بمستوى نظر الطلبة', de: 'Auf Augenhöhe der Schüler gefilmt' }],
        [S + 'case-almaahed-3.webp', { en: 'The interview set for the documentary', fr: "Le plateau d'interview du documentaire", ar: 'ديكور المقابلات في الفيلم الوثائقي', de: 'Das Interview-Set für die Doku' }] ],
      films: ['almaahed-documentary', 'almaahed-shortfilm', 'graduation-2026', 'ramadan'] },
  ];

  return { FORM_KEY, V, CLIENTS, TYPE, FILMS: FILMS.filter(f => !f.hidden), REELS, SPOTLIGHT, REEL_GROUPS, CLIENT_INFO, CLIENT_FILM, PHOTOS: MIXED, COVER, COVERS, CATS: keys, CAT_LABELS, CASES };
})();
