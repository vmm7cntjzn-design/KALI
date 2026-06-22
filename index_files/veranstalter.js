/* ═══════════════════════════════════════════════════════════
   KALI — veranstalter.js
   Veranstalter-Tab: Rendering + Actions
═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────
let aktuelleId  = null;
let vAnsicht    = 'detail'; // 'detail' | 'neu'
let vTab        = 'profil'; // 'profil' | 'pitchlücken' | 'gespraech'
let editNotiz   = false;
let editNext    = false;
let localRadar  = {};
let localScore  = {};

// Filter state (shared with netzwerk via window)
window.fDest   = '';
window.fNiveau = '';
window.fTag    = '';
window.fSuche  = '';

// ── MAIN RENDER ───────────────────────────────────────────
function renderV() {
  // Sidebar
  const suche = (document.getElementById('sb-vsearch') || { value: '' }).value || '';
  const liste = kunden.filter(k => !suche || k.name.toLowerCase().includes(suche.toLowerCase()));

  document.getElementById('sb-top').innerHTML =
    `<input class="sb-search" id="sb-vsearch" type="text" placeholder="Veranstalter suchen…" oninput="renderV()" value="${e(suche)}">`;

  document.getElementById('sidebar-list').innerHTML = liste.map(k => {
    const t  = totalScore(k.score || {});
    const st = STATUS[k.status] || STATUS.vorbereitet;
    return `<div class="karte${k.id === aktuelleId && vAnsicht !== 'neu' ? ' on' : ''}" onclick="selK('${k.id}')">
      <div class="karte-name">${e(k.name)}</div>
      <div class="karte-sub">${e(k.sitz)} · ${e(k.segment)}</div>
      <div class="karte-bottom">
        <span class="badge" style="background:${st.bg};color:${st.c}">${st.l}</span>
        <span style="font-size:15px;font-weight:700;color:${scoreColor(t)}">${t}<span style="font-size:10px;color:#94a3b8;font-weight:400">/10</span></span>
      </div>
    </div>`;
  }).join('');

  // No filter bar on Veranstalter main view (only on pitchlücken tab)
  document.getElementById('filter-bar-wrap').innerHTML = '';

  if (vAnsicht === 'neu') { renderNeuForm(); return; }
  renderVDetail();
}

// ── DETAIL ────────────────────────────────────────────────
function renderVDetail() {
  const k  = kunden.find(x => x.id === aktuelleId);
  const el = document.getElementById('detail-area');
  if (!k) {
    el.innerHTML = '<div class="leer"><div style="font-size:40px">←</div><div>Veranstalter auswählen</div></div>';
    return;
  }

  const tabs2 = [
    { id: 'profil',     l: 'Profil' },
    { id: 'pitchlücken',l: 'Pitch & Lücken' },
    { id: 'gespraech',  l: 'Gespräch' },
  ];
  const tabsHtml = `<div class="tabs">${tabs2.map(t =>
    `<button class="tab${vTab === t.id ? ' on' : ''}" onclick="swVTab('${t.id}')">${t.l}</button>`
  ).join('')}</div>`;

  const header = buildVHeader(k);
  let content  = '';

  if (vTab === 'profil')      content = buildProfilTab(k);
  if (vTab === 'pitchlücken') { renderFilterBarV(); content = buildPitchTab(k); }
  if (vTab === 'gespraech')   content = buildGespraechTab(k);

  el.innerHTML = `<div class="detail-inner">${tabsHtml}${header}${content}</div>`;
}

// ── CONTACT BOX (separate function to avoid nested backtick issues) ───────────
function buildContactBox(k) {
  const homepageLink = (k.homepage||k.website)
    ? '<a href="' + e(k.homepage||k.website) + '" target="_blank" style="color:#2563eb;font-size:16px;text-decoration:none;flex-shrink:0" title="Website öffnen">↗</a>'
    : '';
  const telLink = k.telefon
    ? '<a href="tel:' + e(k.telefon) + '" style="color:#2563eb;font-size:16px;text-decoration:none" title="Anrufen">📞</a>'
    : '';
  const emailLink = k.email
    ? '<a href="mailto:' + e(k.email) + '" style="color:#2563eb;font-size:14px;text-decoration:none" title="E-Mail">✉</a>'
    : '';
  const weitereKontakte = (k.kontakte && k.kontakte.length > 1)
    ? '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0"><div class="clabel" style="margin-bottom:6px">Weitere Ansprechpartner</div>'
      + k.kontakte.slice(1).map(function(kt) {
          return '<div style="display:flex;gap:10px;align-items:center;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px">'
            + '<div style="flex:1"><strong>' + e(kt.name) + '</strong> · ' + e(kt.position) + '</div>'
            + (kt.laender && kt.laender.length ? '<div style="font-size:10px;color:#64748b">' + kt.laender.join(', ') + '</div>' : '')
            + (kt.telefon && kt.telefon !== 'Über Website' ? '<a href="tel:' + e(kt.telefon) + '" style="color:#2563eb;font-size:11px">📞</a>' : '')
            + (kt.email ? '<a href="mailto:' + e(kt.email) + '" style="color:#2563eb;font-size:11px">✉</a>' : '')
            + '</div>';
        }).join('')
      + '</div>'
    : '';
  return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-top:8px">'
    + '<div class="clabel" style="margin-bottom:8px">Kontakt</div>'
    + '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">'
    + '<div><div style="font-size:10px;color:#64748b;margin-bottom:3px">Sitz</div>'
    + '<input class="ifield" style="font-size:12px" value="' + e(k.sitz||'') + '" placeholder="z.B. Berlin" onchange="updK(\'sitz\',this.value);save()"></div>'
    + '<div><div style="font-size:10px;color:#64748b;margin-bottom:3px">Homepage</div>'
    + '<div style="display:flex;align-items:center;gap:4px">'
    + '<input class="ifield" style="font-size:12px;flex:1" value="' + e(k.homepage||k.website||'') + '" placeholder="https://…" onchange="updK(\'homepage\',this.value);save()">'
    + homepageLink + '</div></div></div></div>'
    + '<div class="clabel" style="margin-bottom:8px">Ansprechpartner</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">'
    + '<div><div style="font-size:10px;color:#64748b;margin-bottom:3px">Name</div>'
    + '<input class="ifield" style="font-size:12px" value="' + e(k.ansprechpartner||'') + '" placeholder="Vor- & Nachname" onchange="updK(\'ansprechpartner\',this.value);save()"></div>'
    + '<div><div style="font-size:10px;color:#64748b;margin-bottom:3px">Position</div>'
    + '<input class="ifield" style="font-size:12px" value="' + e(k.position||'') + '" placeholder="z.B. Produktmanagerin Afrika" onchange="updK(\'position\',this.value);save()"></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
    + '<div><div style="font-size:10px;color:#64748b;margin-bottom:3px">Telefon</div>'
    + '<div style="display:flex;align-items:center;gap:4px">'
    + '<input class="ifield" style="font-size:12px;flex:1" value="' + e(k.telefon||'') + '" placeholder="+49 …" onchange="updK(\'telefon\',this.value);save()">'
    + telLink + '</div></div>'
    + '<div><div style="font-size:10px;color:#64748b;margin-bottom:3px">E-Mail</div>'
    + '<div style="display:flex;align-items:center;gap:4px">'
    + '<input class="ifield" style="font-size:12px;flex:1" value="' + e(k.email||'') + '" placeholder="vorname@veranstalter.de" onchange="updK(\'email\',this.value);save()">'
    + emailLink + '</div></div></div>'
    + weitereKontakte
    + '</div>';
}

// ── HEADER ────────────────────────────────────────────────
function buildVHeader(k) {
  return `<div class="dh">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div style="flex:1;min-width:0">
        <input class="ifield" style="font-size:18px;font-weight:700;letter-spacing:-0.02em;margin-bottom:8px"
          value="${e(k.name)}"
          onchange="pushHistory();updK('name',this.value);save();renderV()">
        <div class="g2" style="margin-bottom:8px">
          <div>
            <div class="clabel" style="margin-bottom:3px">Sitz</div>
            <input class="ifield" style="font-size:12px" value="${e(k.sitz)}" placeholder="z.B. Berlin"
              onchange="updK('sitz',this.value);save()">
          </div>
          <div>
            <div class="clabel" style="margin-bottom:3px">Segment</div>
            <input class="ifield" style="font-size:12px" value="${e(k.segment)}" placeholder="z.B. Ultra-Luxus"
              onchange="updK('segment',this.value);save()">
          </div>
        </div>
        ${vTab === 'profil' ? buildContactBox(k) : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:flex-start;flex-shrink:0">
        <select onchange="pushHistory();setStatus('${k.id}',this.value)"
          style="font-size:11px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;color:#334155;font-family:inherit">
          ${Object.entries(STATUS).map(([sv, s]) =>
            `<option value="${sv}"${k.status === sv ? ' selected' : ''}>${s.l}</option>`
          ).join('')}
        </select>
        <button class="btn btn-danger btn-sm" onclick="delK('${k.id}')">Löschen</button>
      </div>
    </div>
    <div style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <div class="clabel" style="margin:0">Kontextnotizen</div>
        <button id="recherche-btn" class="btn btn-ghost btn-sm" onclick="copyRecherchePrompt('${k.id}')">📋 Recherche-Prompt kopieren</button>
      </div>
      <textarea rows="3" style="font-size:12px" spellcheck="true" lang="de"
        onchange="updK('kontextNotizen',this.value);save()">${e(k.kontextNotizen || '')}</textarea>
    </div>
  </div>`;
}

// ── PROFIL TAB ────────────────────────────────────────────
function buildProfilTab(k) {
  // Radar
  const r = k.radar || {};
  const radarDims = [
    { key: 'luxusniveau',   l: 'Luxusniveau',    c: '#7e22ce' },
    { key: 'gruppengroesse',l: 'Kleingruppe',     c: '#1d4ed8' },
    { key: 'nachhaltigkeit',l: 'Nachhaltigkeit',  c: '#166534' },
    { key: 'ostafrikatiefe',l: 'Ostafrika-Tiefe', c: '#c2410c' },
    { key: 'innovation',    l: 'Innovation',      c: '#d97706' },
  ];
  if (!localRadar[k.id]) localRadar[k.id] = { ...r };
  const lr = localRadar[k.id];

  const radarHtml = radarDims.map(d => `
    <div class="radar-row">
      <span class="radar-label">${d.l}</span>
      <input type="range" min="1" max="5" step="1" value="${lr[d.key] || 3}" style="flex:1"
        oninput="updRadar('${k.id}','${d.key}',this.value)">
      <div class="radar-track" style="width:50px;flex-shrink:0">
        <div class="radar-fill" id="rf-${d.key}" style="width:${(lr[d.key]||3)/5*100}%;background:${d.c}"></div>
      </div>
      <span class="radar-val" style="color:${d.c}" id="rv-${d.key}">${lr[d.key] || 3}</span>
    </div>`).join('');

  // Scoring
  if (!localScore[k.id]) localScore[k.id] = { ...k.score };
  const ls  = localScore[k.id];
  const tot = (ls.luecken || 0) + (ls.budgetfit || 0);

  const scoringHtml = `
    <div class="score-mini-row">
      <span class="score-mini-label" style="font-size:11px">Produktlücken <span style="color:#94a3b8;font-size:10px">(relevante Lücken im Portfolio)</span></span>
      <input type="range" min="1" max="5" step="1" value="${ls.luecken || 3}" style="width:80px"
        oninput="updScore2('${k.id}','luecken',this.value)">
      <div class="score-mini-track"><div class="score-mini-fill" id="sc-luecken" style="width:${(ls.luecken||3)/5*100}%;background:#ef4444"></div></div>
      <span style="font-size:12px;font-weight:600;color:#ef4444;min-width:18px;text-align:right" id="sv-luecken">${ls.luecken || 3}</span>
    </div>
    <div class="score-mini-row">
      <span class="score-mini-label" style="font-size:11px">Budget-Fit <span style="color:#94a3b8;font-size:10px">(Preisniveau Netzwerkpartner passt)</span></span>
      <input type="range" min="1" max="5" step="1" value="${ls.budgetfit || 3}" style="width:80px"
        oninput="updScore2('${k.id}','budgetfit',this.value)">
      <div class="score-mini-track"><div class="score-mini-fill" id="sc-budgetfit" style="width:${(ls.budgetfit||3)/5*100}%;background:#d97706"></div></div>
      <span style="font-size:12px;font-weight:600;color:#d97706;min-width:18px;text-align:right" id="sv-budgetfit">${ls.budgetfit || 3}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9">
      <span style="font-size:11px;color:#64748b">Gesamt-Score</span>
      <span style="font-size:20px;font-weight:700;color:${scoreColor(tot)}" id="sc-total">${tot}<span style="font-size:11px;color:#94a3b8">/10</span></span>
    </div>`;

  // Positionierung
  const posHtml = (k.positionierung || []).map((p, i) =>
    `<span class="pos-badge">${e(p)}<span class="tag-del" onclick="pushHistory();delPos(${i})">×</span></span>`
  ).join('');

  // Fokus-Reisen
  const frHtml = FOCUS.map(dest => {
    const dc2   = DC[dest] || { bg: '#f1f5f9', c: '#334155' };
    const reisen = (k.fokusReisen || {})[dest] || [];
    return `<div style="margin-bottom:12px">
      <div class="op-dest-label" style="color:${dc2.c};border-color:${dc2.bg}">
        ${dest} <span style="font-size:10px;opacity:0.7">(${reisen.length})</span>
      </div>
      ${reisen.length
        ? reisen.map((r, ri) => `
          <div class="v-tour-item">
            <div class="v-tour-dot" style="background:${dc2.c}"></div>
            <div class="v-tour-name"><a href="${e(r.url)}" target="_blank">${e(r.name)}</a></div>
            <div class="v-tour-type">${e(r.typ || '')}</div>
            <span class="tag-del" onclick="pushHistory();delFokusReise('${dest}',${ri})" title="Entfernen">×</span>
          </div>`)
          .join('')
        : `<div style="font-size:11px;color:#cbd5e1;padding:4px 0">Keine Reisen gefunden</div>`
      }
      <div style="margin-top:4px;display:flex;gap:4px">
        <input class="ifield" id="fr-name-${dest}" placeholder="Reisename…" style="flex:1;font-size:11px">
        <input class="ifield" id="fr-url-${dest}" placeholder="URL…" style="flex:1;font-size:11px">
        <button class="btn btn-ghost btn-sm" onclick="pushHistory();addFokusReise('${dest}')">+</button>
      </div>
    </div>`;
  }).join('');

  // Destinationen
  const da = (k.destinationen?.aktiv  || []).map((d, i) => `<span class="dest-pill" style="background:#f0fdf4;color:#166534">${e(d)}<span class="tag-del" onclick="pushHistory();delDest('aktiv',${i})">×</span></span>`).join('');
  const dd = (k.destinationen?.duenn  || []).map((d, i) => `<span class="dest-pill" style="background:#fffbeb;color:#92400e">${e(d)}<span class="tag-del" onclick="pushHistory();delDest('duenn',${i})">×</span></span>`).join('');
  const df = (k.destinationen?.fehlt  || []).map((d, i) => `<span class="dest-pill" style="background:#fef2f2;color:#991b1b">${e(d)}<span class="tag-del" onclick="pushHistory();delDest('fehlt',${i})">×</span></span>`).join('');
  const tags = (k.tags || []).map((t, i) => `<span class="tag-pill">${e(t)}<span class="tag-del" onclick="pushHistory();delTag(${i})">×</span></span>`).join('');

  return `
    <div class="g3" style="margin-bottom:14px">
      <div class="radar-card">
        <div class="radar-title">Portfolio-Radar</div>
        ${radarHtml}
        <button class="btn btn-ghost btn-sm" style="margin-top:8px;width:100%" onclick="pushHistory();saveRadar('${k.id}')">Speichern</button>
      </div>
      <div class="radar-card">
        <div class="radar-title">Positionierung</div>
        ${posHtml || '<span style="color:#cbd5e1;font-size:12px">—</span>'}
        <div class="add-row" style="margin-top:10px">
          <input class="ifield" id="new-pos" placeholder="Badge…" style="font-size:11px"
            onkeydown="if(event.key==='Enter'){pushHistory();addPos()}">
          <button class="btn btn-ghost btn-sm" onclick="pushHistory();addPos()">+</button>
        </div>
      </div>
      <div class="radar-card">
        <div class="radar-title">Scoring</div>
        ${scoringHtml}
        <button class="btn btn-ghost btn-sm" style="margin-top:8px;width:100%" onclick="pushHistory();saveScore2('${k.id}')">Speichern</button>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="clabel" style="margin:0">Strategisches Profil</div>
        <button class="btn btn-ghost btn-sm" onclick="copyProfilPrompt('${k.id}')">📋 Profil-Prompt</button>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Zielgruppe</div>
          <input class="ifield" style="font-size:12px" value="${e(k.zielgruppe||'')}" placeholder="z.B. 55+, gehobene Mittelschicht, Individual" onchange="updK('zielgruppe',this.value);save()">
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Vertriebskanäle</div>
          <input class="ifield" style="font-size:12px" value="${e(k.vertrieb||'')}" placeholder="z.B. Direktbuchung, Reisebüros" onchange="updK('vertrieb',this.value);save()">
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Wettbewerber</div>
          <input class="ifield" style="font-size:12px" value="${e(k.wettbewerber||'')}" placeholder="z.B. Studiosus, Gebeco" onchange="updK('wettbewerber',this.value);save()">
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Ostafrika-Schwerpunkt</div>
          <input class="ifield" style="font-size:12px" value="${e(k.ostafrika||'')}" placeholder="z.B. Kenia/Tansania dominant" onchange="updK('ostafrika',this.value);save()">
        </div>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Gesprächseinstieg</div>
        <textarea rows="2" style="font-size:12px" spellcheck="true" lang="de" onchange="updK('gespraechseinstieg',this.value);save()">${e(k.gespraechseinstieg||'')}</textarea>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="clabel" style="margin:0">News & Erwähnungen</div>
        <button class="btn btn-ghost btn-sm" onclick="copyNewsPrompt('${k.id}')">📋 News-Prompt</button>
      </div>
      <div style="font-size:12px;color:#94a3b8;font-style:italic">
        Klick auf "News-Prompt" → auf claude.ai einfügen → aktuelle Nachrichten erscheinen mit Links
      </div>
      ${k.newsCache ? `<div style="margin-top:8px;font-size:12px;color:#334155;line-height:1.6;white-space:pre-wrap">${e(k.newsCache)}</div>` : ''}
      <textarea rows="3" style="font-size:12px;margin-top:6px" placeholder="News hier einfügen…" onchange="updK('newsCache',this.value);save()">${e(k.newsCache||'')}</textarea>
    </div>

    <div class="card">
      <div class="clabel">Reisen nach Fokusländern</div>
      ${frHtml}
    </div>

    <div class="card">
      <div class="clabel">Destinationen</div>
      <div style="margin-bottom:8px">
        <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Aktiv</div>
        ${da}<span class="dest-pill" style="background:#f8fafc;border:1px dashed #e2e8f0;color:#94a3b8;cursor:pointer" onclick="addDest('aktiv')">+</span>
      </div>
      <div style="margin-bottom:8px">
        <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Dünn besetzt</div>
        ${dd}<span class="dest-pill" style="background:#f8fafc;border:1px dashed #e2e8f0;color:#94a3b8;cursor:pointer" onclick="addDest('duenn')">+</span>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Fehlt</div>
        ${df}<span class="dest-pill" style="background:#f8fafc;border:1px dashed #e2e8f0;color:#94a3b8;cursor:pointer" onclick="addDest('fehlt')">+</span>
      </div>
    </div>

    <div class="card">
      <div class="clabel">Tags</div>
      ${tags}
      <div class="add-row">
        <input class="ifield" id="new-tag" placeholder="Tag…" style="width:140px"
          onkeydown="if(event.key==='Enter'){pushHistory();addTag()}">
        <button class="btn btn-ghost btn-sm" onclick="pushHistory();addTag()">+</button>
      </div>
    </div>

`;
}

// ── PITCH & LÜCKEN TAB ────────────────────────────────────
function buildPitchTab(k) {
  const allPitches  = k.pitchIdeen || [];
  const usedPitchIds = new Set();

  // Lücken mit direkt zugeordneten Pitches darunter
  const lueckenHtml = (k.luecken || []).map(l => {
    const pr = PRIO[l.prio] || PRIO.niedrig;
    const lKeywords = l.titel.toLowerCase().split(/[\s\-–&]+/).filter(w => w.length > 3);
    let zugehoerig = allPitches.filter(p => {
      const ptxt = (p.text + ' ' + (p.tags || []).join(' ')).toLowerCase();
      return lKeywords.some(kw => ptxt.includes(kw));
    });
    if (!zugehoerig.length) {
      zugehoerig = allPitches.filter(p =>
        findMatches(p.tags || []).length > 0 &&
        (p.tags || []).some(t => l.titel.toLowerCase().includes(t) || (l.beschreibung || '').toLowerCase().includes(t))
      );
    }
    if (window.fSuche) zugehoerig = zugehoerig.filter(p => p.text.toLowerCase().includes(window.fSuche.toLowerCase()));
    zugehoerig.forEach(p => usedPitchIds.add(p.id));

    return `<div style="margin-bottom:14px">
      <div class="luecke-item" style="background:${pr.bg};border-color:${pr.border}">
        <div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:5px">
          <input class="ifield" style="flex:1;font-weight:600;background:transparent;border-color:rgba(0,0,0,0.1);font-size:13px"
            value="${e(l.titel)}" onchange="updLuecke('${l.id}','titel',this.value)">
          <select class="ifield" style="width:90px;background:transparent;border-color:rgba(0,0,0,0.1);font-size:11px"
            onchange="updLuecke('${l.id}','prio',this.value)">
            <option value="hoch"${l.prio==='hoch'?' selected':''}>Hoch</option>
            <option value="mittel"${l.prio==='mittel'?' selected':''}>Mittel</option>
            <option value="niedrig"${l.prio==='niedrig'?' selected':''}>Niedrig</option>
          </select>
          <button style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:13px;flex-shrink:0"
            onclick="pushHistory();delLuecke('${l.id}')">✕</button>
        </div>
        <textarea rows="2" style="background:transparent;border-color:rgba(0,0,0,0.1);font-size:12px"
          onchange="updLuecke('${l.id}','beschreibung',this.value)">${e(l.beschreibung || '')}</textarea>
      </div>
      ${zugehoerig.length
        ? `<div style="padding-left:12px;border-left:2px solid ${pr.border}">${zugehoerig.map(p => buildPitchItem(p, k)).join('')}</div>`
        : ''}
    </div>`;
  }).join('');

  // Orphan pitches (not matched to any Lücke)
  let orphans = allPitches.filter(p => !usedPitchIds.has(p.id));
  if (window.fSuche) orphans = orphans.filter(p => p.text.toLowerCase().includes(window.fSuche.toLowerCase()));
  if (window.fDest)  orphans = orphans.filter(p => findMatches(p.tags||[]).some(m => m.dest === window.fDest));
  if (window.fNiveau)orphans = orphans.filter(p => findMatches(p.tags||[]).some(m => m.niveau === window.fNiveau));

  return `
    <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:10px">Produktlücken & Pitch-Ideen</div>

    ${lueckenHtml || '<div style="color:#cbd5e1;font-size:13px;padding:4px 0">Keine Lücken definiert.</div>'}

    <div class="card" style="margin-top:4px">
      <div class="clabel">Neue Lücke</div>
      <div style="display:grid;grid-template-columns:1fr 90px auto;gap:7px;align-items:flex-start">
        <div>
          <input class="ifield" id="nl-t" placeholder="Titel" style="margin-bottom:5px">
          <textarea id="nl-d" rows="2" placeholder="Beschreibung…"></textarea>
        </div>
        <select class="ifield" id="nl-p" style="height:34px;font-size:11px">
          <option value="hoch">Hoch</option>
          <option value="mittel" selected>Mittel</option>
          <option value="niedrig">Niedrig</option>
        </select>
        <button class="btn btn-primary" onclick="pushHistory();addLuecke()" style="height:34px">+</button>
      </div>
    </div>

    ${orphans.length ? `
      <div style="font-size:13px;font-weight:600;color:#64748b;margin:16px 0 8px">Weitere Pitch-Ideen</div>
      <div class="card">${orphans.map(p => buildPitchItem(p, k)).join('')}</div>
    ` : ''}

    <div style="margin-top:10px">
      <div class="clabel">Neue Pitch-Idee</div>
      <div style="display:flex;gap:7px">
        <input class="ifield" id="np-text" placeholder="Pitch-Idee…" style="flex:1"
          onkeydown="if(event.key==='Enter'){pushHistory();addPitch()}">
        <button class="btn btn-primary" onclick="pushHistory();addPitch()">+</button>
      </div>
    </div>`;
}

function buildPitchItem(p, k) {
  let matches = findMatches(p.tags || []);
  if (window.fDest)   matches = matches.filter(m => m.dest === window.fDest);
  if (window.fNiveau) matches = matches.filter(m => m.niveau === window.fNiveau);

  const mHtml = matches.length
    ? `<div class="match-box">
        <div class="match-title">Passende Touren aus deinem Netzwerk</div>
        ${matches.map(m => {
          const nv  = NV[m.niveau]  || NV.midrange;
          const dc2 = DC[m.dest]    || { bg: '#f1f5f9', c: '#334155' };
          return `<div class="match-item" style="flex-direction:column;gap:4px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;background:${dc2.bg};color:${dc2.c};flex-shrink:0">${m.dest}</span>
              <span style="flex:1;color:#0f172a;font-weight:500;font-size:12px">${e(m.tour)}</span>
              <span class="badge" style="background:${nv.bg};color:${nv.c};font-size:9px">${nv.l}</span>
              <span style="font-size:10px;color:#64748b;font-weight:500">${m.op.split(' ')[0]}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="font-size:10px;color:#64748b">Match:</span>
              ${(m.keyArgs||[]).map(t=>`<span style="font-size:9px;padding:1px 5px;border-radius:8px;background:#f1f5f9;color:#475569">${t}</span>`).join('')}
              <div style="margin-left:auto;display:flex;gap:4px">
                <button class="btn btn-xs btn-ghost" onclick="openTourFromMatch('${m.opId}','${m.tourId}')">Ansehen</button>
                <a href="${e(m.url)}" target="_blank" class="btn btn-xs btn-ghost" style="text-decoration:none">↗</a>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`
    : `<div class="match-box"><div style="font-size:11px;color:#94a3b8">Kein Match — Tags anpassen.</div></div>`;

  const tagsHtml = (p.tags || []).map((t, i) =>
    `<span class="tag-pill" style="font-size:10px">${e(t)}<span class="tag-del" onclick="pushHistory();delPitchTag('${p.id}',${i})">×</span></span>`
  ).join('');

  return `<div class="pitch-match-item">
    <div style="display:flex;gap:7px;align-items:flex-start">
      <div style="flex:1">
        <textarea rows="2" style="font-size:13px;margin-bottom:4px"
          onchange="updPitch('${p.id}','text',this.value)">${e(p.text)}</textarea>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:3px">
          <span style="font-size:10px;color:#94a3b8">Tags:</span>
          ${tagsHtml}
          <input class="ifield" id="pt-${p.id}" placeholder="Tag+" style="width:80px;font-size:10px;padding:2px 5px;border-radius:5px"
            onkeydown="if(event.key==='Enter'){pushHistory();addPitchTag('${p.id}')}">
          <button class="btn btn-xs btn-ghost" onclick="pushHistory();addPitchTag('${p.id}')">+</button>
        </div>
      </div>
      <button style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:13px;flex-shrink:0;padding:3px"
        onclick="pushHistory();delPitch('${p.id}')">✕</button>
    </div>
    ${mHtml}
  </div>`;
}

// ── GESPRÄCH TAB ──────────────────────────────────────────
function buildGespraechTab(k) {
  const nText  = k.gespraechsNotizen || '';
  const nsText = k.nextSteps || '';
  return `
    <div class="card">
      <div class="clabel">Letzter Kontakt</div>
      <input type="date" class="ifield" style="width:auto" value="${e(k.letzterKontakt || '')}"
        onchange="updK('letzterKontakt',this.value);save()">
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="clabel" style="margin:0">Gesprächsnotizen</div>
        <button class="btn btn-ghost btn-sm" onclick="editNotiz=!editNotiz;renderVDetail()">${editNotiz ? 'Schließen' : 'Bearbeiten'}</button>
      </div>
      ${editNotiz
        ? `<textarea id="notiz-input" rows="6" onchange="updK('gespraechsNotizen',this.value)">${e(nText)}</textarea>
           <div style="margin-top:6px"><button class="btn btn-primary btn-sm" onclick="editNotiz=false;save();renderVDetail()">Speichern</button></div>`
        : `<div class="notiz-display${!nText ? ' notiz-leer' : ''}">${nText ? e(nText) : 'Noch keine Notizen.'}</div>`
      }
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="clabel" style="margin:0">Next Steps</div>
        <button class="btn btn-ghost btn-sm" onclick="editNext=!editNext;renderVDetail()">${editNext ? 'Schließen' : 'Bearbeiten'}</button>
      </div>
      ${editNext
        ? `<textarea id="next-input" rows="5" onchange="updK('nextSteps',this.value)">${e(nsText)}</textarea>
           <div style="margin-top:6px"><button class="btn btn-primary btn-sm" onclick="editNext=false;save();renderVDetail()">Speichern</button></div>`
        : `<div class="notiz-display${!nsText ? ' notiz-leer' : ''}">${nsText ? e(nsText) : 'Noch keine Next Steps.'}</div>`
      }
    </div>`;
}

// ── FILTER BAR (Veranstalter/Pitch) ───────────────────────
function renderFilterBarV() {
  const destOpts   = FOCUS.map(d => `<option value="${d}"${window.fDest===d?' selected':''}>${d}</option>`).join('');
  const nvOpts     = ['luxury','midrange','adventure'].map(n => `<option value="${n}"${window.fNiveau===n?' selected':''}>${NV[n].l}</option>`).join('');
  const active     = [window.fDest, window.fNiveau, window.fSuche].filter(Boolean).length;
  document.getElementById('filter-bar-wrap').innerHTML = `<div class="filter-bar">
    <label>Land</label>
    <select onchange="window.fDest=this.value;renderVDetail()"><option value="">Alle</option>${destOpts}</select>
    <label>Kategorie</label>
    <select onchange="window.fNiveau=this.value;renderVDetail()"><option value="">Alle</option>${nvOpts}</select>
    <input type="text" placeholder="Stichwort…" value="${e(window.fSuche)}"
      oninput="window.fSuche=this.value;renderVDetail()" style="margin-left:auto">
    ${active > 0 ? `<span class="fclear" onclick="window.fDest='';window.fNiveau='';window.fSuche='';renderVDetail()">✕ Filter (${active})</span>` : ''}
  </div>`;
}

// ── NEU FORMULAR ──────────────────────────────────────────
function renderNeuForm() {
  document.getElementById('detail-area').innerHTML = `<div class="detail-inner" style="max-width:580px">
    <div style="font-size:18px;font-weight:700;margin-bottom:18px">Neuer Veranstalter</div>
    <div class="g2" style="margin-bottom:10px">
      <div><label class="clabel">NAME *</label><input class="ifield" id="f-name" placeholder="z.B. Studiosus Reisen"></div>
      <div><label class="clabel">SITZ</label><input class="ifield" id="f-sitz" placeholder="z.B. München"></div>
      <div><label class="clabel">SEGMENT</label><input class="ifield" id="f-seg" placeholder="Luxus / Mittelklasse"></div>
      <div><label class="clabel">ANSPRECHPARTNER</label><input class="ifield" id="f-ap" placeholder="Vor- & Nachname"></div>
      <div><label class="clabel">POSITION</label><input class="ifield" id="f-pos" placeholder="z.B. Produktmanager Afrika"></div>
      <div><label class="clabel">TELEFON</label><input class="ifield" id="f-tel" placeholder="+49 …"></div>
    </div>
    <div style="margin-bottom:10px"><label class="clabel">E-MAIL</label><input class="ifield" id="f-email" placeholder="name@veranstalter.de"></div>
    <div style="margin-bottom:10px"><label class="clabel">TAGS (kommagetrennt)</label><input class="ifield" id="f-tags" placeholder="Luxus, Gruppenreisen"></div>
    <div style="margin-bottom:14px"><label class="clabel">KONTEXTNOTIZEN</label><textarea id="f-kontext" rows="3" placeholder="Hintergrundinfos…"></textarea></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="speichereNeu()">Anlegen</button>
      <button class="btn btn-ghost" onclick="vAnsicht='detail';renderV()">Abbrechen</button>
    </div>
  </div>`;
}

function speichereNeu() {
  const name = document.getElementById('f-name')?.value?.trim();
  if (!name) { alert('Name Pflichtfeld.'); return; }
  pushHistory();
  const neu = {
    id: uid(), name,
    sitz:              document.getElementById('f-sitz')?.value?.trim()  || '',
    segment:           document.getElementById('f-seg')?.value?.trim()   || 'k.A.',
    ansprechpartner:   document.getElementById('f-ap')?.value?.trim()    || '',
    position:          document.getElementById('f-pos')?.value?.trim()   || '',
    telefon:           document.getElementById('f-tel')?.value?.trim()   || '',
    email:             document.getElementById('f-email')?.value?.trim() || '',
    tags:              (document.getElementById('f-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    kontextNotizen:    document.getElementById('f-kontext')?.value?.trim() || '',
    status:            'vorbereitet',
    score:             { luecken: 3, budgetfit: 3 },
    radar:             { luxusniveau: 3, gruppengroesse: 3, nachhaltigkeit: 3, ostafrikatiefe: 3, innovation: 3 },
    positionierung:    [],
    destinationen:     { aktiv: [], duenn: [], fehlt: [] },
    fokusReisen:       { Kenia: [], Uganda: [], Ruanda: [], Tansania: [] },
    luecken:           [],
    pitchIdeen:        [],
    gespraechsNotizen: '',
    nextSteps:         '',
    letzterKontakt:    '',
  };
  kunden.push(neu);
  aktuelleId = neu.id;
  vAnsicht   = 'detail';
  vTab       = 'profil';
  save();
  renderV();
}

// ── ACTIONS ───────────────────────────────────────────────
function selK(id) { aktuelleId = id; vAnsicht = 'detail'; vTab = 'profil'; editNotiz = false; editNext = false; renderV(); }
function swVTab(t) { vTab = t; editNotiz = false; editNext = false; document.getElementById('filter-bar-wrap').innerHTML = ''; renderVDetail(); }
function zeigeNeuV() { vAnsicht = 'neu'; renderV(); }
function setStatus(id, s) { kunden = kunden.map(k => k.id === id ? { ...k, status: s } : k); save(); renderV(); }
function updK(field, val) { kunden = kunden.map(k => k.id === aktuelleId ? { ...k, [field]: val } : k); }
function delK(id) {
  if (!confirm('Wirklich löschen?')) return;
  pushHistory();
  kunden     = kunden.filter(k => k.id !== id);
  aktuelleId = kunden.length ? kunden[0].id : null;
  save(); renderV();
}
function addDest(type) {
  const d = prompt(`Destination (${type}):`);
  if (!d?.trim()) return;
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, destinationen: { ...k.destinationen, [type]: [...(k.destinationen[type] || []), d.trim()] } }
    : k);
  save(); renderVDetail();
}
function delDest(type, i) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, destinationen: { ...k.destinationen, [type]: k.destinationen[type].filter((_, j) => j !== i) } }
    : k);
  save(); renderVDetail();
}
function addTag() {
  const v = document.getElementById('new-tag')?.value?.trim();
  if (!v) return;
  kunden = kunden.map(k => k.id === aktuelleId ? { ...k, tags: [...(k.tags || []), v] } : k);
  save(); renderVDetail();
}
function delTag(i) {
  kunden = kunden.map(k => k.id === aktuelleId ? { ...k, tags: (k.tags || []).filter((_, j) => j !== i) } : k);
  save(); renderVDetail();
}
function addPos() {
  const v = document.getElementById('new-pos')?.value?.trim();
  if (!v) return;
  kunden = kunden.map(k => k.id === aktuelleId ? { ...k, positionierung: [...(k.positionierung || []), v] } : k);
  save(); renderVDetail();
}
function delPos(i) {
  kunden = kunden.map(k => k.id === aktuelleId ? { ...k, positionierung: (k.positionierung || []).filter((_, j) => j !== i) } : k);
  save(); renderVDetail();
}
function addFokusReise(dest) {
  const n = document.getElementById(`fr-name-${dest}`)?.value?.trim();
  const u = document.getElementById(`fr-url-${dest}`)?.value?.trim();
  if (!n) return;
  kunden = kunden.map(k => {
    if (k.id !== aktuelleId) return k;
    const fr = { ...k.fokusReisen };
    fr[dest] = [...(fr[dest] || []), { name: n, url: u || '', typ: 'Privatreise' }];
    return { ...k, fokusReisen: fr };
  });
  save(); renderVDetail();
}
function delFokusReise(dest, i) {
  kunden = kunden.map(k => {
    if (k.id !== aktuelleId) return k;
    const fr = { ...k.fokusReisen };
    fr[dest] = (fr[dest] || []).filter((_, j) => j !== i);
    return { ...k, fokusReisen: fr };
  });
  save(); renderVDetail();
}
function updRadar(id, key, val) {
  if (!localRadar[id]) localRadar[id] = {};
  localRadar[id][key] = parseInt(val);
  const rv = document.getElementById('rv-' + key); if (rv) rv.textContent = val;
  const rf = document.getElementById('rf-' + key); if (rf) rf.style.width = (parseInt(val)/5*100) + '%';
}
function saveRadar(id) {
  const r = localRadar[id]; if (!r) return;
  kunden = kunden.map(k => k.id === id ? { ...k, radar: { ...r } } : k);
  save();
}
function updScore2(id, key, val) {
  if (!localScore[id]) localScore[id] = {};
  localScore[id][key] = parseInt(val);
  const sv  = document.getElementById('sv-' + key); if (sv) sv.textContent = val;
  const sf  = document.getElementById('sc-' + key); if (sf) sf.style.width = (parseInt(val)/5*100) + '%';
  const tot = Object.values(localScore[id]).reduce((a, b) => a + b, 0);
  const st  = document.getElementById('sc-total'); if (st) st.textContent = tot + '/10';
}
function saveScore2(id) {
  const s = localScore[id]; if (!s) return;
  kunden = kunden.map(k => k.id === id ? { ...k, score: { ...s } } : k);
  save();
}
function addLuecke() {
  const t = document.getElementById('nl-t')?.value?.trim();
  const d = document.getElementById('nl-d')?.value?.trim();
  const p = document.getElementById('nl-p')?.value;
  if (!t) return;
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, luecken: [...(k.luecken || []), { id: uid(), titel: t, beschreibung: d || '', prio: p || 'mittel' }] }
    : k);
  save(); renderVDetail();
}
function delLuecke(lid) {
  kunden = kunden.map(k => k.id === aktuelleId ? { ...k, luecken: (k.luecken || []).filter(l => l.id !== lid) } : k);
  save(); renderVDetail();
}
function updLuecke(lid, field, val) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, luecken: (k.luecken || []).map(l => l.id === lid ? { ...l, [field]: val } : l) }
    : k);
  save();
}
function addPitch() {
  const t = document.getElementById('np-text')?.value?.trim();
  if (!t) return;
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, pitchIdeen: [...(k.pitchIdeen || []), { id: uid(), text: t, tags: [] }] }
    : k);
  save(); renderVDetail();
}
function delPitch(pid) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, pitchIdeen: (k.pitchIdeen || []).filter(p => p.id !== pid) }
    : k);
  save(); renderVDetail();
}
function updPitch(pid, field, val) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, pitchIdeen: (k.pitchIdeen || []).map(p => p.id === pid ? { ...p, [field]: val } : p) }
    : k);
  save();
}
function addPitchTag(pid) {
  const el = document.getElementById('pt-' + pid);
  if (!el) return;
  const v = el.value.trim();
  if (!v) return;
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, pitchIdeen: (k.pitchIdeen || []).map(p => p.id === pid ? { ...p, tags: [...(p.tags||[]), v] } : p) }
    : k);
  save(); renderVDetail();
}
function delPitchTag(pid, i) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, pitchIdeen: (k.pitchIdeen || []).map(p => p.id === pid ? { ...p, tags: (p.tags||[]).filter((_,j)=>j!==i) } : p) }
    : k);
  save(); renderVDetail();
}
function openTourFromMatch(opId, tourId) {
  // Switch to Netzwerk tab and open tour detail
  window._pendingTour = { opId, tourId };
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.nav-tab')[1].classList.add('on');
  currentPage = 'netzwerk';
  aktuellerOp  = opId;
  aktiveTourId = tourId;
  render();
}
