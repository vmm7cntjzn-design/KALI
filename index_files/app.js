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
  vorbereitet: { bg: '#eff6ff', c: '#1d4ed8', l: 'Vorbereitet' },
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

// ── STATE ─────────────────────────────────────────────────
let kunden = [];
let ops    = [];
let history = [];

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
  history.push(JSON.stringify({ kunden, ops }));
  if (history.length > 30) history.shift();
  const btn = document.getElementById('undo-btn');
  if (btn) btn.disabled = false;
}

function undo() {
  if (!history.length) return;
  const s = JSON.parse(history.pop());
  kunden = s.kunden;
  ops    = s.ops;
  const btn = document.getElementById('undo-btn');
  if (btn) btn.disabled = !history.length;
  render();
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
      kunden = p.kunden || JSON.parse(JSON.stringify(window.KALI_DATA.defaultKunden));
      ops    = p.ops    || JSON.parse(JSON.stringify(window.KALI_DATA.defaultOps));
    } else {
      kunden = JSON.parse(JSON.stringify(window.KALI_DATA.defaultKunden));
      ops    = JSON.parse(JSON.stringify(window.KALI_DATA.defaultOps));
    }
  } catch (err) {
    kunden = JSON.parse(JSON.stringify(window.KALI_DATA.defaultKunden));
    ops    = JSON.parse(JSON.stringify(window.KALI_DATA.defaultOps));
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ kunden, ops }));
}

function exportJSON() {
  const b = new Blob([JSON.stringify({ kunden, ops }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'kali_export.json';
  a.click();
}

// ── IMPORT / AKTUALISIEREN ────────────────────────────────
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
        kunden = data.kunden;
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
      if (overlap.length > 0) {
        results.push({
          op: op.name, opId: op.id,
          tour: t.name, tourId: t.id,
          dest: t.dest, niveau: t.niveau,
          url: t.url, score: overlap.length,
        });
      }
    });
  });
  return results.sort((a, b) => b.score - a.score).slice(0, 6);
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
  const allNums = rawPrices.map(p => {
    const m = p.match(/[\d][,\d]*/g);
    return m ? m.map(x => parseInt(x.replace(/[^\d]/g, ''))).filter(n => n > 200 && n < 50000) : [];
  }).flat();

  if (!allNums.length) return null;

  const sorted = [...allNums].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const filtered = allNums.filter(n => n >= median * 0.5 && n <= median * 1.5);

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
