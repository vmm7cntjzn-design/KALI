# -*- coding: utf-8 -*-
"""
KALI – Wetu Scraper für Adventure Expeditions
Fetcht alle Kenia-Touren aus dem Wetu-Katalog und speichert als JSON.

Installation (einmalig):
  pip install playwright
  playwright install chromium

Ausführen:
  python wetu_scraper.py
"""

import json, re, time, sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright nicht installiert.")
    print("Bitte ausführen: pip install playwright && playwright install chromium")
    sys.exit(1)

CATALOGUE_URL = "https://wetu.com/Rack/View/Catalogue/18511"
OUTPUT_FILE   = Path(__file__).parent / "wetu_ae_kenia.json"

# ── Hilfsfunktionen ──────────────────────────────────────

def clean(text):
    return re.sub(r'\s+', ' ', text or '').strip()

def extract_days(page):
    """Extrahiert Tagesinfos aus der DailyInfo-Seite."""
    days = []
    try:
        # Warte auf Tages-Container
        page.wait_for_selector('.day-container, .itinerary-day, [class*="day"]', timeout=8000)
    except:
        pass

    # Versuche verschiedene Selektoren
    selectors = ['.day-container', '.itinerary-day', '.day-block', '[class*="DayBlock"]']
    day_els = []
    for sel in selectors:
        day_els = page.query_selector_all(sel)
        if day_els: break

    for i, el in enumerate(day_els, 1):
        title = clean(el.query_selector('h2, h3, .day-title, [class*="title"]')
                      .inner_text() if el.query_selector('h2, h3, .day-title, [class*="title"]') else f'Tag {i}')
        body_el = el.query_selector('p, .description, [class*="description"]')
        body = clean(body_el.inner_text()) if body_el else ''
        days.append(f"{title}:: {body}")
    return days

def extract_overview(page):
    """Extrahiert Overview: Beschreibung, Inklusive, Exklusive, Preis."""
    result = {'desc': '', 'included': [], 'excluded': [], 'price': ''}
    try:
        page.wait_for_selector('.overview, [class*="overview"], .intro', timeout=8000)
    except:
        pass

    # Beschreibung
    for sel in ['.overview-description', '.intro p', '.description p', 'article p']:
        el = page.query_selector(sel)
        if el:
            result['desc'] = clean(el.inner_text())
            break

    # Inklusive
    for sel in ['.inclusions li', '.included li', '[class*="inclus"] li']:
        items = page.query_selector_all(sel)
        if items:
            result['included'] = [clean(i.inner_text()) for i in items if clean(i.inner_text())]
            break

    # Exklusive
    for sel in ['.exclusions li', '.excluded li', '[class*="exclus"] li']:
        items = page.query_selector_all(sel)
        if items:
            result['excluded'] = [clean(i.inner_text()) for i in items if clean(i.inner_text())]
            break

    # Preis
    for sel in ['.price', '[class*="price"]', '.rate']:
        el = page.query_selector(sel)
        if el:
            result['price'] = clean(el.inner_text())
            break

    return result

def extract_accommodation(page):
    """Extrahiert Unterkünfte."""
    try:
        page.wait_for_selector('[class*="accommodat"], .lodge, .hotel', timeout=8000)
    except:
        pass
    lodges = []
    for sel in ['[class*="accommodat"] h3', '.lodge-name', '.hotel-name', '.property-name']:
        items = page.query_selector_all(sel)
        if items:
            lodges = [clean(i.inner_text()) for i in items if clean(i.inner_text())]
            break
    return lodges

# ── Hauptprogramm ────────────────────────────────────────

def scrape():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'
        )
        page = ctx.new_page()

        # 1. Katalog laden und Tour-Links sammeln
        print("📖 Lade Katalog...")
        page.goto(CATALOGUE_URL, wait_until='networkidle', timeout=30000)
        time.sleep(2)

        # Tour-Links extrahieren
        links = page.query_selector_all('a[href*="/Itinerary/Landing/"]')
        tour_links = []
        for link in links:
            href = link.get_attribute('href')
            title = clean(link.inner_text()) or clean(
                link.query_selector('[class*="title"]').inner_text()
                if link.query_selector('[class*="title"]') else ''
            )
            if href and href not in [l['url'] for l in tour_links]:
                # UUID aus URL extrahieren
                m = re.search(r'/([0-9a-f-]{36})', href)
                if m:
                    tour_links.append({
                        'url': href if href.startswith('http') else f'https://wetu.com{href}',
                        'uuid': m.group(1),
                        'name': title
                    })

        print(f"✓ {len(tour_links)} Touren gefunden")

        # 2. Pro Tour: Overview + DailyInfo + Accommodation fetchen
        for i, tour in enumerate(tour_links, 1):
            uuid = tour['uuid']
            name = tour['name'] or f'Tour {i}'
            print(f"\n[{i}/{len(tour_links)}] {name[:60]}")

            tour_data = {
                'id': f'ae_{uuid[:8]}',
                'name': name,
                'url': tour['url'],
                'uuid': uuid,
                'desc': '',
                'included': [],
                'excluded': [],
                'price': '',
                'itinerary': [],
                'accommodation': [],
            }

            # Overview
            try:
                print(f"  → Overview...")
                page.goto(f'https://wetu.com/Itinerary/Overview/{uuid}',
                         wait_until='networkidle', timeout=20000)
                time.sleep(1)
                ov = extract_overview(page)
                tour_data.update(ov)
                print(f"     desc: {len(tour_data['desc'])} chars · "
                      f"{len(tour_data['included'])} inkl · {len(tour_data['excluded'])} exkl")
            except Exception as e:
                print(f"     ✗ Overview Fehler: {e}")

            # Daily Information
            try:
                print(f"  → DailyInfo...")
                page.goto(f'https://wetu.com/Itinerary/DailyInfo/{uuid}',
                         wait_until='networkidle', timeout=20000)
                time.sleep(1)
                tour_data['itinerary'] = extract_days(page)
                print(f"     {len(tour_data['itinerary'])} Tage")
            except Exception as e:
                print(f"     ✗ DailyInfo Fehler: {e}")

            # Accommodation
            try:
                print(f"  → Accommodation...")
                page.goto(f'https://wetu.com/Itinerary/Accommodation/{uuid}',
                         wait_until='networkidle', timeout=20000)
                time.sleep(1)
                tour_data['accommodation'] = extract_accommodation(page)
                print(f"     {len(tour_data['accommodation'])} Unterkünfte")
            except Exception as e:
                print(f"     ✗ Accommodation Fehler: {e}")

            results.append(tour_data)
            time.sleep(0.5)  # höfliche Pause

        browser.close()

    # Speichern
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'operator': 'Adventure Expeditions', 'touren': results}, f,
                  ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✓ {len(results)} Touren gespeichert → {OUTPUT_FILE}")
    print(f"  Nächster Schritt: wetu_ae_kenia.json hier in Claude hochladen")
    print(f"{'='*50}")

if __name__ == '__main__':
    scrape()
