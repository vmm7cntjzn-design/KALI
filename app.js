/* ═══════════════════════════════════════════════════════════
   KALI — app.js
   Kernlogik: Storage, Undo, Import, Match-Engine, Konstanten
═══════════════════════════════════════════════════════════ */

// ── KONSTANTEN ────────────────────────────────────────────
const DC = {
  Kenia:    { bg: '#eff6ff', c: '#1d4ed8' },
  Uganda:   { bg: '#f0fdf4', c: '#166534' },
  Ruanda:   { bg: '#fdf4ff', c: '#7e22ce' },
  Tansania: { bg: '#fff7ed', c: '#c2410c' },
};
const STATUS = {
  offen:       { bg: '#f1f5f9', c: '#64748b', l: 'Offen' },
  kontaktiert: { bg: '#fef9c3', c: '#854d0e', l: 'Kontaktiert' },
  aktiv:       { bg: '#f0fdf4', c: '#166534', l: 'Aktiv' },
  pause:       { bg: '#f1f5f9', c: '#475569', l: 'Pause' },
};
const PRIO = {
  hoch:    { bg: '#fef2f2', border: '#ef4444' },
  mittel:  { bg: '#fffbeb', border: '#f59e0b' },
  niedrig: { bg: '#f0fdf4', border: '#22c55e' },
};
const NV = {
  luxury:    { bg: '#fdf4ff', c: '#7e22ce', l: 'Luxury' },
  midrange:  { bg: '#eff6ff', c: '#1d4ed8', l: 'Mid-Range' },
  adventure: { bg: '#fff7ed', c: '#c2410c', l: 'Adventure' },
};
const FOCUS = ['Kenia', 'Uganda', 'Ruanda', 'Tansania'];
const STORAGE_KEY = 'kali_v2';

// ── PRÄSI-KONFIGURATION ──────────────────────────────────
// Dokumentiert die Folien-Logik für automatische PPTX-Erstellung.
// Wird automatisch in jeden Präsi-JSON-Export eingebettet.
const PRAESI_CONFIG = {
  version: '1.0',
  folienLogik: [
    { pos: 1,   typ: 'cover',         inhalt: 'Veranstalternamen + Ansprechpartner aus Profil, Fokusländer-Flags, KALI-Branding' },
    { pos: 2,   typ: 'netzwerk',      inhalt: 'KALI Kollektiv Übersicht — Adventure Expeditions · Manya Africa Tours · We Love Tanzania' },
    { pos: '…', typ: 'dmc_intro',     inhalt: 'Netzwerkpartner-Übersicht automatisch vor jeder DMC-Gruppe (wenn Touren dieses DMC in Präsi-Liste)' },
    { pos: '…', typ: 'tour',          inhalt: 'Pro Tour eine Folie: Nummer/Gesamt · DMC · Tourname · Dauer · 3 Highlights · Route/Link' },
    { pos: -1,  typ: 'abschluss',     inhalt: 'Außergewöhnlich reisen. + Ansprechpartner-Name + KALI-Kontakt' },
  ],
  tourFolieStruktur: {
    zeile1: 'Zähler (X / Gesamt-Touren dieses DMC)',
    zeile2: 'DMC-Name · Destination',
    zeile3: 'Tourname (groß)',
    zeile4: 'Dauer · Hauptorte',
    bullets: [
      'Einzigartigkeit — was kann NUR diese Tour',
      'Kundenerlebnis — was erlebt der Reisende konkret (sensorisch/emotional)',
      'Vertriebsargument — warum für DIESEN Veranstalter (Differenzierung/Nische)'
    ],
    footer: 'Link zur Tour auf DMC-Website',
    bild: 'Foto-Placeholder (manuell einfügen)',
  },
  dmc_reihenfolge: ['Adventure Expeditions', 'Manya Africa Tours', 'We Love Tanzania'],
  mantelFolien: {
    cover: { austauschen: ['veranstalterName', 'ansprechpartner', 'position', 'fokuslaender'] },
    netzwerk: { austauschen: [] },
    abschluss: { austauschen: ['veranstalterName', 'ansprechpartner', 'email', 'telefon'] },
  },
  vorlage: 'KALI_Lernidee_2026.pptx',
  design: {
    hintergrund: '0D1B2A',
    akzent: '0A7B83',
    schrift_titel: 'Georgia',
    schrift_body: 'Calibri',
    farben: { AE: 'FFFFFF', Manya: '7A6010', WLT: 'B0392B' }
  }
};

// ── STATE ─────────────────────────────────────────────────
let kunden = [];
let ops    = [];
let _kaliHistory = [];

// ── UTILS ─────────────────────────────────────────────────
function uid() { return 'x' + Math.random().toString(36).substr(2, 9); }

function e(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scoreColor(t) {
  return t >= 8 ? '#16a34a' : t >= 5 ? '#d97706' : '#dc2626';
}

function totalScore(s) {
  return Object.values(s || {}).reduce((a, b) => a + b, 0);
}

// ── HISTORY / UNDO ────────────────────────────────────────
function pushHistory() {
  _kaliHistory.push(JSON.stringify({ kunden, ops }));
  if (_kaliHistory.length > 30) history.shift();
  const btn = document.getElementById('undo-btn');
  if (btn) btn.disabled = false;
}

function undo() {
  if (!_kaliHistory.length) return;
  const s = JSON.parse(_kaliHistory.pop());
  kunden = s.kunden;
  ops    = s.ops;
  const btn = document.getElementById('undo-btn');
  if (btn) btn.disabled = !_kaliHistory.length;
  if (typeof render === 'function') render();
  else if (typeof renderV === 'function') renderV();
}

document.addEventListener('keydown', ev => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') {
    ev.preventDefault();
    undo();
  }
});

// ── STORAGE ───────────────────────────────────────────────
function laden() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
      const p = JSON.parse(d);
      if (p.kunden && p.kunden.length > 0) {
        kunden = p.kunden;
        ops    = p.ops || JSON.parse(JSON.stringify(window.KALI_DATA.defaultOps));
        return; // success
      }
    }
  } catch (err) {
    console.warn('localStorage read error:', err);
  }
  // Fallback to defaults
  kunden = JSON.parse(JSON.stringify(window.KALI_DATA.defaultKunden));
  ops    = JSON.parse(JSON.stringify(window.KALI_DATA.defaultOps));
}

// After laden: merge any defaultKunden data that's missing in localStorage
function mergeDefaults() {
  const defaults = window.KALI_DATA.defaultKunden;
  let changed = false;
  kunden = kunden.map(k => {
    const dk = defaults.find(x => x.id === k.id);
    if (!dk) return k;
    // Merge fokusReisen: if any land has fewer tours in localStorage than in defaults, update it
    const frDefault = dk.fokusReisen || {};
    const frCurrent = k.fokusReisen || {};
    let frChanged = false;
    const frMerged = { ...frCurrent };
    Object.entries(frDefault).forEach(([land, defaultReisen]) => {
      const currentReisen = frCurrent[land] || [];
      if (defaultReisen.length > currentReisen.length) {
        frMerged[land] = defaultReisen;
        frChanged = true;
      }
    });
    if (frChanged) { changed = true; return { ...k, fokusReisen: frMerged }; }
    return k;
  });
  if (changed) save();
}

let _saveTimer = null;
function save() {
  const data = JSON.stringify({ kunden, ops });
  localStorage.setItem(STORAGE_KEY, data);
  // Debounced server save (300ms delay to batch rapid changes)
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    }).then(r => r.ok ? updateSaveIndicator(true) : updateSaveIndicator(false))
      .catch(() => updateSaveIndicator(false));
  }, 300);
}

function updateSaveIndicator(ok) {
  let el = document.getElementById('save-indicator');
  if (!el) return;
  if (ok) {
    el.textContent = '● Gespeichert';
    el.style.color = '#22c55e';
    el.style.background = 'transparent';
    el.style.padding = '0';
    el.title = '';
  } else {
    el.textContent = '⚠ Nicht auf Server gespeichert — ↻ Aktualisieren drücken!';
    el.style.color = '#fff';
    el.style.background = '#dc2626';
    el.style.padding = '2px 8px';
    el.style.borderRadius = '5px';
    el.title = 'Daten nur lokal gespeichert. Server nicht erreichbar oder neu gestartet.';
  }
}

function exportJSON() {
  const b = new Blob([JSON.stringify({ kunden, ops }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'kali_export.json';
  a.click();
}

// ── IMPORT / AKTUALISIEREN ────────────────────────────────
function ladeVomServer() {
  fetch('/load')
    .then(r => {
      if (!r.ok) throw new Error('Keine gespeicherte Datei auf dem Server');
      return r.json();
    })
    .then(data => {
      if (!data.kunden || !data.ops) throw new Error('Ungültiges Format');
      const existingById = {};
      kunden.forEach(k => { existingById[k.id] = k; });
      kunden = data.kunden.map(incoming => {
        const ex = existingById[incoming.id];
        if (!ex || !ex._manualFields || !ex._manualFields.length) return incoming;
        const protected_ = {};
        ex._manualFields.forEach(f => { protected_[f] = ex[f]; });
        return { ...incoming, ...protected_, _manualFields: ex._manualFields };
      });
      ops = data.ops;
      save();
      render();
      showToast('✓ Daten vom Server geladen');
    })
    .catch(err => {
      // Fallback to file dialog
      showToast('Server: ' + err.message + ' — Datei wählen');
      document.getElementById('import-file').click();
    });
}

function showToast(msg) {
  let t = document.getElementById('kali-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'kali-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:8px 18px;border-radius:8px;font-size:12px;font-weight:600;z-index:9999;transition:opacity 0.3s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

function importContent(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);

      // Support both baobab_content.json (operators) and kali_export.json (ops) formats
      const source = data.operators || data.ops || [];

      if (source.length) {
        // Operator/Netzwerk update
        pushHistory();
        let updated = 0, added = 0;
        source.forEach(opData => {
          const tours = opData.tours || opData.touren || [];
          const opIdx = ops.findIndex(o => o.id === opData.id || o.name === opData.name);
          if (opIdx === -1) {
            ops.push({
              id: opData.id || uid(),
              name: opData.name, land: opData.land || '',
              url: opData.url || '', preisniveau: opData.preisniveau || '',
              beschreibung: opData.beschreibung || '',
              staerken: opData.staerken || [],
              touren: tours.map(t => normalTour(t))
            });
            added++;
          } else {
            tours.forEach(td => {
              const ti = ops[opIdx].touren.findIndex(t => t.id === td.id || t.name === td.name);
              const nt = normalTour(td);
              if (ti === -1) {
                ops[opIdx].touren.push(nt);
                added++;
              } else {
                const ex = ops[opIdx].touren[ti];
                ops[opIdx].touren[ti] = {
                  ...ex,
                  img:         nt.img         || ex.img,
                  desc:        nt.desc        || ex.desc,
                  highlights:  nt.highlights.length  ? nt.highlights  : ex.highlights  || [],
                  itinerary:   nt.itinerary.length   ? nt.itinerary   : ex.itinerary   || [],
                  hotels:      nt.hotels.length       ? nt.hotels      : ex.hotels      || [],
                  prices:      nt.prices.length       ? nt.prices      : ex.prices      || [],
                  included:    nt.included.length     ? nt.included    : ex.included    || [],
                  not_included:nt.not_included.length ? nt.not_included: ex.not_included|| [],
                  gallery:     nt.gallery.length      ? nt.gallery     : ex.gallery     || [],
                  scraped_at:  nt.scraped_at  || ex.scraped_at || '',
                };
                updated++;
              }
            });
            if (opData.beschreibung) ops[opIdx].beschreibung = opData.beschreibung;
            if (opData.staerken?.length) ops[opIdx].staerken = opData.staerken;
          }
        });
        save();
        render();
        alert(`✓ Aktualisiert!\n${updated} Touren aktualisiert\n${added} neue Touren hinzugefügt`);

      } else if (data.kunden) {
        // Full kali_export.json — merge Kunden too
        pushHistory();
        const existingById = {};
        kunden.forEach(k => { existingById[k.id] = k; });
        kunden = data.kunden.map(incoming => {
          const ex = existingById[incoming.id];
          if (!ex || !ex._manualFields || !ex._manualFields.length) return incoming;
          const protected_ = {};
          ex._manualFields.forEach(f => { protected_[f] = ex[f]; });
          return { ...incoming, ...protected_, _manualFields: ex._manualFields };
        });
        if (data.ops) ops = data.ops;
        save();
        render();
        alert('✓ Export vollständig importiert.');
      } else {
        alert('Unbekanntes Format.');
      }
    } catch (err) {
      alert('Import-Fehler: ' + err.message);
    }
    input.value = '';
  };
  reader.readAsText(file);
}

function normalTour(t) {
  return {
    id:          t.id          || uid(),
    name:        t.name        || '',
    dest:        t.dest        || '',
    tage:        t.tage        || 0,
    niveau:      t.niveau      || 'midrange',
    url:         t.url         || '',
    img:         t.img         || t.img_local || '',
    desc:        t.desc        || '',
    tags:        t.tags        || [],
    highlights:  t.highlights  || [],
    itinerary:   t.itinerary   || [],
    hotels:      t.hotels      || [],
    prices:      t.prices      || [],
    included:    t.included    || [],
    not_included:t.not_included|| [],
    gallery:     [...(t.gallery || []), ...(t.gallery_local || [])].filter(Boolean),
    scraped_at:  t.scraped_at  || '',
  };
}

// ── MATCH ENGINE ──────────────────────────────────────────
function findMatches(tags) {
  const results = [];
  ops.forEach(op => {
    op.touren.forEach(t => {
      const overlap = (tags || []).filter(x => (t.tags || []).includes(x));
      // Require minimum 2 common tags for a valid match
      if (overlap.length >= 2) {
        results.push({
          op: op.name, opId: op.id,
          tour: t.name, tourId: t.id,
          dest: t.dest, niveau: t.niveau,
          url: t.url, score: overlap.length,
          keyArgs: overlap, // common tags = key arguments
        });
      }
    });
  });
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

function allTourTags() {
  const s = new Set();
  ops.forEach(op => op.touren.forEach(t => (t.tags || []).forEach(tg => s.add(tg))));
  return [...s].sort();
}

// ── HOTEL EXTRACTION ──────────────────────────────────────
const HOTEL_PATS = [
  /(?:overnight|night at|stay at|sleep at|lodge at)\s+(?:the\s+)?([A-Z][A-Za-z\s&'\-]{3,45}(?:Lodge|Camp|Hotel|Resort|Tented|House|Inn|Sanctuary|Retreat))/i,
  /([A-Z][A-Za-z\s&'\-]{2,40})\s+(?:Lodge|Camp|Hotel|Resort|Tented Camp|Bush Camp|Safari Camp|Eco Lodge|Sanctuary|Retreat)/i,
];
const HOTEL_FILTER = ['national park','game reserve','forest','crater','valley','mountain','lake','river'];

function extractHotel(text) {
  for (const pat of HOTEL_PATS) {
    const m = pat.exec(text);
    if (m) {
      const h = (m[1] || m[0]).trim();
      if (h.length > 3 && h.length < 55 && !HOTEL_FILTER.some(w => h.toLowerCase().includes(w))) {
        return h;
      }
    }
  }
  return '';
}

// ── PRICE FILTER (median-based) ───────────────────────────
function calcPriceRange(prices) {
  const rawPrices = prices || [];
  // Extract all numbers that look like prices (200–30000 range)
  const allNums = rawPrices.map(p => {
    const m = p.match(/[\d][,\d\.]*(?=\s*(?:USD|EUR|\$|€|per person|p\.p\.|pp))|(?<=(?:USD|EUR|\$|€))\s*[\d][,\d]*/gi) ||
              p.match(/[\d]{3,6}/g);
    return m ? m.map(x => parseInt(x.replace(/[^\d]/g, ''))).filter(n => n >= 300 && n <= 30000) : [];
  }).flat();

  if (!allNums.length) return null;

  // Use tight median filter (±40%) to remove outliers like single supplements
  const sorted = [...allNums].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const filtered = allNums.filter(n => n >= median * 0.6 && n <= median * 1.4);

  if (!filtered.length) return null;

  const currency = rawPrices.join(' ').includes('$') ? 'USD' : 'EUR';
  const lo = Math.min(...filtered).toLocaleString('de-DE');
  const hi = Math.max(...filtered).toLocaleString('de-DE');

  return {
    lo, hi, currency,
    display: lo === hi ? `${lo} ${currency}` : `${lo} – ${hi} ${currency}`,
  };
}

// ── SUBTEXT UPDATE ────────────────────────────────────────
function updateSubtext() {
  const el = document.getElementById('sub-text');
  if (el) {
    const aktiv = kunden.filter(k => k.status === 'aktiv').length;
    el.textContent = `${kunden.length} Veranstalter · ${aktiv} aktiv`;
  }
}

// ── RESET (clear localStorage, reload fresh defaults) ─────
function resetKALI() {
  if (!confirm('Alle gespeicherten Daten löschen und mit frischen Standarddaten neu starten?\n\nDies löscht deine Notizen, Scores und manuellen Einträge.')) return;
  localStorage.removeItem(STORAGE_KEY);
  // Also clear old keys from previous versions
  ['kali_v1','baobab_v5','baobab_v1'].forEach(k => localStorage.removeItem(k));
  location.reload();
}

// ── API KEY ───────────────────────────────────────────────
function getApiKey() {
  return localStorage.getItem('kali_api_key') || '';
}
function setApiKey(key) {
  localStorage.setItem('kali_api_key', key.trim());
}
function promptApiKey() {
  const current = getApiKey();
  const key = prompt(
    'Anthropic API-Key eingeben:\n\n' +
    'Erstellen unter: console.anthropic.com → API Keys\n\n' +
    '(Wird nur lokal in deinem Browser gespeichert)',
    current
  );
  if (key !== null) setApiKey(key);
  return key?.trim() || '';
}

// ── AI RESEARCH (Anthropic API) ───────────────────────────
async function runKontextRecherche(kundeId) {
  const k = kunden.find(x => x.id === kundeId);
  if (!k) return;

  // Get or ask for API key
  let apiKey = getApiKey();
  if (!apiKey) {
    apiKey = promptApiKey();
    if (!apiKey) return;
  }

  const btn = document.getElementById('recherche-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Recherchiere…'; }

  const prompt = `Du bist ein Experte für den deutschsprachigen Reiseveranstalter-Markt. Recherchiere folgende Informationen über "${k.name}" (${k.sitz}, Segment: ${k.segment}):

1. Unternehmensgröße (Mitarbeiterzahl, Umsatz wenn öffentlich)
2. Gründungsjahr und Eigentümerstruktur
3. Auszeichnungen und Zertifizierungen (Nachhaltigkeit, Qualität)
4. Marktposition und bekannte Alleinstellungsmerkmale
5. Aktuelle Entwicklungen 2023/2024 (Übernahmen, neue Produkte, Expansion)
6. Relevante Hinweise für eine Akquise-Ansprache

Antworte auf Deutsch, kompakt und faktenbasiert. Nenne für externe Fakten die Quelle in Klammern. Falls du keine sicheren Informationen hast, sage das klar.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    if (data.error) {
      if (data.error.type === 'authentication_error') {
        alert('API-Key ungültig. Bitte neu eingeben.');
        setApiKey('');
        promptApiKey();
      } else {
        alert('API-Fehler: ' + data.error.message);
      }
      return;
    }
    const text = data.content?.map(c => c.text || '').join('') || 'Keine Antwort erhalten.';
    const existing = k.kontextNotizen || '';
    const separator = existing ? '\n\n---\n🤖 KI-Recherche (' + new Date().toLocaleDateString('de-DE') + '):\n' : '🤖 KI-Recherche (' + new Date().toLocaleDateString('de-DE') + '):\n';
    updK('kontextNotizen', existing + separator + text);
    save();
    render();
  } catch (err) {
    alert('Recherche-Fehler: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 KI-Recherche'; }
  }
}

// ── CLIPBOARD RECHERCHE ───────────────────────────────────
function copyRecherchePrompt(kundeId) {
  const k = kunden.find(x => x.id === kundeId);
  if (!k) return;

  const prompt = `Du bist ein Experte für den deutschsprachigen Reiseveranstalter-Markt. Recherchiere folgende Informationen über "${k.name}" (Sitz: ${k.sitz}, Segment: ${k.segment}):

1. Unternehmensgröße (Mitarbeiterzahl, Umsatz wenn öffentlich)
2. Gründungsjahr und Eigentümerstruktur
3. Auszeichnungen und Zertifizierungen (Nachhaltigkeit, Qualität)
4. Marktposition und bekannte Alleinstellungsmerkmale
5. Aktuelle Entwicklungen 2023/2024 (Übernahmen, neue Produkte, Expansion)
6. Besondere Hinweise für eine Akquise-Ansprache

Antworte kompakt und faktenbasiert auf Deutsch. Nenne für externe Fakten die Quelle in Klammern. Falls du keine sicheren Informationen hast, sage das klar.`;

  navigator.clipboard.writeText(prompt).then(() => {
    // Show confirmation
    const btn = document.getElementById('recherche-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Kopiert!';
      btn.style.color = '#16a34a';
      btn.style.borderColor = '#16a34a';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.color = '';
        btn.style.borderColor = '';
      }, 2000);
    }
    // Open claude.ai in new tab
    window.open('https://claude.ai', '_blank');
  }).catch(() => {
    // Fallback: show prompt in alert for manual copy
    prompt_fallback(prompt);
  });
}

function prompt_fallback(text) {
  const w = window.open('', '_blank', 'width=600,height=400');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recherche-Prompt</title>
  <style>body{font-family:system-ui;padding:20px;} textarea{width:100%;height:280px;font-size:13px;} button{margin-top:10px;padding:8px 16px;cursor:pointer;}</style>
  </head><body>
  <p style="font-size:13px;color:#64748b;margin-bottom:8px">Text kopieren → auf <a href="https://claude.ai" target="_blank">claude.ai</a> einfügen:</p>
  <textarea id="t">${text.replace(/</g,'&lt;')}</textarea>
  <button onclick="document.getElementById('t').select();document.execCommand('copy');this.textContent='✓ Kopiert!'">Kopieren</button>
  </body></html>`);
}

// ── PROFIL & NEWS PROMPTS ─────────────────────────────────
function copyProfilPrompt(kundeId) {
  const k = kunden.find(x => x.id === kundeId);
  if (!k) return;
  const prompt = `Recherchiere folgende strategische Informationen über den deutschen Reiseveranstalter "${k.name}" (Sitz: ${k.sitz}, Segment: ${k.segment}, Homepage: ${k.homepage||'unbekannt'}):

1. ZIELGRUPPE: Wen spricht ${k.name} an? (Alter, Einkommen, Reisestil, Gruppengröße)
2. VERTRIEBSKANÄLE: Wie buchen Kunden? (Direktbuchung online, Reisebüros, Katalog, Telefon)
3. WETTBEWERBER: Mit welchen anderen deutschen Reiseveranstaltern wird ${k.name} häufig verglichen oder konkurriert?
4. OSTAFRIKA-SCHWERPUNKT: Welche Ostafrika-Länder dominieren im Portfolio? Welche Produkttypen (Safari, Trekking, Kulturreise, Zugreise)? Welche DMCs, Groundhandler oder lokalen Touroperatoren setzt ${k.name} nachweislich oder wahrscheinlich in Ostafrika ein — aktuell und historisch? (Hinweise aus Katalogen, Partnerseiten, Pressemitteilungen, Branchenberichten, Reisebericht-Blogs). Gibt es Hinweise auf Exklusivverträge oder langjährige Partnerschaften?
5. GESPRÄCHSEINSTIEG: Welchen konkreten Aufhänger würdest du für ein Erstgespräch mit ${k.name} empfehlen, wenn man neue Ostafrika-Produkte pitchen möchte?
6. STÄRKEN & NISCHEN: Was sind die herausragenden Stärken und Nischenkompetenzen von ${k.name}? (Spezialthemen, Alleinstellungsmerkmale, besondere Expertise)

Antworte kompakt und faktenbasiert auf Deutsch. Nenne Quellen in Klammern. Trenne die 6 Punkte klar.`;

  navigator.clipboard.writeText(prompt).then(() => {
    showCopyFeedback('profil-prompt-btn', '✓ Kopiert!');
    window.open('https://claude.ai', '_blank');
  }).catch(() => openPromptWindow(prompt));
}

function copyNewsPrompt(kundeId) {
  const k = kunden.find(x => x.id === kundeId);
  if (!k) return;
  const fokus = Object.entries(k.fokusReisen||{}).filter(([,v])=>v.length>0).map(([d])=>d).join(', ') || 'Ostafrika';
  const prompt = `Suche aktuelle Nachrichten und Erwähnungen von "${k.name}" (deutsche Reisebranche).

Fokus auf:
- Pressemitteilungen oder Medienberichte über ${k.name} aus den letzten 12 Monaten
- Erwähnungen in Zusammenhang mit ${fokus}
- Neue Produkte, Kooperationen, Auszeichnungen oder strategische Änderungen
- Branchenrelevante Entwicklungen (ITB, DRV, Fachpresse wie fvw, Reisevor9)

Für jeden Treffer: Titel, kurze Zusammenfassung (1-2 Sätze), Datum und Link wenn verfügbar.
Wenn keine aktuellen News findbar: sage das klar und liste bekannte Fakten.
Antworte auf Deutsch.`;

  navigator.clipboard.writeText(prompt).then(() => {
    showCopyFeedback('news-prompt-btn', '✓ Kopiert!');
    window.open('https://claude.ai', '_blank');
  }).catch(() => openPromptWindow(prompt));
}

function showCopyFeedback(id, msg) {
  // Generic feedback for any copy button
  const btns = document.querySelectorAll('.btn');
  btns.forEach(b => {
    if (b.textContent.includes('News-Prompt') || b.textContent.includes('Profil-Prompt')) {
      const orig = b.textContent;
      b.textContent = msg;
      b.style.color = '#16a34a';
      setTimeout(() => { b.textContent = orig; b.style.color = ''; }, 2000);
    }
  });
}

function openPromptWindow(text) {
  const w = window.open('', '_blank', 'width=620,height=420');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prompt</title>
  <style>body{font-family:system-ui;padding:20px;}textarea{width:100%;height:300px;font-size:13px;border:1px solid #e2e8f0;border-radius:8px;padding:10px;}button{margin-top:10px;padding:8px 16px;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer;font-family:inherit;}</style>
  </head><body>
  <p style="font-size:13px;color:#64748b;margin-bottom:8px">Kopieren → auf <a href="https://claude.ai" target="_blank" style="color:#2563eb">claude.ai</a> einfügen:</p>
  <textarea id="t">${text.replace(/</g,'&lt;')}</textarea>
  <button onclick="document.getElementById('t').select();document.execCommand('copy');this.textContent='✓ Kopiert!'">Kopieren</button>
  </body></html>`);
}

// ── VERTRIEBSUNTERLAGEN ───────────────────────────────────
function ladeUnterlagen(kundeId, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    pushHistory();
    const eintrag = {
      dateiname: file.name,
      datum: new Date().toLocaleDateString('de-DE'),
      iv: '(IV wird nach Upload von Claude analysiert — Datei in neuem Chat hochladen)',
      groesse: Math.round(file.size / 1024) + ' KB',
    };
    kunden = kunden.map(k => k.id === kundeId
      ? { ...k, vertriebsUnterlagen: [...(k.vertriebsUnterlagen || []), eintrag] }
      : k);
    save();
    render();
    alert(`"${file.name}" als versendet eingetragen (${eintrag.groesse}).\n\nFür IV: Datei in neuem Claude-Chat hochladen und IV eintragen.`);
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

function loescheUnterlagen(idx) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, vertriebsUnterlagen: (k.vertriebsUnterlagen || []).filter((_, i) => i !== idx) }
    : k);
  save(); render();
}

function zeigeIV(idx) {
  const k = kunden.find(x => x.id === aktuelleId);
  if (!k) return;
  const u = (k.vertriebsUnterlagen || [])[idx];
  if (!u) return;
  const iv = prompt(`IV für "${u.dateiname}" bearbeiten:`, u.iv || '');
  if (iv === null) return;
  kunden = kunden.map(kk => kk.id === aktuelleId
    ? { ...kk, vertriebsUnterlagen: (kk.vertriebsUnterlagen || []).map((u2, i) => i === idx ? { ...u2, iv } : u2) }
    : kk);
  save(); render();
}

// ── VERIFIED & IV ─────────────────────────────────────────
function toggleVerified(kundeId) {
  kunden = kunden.map(k => k.id === kundeId
    ? { ...k, profilVerified: !k.profilVerified }
    : k);
  save();
  renderVDetail();
}

function updIV(idx, val) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, vertriebsUnterlagen: (k.vertriebsUnterlagen || []).map((u, i) =>
        i === idx ? { ...u, iv: val } : u) }
    : k);
  save();
}

function addUnterlagenEintrag(kundeId) {
  const dateiname = prompt('Dateiname (z.B. KALI_Windrose_2026.pptx):');
  if (!dateiname || !dateiname.trim()) return;
  pushHistory();
  const eintrag = {
    dateiname: dateiname.trim(),
    datum: new Date().toLocaleDateString('de-DE'),
    iv: '',
  };
  kunden = kunden.map(k => k.id === kundeId
    ? { ...k, vertriebsUnterlagen: [...(k.vertriebsUnterlagen || []), eintrag] }
    : k);
  save();
  render();
}
