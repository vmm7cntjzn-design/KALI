# -*- coding: utf-8 -*-
"""
KALI - Fetch Bilder fuer Lake Turkana
Laedt alle Bilder von Wetu und speichert sie in Website\Pics\Lake-Turkana\

Aufruf: python fetch_turkana_pics.py
"""

import os, re, time, sys
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("pip install requests beautifulsoup4")
    sys.exit(1)

UUID  = "b0bb6321-12dd-4b88-8df8-cb8466753832"
NAME  = "Lake-Turkana"
# Ordner relativ zum Script: ..\Website\Pics\Lake-Turkana\
OUT   = Path(__file__).parent.parent / "Website" / "Pics" / NAME
OUT.mkdir(parents=True, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
    'Accept': 'text/html,application/xhtml+xml,*/*',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Referer': 'https://wetu.com/',
}

session = requests.Session()

def fetch_html(url):
    try:
        r = session.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  FEHLER {url}: {e}")
        return ""

def collect_image_urls(html):
    """Alle Wetu-Bild-URLs aus HTML extrahieren."""
    urls = set()

    # ImageHandler URLs direkt im HTML
    found = re.findall(
        r'https://wetu\.com/ImageHandler/[^\s"\'<>]+',
        html
    )
    urls.update(found)

    # Aus img src und data-src
    soup = BeautifulSoup(html, 'html.parser')
    for tag in soup.find_all(['img', 'div', 'section']):
        for attr in ['src', 'data-src', 'data-original', 'style']:
            val = tag.get(attr, '')
            if 'wetu.com' in val or 'ImageHandler' in val:
                m = re.search(r'https://wetu\.com/ImageHandler/[^\s"\'<>)]+', val)
                if m:
                    urls.add(m.group(0))

    # Aus background-image style
    for m in re.finditer(r'url\(["\']?(https://wetu\.com/ImageHandler/[^"\')<>]+)', html):
        urls.add(m.group(1))

    # JSON-Daten im Script-Tags
    for m in re.finditer(r'"(https://wetu\.com/ImageHandler/[^"]+)"', html):
        urls.add(m.group(1))

    return urls

def download_img(url, dest_path):
    try:
        r = session.get(url, headers=HEADERS, timeout=30, stream=True)
        r.raise_for_status()
        ctype = r.headers.get('Content-Type', '')
        if 'image' not in ctype and 'octet' not in ctype:
            print(f"    Kein Bild ({ctype}): {url[:60]}")
            return False
        with open(dest_path, 'wb') as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        size = dest_path.stat().st_size
        if size < 2000:
            dest_path.unlink()
            print(f"    Zu klein ({size}b), uebersprungen")
            return False
        print(f"    OK  {dest_path.name}  ({size//1024} KB)")
        return True
    except Exception as e:
        print(f"    FEHLER: {e}")
        return False

def clean_filename(url, idx):
    """Dateiname aus URL ableiten."""
    # Versuche sinnvollen Namen aus Pfad
    m = re.search(r'/([^/]+\.(?:jpg|jpeg|png|webp))', url, re.I)
    if m:
        base = re.sub(r'[^\w.-]', '_', m.group(1))
    else:
        # letztes Pfadsegment
        seg = url.rstrip('/').split('/')[-1].split('?')[0]
        base = re.sub(r'[^\w.-]', '_', seg) or f"img_{idx:02d}"

    # Groesse aus URL extrahieren (c1920x1080 etc.)
    sm = re.search(r'/(c\d+x\d+)/', url)
    size_tag = sm.group(1) if sm else ''

    name = f"{NAME}_{idx:02d}_{size_tag}_{base}".strip('_')
    # Endung sicherstellen
    if not re.search(r'\.(jpg|jpeg|png|webp)$', name, re.I):
        name += '.jpg'
    return name

# ── Hauptprogramm ────────────────────────────────────────────

print(f"\nKALI - Bilder-Download: {NAME}")
print(f"UUID: {UUID}")
print(f"Zielordner: {OUT}\n")

all_img_urls = set()

# Hero-Bild direkt (bekanntes Muster)
hero = f"https://wetu.com/ImageHandler/c1920x1080/Itineraries/{UUID.upper()}/landing_page.png"
all_img_urls.add(hero)

endpoints = [
    f"https://wetu.com/Itinerary/Overview/{UUID}",
    f"https://wetu.com/Itinerary/DailyInfo/{UUID}",
    f"https://wetu.com/Itinerary/Landing/{UUID}?oid=59542",
]

for url in endpoints:
    print(f"Scanne: {url}")
    html = fetch_html(url)
    if html:
        imgs = collect_image_urls(html)
        print(f"  {len(imgs)} Bild-URLs gefunden")
        all_img_urls.update(imgs)
    time.sleep(1.0)

print(f"\nGesamt {len(all_img_urls)} einzigartige Bild-URLs\n")
print("Starte Download...\n")

ok = 0
for idx, url in enumerate(sorted(all_img_urls), 1):
    fname = clean_filename(url, idx)
    dest  = OUT / fname
    if dest.exists():
        print(f"  SKIP (vorhanden): {fname}")
        ok += 1
        continue
    if download_img(url, dest):
        ok += 1
    time.sleep(0.5)

print(f"\n{'='*50}")
print(f"Fertig: {ok}/{len(all_img_urls)} Bilder gespeichert")
print(f"Ordner: {OUT}")
