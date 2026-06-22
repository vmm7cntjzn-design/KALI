# -*- coding: utf-8 -*-
"""
KALI – Wetu Patch Script
Aktualisiert Adventure Expeditions Touren in kali_export.json
und erstellt kalikollektiv.de/destinations/ HTML-Seiten.

Ausführen:
  python kali_patch_wetu.py

Voraussetzung:
  - kali_export.json im selben Ordner (automatischer Server-Save)
  - wetu_ae_kenia_v2.json im selben Ordner
"""

import json, re, os, shutil
from pathlib import Path

DIR = Path(__file__).parent
KALI_FILE = DIR / 'kali_export.json'
WETU_FILE = DIR / 'wetu_ae_kenia_v2.json'
DEST_DIR  = DIR / 'kalikollektiv' / 'destinations'

# ── Laden ───────────────────────────────────────────────

def load():
    if not KALI_FILE.exists():
        print(f"✗ {KALI_FILE} nicht gefunden!")
        print("  Bitte KALI öffnen und ↻ Aktualisieren klicken.")
        exit(1)
    if not WETU_FILE.exists():
        print(f"✗ {WETU_FILE} nicht gefunden!")
        print("  Bitte wetu_scraper_v2.py zuerst ausführen.")
        exit(1)
    with open(KALI_FILE, encoding='utf-8') as f:
        kali = json.load(f)
    with open(WETU_FILE, encoding='utf-8') as f:
        wetu = json.load(f)
    return kali, wetu

# ── Name-Matching ────────────────────────────────────────

def normalize(s):
    s = re.sub(r'^20\d\d\s*[-–]?\s*', '', s)      # Jahreszahl entfernen
    s = re.sub(r'\b\d+\s*(days?|tage?)\b', '', s, flags=re.I)
    s = re.sub(r'[^a-z0-9 ]', '', s.lower())
    return ' '.join(s.split())

def match_score(a, b):
    a_words = set(normalize(a).split())
    b_words = set(normalize(b).split())
    stop = {'days','day','kenya','safari','the','and','of','in','with','to','a','an','&'}
    a_words -= stop
    b_words -= stop
    if not a_words or not b_words: return 0
    return len(a_words & b_words) / len(a_words | b_words)

# ── Preis parsen ─────────────────────────────────────────

def parse_prices(raw):
    """Extrahiert Min-Preis aus dem Preistext."""
    prices = re.findall(r'(\d[\d\.]+)\s*USD\s*pp', raw.replace(',', ''))
    if prices:
        vals = [float(p.replace('.','')) for p in prices]
        return f"ab {int(min(vals)):,} USD pp".replace(',', '.')
    return ''

# ── KALI Update ──────────────────────────────────────────

def update_kali(kali, wetu_tours):
    ae = next((op for op in kali['ops'] if 'adventure' in op['name'].lower()), None)
    if not ae:
        print("✗ Adventure Expeditions nicht in KALI gefunden")
        return kali

    updated = 0
    added = 0
    existing_ids = {t['id'] for t in ae['touren']}

    for wt in wetu_tours:
        name_clean = re.sub(r'^20\d\d\s*[-–]?\s*', '', wt['name']).strip()

        # Existing tour match
        best_match = None
        best_score = 0
        for kt in ae['touren']:
            score = match_score(wt['name'], kt['name'])
            if score > best_score:
                best_score = score
                best_match = kt

        if best_match and best_score >= 0.35:
            # Update existing tour
            if wt.get('desc') and not best_match.get('desc'):
                best_match['desc'] = wt['desc']
            if wt.get('itinerary') and not best_match.get('itinerary'):
                best_match['itinerary'] = wt['itinerary']
            if wt.get('included') and not best_match.get('included'):
                best_match['included'] = wt['included']
            if wt.get('excluded') and not best_match.get('excluded'):
                best_match['excluded'] = wt['excluded']
            if wt.get('accommodation'):
                best_match['accommodation'] = wt['accommodation']
            if wt.get('hero_image'):
                best_match['hero_image'] = wt['hero_image']
            if wt.get('prices'):
                best_match['prices'] = wt.get('prices', '')
            best_match['wetu_url'] = wt['url']
            best_match['wetu_uuid'] = wt['uuid']
            print(f"  ✓ Updated ({best_score:.0%}): {best_match['name'][:50]}")
            updated += 1
        else:
            # Add as new tour
            new_tour = {
                'id': wt['id'],
                'name': name_clean,
                'tage': wt['tage'],
                'dest': 'Kenia',
                'niveau': 'midrange',
                'url': wt['url'],
                'wetu_url': wt['url'],
                'wetu_uuid': wt['uuid'],
                'desc': wt.get('desc', ''),
                'itinerary': wt.get('itinerary', []),
                'included': wt.get('included', []),
                'excluded': wt.get('excluded', []),
                'accommodation': wt.get('accommodation', []),
                'hero_image': wt.get('hero_image', ''),
                'prices': wt.get('prices', ''),
                'tags': [],
                'highlights': [],
            }
            ae['touren'].append(new_tour)
            print(f"  + Added: {name_clean[:50]}")
            added += 1

    print(f"\n  ✓ {updated} aktualisiert · {added} neu hinzugefügt")
    return kali

# ── HTML Destination Pages ────────────────────────────────

KALI_STYLE = """
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Calibri',sans-serif; background:#0D1B2A; color:#F5F0E8; }
a { color:#0A7B83; text-decoration:none; }
a:hover { color:#12a5af; }

/* NAV */
nav { position:fixed; top:0; left:0; right:0; z-index:100;
  background:rgba(13,27,42,0.95); backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 48px; height:64px; border-bottom:1px solid rgba(10,123,131,0.3); }
nav .logo { font-family:Georgia,serif; font-size:18px; font-weight:700;
  color:#F5F0E8; letter-spacing:.05em; }
nav .logo span { color:#0A7B83; }
nav ul { list-style:none; display:flex; gap:32px; }
nav ul li a { font-size:13px; font-weight:600; color:#BBBBBB; letter-spacing:.08em;
  text-transform:uppercase; transition:color .2s; }
nav ul li a:hover, nav ul li a.active { color:#0A7B83; }

/* HERO */
.hero { position:relative; height:70vh; min-height:400px; overflow:hidden; margin-top:64px; }
.hero img { width:100%; height:100%; object-fit:cover; }
.hero::after { content:''; position:absolute; inset:0;
  background:linear-gradient(to bottom, rgba(13,27,42,0.2) 0%, rgba(13,27,42,0.8) 100%); }
.hero-content { position:absolute; bottom:0; left:0; right:0; padding:40px 64px; z-index:2; }
.hero-badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:#0A7B83; border:1px solid #0A7B83;
  padding:4px 12px; border-radius:20px; margin-bottom:12px; }
.hero-title { font-family:Georgia,serif; font-size:clamp(28px,4vw,52px);
  font-weight:400; color:#F5F0E8; line-height:1.15; margin-bottom:12px; }
.hero-meta { font-size:13px; color:#BBBBBB; display:flex; gap:24px; flex-wrap:wrap; }
.hero-meta span { display:flex; align-items:center; gap:6px; }

/* CONTENT */
.container { max-width:1100px; margin:0 auto; padding:0 48px; }
section { padding:56px 0; border-bottom:1px solid rgba(245,240,232,0.08); }
section:last-child { border-bottom:none; }
.section-label { font-size:11px; font-weight:700; letter-spacing:.15em;
  text-transform:uppercase; color:#0A7B83; margin-bottom:20px; }
h2 { font-family:Georgia,serif; font-size:28px; font-weight:400; margin-bottom:20px; }
p { font-size:15px; line-height:1.75; color:#BBBBBB; max-width:720px; }

/* ITINERARY */
.itin-grid { display:flex; flex-direction:column; gap:0; }
.itin-day { display:grid; grid-template-columns:60px 1fr;
  gap:0 24px; padding:20px 0; border-bottom:1px solid rgba(245,240,232,0.06); }
.itin-day:last-child { border-bottom:none; }
.day-num { font-family:Georgia,serif; font-size:22px; color:#0A7B83;
  font-weight:400; padding-top:2px; }
.day-title { font-size:15px; font-weight:600; color:#F5F0E8; margin-bottom:6px; }
.day-body { font-size:13px; line-height:1.7; color:#94a3b8; }

/* INCLUDES */
.inc-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 32px; }
.inc-item { display:flex; gap:10px; align-items:flex-start;
  font-size:13px; color:#BBBBBB; line-height:1.5; }
.inc-dot { color:#0A7B83; font-size:10px; margin-top:4px; flex-shrink:0; }
.exc-dot { color:#ef4444; font-size:10px; margin-top:4px; flex-shrink:0; }

/* ACCOMMODATION */
.acc-grid { display:flex; flex-wrap:wrap; gap:12px; }
.acc-tag { background:rgba(10,123,131,0.12); border:1px solid rgba(10,123,131,0.3);
  color:#F5F0E8; padding:6px 16px; border-radius:20px; font-size:13px; }

/* PRICE */
.price-box { background:rgba(10,123,131,0.08); border:1px solid rgba(10,123,131,0.2);
  border-radius:12px; padding:28px 32px; display:inline-block; }
.price-from { font-size:12px; color:#BBBBBB; letter-spacing:.08em;
  text-transform:uppercase; margin-bottom:6px; }
.price-val { font-family:Georgia,serif; font-size:32px; color:#0A7B83; }
.price-note { font-size:12px; color:#64748b; margin-top:8px; }

/* CTA */
.cta-section { text-align:center; padding:72px 0; }
.cta-title { font-family:Georgia,serif; font-size:32px; margin-bottom:16px; }
.cta-sub { font-size:15px; color:#BBBBBB; margin-bottom:32px; }
.btn { display:inline-block; background:#0A7B83; color:#fff; font-size:14px;
  font-weight:600; padding:14px 32px; border-radius:6px; transition:background .2s; }
.btn:hover { background:#12a5af; color:#fff; }
.btn-outline { background:transparent; border:2px solid #0A7B83; color:#0A7B83;
  margin-left:12px; }
.btn-outline:hover { background:#0A7B83; color:#fff; }

/* FOOTER */
footer { background:rgba(0,0,0,0.3); text-align:center; padding:32px;
  font-size:12px; color:#64748b; }
</style>
"""

def build_destination_page(tour):
    name_clean = re.sub(r'^20\d\d\s*[-–]?\s*', '', tour['name']).strip()
    slug = re.sub(r'[^a-z0-9]+', '-', name_clean.lower()).strip('-')
    tage = tour.get('tage', '')
    desc = tour.get('desc', '') or 'Eine außergewöhnliche Safari-Erfahrung mit Adventure Expeditions.'
    hero = tour.get('hero_image', '') or 'https://wetu.com/ImageHandler/c1920x1080/Itineraries/29EE111B-B75C-43C7-BD3C-DBC16F4DC2F5'
    itin = tour.get('itinerary', [])
    inc  = tour.get('included', [])
    exc  = tour.get('excluded', [])
    acc  = tour.get('accommodation', [])
    wetu_url = tour.get('url', '')

    # Parse min price from prices field
    raw_price = tour.get('prices', '')
    min_price = parse_prices(raw_price) if raw_price else ''

    # Build itinerary HTML
    itin_html = ''
    for i, day in enumerate(itin, 1):
        sep = day.find('::')
        if sep >= 0:
            title = day[:sep].strip()
            body  = day[sep+2:].strip()
        else:
            title = day[:60]
            body  = ''
        itin_html += f"""
        <div class="itin-day">
          <div class="day-num">{i:02d}</div>
          <div>
            <div class="day-title">{title}</div>
            {'<div class="day-body">' + body + '</div>' if body else ''}
          </div>
        </div>"""

    # Build includes HTML
    inc_html = ''.join(f'<div class="inc-item"><span class="inc-dot">●</span>{i}</div>' for i in inc[:12])
    exc_html = ''.join(f'<div class="inc-item"><span class="exc-dot">●</span>{i}</div>' for i in exc[:8])
    acc_html = ''.join(f'<span class="acc-tag">{a}</span>' for a in acc)

    html = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name_clean} · Adventure Expeditions · KALI Kollektiv</title>
{KALI_STYLE}
</head>
<body>

<nav>
  <div class="logo">KALI <span>KOLLEKTIV</span></div>
  <ul>
    <li><a href="/portfolio.html">Portfolio</a></li>
    <li><a href="/destinations/" class="active">Destinations</a></li>
    <li><a href="/experiences.html">Experiences</a></li>
    <li><a href="/about.html">About KALI</a></li>
  </ul>
</nav>

<div class="hero">
  <img src="{hero}" alt="{name_clean}" loading="eager">
  <div class="hero-content">
    <div class="hero-badge">Adventure Expeditions · Kenia</div>
    <h1 class="hero-title">{name_clean}</h1>
    <div class="hero-meta">
      {'<span>📅 ' + str(tage) + ' Tage</span>' if tage else ''}
      {'<span>💰 ' + min_price + '</span>' if min_price else ''}
      <span>🇰🇪 Kenia</span>
    </div>
  </div>
</div>

<div class="container">

  <section>
    <div class="section-label">Überblick</div>
    <h2>Die Reise</h2>
    <p>{desc}</p>
  </section>

  {'<section><div class="section-label">Reiseverlauf</div><h2>Tag für Tag</h2><div class="itin-grid">' + itin_html + '</div></section>' if itin else ''}

  {'<section><div class="section-label">Leistungen</div><h2>Inklusive</h2><div class="inc-grid">' + inc_html + '</div></section>' if inc else ''}

  {'<section><div class="section-label">Nicht enthalten</div><div class="inc-grid">' + exc_html + '</div></section>' if exc else ''}

  {'<section><div class="section-label">Unterkünfte</div><h2>Wo Sie übernachten</h2><div class="acc-grid">' + acc_html + '</div></section>' if acc else ''}

  {'<section><div class="section-label">Preise 2026</div>' + ('<div class="price-box"><div class="price-from">Preis ab</div><div class="price-val">' + min_price + '</div><div class="price-note">Preise auf Anfrage · Saisonale Unterschiede möglich</div></div>') + '</section>' if min_price else ''}

  <section class="cta-section">
    <div class="section-label">Interesse geweckt?</div>
    <h2 class="cta-title">Diese Reise anfragen</h2>
    <p class="cta-sub">Wir beraten Sie gerne und erstellen ein individuelles Angebot.</p>
    <a href="mailto:carl@kalikollektiv.de?subject=Anfrage: {name_clean}" class="btn">Jetzt anfragen</a>
    {'<a href="' + wetu_url + '" target="_blank" class="btn btn-outline">Vollständiges Itinerary</a>' if wetu_url else ''}
  </section>

</div>

<footer>
  &copy; 2026 KALI Kollektiv · Beyond the Map · Berlin ·
  <a href="mailto:carl@kalikollektiv.de">carl@kalikollektiv.de</a>
</footer>

</body>
</html>"""
    return slug, html

# ── Main ─────────────────────────────────────────────────

def main():
    print("KALI Wetu Patch Script")
    print("=" * 50)

    kali, wetu_data = load()
    wetu_tours = wetu_data['touren']

    # 1. Update KALI
    print("\n1. KALI kali_export.json aktualisieren...")
    kali = update_kali(kali, wetu_tours)
    with open(KALI_FILE, 'w', encoding='utf-8') as f:
        json.dump(kali, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {KALI_FILE} gespeichert")

    # 2. Build destination HTML pages
    print(f"\n2. kalikollektiv/destinations/ HTML-Seiten erstellen...")
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    for wt in wetu_tours:
        slug, html = build_destination_page(wt)
        out_path = DEST_DIR / f"{slug}.html"
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  ✓ {slug}.html")

    # 3. Build index page for destinations
    idx_cards = ''
    for wt in wetu_tours:
        name_clean = re.sub(r'^20\d\d\s*[-–]?\s*', '', wt['name']).strip()
        slug = re.sub(r'[^a-z0-9]+', '-', name_clean.lower()).strip('-')
        tage = wt.get('tage', '')
        hero = wt.get('hero_image','') or ''
        min_price = parse_prices(wt.get('prices','')) if wt.get('prices') else ''
        idx_cards += f"""
    <a href="{slug}.html" class="tour-card">
      <div class="card-img" style="background-image:url('{hero}')"></div>
      <div class="card-body">
        <div class="card-badge">Adventure Expeditions · Kenia</div>
        <div class="card-title">{name_clean}</div>
        <div class="card-meta">
          {'<span>' + str(tage) + ' Tage</span>' if tage else ''}
          {'<span>' + min_price + '</span>' if min_price else ''}
        </div>
      </div>
    </a>"""

    idx_html = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Destinations · KALI Kollektiv</title>
{KALI_STYLE}
<style>
.page-header {{ padding:80px 0 40px; text-align:center; }}
.page-header h1 {{ font-family:Georgia,serif; font-size:42px; font-weight:400; margin-bottom:12px; }}
.page-header p {{ font-size:16px; color:#BBBBBB; max-width:560px; margin:0 auto; }}
.tour-grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:24px; padding:40px 0 80px; }}
.tour-card {{ background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
  border-radius:12px; overflow:hidden; text-decoration:none; transition:transform .2s,border-color .2s; }}
.tour-card:hover {{ transform:translateY(-4px); border-color:rgba(10,123,131,0.4); }}
.card-img {{ height:200px; background-size:cover; background-position:center; }}
.card-body {{ padding:20px; }}
.card-badge {{ font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:#0A7B83; margin-bottom:8px; }}
.card-title {{ font-family:Georgia,serif; font-size:18px; color:#F5F0E8;
  line-height:1.3; margin-bottom:10px; }}
.card-meta {{ display:flex; gap:16px; font-size:12px; color:#BBBBBB; }}
</style>
</head>
<body>
<nav>
  <div class="logo">KALI <span>KOLLEKTIV</span></div>
  <ul>
    <li><a href="/portfolio.html">Portfolio</a></li>
    <li><a href="/destinations/" class="active">Destinations</a></li>
    <li><a href="/experiences.html">Experiences</a></li>
    <li><a href="/about.html">About KALI</a></li>
  </ul>
</nav>
<div class="container" style="padding-top:64px">
  <div class="page-header">
    <h1>Destinations</h1>
    <p>Alle Adventure Expeditions Kenia-Touren — kuratiert von KALI Kollektiv.</p>
  </div>
  <div class="tour-grid">{idx_cards}</div>
</div>
<footer>&copy; 2026 KALI Kollektiv · Beyond the Map · Berlin</footer>
</body>
</html>"""

    with open(DEST_DIR / 'index.html', 'w', encoding='utf-8') as f:
        f.write(idx_html)
    print(f"\n  ✓ index.html ({len(wetu_tours)} Touren)")

    print(f"\n{'='*50}")
    print(f"FERTIG!")
    print(f"  KALI:         kali_export.json aktualisiert")
    print(f"  Destination:  kalikollektiv/destinations/ ({len(wetu_tours)+1} Dateien)")
    print(f"\nNächste Schritte:")
    print(f"  1. KALI neu starten + ↻ Aktualisieren")
    print(f"  2. kalikollektiv/destinations/ per FTP zu IONOS hochladen")
    print('='*50)

if __name__ == '__main__':
    main()
