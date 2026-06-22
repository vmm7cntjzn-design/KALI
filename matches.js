/* ═══════════════════════════════════════════════════════════
   KALI — matches.js v2
   Matches-Tab: geographische Schnittmengen + Lücken
═══════════════════════════════════════════════════════════ */

// ── OSTAFRIKA ORTSLISTE ───────────────────────────────────
const OA_ORTE = [
  // Kenia
  'masai mara','mara','laikipia','samburu','amboseli','tsavo','nakuru','bogoria','baringo',
  'naivasha','aberdare','mount kenya','ol pejeta','lewa','chyulu','lamu','diani','mombasa',
  'malindi','turkana','marsabit','isiolo','shaba','buffalo springs','mathews','karisia',
  // Uganda
  'bwindi','kibale','queen elizabeth','murchison','murchison falls','kidepo','lake mburo',
  'rwenzori','jinja','kampala','entebbe','kazinga','paraa','ishasha','semuliki','ziwa',
  // Ruanda
  'volcanoes','volcanos','virunga','nyungwe','akagera','kigali','kivu','musanze','gisenyi',
  // Tansania
  'serengeti','ngorongoro','tarangire','ruaha','selous','mahale','gombe','zanzibar',
  'kilimanjaro','arusha','manyara','katavi','saadani','pemba','mikumi','udzungwa',
];

// ── LAND & THEMA → ORTE MAPPING ──────────────────────────
const COUNTRY_ORTE = {
  uganda:   ['bwindi','kibale','queen elizabeth','murchison','murchison falls','lake mburo','kidepo'],
  ruanda:   ['volcanoes','nyungwe','akagera','kigali','virunga','musanze'],
  rwanda:   ['volcanoes','nyungwe','akagera','kigali','virunga','musanze'],
  kenia:    ['masai mara','mara','amboseli','tsavo','samburu','naivasha','laikipia','mount kenya'],
  kenya:    ['masai mara','mara','amboseli','tsavo','samburu','naivasha','laikipia','mount kenya'],
  tansania: ['serengeti','ngorongoro','tarangire','ruaha','selous','zanzibar','kilimanjaro','arusha'],
  tanzania: ['serengeti','ngorongoro','tarangire','ruaha','selous','zanzibar','kilimanjaro','arusha'],
};

const THEME_ORTE = {
  gorilla:       ['bwindi','volcanoes','virunga'],
  gorillas:      ['bwindi','volcanoes','virunga'],
  berggorilla:   ['bwindi','volcanoes','virunga'],
  berggorillas:  ['bwindi','volcanoes','virunga'],
  schimpansen:   ['kibale','mahale','gombe','nyungwe'],
  chimpanzee:    ['kibale','mahale','gombe','nyungwe'],
  chimp:         ['kibale','mahale','gombe','nyungwe'],
  primaten:      ['bwindi','kibale','volcanoes','nyungwe'],
  primates:      ['bwindi','kibale','volcanoes','nyungwe'],
};


// ── ORTS-EXTRAKTION ───────────────────────────────────────
// Direct place matching only (for long texts: itinerary, desc, highlights)
function extractOrte(text) {
  if (!text) return new Set();
  const lower = text.toLowerCase();
  const found = new Set();
  OA_ORTE.forEach(ort => { if (lower.includes(ort)) found.add(ort); });
  return found;
}

// Enhanced: direct + country/theme mapping (for short texts: name, tags only)
function extractOrteEnhanced(text) {
  if (!text) return new Set();
  const lower = text.toLowerCase();
  const found = extractOrte(text);

  // Country → typical places (only from name/tags context)
  Object.entries(COUNTRY_ORTE).forEach(([country, places]) => {
    if (lower.includes(country)) places.forEach(p => found.add(p));
  });

  // Theme/animal → typical places
  Object.entries(THEME_ORTE).forEach(([theme, places]) => {
    const re = new RegExp('\\b' + theme + '\\b', 'i');
    if (re.test(lower)) places.forEach(p => found.add(p));
  });

  return found;
}

function getVeranstalterOrte(k) {
  const orte = new Set();
  // Fokus-Reisen: enhanced (name is short+intentional)
  Object.values(k.fokusReisen || {}).forEach(reisen =>
    reisen.forEach(r => extractOrteEnhanced(r.name || '').forEach(o => orte.add(o)))
  );
  // Pitch tags: enhanced
  (k.pitchIdeen || []).forEach(p => {
    (p.tags || []).forEach(t => extractOrteEnhanced(t).forEach(o => orte.add(o)));
    extractOrte(p.text || '').forEach(o => orte.add(o)); // text can be long
  });
  // Lücken: direct only
  (k.luecken || []).forEach(l => extractOrte(l.titel || '').forEach(o => orte.add(o)));
  return orte;
}

function getTourOrte(tour) {
  const orte = new Set();
  // Enhanced mapping only for name + tags (short, intentional text)
  extractOrteEnhanced(tour.name || '').forEach(o => orte.add(o));
  (tour.tags || []).forEach(t => extractOrteEnhanced(t).forEach(o => orte.add(o)));
  // Direct matching only for long texts (itinerary/desc may mention places in passing)
  extractOrte(tour.desc || '').forEach(o => orte.add(o));
  extractOrte((tour.itinerary || []).join(' ')).forEach(o => orte.add(o));
  extractOrte((tour.highlights || []).join(' ')).forEach(o => orte.add(o));
  return orte;
}

// ── STATE ─────────────────────────────────────────────────
let matchesSelectedK = null;

// ── MAIN RENDER ───────────────────────────────────────────
function renderMatches() {
  const allData = kunden.map(k => {
    const { box1, box2 } = buildMatchData(k);
    return { k, box1count: box1.length, box2count: box2.length };
  }).sort((a, b) => (b.box1count + b.box2count) - (a.box1count + a.box2count));

  // Badge update
  const totalB1 = allData.reduce((s, x) => s + x.box1count, 0);
  const badge = document.getElementById('matches-badge');
  if (badge) { badge.textContent = totalB1; badge.style.display = totalB1 ? '' : 'none'; }

  // Sidebar
  document.getElementById('sb-top').innerHTML =
    `<div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;padding:2px 2px 8px">
      Veranstalter <span style="color:#166534">(${allData.filter(x=>x.box1count>0).length} Matches)</span>
    </div>`;

  document.getElementById('sidebar-list').innerHTML = allData.map(({ k, box1count, box2count }) => {
    const isActive = k.id === matchesSelectedK;
    return `<div class="karte${isActive ? ' on' : ''}" onclick="matchesSelectedK='${k.id}';renderMatches()">
      <div class="karte-name">${e(k.name)}</div>
      <div class="karte-sub">${e(k.sitz)}</div>
      <div class="karte-bottom">
        <div style="display:flex;gap:4px">
          ${box1count > 0 ? `<span style="font-size:9px;padding:2px 6px;border-radius:7px;background:#dcfce7;color:#166534;font-weight:700">${box1count} Touren</span>` : '<span style="font-size:9px;color:#cbd5e1">Keine</span>'}
          ${box2count > 0 ? `<span style="font-size:9px;padding:2px 6px;border-radius:7px;background:#fef9c3;color:#854d0e;font-weight:700">${box2count} Lücken</span>` : ''}
        </div>
        <span style="font-size:11px;font-weight:700;color:${scoreColor(totalScore(k.score||{}))}">
          ${totalScore(k.score||{})}<span style="font-size:9px;color:#94a3b8">/10</span>
        </span>
      </div>
    </div>`;
  }).join('');

  // Filter bar
  const selK = kunden.find(x => x.id === matchesSelectedK);
  document.getElementById('filter-bar-wrap').innerHTML = selK
    ? `<div class="filter-bar">
        <button class="back-btn" onclick="matchesSelectedK=null;renderMatches()" style="margin:0">← Übersicht</button>
        <span style="font-size:12px;font-weight:600;color:#0f172a;margin-left:4px">${e(selK.name)}</span>
      </div>`
    : `<div class="filter-bar">
        <span style="font-size:12px;color:#64748b">Geographische Schnittmengen · min. 3 gemeinsame Orte</span>
      </div>`;

  const el = document.getElementById('detail-area');
  if (matchesSelectedK) renderMatchDetail(matchesSelectedK, el);
  else renderMatchOverview(el);
}

// ── ÜBERSICHT: alle Veranstalter kompakt ──────────────────
function renderMatchOverview(el) {
  // Group by land
  const byLand = {};
  FOCUS.forEach(l => { byLand[l] = []; });

  kunden.forEach(k => {
    const { box1 } = buildMatchData(k);
    if (!box1.length) return;
    const destSet = new Set(box1.map(m => m.dest));
    destSet.forEach(d => { if (byLand[d]) byLand[d].push({ k, tours: box1.filter(m => m.dest === d) }); });
  });

  let html = `<div class="detail-inner">
    <div style="font-size:18px;font-weight:700;margin-bottom:4px">Match-Übersicht</div>
    <div style="font-size:12px;color:#64748b;margin-bottom:20px">
      Netzwerk-Touren mit ≥ 3 gemeinsamen Orten je Veranstalter · nach Ländern
    </div>`;

  let anyContent = false;
  FOCUS.forEach(land => {
    const items = byLand[land];
    if (!items.length) return;
    anyContent = true;
    const dc2 = DC[land] || { bg: '#f1f5f9', c: '#334155' };

    html += `<div style="margin-bottom:28px">
      <div class="op-dest-label" style="color:${dc2.c};border-color:${dc2.bg};margin-bottom:12px;font-size:12px;font-weight:700">
        ${land} <span style="font-size:10px;opacity:0.6">${items.reduce((s,x)=>s+x.tours.length,0)} Touren · ${items.length} Veranstalter</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px">`;

    items.forEach(({ k, tours }) => {
      const top = [...tours].sort((a,b) => b.gemeinsam.size - a.gemeinsam.size).slice(0,3);
      html += `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:11px 13px;cursor:pointer"
        onclick="matchesSelectedK='${k.id}';renderMatches()">
        <div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:6px;display:flex;justify-content:space-between">
          <span>${e(k.name)}</span>
          <span style="font-size:9px;padding:1px 6px;border-radius:6px;background:#dcfce7;color:#166534;font-weight:700">${tours.length}</span>
        </div>`;
      top.forEach(t => {
        html += `<div style="font-size:11px;padding:3px 0;border-bottom:1px solid #f8fafc;display:flex;gap:6px;align-items:flex-start">
          <span style="color:#166534;flex-shrink:0;font-size:10px;margin-top:2px">●</span>
          <div>
            <div style="color:#334155;font-weight:500">${e(t.tourName)}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:2px">
              ${[...t.gemeinsam].slice(0,4).map(o =>
                `<span style="font-size:9px;padding:1px 5px;border-radius:7px;background:#f0fdf4;color:#166534">${o}</span>`
              ).join('')}
              ${t.gemeinsam.size > 4 ? `<span style="font-size:9px;color:#94a3b8">+${t.gemeinsam.size-4}</span>` : ''}
            </div>
          </div>
          <span style="margin-left:auto;font-size:9px;font-weight:700;color:#166534;flex-shrink:0">${t.gemeinsam.size}</span>
        </div>`;
      });
      if (tours.length > 3) html += `<div style="font-size:10px;color:#94a3b8;padding-top:4px">+${tours.length-3} weitere…</div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
  });

  if (!anyContent) {
    html += `<div style="text-align:center;padding:40px 0;color:#cbd5e1">
      <div style="font-size:32px;margin-bottom:8px">🗺</div>
      <div style="font-size:14px">Noch keine Matches — Fokus-Reisen und Pitches ergänzen</div>
    </div>`;
  }

  html += `</div>`;
  el.innerHTML = html;
}

// ── DETAIL: ein Veranstalter ──────────────────────────────
function renderMatchDetail(kundeId, el) {
  const k = kunden.find(x => x.id === kundeId);
  if (!k) return;
  const { box1, box2 } = buildMatchData(k);
  const kOrte = getVeranstalterOrte(k);

  let html = `<div class="detail-inner">
    <div style="font-size:18px;font-weight:700;margin-bottom:2px">${e(k.name)}</div>
    <div style="font-size:12px;color:#64748b;margin-bottom:6px">${e(k.sitz)} · ${e(k.segment)}</div>`;

  // Erkannte Orte des Veranstalters
  if (kOrte.size) {
    html += `<div style="margin-bottom:16px;padding:8px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
      <span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Erkannte Orte des Veranstalters</span>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:5px">
        ${[...kOrte].map(o => `<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:#eff6ff;color:#1d4ed8">${o}</span>`).join('')}
      </div>
    </div>`;
  }

  // ── BOX 1 ─────────────────────────────────────────────
  html += `<div style="margin-bottom:24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:10px;height:10px;border-radius:50%;background:#166534;flex-shrink:0"></div>
      <div style="font-size:13px;font-weight:700">Touren mit geographischer Schnittmenge</div>
      <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:600">
        ${box1.length} Tour${box1.length!==1?'en':''}
      </span>
    </div>`;

  if (!box1.length) {
    html += `<div style="font-size:12px;color:#cbd5e1;padding:8px 0">
      Keine Touren mit ≥ 3 gemeinsamen Orten gefunden.
      Fokus-Reisen und Pitch-Tags ergänzen um Orte zu erkennen.
    </div>`;
  } else {
    FOCUS.forEach(land => {
      const landTours = box1.filter(m => m.dest === land);
      if (!landTours.length) return;
      const dc2 = DC[land] || { bg: '#f1f5f9', c: '#334155' };

      html += `<div style="margin-bottom:16px">
        <div class="op-dest-label" style="color:${dc2.c};border-color:${dc2.bg};margin-bottom:8px">
          ${land} <span style="font-size:10px;opacity:0.6">(${landTours.length})</span>
        </div>`;

      [...landTours].sort((a,b) => b.gemeinsam.size - a.gemeinsam.size).forEach(m => {
        const nv = NV[m.niveau] || NV.midrange;
        html += `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:11px 14px;margin-bottom:7px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div>
              <div style="font-size:12px;font-weight:600;color:#0f172a">${e(m.tourName)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:1px">${e(m.opName)}${m.tage ? ' · ' + m.tage + 'T' : ''}</div>
            </div>
            <div style="display:flex;gap:4px;align-items:center;flex-shrink:0">
              <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${nv.bg};color:${nv.c};font-weight:600">${nv.l}</span>
              <span style="font-size:13px;font-weight:700;color:#166534;min-width:18px;text-align:right">${m.gemeinsam.size}</span>
            </div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Gemeinsame Orte:</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px">
              ${[...m.gemeinsam].map(o =>
                `<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#f0fdf4;color:#166534;font-weight:500">${o}</span>`
              ).join('')}
            </div>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;align-items:center">
            <a href="${e(m.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none">Tour ansehen ↗</a>
            <button class="btn btn-xs btn-ghost" onclick="openTour('${m.opId}','${m.tourId}');setPage('netzwerk',document.querySelectorAll('.nav-tab')[1])">Details</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    });
  }
  html += `</div>`;

  // ── BOX 2 ─────────────────────────────────────────────
  html += `<div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:10px;height:10px;border-radius:50%;background:#d97706;flex-shrink:0"></div>
      <div style="font-size:13px;font-weight:700">Touren die beim Veranstalter fehlen</div>
      <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#fef9c3;color:#854d0e;font-weight:600">
        ${box2.length} Tour${box2.length!==1?'en':''}
      </span>
    </div>`;

  if (!box2.length) {
    html += `<div style="font-size:12px;color:#cbd5e1;padding:8px 0">Keine offenen Lücken gefunden.</div>`;
  } else {
    FOCUS.forEach(land => {
      const landItems = box2.filter(m => m.dest === land);
      if (!landItems.length) return;
      const dc2 = DC[land] || { bg: '#f1f5f9', c: '#334155' };

      html += `<div style="margin-bottom:16px">
        <div class="op-dest-label" style="color:${dc2.c};border-color:${dc2.bg};margin-bottom:8px">
          ${land} <span style="font-size:10px;opacity:0.6">(${landItems.length})</span>
        </div>`;

      // Sort: aktiv > duenn > fehlt, dann nach tour tags overlap
      [...landItems].sort((a,b) => {
        const destOrder = { aktiv: 0, duenn: 1, fehlt: 2 };
        const da = destOrder[a.destStatus] ?? 1;
        const db = destOrder[b.destStatus] ?? 1;
        if (da !== db) return da - db;
        return b.relevanz - a.relevanz;
      }).forEach(m => {
        const nv = NV[m.niveau] || NV.midrange;
        const destColor = m.destStatus === 'aktiv' ? '#166534' : m.destStatus === 'duenn' ? '#854d0e' : '#94a3b8';
        const destBg    = m.destStatus === 'aktiv' ? '#dcfce7' : m.destStatus === 'duenn' ? '#fef9c3' : '#f1f5f9';
        const destLabel = m.destStatus === 'aktiv' ? 'Aktiv-Dest.' : m.destStatus === 'duenn' ? 'Dünn besetzt' : 'Fehlt';

        html += `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:11px 14px;margin-bottom:7px;opacity:${m.destStatus==='fehlt'?'0.65':'1'}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
            <div>
              <div style="font-size:12px;font-weight:600;color:#0f172a">${e(m.tourName)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:1px">${e(m.opName)}${m.tage ? ' · ' + m.tage + 'T' : ''}</div>
            </div>
            <div style="display:flex;gap:4px;align-items:center;flex-shrink:0">
              <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${destBg};color:${destColor};font-weight:600">${destLabel}</span>
              <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${nv.bg};color:${nv.c};font-weight:600">${nv.l}</span>
            </div>
          </div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Tour-Orte:</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:7px">
            ${[...m.tourOrte].slice(0,6).map(o =>
              `<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:#f8fafc;color:#475569">${o}</span>`
            ).join('')}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <a href="${e(m.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none">Tour ansehen ↗</a>
            <button class="btn btn-xs btn-ghost" onclick="openTour('${m.opId}','${m.tourId}');setPage('netzwerk',document.querySelectorAll('.nav-tab')[1])">Details</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    });
  }
  html += `</div></div>`;
  el.innerHTML = html;
}

// ── BUILD MATCH DATA ──────────────────────────────────────
function buildMatchData(k) {
  const kOrte = getVeranstalterOrte(k);
  const aktiv  = (k.destinationen?.aktiv  || []).map(d => d.toLowerCase());
  const duenn  = (k.destinationen?.duenn  || []).map(d => d.toLowerCase());
  const fehlt  = (k.destinationen?.fehlt  || []).map(d => d.toLowerCase());

  // Fokus-Reisen: alle Tour-Namen + URLs des Veranstalters zum Vergleich
  const fokusNamen = new Set();
  Object.values(k.fokusReisen || {}).forEach(reisen => {
    reisen.forEach(r => fokusNamen.add((r.name || '').toLowerCase().trim()));
  });

  const box1 = [];
  const box2 = [];
  const seenBox1 = new Set();
  const seenBox2 = new Set();

  ops.forEach(op => {
    op.touren.forEach(tour => {
      const tourOrte = getTourOrte(tour);
      const gemeinsam = new Set([...tourOrte].filter(o => kOrte.has(o)));

      // BOX 1: ≥ 3 gemeinsame Orte
      if (gemeinsam.size >= 3 && !seenBox1.has(tour.id)) {
        seenBox1.add(tour.id);
        box1.push({
          opId: op.id,
          opName: op.name,
          tourId: tour.id,
          tourName: tour.name,
          dest: tour.dest,
          niveau: tour.niveau,
          url: tour.url,
          tage: tour.tage || 0,
          gemeinsam,
        });
      }

      // BOX 2: Tour-Dest ist beim Veranstalter aktiv/dünn,
      // aber diese Tour fehlt in seinen Fokus-Reisen
      // und hat NICHT ≥3 gemeinsame Orte (sonst wäre sie in Box 1)
      if (!seenBox2.has(tour.id)) {
        const destL = (tour.dest || '').toLowerCase();
        const inFokus = [...fokusNamen].some(fn => {
          // Tour-Name kommt in Fokus-Reisen vor?
          const tl = tour.name.toLowerCase();
          return fn.includes(tl.slice(0,15)) || tl.includes(fn.slice(0,15));
        });

        // Destination status
        let destStatus = null;
        if (aktiv.some(d => destL.includes(d) || d.includes(destL))) destStatus = 'aktiv';
        else if (duenn.some(d => destL.includes(d) || d.includes(destL))) destStatus = 'duenn';
        else if (fehlt.some(d => destL.includes(d) || d.includes(destL))) destStatus = 'fehlt';

        if (destStatus && !inFokus) {
          seenBox2.add(tour.id);
          // Relevanz: wie viele Tour-Tags matchen Pitch-Tags des Veranstalters?
          const allPitchTags = new Set((k.pitchIdeen||[]).flatMap(p => p.tags||[]));
          const relevanz = (tour.tags||[]).filter(t => allPitchTags.has(t)).length;

          box2.push({
            opId: op.id,
            opName: op.name,
            tourId: tour.id,
            tourName: tour.name,
            dest: tour.dest,
            niveau: tour.niveau,
            url: tour.url,
            tage: tour.tage || 0,
            destStatus,
            relevanz,
            tourOrte,
          });
        }
      }
    });
  });

  return { box1, box2 };
}
