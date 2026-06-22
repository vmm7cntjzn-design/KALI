/* ═══════════════════════════════════════════════════════════
   KALI — veranstalter.js
   Veranstalter-Tab: Rendering + Actions
═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────
let aktuelleId  = null;
let vAnsicht    = 'detail'; // 'detail' | 'neu'
let vTab        = 'profil'; // 'profil' | 'matchluecken' | 'gespraech'
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
  kunden = kunden.map(k => k.status === 'vorbereitet' ? { ...k, status: 'offen' } : k);
  // Sidebar
  const suche = (document.getElementById('sb-vsearch') || { value: '' }).value || '';
  const liste = kunden.filter(k => !suche || k.name.toLowerCase().includes(suche.toLowerCase()));

  document.getElementById('sb-top').innerHTML =
    `<input class="sb-search" id="sb-vsearch" type="text" placeholder="Veranstalter suchen…" oninput="renderV()" value="${e(suche)}">`;

  document.getElementById('sidebar-list').innerHTML = liste.map(k => {
    const t  = totalScore(k.score || {});
    const st = STATUS[k.status] || STATUS.offen;
    // Color coding based on dates
    const today = new Date(); today.setHours(0,0,0,0);
    const nextDate = k.naechsterKontakt ? new Date(k.naechsterKontakt) : null;
    const lastDate = k.letzterKontakt ? new Date(k.letzterKontakt) : null;
    const daysUntilNext = nextDate ? Math.ceil((nextDate - today) / (1000*60*60*24)) : null;
    let karteColor = '';
    const rotDeaktiv = k.rotDeaktiviert === true;
    if (nextDate && daysUntilNext <= 7 && !rotDeaktiv) karteColor = 'background:#ffd5d5;'; // pastellrot
    else if (lastDate) karteColor = 'background:#d4edda;'; // pastellgrün
    return `<div class="karte${k.id === aktuelleId && vAnsicht !== 'neu' ? ' on' : ''}" onclick="selK('${k.id}')" style="${karteColor}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="karte-name" style="flex:1">${e(k.name)}</div>
        <input type="checkbox" title="Rot deaktivieren" ${rotDeaktiv?'checked':''} 
          onclick="event.stopPropagation();toggleRotDeaktiv('${k.id}')"
          style="margin:2px 0 0 6px;cursor:pointer;flex-shrink:0">
      </div>
      <div class="karte-sub">${e(k.sitz)} · ${e(k.segment)}</div>
      <div class="karte-bottom">
        ${(() => {
          const nd = k.naechsterKontakt ? new Date(k.naechsterKontakt) : null;
          const today2 = new Date(); today2.setHours(0,0,0,0);
          if (nd) {
            const days = Math.ceil((nd - today2) / (1000*60*60*24));
            const overdue = days < 0;
            const soon = days >= 0 && days <= 7;
            return `<span style="font-size:10px;font-weight:600;color:${overdue ? '#dc2626' : soon ? '#d97706' : '#64748b'};display:flex;align-items:center;gap:3px">
              ${overdue ? '🔴' : soon ? '🟡' : '📅'} ${nd.toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit'})}
            </span>`;
          }
          return `<span class="badge" style="background:${st.bg};color:${st.c}">${st.l}</span>`;
        })()}
        <div style="display:flex;align-items:center;gap:5px">
          ${(k.vertriebsUnterlagen||[]).length ? '<span title="Unterlagen versendet" style="font-size:11px">📄</span>' : ''}
          <span style="font-size:13px;font-weight:700;color:${scoreColor(t)}">${t}<span style="font-size:10px;color:#94a3b8;font-weight:400">/10</span></span>
        </div>
      </div>
    </div>`;
  }).join('');

  // No filter bar on Veranstalter main view (only on matchluecken tab)
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
    { id: 'matchluecken',l: 'Match & Lücken' },
    { id: 'gespraech',  l: 'Gespräch' },
  ];
  const tabsHtml = `<div class="tabs">${tabs2.map(t =>
    `<button class="tab${vTab === t.id ? ' on' : ''}" onclick="swVTab('${t.id}')">${t.l}</button>`
  ).join('')}</div>`;

  const header = buildVHeader(k, vTab);
  let content  = '';

  if (vTab === 'profil')      content = buildProfilTab(k);
  if (vTab === 'matchluecken') { renderFilterBarV(); content = buildPitchTab(k); }
  if (vTab === 'gespraech')   content = buildGespraechTab(k);

  el.innerHTML = `<div class="detail-inner">${tabsHtml}${header}<div id="pitch-content">${content}</div></div>`;
}

// ── CONTACT BOX (separate function to avoid nested backtick issues) ───────────
function buildContactBox(k) {
  const vf = k._verifiedFields || [];
  function vBtn(field) {
    const ok = vf.includes(field);
    return `<button class="vf-btn" data-kid="${k.id}" data-field="${field}" onclick="vfClick(this)" style="color:${ok ? '#16a34a' : '#cbd5e1'}" title="Feld verifiziert">✓</button>`;
  }
  function fLabel(label, field) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><div style="font-size:10px;color:#64748b">${label}</div>${vBtn(field)}</div>`;
  }
  function vBorder(field) { return vf.includes(field) ? 'border-color:#86efac;' : ''; }
  const homepageLink = (k.homepage||k.website) ? `<a href="${e(k.homepage||k.website)}" target="_blank" style="color:#2563eb;font-size:16px;text-decoration:none;flex-shrink:0">↗</a>` : '';
  const telLink = k.telefon ? `<a href="tel:${e(k.telefon)}" style="color:#2563eb;font-size:16px;text-decoration:none">📞</a>` : '';
  const emailLink = k.email ? `<a href="mailto:${e(k.email)}" style="color:#2563eb;font-size:14px;text-decoration:none">✉</a>` : '';
  const weitereKontakte = (k.kontakte && k.kontakte.length > 1)
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0">
        <div class="clabel" style="margin-bottom:6px">Weitere Ansprechpartner</div>
        ${k.kontakte.slice(1).map(kt => `
          <div style="display:flex;gap:10px;align-items:center;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px">
            <div style="flex:1"><strong>${e(kt.name)}</strong> · ${e(kt.position)}</div>
            ${kt.telefon && kt.telefon !== 'Über Website' ? `<a href="tel:${e(kt.telefon)}" style="color:#2563eb;font-size:11px">📞</a>` : ''}
            ${kt.email ? `<a href="mailto:${e(kt.email)}" style="color:#2563eb;font-size:11px">✉</a>` : ''}
          </div>`).join('')}
      </div>` : '';
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-top:8px">
    <div class="clabel" style="margin-bottom:8px">Kontakt</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
      <div>${fLabel('Sitz','sitz')}<input class="ifield" style="font-size:12px;${vBorder('sitz')}" value="${e(k.sitz||'')}" placeholder="z.B. Berlin" onchange="updK('sitz',this.value);save()"></div>
      <div>${fLabel('Homepage','homepage')}<div style="display:flex;align-items:center;gap:4px"><input class="ifield" style="font-size:12px;flex:1;${vBorder('homepage')}" value="${e(k.homepage||k.website||'')}" placeholder="https://…" onchange="updK('homepage',this.value);save()">${homepageLink}</div></div>
    </div>
    <div class="clabel" style="margin-bottom:8px">Ansprechpartner</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
      <div>${fLabel('Name','ansprechpartner')}<input class="ifield" style="font-size:12px;${vBorder('ansprechpartner')}" value="${e(k.ansprechpartner||'')}" placeholder="Vor- & Nachname" onchange="updK('ansprechpartner',this.value);save()"></div>
      <div>${fLabel('Position','position')}<input class="ifield" style="font-size:12px;${vBorder('position')}" value="${e(k.position||'')}" placeholder="z.B. Produktmanagerin Afrika" onchange="updK('position',this.value);save()"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <div>${fLabel('Telefon','telefon')}<div style="display:flex;align-items:center;gap:4px"><input class="ifield" style="font-size:12px;flex:1;${vBorder('telefon')}" value="${e(k.telefon||'')}" placeholder="+49 …" onchange="updK('telefon',this.value);save()">${telLink}</div></div>
      <div>${fLabel('E-Mail','email')}<div style="display:flex;align-items:center;gap:4px"><input class="ifield" style="font-size:12px;flex:1;${vBorder('email')}" value="${e(k.email||'')}" placeholder="vorname@veranstalter.de" onchange="updK('email',this.value);save()">${emailLink}</div></div>
    </div>
    ${weitereKontakte}
  </div>`;
}

// ── HEADER ────────────────────────────────────────────────
function buildVHeader(k, currentTab) {
  currentTab = currentTab || 'profil';
  const verifiedStyle = (currentTab === 'profil' && k.profilVerified) ? 'background:#f0fdf4;border-bottom:1px solid #bbf7d0;' : '';
  return `<div class="dh" style="${verifiedStyle}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div style="flex:1;min-width:0">
        <input class="ifield" style="font-size:18px;font-weight:700;letter-spacing:-0.02em;margin-bottom:8px"
          value="${e(k.name)}"
          onchange="pushHistory();updK('name',this.value);save();renderV()">
        ${currentTab==='profil' ? `<div class="g2" style="margin-bottom:8px">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><div class="clabel" style="margin:0">Sitz</div><button class="vf-btn" data-kid="${k.id}" data-field="sitz" onclick="vfClick(this)" style="color:${(k._verifiedFields||[]).includes('sitz')?'#16a34a':'#cbd5e1'}" title="Feld verifiziert">✓</button></div>
            <input class="ifield" style="font-size:12px;${(k._verifiedFields||[]).includes('sitz')?'border-color:#86efac;':''}" value="${e(k.sitz)}" placeholder="z.B. Berlin"
              onchange="updK('sitz',this.value);save()">
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><div class="clabel" style="margin:0">Segment</div><button class="vf-btn" data-kid="${k.id}" data-field="segment" onclick="vfClick(this)" style="color:${(k._verifiedFields||[]).includes('segment')?'#16a34a':'#cbd5e1'}" title="Feld verifiziert">✓</button></div>
            <input class="ifield" style="font-size:12px;${(k._verifiedFields||[]).includes('segment')?'border-color:#86efac;':''}" value="${e(k.segment)}" placeholder="z.B. Ultra-Luxus"
              onchange="updK('segment',this.value);save()">
          </div>
        </div>` : ''}
        ${currentTab === 'profil' ? buildContactBox(k) : ''}
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
    ${currentTab === 'profil' ? `<div style="margin-top:8px">

      <div style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <div class="clabel" style="margin:0">Kontextnotizen</div>
        <button class="btn btn-ghost btn-sm" onclick="copyRecherchePrompt('${k.id}')">📋 Recherche-Prompt kopieren</button>
      </div>
      <textarea rows="3" style="font-size:12px" spellcheck="true" lang="de"
        onchange="updK('kontextNotizen',this.value);save()">${e(k.kontextNotizen || '')}</textarea>
      </div>
    </div>` : ''}
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
      <span class="score-mini-label" style="font-size:11px">Budget-Fit <span style="color:#94a3b8;font-size:10px">(Preis-Fit Netzwerkpartner)</span></span>
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
      <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;gap:4px">
          <input class="ifield" id="fr-name-${dest}" placeholder="Reisename…" style="flex:1;font-size:11px">
          <input class="ifield" id="fr-typ-${dest}" placeholder="Label (z.B. Gruppenreise)" style="width:160px;font-size:11px">
        </div>
        <div style="display:flex;gap:4px">
          <input class="ifield" id="fr-url-${dest}" placeholder="URL (https://…)" style="flex:1;font-size:11px">
          <button class="btn btn-ghost btn-sm" onclick="pushHistory();addFokusReise('${dest}')">+</button>
        </div>
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
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="openProfilPaste('${k.id}')">📋 Profil-Ergebnis einfügen</button>
          <button class="btn btn-ghost btn-sm" onclick="copyProfilPrompt('${k.id}')">📤 Prompt</button>
        </div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Zielgruppe</div>
          <textarea class="ifield" style="font-size:12px;resize:vertical;min-height:80px;line-height:1.5;width:100%" placeholder="z.B. 55+, gehobene Mittelschicht, Individual" onchange="updK('zielgruppe',this.value);save()" oninput="autoResize(this)">${e(k.zielgruppe||'')}</textarea>
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Vertriebskanäle</div>
          <textarea class="ifield" style="font-size:12px;resize:vertical;min-height:80px;line-height:1.5;width:100%" placeholder="z.B. Direktbuchung, Reisebüros" onchange="updK('vertrieb',this.value);save()" oninput="autoResize(this)">${e(k.vertrieb||'')}</textarea>
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Wettbewerber</div>
          <textarea class="ifield" style="font-size:12px;resize:vertical;min-height:80px;line-height:1.5;width:100%" placeholder="z.B. Studiosus, Gebeco" onchange="updK('wettbewerber',this.value);save()" oninput="autoResize(this)">${e(k.wettbewerber||'')}</textarea>
        </div>
        <div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Ostafrika-Schwerpunkt</div>
          <textarea class="ifield" style="font-size:12px;resize:vertical;min-height:80px;line-height:1.5;width:100%" placeholder="z.B. Kenia/Tansania dominant" onchange="updK('ostafrika',this.value);save()" oninput="autoResize(this)">${e(k.ostafrika||'')}</textarea>
        </div>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Gesprächseinstieg</div>
        <textarea class="ifield" style="font-size:12px;resize:vertical;min-height:80px;line-height:1.5;width:100%" spellcheck="true" lang="de" onchange="updK('gespraechseinstieg',this.value);save()" oninput="autoResize(this)">${e(k.gespraechseinstieg||'')}</textarea>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;margin-bottom:3px">Stärken & Nischen</div>
        <textarea class="ifield" style="font-size:12px;resize:vertical;min-height:60px;line-height:1.5;width:100%"
          placeholder="z.B. Walking Safaris, Privatreservate, Luxus-Camps"
          onchange="updK('staerken_text',this.value);save()" oninput="autoResize(this)">${e(k.staerken_text||'')}</textarea>
      </div>

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

// ── PORTFOLIO ORTE (nur fokusReisen, keine Pitches) ──────
function getPortfolioOrte(k) {
  const orte = new Set();
  Object.values(k.fokusReisen || {}).forEach(reisen =>
    reisen.forEach(r => {
      extractOrteEnhanced(r.name || '').forEach(o => orte.add(o));
      (r.tags || []).forEach(t => extractOrteEnhanced(t).forEach(o => orte.add(o)));
    })
  );
  return orte;
}

function getFokusReiseOrte(reise) {
  const orte = new Set();
  // Enhanced for name + tags (short, intentional text)
  extractOrteEnhanced(reise.name || '').forEach(o => orte.add(o));
  (reise.tags || []).forEach(t => extractOrteEnhanced(t).forEach(o => orte.add(o)));
  return orte;
}
// ── PITCH & LÜCKEN v3 ─────────────────────────────────────

// ── GROUP SIZE HELPERS ───────────────────────────────────
function extractMaxPax(text) {
  if (!text) return null;
  // Patterns: "max. 6 P", "max. 6 Pax", "max. 8 Gäste", "max. 6 Personen", "(max. 6 P)"
  const m = text.match(/max\.?\s*(\d+)\s*(?:p\.?(?:ax)?|gäste|pers(?:onen?)?|guests?)/i);
  return m ? parseInt(m[1]) : null;
}

function getTourMaxPax(tour) {
  // From tags
  const tags = (tour.tags || []).map(t => t.toLowerCase());
  if (tags.some(t => t.includes('minigruppe') || t.includes('mini-gruppe'))) return 8;
  if (tags.some(t => t.includes('kleingruppe') || t.includes('small-group'))) return 12;
  // From desc/prices text
  const fullText = (tour.desc || '') + ' ' + (tour.prices || []).join(' ');
  const m = fullText.match(/max(?:imum)?\.?\s*(\d+)\s*(?:p(?:ax)?|persons?|guests?|people)/i);
  if (m) return parseInt(m[1]);
  return null; // unknown
}

function groupSizeScore(reiseMaxPax, tourMaxPax) {
  if (!reiseMaxPax || !tourMaxPax) return 0.5; // unknown → neutral
  // Perfect match: within 20%
  const ratio = reiseMaxPax / tourMaxPax;
  if (ratio >= 0.7 && ratio <= 1.3) return 1.0;
  if (ratio >= 0.5 && ratio <= 2.0) return 0.6;
  return 0.2; // very different group sizes
}

function scoreMatch(k, tour, op, gemeinsamOrte) {
  const seg = (k.segment || '').toLowerCase();
  const scores = {};
  scores.geo = Math.min(1, (gemeinsamOrte?.size || 0) / 8);
  const luxK = seg.includes('luxus') || seg.includes('luxury') || seg.includes('ultra');
  const midK = seg.includes('mittel') || seg.includes('group') || seg.includes('study') || seg.includes('erlebnis');
  if (tour.niveau === 'luxury') scores.segment = luxK ? 1 : midK ? 0.4 : 0.2;
  else if (tour.niveau === 'midrange') scores.segment = midK ? 1 : luxK ? 0.5 : 0.6;
  else scores.segment = 0.5;
  const tourTags = (tour.tags || []).map(t => t.toLowerCase());
  const kText = (seg + ' ' + (k.beschreibung || '') + ' ' + (k.zielgruppe || '')).toLowerCase();
  const reisenPairs = [
    [['individual','fit','privat','private'],['individual','privat']],
    [['gruppe','group','klein'],['gruppe','group']],
    [['aktiv','walking','trekking','hiking'],['aktiv','walking','trekking']],
    [['luxury','exklus','boutique'],['luxury','exclusive','camp']],
    [['kultur','bildung','studie'],['kultur','study']],
  ];
  let rScore = 0.3;
  for (const [kWords, tWords] of reisenPairs) {
    const kHas = kWords.some(w => kText.includes(w));
    const tHas = tWords.some(w => tourTags.includes(w));
    if (kHas && tHas) { rScore = 1; break; }
    if (kHas || tHas) rScore = Math.max(rScore, 0.55);
  }
  scores.reiseart = rScore;
  const allPitchTags = new Set((k.pitchIdeen || []).flatMap(p => p.tags || []));
  const kProfilText = ((k.zielgruppe || '') + ' ' + (k.ostafrika || '') + ' ' + (k.staerken_text || '')).toLowerCase();
  const tagMatches = tourTags.filter(t => allPitchTags.has(t) || kProfilText.includes(t)).length;
  scores.thema = Math.min(1, tagMatches / 3);
  scores.ostafrica = Math.min(1, (k.score?.oaanteil || k.score?.luecken || 3) / 5);

  // Group size match (bonus factor, 0-1)
  // reise comes from gemeinsamOrte context - we pass null if unknown
  scores.groupsize = 0.5; // neutral default

  const total = scores.geo*0.28 + scores.segment*0.24 + scores.reiseart*0.19 + scores.thema*0.14 + scores.ostafrica*0.10 + scores.groupsize*0.05;
  return { total: Math.round(total * 100), scores };
}

// Abbreviate Veranstalter name for column label
function kAbbrev(name) {
  const words = name.trim().split(/\s+/);
  // Remove common suffixes
  const skip = new Set(['reisen','travel','tours','gmbh','ag','kg']);
  const kept = words.filter(w => !skip.has(w.toLowerCase()));
  const short = kept.slice(0, 2).join(' ');
  return short.length > 20 ? short.slice(0, 18) + '…' : short;
}

// ── BLOCK 1 CARD: one Veranstalter tour ↔ one network tour ──
function buildBlock1Card(k, reise, matches) {
  const reiseLink = reise.url
    ? `<a href="${e(reise.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none;margin-left:6px">↗</a>`
    : '';
  const reiseOrte = getFokusReiseOrte(reise);
  const cardId = `b1-${reise.name.slice(0,12).replace(/\W/g,'')}-${Math.random().toString(36).slice(2,5)}`;

  // Best score of all matches
  const bestScore = Math.max(...matches.map(m => m.scoreData.total));
  const scoreColor = bestScore >= 70 ? '#166534' : bestScore >= 50 ? '#d97706' : '#64748b';

  const matchRows = matches.map((m) => {
    const { tour, op, gemeinsam, scoreData } = m;
    const tourOrte = getTourOrte(tour);
    const gemArr  = [...gemeinsam].sort();
    const netzOnly = [...tourOrte].filter(o => !reiseOrte.has(o)).sort();
    const rowId = `${cardId}-${tour.id.slice(0,6)}`;
    const sc = scoreData.total;
    const scColor = sc >= 70 ? '#166534' : sc >= 50 ? '#d97706' : '#64748b';
    const nv = NV[tour.niveau] || NV.midrange;

    return `<div style="border-top:1px solid #f1f5f9">
      <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;cursor:pointer;background:#fafafa"
        onclick="const el=document.getElementById('${rowId}');const arr=document.getElementById('${rowId}-arr');el.style.display=el.style.display==='none'?'block':'none';arr.textContent=el.style.display==='none'?'▶':'▼'">
        <span id="${rowId}-arr" style="font-size:9px;color:#94a3b8;flex-shrink:0">▶</span>
        <div style="flex:1;font-size:11px;font-weight:500;color:#0f172a">${e(tour.name)}</div>
        <span style="font-size:9px;color:#64748b;flex-shrink:0">${e(op.name.split(' ')[0])}${tour.tage?' · '+tour.tage+'T':''}${(m.tourMaxPax)?` · max.${m.tourMaxPax}P`:''}</span>
        <span style="font-size:9px;padding:1px 5px;border-radius:5px;background:${nv.bg};color:${nv.c};flex-shrink:0">${nv.l}</span>
        <span style="font-size:10px;font-weight:700;color:${scColor};flex-shrink:0">${sc}%</span>
      </div>
      <div id="${rowId}" style="display:none;padding:8px 12px;background:#f8fafc">
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:5px">
          <span style="font-size:9px;color:#166534;font-weight:700;flex-shrink:0">🟢</span>
          ${gemArr.map(o=>`<span style="font-size:10px;padding:1px 6px;border-radius:6px;background:#dcfce7;color:#166534;font-weight:600">${e(o)}</span>`).join('')}
        </div>
        ${netzOnly.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:5px">
          <span style="font-size:9px;color:#854d0e;font-weight:700;flex-shrink:0">🟡</span>
          ${netzOnly.slice(0,6).map(o=>`<span style="font-size:10px;padding:1px 6px;border-radius:6px;background:#fef9c3;color:#854d0e">${e(o)}</span>`).join('')}
          <span style="font-size:9px;color:#94a3b8">= Veranstalter nicht dort</span>
        </div>` : ''}
        ${buildPitchArgument(k, tour, 'aktiv', gemeinsam)}
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${tour.url?`<a href="${e(tour.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none">Tour ansehen ↗</a>`:''}
          <button onclick="event.stopPropagation();togglePraesi('${k.id}','${tour.id}','${e(tour.name)}','${e(op.name)}','${e(tour.dest||'')}','${e(tour.url||'')}')"
            style="font-size:9px;padding:2px 8px;border-radius:5px;border:1px solid ${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'#166534':'#d1d5db'};background:${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'#f0fdf4':'#f8fafc'};color:${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'#166534':'#64748b'};cursor:pointer;font-family:inherit">
            ${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'✓ In Präsi':'＋ Zur Präsi'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f1f5f9">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:#0f172a">${e(reise.name)}</div>
        ${reise.typ ? `<div style="font-size:9px;color:#64748b;margin-top:1px">${e(reise.typ)}</div>` : ''}
      </div>
      <span style="font-size:9px;padding:2px 6px;border-radius:6px;background:#dcfce7;color:#166534;font-weight:600;flex-shrink:0">${matches.length} Match${matches.length!==1?'es':''}</span>
      <span style="font-size:11px;font-weight:700;color:${scoreColor};flex-shrink:0">${bestScore}%</span>
      ${reiseLink}
    </div>
    ${matchRows}
  </div>`;
}

// ── BLOCK 2 CARD ──────────────────────────────────────────

// ── PITCH ARGUMENT GENERATOR ─────────────────────────────
function buildPitchArgument(k, tour, destStatus, gemeinsamOrte) {
  const parts = [];
  const seg = (k.segment || '').split('/')[0].trim();
  const tourMaxPax = getTourMaxPax(tour);
  const tourOrte = getTourOrte(tour);
  const kundeOrte = getPortfolioOrte(k);
  const neueOrte = [...tourOrte].filter(o => !kundeOrte.has(o));
  const gemArr = gemeinsamOrte ? [...gemeinsamOrte] : [];

  // DNA fit sentence
  let dna = '';
  if (seg) dna += seg + '-Kunden';
  if (tourMaxPax) dna += (dna ? ', max. ' : 'Max. ') + tourMaxPax + 'P';
  if (tour.tage) dna += (dna ? ', ' : '') + tour.tage + 'T';
  if (dna) parts.push(dna);

  // Geo argument
  if (gemArr.length) parts.push('Match: ' + gemArr.slice(0,3).join(' · '));
  if (neueOrte.length) parts.push('Neu: ' + neueOrte.slice(0,2).join(' + '));

  // Implication: wettbewerber + destination
  const destL = (tour.dest || '').toLowerCase();
  const wettb = (k.wettbewerber || '').split('\n')[0].split(',')[0].trim();
  if (wettb && destStatus !== 'aktiv') {
    parts.push(e(wettb) + ' bietet ' + e(tour.dest) + ' bereits an');
  } else if (destStatus === 'aktiv') {
    parts.push('Aktive Destination — direkter Produkt-Fit');
  }

  if (!parts.length) return '';
  return `<div style="font-size:10px;color:#374151;background:#f9fafb;border-left:3px solid #d1d5db;border-radius:0 5px 5px 0;padding:4px 8px;margin-bottom:5px;line-height:1.5">
    💬 ${parts.join(' · ')}
  </div>`;
}

function buildBlock2Card(k, tour, op, destStatus, scoreData) {
  const nv = NV[tour.niveau] || NV.midrange;
  const scoreColor = scoreData.total >= 70 ? '#166534' : scoreData.total >= 50 ? '#d97706' : '#64748b';
  const destColor = destStatus === 'aktiv' ? '#166534' : '#854d0e';
  const destBg    = destStatus === 'aktiv' ? '#dcfce7' : '#fef9c3';
  const destLabel = destStatus === 'aktiv' ? 'Aktiv-Dest.' : 'Dünn besetzt';
  // Warm/kalt: based on destination status in Veranstalter portfolio
  const warmLabel = destStatus === 'aktiv' ? '🔥 warm' : destStatus === 'duenn' ? '🌡️ dünn' : '❄️ neu';
  const warmColor = destStatus === 'aktiv' ? '#b45309' : destStatus === 'duenn' ? '#0369a1' : '#6b7280';
  const warmBg    = destStatus === 'aktiv' ? '#fef3c7' : destStatus === 'duenn' ? '#e0f2fe' : '#f3f4f6';
  const tourOrte  = getTourOrte(tour);
  const kundeAlleOrte = getPortfolioOrte(k);
  const neueOrte  = [...tourOrte].filter(o => !kundeAlleOrte.has(o));
  const tooltipId = `tt2-${tour.id}-${Math.random().toString(36).slice(2,5)}`;
  const dotBar = val => Array.from({length:5},(_,i)=>`<span style="color:${i<Math.round(val*5)?'#166534':'#e2e8f0'};font-size:8px">●</span>`).join('');
  const isHighlight = neueOrte.length >= 3;

  return `<div style="background:#fff;border:${isHighlight?'2px solid #d97706':'1px solid #e2e8f0'};border-radius:9px;padding:11px 14px;margin-bottom:7px${isHighlight?';box-shadow:0 2px 8px #d9770618':''}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
      <div>
        <div style="font-size:12px;font-weight:600;color:#0f172a">${e(tour.name)}</div>
        <div style="font-size:11px;color:#64748b">${e(op.name)}${tour.tage?' · '+tour.tage+'T':''}</div>
      </div>
      <div style="display:flex;gap:4px;align-items:center">
        ${isHighlight?'<span style="font-size:9px;padding:2px 6px;border-radius:5px;background:#fef9c3;color:#854d0e;font-weight:700">★</span>':''}
        <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${warmBg};color:${warmColor};font-weight:700">${warmLabel}</span>
        <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${destBg};color:${destColor};font-weight:600">${destLabel}</span>
        <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${nv.bg};color:${nv.c};font-weight:600">${nv.l}</span>
        <div style="position:relative;display:inline-block;cursor:help"
          onmouseenter="document.getElementById('${tooltipId}').style.display='block'"
          onmouseleave="document.getElementById('${tooltipId}').style.display='none'">
          <span style="font-size:11px;font-weight:700;color:${scoreColor};padding:2px 6px;border-radius:5px;background:${scoreColor}18">${scoreData.total}%</span>
          <div id="${tooltipId}" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#0f172a;color:#fff;padding:8px 10px;border-radius:6px;z-index:100">${dotBar(scoreData.scores.geo)} Geo<br>${dotBar(scoreData.scores.segment)} Segment</div>
        </div>
      </div>
    </div>
    ${neueOrte.length ? `<div style="margin-bottom:5px">
      <span style="font-size:9px;font-weight:700;color:#854d0e">Neue Orte: </span>
      ${neueOrte.slice(0,6).map(o=>`<span style="font-size:10px;padding:1px 6px;border-radius:6px;background:#fef9c3;color:#854d0e">${e(o)}</span>`).join(' ')}
    </div>` : ''}

    ${buildPitchArgument(k, tour, destStatus, null)}
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      ${tour.url?`<a href="${e(tour.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none">Tour ansehen ↗</a>`:''}
      <button class="btn btn-xs btn-ghost" onclick="openTourFromMatch('${op.id}','${tour.id}')">Details</button>
      <button onclick="togglePraesi('${k.id}','${tour.id}','${e(tour.name)}','${e(op.name)}','${e(tour.dest||'')}','${e(tour.url||'')}')"
        style="font-size:9px;padding:2px 8px;border-radius:5px;border:1px solid ${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'#166534':'#d1d5db'};background:${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'#f0fdf4':'#f8fafc'};color:${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'#166534':'#64748b'};cursor:pointer;font-family:inherit">
        ${(k.praesentation||[]).some(p=>p.tourId==='${tour.id}')?'✓ In Präsi':'＋ Zur Präsi'}
      </button>
    </div>
  </div>`;
}

// ── PITCH TAB ─────────────────────────────────────────────
function buildPitchTab(k) {
  if (!window._pitchSubTab) window._pitchSubTab = 'matches';
  const subTab = window._pitchSubTab;

  const kPortfolioOrte = getPortfolioOrte(k);
  const kOrte = getVeranstalterOrte(k);
  const aktiv = (k.destinationen?.aktiv || []).map(d => d.toLowerCase());
  const duenn  = (k.destinationen?.duenn  || []).map(d => d.toLowerCase());

  // ── BUILD BLOCK 1: per Veranstalter-Tour → matching network tours ──
  // Structure: { land: [ { reise, matches: [{tour, op, gemeinsam}] } ] }
  const block1ByLand = {};
  FOCUS.forEach(l => { block1ByLand[l] = []; });

  const seenNetworkInB1 = new Set(); // track which network tours appear in Block 1

  Object.entries(k.fokusReisen || {}).forEach(([land, reisen]) => {
    reisen.forEach(reise => {
      const reiseOrte = getFokusReiseOrte(reise);
      if (!reiseOrte.size) return;

      const reiseMaxPax = extractMaxPax(reise.name || '');
      const matches = [];
      ops.forEach(op => {
        op.touren.forEach(tour => {
          const tourOrte = getTourOrte(tour);
          const gemeinsam = new Set([...reiseOrte].filter(o => tourOrte.has(o)));
          if (gemeinsam.size < 3) return;
          const scoreData = scoreMatch(k, tour, op, gemeinsam);
          // Refine group size score
          const tourMaxPax = getTourMaxPax(tour);
          scoreData.scores.groupsize = groupSizeScore(reiseMaxPax, tourMaxPax);
          scoreData.total = Math.round((
            scoreData.scores.geo*0.28 + scoreData.scores.segment*0.24 +
            scoreData.scores.reiseart*0.19 + scoreData.scores.thema*0.14 +
            scoreData.scores.ostafrica*0.10 + scoreData.scores.groupsize*0.05
          ) * 100);
          if (scoreData.total < 30) return;
          matches.push({ tour, op, gemeinsam, scoreData, reiseMaxPax, tourMaxPax });
          seenNetworkInB1.add(tour.id);
        });
      });

      if (!matches.length) return;
      matches.sort((a, b) => b.scoreData.total - a.scoreData.total);

      const destLand = FOCUS.includes(land) ? land : 'Sonstige';
      if (!block1ByLand[destLand]) block1ByLand[destLand] = [];
      block1ByLand[destLand].push({ reise, matches });
    });
  });

  const b1Count = Object.values(block1ByLand).reduce((s, arr) =>
    s + arr.reduce((s2, item) => s2 + item.matches.length, 0), 0);

  // ── BUILD BLOCK 2: dest-based missing tours ──
  const fokusNamen = new Set();
  Object.values(k.fokusReisen || {}).forEach(reisen =>
    reisen.forEach(r => fokusNamen.add((r.name || '').toLowerCase().trim()))
  );

  const block2 = [];
  const seenB2 = new Set();

  ops.forEach(op => {
    op.touren.forEach(tour => {
      if (seenB2.has(tour.id)) return;
      const destL = (tour.dest || '').toLowerCase();
      const isAktiv = aktiv.some(d => destL.includes(d) || d.includes(destL));
      const isDuenn  = duenn.some(d => destL.includes(d) || d.includes(destL));
      if (!isAktiv && !isDuenn) return;
      const inFokus = [...fokusNamen].some(fn => {
        const tl = tour.name.toLowerCase();
        return fn.includes(tl.slice(0,12)) || tl.includes(fn.slice(0,12));
      });
      if (inFokus) return;
      seenB2.add(tour.id);
      const scoreData = scoreMatch(k, tour, op, new Set());
      if (scoreData.total < 25) return;
      const tourOrte = getTourOrte(tour);
      const neueOrte = [...tourOrte].filter(o => !kPortfolioOrte.has(o));
      const uniqueness = neueOrte.length;
      block2.push({ tour, op, scoreData, destStatus: isAktiv ? 'aktiv' : 'duenn', uniqueness });
    });
  });
  // Merge lueckenTouren (no direct geo match) into block2
  ops.forEach(op => {
    op.touren.forEach(tour => {
      if (seenNetworkInB1.has(tour.id)) return;
      if (block2.find(x => x.tour.id === tour.id)) return;
      const tourOrte = getTourOrte(tour);
      let maxOverlap = 0;
      Object.values(k.fokusReisen || {}).forEach(reisen =>
        reisen.forEach(reise => {
          const rOrte = getFokusReiseOrte(reise);
          const overlap = [...rOrte].filter(o => tourOrte.has(o)).length;
          maxOverlap = Math.max(maxOverlap, overlap);
        })
      );
      if (maxOverlap >= 3) return;
      const destL = (tour.dest || '').toLowerCase();
      const isRelevant = aktiv.some(d => destL.includes(d) || d.includes(destL)) ||
                         duenn.some(d => destL.includes(d) || d.includes(destL)) ||
                         (kOrte.size > 0 && [...tourOrte].some(o => kOrte.has(o)));
      if (!isRelevant) return;
      const scoreData = scoreMatch(k, tour, op, new Set());
      if (scoreData.total < 25) return;
      const neueOrte = [...tourOrte].filter(o => !kPortfolioOrte.has(o));
      block2.push({ tour, op, scoreData, destStatus: aktiv.some(d=>destL.includes(d)||d.includes(destL))?'aktiv':'duenn', uniqueness: neueOrte.length });
    });
  });
  block2.sort((a, b) => (b.uniqueness - a.uniqueness) || (b.scoreData.total - a.scoreData.total));
  const lueckenTouren = []; // empty - merged into block2

  // ── RENDER ──
  let html = `<div style="position:sticky;top:0;z-index:10;background:#fff;padding:8px 0 0;margin-bottom:12px;border-bottom:2px solid #f1f5f9">
    <div style="display:flex;gap:2px">
      <button onclick="window._pitchSubTab='matches';renderVDetail()" style="padding:6px 14px;border:none;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;background:${subTab==='matches'?'#f0fdf4':'#f8fafc'};color:${subTab==='matches'?'#166534':'#64748b'};border-bottom:3px solid ${subTab==='matches'?'#166534':'transparent'}">
        🟢 Schnittmenge <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:${subTab==='matches'?'#dcfce7':'#e2e8f0'};margin-left:4px">${b1Count}</span>
      </button>
      <button onclick="window._pitchSubTab='luecken';renderVDetail()" style="padding:6px 14px;border:none;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;background:${subTab==='luecken'?'#fefce8':'#f8fafc'};color:${subTab==='luecken'?'#854d0e':'#64748b'};border-bottom:3px solid ${subTab==='luecken'?'#d97706':'transparent'}">
        🟡 Potentielle Touren <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:${subTab==='luecken'?'#fef9c3':'#e2e8f0'};margin-left:4px">${block2.length}</span>
      </button>
      <button onclick="window._pitchSubTab='pitch';renderVDetail()" style="padding:6px 14px;border:none;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;background:${subTab==='pitch'?'#eff6ff':'#f8fafc'};color:${subTab==='pitch'?'#1d4ed8':'#64748b'};border-bottom:3px solid ${subTab==='pitch'?'#2563eb':'transparent'}">
        📋 Pitch
      </button>
    </div>
  </div>`;

  // BLOCK 1 — Schnittmenge
  if (subTab === 'matches') {
    html += `<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #f0fdf4">
        <div style="width:10px;height:10px;border-radius:50%;background:#166534"></div>
        <div style="font-size:13px;font-weight:700">Touren mit Schnittmenge</div>
        <div style="font-size:10px;color:#64748b">≥3 gemeinsame Geo-Tags · 🟢 gemeinsam · 🟡 nur Netzwerk</div>
      </div>`;
    if (!b1Count) {
      html += `<div style="font-size:12px;color:#cbd5e1;padding:8px 0">Keine Matches — Fokus-Reisen ergänzen.</div>`;
    } else {
      FOCUS.forEach(land => {
        const items = block1ByLand[land];
        if (!items?.length) return;
        const dc2 = DC[land] || { bg:'#f1f5f9', c:'#334155' };
        html += `<div style="margin-bottom:16px">
          <div class="op-dest-label" style="color:${dc2.c};border-color:${dc2.bg};margin-bottom:8px">${land}</div>`;
        items.forEach(({ reise, matches }) => {
          html += buildBlock1Card(k, reise, matches);
        });
        html += `</div>`;
      });
    }
    html += `</div>`;
  }

  // BLOCK 2 — Potentielle Touren
  if (subTab === 'luecken') {
    html += `<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #fef9c3">
        <div style="width:10px;height:10px;border-radius:50%;background:#d97706"></div>
        <div style="font-size:13px;font-weight:700">Potentielle Touren — fehlen im Portfolio</div>
      </div>`;
    if (!block2.length) {
      html += `<div style="font-size:12px;color:#cbd5e1;padding:8px 0">Keine offenen Lücken — Destinationen ergänzen.</div>`;
    } else {
      block2.forEach(({ tour, op, scoreData, destStatus }) => {
        html += buildBlock2Card(k, tour, op, destStatus, scoreData);
      });
    }
    html += `</div>`;
  }

  // BLOCK 3 — Pitch & Lücken verwalten
  if (subTab === 'pitch') html += buildLueckenManagement(k, lueckenTouren);

  return html;
}



// ── PRÄSENTATION SELEKTION ────────────────────────────────
function togglePraesi(kundeId, tourId, tourName, opName, dest, url) {
  kunden = kunden.map(k => {
    if (k.id !== kundeId) return k;
    const list = k.praesentation || [];
    const exists = list.some(p => p.tourId === tourId);
    const newList = exists
      ? list.filter(p => p.tourId !== tourId)
      : [...list, { tourId, tourName, opName, dest, url, addedAt: new Date().toISOString() }];
    return { ...k, praesentation: newList };
  });
  save();
  renderVDetail();
}

function delPraesiItem(kundeId, tourId) {
  kunden = kunden.map(k => {
    if (k.id !== kundeId) return k;
    return { ...k, praesentation: (k.praesentation||[]).filter(p => p.tourId !== tourId) };
  });
  save(); renderVDetail();
}

function movePraesiItem(kundeId, tourId, dir) {
  kunden = kunden.map(k => {
    if (k.id !== kundeId) return k;
    const list = [...(k.praesentation||[])];
    const idx = list.findIndex(p => p.tourId === tourId);
    if (idx < 0) return k;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return k;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    return { ...k, praesentation: list };
  });
  save(); renderVDetail();
}

function exportPraesi(kundeId) {
  const k = kunden.find(x => x.id === kundeId);
  if (!k) return;
  const data = {
    praesiConfig: window.PRAESI_CONFIG,
    veranstalter: { id: k.id, name: k.name, segment: k.segment, zielgruppe: k.zielgruppe,
      gespraechseinstieg: k.gespraechseinstieg, ansprechpartner: k.ansprechpartner,
      position: k.position, email: k.email, telefon: k.telefon, homepage: k.homepage },
    netzwerkPartner: ops.map(op => ({
      id: op.id, name: op.name, land: op.land, url: op.url,
      beschreibung: op.beschreibung, zertifizierungen: op.zertifizierungen,
      inhaber: op.inhaber, gruendungsjahr: op.gruendungsjahr,
      staerken: op.staerken
    })),
    touren: k.praesentation || [],
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `KALI_Praesi_${k.name.replace(/[^a-zA-Z0-9]/g,'_')}.json`;
  a.click();
}

function buildPitchTopMatches(k) {
  // Get all block1 + block2 matches sorted by score, take top 3
  const kPortfolioOrte = getPortfolioOrte(k);
  const kOrte = getVeranstalterOrte(k);
  const aktiv = (k.destinationen?.aktiv || []).map(d => d.toLowerCase());
  const duenn  = (k.destinationen?.duenn  || []).map(d => d.toLowerCase());

  const allMatches = [];

  // Block 1 matches
  Object.entries(k.fokusReisen || {}).forEach(([land, reisen]) => {
    reisen.forEach(reise => {
      const reiseOrte = getFokusReiseOrte(reise);
      if (!reiseOrte.size) return;
      const reiseMaxPax = extractMaxPax(reise.name || '');
      ops.forEach(op => {
        op.touren.forEach(tour => {
          const tourOrte = getTourOrte(tour);
          const gemeinsam = new Set([...reiseOrte].filter(o => tourOrte.has(o)));
          if (gemeinsam.size < 3) return;
          const scoreData = scoreMatch(k, tour, op, gemeinsam);
          const tourMaxPax = getTourMaxPax(tour);
          scoreData.scores.groupsize = groupSizeScore(reiseMaxPax, tourMaxPax);
          scoreData.total = Math.round((
            scoreData.scores.geo*0.28 + scoreData.scores.segment*0.24 +
            scoreData.scores.reiseart*0.19 + scoreData.scores.thema*0.14 +
            scoreData.scores.ostafrica*0.10 + scoreData.scores.groupsize*0.05
          ) * 100);
          allMatches.push({ tour, op, scoreData, gemeinsam, reise, type: 'match', tourMaxPax });
        });
      });
    });
  });

  // Block 2 matches
  ops.forEach(op => {
    op.touren.forEach(tour => {
      const destL = (tour.dest || '').toLowerCase();
      const isRelevant = aktiv.some(d => destL.includes(d)||d.includes(destL)) ||
                         duenn.some(d => destL.includes(d)||d.includes(destL));
      if (!isRelevant) return;
      const scoreData = scoreMatch(k, tour, op, new Set());
      if (scoreData.total < 30) return;
      const destStatus = aktiv.some(d => destL.includes(d)||d.includes(destL)) ? 'aktiv' : 'duenn';
      allMatches.push({ tour, op, scoreData, gemeinsam: new Set(), reise: null, type: 'luecke', destStatus });
    });
  });

  // Sort by score, dedup, take top 3
  allMatches.sort((a, b) => b.scoreData.total - a.scoreData.total);
  const seen = new Set();
  const top3 = allMatches.filter(m => {
    if (seen.has(m.tour.id)) return false;
    seen.add(m.tour.id);
    return true;
  }).slice(0, 3);

  if (!top3.length) return '';

  // Generate Gesprächseinstieg from profile
  const gesprText = (k.gespraechseinstieg || '').split('\n')[0].slice(0, 100).trim();

  const cards = top3.map((m, i) => {
    const { tour, op, scoreData, gemeinsam, reise, type, tourMaxPax, destStatus } = m;
    const sc = scoreData.total;
    const scColor = sc >= 70 ? '#166534' : sc >= 50 ? '#d97706' : '#64748b';
    const nv = NV[tour.niveau] || NV.midrange;
    const gemArr = [...(gemeinsam || [])];
    const neueOrte = [...getTourOrte(tour)].filter(o => !getPortfolioOrte(k).has(o));
    const warmLabel = type === 'match' ? '🟢 Match' :
      (destStatus === 'aktiv' ? '🔥 warm' : destStatus === 'duenn' ? '🌡️ dünn' : '❄️ neu');

    // Proof line
    const proofParts = [];
    if (tour.tage) proofParts.push(tour.tage + 'T');
    if (tourMaxPax || m.tourMaxPax) proofParts.push('max. ' + (tourMaxPax || m.tourMaxPax) + 'P');
    if (gemArr.length) proofParts.push(gemArr.slice(0,2).join(' · '));
    if (neueOrte.length) proofParts.push('neu: ' + neueOrte.slice(0,2).join('+'));
    const proofLine = proofParts.join(' · ');

    // Gesprächseinstieg suggestion for this specific tour
    const seg = (k.segment || '').split('/')[0].trim();
    let gesprVorschlag = '';
    if (gesprText) {
      gesprVorschlag = gesprText;
    } else if (seg) {
      gesprVorschlag = seg + '-Kunden suchen ' + (gemArr[0] || tour.dest) + ' — diese Tour passt direkt';
    }

    const rankBadge = i === 0
      ? '<span style="font-size:10px;padding:2px 7px;border-radius:5px;background:#fef3c7;color:#92400e;font-weight:700">🥇 Top Pick</span>'
      : i === 1
      ? '<span style="font-size:10px;padding:2px 7px;border-radius:5px;background:#f1f5f9;color:#475569;font-weight:600">🥈</span>'
      : '<span style="font-size:10px;padding:2px 7px;border-radius:5px;background:#f1f5f9;color:#475569;font-weight:600">🥉</span>';

    return `<div style="background:#fff;border:${i===0?'2px solid #d97706':'1px solid #e2e8f0'};border-radius:10px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        ${rankBadge}
        <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:#f1f5f9;color:#475569">${warmLabel}</span>
        <span style="font-size:9px;padding:2px 6px;border-radius:5px;background:${nv.bg};color:${nv.c}">${nv.l}</span>
        <span style="font-size:11px;font-weight:700;color:${scColor};margin-left:auto">${sc}%</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:2px">${e(tour.name)}</div>
      <div style="font-size:10px;color:#64748b;margin-bottom:6px">${e(op.name)}${proofLine ? ' · ' + proofLine : ''}</div>
      ${gemArr.length ? `<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:6px">${gemArr.slice(0,4).map(o=>`<span style="font-size:10px;padding:1px 6px;border-radius:6px;background:#dcfce7;color:#166534;font-weight:600">${e(o)}</span>`).join('')}</div>` : ''}
      ${gesprVorschlag ? `<div style="font-size:10px;color:#374151;background:#fffbeb;border-left:3px solid #d97706;border-radius:0 5px 5px 0;padding:4px 8px;margin-bottom:6px">
        💬 ${e(gesprVorschlag.slice(0,120))}${gesprVorschlag.length>120?'…':''}
      </div>` : ''}
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        ${tour.url?`<a href="${e(tour.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none">Tour ansehen ↗</a>`:''}
        ${reise?.url?`<a href="${e(reise.url)}" target="_blank" style="font-size:10px;color:#64748b;text-decoration:none">Veranstalter-Tour ↗</a>`:''}
        <button onclick="togglePraesi('${k.id}','${tour.id}','${e(tour.name)}','${e(op.name)}','${e(tour.dest||'')}','${e(tour.url||'')}')"
          style="font-size:9px;padding:2px 8px;border-radius:5px;border:1px solid ${(k.praesentation||[]).some(p=>p.tourId===tour.id)?'#166534':'#d1d5db'};background:${(k.praesentation||[]).some(p=>p.tourId===tour.id)?'#f0fdf4':'#f8fafc'};color:${(k.praesentation||[]).some(p=>p.tourId===tour.id)?'#166534':'#64748b'};cursor:pointer;font-family:inherit">
          ${(k.praesentation||[]).some(p=>p.tourId===tour.id)?'✓ In Präsi':'＋ Zur Präsi'}
        </button>
      </div>
    </div>`;
  }).join('');

  return `<div style="margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #fef3c7">
      <div style="width:10px;height:10px;border-radius:50%;background:#d97706"></div>
      <div style="font-size:13px;font-weight:700">Top-Pitch — beste Matches für dein Gespräch</div>
    </div>
    ${cards}
  </div>`;
}

function buildLueckenManagement(k, lueckenTouren) {
  // Präsi-Liste section
  const praesiList = k.praesentation || [];
  const praesiHtml = `<div style="margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:700">Präsentation</div>
      <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:${praesiList.length?'#dbeafe':'#f1f5f9'};color:${praesiList.length?'#1d4ed8':'#64748b'};font-weight:600">${praesiList.length} Tour${praesiList.length!==1?'en':''}</span>
      ${praesiList.length?`<button onclick="exportPraesi('${k.id}')" style="margin-left:auto;font-size:10px;padding:4px 10px;border-radius:6px;background:#1d4ed8;color:#fff;border:none;cursor:pointer;font-family:inherit;font-weight:600">⬇ JSON exportieren</button>`:''}
    </div>
    ${praesiList.length ? praesiList.map((p,i) => `
      <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:4px">
        <div style="display:flex;flex-direction:column;gap:1px">
          <button onclick="movePraesiItem('${k.id}','${p.tourId}',-1)" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:10px;line-height:1;padding:0" ${i===0?'disabled':''}>▲</button>
          <button onclick="movePraesiItem('${k.id}','${p.tourId}',1)" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:10px;line-height:1;padding:0" ${i===praesiList.length-1?'disabled':''}>▼</button>
        </div>
        <div style="font-size:10px;color:#94a3b8;font-weight:700;min-width:18px">${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e(p.tourName)}</div>
          <div style="font-size:10px;color:#64748b">${e(p.opName)} · ${e(p.dest)}</div>
        </div>
        ${p.url?`<a href="${e(p.url)}" target="_blank" style="font-size:10px;color:#2563eb;text-decoration:none;flex-shrink:0">↗</a>`:''}
        <button onclick="delPraesiItem('${k.id}','${p.tourId}')" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:13px;flex-shrink:0">✕</button>
      </div>`).join('')
    : '<div style="font-size:11px;color:#94a3b8;font-style:italic;padding:8px 0">Noch keine Touren ausgewählt — in Schnittmenge oder Potentielle Touren ＋ Zur Präsi klicken.</div>'}
  </div>`;

  return `
  ${buildPitchTopMatches(k)}
  ${praesiHtml}
  <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
  <div style="font-size:13px;font-weight:700;color:#64748b;margin-bottom:12px">Produktlücken & Pitch-Ideen verwalten</div>

  ${(k.luecken || []).map(l => {
    const pr = PRIO[l.prio] || PRIO.niedrig;
    return `<div style="margin-bottom:10px">
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
          <button style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:13px"
            onclick="pushHistory();delLuecke('${l.id}')">✕</button>
        </div>
        <textarea rows="2" style="background:transparent;border-color:rgba(0,0,0,0.1);font-size:12px"
          onchange="updLuecke('${l.id}','beschreibung',this.value)">${e(l.beschreibung || '')}</textarea>
      </div>
    </div>`;
  }).join('')}

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

  <div style="margin-top:16px">
    <div class="clabel">Pitch-Ideen</div>
    ${(k.pitchIdeen || []).map(p => `
      <div style="display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:1px solid #f1f5f9">
        <div style="flex:1;font-size:12px;color:#334155">${e(p.text)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${(p.tags||[]).map(t => `<span style="font-size:9px;padding:1px 5px;border-radius:7px;background:#f1f5f9;color:#475569">${e(t)}</span>`).join('')}
        </div>
        <button style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:11px;flex-shrink:0"
          onclick="pushHistory();delPitch('${p.id}')">✕</button>
      </div>`).join('')}
    <div style="display:flex;gap:7px;margin-top:8px">
      <input class="ifield" id="np-text" placeholder="Neue Pitch-Idee…" style="flex:1"
        onkeydown="if(event.key==='Enter'){pushHistory();addPitch()}">
      <button class="btn btn-primary" onclick="pushHistory();addPitch()">+</button>
    </div>
  </div>`;
}


// ── IV DISPLAY ────────────────────────────────────────────
function buildIVDisplay(ivText, idx) {
  if (!ivText || !ivText.trim()) {
    return `<div><div style="font-size:11px;color:#94a3b8;font-style:italic;margin-bottom:6px">Noch kein IV eingefügt.</div><button class="btn btn-ghost btn-sm" onclick="openIVPaste(${idx})">📋 IV einfügen</button></div>`;
  }
  const slides = [];
  const parts = ivText.split(/(?=F\d+\s*[—–-])/);
  parts.forEach(part => {
    const m = part.match(/^(F\d+)\s*[—–-]\s*(.+?)\s*[·•:]\s*(.*)$/s);
    if (m) slides.push({ nr: m[1], title: m[2].trim(), content: m[3].trim() });
    else { const m2 = part.match(/^(F\d+)\s*[—–-]\s*(.+)$/s); if (m2) slides.push({ nr: m2[1], title: m2[2].split(/[·•]/)[0].trim(), content: m2[2].split(/[·•]/).slice(1).join(' · ').trim() }); }
  });
  if (!slides.length) return `<div><div style="font-size:11px;color:#64748b;white-space:pre-wrap;max-height:120px;overflow:auto;background:#f8fafc;border-radius:6px;padding:8px;margin-bottom:6px">${e(ivText)}</div><button class="btn btn-ghost btn-sm" onclick="openIVPaste(${idx})">✏ Bearbeiten</button></div>`;
  const collapseId = 'iv-collapse-' + idx;
  const tableRows = slides.map(s => `<tr><td style="padding:5px 8px;font-weight:700;font-size:11px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f1f5f9">${e(s.nr)}</td><td style="padding:5px 8px;font-weight:600;font-size:11px;vertical-align:top;border-bottom:1px solid #f1f5f9">${e(s.title)}</td><td style="padding:5px 8px;font-size:11px;color:#64748b;vertical-align:top;border-bottom:1px solid #f1f5f9">${e(s.content)}</td></tr>`).join('');
  return `<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><button onclick="toggleIVCollapse('${collapseId}')" style="background:none;border:none;cursor:pointer;font-size:11px;color:#475569;display:flex;align-items:center;gap:5px;font-family:inherit;padding:0"><span id="${collapseId}-arrow" style="font-size:10px;transition:transform 0.15s">▶</span><span>${slides.length} Folien anzeigen</span></button><button class="btn btn-ghost btn-sm" onclick="openIVPaste(${idx})">✏ Bearbeiten</button></div><div id="${collapseId}" style="display:none;overflow-x:auto;border-radius:6px;border:1px solid #e2e8f0;margin-top:4px"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f8fafc"><th style="padding:5px 8px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">#</th><th style="padding:5px 8px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Folie</th><th style="padding:5px 8px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Inhalt</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`;
}

function toggleRotDeaktiv(id) {
  kunden = kunden.map(k => k.id === id ? { ...k, rotDeaktiviert: !k.rotDeaktiviert } : k);
  save();
  renderV();
}

function toggleIVCollapse(id){const el=document.getElementById(id);const a=document.getElementById(id+'-arrow');if(!el)return;const o=el.style.display!=='none';el.style.display=o?'none':'block';if(a)a.style.transform=o?'':'rotate(90deg)';}
let _ivEditIdx=null;
function openIVPaste(idx){_ivEditIdx=idx;const k=kunden.find(x=>x.id===aktuelleId);if(!k)return;const u=(k.vertriebsUnterlagen||[])[idx];const current=u?(u.iv||''):'';let modal=document.getElementById('iv-paste-modal');if(!modal){modal=document.createElement('div');modal.id='iv-paste-modal';modal.style.cssText='position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center';document.body.appendChild(modal);}modal.innerHTML=`<div style="background:#fff;border-radius:12px;padding:24px;width:640px;max-height:80vh;display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:14px;font-weight:700">IV einfügen / bearbeiten</div><button onclick="closeIVModal()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8">✕</button></div><textarea id="iv-paste-area" rows="14" style="font-size:12px;font-family:monospace;resize:vertical;line-height:1.6;border:1px solid #e2e8f0;border-radius:6px;padding:8px" spellcheck="false">${e(current)}</textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost" onclick="closeIVModal()">Abbrechen</button><button class="btn btn-primary" onclick="saveIVFromModal()">Speichern</button></div></div>`;modal.style.display='flex';setTimeout(()=>document.getElementById('iv-paste-area')?.focus(),50);}
function closeIVModal(){const m=document.getElementById('iv-paste-modal');if(m)m.style.display='none';}
function saveIVFromModal(){const val=document.getElementById('iv-paste-area')?.value||'';updIV(_ivEditIdx,val);closeIVModal();save();renderVDetail();}

// ── PROFIL PASTE ──────────────────────────────────────────
function openProfilPaste(kundeId){let modal=document.getElementById('profil-paste-modal');if(!modal){modal=document.createElement('div');modal.id='profil-paste-modal';modal.style.cssText='position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center';document.body.appendChild(modal);}modal.innerHTML=`<div style="background:#fff;border-radius:12px;padding:24px;width:660px;max-height:85vh;display:flex;flex-direction:column;gap:12px;overflow-y:auto"><div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0"><div style="font-size:14px;font-weight:700">Profil-Ergebnis einfügen</div><button onclick="closeProfilModal()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8">✕</button></div><div style="font-size:12px;color:#64748b;flex-shrink:0">Claude-Output einfügen → Parsen → Übernehmen (6 Abschnitte).</div><textarea id="profil-raw-input" rows="14" style="font-size:12px;resize:vertical;line-height:1.6;border:1px solid #e2e8f0;border-radius:6px;padding:8px;flex-shrink:0" placeholder="Hier den Claude-Output einfügen…"></textarea><div id="profil-parse-preview" style="display:none;flex-shrink:0"></div><div style="display:flex;gap:8px;justify-content:flex-end;flex-shrink:0"><button class="btn btn-ghost" onclick="closeProfilModal()">Abbrechen</button><button class="btn btn-ghost" onclick="parseProfilPreview()">🔍 Parsen</button><button class="btn btn-primary" id="profil-apply-btn" style="display:none" onclick="applyProfilParse('${kundeId}')">✓ Übernehmen</button></div></div>`;modal.style.display='flex';setTimeout(()=>document.getElementById('profil-raw-input')?.focus(),50);}
function closeProfilModal(){const m=document.getElementById('profil-paste-modal');if(m)m.style.display='none';}
let _parsedProfil={};
function parseProfilPreview(){
  const raw=document.getElementById('profil-raw-input')?.value||'';
  _parsedProfil={};
  const parts=raw.split(/\n(?=\d+\.\s)/);
  const sectionMap={1:'zielgruppe',2:'vertrieb',3:'wettbewerber',4:'ostafrika',5:'gespraechseinstieg',6:'staerken_text'};
  const labelMap={zielgruppe:'Zielgruppe',vertrieb:'Vertriebskanäle',wettbewerber:'Wettbewerber',ostafrika:'Ostafrika-Schwerpunkt',gespraechseinstieg:'Gesprächseinstieg',staerken_text:'Stärken & Nischen'};
  parts.forEach(part=>{const m=part.match(/^(\d+)\.\s+[^\n]+\n([\s\S]*)$/);if(!m)return;const key=sectionMap[parseInt(m[1])];if(!key)return;const content=m[2].trim().replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\n{3,}/g,'\n\n').trim();if(content)_parsedProfil[key]=content;});
  const preview=document.getElementById('profil-parse-preview');const applyBtn=document.getElementById('profil-apply-btn');if(!preview)return;
  const found=Object.keys(_parsedProfil).length;
  if(!found){preview.style.display='block';preview.innerHTML='<div style="padding:10px;background:#fef2f2;border-radius:6px;font-size:12px;color:#dc2626">Keine Abschnitte erkannt.</div>';if(applyBtn)applyBtn.style.display='none';return;}
  const order=['zielgruppe','vertrieb','wettbewerber','ostafrika','gespraechseinstieg','staerken_text'];
  const rows=order.map(key=>{const val=_parsedProfil[key];return`<tr><td style="padding:6px 8px;font-weight:600;font-size:11px;color:#334155;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f1f5f9;width:140px">${labelMap[key]}</td><td style="padding:6px 8px;font-size:11px;color:${val?'#0f172a':'#94a3b8'};vertical-align:top;border-bottom:1px solid #f1f5f9">${val?e(val.slice(0,200))+(val.length>200?'…':''):'— nicht erkannt —'}</td></tr>`;}).join('');
  preview.style.display='block';preview.innerHTML=`<div style="font-size:11px;font-weight:600;color:#166534;margin-bottom:6px">✓ ${found} von 6 Abschnitten erkannt</div><div style="border-radius:6px;border:1px solid #e2e8f0;overflow:hidden"><table style="width:100%;border-collapse:collapse">${rows}</table></div>`;
  if(applyBtn)applyBtn.style.display='';
}
function applyProfilParse(kundeId){kunden=kunden.map(k=>{if(k.id!==kundeId)return k;const mf=new Set(k._manualFields||[]);const updates={};Object.entries(_parsedProfil).forEach(([key,val])=>{updates[key]=val;mf.add(key);});return{...k,...updates,_manualFields:[...mf]};});save();closeProfilModal();renderVDetail();}
function vfClick(btn){toggleFieldVerified(btn.dataset.kid,btn.dataset.field);}
function toggleFieldVerified(kundeId,field){kunden=kunden.map(k=>{if(k.id!==kundeId)return k;const vf=new Set(k._verifiedFields||[]);if(vf.has(field))vf.delete(field);else vf.add(field);return{...k,_verifiedFields:[...vf]};});save();renderVDetail();}
function autoResize(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}

// ── STANDALONE EMAIL ──────────────────────────────────────
function buildStandaloneEmailZone(k){const emails=k.standaloneEmails||[];const zonesHtml=emails.map((em,i)=>{const cid=`standalone-email-${k.id}-${i}`;return`<div style="margin-bottom:8px;border:1px solid ${em.inhalt?'#86efac':'#e2e8f0'};border-radius:8px;background:${em.inhalt?'#f0fdf4':'#fafafa'}"><div style="display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:pointer" onclick="toggleEmailExtra('${cid}')"><span id="${cid}-arrow" style="font-size:10px;color:#64748b">${em.inhalt?'▼':'▶'}</span><span style="font-size:11px;font-weight:600;color:#334155;flex:1">${em.inhalt?e(em.inhalt.split('\n')[0].slice(0,60))+(em.inhalt.length>60?'…':''):'E-Mail '+(i+1)}</span><button onclick="event.stopPropagation();clearStandaloneEmail(${i})" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:13px">✕</button></div><div id="${cid}" style="display:${em.inhalt?'block':'none'}"><div style="font-size:11px;line-height:1.6;color:#334155;white-space:pre-wrap;padding:0 12px 10px;max-height:200px;overflow-y:auto">${em.inhalt?e(em.inhalt):''}</div></div></div>`;}).join('');return`<div>${zonesHtml}<div id="standalone-drop-${k.id}" ondragover="event.preventDefault();this.style.background='#eff6ff';this.style.borderColor='#2563eb'" ondragleave="this.style.background='';this.style.borderColor=''" ondrop="handleStandaloneEmailDrop(event,'${k.id}')" style="border:2px dashed #e2e8f0;border-radius:8px;padding:14px 10px;background:#fafafa;text-align:center;transition:all 0.15s"><div style="color:#94a3b8;font-size:11px;pointer-events:none">📧 E-Mail hierher ziehen<br><span style="font-size:10px">.eml-Datei oder markierten Text</span></div></div></div>`;}
function toggleEmailExtra(id){const el=document.getElementById(id);const a=document.getElementById(id+'-arrow');if(!el)return;const o=el.style.display!=='none';el.style.display=o?'none':'block';if(a)a.textContent=o?'▶':'▼';}
async function handleStandaloneEmailDrop(event,kundeId){event.preventDefault();const zone=document.getElementById(`standalone-drop-${kundeId}`);if(zone){zone.style.background='';zone.style.borderColor='';}const text=await extractEmailContent(event.dataTransfer);if(!text)return;kunden=kunden.map(k=>{if(k.id!==kundeId)return k;const mf=new Set(k._manualFields||[]);mf.add('standaloneEmails');const emails=[...(k.standaloneEmails||[]),{inhalt:text,datum:new Date().toLocaleDateString('de-DE')}];return{...k,standaloneEmails:emails,_manualFields:[...mf]};});save();renderVDetail();}
function clearStandaloneEmail(idx){kunden=kunden.map(k=>{if(k.id!==aktuelleId)return k;return{...k,standaloneEmails:(k.standaloneEmails||[]).filter((_,i)=>i!==idx)};});save();renderVDetail();}


async function extractEmailContent(dt) {
  const files = [...(dt.files || [])];
  for (const f of files) {
    if (f.name.endsWith('.eml') || f.type === 'message/rfc822' || f.type === '') {
      return parseEml(await f.text());
    }
    if (f.type.startsWith('text/')) { return await f.text(); }
  }
  const p = dt.getData('text/plain');
  if (p && p.trim()) return p.trim();
  return null;
}

function parseEml(raw) {
  raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  raw = raw.replace(/^(X-Mozilla-[^\n]*\n|>?From [^\n]*\n)*/i, '');
  function decodeWord(s) {
    if (!s) return '';
    return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs, enc, data) => {
      try {
        if (enc.toUpperCase() === 'B') { const b = atob(data.replace(/_/g,' ')); return decodeURIComponent(escape(b)); }
        else { return data.replace(/_/g,' ').replace(/=([0-9A-Fa-f]{2})/g, (_,h) => String.fromCharCode(parseInt(h,16))); }
      } catch(e) { return data; }
    });
  }
  function getHeader(hdrs, name) {
    const re = new RegExp('^' + name + ':[ \t]*(.+?)(?=\n\S|$)', 'im');
    const m = (hdrs + '\n').match(re);
    return m ? decodeWord(m[1].replace(/\n[ \t]+/g,' ').trim()) : '';
  }
  const hEnd = raw.indexOf('\n\n');
  const mainHeaders = hEnd >= 0 ? raw.slice(0, hEnd) : raw;
  const fullBody    = hEnd >= 0 ? raw.slice(hEnd + 2) : '';
  const from    = getHeader(mainHeaders, 'From');
  const to      = getHeader(mainHeaders, 'To');
  const subject = getHeader(mainHeaders, 'Subject');
  const date    = getHeader(mainHeaders, 'Date');

  function decodeAllBase64Blocks(text) {
    const results = [];
    const blockRe = /(?:^|\n)((?:[A-Za-z0-9+/]{20,}={0,2}\n){3,}[A-Za-z0-9+/]+=*)/gm;
    let m;
    while ((m = blockRe.exec(text)) !== null) {
      try {
        const cleaned = m[1].replace(/\s+/g, '');
        if (!/^[A-Za-z0-9+/]+=*$/.test(cleaned)) continue;
        const bytes = atob(cleaned);
        let decoded;
        try { decoded = decodeURIComponent(escape(bytes)); } catch(e) { decoded = bytes; }
        if (decoded.slice(0,4).includes('PNG') || decoded.slice(0,3) === 'GIF') continue;
        let printable = 0;
        for (let ci = 0; ci < decoded.length; ci++) {
          const cc = decoded.charCodeAt(ci);
          if (cc >= 32 && cc < 127 || cc === 10 || cc === 13 || cc > 160) printable++;
        }
        if (printable / decoded.length > 0.75 && decoded.length > 50) results.push(decoded.trim());
      } catch(e) {}
    }
    return results;
  }

  const textBlocks = decodeAllBase64Blocks(raw);
  let bodyText = '';
  if (textBlocks.length > 0) {
    bodyText = textBlocks.sort((a, b) => b.length - a.length)[0];
    bodyText = bodyText.replace(/\[cid:[^\]]+\]/g, '').replace(/https?:\/\/\S+/g, '')
      .replace(/_{10,}/g, '---').replace(/\n{4,}/g, '\n\n\n').slice(0, 3000).trim();
  } else {
    bodyText = fullBody
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<o:p[^>]*>.*?<\/o:p>/gi, '')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/\[cid:[^\]]+\]/g, '').replace(/https?:\/\/\S+/g, '')
      .replace(/[ \t]{2,}/g, ' ').replace(/\n{4,}/g, '\n\n')
      .split('\n').map(l => l.trim()).join('\n').slice(0, 3000).trim();
  }
  if (bodyText.includes('<html') || bodyText.includes('<p ') || bodyText.includes('<div')) {
    bodyText = bodyText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{4,}/g, '\n\n').split('\n').map(l => l.trim()).join('\n').trim();
  }
  return `Von: ${from}\nAn: ${to}\nBetreff: ${subject}\nDatum: ${date}\n\n${bodyText}`;
}


function buildGespraechTab(k) {
  const nText  = k.gespraechsNotizen || '';
  const nsText = k.nextSteps || '';
  return `
    <div class="card">
      <div class="clabel">Letzter Kontakt</div>
      <input type="date" class="ifield" style="width:auto" value="${e(k.letzterKontakt || '')}"
        onchange="updK('letzterKontakt',this.value);save();renderV()">
    </div>
    <div class="card">
      <div class="clabel">Versendete Vertriebsunterlagen</div>
      ${(k.vertriebsUnterlagen||[]).length ? (k.vertriebsUnterlagen||[]).map((u,i) =>
        `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;flex-direction:column">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="flex:1;font-weight:500">${e(u.dateiname)}</span>
            <span style="color:#94a3b8;font-size:11px">versendet ${e(u.datum)}</span>
            <button class="btn btn-xs btn-danger" onclick="pushHistory();loescheUnterlagen(${i})">✕</button>
          </div>
          <textarea style="width:100%;font-size:11px;padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;line-height:1.7;font-family:monospace;resize:vertical;min-height:120px" rows="6"
            placeholder="IV hier einfügen (aus Claude kopieren)…" onchange="updIV(${i},this.value)">${e(u.iv||'')}</textarea>
        </div>`).join('') : '<div style="font-size:12px;color:#94a3b8;font-style:italic;padding:4px 0">Noch keine Unterlagen versendet.</div>'}
      <div style="margin-top:8px">
        <button class="btn btn-ghost btn-sm" onclick="addUnterlagenEintrag('${k.id}')">+ Unterlage manuell eintragen</button>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="clabel" style="margin:0">Gesprächsnotizen</div>
        <button class="btn btn-ghost btn-sm" onclick="editNotiz=!editNotiz;renderVDetail()">${editNotiz ? 'Schließen' : 'Bearbeiten'}</button>
      </div>
      ${editNotiz
        ? `<textarea id="notiz-input" rows="6" spellcheck="true" lang="de" onchange="updK('gespraechsNotizen',this.value)">${e(nText)}</textarea>
           <div style="margin-top:6px"><button class="btn btn-primary btn-sm" onclick="editNotiz=false;save();renderVDetail()">Speichern</button></div>`
        : `<div class="notiz-display${!nText ? ' notiz-leer' : ''}">${nText ? e(nText) : 'Noch keine Notizen.'}</div>`}
    </div>
    <div class="card">
      <div class="clabel">Nächster Kontakt</div>
      <input type="date" class="ifield" style="width:auto" value="${e(k.naechsterKontakt || '')}"
        onchange="updK('naechsterKontakt',this.value);save();renderV()">
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="clabel" style="margin:0">Next Steps</div>
        <button class="btn btn-ghost btn-sm" onclick="editNext=!editNext;renderVDetail()">${editNext ? 'Schließen' : 'Bearbeiten'}</button>
      </div>
      ${editNext
        ? `<textarea id="next-input" rows="5" spellcheck="true" lang="de" onchange="updK('nextSteps',this.value)">${e(nsText)}</textarea>
           <div style="margin-top:6px"><button class="btn btn-primary btn-sm" onclick="editNext=false;save();renderVDetail()">Speichern</button></div>`
        : `<div class="notiz-display${!nsText ? ' notiz-leer' : ''}">${nsText ? e(nsText) : 'Noch keine Next Steps.'}</div>`}
    </div>
    <div class="card">
      <div class="clabel" style="margin-bottom:8px">Antwort-E-Mails</div>
      ${buildStandaloneEmailZone(k)}
    </div>`;
}


// ── FILTER BAR (Veranstalter/Pitch) ───────────────────────

// ── RESTORED ─────────────────────────────────────────────
function selK(id) { aktuelleId = id; vAnsicht = 'detail'; vTab = 'profil'; editNotiz = false; editNext = false; renderV(); }

function swVTab(t) { vTab = t; editNotiz = false; editNext = false; document.getElementById('filter-bar-wrap').innerHTML = ''; renderVDetail(); }

function renderFilterBarV() {
  const existing = document.getElementById('v-filter-bar');
  if (existing) return; // Already rendered - don't touch it
  document.getElementById('filter-bar-wrap').innerHTML = `<div class="filter-bar">
    <input type="text" id="v-filter-bar" placeholder="Pitch-Ideen durchsuchen…" value=""
      oninput="window.fSuche=this.value;updatePitchOnly()" style="margin-left:auto;width:220px">
  </div>`;
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

function updK(field, val) {
  kunden = kunden.map(k => {
    if (k.id !== aktuelleId) return k;
    const mf = new Set(k._manualFields || []);
    mf.add(field);
    return { ...k, [field]: val, _manualFields: [...mf] };
  });
}

function zeigeNeuV() { vAnsicht = 'neu'; renderV(); }

function setStatus(id, s) { kunden = kunden.map(k => k.id === id ? { ...k, status: s } : k); save(); renderV(); }

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

function addFokusReise(dest) {
  const n = document.getElementById(`fr-name-${dest}`)?.value?.trim();
  const u = document.getElementById(`fr-url-${dest}`)?.value?.trim();
  const t = document.getElementById(`fr-typ-${dest}`)?.value?.trim();
  if (!n) return;
  kunden = kunden.map(k => {
    if (k.id !== aktuelleId) return k;
    const fr = { ...k.fokusReisen };
    const mf = new Set(k._manualFields || []);
    mf.add('fokusReisen');
    fr[dest] = [...(fr[dest] || []), { name: n, url: u || '', typ: t || '' }];
    return { ...k, fokusReisen: fr, _manualFields: [...mf] };
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

function delK(id) {
  if (!confirm('Wirklich löschen?')) return;
  pushHistory();
  kunden     = kunden.filter(k => k.id !== id);
  aktuelleId = kunden.length ? kunden[0].id : null;
  save(); renderV();
}

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

function saveRadar(id) {
  const r = localRadar[id]; if (!r) return;
  kunden = kunden.map(k => k.id === id ? { ...k, radar: { ...r } } : k);
  save();
}

function saveScore2(id) {
  const s = localScore[id]; if (!s) return;
  kunden = kunden.map(k => k.id === id ? { ...k, score: { ...s } } : k);
  save();
}

function updLuecke(lid, field, val) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, luecken: (k.luecken || []).map(l => l.id === lid ? { ...l, [field]: val } : l) }
    : k);
  save();
}

function updPitch(pid, field, val) {
  kunden = kunden.map(k => k.id === aktuelleId
    ? { ...k, pitchIdeen: (k.pitchIdeen || []).map(p => p.id === pid ? { ...p, [field]: val } : p) }
    : k);
  save();
}

function updRadar(id, key, val) {
  if (!localRadar[id]) localRadar[id] = {};
  localRadar[id][key] = parseInt(val);
  const rv = document.getElementById('rv-' + key); if (rv) rv.textContent = val;
  const rf = document.getElementById('rf-' + key); if (rf) rf.style.width = (parseInt(val)/5*100) + '%';
}

function updScore2(id, key, val) {
  if (!localScore[id]) localScore[id] = {};
  localScore[id][key] = parseInt(val);
  const sv  = document.getElementById('sv-' + key); if (sv) sv.textContent = val;
  const sf  = document.getElementById('sc-' + key); if (sf) sf.style.width = (parseInt(val)/5*100) + '%';
  const tot = Object.values(localScore[id]).reduce((a, b) => a + b, 0);
  const st  = document.getElementById('sc-total'); if (st) st.textContent = tot + '/10';
}

function updatePitchOnly() {
  // Only re-render the pitch tab content, not the whole page
  const k = kunden.find(x => x.id === aktuelleId);
  if (!k || vTab !== 'pitchlücken') return;
  const el = document.getElementById('pitch-content');
  if (el) { el.innerHTML = buildPitchTab(k); }
  else renderVDetail();
}

// ── NEU FORMULAR ──────────────────────────────────────────

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


