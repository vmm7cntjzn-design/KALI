# -*- coding: utf-8 -*-
"""
KALI – Wetu Scraper v2 (requests-basiert, kein Playwright nötig)
Fetcht alle Adventure Expeditions Kenia-Touren direkt.

Ausführen:
  pip install requests beautifulsoup4 --break-system-packages
  python wetu_scraper_v2.py
"""

import json, re, time, sys
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Bitte installieren: pip install requests beautifulsoup4")
    sys.exit(1)

OUTPUT = Path(__file__).parent / "wetu_ae_kenia_v2.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Referer': 'https://wetu.com/Rack/View/Catalogue/18511',
}

TOURS = [
    {"name": "13 Days Discover Kenya Historic Railway Journey",     "uuid": "24f79429-dced-42fd-abbf-12e802875c08", "tage": 13},
    {"name": "07 Days Family Safari Rift Valley & Maasai Mara",    "uuid": "a5df309e-9c3b-4477-843d-35b89838ae35", "tage": 7},
    {"name": "05 Days Maasai Mara Flight Safari",                  "uuid": "da5ee794-7385-4a6b-a15a-41333d19d923", "tage": 5},
    {"name": "12 Days Immerse in Life with the Tribes",            "uuid": "722483c7-301c-43ff-a3be-43b4210c94df", "tage": 12},
    {"name": "10 Days Kenya Starter",                              "uuid": "deb9ffd0-da0e-414e-b80e-470f41f550ee", "tage": 10},
    {"name": "12 Days Photographic Safari Kenya",                  "uuid": "3821ecef-0a61-4123-b2d3-6496725c83bc", "tage": 12},
    {"name": "07 Days Tour de Kenya Cycling Safari",               "uuid": "49b120b8-d5ea-4af7-b364-84404dbcd941", "tage": 7},
    {"name": "12 Days Classic Kenya Safari",                       "uuid": "08FED64B-80A3-4A42-BC00-89C2C72F8C80", "tage": 12},
    {"name": "12 Days across Kenya",                               "uuid": "a033ec81-dc67-434b-a256-94e044bcc8e2", "tage": 12},
    {"name": "05 Days Diani Beach Kilele Adventure",               "uuid": "0223A9F7-70DE-438A-AB32-95A491014CCE", "tage": 5},
    {"name": "05 Days Maasai Mara Safari",                         "uuid": "ee1cfdd3-f1cc-44e3-876a-971d7ad5129b", "tage": 5},
    {"name": "10 Days Flying Safari Amboseli & Northern Kenya",    "uuid": "7d42398d-01f4-4c78-b61b-9a1467c2c263", "tage": 10},
    {"name": "11 Days with Kenya's Nomads",                        "uuid": "ba3a8bfe-6a98-4ed5-8964-9bde4993af5b", "tage": 11},
    {"name": "04 Days Kayaking on Ewaso Nyiro River",              "uuid": "6DCD926C-5750-4EBA-B952-9CF5CC142DAF", "tage": 4},
    {"name": "10 Days Kenya Without the Crowds",                   "uuid": "e2811efe-891b-4a7f-9b75-af0ff52f284f", "tage": 10},
    {"name": "08 Days Classic Kenyan Safari Horizons",             "uuid": "4f4b5053-6d05-4559-b51d-b3bbcbc848f3", "tage": 8},
    {"name": "05 Days Western Kenya",                              "uuid": "f4c92aef-d0e8-4454-9042-c884cebcf7d7", "tage": 6},
    {"name": "10 Days Swahili Coast & Lamu Dreams",                "uuid": "d8ee71da-8bc2-4fa3-9e3b-cb5e2c9cad52", "tage": 10},
    {"name": "07 Days Lake Turkana Adventure",                     "uuid": "b0bb6321-12dd-4b88-8df8-cb8466753832", "tage": 7},
    {"name": "08 Days Laikipia Best Kept Secret",                  "uuid": "5ed6c48e-a5d9-4713-bf23-d97f5102de99", "tage": 8},
    {"name": "10 Days Maasai Wedding and Honeymoon",               "uuid": "752dd7d1-5501-4564-bedf-e3f7f1b4ddd5", "tage": 10},
    {"name": "07 Days Flying Safari Rift Valley & Maasai Mara",    "uuid": "2651d20f-a7b1-48b0-8f16-e4c22d3ec8ad", "tage": 8},
    {"name": "12 Days Family Safari",                              "uuid": "3B81CC12-C982-43FD-B390-E6721AA88AA0", "tage": 14},
    {"name": "14 Days Explore the Great Rift Valley Lakes",        "uuid": "bf531164-e4d6-406b-bbce-f374a1249102", "tage": 14},
    {"name": "10 Days Western Kenya Adventure",                    "uuid": "3ec34223-1334-489d-ab63-f7b633f561d7", "tage": 10},
    {"name": "08 Days Kenya Bush and North Coast",                 "uuid": "36e6f7c3-3535-4c32-92e5-f81a9422cc25", "tage": 8},
    {"name": "08 Days Bush and Beach Diani and Tsavo",             "uuid": "74144eed-23ca-41d3-8278-fccccf756af1", "tage": 8},
    {"name": "04 Days Train Safari to Teita Estate",               "uuid": "a221f0c5-154f-48a9-826a-a396a61ab028", "tage": 4},
    {"name": "10 Days Luxury Rail Safari and Beach Holiday",       "uuid": "C20A7D09-FC20-45ED-98A4-D5F67564AFA0", "tage": 10},
    {"name": "12 Days Western Kenya & Rift Valley",                "uuid": "56323851-0541-4AB7-A61B-CFF5FB14912E", "tage": 12},
    {"name": "14 Days Lake Victoria Three-Country Circuit",        "uuid": "834fad7b-8934-4330-95b5-58763c42edfb", "tage": 14},
]

def get(url, session):
    try:
        r = session.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"      ✗ {e}")
        return ""

def parse_overview(html):
    soup = BeautifulSoup(html, 'html.parser')
    result = {'desc': '', 'included': [], 'excluded': [], 'prices': '', 'accommodation': []}

    # Description from Introduction section
    intro = soup.find(lambda t: t.name=='h2' and 'introduction' in t.get_text(strip=True).lower())
    if intro:
        p = intro.find_next('p')
        if p: result['desc'] = p.get_text(strip=True)

    # Parse prices, includes, excludes from text
    text = soup.get_text(separator='\n')
    # Find Includes section
    inc_match = re.search(r'Includes?:(.*?)(?:Excludes?:|$)', text, re.DOTALL | re.IGNORECASE)
    exc_match = re.search(r'Excludes?:(.*?)(?:Fast Facts|$)', text, re.DOTALL | re.IGNORECASE)

    if inc_match:
        items = [l.strip().lstrip('•-* ') for l in inc_match.group(1).split('\n') if l.strip() and len(l.strip()) > 5]
        result['included'] = [i for i in items if not re.match(r'^(Price|USD|\d)', i)][:15]
    if exc_match:
        items = [l.strip().lstrip('•-* ') for l in exc_match.group(1).split('\n') if l.strip() and len(l.strip()) > 5]
        result['excluded'] = [i for i in items if not re.match(r'^(Fast Facts|Travellers|\d{2})', i)][:15]

    # Accommodation from table
    acc_rows = soup.select('table tr td a[href*="accommodation"]')
    result['accommodation'] = list(dict.fromkeys([a.get_text(strip=True) for a in acc_rows if a.get_text(strip=True)]))

    # Prices
    price_match = re.search(r'((?:PRICE|SECTOR).*?)(?:Includes?:|$)', text, re.DOTALL | re.IGNORECASE)
    if price_match:
        result['prices'] = re.sub(r'\n{3,}', '\n\n', price_match.group(1).strip())[:2000]

    # Hero image from og:image meta
    og = soup.find('meta', property='og:image') or soup.find('meta', attrs={'name':'twitter:image'})
    if og:
        result['hero_image'] = og.get('content', '')

    return result

def parse_dailyinfo(html):
    soup = BeautifulSoup(html, 'html.parser')
    days = []
    # Find all Day headers: h2 elements starting with "Day"
    for h in soup.find_all(['h2', 'h3']):
        text = h.get_text(strip=True)
        if not re.match(r'^Day\s+\d+', text, re.IGNORECASE):
            continue
        # Title = everything after "Day N:"
        title = re.sub(r'^Day\s+\d+\s*[:\-–]?\s*', '', text).strip() or text

        # Body = all text until next day header
        body_parts = []
        for sibling in h.find_next_siblings():
            if sibling.name in ['h2','h3'] and re.match(r'^Day\s+\d+', sibling.get_text(strip=True), re.I):
                break
            if sibling.name == 'p':
                t = sibling.get_text(separator=' ', strip=True)
                if t and len(t) > 10:
                    body_parts.append(t)
        body = ' '.join(body_parts)
        # Photos from this section
        imgs = []
        for sibling in h.find_next_siblings():
            if sibling.name in ['h2','h3'] and re.match(r'^Day\s+\d+', sibling.get_text(strip=True), re.I):
                break
            for img in sibling.find_all('img'):
                src = img.get('src','')
                if 'wetu.com' in src and 'c380x246' in src:
                    imgs.append(src)

        days.append(f"{title}:: {body}")

    return days

def scrape():
    session = requests.Session()
    results = []

    for i, tour in enumerate(TOURS, 1):
        uuid = tour['uuid']
        print(f"\n[{i:02d}/{len(TOURS)}] {tour['name'][:55]}")

        data = {
            'id': f"ae_{uuid[:8].lower()}",
            'name': tour['name'],
            'tage': tour['tage'],
            'url': f"https://wetu.com/Itinerary/Landing/{uuid}?oid=59542",
            'uuid': uuid,
            'desc': '',
            'included': [],
            'excluded': [],
            'prices': '',
            'accommodation': [],
            'itinerary': [],
            'hero_image': '',
        }

        # 1. Overview
        print(f"  → Overview...")
        ov_html = get(f"https://wetu.com/Itinerary/Overview/{uuid}", session)
        if ov_html:
            ov = parse_overview(ov_html)
            data.update(ov)
            print(f"     desc: {len(data['desc'])} · inc: {len(data['included'])} · acc: {len(data['accommodation'])}")
        time.sleep(1)

        # 2. DailyInfo
        print(f"  → DailyInfo...")
        di_html = get(f"https://wetu.com/Itinerary/DailyInfo/{uuid}", session)
        if di_html:
            data['itinerary'] = parse_dailyinfo(di_html)
            print(f"     {len(data['itinerary'])} Tage")
        time.sleep(1)

        results.append(data)

    # Save
    output = {'operator': 'Adventure Expeditions', 'touren': results}
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*55}")
    print(f"✓ {len(results)} Touren → {OUTPUT.name}")
    has_itin = sum(1 for t in results if t['itinerary'])
    has_desc = sum(1 for t in results if t['desc'])
    print(f"  Mit Itinerary: {has_itin}/{len(results)}")
    print(f"  Mit Beschreibung: {has_desc}/{len(results)}")
    print(f"\nJetzt wetu_ae_kenia_v2.json in Claude hochladen!")
    print('='*55)

if __name__ == '__main__':
    scrape()
