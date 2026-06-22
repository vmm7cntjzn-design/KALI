/* ═══════════════════════════════════════════════════════════
   KALI — netzwerk.js
   Netzwerk-Tab: Operator-Liste, Tour-Liste, Tour-Detail
═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────
let aktuellerOp  = null;
let aktiveTourId = null;

// ── MAIN RENDER ───────────────────────────────────────────

let _renderNTimer = null;
function debounceRenderN() {
  clearTimeout(_renderNTimer);
  _renderNTimer = setTimeout(() => {
    const input = document.getElementById('tour-search-input');
    const val = input ? input.value : window.fSuche;
    const pos = input ? input.selectionStart : 0;
    renderN();
    // Restore focus and cursor position after re-render
    const newInput = document.getElementById('tour-search-input');
    if (newInput) {
      newInput.focus();
      try { newInput.setSelectionRange(pos, pos); } catch(e) {}
    }
  }, 0);
}

function renderN() {
  // Init first operator
  if (!aktuellerOp && ops.length) aktuellerOp = ops[0].id;

  // Sidebar
  document.getElementById('sb-top').innerHTML =
    `<div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;padding:2px 2px 8px">Partner</div>`;

  document.getElementById('sidebar-list').innerHTML = ops.map(op => {
    const isActive  = op.id === aktuellerOp;
    const activeTour = isActive && aktiveTourId
      ? op.touren.find(t => t.id === aktiveTourId)
      : null;
    return `<div class="karte${isActive ? ' on' : ''}" onclick="selOp('${op.id}')">
      <div class="karte-name">${e(op.name)}</div>
      <div class="karte-sub" style="white-space:normal;line-height:1.4">${e(op.land)}</div>
      <div class="karte-bottom">
        <span class="badge" style="background:#f0fdf4;color:#166534">${op.touren.length} Touren</span>
      </div>
      ${activeTour
        ? `<div style="margin-top:5px;font-size:10px;color:#2563eb;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">▶ ${e(activeTour.name.slice(0, 32))}…</div>`
        : ''}
    </div>`;
  }).join('');

  renderFilterBarN();

  if (aktiveTourId) { renderTourDetail(); return; }
  renderOpDetail();
}

// ── FILTER BAR ────────────────────────────────────────────
function renderFilterBarN() {
  const op = ops.find(o => o.id === aktuellerOp);
  const backBtn = aktiveTourId && op
    ? `<button class="back-btn" onclick="aktiveTourId=null;renderN()" style="margin:0;flex-shrink:0">← Zurück zu ${e(op.name)}</button>`
    : '';
  const active = [window.fSuche].filter(Boolean).length;
  document.getElementById('filter-bar-wrap').innerHTML = `<div class="filter-bar">
    ${backBtn}
    <input type="text" placeholder="Touren durchsuchen…" value="${e(window.fSuche)}"
      oninput="window.fSuche=this.value;debounceRenderN()" style="margin-left:auto;width:220px" id="tour-search-input">
    ${active > 0
      ? `<span class="fclear" onclick="window.fSuche='';renderN()">✕</span>`
      : ''}
  </div>`;
}

// ── OPERATOR DETAIL ───────────────────────────────────────
function renderOpDetail() {
  const op = ops.find(o => o.id === aktuellerOp);
  const el = document.getElementById('detail-area');
  if (!op) { el.innerHTML = ''; return; }

  // Filter tours
  let tours = op.touren;
  if (window.fDest)   tours = tours.filter(t => t.dest === window.fDest);
  if (window.fNiveau) tours = tours.filter(t => t.niveau === window.fNiveau);
  if (window.fTag)    tours = tours.filter(t => (t.tags || []).includes(window.fTag));
  if (window.fSuche) {
    const s = window.fSuche.toLowerCase();
    tours = tours.filter(t =>
      t.name.toLowerCase().includes(s) ||
      (t.desc || '').toLowerCase().includes(s) ||
      (t.itinerary || []).some(d => d.toLowerCase().includes(s))
    );
  }

  // Grouped by destination
  const grouped = {};
  tours.forEach(t => {
    if (!grouped[t.dest]) grouped[t.dest] = [];
    grouped[t.dest].push(t);
  });

  const toursHtml = FOCUS.filter(d => grouped[d]).map(dest => {
    const dc2 = DC[dest] || { bg: '#f1f5f9', c: '#475569' };
    return `<div style="margin-bottom:14px">
      <div class="op-dest-label" style="color:${dc2.c};border-color:${dc2.bg}">
        ${dest} <span style="font-size:10px;opacity:0.7">(${grouped[dest].length})</span>
      </div>
      ${grouped[dest].map(t => {
        const nv = NV[t.niveau] || NV.midrange;
        // Check if this tour matches any Veranstalter pitches
        // Find ALL veranstalter whose pitches match this tour (min 2 common tags)
        const tourMatches = kunden.flatMap(k =>
          (k.pitchIdeen||[]).filter(p => {
            const overlap = (p.tags||[]).filter(x => (t.tags||[]).includes(x));
            return overlap.length >= 2;
          }).map(p => ({kId:k.id, kunde:k.name, keyArgs:(p.tags||[]).filter(x=>(t.tags||[]).includes(x))}))
        );
        // Deduplicate by Veranstalter name, keep max 3 strongest
        const uniqueMatches = tourMatches
          .filter((m,i,a)=>a.findIndex(x=>x.kunde===m.kunde)===i)
          .sort((a,b)=>b.keyArgs.length-a.keyArgs.length)
          .slice(0,3);
        return `<div class="tour-row" onclick="openTour('${op.id}','${t.id}')">
          ${t.img
            ? `<img class="tour-thumb" src="${e(t.img)}" alt="" onerror="this.style.display='none'">`
            : '<div class="tour-thumb"></div>'}
          <div class="tour-info">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <div class="tour-name-text" style="flex:1">${e(t.name)}</div>
              ${uniqueMatches.map(m=>`<span style="font-size:9px;padding:1px 5px;border-radius:10px;background:#f0fdf4;color:#166534;font-weight:600;white-space:nowrap;flex-shrink:0">✓ ${e(m.kunde)}</span>`).join('')}
            </div>
            <div class="tour-meta">
              ${t.tage} Tage ·
              <span class="badge" style="background:${nv.bg};color:${nv.c}">${nv.l}</span> ·
              <a href="${e(t.url)}" target="_blank" onclick="event.stopPropagation()"
                style="color:#2563eb;font-size:10px">Website ↗</a> ·
              <span style="position:relative;display:inline-block">
                <button onclick="event.stopPropagation();toggleNetzPraesiDropdown('${op.id}-${t.id}')"
                  style="font-size:9px;padding:2px 7px;border-radius:5px;border:1px solid #d1d5db;background:#f8fafc;color:#64748b;cursor:pointer;font-family:inherit">
                  ＋ Zur Präsi ▾
                </button>
                <div id="praesi-drop-${op.id}-${t.id}" style="display:none;position:absolute;top:100%;left:0;z-index:100;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);min-width:200px;padding:4px">
                  ${kunden.map(k=>{
                    const already = (k.praesentation||[]).some(p=>p.tourId===t.id);
                    return `<button onclick="event.stopPropagation();addNetzPraesi('${op.id}','${t.id}','${e(t.name)}','${e(op.name)}','${e(t.dest||'')}','${e(t.url||'')}','${k.id}')"
                      style="display:block;width:100%;text-align:left;padding:6px 10px;background:${already?'#f0fdf4':'#fff'};color:${already?'#166534':'#0f172a'};border:none;cursor:pointer;font-size:11px;border-radius:5px;font-family:inherit">
                      ${already?'✓ ':''}${e(k.name.split(' ').slice(0,2).join(' '))}
                    </button>`;
                  }).join('')}
                </div>
              </span>
            </div>
            <div class="tour-tags-row">
              ${(t.tags || []).slice(0, 6).map(tg => `<span class="tour-tag">${tg}</span>`).join('')}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  // Matched pitches
  const matchedHtml = kunden.map(k => {
    const matched = (k.pitchIdeen || []).filter(p =>
      findMatches(p.tags || []).some(m => m.opId === op.id)
    );
    if (!matched.length) return '';
    return `<div style="margin-bottom:8px">
      <div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:3px">${e(k.name)}</div>
      ${matched.map(p => {
        const ms = findMatches(p.tags || []).filter(m => m.opId === op.id);
        return ms.map(m => `<div style="font-size:11px;color:#166534;padding:2px 0;line-height:1.4;display:flex;gap:6px;align-items:center">
          → ${e(p.text)}
          <a href="${e(m.url)}" target="_blank" style="font-size:10px;color:#2563eb;white-space:nowrap;text-decoration:none">Tour ↗</a>
          <button class="btn btn-xs btn-ghost" onclick="openTour('${op.id}','${m.tourId}')">Ansehen</button>
        </div>`).join('');
      }).join('')}
    </div>`;
  }).join('');

  const staerken = (op.staerken || []).map((s, i) =>
    `<span class="tag-pill">${e(s)}<span class="tag-del" onclick="pushHistory();delOpStaerke('${op.id}',${i})">×</span></span>`
  ).join('');

  const filterInfo = tours.length < op.touren.length
    ? `<div style="font-size:11px;color:#f59e0b;margin-bottom:8px">Filter aktiv: ${tours.length}/${op.touren.length} Touren</div>`
    : '';

  el.innerHTML = `<div class="detail-inner">
    <div class="dh">
      <input class="ifield" style="font-size:18px;font-weight:700;letter-spacing:-0.02em;margin-bottom:6px"
        value="${e(op.name)}"
        onchange="pushHistory();updOp('${op.id}','name',this.value);save();renderN()">
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <input class="ifield" style="width:200px;font-size:12px" value="${e(op.land)}"
          placeholder="Region" onchange="updOp('${op.id}','land',this.value);save()">
        <a href="${e(op.url)}" target="_blank" style="font-size:11px;color:#2563eb">${e(op.url)} ↗</a>
      </div>
      <textarea rows="2" style="margin-top:8px;font-size:12px"
        onchange="updOp('${op.id}','beschreibung',this.value);save()">${e(op.beschreibung || '')}</textarea>
    </div>



    ${filterInfo}

    <div class="card">
      ${toursHtml || '<div style="color:#cbd5e1;font-size:13px">Keine Touren für diesen Filter.</div>'}
      <hr class="section-sep">
      <div class="clabel">Neue Tour</div>
      <div style="display:grid;grid-template-columns:1fr 80px 50px 100px auto;gap:6px;align-items:center">
        <input class="ifield" id="nt-name" placeholder="Tourname">
        <input class="ifield" id="nt-dest" placeholder="Dest." list="dest-dl">
        <datalist id="dest-dl">${FOCUS.map(d => `<option value="${d}">`).join('')}</datalist>
        <input class="ifield" id="nt-tage" type="number" placeholder="T" min="1">
        <select class="ifield" id="nt-niv" style="font-size:11px">
          <option value="luxury">Luxury</option>
          <option value="midrange" selected>Mid-Range</option>
          <option value="adventure">Adventure</option>
        </select>
        <button class="btn btn-primary" onclick="pushHistory();addTour('${op.id}')">+</button>
      </div>
    </div>

    <div class="card" style="background:#f0fdf4;border-color:#bbf7d0">
      <div class="clabel" style="color:#166534">Matched zu Veranstalter-Pitches</div>
      ${matchedHtml || '<div style="font-size:12px;color:#94a3b8">Noch keine Matches.</div>'}
    </div>
  </div>`;
}

// ── TOUR DETAIL ───────────────────────────────────────────
function openTour(opId, tourId) {
  aktuellerOp  = opId;
  aktiveTourId = tourId;
  renderN();
}

function renderTourDetail() {
  const op = ops.find(o => o.id === aktuellerOp);
  const t  = op?.touren.find(x => x.id === aktiveTourId);
  const el = document.getElementById('detail-area');
  if (!t) { el.innerHTML = ''; return; }

  const nv  = NV[t.niveau]  || NV.midrange;
  const dc2 = DC[t.dest]    || { bg: '#f1f5f9', c: '#334155' };

  // Gallery — robust deduplication, filter flags/icons/symbols
  function normUrl(u) {
    try { const x = new URL(u); x.search = ''; x.hash = ''; return x.toString(); }
    catch { return u.split('?')[0]; }
  }
  const seenUrls = new Set();
  const allImgs  = [t.img, ...(t.gallery || [])].filter(x => {
    if (!x || x.length < 10) return false;
    // Filter non-photo content
    if (/flag|icon|logo|avatar|badge|spinner|arrow|check|star|dot|symbol|button|thumb|placeholder/i.test(x)) return false;
    // Must look like a real photo
    if (!/\.(jpg|jpeg|png|webp)/i.test(x)) return false;
    // Filter tiny images (likely icons) by checking URL patterns
    if (/[_-](16|24|32|48|64|128|icon|thumb|sm|xs)[_.-]/i.test(x)) return false;
    const n = normUrl(x);
    if (seenUrls.has(n)) return false;
    seenUrls.add(n);
    return true;
  });

  const galleryHtml = allImgs.length > 1
    ? `<div class="card">
        <div class="clabel">Bilder (${allImgs.length})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:7px">
          ${allImgs.slice(0, 8).map(src =>
            `<img src="${e(src)}" style="width:100%;height:85px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0" onerror="this.style.display='none'">`
          ).join('')}
        </div>
      </div>`
    : '';

  // Highlights
  const hlHtml = (t.highlights || []).length
    ? `<div class="card">
        <div class="clabel">Highlights</div>
        ${(t.highlights || []).map(h =>
          `<div style="display:flex;gap:7px;padding:5px 0;border-bottom:1px solid #f8fafc;font-size:13px;color:#334155">
            <span style="color:#16a34a;flex-shrink:0">✓</span>${e(h)}
          </div>`
        ).join('')}
      </div>`
    : '';

  // Itinerary
  // Review stop: keyword filter + max 300 words per day
  const REVIEW_STOP_RE = /(?:rated|rating|\d+\.?\d*\/5|\d+\s*stars?|★|⭐|✦|☆|review|testimonial|what our|our clients|our guests|enquire now|book now|request a quote|get in touch|related tours|similar tours|you may also|customer feedback|tripadvisor|highly recommend|would recommend|great experience|amazing tour|wonderful trip|\d+ out of \d+)/i;
  function stripReviews(text) {
    // Step 1: keyword stop
    const lines = text.split('\n');
    const clean = [];
    for (const line of lines) {
      if (REVIEW_STOP_RE.test(line.trim())) break;
      clean.push(line);
    }
    let result = clean.join('\n').trim();
    // Step 2: flat text keyword stop
    const flat = result.replace(/\n/g,' ');
    const m = flat.search(REVIEW_STOP_RE);
    if (m > 50) result = flat.slice(0, m).trim();
    // Step 3: max 300 words (hard cap to cut reviews that slip through)
    const words = result.split(/\s+/);
    if (words.length > 300) result = words.slice(0, 300).join(' ') + '…';
    return result;
  }

  const itinHtml = (t.itinerary || []).length
    ? `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="clabel" style="margin:0">Reiseverlauf (${t.itinerary.length} Tage)</div>
          <div style="display:flex;gap:5px">
            <button onclick="copyItinerary('${t.id}')"
              style="font-size:10px;padding:3px 8px;border-radius:5px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;cursor:pointer;font-family:inherit"
              title="Reiseverlauf kopieren">
              📄 Kopieren
            </button>
            <button onclick="openTourPaste('${op.id}','${t.id}')"
              style="font-size:10px;padding:3px 8px;border-radius:5px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;cursor:pointer;font-family:inherit">
              📋 Aktualisieren
            </button>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="itin-table">
            <thead><tr>
              <th style="width:28px">#</th>
              <th>Programm</th>
              <th style="min-width:140px">Hotel / Lodge</th>
            </tr></thead>
            <tbody>
              ${(t.itinerary || []).map((day, i) => {
                const cleanDay = day.includes('::') ? day : stripReviews(day);
                // Use :: separator (title::body) set by parser, else fallback
                let title, body;
                if (cleanDay.includes('::')) {
                  const si = cleanDay.indexOf('::');
                  title = cleanDay.slice(0, si).trim();
                  body  = cleanDay.slice(si + 2).trim();
                } else {
                  title = cleanDay.split(':')[0].replace(/^Day\s+\d+[\s\-\u2013]*/i,'').trim() || ('Tag ' + (i+1));
                  body  = cleanDay.split(':').slice(1).join(':').trim();
                }
                const hotel = (t.hotels || [])[i] || extractHotel(cleanDay);
                return `<tr>
                  <td style="color:#94a3b8;font-weight:700;font-size:11px;vertical-align:top;padding-top:10px">${i + 1}</td>
                  <td style="vertical-align:top">
                    <div style="font-weight:600;color:#0f172a;margin-bottom:4px;font-size:12px">${e(title)}</div>
                    <textarea style="width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:5px;padding:4px 6px;line-height:1.5;font-family:inherit;resize:vertical;min-height:40px" rows="2"
                      onchange="updItinDay('${op.id}','${t.id}',${i},this.value)">${e(body)}</textarea>
                  </td>
                  <td style="vertical-align:top">
                    <input class="ifield" style="font-size:11px;min-width:130px" value="${e(hotel)}"
                      placeholder="Hotel / Lodge…"
                      onchange="updHotel('${op.id}','${t.id}',${i},this.value)">
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`
    : `<div class="card" style="border:1px dashed #e2e8f0;background:#f8fafc">
        <div style="font-size:12px;color:#94a3b8;text-align:center;padding:12px">
          Kein Reiseverlauf vorhanden.
          <div style="margin-top:8px">
            <button onclick="openTourPaste('${op.id}','${t.id}')"
              style="font-size:11px;padding:5px 12px;border-radius:6px;background:#2563eb;color:#fff;border:none;cursor:pointer;font-family:inherit">
              📋 Seiteninhalt einfügen
            </button>
          </div>
        </div>
      </div>`;

  // Prices
  const priceRange = calcPriceRange(t.prices);
  const priceHtml  = priceRange
    ? `<div class="card">
        <div class="clabel">Preise & Konditionen</div>
        <div style="font-size:20px;font-weight:700;color:#0f172a">
          ${priceRange.display} <span style="font-size:11px;font-weight:400;color:#94a3b8">p.P.</span>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:5px">
          Richtpreise · Zuschläge ausgeblendet ·
          <a href="${e(t.url)}" target="_blank" style="color:#2563eb">Aktuell prüfen ↗</a>
        </div>
      </div>`
    : '';

  // Included only (not_included hidden per user preference)
  const inc     = t.included || [];
  const exc     = t.excluded  || [];
  const incHtml = inc.length
    ? `<div class="card">
        <div class="inc-header" style="color:#166534;background:#f0fdf4">✓ Inklusive</div>
        ${inc.map(x => `<div class="inc-item"><span style="color:#16a34a;flex-shrink:0;margin-top:1px">•</span>${e(x)}</div>`).join('')}
      </div>`
    : '';

  // Matched pitches → show all matching Veranstalter with key arguments
  const matchedPitches = [];
  kunden.forEach(k => {
    (k.pitchIdeen || []).forEach(p => {
      const overlap = (p.tags||[]).filter(x => (t.tags||[]).includes(x));
      if (overlap.length >= 2) {
        matchedPitches.push({ kId: k.id, kunde: k.name, pitch: p.text, keyArgs: overlap });
      }
    });
  });

  const scraped = t.scraped_at
    ? `<div style="font-size:10px;color:#94a3b8;margin-top:4px">Inhalte aktualisiert: ${new Date(t.scraped_at).toLocaleDateString('de-DE')}</div>`
    : `<div style="font-size:10px;color:#f59e0b;margin-top:4px">⚠ Noch nicht via Fetch geladen</div>`;

  const tags = (t.tags || []).map((tg, i) =>
    `<span class="tag-pill" style="font-size:11px">${e(tg)}<span class="tag-del" onclick="pushHistory();delTourTag('${op.id}','${t.id}',${i})">×</span></span>`
  ).join('');

  el.innerHTML = `<div class="detail-inner">
    ${t.img
      ? `<img class="tour-detail-hero" src="${e(t.img)}" alt="${e(t.name)}" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:100px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;font-size:12px;color:#94a3b8;border:1px dashed #e2e8f0">Bild nach Fetch verfügbar</div>`}

    <div style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;margin-bottom:6px">${e(t.name)}</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:6px">
      <span class="badge" style="background:${dc2.bg};color:${dc2.c};font-size:11px">${t.dest}</span>
      <span class="badge" style="background:${nv.bg};color:${nv.c};font-size:11px">${nv.l}</span>
      <span style="font-size:12px;color:#64748b">${t.tage} Tage</span>
      <span style="font-size:12px;color:#64748b">von: <strong>${e(op.name)}</strong></span>
      <a href="${e(t.url)}" target="_blank" style="font-size:12px;color:#2563eb;font-weight:500">Zur Website ↗</a>
    </div>
    ${scraped}

    ${t.desc ? `<div class="card" style="margin-top:10px"><div class="clabel">Beschreibung</div><div style="font-size:13px;color:#334155;line-height:1.7">${e(t.desc)}</div></div>` : ''}

    ${galleryHtml}${hlHtml}${itinHtml}${priceHtml}${incHtml}

    ${matchedPitches.length
      ? `<div class="card" style="background:#f0fdf4;border-color:#bbf7d0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div class="clabel" style="color:#166534;margin:0">Diese Tour matcht zu:</div>
          </div>
          <div style="font-size:11px;color:#64748b;margin-bottom:8px;padding:5px 8px;background:#f0fdf4;border-radius:6px;line-height:1.5">
            Die grünen Tags zeigen die <strong>gemeinsamen Schlagwörter</strong> zwischen deiner Pitch-Idee und dieser Tour — das sind deine <strong>Key-Argumente</strong> im Gespräch.
          </div>
          ${matchedPitches.map(mp =>
            `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #dcfce7">
              <span style="cursor:pointer;font-weight:600;color:#2563eb;font-size:12px;text-decoration:underline;flex-shrink:0;padding-top:3px"
                onclick="goToVPitch('${mp.kId}')">${e(mp.kunde)}</span>
              <div style="display:flex;flex-wrap:wrap;gap:3px;flex:1">
                ${(mp.keyArgs||[]).map(ta=>`<span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:500">${e(ta)}</span>`).join('')}
              </div>
            </div>`
          ).join('')}
        </div>`
      : ''}


    <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;gap:8px;align-items:center">
      <button class="btn btn-primary" onclick="openPDFEditor('${op.id}','${t.id}')">🖨 PDF erstellen</button>
    </div>
  </div>`;
}

// ── NAVIGATE FROM TOUR MATCH TO VERANSTALTER ───────────────
function goToVPitch(kId) {
  aktuelleId   = kId;
  aktiveTourId = null;
  vAnsicht     = 'detail';
  vTab         = 'pitchlücken';
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.nav-tab')[0].classList.add('on');
  currentPage = 'veranstalter';
  render();
}

// ── PDF FUNCTIONS ─────────────────────────────────────────
function openPDFEditor(opId, tourId) {
  const op = ops.find(o => o.id === opId);
  const t  = op?.touren.find(x => x.id === tourId);
  if (!t) return;

  const RSTOP = /(?:rated|rating|\d+\.?\d*\/5|\d+\s*stars?|★|⭐|review|testimonial|what our|our clients|enquire now|book now|request a quote|related tours|tripadvisor|highly recommend|would recommend)/i;
  function stripRev(text) {
    const lines = text.split('\n'), clean = [];
    for (const l of lines) { if (RSTOP.test(l.trim())) break; clean.push(l); }
    let r = clean.join('\n').trim();
    const m = r.search(RSTOP);
    if (m > 50) r = r.slice(0, m).trim();
    return r;
  }
  function pRange(prices) {
    const nums=(prices||[]).map(p=>{const m=p.match(/\d{3,6}/g);return m?m.map(x=>parseInt(x)).filter(n=>n>=300&&n<=30000):[];}).flat();
    if(!nums.length)return'';
    const s=[...nums].sort((a,b)=>a-b),med=s[Math.floor(s.length/2)];
    const f=nums.filter(n=>n>=med*0.6&&n<=med*1.4);
    if(!f.length)return'';
    const cur=(prices||[]).join(' ').includes('$')?'USD':'EUR';
    const lo=Math.min(...f).toLocaleString('de-DE'),hi=Math.max(...f).toLocaleString('de-DE');
    return lo===hi?`${lo} ${cur}`:`${lo} – ${hi} ${cur}`;
  }

  const itinData=(t.itinerary||[]).map((day,i)=>{
    const cd=stripRev(day);
    const tm=cd.match(/Day\s+\d+[:\-–]\s*([^.\n]{3,100})/);
    return {title:tm?tm[1].trim():`Tag ${i+1}`,body:cd.replace(/^Day\s+\d+[:\-–]\s*[^.\n]{0,100}\.?\s*/,'').trim(),hotel:(t.hotels||[])[i]||extractHotel(cd)};
  });

  const DC2=DC[t.dest]||{bg:'#f1f5f9',c:'#334155'};
  const NV2=NV[t.niveau]||NV.midrange;
  window._pdfState={op,t,itinData:JSON.parse(JSON.stringify(itinData)),hlData:JSON.parse(JSON.stringify(t.highlights||[])),showSecs:{hl:true,itin:true,price:true,inc:true,op:false},DC2,NV2,priceStr:pRange(t.prices)};

  document.getElementById('pdf-editor-content').innerHTML=buildPDFPanel(t,op);
  document.getElementById('pdf-overlay').style.display='block';
  renderPDFItinEditor();
  pdfUpdatePreview();
}

function buildPDFPanel(t,op){
  const s=window._pdfState;
  const imgs=[t.img,...(t.gallery||[])].filter((x,i,a)=>x&&a.indexOf(x)===i&&/\.(jpg|jpeg|png|webp)/i.test(x)).slice(0,6);
  return `<div style="overflow-y:auto;padding:20px;border-right:1px solid #e2e8f0;background:#fff;font-family:system-ui,sans-serif">
    <div style="font-size:12px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">Branding</div>
    <div style="margin-bottom:8px;padding:6px 10px;background:#f8fafc;border-radius:6px;font-size:12px;color:#64748b">Absender: <strong style="color:#0f172a">KALI</strong></div>
    <input type="hidden" id="pe-name" value="KALI">
    ${['pe-sub:Untertitel:Ostafrika-Spezialist','pe-contact:Kontakt:www.beispiel.de'].map(x=>{const[id,lbl,ph]=x.split(':');return`<div style="margin-bottom:8px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:3px">${lbl}</label><input id="${id}" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit" placeholder="${ph}" oninput="pdfUpdatePreview()"></div>`;}).join('')}
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">Kopfbild</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${imgs.map(src=>`<img src="${e(src)}" style="width:68px;height:50px;object-fit:cover;border-radius:5px;cursor:pointer;border:2px solid transparent" onclick="document.getElementById('pe-hero').value='${src}';this.parentElement.querySelectorAll('img').forEach(im=>im.style.borderColor='transparent');this.style.borderColor='#0f172a';pdfUpdatePreview()" onerror="this.style.display='none'">`).join('')}</div>
    <input id="pe-hero" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit;margin-bottom:6px" placeholder="Bild-URL…" value="${e(t.img||'')}" oninput="pdfUpdatePreview()">
    <div style="margin-bottom:4px"><div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Horizontal ←→</div><input type="range" min="0" max="100" value="50" id="pe-img-x" style="width:100%;accent-color:#0f172a" oninput="pdfUpdatePreview()"></div>
    <div style="margin-bottom:12px"><div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Vertikal ↑↓</div><input type="range" min="0" max="100" value="50" id="pe-img-y" style="width:100%;accent-color:#0f172a" oninput="pdfUpdatePreview()"></div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">Tour-Inhalte</div>
    <div style="margin-bottom:8px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:3px">Titel</label><input id="pe-title" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit" value="${e(t.name)}" oninput="pdfUpdatePreview()"></div>
    <div style="margin-bottom:8px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:3px">Beschreibung</label><textarea id="pe-desc" rows="4" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit;resize:vertical" oninput="pdfUpdatePreview()">${e(t.desc||'')}</textarea></div>
    <div style="margin-bottom:12px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:3px">Preisspanne</label><input id="pe-price" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit" value="${e(s.priceStr)}" oninput="pdfUpdatePreview()"></div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">Sektionen</div>
    ${['hl:Highlights','itin:Reiseverlauf','price:Preise','inc:Inklusive','op:Partner-Info'].map(x=>{const[k,l]=x.split(':');return`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f8fafc"><span style="font-size:12px;color:#334155">${l}</span><span id="pe-tog-${k}" onclick="pdfToggle('${k}')" style="cursor:pointer;font-size:16px;user-select:none;color:#0f172a">◉</span></div>`;}).join('')}
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">Reiseverlauf bearbeiten</div>
    <div id="pe-itin-editor"></div>
  </div>
  <div style="overflow-y:auto;padding:24px;background:#f8fafc">
    <div id="pe-preview" style="background:#fff;max-width:680px;margin:0 auto;padding:36px;border-radius:8px;box-shadow:0 1px 8px rgba(0,0,0,0.08)"></div>
  </div>`;
}

function closePDFEditor(){document.getElementById('pdf-overlay').style.display='none';}

function pdfToggle(sec){
  window._pdfState.showSecs[sec]=!window._pdfState.showSecs[sec];
  const el=document.getElementById('pe-tog-'+sec);
  if(el){el.textContent=window._pdfState.showSecs[sec]?'◉':'◎';el.style.color=window._pdfState.showSecs[sec]?'#0f172a':'#94a3b8';}
  pdfUpdatePreview();
}

function renderPDFItinEditor(){
  const s=window._pdfState, el=document.getElementById('pe-itin-editor');
  if(!el)return;
  el.innerHTML=s.itinData.map((d,i)=>`<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;background:#fafafa">
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <span style="font-size:11px;font-weight:700;color:#94a3b8;width:16px;flex-shrink:0">${i+1}</span>
      <input style="flex:1;font-size:12px;font-weight:600;padding:4px 8px;border:1px solid #e2e8f0;border-radius:5px;font-family:inherit" value="${e(d.title)}" oninput="_pdfState.itinData[${i}].title=this.value;pdfUpdatePreview()">
      <button onclick="_pdfState.itinData.splice(${i},1);renderPDFItinEditor();pdfUpdatePreview()" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
    </div>
    <textarea style="width:100%;font-size:11px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:5px;line-height:1.5;font-family:inherit;resize:vertical;min-height:65px" rows="3" oninput="_pdfState.itinData[${i}].body=this.value;pdfUpdatePreview()">${e(d.body)}</textarea>
    <div style="display:flex;align-items:center;gap:5px;margin-top:4px"><span style="font-size:10px;color:#94a3b8;flex-shrink:0">Hotel:</span>
      <input style="flex:1;font-size:11px;padding:3px 7px;border:1px solid #e2e8f0;border-radius:5px;font-family:inherit" value="${e(d.hotel)}" oninput="_pdfState.itinData[${i}].hotel=this.value;pdfUpdatePreview()"></div>
  </div>`).join('')+`<button onclick="_pdfState.itinData.push({title:'',body:'',hotel:''});renderPDFItinEditor();pdfUpdatePreview()" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px dashed #e2e8f0;background:#f8fafc;color:#64748b;cursor:pointer;width:100%;margin-top:4px">+ Tag hinzufügen</button>`;
}

function pdfUpdatePreview(){
  const s=window._pdfState; if(!s)return;
  const bName=document.getElementById('pe-name')?.value||'', bSub=document.getElementById('pe-sub')?.value||'', bContact=document.getElementById('pe-contact')?.value||'';
  const heroSrc=document.getElementById('pe-hero')?.value||s.t.img||'', tTitle=document.getElementById('pe-title')?.value||s.t.name||'';
  const tDesc=document.getElementById('pe-desc')?.value||'', tPrice=document.getElementById('pe-price')?.value||'';
  let html='';
  if(bName)html+=`<div style="font-weight:600;font-size:14px;margin-bottom:2px">${e(bName)}</div>`;
  if(bSub)html+=`<div style="font-size:11px;color:#64748b;margin-bottom:12px">${e(bSub)}</div>`;
  const imgX=document.getElementById('pe-img-x')?.value||'50', imgY=document.getElementById('pe-img-y')?.value||'50';
  if(heroSrc)html+=`<img src="${e(heroSrc)}" style="width:100%;height:220px;object-fit:cover;object-position:${imgX}% ${imgY}%;border-radius:8px;margin-bottom:14px;display:block" onerror="this.style.display='none'">`;
  html+=`<div style="font-size:20px;font-weight:700;margin-bottom:7px">${e(tTitle)}</div>`;
  html+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${s.DC2.bg};color:${s.DC2.c}">${e(s.t.dest||'')}</span><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${s.NV2.bg};color:${s.NV2.c}">${s.NV2.l}</span><span style="font-size:12px;color:#64748b">${s.t.tage||''} Tage</span></div>`;
  if(tDesc)html+=`<p style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:12px">${e(tDesc).replace(/\n/g,'<br>')}</p>`;
  if(s.showSecs.price&&tPrice)html+=`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:5px">Preise & Konditionen</div><div style="font-size:18px;font-weight:700">${e(tPrice)} <span style="font-size:11px;font-weight:400;color:#94a3b8">p.P.</span></div></div>`;
  if(s.showSecs.hl&&s.hlData.filter(h=>h.trim()).length)html+=`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:5px">Highlights</div>${s.hlData.filter(h=>h.trim()).map(h=>`<div style="display:flex;gap:6px;padding:4px 0;border-bottom:1px solid #f8fafc;font-size:12px"><span style="color:#16a34a">✓</span>${e(h)}</div>`).join('')}</div>`;
  if(s.showSecs.itin&&s.itinData.length)html+=`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:5px">Reiseverlauf</div><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr><th style="text-align:left;padding:4px 5px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b">#</th><th style="text-align:left;padding:4px 5px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b">Programm</th><th style="text-align:left;padding:4px 5px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b">Hotel</th></tr></thead><tbody>${s.itinData.map((d,i)=>`<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:5px;color:#94a3b8;font-weight:700;vertical-align:top">${i+1}</td><td style="padding:5px;vertical-align:top"><div style="font-weight:600;margin-bottom:2px">${e(d.title||`Tag ${i+1}`)}</div>${d.body?`<div style="font-size:10px;color:#475569;line-height:1.5">${e(d.body).replace(/\n/g,'<br>')}</div>`:''}</td><td style="padding:5px;font-size:10px;color:#475569;vertical-align:top">${e(d.hotel||'')}</td></tr>`).join('')}</tbody></table></div>`;
  if(s.showSecs.inc&&(s.t.included||[]).length)html+=`<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 9px;border-radius:5px;background:#f0fdf4;color:#166534;margin-bottom:5px">✓ Inklusive</div>${(s.t.included||[]).map(x=>`<div style="display:flex;gap:5px;padding:3px 9px;font-size:11px;color:#334155"><span style="color:#16a34a">•</span>${e(x)}</div>`).join('')}</div>`;
  if(s.showSecs.inc&&(s.t.excluded||[]).length)html+=`<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 9px;border-radius:5px;background:#fef2f2;color:#dc2626;margin-bottom:5px">✕ Nicht enthalten</div>${(s.t.excluded||[]).map(x=>`<div style="display:flex;gap:5px;padding:3px 9px;font-size:11px;color:#64748b"><span style="color:#dc2626">•</span>${e(x)}</div>`).join("")}</div>`;
  if(s.showSecs.op)html+=`<div style="background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:12px"><div style="font-weight:700;margin-bottom:2px">${e(s.op.name)}</div>${s.op.url?`<a href="${e(s.op.url)}" style="font-size:11px;color:#2563eb">${e(s.op.url)}</a>`:''}</div>`;
  html+=`<div style="margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between"><span>${e(bName)}${bContact?' · '+e(bContact):''}</span><span>${new Date().toLocaleDateString('de-DE')}</span></div>`;
  const prev=document.getElementById('pe-preview');if(prev)prev.innerHTML=html;
}

function translateDE(text, isEN) {
  if (!isEN || !text) return text;
  const map = [
    // Days / structure
    ['Übernachtung im','Overnight at'],['Übernachtung in','Overnight in'],['Übernachtung','Overnight'],
    ['Ankunft in','Arrival in'],['Ankunft','Arrival'],['Abreise','Departure'],
    ['Abflug','Departure flight'],['Rückflug','Return flight'],['Flug nach','Flight to'],
    ['Transfer zum','Transfer to the'],['Transfer nach','Transfer to'],['Transfer','Transfer'],
    // Food & accommodation
    ['Frühstück','Breakfast'],['Mittagessen','Lunch'],['Abendessen','Dinner'],
    ['Vollpension','Full Board'],['Halbpension','Half Board'],['Unterkunft','Accommodation'],
    ['Nächte','nights'],['Nacht','night'],
    // Safari / nature
    ['Gorilla-Trekking','Gorilla Trekking'],['Gorilla Trekking','Gorilla Trekking'],
    ['Nationalpark','National Park'],['Naturschutzgebiet','Nature Reserve'],
    ['Wildreservat','Game Reserve'],['Savannenlandschaft','Savannah landscape'],
    ['Pirschfahrt','Game drive'],['Pirschfahrten','Game drives'],
    ['Große Tierwanderung','Great Migration'],
    // Activities
    ['Wanderung','Hike'],['Wanderungen','Hikes'],['Besichtigung','Visit'],
    ['Besuch','Visit'],['Ausflug','Excursion'],['Ausflüge','Excursions'],
    ['Bootsfahrt','Boat trip'],['Kulturbesuch','Cultural visit'],
    // Time / direction
    ['Morgen','Morning'],['Nachmittag','Afternoon'],['Abend','Evening'],
    ['heute','today'],['weiter','onward'],['zurück','back'],
    ['Anschließend','Afterwards'],['Danach','After that'],['Zunächst','First'],
    ['Im Anschluss','Following this'],
    // Days
    ['Tag 1','Day 1'],['Tag 2','Day 2'],['Tag 3','Day 3'],['Tag 4','Day 4'],
    ['Tag 5','Day 5'],['Tag 6','Day 6'],['Tag 7','Day 7'],['Tag 8','Day 8'],
    ['Tag 9','Day 9'],['Tag 10','Day 10'],['Tag 11','Day 11'],['Tag 12','Day 12'],
    ['Tage','days'],['Tag','Day'],
  ];
  let t = text;
  map.forEach(([de, en]) => {
    t = t.replace(new RegExp(de.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g'), en);
  });
  return t;
}

function printPDF(lang){
  const s=window._pdfState; if(!s)return;
  const isEN=lang==='en';
  const bName=document.getElementById('pe-name')?.value||'', bSub=document.getElementById('pe-sub')?.value||'', bContact=document.getElementById('pe-contact')?.value||'';
  const heroSrc=document.getElementById('pe-hero')?.value||s.t.img||'', tTitle=document.getElementById('pe-title')?.value||s.t.name||'';
  const tDesc=document.getElementById('pe-desc')?.value||'', tPrice=document.getElementById('pe-price')?.value||'';
  const L={days:isEN?'days':'Tage',price:isEN?'Prices & Conditions':'Preise & Konditionen',perPerson:isEN?'p.p.':'p.P.',priceNote:isEN?'Guide prices · Supplements excluded':'Richtpreise · Zuschläge ausgeblendet',highlights:isEN?'Highlights':'Highlights',itinerary:isEN?'Itinerary':'Reiseverlauf',program:isEN?'Programme':'Programm',hotel:isEN?'Hotel / Lodge':'Hotel / Lodge',included:isEN?'Included':'Inklusive'};
  let body='';
  if(bName)body+=`<div style="font-weight:600;font-size:14px;margin-bottom:2px">${e(bName)}</div>`;
  if(bSub)body+=`<div style="font-size:11px;color:#64748b;margin-bottom:14px">${e(bSub)}</div>`;
  const pImgX=document.getElementById('pe-img-x')?.value||'50', pImgY=document.getElementById('pe-img-y')?.value||'50';
  if(heroSrc)body+=`<img style="width:100%;height:220px;object-fit:cover;object-position:${pImgX}% ${pImgY}%;border-radius:8px;margin-bottom:16px;display:block" src="${e(heroSrc)}" onerror="this.style.display='none'">`;
  body+=`<h1 style="font-size:22px;font-weight:700;margin-bottom:8px">${e(tTitle)}</h1>`;
  body+=`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${s.DC2.bg};color:${s.DC2.c}">${e(s.t.dest||'')}</span><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${s.NV2.bg};color:${s.NV2.c}">${s.NV2.l}</span><span style="font-size:12px;color:#64748b">${s.t.tage||''} ${L.days}</span></div>`;
  if(tDesc)body+=`<p style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:14px">${e(translateDE(tDesc,isEN)).replace(/\n/g,'<br>')}</p>`;
  if(s.showSecs.price&&tPrice)body+=`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:6px">${L.price}</div><div style="font-size:20px;font-weight:700">${e(tPrice)} <span style="font-size:11px;font-weight:400;color:#94a3b8">${L.perPerson}</span></div><div style="font-size:10px;color:#94a3b8;margin-top:4px">${L.priceNote}</div></div>`;
  if(s.showSecs.hl&&s.hlData.filter(h=>h.trim()).length)body+=`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:6px">${L.highlights}</div>${s.hlData.filter(h=>h.trim()).map(h=>`<div style="display:flex;gap:7px;padding:5px 0;border-bottom:1px solid #f8fafc;font-size:13px"><span style="color:#16a34a">✓</span>${e(h)}</div>`).join('')}</div>`;
  if(s.showSecs.itin&&s.itinData.length)body+=`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:6px">${L.itinerary}</div><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:5px 6px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:10px">#</th><th style="text-align:left;padding:5px 6px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:10px">${L.program}</th><th style="text-align:left;padding:5px 6px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:10px">${L.hotel}</th></tr></thead><tbody>${s.itinData.map((d,i)=>`<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:7px 6px;color:#94a3b8;font-weight:700;font-size:11px;vertical-align:top">${i+1}</td><td style="padding:7px 6px;vertical-align:top"><div style="font-weight:600;margin-bottom:2px">${e(translateDE(d.title||(isEN?'Day ':'Tag ')+(i+1),isEN))}</div>${d.body?`<div style="font-size:11px;color:#475569;line-height:1.6">${e(translateDE(d.body,isEN)).replace(/\n/g,'<br>')}</div>`:''}</td><td style="padding:7px 6px;font-size:11px;color:#475569;vertical-align:top">${e(d.hotel||'')}</td></tr>`).join('')}</tbody></table></div>`;
  if(s.showSecs.inc&&(s.t.included||[]).length)body+=`<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:5px 10px;border-radius:5px;background:#f0fdf4;color:#166534;margin-bottom:6px">✓ ${L.included}</div>${(s.t.included||[]).map(x=>`<div style="display:flex;gap:6px;padding:3px 10px;font-size:12px;color:#334155"><span style="color:#16a34a">•</span>${e(x)}</div>`).join('')}</div>`;
  if(s.showSecs.op)body+=`<div style="background:#f0fdf4;border-radius:8px;padding:12px;margin-bottom:14px"><div style="font-weight:700;margin-bottom:3px">${e(s.op.name)}</div>${s.op.url?`<a href="${e(s.op.url)}" style="font-size:11px;color:#2563eb">${e(s.op.url)}</a>`:''}</div>`;
  body+=`<div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between"><span>${e(bName)}${bContact?' · '+e(bContact):''}</span><span>${new Date().toLocaleDateString(isEN?'en-GB':'de-DE')}</span></div>`;
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><title>${e(tTitle)}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;color:#0f172a;padding:32px;max-width:900px;margin:0 auto;}@media print{body{padding:16px;}@page{margin:1.5cm;}}</style></head><body>${body}<script>window.onload=()=>window.print();<\/script></body></html>`);
  w.document.close();
}

function printTourPDF(opId,tourId){openPDFEditor(opId,tourId);}

// ── NETZWERK ACTIONS ──────────────────────────────────────
function selOp(id) { aktuellerOp = id; aktiveTourId = null; renderN(); }
function updOp(id, field, val) { ops = ops.map(o => o.id === id ? { ...o, [field]: val } : o); }
function addStaerke(id) {
  const el = document.getElementById('ns-' + id);
  if (!el) return;
  const v = el.value.trim(); if (!v) return;
  ops = ops.map(o => o.id === id ? { ...o, staerken: [...(o.staerken||[]), v] } : o);
  save(); renderN();
}
function delOpStaerke(id, i) {
  ops = ops.map(o => o.id === id ? { ...o, staerken: (o.staerken||[]).filter((_,j)=>j!==i) } : o);
  save(); renderN();
}
function updTour(opId, tid, field, val) {
  ops = ops.map(o => o.id === opId
    ? { ...o, touren: o.touren.map(t => t.id === tid ? { ...t, [field]: val } : t) }
    : o);
}
function updItinDay(opId, tid, idx, val) {
  ops = ops.map(o => {
    if (o.id !== opId) return o;
    return { ...o, touren: o.touren.map(t => {
      if (t.id !== tid) return t;
      const itin = [...(t.itinerary || [])];
      while (itin.length <= idx) itin.push('');
      // Preserve the Day X prefix if it exists
      const prefix = itin[idx].match(/^Day\s+\d+[:\-–]\s*[^.\n]{3,100}\.?\s*/);
      itin[idx] = prefix ? prefix[0] + val : val;
      return { ...t, itinerary: itin };
    })};
  });
  save();
}
function updHotel(opId, tid, idx, val) {
  ops = ops.map(o => {
    if (o.id !== opId) return o;
    return { ...o, touren: o.touren.map(t => {
      if (t.id !== tid) return t;
      const h = [...(t.hotels || [])];
      while (h.length <= idx) h.push('');
      h[idx] = val;
      return { ...t, hotels: h };
    })};
  });
  save();
}
function addTour(opId) {
  const n  = document.getElementById('nt-name')?.value?.trim(); if (!n) return;
  const d  = document.getElementById('nt-dest')?.value?.trim() || '';
  const tg = parseInt(document.getElementById('nt-tage')?.value) || 7;
  const nv = document.getElementById('nt-niv')?.value || 'midrange';
  ops = ops.map(o => o.id === opId
    ? { ...o, touren: [...o.touren, normalTour({ id: uid(), name: n, dest: d, tage: tg, niveau: nv, url: '', img: '', desc: '', tags: [] })] }
    : o);
  save(); renderN();
}
function delTour(opId, tid) {
  ops = ops.map(o => o.id === opId ? { ...o, touren: o.touren.filter(t => t.id !== tid) } : o);
  aktiveTourId = null;
  save(); renderN();
}
function addTourTag(opId, tid) {
  const el = document.getElementById('tt-' + tid); if (!el) return;
  const v = el.value.trim(); if (!v) return;
  ops = ops.map(o => o.id === opId
    ? { ...o, touren: o.touren.map(t => t.id === tid ? { ...t, tags: [...(t.tags||[]), v] } : t) }
    : o);
  save(); renderN();
}
function delTourTag(opId, tid, i) {
  ops = ops.map(o => o.id === opId
    ? { ...o, touren: o.touren.map(t => t.id === tid ? { ...t, tags: (t.tags||[]).filter((_,j)=>j!==i) } : t) }
    : o);
  save(); renderN();
}
function zeigeNeuOp() {
  const n = prompt('Name des neuen Operators:');
  if (!n?.trim()) return;
  pushHistory();
  const neu = { id: uid(), name: n.trim(), land: '', url: '', preisniveau: '', beschreibung: '', staerken: [], touren: [] };
  ops.push(neu);
  aktuellerOp = neu.id;
  save(); renderN();
}

// ── NETZWERK PRÄSI HELPERS ───────────────────────────────

function copyItinerary(tourId) {
  const op = ops.find(o => o.touren.some(t => t.id === tourId));
  if (!op) return;
  const tour = op.touren.find(t => t.id === tourId);
  if (!tour || !tour.itinerary) return;

  const text = tour.itinerary.map((day, i) => {
    if (day.includes('::')) {
      const sep = day.indexOf('::');
      const title = day.slice(0, sep).trim();
      const body  = day.slice(sep + 2).trim();
      return `Tag ${i+1}: ${title}\n${body}`;
    }
    return `Tag ${i+1}: ${day}`;
  }).join('\n\n');

  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ Reiseverlauf kopiert');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✓ Reiseverlauf kopiert');
  });
}

function toggleNetzPraesiDropdown(id) {
  const el = document.getElementById('praesi-drop-' + id);
  if (!el) return;
  // Close all other dropdowns first
  document.querySelectorAll('[id^="praesi-drop-"]').forEach(d => {
    if (d.id !== 'praesi-drop-' + id) d.style.display = 'none';
  });
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function addNetzPraesi(opId, tourId, tourName, opName, dest, url, kundeId) {
  kunden = kunden.map(k => {
    if (k.id !== kundeId) return k;
    const list = k.praesentation || [];
    if (list.some(p => p.tourId === tourId)) return k; // already added
    return { ...k, praesentation: [...list, { tourId, tourName, opName, dest, url, addedAt: new Date().toISOString() }] };
  });
  save();
  // Close dropdown
  const el = document.getElementById('praesi-drop-' + opId + '-' + tourId);
  if (el) el.style.display = 'none';
  // Brief feedback
  const btn = el?.previousElementSibling;
  if (btn) { btn.textContent = '✓ Hinzugefügt'; setTimeout(() => { btn.textContent = '＋ Zur Präsi ▾'; }, 1500); }
}

// Close dropdowns on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('[id^="praesi-drop-"]').forEach(d => d.style.display = 'none');
});

// ── TOUR CONTENT PASTE ───────────────────────────────────
function openTourPaste(opId, tourId) {
  let modal = document.getElementById('tour-paste-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'tour-paste-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div style="background:#fff;border-radius:12px;padding:24px;width:800px;max-width:96vw;height:90vh;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
      <div style="font-size:14px;font-weight:700">Seiteninhalt einfügen</div>
      <button onclick="closeTourPaste()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8">✕</button>
    </div>
    <div style="font-size:11px;color:#64748b;flex-shrink:0">
      Tour-Seite öffnen → <b>Strg+A</b> → <b>Strg+C</b> → hier <b>Strg+V</b> → Vorschau → Speichern
    </div>
    <textarea id="tour-paste-area" rows="10" style="font-size:11px;resize:none;flex:0 0 auto;line-height:1.5;border:1px solid #e2e8f0;border-radius:6px;padding:8px;font-family:monospace;height:220px" placeholder="Hier einfügen (Strg+V)…" data-op="${opId}" data-tour="${tourId}"></textarea>
    <div id="tour-paste-preview" style="display:none;flex:1 1 0;overflow-y:auto;background:#f8fafc;border-radius:8px;padding:12px;font-size:11px;border:1px solid #e2e8f0;min-height:0"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;padding-top:4px">
      <button class="btn btn-ghost" onclick="closeTourPaste()">Abbrechen</button>
      <button class="btn btn-ghost" onclick="previewTourPaste()">🔍 Vorschau</button>
      <button class="btn btn-primary" id="tour-paste-save" style="display:none" onclick="saveTourPaste()">✓ Speichern</button>
    </div>
  </div>`;
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('tour-paste-area')?.focus(), 50);
}

function closeTourPaste() {
  const m = document.getElementById('tour-paste-modal');
  if (m) m.style.display = 'none';
}

let _parsedTourData = null;

function previewTourPaste() {
  const area = document.getElementById('tour-paste-area');
  const raw = area?.value || '';
  _parsedTourData = parseTourContent(raw);
  const preview = document.getElementById('tour-paste-preview');
  const saveBtn = document.getElementById('tour-paste-save');
  if (!preview) return;

  const { itinerary, highlights, included, excluded, desc } = _parsedTourData;

  if (!itinerary.length && !included.length) {
    preview.style.display = 'block';
    preview.innerHTML = '<div style="color:#dc2626;padding:8px">Keine Daten erkannt. Bitte kompletten Seiteninhalt einfügen (Strg+A → Strg+C).</div>';
    if (saveBtn) saveBtn.style.display = 'none';
    return;
  }

  const section = (title, items, color) => items.length ? `
    <div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">${title} (${items.length})</div>
      ${items.map((item,i) => `<div style="padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:11px"><b style="color:#64748b">${i+1}.</b> ${e(item.slice(0,120))}${item.length>120?'…':''}</div>`).join('')}
    </div>` : '';

  preview.style.display = 'block';
  preview.innerHTML = `
    <div style="font-weight:700;color:#166534;margin-bottom:10px">
      ✓ ${itinerary.length} Reisetage · ${included.length} Inklusivleistungen · ${excluded.length} Exklusivleistungen
    </div>
    ${desc ? `<div style="margin-bottom:10px;padding:8px;background:#fffbeb;border-radius:6px;font-size:11px;line-height:1.5"><b>Beschreibung:</b> ${e(desc.slice(0,200))}${desc.length>200?'…':''}</div>` : ''}
    ${section('Reiseverlauf', itinerary, '#166534')}
    ${section('Inklusive', included, '#0369a1')}
    ${section('Exklusive (nicht enthalten)', excluded, '#dc2626')}
  `;
  if (saveBtn) saveBtn.style.display = '';
}

function saveTourPaste() {
  if (!_parsedTourData) return;
  const area = document.getElementById('tour-paste-area');
  const opId = area?.dataset.op;
  const tourId = area?.dataset.tour;

  ops = ops.map(op => {
    if (op.id !== opId) return op;
    return { ...op, touren: op.touren.map(t => {
      if (t.id !== tourId) return t;
      const updated = { ...t };
      if (_parsedTourData.itinerary.length) updated.itinerary = _parsedTourData.itinerary;
      if (_parsedTourData.desc) updated.desc = _parsedTourData.desc;
      if (_parsedTourData.included.length) updated.included = _parsedTourData.included;
      if (_parsedTourData.excluded.length) updated.excluded = _parsedTourData.excluded;
      if (_parsedTourData.highlights.length) updated.highlights = _parsedTourData.highlights;
      return updated;
    })};
  });
  save();
  closeTourPaste();
  renderN();
}

function parseTourContent(raw) {
  const allLines = raw.split('\n').map(l => l.trim());
  const isNav = l => /^(home|destination|safari|about|sustainab|holiday|gallery|blog|contact|archives?|categories|follow|©|\+254|email:|www\.|http|designed|copyright|marco polo|travel guide|co-author)/i.test(l) || l.length < 3;

  // ── DESCRIPTION: longest sentence before "What's Included" ──
  const inclIdx = allLines.findIndex(l => /what.s included|what is included/i.test(l));
  const descLines = (inclIdx > 0 ? allLines.slice(0, inclIdx) : allLines.slice(0, 30))
    .filter(l => l.length > 80 && !isNav(l) && !/^(day\s+\d|morning|afternoon|evening|overnight|tour map|highlight)/i.test(l));
  const desc = descLines.sort((a,b) => b.length - a.length)[0] || '';

  // ── INCLUDED ──
  const included = [];
  const exclIdx = allLines.findIndex(l => /what.s excluded|what is excluded|not included|exclusion/i.test(l));
  if (inclIdx >= 0) {
    const inclEnd = exclIdx > inclIdx ? exclIdx : allLines.findIndex((l,i) => i > inclIdx && /^Day\s+\d/i.test(l));
    const inclLines = allLines.slice(inclIdx+1, inclEnd > 0 ? inclEnd : inclIdx+20);
    inclLines.forEach(l => { if (l.length > 5 && !isNav(l) && !/^what/i.test(l)) included.push(l.replace(/^[-•*]\s*/, '')); });
  }

  // ── EXCLUDED (same format as included) ──
  const excluded = [];
  if (exclIdx >= 0) {
    const exclEnd = allLines.findIndex((l,i) => i > exclIdx && /^(Day\s+\d|we are|start itinerary|community)/i.test(l));
    const exclLines = allLines.slice(exclIdx+1, exclEnd > 0 ? exclEnd : exclIdx+15);
    exclLines.forEach(l => { if (l.length > 5 && !isNav(l) && !/^what/i.test(l)) excluded.push(l.replace(/^[-•*]\s*/, '')); });
  }

  // ── ITINERARY: Day X blocks ──
  const itinerary = [];
  // Only match single-day entries — skip "Day X & Y", "Day X to Y", "Days X to Y"
  const dayMarkers = [];
  allLines.forEach((l, i) => {
    if (/^Days?\s+\d+\s*(?:&|to|and|\u2013|-)\s*\d+/i.test(l)) return;
    if (/^Day\s+\d+\s*(?:$|[:\s\u2013\-])/i.test(l)) dayMarkers.push(i);
  });

  dayMarkers.forEach((startIdx, di) => {
    const endIdx = di + 1 < dayMarkers.length ? dayMarkers[di+1] : Math.min(startIdx + 30, allLines.length);
    const rawLine = allLines[startIdx];

    // Format A: "Day 1 – Title: Full body text" all on one line
    const inlineMatch = rawLine.match(/^Day\s+\d+\s*[\u2013\-]+\s*(.+?):\s*(.+)$/);
    if (inlineMatch) {
      const title = inlineMatch[1].trim();
      const body  = inlineMatch[2].trim();
      itinerary.push(title + ':: ' + body);
      return;
    }

    // Format B: "Day 1" on its own line, title on next line, body on subsequent lines
    let title = rawLine.replace(/^Day\s+\d+\s*[:\s\u2013\-]*/i, '').trim();
    const nextLines = allLines.slice(startIdx+1, endIdx).filter(l => l.length > 3 && !isNav(l));
    if (!title && nextLines.length) {
      title = nextLines[0];
      nextLines.shift();
    }
    // Body: join ALL non-nav lines (no filtering by sentence start)
    const body = nextLines
      .filter(l => l.length > 10)
      .map(l => l.replace(/^[-•*]\s*/, ''))
      .join(' ');

    itinerary.push((title || ('Tag ' + (di+1))).replace(/:+$/,'') + ':: ' + body);
  });

    // ── HIGHLIGHTS: pick 3 key experience phrases ──
  const highlights = allLines.filter(l =>
    l.length > 30 && l.length < 160 && !isNav(l) &&
    /safari|game|wildlife|bird|culture|gorilla|chimpanzee|flamingo|cycling|boat|trek|hike|migration|big five|landscape|unique/i.test(l) &&
    !/^(day|morning|afternoon|evening|overnight|meal|accommod|breakfast|lunch|dinner|pickup|transfer|arrive|depart|enjoy|after|before)/i.test(l)
  ).slice(0, 3);

  return { itinerary, included, excluded, highlights, desc };
}


