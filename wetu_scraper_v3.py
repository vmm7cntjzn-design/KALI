# -*- coding: utf-8 -*-
"""
KALI – Wetu Scraper v3
Korrekte Extraktion von Tagestext via html2text Konvertierung.

pip install requests beautifulsoup4 html2text
python wetu_scraper_v3.py
"""

import json, re, time, sys
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
    import html2text
except ImportError:
    print("pip install requests beautifulsoup4 html2text")
    sys.exit(1)

OUTPUT = Path(__file__).parent / "wetu_ae_kenia_v3.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Referer': 'https://wetu.com/Rack/View/Catalogue/18511',
}

TOURS = [
    ("13 Days Discover Kenya Historic Railway Journey",   "24f79429-dced-42fd-abbf-12e802875c08", 13),
    ("07 Days Family Safari Rift Valley & Maasai Mara",  "a5df309e-9c3b-4477-843d-35b89838ae35",  7),
    ("05 Days Maasai Mara Flight Safari",                "da5ee794-7385-4a6b-a15a-41333d19d923",  5),
    ("12 Days Immerse in Life with the Tribes",          "722483c7-301c-43ff-a3be-43b4210c94df", 12),
    ("10 Days Kenya Starter",                            "deb9ffd0-da0e-414e-b80e-470f41f550ee", 10),
    ("12 Days Photographic Safari Kenya",                "3821ecef-0a61-4123-b2d3-6496725c83bc", 12),
    ("07 Days Tour de Kenya Cycling Safari",             "49b120b8-d5ea-4af7-b364-84404dbcd941",  7),
    ("12 Days Classic Kenya Safari",                     "08FED64B-80A3-4A42-BC00-89C2C72F8C80", 12),
    ("12 Days across Kenya",                             "a033ec81-dc67-434b-a256-94e044bcc8e2", 12),
    ("05 Days Diani Beach Kilele Adventure",             "0223A9F7-70DE-438A-AB32-95A491014CCE",  5),
    ("05 Days Maasai Mara Safari",                       "ee1cfdd3-f1cc-44e3-876a-971d7ad5129b",  5),
    ("10 Days Flying Safari Amboseli & Northern Kenya",  "7d42398d-01f4-4c78-b61b-9a1467c2c263", 10),
    ("11 Days with Kenya's Nomads",                      "ba3a8bfe-6a98-4ed5-8964-9bde4993af5b", 11),
    ("04 Days Kayaking on Ewaso Nyiro River",            "6DCD926C-5750-4EBA-B952-9CF5CC142DAF",  4),
    ("10 Days Kenya Without the Crowds",                 "e2811efe-891b-4a7f-9b75-af0ff52f284f", 10),
    ("08 Days Classic Kenyan Safari Horizons",           "4f4b5053-6d05-4559-b51d-b3bbcbc848f3",  8),
    ("05 Days Western Kenya",                            "f4c92aef-d0e8-4454-9042-c884cebcf7d7",  6),
    ("10 Days Swahili Coast & Lamu Dreams",              "d8ee71da-8bc2-4fa3-9e3b-cb5e2c9cad52", 10),
    ("07 Days Lake Turkana Adventure",                   "b0bb6321-12dd-4b88-8df8-cb8466753832",  7),
    ("08 Days Laikipia Best Kept Secret",                "5ed6c48e-a5d9-4713-bf23-d97f5102de99",  8),
    ("10 Days Maasai Wedding and Honeymoon",             "752dd7d1-5501-4564-bedf-e3f7f1b4ddd5", 10),
    ("07 Days Flying Safari Rift Valley & Maasai Mara", "2651d20f-a7b1-48b0-8f16-e4c22d3ec8ad",  8),
    ("12 Days Family Safari",                            "3B81CC12-C982-43FD-B390-E6721AA88AA0", 14),
    ("14 Days Explore the Great Rift Valley Lakes",      "bf531164-e4d6-406b-bbce-f374a1249102", 14),
    ("10 Days Western Kenya Adventure",                  "3ec34223-1334-489d-ab63-f7b633f561d7", 10),
    ("08 Days Kenya Bush and North Coast",               "36e6f7c3-3535-4c32-92e5-f81a9422cc25",  8),
    ("08 Days Bush and Beach Diani and Tsavo",           "74144eed-23ca-41d3-8278-fccccf756af1",  8),
    ("04 Days Train Safari to Teita Estate",             "a221f0c5-154f-48a9-826a-a396a61ab028",  4),
    ("10 Days Luxury Rail Safari and Beach Holiday",     "C20A7D09-FC20-45ED-98A4-D5F67564AFA0", 10),
    ("12 Days Western Kenya & Rift Valley",              "56323851-0541-4AB7-A61B-CFF5FB14912E", 12),
    ("14 Days Lake Victoria Three-Country Circuit",      "834fad7b-8934-4330-95b5-58763c42edfb", 14),
]

h2t = html2text.HTML2Text()
h2t.ignore_links = True
h2t.ignore_images = True
h2t.body_width = 0

def get_md(url, session):
    try:
        r = session.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return h2t.handle(r.text)
    except Exception as e:
        print(f"      ✗ {e}")
        return ""

def parse_overview(md):
    result = {'desc':'','included':[],'excluded':[],'prices':'','accommodation':[],'hero_image':''}
    
    # Description: paragraph before first table
    lines = md.split('\n')
    for i, l in enumerate(lines):
        if l.startswith('## Introduction') or l.startswith('# 2026'):
            for j in range(i+1, min(i+5, len(lines))):
                if len(lines[j].strip()) > 80:
                    result['desc'] = lines[j].strip()
                    break
            break
    
    # Included / Excluded
    in_inc = in_exc = False
    for l in lines:
        ls = l.strip().lstrip('*').strip()
        if re.match(r'\*?\*?Includes?:?\*?\*?', l, re.I): in_inc=True; in_exc=False; continue
        if re.match(r'\*?\*?Excludes?:?\*?\*?', l, re.I): in_exc=True; in_inc=False; continue
        if re.match(r'\*?\*?(Fast Facts|Travellers|Price|##)', l, re.I): in_inc=in_exc=False
        if in_inc and ls and len(ls)>5 and not ls.startswith('|'):
            result['included'].append(ls)
        if in_exc and ls and len(ls)>5 and not ls.startswith('|'):
            result['excluded'].append(ls)
    
    # Prices
    pm = re.search(r'\*\*(\d{2}\.\d{2}\.[-–]\d{2}\.\d{2}\.\d{4}.*?)(?:\*\*Includes|$)', md, re.DOTALL)
    if pm: result['prices'] = pm.group(1).strip()[:1500]
    
    # Accommodation from table
    for m in re.finditer(r'\[([^\]]{4,60})\]\(https://wetu\.com/Itinerary/Accommodation/', md):
        name = m.group(1).strip()
        if name not in result['accommodation']:
            result['accommodation'].append(name)
    
    return result

def parse_dailyinfo(md):
    """Parse ## Day N: Location\n\nBody text format."""
    days = []
    # Split on Day headers
    parts = re.split(r'\n##\s+Day\s+(\d+)(?:\s*&\s*\d+)?:\s*', md)
    # parts = [pre, daynum, content, daynum, content, ...]
    i = 1
    while i < len(parts) - 1:
        day_num = parts[i]
        content = parts[i+1]
        
        # Extract title (first line after header in original, but we need to check
        # if Day had a location in the header - it does: "## Day 1: Lake Turkana"
        # The regex split consumed "Day N: " but not the location
        # Let's re-find the original header
        m = re.search(r'##\s+Day\s+' + day_num + r'(?:\s*&\s*\d+)?:\s*([^\n]+)', md)
        location = m.group(1).strip() if m else f'Tag {day_num}'
        
        # Clean body: remove image refs, links, navigation
        body_lines = []
        skip_next = False
        for line in content.split('\n'):
            line = line.strip()
            if not line: continue
            if line.startswith('!['): continue          # images
            if line.startswith('['): continue           # links
            if line.startswith('#'): break              # next section
            if re.match(r'\*\*(Optional|Book Now|Share|Consultant)\*?\*?:', line, re.I): continue
            if len(line) > 20:
                body_lines.append(line)
        
        body = ' '.join(body_lines[:3])  # max 3 paragraphs
        # Clean optional markers
        body = re.sub(r'\*\*Optional:\*\*\s*', '', body)
        body = body.strip()
        
        if location or body:
            days.append(f"{location}:: {body}")
        
        i += 2
    
    return days

def scrape():
    session = requests.Session()
    results = []
    
    for i, (name, uuid, tage) in enumerate(TOURS, 1):
        print(f"\n[{i:02d}/{len(TOURS)}] {name[:55]}")
        data = {
            'id': f"ae_{uuid[:8].lower()}",
            'name': name, 'tage': tage,
            'url': f"https://wetu.com/Itinerary/Landing/{uuid}?oid=59542",
            'uuid': uuid,
            'desc':'', 'included':[], 'excluded':[],
            'prices':'', 'accommodation':[], 'itinerary':[],
            'hero_image': f"https://wetu.com/ImageHandler/c1920x1080/Itineraries/{uuid.upper()}/landing_page.png",
        }
        
        # Overview
        print("  → Overview...")
        ov_md = get_md(f"https://wetu.com/Itinerary/Overview/{uuid}", session)
        if ov_md:
            ov = parse_overview(ov_md)
            data.update(ov)
            print(f"     desc:{len(data['desc'])} inc:{len(data['included'])} acc:{len(data['accommodation'])}")
        time.sleep(1.2)
        
        # DailyInfo
        print("  → DailyInfo...")
        di_md = get_md(f"https://wetu.com/Itinerary/DailyInfo/{uuid}", session)
        if di_md:
            data['itinerary'] = parse_dailyinfo(di_md)
            print(f"     {len(data['itinerary'])} Tage")
            if data['itinerary']:
                sample = data['itinerary'][0]
                sep = sample.find('::')
                body = sample[sep+2:sep+60] if sep>=0 else sample[:60]
                print(f"     Tag 1 body: {body!r}")
        time.sleep(1.2)
        
        results.append(data)
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump({'operator':'Adventure Expeditions','touren':results}, f, ensure_ascii=False, indent=2)
    
    has_itin = sum(1 for t in results if t['itinerary'])
    has_body = sum(1 for t in results if any('::' in d and len(d.split('::',1)[1].strip())>20 for d in t.get('itinerary',[])))
    print(f"\n{'='*55}")
    print(f"✓ {len(results)} Touren · {has_itin} mit Itinerary · {has_body} mit Body-Text")
    print(f"  → {OUTPUT.name}")
    print(f"\nJetzt wetu_ae_kenia_v3.json in Claude hochladen!")
