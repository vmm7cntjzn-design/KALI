/* ═══════════════════════════════════════════════════════════
   KALI — netzwerk.js
   Netzwerk-Tab: Operator-Liste, Tour-Liste, Tour-Detail
═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────
let aktuellerOp  = null;
let aktiveTourId = null;

// ── MAIN RENDER ───────────────────────────────────────────
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
  const destOpts = FOCUS.map(d =>
    `<option value="${d}"${window.fDest===d?' selected':''}>${d}</option>`
  ).join('');
  const nvOpts = ['luxury','midrange','adventure'].map(n =>
    `<option value="${n}"${window.fNiveau===n?' selected':''}>${NV[n].l}</option>`
  ).join('');
  const tagOpts = allTourTags().map(t =>
    `<option value="${t}"${window.fTag===t?' selected':''}>${t}</option>`
  ).join('');
  const active = [window.fDest, window.fNiveau, window.fTag, window.fSuche].filter(Boolean).length;

  document.getElementById('filter-bar-wrap').innerHTML = `<div class="filter-bar">
    <label>Land</label>
    <select onchange="window.fDest=this.value;renderN()"><option value="">Alle</option>${destOpts}</select>
    <label>Kategorie</label>
    <select onchange="window.fNiveau=this.value;renderN()"><option value="">Alle</option>${nvOpts}</select>
    <label>Tag</label>
    <select onchange="window.fTag=this.value;renderN()"><option value="">Alle</option>${tagOpts}</select>
    <input type="text" placeholder="Stichwort…" value="${e(window.fSuche)}"
      oninput="window.fSuche=this.value;renderN()" style="margin-left:auto">
    ${active > 0
      ? `<span class="fclear" onclick="window.fDest='';window.fNiveau='';window.fTag='';window.fSuche='';renderN()">✕ Filter (${active})</span>`
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
        return `<div class="tour-row" onclick="openTour('${op.id}','${t.id}')">
          ${t.img
            ? `<img class="tour-thumb" src="${e(t.img)}" alt="" onerror="this.style.display='none'">`
            : '<div class="tour-thumb"></div>'}
          <div class="tour-info">
            <div class="tour-name-text">${e(t.name)}</div>
            <div class="tour-meta">
              ${t.tage} Tage ·
              <span class="badge" style="background:${nv.bg};color:${nv.c}">${nv.l}</span> ·
              <a href="${e(t.url)}" target="_blank" onclick="event.stopPropagation()"
                style="color:#2563eb;font-size:10px">Website ↗</a>
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

    <div class="card">
      <div class="clabel">Stärken & Nischen</div>
      ${staerken}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9">
        <div style="font-size:11px;font-weight:600;color:#d97706;margin-bottom:4px">Preisniveau:</div>
        <input class="ifield" style="font-size:12px;width:100%"
          value="${e(op.preisniveau || '')}" placeholder="z.B. USD 400–1.200 p.P./Tag"
          onchange="updOp('${op.id}','preisniveau',this.value);save()">
      </div>
      <div class="add-row">
        <input class="ifield" id="ns-${op.id}" placeholder="Neue Stärke…" style="width:160px"
          onkeydown="if(event.key==='Enter'){pushHistory();addStaerke('${op.id}')}">
        <button class="btn btn-ghost btn-sm" onclick="pushHistory();addStaerke('${op.id}')">+</button>
      </div>
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
  const itinHtml = (t.itinerary || []).length
    ? `<div class="card">
        <div class="clabel">Reiseverlauf (${t.itinerary.length} Tage)</div>
        <div style="overflow-x:auto">
          <table class="itin-table">
            <thead><tr>
              <th style="width:28px">#</th>
              <th>Programm</th>
              <th style="min-width:140px">Hotel / Lodge</th>
            </tr></thead>
            <tbody>
              ${(t.itinerary || []).map((day, i) => {
                const tm    = day.match(/Day\s+\d+[:\-–]\s*([^.\n]{3,100})/);
                const title = tm ? tm[1].trim() : `Tag ${i + 1}`;
                const body  = day.replace(/^Day\s+\d+[:\-–]\s*[^.\n]{0,100}\.?\s*/, '').trim();
                const hotel = (t.hotels || [])[i] || extractHotel(day);
                return `<tr>
                  <td style="color:#94a3b8;font-weight:700;font-size:11px;vertical-align:top;padding-top:10px">${i + 1}</td>
                  <td>
                    <div style="font-weight:600;color:#0f172a;margin-bottom:4px;font-size:12px">${e(title)}</div>
                    ${body ? `<div style="color:#475569;font-size:11px;line-height:1.7">${e(body)}</div>` : ''}
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
          Reiseverlauf noch nicht geladen — <strong>python baobab_fetch.py</strong> ausführen, dann ↻ Aktualisieren
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
  const incHtml = inc.length
    ? `<div class="card">
        <div class="inc-header" style="color:#166534;background:#f0fdf4">✓ Inklusive</div>
        ${inc.map(x => `<div class="inc-item"><span style="color:#16a34a;flex-shrink:0;margin-top:1px">•</span>${e(x)}</div>`).join('')}
      </div>`
    : '';

  // Matched pitches → link to Veranstalter
  const matchedPitches = [];
  kunden.forEach(k => {
    (k.pitchIdeen || []).forEach(p => {
      if (findMatches(p.tags || []).some(m => m.tourId === t.id)) {
        matchedPitches.push({ kId: k.id, kunde: k.name, pitch: p.text });
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
    <button class="back-btn" onclick="aktiveTourId=null;renderN()">← Zurück zu ${e(op.name)}</button>

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
          <div class="clabel" style="color:#166534">Diese Tour matcht zu:</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
            ${[...new Map(matchedPitches.map(mp => [mp.kId, mp])).values()].map(mp =>
              `<span style="cursor:pointer;font-weight:600;color:#2563eb;font-size:13px;text-decoration:underline"
                onclick="goToVPitch('${mp.kId}')">${e(mp.kunde)}</span>`
            ).join('')}
          </div>
        </div>`
      : ''}

    <details style="margin-top:12px">
      <summary style="font-size:12px;color:#64748b;cursor:pointer;padding:6px 0">Tour bearbeiten ▸</summary>
      <div class="card" style="margin-top:8px">
        <div class="g2" style="margin-bottom:8px">
          <div><label class="clabel">NAME</label><input class="ifield" value="${e(t.name)}" onchange="updTour('${op.id}','${t.id}','name',this.value)"></div>
          <div><label class="clabel">BILD-URL</label><input class="ifield" value="${e(t.img||'')}" placeholder="https://…" onchange="updTour('${op.id}','${t.id}','img',this.value)"></div>
        </div>
        <div style="margin-bottom:7px">
          <label class="clabel">TAGS</label>
          ${tags}
          <div class="add-row">
            <input class="ifield" id="tt-${t.id}" placeholder="Tag+" style="width:130px"
              onkeydown="if(event.key==='Enter'){pushHistory();addTourTag('${op.id}','${t.id}')}">
            <button class="btn btn-ghost btn-sm" onclick="pushHistory();addTourTag('${op.id}','${t.id}')">+</button>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="pushHistory();save();renderN()">Speichern</button>
        <button class="btn btn-danger btn-sm" style="margin-left:6px"
          onclick="pushHistory();delTour('${op.id}','${t.id}');aktiveTourId=null;">Löschen</button>
      </div>
    </details>

    <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="printTourPDF('${op.id}','${t.id}')">📄 PDF drucken</button>
      <button class="btn btn-ghost" onclick="openPDFEditor('${op.id}','${t.id}')">✏ PDF bearbeiten & erstellen</button>
      <span style="font-size:11px;color:#94a3b8">White-Label PDF mit Bearbeitungsfenster</span>
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
  // Store data for pdf_editor.html
  const payload = JSON.stringify({ op: { name: op.name, url: op.url, beschreibung: op.beschreibung }, tour: t });
  localStorage.setItem('kali_pdf_payload', payload);
  window.open('pdf_editor.html', '_blank', 'width=900,height=750');
}

function printTourPDF(opId, tourId) {
  const op = ops.find(o => o.id === opId);
  const t  = op?.touren.find(x => x.id === tourId);
  if (!t) return;

  const nv       = NV[t.niveau]  || NV.midrange;
  const dc2      = DC[t.dest]    || { bg: '#f1f5f9', c: '#334155' };
  const priceRng = calcPriceRange(t.prices);

  const itinRows = (t.itinerary || []).map((day, i) => {
    const tm    = day.match(/Day\s+\d+[:\-–]\s*([^.\n]{3,100})/);
    const title = tm ? tm[1].trim() : `Tag ${i + 1}`;
    const body  = day.replace(/^Day\s+\d+[:\-–]\s*[^.\n]{0,100}\.?\s*/, '').trim();
    const hotel = (t.hotels || [])[i] || extractHotel(day);
    return `<tr>
      <td style="width:24px;color:#94a3b8;font-weight:700;font-size:11px;padding:8px 6px;vertical-align:top">${i + 1}</td>
      <td style="padding:8px 6px;vertical-align:top">
        <div style="font-weight:600;font-size:12px;margin-bottom:3px">${e(title)}</div>
        ${body ? `<div style="font-size:11px;color:#475569;line-height:1.6">${e(body)}</div>` : ''}
      </td>
      <td style="padding:8px 6px;vertical-align:top;font-size:11px;color:#334155">${hotel || '—'}</td>
    </tr>`;
  }).join('');

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:system-ui,sans-serif;color:#0f172a;padding:32px;max-width:920px;margin:0 auto;}
    @media print{body{padding:16px;}@page{margin:1.5cm;}}
    .hero{width:100%;height:200px;object-fit:cover;border-radius:8px;margin-bottom:16px;display:block;}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin-right:6px;}
    h1{font-size:22px;font-weight:700;margin-bottom:8px;letter-spacing:-0.02em;}
    .sec{margin-top:18px;}
    .sec-title{font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th{text-align:left;padding:6px;background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;}
    tr{border-bottom:1px solid #f1f5f9;}
    .hl{display:flex;gap:7px;padding:5px 0;border-bottom:1px solid #f8fafc;font-size:12px;}
    .inc-h{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:5px 10px;border-radius:5px;margin-bottom:6px;}
    .inc-item{font-size:12px;padding:3px 10px;display:flex;gap:6px;}
    .op-box{background:#f0fdf4;border-radius:8px;padding:12px;margin-top:18px;}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;}
  </style></head><body>
  ${t.img ? `<img class="hero" src="${e(t.img)}" onerror="this.style.display='none'">` : ''}
  <h1>${e(t.name)}</h1>
  <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;align-items:center">
    <span class="badge" style="background:${dc2.bg};color:${dc2.c}">${t.dest}</span>
    <span class="badge" style="background:${nv.bg};color:${nv.c}">${nv.l}</span>
    <span style="font-size:12px;color:#64748b">${t.tage} Tage · <strong>${e(op.name)}</strong></span>
  </div>
  ${t.desc ? `<p style="font-size:13px;color:#475569;line-height:1.7;margin-top:8px">${e(t.desc)}</p>` : ''}

  ${priceRng ? `<div class="sec"><div class="sec-title">Preise</div>
    <div style="font-size:20px;font-weight:700">${priceRng.display} <span style="font-size:11px;font-weight:400;color:#94a3b8">p.P.</span></div>
    <div style="font-size:10px;color:#94a3b8;margin-top:4px">Richtpreise · <a href="${e(t.url)}">${e(t.url)}</a></div>
  </div>` : ''}

  ${(t.highlights||[]).length ? `<div class="sec"><div class="sec-title">Highlights</div>
    ${(t.highlights||[]).map(h=>`<div class="hl"><span style="color:#16a34a">✓</span>${e(h)}</div>`).join('')}
  </div>` : ''}

  ${itinRows ? `<div class="sec"><div class="sec-title">Reiseverlauf</div>
    <table><thead><tr><th>#</th><th>Programm</th><th>Hotel / Lodge</th></tr></thead>
    <tbody>${itinRows}</tbody></table>
  </div>` : ''}

  ${(t.included||[]).length ? `<div class="sec">
    <div class="inc-h" style="color:#166534;background:#f0fdf4">✓ Inklusive</div>
    ${(t.included||[]).map(x=>`<div class="inc-item"><span style="color:#16a34a">•</span>${e(x)}</div>`).join('')}
  </div>` : ''}

  <!-- not_included removed per user request -->

  <div class="op-box">
    <div style="font-weight:700;color:#166534;margin-bottom:4px">${e(op.name)}</div>
    <div style="font-size:12px;color:#475569">${e(op.beschreibung||'')}</div>
    <div style="font-size:11px;margin-top:4px"><a href="${e(op.url)}" style="color:#2563eb">${e(op.url)}</a></div>
  </div>

  <div class="footer">
    <span></span>
    <span>${new Date().toLocaleDateString('de-DE')}</span>
  </div>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`);
  w.document.close();
}

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
