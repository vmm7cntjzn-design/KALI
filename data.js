/* ═══════════════════════════════════════════════════════════
   KALI — data.js  (v3)
   Veranstalter zusammengeführt, URLs geprüft, Kontexte ergänzt
═══════════════════════════════════════════════════════════ */
(function() {

function K(id, name, sitz, segment, contacts, opts) {
  opts = opts || {};
  var c = contacts[0] || {};
  return {
    id, name, sitz, segment,
    // Haupt-Ansprechpartner (erster)
    ansprechpartner: c.name || '',
    position:        c.position || '',
    telefon:         c.telefon || '',
    email:           c.email || '',
    // Alle Ansprechpartner
    kontakte: contacts,
    status: 'vorbereitet',
    homepage:       opts.homepage || '',
    tags:           opts.tags    || [],
    score:          opts.score   || { luecken: 3, budgetfit: 3 },
    radar:          opts.radar   || { luxusniveau: 3, gruppengroesse: 3, nachhaltigkeit: 3, ostafrikatiefe: 3, innovation: 3 },
    positionierung: opts.pos     || [],
    destinationen:  opts.dest    || { aktiv: [], duenn: [], fehlt: [] },
    fokusReisen:    opts.fokus   || { Kenia: [], Uganda: [], Ruanda: [], Tansania: [] },
    luecken:        opts.luecken || [],
    pitchIdeen:     opts.pitches || [],
    kontextNotizen: opts.kontext || '',
    gespraechsNotizen: '', nextSteps: '', letzterKontakt: ''
  };
}
function L(id,t,p,b){ return {id,titel:t,prio:p,beschreibung:b}; }
function P(id,t,tags){ return {id,text:t,tags}; }
function FR(name,url,typ,tags){ return {name,url,typ,tags:tags||[]}; }
function KT(name,pos,tel,email,laender){ return {name,position:pos,telefon:tel,email,laender:laender||[]}; }

var defaultKunden = [

// ══════════════════════════════════════════════════════════
// WINDROSE
// ══════════════════════════════════════════════════════════
K('windrose','WINDROSE Finest Travel','Berlin','Ultra-Luxus / Individualreisen',
  [KT('Verena Hartmann','Reisedesignerin Afrika & Arabien','','',['Kenia','Uganda','Ruanda','Tansania'])],
  {
        homepage: 'https://www.windrose.de',
    tags:['Luxus','Individual','Kleingruppen','Studienreisen','Business Class'],
    score:{luecken:4,budgetfit:4},
    radar:{luxusniveau:5,gruppengroesse:2,nachhaltigkeit:3,ostafrikatiefe:3,innovation:4},
    pos:['Ultra-Luxus','Individual','Kleingruppe max. 12','Business Class','Wow-Effekt','Handverlesene Hideaways'],
    dest:{aktiv:['Kenia','Tansania','Ruanda','Uganda'],duenn:['Mosambik'],fehlt:['Äthiopien']},
    fokus:{
      Kenia:[
        FR('Kenia Rundreise – Flugsafari (11T)','https://windrose.de/de-de/kenia-rundreise','Privatreise',['masai mara','samburu','laikipia']),
        FR('Kenia par Excellence – Individualreise (10T)','https://www.windrose.de/reiseziele/afrika/kenia/privatreise/kenia-par-excellence','Privatreise',['masai mara','laikipia','mombasa']),
        FR('Kenia Familienreise – Flugsafari & Strand (12T)','https://windrose.de/reiseziele/afrika/kenia/privatreise/kenia-fuer-grosse-und-kleine-abenteurer','Privatreise',['masai mara','amboseli','diani']),
        FR('Rhythmus der Wildnis – Flugsafari (11T)','https://windrose.de/de-de/rundreise-kenia-deluxe','Privatreise'),
        FR('Kenia & Ruanda Kombireise (12T)','https://windrose.de/de-de/kenia-ruanda-rundreise-deluxe','Privatreise',['masai mara','volcanoes','nyungwe']),
        FR('Kenia Jenseits von Afrika – Private Rundreise','https://windrose.de/reiseziele/afrika/kenia/privatreise/kenia-jenseits-von-afrika','Privatreise',['masai mara','laikipia','samburu']),
        FR('Kenia – Wilde Schönheit (Gruppenreise)','https://www.windrose.de/reiseziele/afrika/kenia/gruppenreise','Gruppenreise',['masai mara','amboseli','tsavo'])],
      Tansania:[
        FR('Tansania Rundreise – Serengeti & Ngorongoro (10T)','https://windrose.de/de-de/rundreise-tansania-deluxe','Privatreise'),
        FR('Tansania par Excellence – Safari & Sansibar (10T)','https://www.windrose.de/reiseziele/afrika/tansania/privatreise/tansania-par-excellence','Privatreise',['serengeti','ngorongoro','zanzibar']),
        FR('Out of Africa – Serengeti Select (10T)','https://windrose.de/de-de/rundreise-tansania-select-2025','Privatreise'),
        FR('Das Beste von Tansania (7T)','https://www.windrose.de/reiseziele/afrika/tansania/privatreise/das-beste-von-tansania','Privatreise',['serengeti','ngorongoro','tarangire']),
        FR('Tansania – Königreich der Tiere (Gruppenreise, 10T)','https://www.windrose.de/reiseziele/afrika/tansania/gruppenreise/tansania-koenigreich-der-tiere','Gruppenreise',['serengeti','ngorongoro','manyara']),
        FR('Tansania 2025 – Serengeti Rundreise Select','https://www.windrose.de/de-de/rundreise-tansania-select-2025','Privatreise')],
      Ruanda:[
        FR('Ruanda – Vulkane & Berggorillas','https://www.windrose.de/reiseziele/afrika/ruanda/privatreise/ruanda-vulkane-und-berggorillas','Privatreise',['volcanoes','nyungwe','akagera']),
        FR('Ruanda kurz & intensiv – Gorillas & Safari','https://www.windrose.de/reiseziele/afrika/ruanda/privatreise/ruanda-kurz-und-intensiv','Privatreise',['volcanoes','akagera']),
        FR('Ruanda Rundreise Select (12T)','https://windrose.de/de-de/ruanda-rundreise-select','Privatreise',['volcanoes','nyungwe','akagera','kigali'])],
      Uganda:[
        FR('Uganda – Die Perle Afrikas (11T, Gorilla & Schimpansen)','https://www.windrose.de/reiseziele/afrika/uganda/privatreise/uganda-die-perle-afrikas','Privatreise',['bwindi','kibale','queen elizabeth','murchison'])],
    },
    luecken:[
      L('l1','Walking Safari Kenia','hoch','Laikipia/Mount Kenya Walking Safaris fehlen komplett. Passt perfekt zur ICH-Moment-Philosophie.'),
      L('l2','Gorilla-Trekking Tiefenprodukt','hoch','Uganda/Ruanda vorhanden, aber generisch. Luxury-Kombination Bwindi+Kibale+Volcanoes als Exklusivroute fehlt.'),
      L('l3','Photographic Safari','mittel','Kein dediziertes Angebot. Hohe Zahlungsbereitschaft bei Windrose-Klientel.'),
      L('l4','Tansania Off-the-beaten-track','mittel','Selous/Mahale Chimps fehlen. Nur Serengeti-Mainstream sichtbar.')],
    pitches:[
      P('p1','Walking Safari Kenia: Laikipia + Mount Kenya, private Concessions, max. 6 Pax, Fly-in',['walking-safari','kenia','laikipia','fly-in','luxury','premium']),
      P('p2','Gorilla Luxury Kombi: Bwindi Uganda + Volcanoes Ruanda, 10 Tage Exklusivroute',['gorilla','uganda','ruanda','luxury','bwindi','volcanoes','premium']),
      P('p3','Photographic Safari Kenia: Masai Mara + Samburu, max. 6 Pax, professioneller Guide',['kenia','fotografie','luxury','masai-mara','samburu','premium','photographic']),
      P('p4','Tansania Wildnis: Selous + Mahale Schimpansen, Off-the-beaten-track Luxusroute',['tansania','selous','chimps','mahale','luxury','nische','primaten'])],
    kontext:'WINDROSE Finest Travel: Gegründet 1973 in Berlin von Dr. Hans-Peter Holzinger. Eigentümerwechsel: 2008 Waterland PE → 2012 RT/Raiffeisen Touristik → 2017 FTI Gruppe → 09.08.2024 ASI Reisen (Innsbruck). Nicht von FTI-Insolvenz betroffen; WINDROSE war eigenständige Tochter. Managing Director Christian Böll führt unverändert weiter. Umsatz ~30 Mio. EUR (Stand 2012, Angabe Waterland). Vorjahresumsatz 2024 bereits übertroffen laut Pressemitteilung. ASI signalisiert Investitionsbereitschaft in Technik, Digitalisierung, Nachhaltigkeit. Ca. 40 Mitarbeiter. Standort Berlin, Niederlassung Wien. Quellen: Pressemitteilung ASI/WINDROSE 09.08.2024; Insolvenzverwalter Axel Bierbach/MHBK; Tagesspiegel 2012; reisevor9.de 2024.',
  }
),

// ══════════════════════════════════════════════════════════
// LERNIDEE (zusammengeführt)
// ══════════════════════════════════════════════════════════
K('lernidee','Lernidee Erlebnisreisen','Berlin','Gruppenreisen / Bahnreisen / Individual',
  [
    KT('Susanne Willeke','Teamleiterin Afrika & Rovos Rail','+49 30 786 000-24','s.willeke@lernidee.de',['Kenia','Uganda','Ruanda','Tansania']),
    KT('Martina Heinz','Produktmanagerin Afrika','+49 30 786 000-56','m.heinz@lernidee.de',['Kenia','Tansania']),
    KT('Monika Kolakovic','Produktmanagerin Afrika','+49 30 786 000-68','m.kolakovic@lernidee.de',['Kenia','Tansania'])],
  {
        homepage: 'https://www.lernidee.de',
    tags:['Gruppenreisen','Bahnreisen','Rovos Rail','Studienreisen','Individual'],
    score:{luecken:4,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:4,nachhaltigkeit:3,ostafrikatiefe:3,innovation:3},
    pos:['Gruppenreisen','Bahnreisen','Rovos Rail','Ostafrika','Familienbetrieb seit 1986'],
    dest:{aktiv:['Kenia','Tansania','Uganda','Ruanda'],duenn:[],fehlt:[]},
    fokus:{
      Kenia:[FR('Kenia & Ostafrika Safari','https://www.lernidee.de/reisen/kat/Afrika','Gruppenreise',['masai mara','amboseli','tsavo'])],
      Tansania:[FR('Tansania-Safari & Rovos Rail (Kapstadt–Daressalam)','https://www.lernidee.de/reisen/kat/Afrika','Bahnreise',['serengeti','ngorongoro','kilimanjaro'])],
      Ruanda:[FR('Ruanda Safari & Gorilla','https://www.lernidee.de/reisen/kat/Afrika','Gruppenreise',['volcanoes','nyungwe','akagera'])],
      Uganda:[FR('Uganda & Ruanda – Berggorillas (15T, max. 6 Gäste/Fahrzeug)','https://www.lernidee.de/reise.html?r=2550','Gruppenreise',['bwindi','kibale','volcanoes'])],
    },
    luecken:[
      L('ll1','Walking Safari fehlt','hoch','Kein Walking Safari Produkt. Passt zur Naturbeobachtungs-DNA.'),
      L('ll2','Tansania Nischenprodukte','mittel','Selous/Ruaha fehlen. Nur klassische Serengeti-Route sichtbar.')],
    pitches:[
      P('lp1','Uganda Gorilla-Trekking als Add-on zu Kenia-Gruppenreise: Bwindi + Kibale, 5 Tage',['uganda','gorilla','chimps','gruppenreise','bwindi']),
      P('lp2','Tansania Chimps & Serengeti: Mahale-Schimpansen als Studienreise-Ergänzung',['tansania','chimps','mahale','serengeti','studienreise'])],
    kontext:'Lernidee Erlebnisreisen GmbH: Gegründet 1986 in Berlin von Hans Engberding (Alleininhaber). Familienbetrieb. Ca. 80 Mitarbeiter, Büros in Berlin, Hamburg, Homburg/Saar, Heilbronn. Bilanzsumme 13,8 Mio. EUR (2023, +16,5% zum Vorjahr). Portfolio: Mehr als 200 Zugreisen, Schiffsreisen, Individual- und Gruppenreisen. Kernkompetenz: Rovos Rail (Kapstadt–Daressalam), Transsib, Orient Express. Uganda/Ruanda aktiv (max. 6 Gäste/Fahrzeug). Ansprechpartner: Susanne Willeke (Teamleiterin Afrika & Rovos Rail), Martina Heinz und Monika Kolakovic (beide Produktmanagerinnen Afrika), alle auf lernidee.de/service/unser-team benannt. Quellen: lernidee.de; Implisense Bilanzdaten 2023; wer-zu-wem.de.',
  }
),

// ══════════════════════════════════════════════════════════
// IWANOWSKI'S
// ══════════════════════════════════════════════════════════
K('iwanowski',"Iwanowski's Reisen (afrika.de)",'Neuss','Individualreisen / Spezialveranstalter',
  [KT('Michael Iwanowski','Geschäftsführer & Gründer','+49 2133 26030','info@afrika.de',['Kenia','Uganda','Ruanda','Tansania'])],
  {
        homepage: 'https://www.afrika.de',
    tags:['Individualreisen','Bausteinreisen','Safari-Spezialist','Alle 4 Fokusländer'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:2,nachhaltigkeit:4,ostafrikatiefe:5,innovation:3},
    pos:['Individualreisen','Bausteinreisen','Afrika-Spezialist','ITB LifetimeAward 2014'],
    dest:{aktiv:['Kenia','Tansania','Uganda','Ruanda'],duenn:[],fehlt:[]},
    fokus:{
      Kenia:[FR('Individuelle Kenia & Tansania Safari (Bausteine)','https://www.afrika.de/kenia-tansania/','Individualreise',['masai mara','serengeti','ngorongoro'])],
      Tansania:[FR('Tansania Individualsafaris (inkl. Flugsafari Süden)','https://www.afrika.de/tansania/','Individualreise',['serengeti','ruaha','selous','zanzibar'])],
      Uganda:[FR('Uganda & Ruanda Individualreise','https://www.afrika.de/uganda-ruanda/safaris/','Individualreise',['bwindi','kibale','volcanoes','nyungwe'])],
      Ruanda:[FR('Ruanda & Uganda Individualreise','https://www.afrika.de/uganda-ruanda/','Individualreise',['volcanoes','nyungwe','bwindi','kibale'])],
    },
    luecken:[L('iw1','Luxury-Tier unterrepräsentiert','mittel','Portfolio eher mid-range. Walking Safari, Fly-in, Private Concessions als Premium-Option fehlen.')],
    pitches:[
      P('ip1','Luxury Walking Safari Uganda: Bwindi Private Concession + Kibale, max. 4 Pax',['uganda','gorilla','walking-safari','luxury','bwindi','premium']),
      P('ip2','Tansania Fly-in Süden: Selous + Ruaha, Luxury Camps, Kleinflugzeug',['tansania','selous','fly-in','luxury','nische','ruaha'])],
    kontext:"Iwanowski's Reisen GmbH (Marke: afrika.de): Gegründet von Michael Iwanowski, Sitz Neuss. ITB LifetimeAward 2014 (Fachmesse-Auszeichnung für lebenslanges Engagement). Tiefste Afrika-Expertise im DACH-Markt. Alle 4 Fokusländer aktiv. E-Mail-Muster: info@afrika.de; persönlich direkt an GF. Portfolio: individuelle Bausteinreisen, Camping, Lodge, Mid-Range bis Upper-Mid. Quellen: afrika.de; ITB Pressemitteilung 2014.",
  }
),

// ══════════════════════════════════════════════════════════
// STUDIOSUS
// ══════════════════════════════════════════════════════════
K('studiosus','Studiosus Reisen','München','Studienreisen / Gruppenreisen',
  [KT('Peter-Mario Kubsch','Geschäftsführer','+49 89 500 60','info@studiosus.com',['Kenia','Tansania'])],
  {
        homepage: 'https://www.studiosus.com',
    tags:['Studienreisen','Gruppenreisen','Kulturreisen','Wissenschaft'],
    score:{luecken:4,budgetfit:2},
    radar:{luxusniveau:3,gruppengroesse:5,nachhaltigkeit:3,ostafrikatiefe:2,innovation:2},
    pos:['Marktführer Studienreisen','Wissenschaftliche Begleitung','ab 8.920€ p.P.','Klimakompensation inkl.'],
    dest:{aktiv:['Kenia','Tansania'],duenn:[],fehlt:['Uganda','Ruanda']},
    fokus:{
      Kenia:[FR('Kenia und Tansania – Naturparks Ostafrikas (16T, ab 8.920€)','https://www.studiosus.com/reise/kenia-tansania/7301K-kenia-und-tansania-naturparks-ostafrikas-flug-mit-lufthansa-fluganreise','Studienreise',['masai mara','amboseli','serengeti','ngorongoro'])],
      Tansania:[
        FR('Tansania – auf Safari (10T)','https://www.studiosus.com/Tansania/Ngorongoro-Krater/smart-and-small/7344E--Tansania-auf-Safari--Eigenanreise','Studienreise',['serengeti','ngorongoro','tarangire','manyara']),
        FR('Tansania – Sansibar – Serengeti darf nicht sterben','https://www.studiosus.com/Tansania/Sansibar/Studienreise/Rundreise/7318K--Tansania-Sansibar-Serengeti-darf-nicht-sterben-Flug-mit-KLM--Fluganreise','Studienreise')],
      Uganda:[],Ruanda:[],
    },
    luecken:[
      L('st1','Uganda & Ruanda komplett fehlend','hoch','Gorilla-Trekking als Studienreise (Primaten-Verhalten) wäre einzigartiges Alleinstellungsmerkmal.'),
      L('st2','Tansania nur als Kenia-Kombi','mittel','Kein eigenständiges Tansania-Tiefenprodukt (Selous, Ruaha).')],
    pitches:[P('stp1','Gorilla-Studienreise Uganda/Ruanda: Verhaltensforschung Bwindi, max. 12 Pax, wissenschaftliche Begleitung',['uganda','ruanda','gorilla','studienreise','primaten','gruppenreise'])],
    kontext:'Studiosus Reisen München GmbH: Gegründet 1954, Marktführer Studienreisen Deutschland. GF: Peter-Mario Kubsch. Über 600 Reisen in 100 Ländern. Typische Gruppengrößen 10–30 Personen. Preise ab 8.920€ p.P. (Ostafrika). Klimakompensation standardmäßig inkl. (CO2-Offset über Partner). Reiseleitung durchgehend wissenschaftlich qualifiziert. Uganda/Ruanda komplett unbesetzt — trotz starker Nachfrage nach Primaten-Studienreisen. Quellen: studiosus.com; DRV-Verbandsangaben.',
  }
),

// ══════════════════════════════════════════════════════════
// GEBECO
// ══════════════════════════════════════════════════════════
K('gebeco','Gebeco','Kiel','Gruppenreisen / Erlebnisreisen',
  [KT('Produktmanagement Afrika','Produktmanager Afrika','+49 431 545 45 0','info@gebeco.de',['Kenia','Uganda','Ruanda'])],
  {
        homepage: 'https://www.gebeco.de',
    tags:['Gruppenreisen','Erlebnisreisen','max. 12 Pers.','Community-Erlebnisse'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:4,nachhaltigkeit:3,ostafrikatiefe:3,innovation:3},
    pos:['Gruppenreisen','max. 12 Personen','Community-Erlebnisse','Kiel-Zentrale'],
    dest:{aktiv:['Kenia','Uganda','Ruanda'],duenn:['Tansania'],fehlt:[]},
    fokus:{
      Kenia:[FR('Kenia & Tansania – Savannenträume (13T)','https://www.gebeco.de/reisen/kenia-und-tansania/2430006/','Gruppenreise',['masai mara','amboseli','serengeti','ngorongoro'])],
      Uganda:[FR('Von Uganda nach Ruanda: Gorilla-Treks & Safaris','https://www.gebeco.de/reisen/von-uganda-nach-ruanda-gorilla-treks-safaris/4G9X108/','Gruppenreise',['bwindi','kibale','volcanoes','nyungwe'])],
      Ruanda:[FR('Von Uganda nach Ruanda: Gorilla-Treks & Safaris','https://www.gebeco.de/reisen/von-uganda-nach-ruanda-gorilla-treks-safaris/4G9X108/','Gruppenreise')],
      Tansania:[],
    },
    luecken:[L('gb1','Tansania eigenständig fehlt','mittel','Tansania nur als Kenia-Kombi. Eigenständige Tansania-Gruppenreise fehlt.')],
    pitches:[P('gbp1','Uganda + Ruanda Gorilla Luxury Upgrade: Premium Lodges + Community, max. 8 Pax',['uganda','ruanda','gorilla','luxury','community','gruppenreise'])],
    kontext:'Gebeco GmbH & Co. KG: Sitz Kiel, zur DER Touristik Gruppe gehörend (Rewe Group). Erlebnisreisen in Kleingruppen (max. 12 Personen). Kein Einzelname öffentlich — E-Mail-Muster: vorname.nachname@gebeco.de. Alle 4 Fokusländer aktiv. Quellen: gebeco.de; DER Touristik Impressum.',
  }
),

// ══════════════════════════════════════════════════════════
// DIAMIR
// ══════════════════════════════════════════════════════════
K('diamir','DIAMIR Erlebnisreisen','Dresden','Aktivreisen / Naturreisen',
  [KT('Afrika-Reiseberatung','Reiseberater Afrika','+49 351 31207-0','info@diamir.de',['Kenia','Uganda','Ruanda','Tansania'])],
  {
        homepage: 'https://www.diamir.de',
    tags:['Aktivreisen','Naturreisen','Fotoreisen','4–7 Teilnehmer'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:2,gruppengroesse:3,nachhaltigkeit:3,ostafrikatiefe:4,innovation:4},
    pos:['Aktivreisen','Naturreisen','Fotoreisen','Serengeti-Fotocampus','4–7 Teilnehmer'],
    dest:{aktiv:['Kenia','Uganda','Ruanda'],duenn:['Tansania'],fehlt:[]},
    fokus:{
      Kenia:[
        FR('Kenia – Gnuwanderung & Serengeti (13T)','https://www.diamir.de/tansania+kenia/reise/KENMIG','Naturreise'),
        FR('Kenia & Uganda – Gnu Wanderung & Gorillas (15T)','https://www.diamir.de/kenia+uganda/privatreise/KENUGA','Aktivreise',['masai mara','bwindi','queen elizabeth']),
        FR('Kenia Safari und Baden (14T, ab 2.990€)','https://www.diamir.de/kenia/reise/kenlod','Naturreise',['masai mara','amboseli','tsavo','diani']),
        FR('Kenia – Safari, Masai Mara & Big Five (15T)','https://www.diamir.de/kenia/reise/KENLTC','Naturreise'),
        FR('Kenia Fly-in Safari Amboseli & Masai Mara (5T, ab 4.090€)','https://www.diamir.de/kenia/privatreise/KENFLYA','Privatreise'),
        FR('Kenia Fly-in Safari Loisaba & Masai Mara + Lamu (8T)','https://www.diamir.de/kenia/privatreise/KENFLY10','Privatreise')],
      Tansania:[
        FR('Serengeti-Fotocampus zur großen Migration (11T, ab 8.290€)','https://www.diamir.de/tansania/reise/TANFO1','Fotoreise'),
        FR('Kenia & Tansania Safari & Migration (8T)','https://www.diamir.de/kenia+tansania/privatreise/KENLUX','Naturreise',['masai mara','serengeti','ngorongoro'])],
      Uganda:[
        FR('Uganda & Ruanda – Berggorillas & Schimpansen (14T, ab 4.390€)','https://www.diamir.de/uganda+ruanda/reise/UGARUA','Gruppenreise',['bwindi','kibale','volcanoes','nyungwe']),
        FR('Kenia & Uganda – Gnu Wanderung & Gorillas (15T)','https://www.diamir.de/kenia+uganda/reise/UGAS25','Gruppenreise')],
      Ruanda:[FR('Ruanda & Uganda – Berggorillas im Bwindi-NP (5T Baustein, ab 990€)','https://www.diamir.de/ruanda+uganda/reisebaustein/RUAGOR5','Reisebaustein')],
    },
    luecken:[
      L('di1','Tansania Nischen fehlen','mittel','Selous/Ruaha nicht im Portfolio. Fotoreise-Fokus — Walking Safari Selous würde passen.'),
      L('di2','Luxury-Segment fehlt','mittel','Premium Walking Safari oder Fly-Camp als neue Zielgruppe.')],
    pitches:[
      P('dip1','Tansania Walking Safari: Selous + Ruaha, Trekking-Fokus, max. 8 Pax',['tansania','selous','walking-safari','trekking','nische','ruaha']),
      P('dip2','Uganda Kidepo Valley: Remote Safari + Gorilla, Off-the-beaten-track',['uganda','kidepo','offbeat','gorilla','abenteuer','nische'])],
    kontext:'DIAMIR Erlebnisreisen GmbH: Sitz Dresden. Spezialist für Aktivreisen und Naturreisen (4–7 Teilnehmer). Vollständigstes Uganda-Ruanda-Programm im DACH-Markt lt. eigener Recherche. Einzigartiger Fotoreisen-Fokus: Serengeti-Fotocampus mit Michael Lohmann (ab 8.290€). Reisebaustein-System ermöglicht flexible Kombination. E-Mail-Muster: vorname.nachname@diamir.de. Kein Einzelname öffentlich auffindbar. Quellen: diamir.de; Reiseportal-Vergleiche.',
  }
),

// ══════════════════════════════════════════════════════════
// CHAMÄLEON (zusammengeführt)
// ══════════════════════════════════════════════════════════
K('chamaeleon','Chamäleon Reisen','Berlin','Kleingruppen / Nachhaltige Erlebnisreisen',
  [
    KT('Tim','Reiseexperte Afrika (Uganda & Kenia)','+49 30 887 28 47 0','info@chamaeleon-reisen.de',['Uganda','Kenia']),
    KT('Reiseexpertin (aufgew. in Ruanda)','Reiseexpertin Afrika / Ruanda & Ostafrika','+49 30 887 28 47 0','info@chamaeleon-reisen.de',['Ruanda','Ostafrika'])],
  {
        homepage: 'https://www.chamaeleon-reisen.de',
    tags:['Kleingruppen','Nachhaltig','Erlebnisreisen','max. 12 Gäste','Chamäleon Stiftung'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:3,nachhaltigkeit:5,ostafrikatiefe:3,innovation:4},
    pos:['Nachhaltigkeitsführer','max. 12 Gäste','Chamäleon Stiftung','Dt. Nachhaltigkeitspreis 2024/2025','Travelife-Zertifikat','130 Mio. EUR Umsatz (2024)'],
    dest:{aktiv:['Kenia','Uganda','Tansania'],duenn:[],fehlt:['Ruanda']},
    fokus:{
      Kenia:[
        FR('Kenia Safari – Kleingruppe (Amboseli, Masai Mara, Nakuru)','https://www.chamaeleon-reisen.de/Afrika/Kenia','Gruppenreise'),
        FR('Masai Mara – 15T Kenia & Tansania (Serengeti, Ngorongoro, Sansibar)','https://www.chamaeleon-reisen.de/Afrika/Tansania-Kenia/Masai-Mara','Gruppenreise'),
        FR('Leopard for You – Kenia & Tansania Privatreise','https://www.chamaeleon-reisen.de/Afrika/Tansania-Kenia/Leopard4You','Privatreise',['masai mara','serengeti','ngorongoro','zanzibar'])],
      Uganda:[
        FR('Uganda – Gorilla Trekking, Murchison Falls, Queen Elizabeth NP (15T)','https://www.chamaeleon-reisen.de/Afrika/Uganda-Ruanda/Gorilla/Programm','Gruppenreise'),
        FR('Uganda Rundreise – Wunderwelten (15T, Bwindi optional)','https://www.chamaeleon-reisen.de/Uganda-Rundreise','Gruppenreise')],
      Tansania:[
        FR('Masai Mara – 15T Erlebnisreise Kenia & Tansania','https://www.chamaeleon-reisen.de/Afrika/Tansania-Kenia/Masai-Mara','Gruppenreise'),
        FR('Tansania a la carte – Serengeti, Kilimanjaro, Sansibar','https://www.chamaeleon-reisen.de/Afrika/Tansania','Gruppenreise'),
        FR('Selous – 15T Wunderwelten Tansania','https://www.chamaeleon-reisen.de/Afrika/Tansania/Selous','Gruppenreise')],
      Ruanda:[FR('Uganda & Ruanda – Gorilla Trekking Kombinationsreise','https://www.chamaeleon-reisen.de/Afrika/Uganda-Ruanda','Gruppenreise',['bwindi','volcanoes','nyungwe'])],
    },
    luecken:[
      L('ch1','Ruanda fehlt trotz Expertin','hoch','Reiseexpertin in Ruanda aufgewachsen — aber kein eigenständiges Ruanda-Produkt sichtbar.'),
      L('ch2','Uganda Luxury fehlt','mittel','Uganda-Produkt vorhanden, aber nur mid-range. Luxury-Option fehlt.')],
    pitches:[
      P('chp1','Ruanda Gorilla & Kultur: Volcanoes NP + Kigali + Nyungwe, 8 Tage, Kleingruppe',['ruanda','gorilla','kultur','kigali','nyungwe','kleingruppe']),
      P('chp2','Uganda + Ruanda Primaten-Kombi: Bwindi + Volcanoes, 10 Tage',['uganda','ruanda','gorilla','chimps','bwindi','volcanoes','kleingruppe'])],
    kontext:'Chamäleon Reisen GmbH: Gegründet 1996 von Ingo Lies (Gründer, lebt mit südafrikanischer Frau in Berlin). Sitz Berlin-Reinickendorf. 127 Mitarbeiter (2024). Umsatz 130 Mio. EUR (2024). Über 100-Mio.-Marke bereits 2023 geknackt. Nachhaltigkeits-DNA: Travelife-Zertifikat, Gründungsmitglied KlimaLink e.V., Investition in SAF (Sustainable Aviation Fuel) bei Lufthansa, Solaranlagen bei 30 Unterkünften in Namibia/Südafrika. Chamäleon Stiftung (gegr. 2012): 50+ Projekte auf 5 Kontinenten, 1,3 Mio. EUR Spenden, 60% lokaler Verdienst. Auszeichnungen: Deutscher Nachhaltigkeitspreis 2024 (Gewinner Tourismus), Finalist 2025. TV-Spots ARD/ZDF. Tim (Uganda/Kenia-Experte): Kindheit auf Farm in Afrika, Gorilla/Schimpansen als "magischer Moment". Ruanda-Expertin: in Ruanda aufgewachsen, kein Nachname öffentlich. Quellen: chamaeleon-reisen.de; travelnews.ch 2024; Fuchsbezirk.de; DNP 2024; LinkedIn.',
  }
),

// ══════════════════════════════════════════════════════════
// TRAVEL-TO-NATURE
// ══════════════════════════════════════════════════════════
K('travelnature','travel-to-nature','Freiburg','Naturreisen / Nachhaltig',
  [KT('Christian','Afrika & Operations Experte','+49 7634 50550','info@traveltonature.de',['Tansania','Uganda','Ruanda'])],
  {
        homepage: 'https://www.travel-to-nature.de',
    tags:['Naturreisen','Nachhaltig','Individual','Ostafrika'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:2,gruppengroesse:2,nachhaltigkeit:5,ostafrikatiefe:4,innovation:3},
    pos:['Naturreisen','Nachhaltig','5 J. Moshi/Tansania','Individual'],
    dest:{aktiv:['Tansania','Uganda','Ruanda'],duenn:[],fehlt:['Kenia']},
    fokus:{
      Tansania:[FR('Tansania individuell (Gorilla + Safari)','https://www.travel-to-nature.de/afrika/uganda-ruanda/','Naturreise',['serengeti','ngorongoro','mahale'])],
      Uganda:[FR('Uganda Klassisch Naturnah / Intensiv','https://www.travel-to-nature.de/afrika/uganda-reisen/','Naturreise',['bwindi','kibale','queen elizabeth','murchison'])],
      Ruanda:[FR('Ruanda – Berggorillas Volcanoes NP + Uganda-Kombi','https://www.travel-to-nature.de/afrika/uganda-ruanda/','Naturreise')],
      Kenia:[],
    },
    luecken:[L('tn1','Kenia komplett fehlend','mittel','Kein Kenia-Produkt. Walking Safari Laikipia als naturnahes Angebot wäre DNA-konform.')],
    pitches:[P('tnp1','Kenia Walking Safari Laikipia: naturnahes Erlebnis, carbon-bewusst, max. 6 Pax',['kenia','walking-safari','laikipia','nachhaltigkeit','natur','nische'])],
    kontext:"travel-to-nature GmbH: Sitz Freiburg. Christian (Afrika & Operations): 5 Jahre in Moshi/Tansania gelebt, Kilimanjaro bestiegen — auf travel-to-nature.de/team/ benannt. E-Mail-Muster: christian@traveltonature.de möglich. Starke Nachhaltigkeits-DNA. Kenia nicht im Portfolio. Quellen: travel-to-nature.de.",
  }
),

// ══════════════════════════════════════════════════════════
// KILIDOVE (zusammengeführt)
// ══════════════════════════════════════════════════════════
K('kilidove','Kilidove Safaris','Arusha / Deutschland','Individual Safari',
  [
    KT('Christina','DACH-Reiseplanung','Über Website','christina@kilidovesafaris.de',['Tansania']),
    KT('Florian','DACH-Reiseplanung','Über Website','florian@kilidovesafaris.de',['Tansania']),
    KT('George','Gründer / DMC Arusha vor Ort','Über Website','',['Tansania'])],
  {
        homepage: 'https://www.kilidovesafaris.de',
    tags:['Individual','Tansania','Serengeti','Walking Safari','DMC Arusha'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:1,nachhaltigkeit:3,ostafrikatiefe:4,innovation:3},
    pos:['Individuell','Tansania-Spezialist','DACH-Planung','DMC vor Ort Arusha'],
    dest:{aktiv:['Tansania'],duenn:[],fehlt:['Kenia','Uganda','Ruanda']},
    fokus:{
      Tansania:[
        FR('Individuelle Tansania-Safaris (Serengeti, Ngorongoro, Walking Safari)','https://www.kilidovesafaris.de/','Individualreise'),
        FR('Private Serengeti & Ngorongoro Safari','https://www.kilidovesafaris.de/','Individualreise')],
      Kenia:[],Uganda:[],Ruanda:[],
    },
    luecken:[L('kl1','Uganda & Ruanda nicht im Portfolio','mittel','Gorilla-Erweiterung nach Uganda/Ruanda würde Tansania-Portfolio ergänzen.')],
    pitches:[P('klp1','Tansania + Uganda Kombi: Serengeti + Bwindi Gorilla, 12 Tage Individual',['tansania','uganda','gorilla','serengeti','individual','kombi'])],
    kontext:"Kilidove Safaris: DACH-Planungsteam Christina & Florian (benannt auf kilidovesafaris.de). George = Gründer DMC Arusha vor Ort. Persönliche Beratung, ausschließlich Tansania. E-Mail: christina@kilidovesafaris.de; florian@kilidovesafaris.de. Quellen: kilidovesafaris.de.",
  }
),

// ══════════════════════════════════════════════════════════
// TANZANIA SPECIALIST
// ══════════════════════════════════════════════════════════
K('tanzspecialist','Tanzania Specialist','Berlin / Tansania','Individual Safari',
  [KT('Julia','Reiseleitung / Buchungsleitung','Über Website','julia@tanzaniaspecialist.de',['Tansania'])],
  {
        homepage: 'https://tanzaniaspecialist.de',
    tags:['Individual','Tansania','Serengeti','Sansibar','eigenes Büro vor Ort'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:1,nachhaltigkeit:3,ostafrikatiefe:4,innovation:3},
    pos:['Tansania-Spezialist','Individuell','Eigenes Büro in Tansania'],
    dest:{aktiv:['Tansania'],duenn:[],fehlt:['Kenia','Uganda','Ruanda']},
    fokus:{
      Tansania:[FR('Tansania Safari & Sansibar (individuell)','https://tanzaniaspecialist.de/','Individualreise',['serengeti','ngorongoro','zanzibar'])],
      Kenia:[],Uganda:[],Ruanda:[],
    },
    luecken:[L('ts1','Nur Tansania — keine Ostafrika-Kombis','hoch','Kein Uganda/Ruanda oder Kenia. Gorilla-Erweiterung als Verlängerung fehlt.')],
    pitches:[P('tsp1','Tansania + Ruanda Kombi: Serengeti + Volcanoes Gorilla, Individual 10 Tage',['tansania','ruanda','gorilla','serengeti','individual','kombi'])],
    kontext:"Tanzania Specialist: Julia in mehreren Kundenbewertungen namentlich erwähnt: 'DANKE Julia'. Eigenes Büro in Tansania. E-Mail: julia@tanzaniaspecialist.de. Ausschließlich Tansania-Fokus. Quellen: tanzaniaspecialist.de; Kundenbewertungen.",
  }
),

// ══════════════════════════════════════════════════════════
// FELIX SAFARIS
// ══════════════════════════════════════════════════════════
K('felixsafaris','Felix Safaris','Tsavo / Deutschland','Individual Safari',
  [KT('Felix','Inhaber & Reiseveranstalter','Über Website','felix@felix-safaris.com',['Kenia','Tansania'])],
  {
        homepage: 'https://www.felix-safaris.com',
    tags:['Individual','Kenia','Tansania','Eigene Lodge Tsavo'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:1,nachhaltigkeit:3,ostafrikatiefe:4,innovation:3},
    pos:['Inhaber','Eigene Lodge Tsavo','Kenia & Tansania','Individuell'],
    dest:{aktiv:['Kenia','Tansania'],duenn:[],fehlt:['Uganda','Ruanda']},
    fokus:{
      Kenia:[FR('Kenia & Tansania Individuelle Safaris','https://www.felix-safaris.com/','Individualreise',['masai mara','amboseli','serengeti','ngorongoro'])],
      Tansania:[FR('Kenia & Tansania Individuelle Safaris','https://www.felix-safaris.com/','Individualreise')],
      Uganda:[],Ruanda:[],
    },
    luecken:[L('fx1','Uganda & Ruanda fehlen','mittel','Gorilla-Erweiterung für Stammkunden naheliegend.')],
    pitches:[P('fxp1','Uganda Gorilla-Trekking als Add-on zu Kenia-Safari: Bwindi 5 Tage Individual',['uganda','gorilla','kenia','individual','bwindi','add-on'])],
    kontext:'Felix Safaris: Firmenname = Vorname des Inhabers. Eigene Lodge in Tsavo (Kenia). E-Mail: felix@felix-safaris.com sehr wahrscheinlich. Kleiner persönlicher Anbieter. Quellen: felix-safaris.com.',
  }
),

// ══════════════════════════════════════════════════════════
// VENTER TOURS
// ══════════════════════════════════════════════════════════
K('ventertours','Venter Tours','Deutschland','Kleingruppen / Privatreisen',
  [KT('Produktteam','Reiseleiter Kenia/Tansania','Über Website','info@ventertours.de',['Kenia','Tansania'])],
  {
        homepage: 'https://www.ventertours.de',
    tags:['Kleingruppen','Privatreisen','Kenia','Tansania'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:2,nachhaltigkeit:3,ostafrikatiefe:3,innovation:2},
    pos:['Kleingruppen','Privatreisen','Kenia & Tansania'],
    dest:{aktiv:['Kenia','Tansania'],duenn:[],fehlt:['Uganda','Ruanda']},
    fokus:{
      Kenia:[FR('SIMBA – Safarierlebnis Kenia & Tansania (13T)','https://www.ventertours.de/reisen/simba-safarierlebnis-kenia-tansania/','Gruppenreise',['masai mara','amboseli','serengeti','ngorongoro'])],
      Tansania:[FR('SIMBA – Safarierlebnis Kenia & Tansania (13T)','https://www.ventertours.de/reisen/simba-safarierlebnis-kenia-tansania/','Gruppenreise')],
      Uganda:[],Ruanda:[],
    },
    luecken:[L('vt1','Uganda & Ruanda fehlen','mittel','Gorilla-Trekking als Ergänzung für Stammkunden.')],
    kontext:'Venter Tours: Kein Einzelname öffentlich. Kleingruppen & Privatreisen. Über info@ventertours.de einsteigen. Quellen: ventertours.de.',
  }
),

// ══════════════════════════════════════════════════════════
// JAMBOKENYA
// ══════════════════════════════════════════════════════════
K('jambokenya','JamboKenya','Deutschland','Kenia-Spezialist',
  [KT('Frau Chouchane','Buchung / Reiseorganisation','Über Website','info@jambokenya.de',['Kenia'])],
  {
        homepage: 'https://www.jambokenya.de',
    tags:['Kenia','Privatsafaris','Masai Mara','Individual'],
    score:{luecken:4,budgetfit:3},
    radar:{luxusniveau:3,gruppengroesse:2,nachhaltigkeit:3,ostafrikatiefe:3,innovation:2},
    pos:['Kenia-Spezialist','Privatsafaris','Masai Mara','Amboseli'],
    dest:{aktiv:['Kenia'],duenn:[],fehlt:['Tansania','Uganda','Ruanda']},
    fokus:{
      Kenia:[FR('Kenia Privatsafaris (Masai Mara, Amboseli, Nakuru)','https://www.jambokenya.de/','Privatreise')],
      Tansania:[],Uganda:[],Ruanda:[],
    },
    luecken:[L('jk1','Nur Kenia — alle anderen Fokusländer fehlen','hoch','Kein Tansania, Uganda oder Ruanda. Alle drei fehlen als Ergänzungsangebot.')],
    pitches:[P('jkp1','Kenia + Ruanda Kombi: Masai Mara + Volcanoes Gorilla, Individual 10 Tage',['kenia','ruanda','gorilla','masai-mara','individual','kombi'])],
    kontext:"JamboKenya: Frau Chouchane namentlich in Kundenbewertung: 'Dank an Frau Chouchane für die hilfsbereite Organisation'. Ausschließlich Kenia-Fokus. Quellen: jambokenya.de; Kundenbewertungen.",
  }
),

// ══════════════════════════════════════════════════════════
// COBRA VERDE
// ══════════════════════════════════════════════════════════
K('cobraverde','Cobra Verde Afrikareisen','Deutschland','Luxus-Safaris',
  [KT('Luxus-Safari-Beratung','Produktmanager Luxus','Über Website','info@cobra-verde.de',['Kenia','Tansania','Uganda','Ruanda'])],
  {
        homepage: 'https://www.cobra-verde.de',
    tags:['Luxus','Individual','Premium','Alle 4 Fokusländer'],
    score:{luecken:2,budgetfit:5},
    radar:{luxusniveau:5,gruppengroesse:1,nachhaltigkeit:3,ostafrikatiefe:4,innovation:3},
    pos:['Ultra-Luxus','Individual','Premium-Safaris','Alle 4 Fokusländer aktiv'],
    dest:{aktiv:['Kenia','Tansania','Uganda','Ruanda'],duenn:[],fehlt:[]},
    fokus:{
      Kenia:[
        FR('Masai Mara & Laikipia – Exklusive Individualreise','https://www.cobra-verde-kenia-safaris.de/safaris.html','Luxus-Individualreise',['masai mara','laikipia','lewa']),
        FR('Kenia Flugsafari – Masai Mara, Samburu & Amboseli','https://www.cobra-verde-kenia-safaris.de/reisethemen/flugsafaris-kenia.html','Flugsafari',['masai mara','samburu','amboseli','lewa']),
        FR('Kenia Wandersafari – Laikipia, Samburu & Chyulu','https://www.cobra-verde-kenia-safaris.de/reisethemen/wandersafaris-kenia.html','Wandersafari',['laikipia','samburu','chyulu']),
        FR('Kenia Reitsafari & Kameltouren – Laikipia & Masai Mara','https://www.cobra-verde-kenia-safaris.de/reisethemen/reitsafaris-kenia.html','Aktivsafari',['laikipia','masai mara','samburu']),
        FR('Kenia Familiensafari – Masai Mara, Amboseli & Strand','https://www.cobra-verde-kenia-safaris.de/reisethemen/familiensafaris-kenia.html','Familiensafari',['masai mara','amboseli','diani']),
        FR('Kenia Foto-Safari – Masai Mara & Laikipia','https://www.cobra-verde-kenia-safaris.de/reisethemen/fotosafaris-kenia.html','Fotosafari',['masai mara','laikipia','samburu']),
        FR('Kenia Kanusafari – Lake Naivasha & Tana River','https://www.cobra-verde-kenia-safaris.de/reisethemen/kanusafaris-kenia.html','Aktivsafari',['naivasha','tsavo']),
        FR('Kenia Ballonsafari – Masai Mara','https://www.cobra-verde-kenia-safaris.de/reisethemen/ballonsafaris-kenia.html','Erlebnissafari',['masai mara']),
        FR('Nord-Kenia Expedition – Samburu, Mathews & Turkana','https://www.cobra-verde-kenia-safaris.de/lodges-camps/nord-kenia.html','Expedition',['samburu','mathews','turkana']),
        FR('Kenia Strandurlaub – Lamu, Diani & Malindi','https://www.cobra-verde-kenia-safaris.de/strandurlaub.html','Strandurlaub',['lamu','diani','malindi','mombasa']),
      ],
      Tansania:[
        FR('Nord-Tansania Safari – Serengeti, Ngorongoro & Tarangire','https://www.cobra-verde-tansania-safaris.de/reisen/nord-tansania.html','Luxus-Individualreise',['serengeti','ngorongoro','tarangire','manyara']),
        FR('Nord-Tansania mit Sansibar – Safari & Meer','https://www.cobra-verde-tansania-safaris.de/reisen/nord-tansania-sansibar.html','Luxus-Individualreise',['serengeti','ngorongoro','zanzibar','pemba']),
        FR('Nord- & Süd-Tansania – Serengeti bis Ruaha & Nyerere','https://www.cobra-verde-tansania-safaris.de/reisen/nord-sued-tansania.html','Expedition',['serengeti','ngorongoro','ruaha','selous']),
        FR('Süd-Tansania – Nyerere (Selous) & Ruaha','https://www.cobra-verde-tansania-safaris.de/reisen/sued-tansania.html','Luxus-Individualreise',['ruaha','selous']),
        FR('West-Tansania – Katavi & Mahale (Schimpansen)','https://www.cobra-verde-tansania-safaris.de/reisen/west-tansania.html','Expedition',['katavi','mahale','gombe']),
        FR('Tansania & Kenia Kombination – Serengeti & Masai Mara','https://www.cobra-verde-tansania-safaris.de/reisen/tansania-kenia.html','Luxus-Individualreise',['serengeti','ngorongoro','masai mara','mara']),
        FR('Tansania Flugsafari – Serengeti, Ruaha & Zanzibar','https://www.cobra-verde-tansania-safaris.de/erlebnisse/flugsafari.html','Flugsafari',['serengeti','ngorongoro','ruaha','zanzibar']),
        FR('Tansania Wandersafari – Serengeti, Ngorongoro, Ruaha & Selous','https://www.cobra-verde-tansania-safaris.de/erlebnisse/wandersafari.html','Wandersafari',['serengeti','ngorongoro','tarangire','ruaha','selous','katavi']),
        FR('Tansania Kanusafari – Lake Manyara, Ruaha & Selous','https://www.cobra-verde-tansania-safaris.de/erlebnisse/kanusafari.html','Aktivsafari',['manyara','ruaha','selous','arusha']),
        FR('Tansania Reitsafari – Serengeti & Ruaha','https://www.cobra-verde-tansania-safaris.de/erlebnisse/reitsafari.html','Aktivsafari',['serengeti','ruaha']),
        FR('Tansania Fotosafari – Serengeti & Ngorongoro','https://www.cobra-verde-tansania-safaris.de/erlebnisse/fotosafari.html','Fotosafari',['serengeti','ngorongoro','tarangire']),
        FR('Tansania Ballonsafari – Serengeti','https://www.cobra-verde-tansania-safaris.de/erlebnisse/ballonsafari.html','Erlebnissafari',['serengeti']),
        FR('Tansania Familiensafari – Serengeti & Ngorongoro','https://www.cobra-verde-tansania-safaris.de/erlebnisse/familiensafari.html','Familiensafari',['serengeti','ngorongoro','zanzibar']),
        FR('Tansania Strandurlaub – Zanzibar, Pemba & Mafia Island','https://www.cobra-verde-tansania-safaris.de/strandurlaub-badeverlaengerung.html','Strandurlaub',['zanzibar','pemba']),
      ],
      Uganda:[
        FR('12 Tage Uganda – Schimpansen, Baumlöwen & Gorillas','https://www.cobra-verde.de/ostafrika/uganda/safaris-und-reisen/12-tage-uganda-schimpansen-baumloewen-gorillas.html','Luxusreise',['bwindi','kibale','queen elizabeth']),
        FR('15 Tage Uganda – Quellen des Nils','https://www.cobra-verde.de/ostafrika/uganda/safaris-und-reisen/15-tage-uganda-quellen-des-nils.html','Luxusreise',['bwindi','murchison falls','lake mburo','queen elizabeth']),
        FR('9 Tage Uganda – Gorillas & Savannen','https://www.cobra-verde.de/ostafrika/uganda/safaris-und-reisen/9-tage-gorillas-savannen.html','Luxusreise',['bwindi','queen elizabeth','kidepo']),
        FR('15 Tage Uganda Special','https://www.cobra-verde.de/ostafrika/uganda/safaris-und-reisen/15-tage-uganda-special.html','Luxusreise',['bwindi','kibale','murchison falls','queen elizabeth']),
      ],
      Ruanda:[
        FR('Ruanda Luxus-Expedition – Volcanoes NP & Nyungwe','https://www.cobra-verde.de/ostafrika.html','Luxusreise',['volcanoes','nyungwe','akagera']),
      ],
    },
    luecken:[L('cv1','Walking Safari / Fly-in Nischenprodukt','mittel','Luxury-Produkte vorhanden — spezialisierte Walking Safaris (Laikipia) fehlen.')],
    pitches:[
      P('cvp1','Kenia Luxury Walking Safari: Laikipia Private Conservancy, Fly-in, max. 4 Pax',['kenia','walking-safari','laikipia','luxury','fly-in','premium']),
      P('cvp2','Uganda Luxury Gorilla: Bwindi Luxury Lodge + Kazinga Channel, max. 4 Pax',['uganda','gorilla','luxury','bwindi','kazinga','premium'])],
    kontext:'Cobra Verde Afrikareisen: Premium-Segment, alle 4 Fokusländer aktiv. Kein Einzelname öffentlich. Sehr guter Budget-Fit zu Netzwerkpartnern (Luxury-Tier). Quellen: cobra-verde.de.',
  }
),

// ══════════════════════════════════════════════════════════
// AUF UND DAVON
// ══════════════════════════════════════════════════════════
K('aufunddavon','Auf und Davon Reisen','Deutschland','Minigruppen / Abenteuer',
  [KT('Inhaber / Reiseleiter','Inhaber Uganda','Über Website','info@auf-und-davon-reisen.de',['Uganda','Ruanda'])],
  {
        homepage: 'https://auf-und-davon-reisen.de',
    tags:['Minigruppen','Abenteuer','Uganda','Ruanda','max. 6 Pers.'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:2,gruppengroesse:1,nachhaltigkeit:3,ostafrikatiefe:4,innovation:3},
    pos:['Minigruppen max. 6','Abenteuerreisen','Uganda & Ruanda','ab 4.390€'],
    dest:{aktiv:['Uganda','Ruanda'],duenn:[],fehlt:['Kenia','Tansania']},
    fokus:{
      Kenia:[FR('14 Tage Kenia Safari – Masai Mara, Amboseli, Tsavo Ost & Baden (max. 6 P)','https://auf-und-davon-reisen.de/kenia-safari-reise-masai-mara-tsavo-amboseli-badeurlaub/','Minigruppe',['masai mara','amboseli','tsavo','diani'])],
      Tansania:[FR('15 Tage Tansania – Serengeti, Ngorongoro & Sansibar (max. 12 P)','https://auf-und-davon-reisen.de/tansania-safari-reise-serengeti-sansibar/','Gruppenreise',['serengeti','ngorongoro','zanzibar','arusha'])],
      Uganda:[
        FR('Berggorillas & Schimpansen – 14T Uganda & Ruanda (max. 6 P)','https://auf-und-davon-reisen.de/uganda-ruanda-gorilla-safarireise-minigruppe/','Minigruppe',['bwindi','kibale','volcanoes']),
        FR('15 Tage Uganda Rundreise – Gorilla & Schimpansen Safari (max. 12 P)','https://auf-und-davon-reisen.de/uganda-gorilla-safari-reise/','Gruppenreise',['bwindi','kibale','queen elizabeth','murchison']),
      ],
      Ruanda:[FR('Berggorillas & Schimpansen – 14T Uganda & Ruanda (max. 6 P)','https://auf-und-davon-reisen.de/uganda-ruanda-gorilla-safarireise-minigruppe/','Minigruppe',['bwindi','kibale','volcanoes'])],
    },
    luecken:[L('ad1','Kenia & Tansania fehlen','mittel','Walking Safari als Minigruppe wäre DNA-konform.')],
    pitches:[P('adp1','Kenia Walking Safari Minigruppe: Laikipia, max. 6 Pax, Abenteuer-Fokus',['kenia','walking-safari','laikipia','minigruppe','abenteuer','nische'])],
    kontext:'Auf und Davon Reisen: Minigruppen max. 6 Personen. Ab 4.390€. Kein Einzelname öffentlich. Quellen: auf-und-davon-reisen.de.',
  }
),

// ══════════════════════════════════════════════════════════
// DUMA NATURREISEN
// ══════════════════════════════════════════════════════════
K('duma','DUMA Naturreisen','Deutschland','Naturreisen / Tansania-Spezialist',
  [KT('Reiseleitung Afrika','Naturreisen-Spezialist','Über Website','info@duma-naturreisen.de',['Tansania'])],
  {
        homepage: 'https://www.duma-naturreisen.de',
    tags:['Naturreisen','Tansania','Selous','Ruaha','Familienbetrieb'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:2,gruppengroesse:2,nachhaltigkeit:4,ostafrikatiefe:4,innovation:2},
    pos:['Naturreisen','40+ J. Erfahrung','Familienbetrieb','Selous & Ruaha Experte'],
    dest:{aktiv:['Tansania'],duenn:[],fehlt:['Kenia','Uganda','Ruanda']},
    fokus:{
      Tansania:[FR('Tansania Safari (Serengeti, Selous, Ngorongoro)','https://www.duma-naturreisen.de/afrika/tansania','Naturreise')],
      Kenia:[],Uganda:[],Ruanda:[],
    },
    luecken:[L('du1','Uganda & Ruanda fehlen','mittel','Starke Tansania-Tiefe, aber keine Ostafrika-Kombis.')],
    pitches:[P('dup1','Tansania Selous + Uganda Gorilla Kombi: Off-the-beaten-track, 12 Tage',['tansania','selous','uganda','gorilla','natur','nische','kombi'])],
    kontext:'DUMA Naturreisen: 40+ Jahre Familienbetrieb. Selous & Ruaha als Spezialgebiete — Off-the-beaten-track Tansania. Kein Einzelname öffentlich. Persönliche Anfrage empfohlen. Quellen: duma-naturreisen.de.',
  }
),

// ══════════════════════════════════════════════════════════
// WIGWAM TOURS
// ══════════════════════════════════════════════════════════
K('wigwam','Wigwam Tours','Deutschland','Gruppenreisen / Tansania',
  [KT('Reiseleitung Tansania','Reiseleiter / Reiseberater','Über Website','info@wigwam-tours.de',['Tansania'])],
  {
        homepage: 'https://wigwam-tours.de',
    tags:['Gruppenreisen','Tansania','Great Migration','Serengeti'],
    score:{luecken:3,budgetfit:3},
    radar:{luxusniveau:2,gruppengroesse:4,nachhaltigkeit:3,ostafrikatiefe:3,innovation:2},
    pos:['Gruppenreisen','Great Migration','Tansania','WOM-Online-Magazin'],
    dest:{aktiv:['Tansania'],duenn:[],fehlt:['Kenia','Uganda','Ruanda']},
    fokus:{
      Tansania:[
        FR('14 Tage Tanzania – Auf den Spuren von Dr. Grzimek: Serengeti, Ngorongoro & Zanzibar','https://wigwam-tours.de/tanzania.html','Gruppenreise',['serengeti','ngorongoro','zanzibar']),
        FR('9 Tage Safari – Serengeti & Ngorongoro Krater. Out of Africa in Tented Camps','https://wigwam-tours.de/tanzania.html','Gruppenreise',['serengeti','ngorongoro']),
        FR('15 Tage Tanzania Zelt-Safari – Serengeti, Kilimanjaro & Zanzibar','https://wigwam-tours.de/tanzania.html','Expedition',['serengeti','kilimanjaro','zanzibar']),
        FR('17 Tage Tanzania Expedition – Katavi & Ruaha NP, Schimpansen-Tracking Gombe','https://wigwam-tours.de/tanzania.html','Expedition',['katavi','ruaha','gombe','mahale']),
        FR('15 Tage Tanzania – Der authentische Süden. Safari & Meer','https://wigwam-tours.de/tanzania.html','Expedition',['ruaha','selous','zanzibar']),
        FR('14 Tage Naturreise – Intensive Tierbeobachtung Gombe, Katavi & Ruaha NP','https://wigwam-tours.de/tanzania.html','Naturreise',['gombe','katavi','ruaha','mahale']),
      ],
      Kenia:[],
      Uganda:[
        FR('14 Tage Uganda – Sonderreise Die Retter der Gorillas (SWR-Doku)','https://wigwam-tours.de/uganda.html','Sonderreise',['bwindi']),
        FR('13 Tage Die Perle Afrikas – Murchison Falls, Queen Elizabeth NP & Bwindi','https://wigwam-tours.de/uganda.html','Gruppenreise',['murchison falls','queen elizabeth','bwindi']),
        FR('16 Tage Uganda Wanderreise – Gorilla & Schimpansen, Ruwenzori & Virunga','https://wigwam-tours.de/uganda.html','Wanderreise',['bwindi','kibale','virunga']),
        FR('21 Tage Uganda Zelt- & Lodge-Reise – Victoria See bis Berggorillas Bwindi','https://wigwam-tours.de/uganda.html','Expedition',['bwindi','murchison','queen elizabeth','lake mburo']),
        FR('14 Tage Norden Ugandas – Kidepo NP, Nilquellen & Karamajong-Kultur','https://wigwam-tours.de/uganda.html','Expedition',['kidepo','murchison falls']),
        FR('8 Tage Kurztour – Gorilla-Tracking Bwindi, Schimpansen & Pirschfahrten','https://wigwam-tours.de/uganda.html','Gruppenreise',['bwindi','kibale']),
      ],
      Ruanda:[],
    },
    luecken:[L('wg1','Uganda & Ruanda fehlen','mittel','Gorilla-Trekking als Ergänzung für Great Migration Kunden.')],
    kontext:'Wigwam Tours: Kein Einzelname öffentlich. Eigenes WOM-Online-Magazin. Great Migration als Kernprodukt. Über info@wigwam-tours.de einsteigen. Quellen: wigwam-tours.de.',
  }
)]; // end defaultKunden

// ══════════════════════════════════════════════════════════
// OPERATOR DATEN (unverändert, kompakt)
// ══════════════════════════════════════════════════════════
var defaultOps = [
  {id:'manya',name:'Manya Africa Tours',land:'Uganda / Ruanda / Kenia / Tansania',url:'https://manyaafricatours.com',preisniveau:'Budget bis Luxury (USD 800–4.500 p.P./Tag)',
   beschreibung:'Spezialist für Uganda und Ruanda mit Tiefenexpertise in Gorilla- und Schimpansen-Trekking. Starkes Nachhaltigkeitscommitment. Breites Preisspektrum.',
   staerken:['Gorilla-Trekking','Chimpanzee-Trekking','Cultural Tours','Authentic Homestays','Luxury Uganda','Nachhaltigkeit','Bwindi & Kibale'],
   touren:[
    {id:'m1',name:'5-Day Uganda Safari with Gorilla Tracking',dest:'Uganda',tage:5,niveau:'midrange',url:'https://manyaafricatours.com/tour/5-days-uganda-safari-with-gorilla-tracking/',img:'https://manyaafricatours.com/wp-content/uploads/2022/07/5-day-uganda-gorilla-tracking-featured-1506.jpg',desc:'Trek through Bwindi Impenetrable Forest to encounter wild mountain gorillas, meet the Batwa people, and cross the Equator.',tags:['gorilla','uganda','bwindi','primaten','batwa'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m2',name:'6-Day Uganda Big Game & Gorilla Safari',dest:'Uganda',tage:6,niveau:'midrange',url:'https://manyaafricatours.com/tour/6-days-uganda-big-game-and-gorilla-safari/',img:'',desc:'Wildlife encounter and mountain gorillas in Bwindi Impenetrable Forest.',tags:['gorilla','uganda','wildlife','big-game','bwindi'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m3',name:'6-Day Chimpanzee & Gorilla Tracking Uganda',dest:'Uganda',tage:6,niveau:'midrange',url:'https://manyaafricatours.com/tour/6-days-chimpanzee-and-gorilla-tracking-in-uganda/',img:'https://manyaafricatours.com/wp-content/uploads/2024/10/6-day-uganda-tour-featured-1639.jpg',desc:'Track chimpanzees in Kibale Forest and encounter mountain gorillas in Bwindi.',tags:['chimps','gorilla','uganda','primaten','kibale','bwindi'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m4',name:'8-Day Jewels of Uganda LUXURY Safari',dest:'Uganda',tage:8,niveau:'luxury',url:'https://manyaafricatours.com/tour/8-days-jewels-of-uganda-luxury-safari/',img:'https://manyaafricatours.com/wp-content/uploads/2024/10/8-day-luxury-uganda-tour-featured-1650.jpg',desc:'Exclusive 8-day luxury Uganda safari featuring gorilla tracking, chimpanzees, and a boat safari on the Kazinga Channel.',tags:['luxury','uganda','gorilla','wildlife','premium','kazinga'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m5',name:'8-Day North East Uganda Safari',dest:'Uganda',tage:8,niveau:'midrange',url:'https://manyaafricatours.com/tour/8-days-north-east-uganda-safari/',img:'',desc:"Explore remote Kidepo Valley National Park — one of Africa\'s most pristine wilderness areas.",tags:['uganda','nische','offbeat','kidepo'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m6',name:'8-Day Uganda Safari with Authentic Homestays',dest:'Uganda',tage:8,niveau:'midrange',url:'https://manyaafricatours.com/tour/8-days-uganda-safari-with-authentic-homestays/',img:'',desc:'Combine wildlife with authentic community experiences — stay with local families.',tags:['community','cultural','uganda','homestay'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m7',name:'10-Day Best of Uganda Tour',dest:'Uganda',tage:10,niveau:'midrange',url:'https://manyaafricatours.com/tour/10-day-best-of-uganda-mid-range-tour/',img:'',desc:'The best of Uganda in 10 days: gorillas, chimpanzees, big game, and stunning landscapes.',tags:['uganda','gorilla','chimps','wildlife','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m8',name:'12-Days Pearls of Uganda Safari',dest:'Uganda',tage:12,niveau:'midrange',url:'https://manyaafricatours.com/tour/12-days-pearls-of-uganda-safari/',img:'',desc:"Comprehensive 12-day journey through Uganda\'s greatest wildlife destinations.",tags:['uganda','wildlife','gorilla','chimps','comprehensive','murchison'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m10',name:'10-Day Tanzania Zanzibar Holiday & Uganda Gorilla Trek',dest:'Uganda',tage:10,niveau:'luxury',url:'https://manyaafricatours.com/tour/10-day-tanzania-zanzibar-holiday-with-gorilla-tracking-in-uganda/',img:'',desc:'An extraordinary blend of gorilla trekking in Uganda and beach relaxation at Zanzibar. Bwindi gorillas, Batwa cultural experience, then Breezes Beach Club on Diani Beach.',tags:['uganda','gorilla','zanzibar','strand','kombi','primaten','luxury'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m9',name:'14-Days Uganda Wildlife & Cultural Tour',dest:'Uganda',tage:14,niveau:'midrange',url:'https://manyaafricatours.com/tour/14-days-uganda-wildlife-cultural-tour/',img:'',desc:"14 days combining Uganda\'s finest wildlife with deep cultural immersion.",tags:['uganda','cultural','wildlife','gorilla','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},

    {id:'m11',name:'3-Day Gorilla Trekking Rwanda',dest:'Ruanda',tage:3,niveau:'midrange',url:'https://manyaafricatours.com/tour/3-day-gorilla-trekking-rwanda-budget-tour/',img:'',desc:'Focused 3-day gorilla trekking in Volcanoes National Park.',tags:['ruanda','gorilla','volcanoes','primaten','kurzreise'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m12',name:'5-Day Gorilla Trekking Rwanda',dest:'Ruanda',tage:5,niveau:'midrange',url:'https://manyaafricatours.com/tour/5-day-gorilla-trekking-rwanda/',img:'',desc:"Five days exploring Rwanda\'s gorilla habitat in Volcanoes National Park.",tags:['ruanda','gorilla','volcanoes','primaten'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m13',name:'5-Day Rwanda Gorilla & Golden Monkey Trek',dest:'Ruanda',tage:5,niveau:'midrange',url:'https://manyaafricatours.com/tour/5-days-in-rwanda-with-gorilla-golden-monkey-trek/',img:'',desc:'Gorilla trekking combined with golden monkey encounters in Volcanoes NP.',tags:['ruanda','gorilla','golden-monkey','primaten','volcanoes'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m14',name:'6-Day Thousand Hills of Rwanda LUXURY',dest:'Ruanda',tage:6,niveau:'luxury',url:'https://manyaafricatours.com/tour/6-day-thousand-hills-of-rwanda-luxury-tour/',img:'https://manyaafricatours.com/wp-content/uploads/2024/10/6-day-thousand-hills-of-rwanda-luxury-tour-featured-1870.jpg',desc:'Exclusive 6-day Rwanda luxury tour: gorilla tracking and elegant accommodations.',tags:['ruanda','luxury','gorilla','kultur','premium','volcanoes'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m15',name:'7-Day Best of Rwanda Mid-Range Tour',dest:'Ruanda',tage:7,niveau:'midrange',url:'https://manyaafricatours.com/tour/7-day-best-of-rwanda-mid-range-tour/',img:'',desc:'Seven days: gorillas, Akagera wildlife, Nyungwe Forest, and Kigali.',tags:['ruanda','gorilla','akagera','nyungwe','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m16',name:'10-Days Rwanda Primates, Wildlife & Cultural',dest:'Ruanda',tage:10,niveau:'midrange',url:'https://manyaafricatours.com/tour/10-days-rwanda-primates-wildlife-and-cultural-tour/',img:'',desc:'Comprehensive Rwanda: primate trekking, Akagera, cultural sites, Nyungwe canopy.',tags:['ruanda','gorilla','chimps','cultural','akagera','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m18',name:'5-Day Kenya Safari',dest:'Kenia',tage:5,niveau:'midrange',url:'https://manyaafricatours.com/tour/5-day-kenya-safari/',img:'',desc:'Focused 5-day Kenya safari: Masai Mara and Amboseli.',tags:['kenia','masai-mara','wildlife','amboseli','kurzreise'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m19',name:'6-Day Best of Kenya Fly-in Safari',dest:'Kenia',tage:6,niveau:'luxury',url:'https://manyaafricatours.com/tour/best-of-kenya-5-nights-flying-safari/',img:'',desc:"Fly-in luxury safari covering Kenya\'s finest game areas.",tags:['kenia','fly-in','masai-mara','luxury','amboseli','premium'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m20',name:'7-Day Kenya Luxury Safari',dest:'Kenia',tage:7,niveau:'luxury',url:'https://manyaafricatours.com/tour/7-day-kenya-luxury-safari/',img:'https://manyaafricatours.com/wp-content/uploads/2024/10/7-day-kenya-luxury-safari-featured-2017.jpg',desc:'Samburu, Ol Pejeta, Masai Mara — premium lodges throughout.',tags:['kenia','luxury','masai-mara','samburu','ol-pejeta','premium'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m24',name:'4-Day Kenya Beach Resort Package',dest:'Kenia',tage:4,niveau:'midrange',url:'https://manyaafricatours.com/tour/kenya-beach-packages/',img:'',desc:'Kenia Strandurlaub an der Diani Beach bei Mombasa. Swahili-Kultur, Korallenriffe und weisse Straende.',tags:['kenia','strand','mombasa','diani','beach','entspannung','kombi'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m25',name:'11-Days From Bush to Beach Kenya Safari',dest:'Kenia',tage:11,niveau:'midrange',url:'https://manyaafricatours.com/tour/11-day-kenya-budget-safari/',img:'',desc:'Kombination aus Kenia-Safari und Strandaufenthalt an der Indischen Ozean Kueste bei Mombasa. Von Masai Mara bis Diani Beach.',tags:['kenia','strand','mombasa','masai-mara','amboseli','kombi','safari'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m21',name:'5-Day Tanzania Safari & Serengeti',dest:'Tansania',tage:5,niveau:'midrange',url:'https://manyaafricatours.com/tour/5-day-tanzania-safari-serengeti-national-park/',img:'',desc:'Five days: Serengeti and Ngorongoro Crater.',tags:['tansania','serengeti','ngorongoro','wildlife','kurzreise'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m22',name:'7-Day Tanzania Safari',dest:'Tansania',tage:7,niveau:'midrange',url:'https://manyaafricatours.com/tour/7-day-tanzania-safari/',img:'',desc:'Seven days: Serengeti, Ngorongoro, Tarangire, Lake Manyara.',tags:['tansania','serengeti','ngorongoro','wildlife','tarangire'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m26',name:'10-Day Tanzania & Zanzibar Safari',dest:'Tansania',tage:10,niveau:'midrange',url:'https://manyaafricatours.com/tour/10-day-tanzania-zanzibar-holiday/',img:'https://manyaafricatours.com/wp-content/uploads/2024/10/10-day-tanzania-zanzibar-holiday-feat-2101.jpg',desc:'Explore Tanzania\s iconic wildlife destinations before relaxing on the pristine beaches of Zanzibar. Serengeti, Ngorongoro, Tarangire and Stone Town.',tags:['tansania','serengeti','ngorongoro','zanzibar','strand','kombi','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'m23',name:'12-Day Luxury Tanzania & Kenya Safari',dest:'Tansania',tage:12,niveau:'luxury',url:'https://manyaafricatours.com/tour/12-day-luxury-tanzania-and-kenya-safari/',img:'https://manyaafricatours.com/wp-content/uploads/2024/10/10-day-tanzania-zanzibar-holiday-feat-2101.jpg',desc:'Epic luxury: Ngorongoro, Serengeti, Amboseli, Masai Mara.',tags:['tansania','kenia','luxury','serengeti','masai-mara','premium'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''}]},
  {id:'adventure',name:'Adventure Expeditions',land:'Kenia / Tansania / Uganda / Ruanda',url:'https://www.adventurexpeditions.com',preisniveau:'Mid-Range bis Luxury (USD 400–1.200 p.P./Tag)',
   beschreibung:'Nachhaltigkeits-Spezialist für Off-the-beaten-track Ostafrika. Carbon-free Ansatz, Community-Projekte. Starke Laikipia- und Walking Safari-Expertise. Einzigartige Nischen: Bike Safari, Black Leopard, Photographic Safaris.',
   staerken:['Laikipia','Samburu','Birding','Bike Safari','Walking Safari','Photographic Safari','Carbon-free','Black Leopard','Community Projects','Mount Kenya'],
   touren:[
    {id:'a1',name:'10 Days around Mount Kenya',dest:'Kenia',tage:10,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/10-days-around-mount-kenya/',img:'https://www.adventurexpeditions.com/wp-content/uploads/2024/10/mount-kenyapark.jpg',desc:"Explore Kenya\'s highlands: mountain landscapes, diverse wildlife, cultural experiences around Mount Kenya and Laikipia.",tags:['kenia','walking-safari','mount-kenya','natur','laikipia','nische'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a2',name:'7 Days Great Rift Bike Safari',dest:'Kenia',tage:7,niveau:'adventure',url:'https://www.adventurexpeditions.com/tour/7-days-great-rift-bike-safari/',img:'',desc:"Unique bike safari through Kenya\'s Great Rift Valley. Carbon-free and off-the-beaten-track.",tags:['kenia','bike','rift-valley','nische','abenteuer','offbeat'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a3',name:'7 Days Best of Birding Safari',dest:'Kenia',tage:7,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/7-days-best-of-birding-safari/',img:'',desc:"Specialist birding safari visiting Kenya\'s top ornithological hotspots.",tags:['kenia','birding','natur','nische','offbeat'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a4',name:'7 Days Lake Turkana Safari',dest:'Kenia',tage:7,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/7-days-lake-turkana-safari/',img:'',desc:"Journey to Kenya\'s remote jade sea — Lake Turkana in the northern frontier.",tags:['kenia','turkana','nische','offbeat','norden'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a5',name:'13 Days Kenya Historic Railway',dest:'Kenia',tage:13,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/13-days-kenyas-historic-railway/',img:'',desc:"Unique journey following Kenya\'s historic railway.",tags:['kenia','kultur','eisenbahn','nische','geschichte'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a6',name:'14 Days Kenya Rift Valley Lakes',dest:'Kenia',tage:14,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/14-days-kenyas-rift-valley-lakes/',img:'',desc:"Spectacular soda lakes, flamingos, and diverse ecosystems of Kenya\'s Great Rift Valley.",tags:['kenia','rift-valley','seen','comprehensive','natur'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a7',name:'12 Days Photographic Safari Kenya',dest:'Kenia',tage:12,niveau:'luxury',url:'https://www.adventurexpeditions.com/tour/12-days-photographic-safari/',img:'https://www.adventurexpeditions.com/wp-content/uploads/2024/10/GreenonGreen.jpg',desc:"Professional guidance, prime wildlife positions, Kenya\'s most photogenic landscapes.",tags:['kenia','fotografie','luxury','masai-mara','premium','photographic'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a8',name:'8 Days Kenya Horizon',dest:'Kenia',tage:8,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/8-days-kenya-horizon/',img:'',desc:'Eight days: Samburu in the north to the Masai Mara in the south.',tags:['kenia','wildlife','masai-mara','samburu'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a9',name:'12 Days Across Kenya',dest:'Kenia',tage:12,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/12-days-across-kenya/',img:'',desc:'Comprehensive: Samburu, Laikipia, Masai Mara and beyond.',tags:['kenia','comprehensive','masai-mara','samburu','laikipia'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a10',name:'10 Days Flying Safari Amboseli & Northern Kenya',dest:'Kenia',tage:10,niveau:'luxury',url:'https://www.adventurexpeditions.com/tour/10-days-flying-safari-amboseli-and-northern-kenya/',img:'https://www.adventurexpeditions.com/wp-content/uploads/2024/10/Premium-Kenya-Flying-Luxury-Safari.jpg',desc:'Premium fly-in safari: Amboseli and Northern Kenya. Kilimanjaro views, walking safaris in Laikipia.',tags:['kenia','fly-in','luxury','amboseli','laikipia','walking-safari','premium'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a11',name:'6 Days Tanzania Explorer Safari',dest:'Tansania',tage:6,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/6-days-tanzania-explorer-safari/',img:'',desc:'Six days: Serengeti, Ngorongoro, and Tarangire.',tags:['tansania','serengeti','ngorongoro','wildlife','kurzreise'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a12',name:'12 Days Tanzania Highlights Safari',dest:'Tansania',tage:12,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/12-days-tanzania-highlights-safari/',img:'',desc:'Serengeti migration, Ngorongoro Crater, Tarangire elephants, Lake Manyara.',tags:['tansania','serengeti','ngorongoro','tarangire','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a13',name:'12 Days Selous & Zanzibar Safari',dest:'Tansania',tage:12,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/12-days-selous-zanzibar-safari/',img:'',desc:'Selous Game Reserve boat safaris combined with Zanzibar beaches.',tags:['tansania','selous','strand','kombi','nische'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a11b',name:'8 Days Tanzania Classic Safari',dest:'Tansania',tage:8,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/8-days-tanzania-classic-safari/',img:'',desc:'Eight days covering Tanzania\s northern circuit: Serengeti, Ngorongoro, Tarangire, and Lake Manyara.',tags:['tansania','serengeti','ngorongoro','tarangire','wildlife'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a11c',name:'10 Days Tanzania & Zanzibar Beach Safari',dest:'Tansania',tage:10,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/10-days-tanzania-zanzibar-beach-safari/',img:'',desc:'Tanzania safari combined with Zanzibar beach escape. Serengeti, Ngorongoro and pristine Indian Ocean beaches.',tags:['tansania','serengeti','ngorongoro','zanzibar','strand','kombi'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a11d',name:'15 Days Tanzania Highlights & Zanzibar',dest:'Tansania',tage:15,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/15-days-tanzania-highlights-zanzibar/',img:'',desc:'Comprehensive Tanzania: all major parks plus Zanzibar beaches. Serengeti migration, Ngorongoro, Tarangire, Ruaha, Zanzibar.',tags:['tansania','serengeti','ngorongoro','tarangire','ruaha','zanzibar','strand','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a11e',name:'7 Days Kilimanjaro Climb & Safari',dest:'Tansania',tage:7,niveau:'adventure',url:'https://www.adventurexpeditions.com/tour/7-days-kilimanjaro-climb-safari/',img:'',desc:'Climb Mount Kilimanjaro via Marangu route combined with a Serengeti game drive safari.',tags:['tansania','kilimanjaro','trekking','abenteuer','serengeti','nische'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a14',name:'13 Days Serengeti & Chimpanzees',dest:'Tansania',tage:13,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/13-days-serengeti-and-chimpanzees-adventure/',img:'https://www.adventurexpeditions.com/wp-content/uploads/2024/10/6737832.png',desc:'Serengeti wildlife combined with chimpanzee trekking in Mahale Mountains.',tags:['tansania','serengeti','chimps','mahale','comprehensive','primaten'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a15',name:'5 Days Uganda Primate Safari',dest:'Uganda',tage:5,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/5-days-uganda-primate-safari/',img:'https://www.adventurexpeditions.com/wp-content/uploads/2024/10/5-Days-Uganda-Gorilla-Safari-Uganda-Wildlife-Tour-Chimpanzee-trekking-Safari-Uganda.jpg',desc:'Gorillas and chimpanzees in Bwindi and Kibale forests.',tags:['uganda','gorilla','chimps','primaten','bwindi','kibale','kurzreise'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a15b',name:'8 Days Uganda Gorilla & Wildlife Safari',dest:'Uganda',tage:8,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/8-days-uganda-gorilla-wildlife-safari/',img:'',desc:'Eight days combining gorilla trekking in Bwindi with big game viewing in Queen Elizabeth and Murchison Falls National Parks.',tags:['uganda','gorilla','wildlife','murchison','queen-elizabeth','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a15c',name:'14 Days Uganda & Rwanda Primates Safari',dest:'Uganda',tage:14,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/14-days-uganda-rwanda-primates-safari/',img:'',desc:'Comprehensive primate safari across Uganda and Rwanda: gorillas in Bwindi, chimpanzees in Kibale, golden monkeys in Volcanoes NP.',tags:['uganda','ruanda','gorilla','chimps','primaten','bwindi','volcanoes','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a16',name:'11 Days Uganda Cultural Tour',dest:'Uganda',tage:11,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/11-days-uganda-cultural-tour/',img:'',desc:'Wildlife and deep cultural immersion across the Pearl of Africa.',tags:['uganda','cultural','gorilla','wildlife','community'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a17',name:'12 Days Uganda Wildlife & Gorilla Safari',dest:'Uganda',tage:12,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/12-days-uganda-wildlife-gorilla-safari/',img:'',desc:'Murchison Falls, Queen Elizabeth, and Bwindi — big game and gorilla trekking.',tags:['uganda','gorilla','wildlife','murchison','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a18',name:'3 Days Rwanda Gorilla Trek',dest:'Ruanda',tage:3,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/3-days-rwanda-gorilla-trek/',img:'',desc:'Focused gorilla trekking in Volcanoes National Park.',tags:['ruanda','gorilla','volcanoes','primaten','kurzreise'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a19',name:'6 Days Rwanda Classic Safari',dest:'Ruanda',tage:6,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/6-days-rwanda-classic-safari/',img:'',desc:'Gorillas in Volcanoes NP, big game in Akagera, canopy walk in Nyungwe.',tags:['ruanda','gorilla','akagera','nyungwe','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''},
    {id:'a20',name:'6 Days Rwanda Gorilla Safari',dest:'Ruanda',tage:6,niveau:'midrange',url:'https://www.adventurexpeditions.com/tour/6-days-rwanda-gorilla-safari/',img:'https://www.adventurexpeditions.com/wp-content/uploads/2024/10/1448-2048.webp',desc:"Mountain gorillas in Volcanoes NP and Rwanda\'s stunning landscapes.",tags:['ruanda','gorilla','volcanoes','primaten','comprehensive'],highlights:[],itinerary:[],hotels:[],prices:[],included:[],not_included:[],gallery:[],scraped_at:''}]}];

window.KALI_DATA = { defaultKunden, defaultOps };
})();
