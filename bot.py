"""
UP BhuNaksha Ultra-High Resolution Map Downloader & PDF Generator
-----------------------------------------------------------------
Features:
- Smart English & Hindi name-to-code resolution (District, Tehsil, Village)
- Phonetic transliteration matching (e.g. 'khurja' matches 'खुर्जा', 'bhadaura' matches 'भदौरा')
- Interactive step-by-step wizard (run: python bot.py)
- Large readable text by default (width=2200px)
- CLI listing & searching (--list-districts, --list-tehsils, --list-villages)
"""

import sys
import os
import argparse
import urllib.request
import urllib.parse
import json
import io
import re
import ssl
import shutil
import subprocess
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# Set UTF-8 encoding for terminal output on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import pymupdf  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False


BASE_URL = "https://upbhunaksha.gov.in/bhunakshaserver"

# SSL Context tuned for UP BhuNaksha government server TLS/ciphers
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE
try:
    SSL_CTX.set_ciphers('DEFAULT@SECLEVEL=1')
except Exception:
    pass


# District Name Mapping (Code -> (English, Hindi))
DISTRICTS_MAP = {
    "146": ("Agra", "आगरा"),
    "143": ("Aligarh", "अलीगढ़"),
    "178": ("Ambedkar Nagar", "अम्बेडकरनगर"),
    "203": ("Amethi", "अमेठी"),
    "137": ("Amroha", "अमरोहा"),
    "162": ("Auraiya", "औरैया"),
    "177": ("Ayodhya", "अयोध्या"),
    "191": ("Azamgarh", "आजमगढ"),
    "139": ("Baghpat", "बागपत"),
    "180": ("Bahraich", "बहराइच"),
    "193": ("Ballia", "बलिया"),
    "182": ("Balrampur", "बलरामपुर"),
    "170": ("Banda", "बाँदा"),
    "176": ("Barabanki", "बाराबंकी"),
    "150": ("Bareilly", "बरेली"),
    "185": ("Basti", "बस्ती"),
    "198": ("Bhadohi", "भदोही"),
    "134": ("Bijnor", "बिजनौर"),
    "149": ("Badaun", "बदायूँ"),
    "142": ("Bulandshahr", "बुलन्द शहर"),
    "196": ("Chandauli", "चन्दौली"),
    "171": ("Chitrakoot", "चित्रकूट"),
    "190": ("Deoria", "देवरिया"),
    "201": ("Etah", "एटा"),
    "161": ("Etawah", "इटावा"),
    "159": ("Farrukhabad", "फर्रूखाबाद"),
    "172": ("Fatehpur", "फतेहपुर"),
    "147": ("Firozabad", "फिरोजाबाद"),
    "141": ("Gautam Buddha Nagar", "गौतम बुद्ध नगर"),
    "140": ("Ghaziabad", "गाजियाबाद"),
    "195": ("Ghazipur", "गाजीपुर"),
    "183": ("Gonda", "गोंडा"),
    "188": ("Gorakhpur", "गोरखपुर"),
    "168": ("Hamirpur", "हमीरपुर"),
    "204": ("Hapur", "हापुड़"),
    "155": ("Hardoi", "हरदोई"),
    "144": ("Hathras", "हाथरस"),
    "165": ("Jalaun", "जालौन"),
    "194": ("Jaunpur", "जौनपुर"),
    "166": ("Jhansi", "झांसी"),
    "160": ("Kannauj", "कन्नौज"),
    "163": ("Kanpur Dehat", "कानपुर देहात"),
    "164": ("Kanpur Nagar", "कानपुर नगर"),
    "202": ("Kasganj", "कासगंज"),
    "174": ("Kaushambi", "कौशाम्बी"),
    "153": ("Kheri", "खीरी"),
    "189": ("Kushinagar", "कुशीनगर"),
    "167": ("Lalitpur", "ललितपुर"),
    "157": ("Lucknow", "लखनऊ"),
    "169": ("Mahoba", "महोबा"),
    "187": ("Maharajganj", "महाराजगंज"),
    "148": ("Mainpuri", "मैनपुरी"),
    "145": ("Mathura", "मथुरा"),
    "192": ("Mau", "मऊ"),
    "138": ("Meerut", "मेरठ"),
    "199": ("Mirzapur", "मिर्जापुर"),
    "135": ("Moradabad", "मुरादाबाद"),
    "133": ("Muzaffarnagar", "मुजफफर नगर"),
    "151": ("Pilibhit", "पीलीभीत"),
    "173": ("Pratapgarh", "प्रतापगढ"),
    "175": ("Prayagraj", "प्रयागराज"),
    "158": ("Rae Bareli", "रायबरेली"),
    "136": ("Rampur", "रामपुर"),
    "132": ("Saharanpur", "सहारनपुर"),
    "205": ("Sambhal", "सम्भल"),
    "186": ("Sant Kabir Nagar", "सन्तकबीर नगर"),
    "152": ("Shahjahanpur", "शाहजहांपुर"),
    "206": ("Shamli", "शामली"),
    "181": ("Shravasti", "श्रावस्ती"),
    "184": ("Siddharthnagar", "सिद्धार्थनगर"),
    "154": ("Sitapur", "सीतापुर"),
    "200": ("Sonbhadra", "सोनभद्र"),
    "179": ("Sultanpur", "सुल्तानपुर"),
    "156": ("Unnao", "उन्नाव"),
    "197": ("Varanasi", "वाराणसी")
}

# Phonetic Sound Helpers
VOWEL_SIGNS = set('ािीुूृेैोौंः्ँ')
HINDI_SOUND_MAP = {
    'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g',
    'च': 'c', 'छ': 'c', 'ज': 'j', 'झ': 'j',
    'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd', 'ण': 'n',
    'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n',
    'प': 'p', 'फ': 'p', 'ब': 'b', 'भ': 'b', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 's', 'ष': 's', 'स': 's', 'ह': 'h',
    'ड़': 'd', 'ढ़': 'd'
}

def hindi_to_sound(text: str) -> str:
    return ''.join(HINDI_SOUND_MAP.get(c, '') for c in text if c not in VOWEL_SIGNS)

def english_to_sound(text: str) -> str:
    t = text.lower()
    for eng, repl in [('chh', 'c'), ('kh', 'k'), ('gh', 'g'), ('ch', 'c'), ('jh', 'j'),
                      ('th', 't'), ('dh', 'd'), ('ph', 'p'), ('bh', 'b'), ('sh', 's')]:
        t = t.replace(eng, repl)
    return ''.join(c for c in t if c in 'bcdefghjklmnpqrstvwxyz' and c not in 'aeiou')


def get_level_values(level: int, codes: str = ""):
    """Fetch master data options from BhuNaksha API."""
    url = f"{BASE_URL}/masterdata/levelvalue"
    data = urllib.parse.urlencode({'level': str(level), 'codes': codes}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://upbhunaksha.gov.in/home'
        }
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def resolve_district(query: str) -> tuple[str, str]:
    """Resolves a query (code, English name, or Hindi name) to (code, display_name)."""
    q = query.strip().lower()
    if q in DISTRICTS_MAP:
        eng, hin = DISTRICTS_MAP[q]
        return q, f"{eng} ({hin})"

    matches = []
    for code, (eng, hin) in DISTRICTS_MAP.items():
        if q in eng.lower() or q in hin.lower() or q == code:
            matches.append((code, f"{eng} ({hin})"))

    if not matches:
        q_sound = english_to_sound(q)
        for code, (eng, hin) in DISTRICTS_MAP.items():
            if q_sound and q_sound in english_to_sound(eng):
                matches.append((code, f"{eng} ({hin})"))

    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"\n[?] Multiple districts matched '{query}':")
        for i, (code, name) in enumerate(matches, 1):
            print(f"  [{i}] Code {code} -> {name}")
        sel = input("Enter number to select (or 1): ").strip() or "1"
        try:
            return matches[int(sel) - 1]
        except Exception:
            return matches[0]
    else:
        raise ValueError(f"No district found matching '{query}'. Run with --list-districts to view all.")


def resolve_tehsil(dist_code: str, query: str) -> tuple[str, str]:
    """Resolves a tehsil query for a given district using Code, Hindi, or English phonetics."""
    tehsils = get_level_values(2, dist_code)
    q = query.strip().lower()

    # Match exact code or numeric index
    if q.isdigit():
        for t in tehsils:
            if t['code'].endswith(q) or t['code'] == q.zfill(5):
                return t['code'], t['value']

    # Exact Hindi text match
    matches = []
    for t in tehsils:
        if q in t['value'].lower() or q in t['code']:
            matches.append((t['code'], t['value']))

    # Phonetic English match
    if not matches:
        q_sound = english_to_sound(q)
        if q_sound:
            for t in tehsils:
                t_sound = hindi_to_sound(t['value'])
                if q_sound == t_sound or q_sound in t_sound:
                    matches.append((t['code'], t['value']))

    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"\n[?] Multiple tehsils matched '{query}':")
        for i, (code, name) in enumerate(matches, 1):
            print(f"  [{i}] Code {code} -> {name}")
        sel = input("Enter number to select (or 1): ").strip() or "1"
        try:
            return matches[int(sel) - 1]
        except Exception:
            return matches[0]
    else:
        print(f"\nAvailable tehsils in district {dist_code}:")
        for i, t in enumerate(tehsils, 1):
            print(f"  [{i}] Code: {t['code']} -> {t['value']}")
        sel = input("Select tehsil number: ").strip() or "1"
        try:
            chosen = tehsils[int(sel) - 1]
            return chosen['code'], chosen['value']
        except Exception:
            return tehsils[0]['code'], tehsils[0]['value']


def resolve_village(dist_code: str, tehsil_code: str, query: str) -> tuple[str, str]:
    """Resolves a village query for a given tehsil."""
    villages = get_level_values(3, f"{dist_code},{tehsil_code}")
    q = query.strip().lower()

    # Exact code match
    for v in villages:
        if v['code'] == query.strip():
            return v['code'], v['value']

    matches = []
    # Hindi text match
    for v in villages:
        if q in v['value'].lower() or q in v['code']:
            matches.append((v['code'], v['value']))

    # Phonetic English match
    if not matches:
        def norm_sound(s: str) -> str:
            return s.replace('y', '').replace('w', '').replace('v', '')

        q_sound = norm_sound(english_to_sound(q))
        q_words = [norm_sound(english_to_sound(w)) for w in q.split() if w]
        q_words = [w for w in q_words if w]

        if q_sound:
            # 1. Exact sound match across the whole phrase
            exact_sound_matches = []
            for v in villages:
                v_sound = norm_sound(hindi_to_sound(v['value']))
                if q_sound == v_sound:
                    exact_sound_matches.append((v['code'], v['value']))

            if len(exact_sound_matches) == 1:
                return exact_sound_matches[0]
            elif len(exact_sound_matches) > 1:
                matches = exact_sound_matches
            else:
                # 2. Word-by-word match: all query words are in the village name
                word_matches = []
                for v in villages:
                    v_word_sounds = [norm_sound(hindi_to_sound(w)) for w in v['value'].split() if w]
                    if all(any(qw == vw or qw in vw for vw in v_word_sounds) for qw in q_words):
                        word_matches.append((v['code'], v['value']))

                if len(word_matches) == 1:
                    return word_matches[0]
                elif len(word_matches) > 1:
                    matches = word_matches
                else:
                    # 3. Substring sound match fallback
                    for v in villages:
                        v_sound = norm_sound(hindi_to_sound(v['value']))
                        if len(q_sound) >= 3 and q_sound in v_sound:
                            matches.append((v['code'], v['value']))

    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"\n[?] Multiple villages matched '{query}' (showing top matches):")
        for i, (code, name) in enumerate(matches[:15], 1):
            print(f"  [{i}] Code {code} -> {name}")
        sel = input("Enter number to select (or 1): ").strip() or "1"
        try:
            return matches[int(sel) - 1]
        except Exception:
            return matches[0]
    else:
        raise ValueError(f"No village found matching '{query}' in tehsil {tehsil_code}. Run with --list-villages {dist_code} {tehsil_code} to browse.")


def interactive_wizard():
    """Interactive step-by-step selection wizard."""
    print("=" * 60)
    print("  UP BhuNaksha Cadastral Map Downloader (Interactive)")
    print("=" * 60)

    # 1. District
    print("\n[Step 1/3] District Selection:")
    d_input = input("Enter District name or code (e.g. 'Bulandshahr', 'Lucknow', '142') [Default: Bulandshahr]: ").strip()
    if not d_input:
        d_input = "142"
    dist_code, dist_name = resolve_district(d_input)
    print(f"  -> Selected District: {dist_name} [Code: {dist_code}]")

    # 2. Tehsil
    print(f"\n[Step 2/3] Fetching Tehsils for {dist_name}...")
    tehsils = get_level_values(2, dist_code)
    print(f"Available Tehsils in {dist_name}:")
    for i, t in enumerate(tehsils, 1):
        print(f"  [{i}] {t['value']} (Code: {t['code']})")

    t_input = input("\nEnter Tehsil number, name, or code (e.g. 'Khurja' or 2) [Default: 1]: ").strip() or "1"
    if t_input.isdigit() and 1 <= int(t_input) <= len(tehsils):
        teh_code = tehsils[int(t_input) - 1]['code']
        teh_name = tehsils[int(t_input) - 1]['value']
    else:
        teh_code, teh_name = resolve_tehsil(dist_code, t_input)
    print(f"  -> Selected Tehsil: {teh_name} [Code: {teh_code}]")

    # 3. Village
    print(f"\n[Step 3/3] Village in {teh_name}:")
    v_input = input("Enter Village name in English/Hindi (e.g. 'Bhadaura' or '121533'): ").strip()
    if not v_input:
        v_input = "121533"
    vil_code, vil_name = resolve_village(dist_code, teh_code, v_input)
    print(f"  -> Selected Village: {vil_name} [Code: {vil_code}]")

    rep_input = input("\nEnter Plot Number to download full Plot Report (optional, press Enter to skip): ").strip()

    return dist_code, teh_code, vil_code, dist_name, teh_name, vil_name, rep_input


def fetch_village_extent(district: str, tehsil: str, village: str):
    url = f"{BASE_URL}/MapInfo/getVVVVExtentGeoref"
    levels = f"{district.strip()},{tehsil.strip()},{village.strip()}"
    data = urllib.parse.urlencode({'gisLevels': levels}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://upbhunaksha.gov.in/home'
        }
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
        content = resp.read().decode('utf-8')
        info = json.loads(content)
        return info


def download_wms_map(info: dict, width: int = 2200) -> Image.Image:
    xmin = info['xmin']
    ymin = info['ymin']
    xmax = info['xmax']
    ymax = info['ymax']
    crs = info.get('crs', 'EPSG:32644')
    gis_code = info['gisCode']

    dx = xmax - xmin
    dy = ymax - ymin
    if dx <= 0 or dy <= 0:
        raise ValueError("Invalid map extent received from server. Map may not be digitized for this village.")

    height = int(width * (dy / dx))
    print(f"[+] Requesting large-numbers map: {width} x {height} px...")

    params = {
        'SERVICE': 'WMS',
        'VERSION': '1.3.0',
        'REQUEST': 'GetMap',
        'FORMAT': 'image/png',
        'TRANSPARENT': 'FALSE',
        'LAYERS': 'VILLAGE_MAP',
        'STYLES': 'VILLAGE_MAP',
        'CRS': crs,
        'gis_code': gis_code,
        'overlay_codes': '',
        'state': '',
        'BBOX': f"{xmin},{ymin},{xmax},{ymax}",
        'WIDTH': str(width),
        'HEIGHT': str(height)
    }

    wms_url = f"{BASE_URL}/WMS?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        wms_url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://upbhunaksha.gov.in/home'
        }
    )

    with urllib.request.urlopen(req, context=SSL_CTX, timeout=25) as resp:
        img_bytes = resp.read()
        return Image.open(io.BytesIO(img_bytes))


def create_print_ready_pdf(map_img: Image.Image, info: dict, output_pdf_path: str, output_png_path: str, titles: tuple = None):
    w, h = map_img.size

    margin = 80
    header_height = 200
    footer_height = 80

    total_w = w + margin * 2
    total_h = h + header_height + footer_height + margin

    print(f"[+] Formatting layout ({total_w} x {total_h} px)...")
    canvas = Image.new("RGB", (total_w, total_h), (255, 255, 255))
    canvas.paste(map_img, (margin, header_height))

    draw = ImageDraw.Draw(canvas)

    font_title = None
    font_sub = None
    font_info = None

    for font_name in ["arial.ttf", "calibri.ttf", "seguisym.ttf"]:
        try:
            font_title = ImageFont.truetype(font_name, 55)
            font_sub = ImageFont.truetype(font_name, 35)
            font_info = ImageFont.truetype(font_name, 22)
            break
        except Exception:
            pass

    if not font_title:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_info = ImageFont.load_default()

    gis_code = info.get('gisCode', '')
    crs = info.get('crs', 'EPSG:32644')

    title_text = "UP BHUNAKSHA - CADASTRAL VILLAGE OVERVIEW"
    if titles:
        d_name, t_name, v_name = titles
        sub_text = f"District: {d_name} | Tehsil: {t_name} | Village: {v_name}"
    else:
        sub_text = f"GIS Code: {gis_code}  |  CRS: {crs}"

    meta_text = f"GIS Code: {gis_code}  |  Spatial Reference: {crs}  |  Large Legible Numbers Edition"
    footer_text = "Generated from official UP BhuNaksha Cadastral Service | Large legible khasra numbers"

    draw.text((total_w // 2, 35), title_text, fill=(20, 35, 60), font=font_title, anchor="mt")
    draw.text((total_w // 2, 105), sub_text, fill=(45, 55, 75), font=font_sub, anchor="mt")
    draw.text((total_w // 2, 150), meta_text, fill=(90, 100, 115), font=font_info, anchor="mt")

    draw.rectangle(
        [(margin - 3, header_height - 3), (margin + w + 3, header_height + h + 3)],
        outline=(180, 185, 195),
        width=3
    )

    draw.text((total_w // 2, total_h - 50), footer_text, fill=(120, 120, 130), font=font_info, anchor="mt")

    print(f"[+] Saving full-resolution PNG to: {output_png_path}")
    canvas.save(output_png_path, format="PNG", optimize=True)

    print(f"[+] Generating PDF to: {output_pdf_path}")
    if HAS_FITZ:
        pdf_w = 1200
        pdf_h = int(pdf_w * (total_h / total_w))
        doc = pymupdf.open()
        page = doc.new_page(width=pdf_w, height=pdf_h)

        img_buffer = io.BytesIO()
        canvas.save(img_buffer, format="JPEG", quality=95)
        img_buffer.seek(0)

        page.insert_image(pymupdf.Rect(0, 0, pdf_w, pdf_h), stream=img_buffer.getvalue())
        doc.save(output_pdf_path, deflate=True)
        doc.close()
    else:
        canvas.save(output_pdf_path, "PDF", resolution=300.0)

    print(f"[OK] Success! Both PNG and PDF are ready.")


def find_chrome_or_edge() -> str | None:
    """Finds installed Google Chrome or Microsoft Edge executable for high-fidelity PDF rendering."""
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    for cmd in ["msedge", "edge", "chrome", "google-chrome", "chromium"]:
        p = shutil.which(cmd)
        if p:
            return p
    return None


def fetch_plot_image(gis_code: str, plot_no: str):
    """Fetches cadastral plot map snippet (imageBase64 and scale) from UP BhuNaksha API."""
    url = f"{BASE_URL}/api/plots?gisCode={urllib.parse.quote(gis_code)}&plotNo={urllib.parse.quote(plot_no)}"
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://upbhunaksha.gov.in/home'
        }
    )
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as r:
            data = json.loads(r.read().decode('utf-8'))
            return data.get('imageBase64'), data.get('scale')
    except Exception as e:
        print(f"[!] Warning: Could not fetch plot map snippet: {e}")
        return None, None


def fetch_and_parse_plot_info(gis_code: str, plot_no: str):
    """Fetches official khata, khasra subdivisions, land owners, and mutation orders for a plot."""
    url = f"{BASE_URL}/MapInfo/getPlotInfo"
    body = json.dumps({'gisCode': gis_code, 'plotNo': str(plot_no)}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://upbhunaksha.gov.in/home'
        }
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as r:
        raw_text = r.read().decode('utf-8')

    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    khatas = []
    owners = []
    orders = []

    current_section = None
    current_khata = None

    for line in lines:
        km = re.search(r'Khata\s*No:\s*([^\s]+)\s+Plot\s*No:\s*([^\s]+)\s+Area\s*:\s*([0-9.]+)\s*Hectare', line, re.I)
        if km:
            khatas.append({
                'khata_no': km.group(1),
                'plot_no': km.group(2),
                'area_ha': km.group(3)
            })
            continue

        om = re.search(r'Owner\s*Details\s*For\s*Khata\s*No\.?:-?\s*([^\s]+)', line, re.I)
        if om:
            current_section = 'owners'
            current_khata = om.group(1)
            continue

        ordm = re.search(r'Order\s*Description\s*For\s*Khata\s*No\.?:-?\s*([^\s]+)', line, re.I)
        if ordm:
            current_section = 'orders'
            current_khata = ordm.group(1)
            continue

        if current_section == 'owners':
            omatch = re.search(r'(\d+)\s*:-\s*नाम\s*:\s*(.*?)\s+संरक्षक\s*का\s*नाम\s*:\s*(.*?)\s+निवास\s*स्थान\s*:\s*(.*)', line)
            if omatch:
                owners.append({
                    'khata_no': current_khata,
                    'serial': omatch.group(1),
                    'name': omatch.group(2).strip(),
                    'guardian': '' if omatch.group(3).strip() == '---' else omatch.group(3).strip(),
                    'residence': omatch.group(4).strip()
                })
                continue

        if current_section == 'orders':
            ordmatch = re.match(r'^(\d+)\s*:\s*(.*)', line)
            if ordmatch:
                orders.append({
                    'khata_no': current_khata,
                    'serial': ordmatch.group(1),
                    'text': ordmatch.group(2).strip()
                })
                continue
            elif orders:
                orders[-1]['text'] += ' ' + line

    base_plot = plot_no.replace('मि', '').replace('mi', '').strip()
    khatas.sort(key=lambda x: (0 if x['plot_no'] == base_plot else 1, x['plot_no']))
    tot_ha = f"{sum(float(k['area_ha']) for k in khatas):.4f}" if khatas else "---"

    return {
        'plot_no': plot_no,
        'base_plot_no': base_plot,
        'khatas': khatas,
        'owners': owners,
        'orders': orders,
        'total_area_ha': tot_ha,
        'raw_text': raw_text
    }


def generate_plot_report_html(plot_no: str, gis_code: str, titles: tuple, plot_data: dict, img_b64: str = None, scale: str = None) -> str:
    """Generates print-ready HTML matching the frontend's official Plot Report design."""
    d_name, t_name, v_name = titles if titles else ("---", "---", "---")
    khatas = plot_data.get('khatas', [])
    owners = plot_data.get('owners', [])
    orders = plot_data.get('orders', [])
    tot_ha = plot_data.get('total_area_ha', '---')

    if khatas:
        sub_rows = "".join(
            f'<tr><td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">{i}</td>'
            f'<td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: 600;">{k["plot_no"]}</td>'
            f'<td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">{k["khata_no"]}</td>'
            f'<td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: 600;">{k["area_ha"]} Ha</td></tr>'
            for i, k in enumerate(khatas, 1)
        )
    else:
        sub_rows = (
            f'<tr><td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">1</td>'
            f'<td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: 600;">{plot_no}</td>'
            f'<td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">---</td>'
            f'<td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: 600;">{tot_ha} Ha</td></tr>'
        )

    if owners:
        owner_rows_list = []
        current_khata_group = None
        for i, o in enumerate(owners, 1):
            khata = o.get("khata_no", "")
            if khata and khata != current_khata_group:
                current_khata_group = khata
                khasra_label = next((k['plot_no'] for k in khatas if k['khata_no'] == khata), plot_no)
                owner_rows_list.append(
                    f'<tr><td colspan="4" style="background: #fef3c7; border: 1px solid #cbd5e1; padding: 6px; font-weight: 700; color: #92400e; font-size: 11px;">'
                    f'📌 खसरा (Khasra) : {khasra_label} | खाता (Khata) : {khata} के खातेदार</td></tr>'
                )
            owner_rows_list.append(
                f'<tr style="background: {"#ffffff" if i % 2 != 0 else "#f8fafc"};">'
                f'<td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center;">{o.get("serial") or i}</td>'
                f'<td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: 600;">{o["name"]}</td>'
                f'<td style="border: 1px solid #cbd5e1; padding: 4px;">{o["guardian"] or "---"}</td>'
                f'<td style="border: 1px solid #cbd5e1; padding: 4px;">{o["residence"] or "नि.ग्राम"}</td></tr>'
            )
        owner_rows = "".join(owner_rows_list)
    else:
        owner_rows = (
            '<tr><td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #64748b;">'
            'No individual owner records listed (e.g. Government/Public Land).</td></tr>'
        )

    img_html = ""
    if img_b64:
        scale_label = f" [Scale: {scale}]" if scale else ""
        img_html = f"""
        <div style="text-align: center; margin-bottom: 16px; border: 1px solid #cbd5e1; padding: 12px; background: #f8fafc; border-radius: 4px;">
          <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px;">
            Plot Cadastral Map (नक़्शा विवरण){scale_label}
          </div>
          <img src="data:image/png;base64,{img_b64}" style="max-width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #94a3b8; background: #fff;" />
        </div>
        """

    orders_html = ""
    if orders:
        cards = "".join(
            f'<div style="border: 1px solid #fde68a; background: #fffdf5; padding: 6px 10px; font-size: 10px; border-radius: 3px; line-height: 1.4; margin-bottom: 6px;">'
            f'<span style="font-weight: 700; color: #b45309;">#{ord_item.get("serial") or i} [खाता {ord_item.get("khata_no", "")}]:</span> '
            f'<span style="color: #78350f;">{ord_item.get("text", "")}</span></div>'
            for i, ord_item in enumerate(orders, 1)
        )
        orders_html = f"""
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 6px;">
            राजस्व आदेश एवं नामांतरण विवरण / Registered Orders ({len(orders)})
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            {cards}
          </div>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>UP BhuNaksha - Plot Report {plot_no}</title>
  <style>
    @page {{
      size: A4;
      margin: 10mm;
    }}
    *, *:before, *:after {{
      box-sizing: border-box;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    .report-container {{
      border: 2px solid #0f172a;
      padding: 18px;
      border-radius: 4px;
      background: #ffffff;
    }}
    tr {{
      page-break-inside: avoid;
    }}
  </style>
</head>
<body>
  <div class="report-container">
    <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px;">
      <div style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
        उत्तर प्रदेश राजस्व परिषद / Board of Revenue, Uttar Pradesh
      </div>
      <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">
        UP BHUNAKSHA - PLOT CADASTRAL REPORT (गाटा नक़्शा रिपोर्ट)
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px;">
      <tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600; width: 22%;">District / जनपद:</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 28%;">{d_name}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600; width: 22%;">Tehsil / तहसील:</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 28%;">{t_name}</td>
      </tr>
      <tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Village / ग्राम:</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{v_name}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Village GIS Code:</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-family: monospace;">{gis_code}</td>
      </tr>
      <tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f0fdf4; font-weight: 700; color: #166534;">Plot No. (गाटा सं.):</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; color: #1e40af;">{plot_no}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f0fdf4; font-weight: 700; color: #166534;">Total Area / कुल क्षेत्रफल:</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; color: #166534;">{tot_ha} Hectares</td>
      </tr>
    </table>

    {img_html}

    <div style="margin-bottom: 14px;">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 5px;">
        Khasra & Khata Breakdown / गाटा एवं खाता अंश विवरण
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #e2e8f0;">
            <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; width: 12%;">S.No</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: left;">Khasra No. (गाटा)</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: left;">Khata No. (खाता सं.)</th>
            <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: right;">Area (Hectares)</th>
          </tr>
        </thead>
        <tbody>
          {sub_rows}
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 14px;">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 5px;">
        Land Owners / खातेदार विवरण ({len(owners)})
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
        <thead>
          <tr style="background: #e2e8f0;">
            <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; width: 8%;">क्र.सं.</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; width: 34%;">खातेदार का नाम</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; width: 34%;">पिता / संरक्षक का नाम</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; width: 24%;">निवास स्थान</th>
          </tr>
        </thead>
        <tbody>
          {owner_rows}
        </tbody>
      </table>
    </div>

    {orders_html}

    <div style="border-top: 1px solid #cbd5e1; padding-top: 7px; font-size: 9px; color: #94a3b8; text-align: center;">
      यह प्रपत्र UP BhuNaksha / राजस्व परिषद के भूलेख पोर्टल से जनरेट किया गया है। विधिक प्रमाण हेतु प्राधिकृत खतौनी ही मान्य होगी।
    </div>
  </div>
</body>
</html>
"""


def download_plot_report(gis_code: str, plot_no: str, outdir: str = "output", titles: tuple = None):
    """Fetches records and renders high-fidelity cadastral Plot Report PDF into output directory."""
    os.makedirs(outdir, exist_ok=True)
    safe_v = (titles[2] if titles else "Village").split("(")[0].strip().replace(" ", "_").replace("/", "_")
    output_pdf_path = os.path.join(outdir, f"Plot_Report_{plot_no}_{safe_v}.pdf")

    print(f"\n[+] Fetching official land records for Plot {plot_no}...")
    plot_data = fetch_and_parse_plot_info(gis_code, plot_no)
    num_sub = len(plot_data.get('khatas', []))
    num_owners = len(plot_data.get('owners', []))
    num_orders = len(plot_data.get('orders', []))
    print(f"[+] Found {num_sub} khasra subdivision(s), {num_owners} owner(s), {num_orders} order(s).")

    print(f"[+] Fetching plot cadastral map snippet...")
    img_b64, scale = fetch_plot_image(gis_code, plot_no)

    print(f"[+] Compiling authentic A4 Plot Cadastral Report HTML...")
    html_content = generate_plot_report_html(plot_no, gis_code, titles, plot_data, img_b64, scale)

    temp_html_path = output_pdf_path.replace(".pdf", "_temp.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    browser_bin = find_chrome_or_edge()
    if not browser_bin:
        print("[!] Note: No Chrome or Edge browser executable found for headless PDF printing.")
        print(f"[+] Saved formatted HTML report to: {temp_html_path}")
        return temp_html_path

    print(f"[+] Rendering print-ready PDF using {os.path.basename(browser_bin)}...")
    abs_html = os.path.abspath(temp_html_path)
    abs_pdf = os.path.abspath(output_pdf_path)

    cmd = [
        browser_bin,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={abs_pdf}",
        f"file:///{abs_html}"
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if os.path.exists(temp_html_path):
        try:
            os.remove(temp_html_path)
        except Exception:
            pass

    print(f"[OK] Plot Report PDF successfully saved to: {output_pdf_path}")
    print(f"     File Size: {os.path.getsize(output_pdf_path):,} bytes")
    return output_pdf_path



def parse_free_query(raw_query: str) -> dict:
    """Parses free-text query like 'bulandshahr khurja kapna' into district, tehsil, village."""
    raw = raw_query.strip()
    if raw.isdigit() and len(raw) >= 10:
        return {"giscode": raw}

    # If comma separated: 'bulandshahr, khurja, kapna'
    if "," in raw:
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        if len(parts) >= 3:
            return {"district": parts[0], "tehsil": parts[1], "village": " ".join(parts[2:])}
        elif len(parts) == 2:
            return {"district": parts[0], "tehsil": parts[1]}

    # Otherwise split by spaces
    words = raw.split()
    if len(words) == 3:
        return {"district": words[0], "tehsil": words[1], "village": words[2]}
    elif len(words) > 3:
        # Match multi-word districts (e.g. 'Gautam Buddha Nagar', 'Kanpur Nagar')
        for d_len in (3, 2, 1):
            d_cand = " ".join(words[:d_len]).lower()
            for code, (eng, hin) in DISTRICTS_MAP.items():
                if d_cand in eng.lower() or d_cand in hin.lower():
                    rem = words[d_len:]
                    if len(rem) >= 2:
                        return {"district": d_cand, "tehsil": rem[0], "village": " ".join(rem[1:])}
                    elif len(rem) == 1:
                        return {"district": d_cand, "tehsil": rem[0]}
        return {"district": words[0], "tehsil": words[1], "village": " ".join(words[2:])}
    elif len(words) == 2:
        return {"district": words[0], "tehsil": words[1]}
    elif len(words) == 1:
        return {"district": words[0]}
    return {}


def main():
    parser = argparse.ArgumentParser(description="Download UP BhuNaksha Cadastral Map (Large Numbers Edition)")
    parser.add_argument("query", nargs="*", help="Direct search query without flags: e.g. 'bulandshahr khurja kapna' or GIS code")
    parser.add_argument("--interactive", "-i", action="store_true", help="Launch interactive step-by-step wizard")
    parser.add_argument("--list-districts", action="store_true", help="List all 75 districts with codes")
    parser.add_argument("--list-tehsils", metavar="DISTRICT", help="List all tehsils in a district (name or code)")
    parser.add_argument("--list-villages", nargs=2, metavar=("DISTRICT", "TEHSIL"), help="List all villages in a tehsil")
    parser.add_argument("--district", "-d", help="District name or code (e.g. 'Bulandshahr' or '142')")
    parser.add_argument("--tehsil", "-t", help="Tehsil name or code (e.g. 'Khurja' or '00751')")
    parser.add_argument("--village", "-v", help="Village name or code (e.g. 'Bhadaura' or '121533')")
    parser.add_argument("--giscode", "-g", help="Full 14-digit GIS Code")
    parser.add_argument("--width", "-w", type=int, default=2200, help="Target image width in pixels (default: 2200 for large readable text)")
    parser.add_argument("--outdir", "-o", default="output", help="Output directory for generated maps, images, and reports (default: output)")
    parser.add_argument("--report", help="Plot number to generate and download cadastral plot report PDF (e.g. --report 807)")

    args = parser.parse_args()

    # Parse positional query without flags (e.g. python bot.py "bulandshahr khurja kapna")
    if args.query:
        raw_q = " ".join(args.query).strip()
        parsed = parse_free_query(raw_q)
        if "giscode" in parsed:
            args.giscode = parsed["giscode"]
        else:
            if "district" in parsed and not args.district:
                args.district = parsed["district"]
            if "tehsil" in parsed and not args.tehsil:
                args.tehsil = parsed["tehsil"]
            if "village" in parsed and not args.village:
                args.village = parsed["village"]

    # Listing commands
    if args.list_districts:
        print("\n" + "=" * 55)
        print("  ALL 75 DISTRICTS IN UTTAR PRADESH")
        print("=" * 55)
        for code, (eng, hin) in sorted(DISTRICTS_MAP.items(), key=lambda x: x[1][0]):
            print(f"  Code: {code} -> {eng} ({hin})")
        return

    if args.list_tehsils:
        dist_code, dist_name = resolve_district(args.list_tehsils)
        tehsils = get_level_values(2, dist_code)
        print(f"\nTehsils in District {dist_name} [Code {dist_code}]:")
        for i, t in enumerate(tehsils, 1):
            print(f"  [{i}] Code: {t['code']} -> {t['value']}")
        return

    if args.list_villages:
        dist_code, dist_name = resolve_district(args.list_villages[0])
        teh_code, teh_name = resolve_tehsil(dist_code, args.list_villages[1])
        villages = get_level_values(3, f"{dist_code},{teh_code}")
        print(f"\nVillages in {dist_name} -> {teh_name} [Total {len(villages)}]:")
        for v in villages:
            print(f"  Code: {v['code']} -> {v['value']}")
        return

    # Check if we should run interactive wizard
    if args.interactive or (not args.giscode and not (args.district and args.tehsil and args.village)):
        dist, teh, vil, d_name, t_name, v_name, rep_input = interactive_wizard()
        titles = (d_name, t_name, v_name)
        if rep_input and not args.report:
            args.report = rep_input
    elif args.giscode:
        gc = args.giscode.strip()
        dist = gc[:3] if len(gc) >= 14 else gc[:2]
        teh = gc[3:8] if len(gc) >= 14 else gc[2:5]
        vil = gc[8:] if len(gc) >= 14 else gc[5:]
        d_info = DISTRICTS_MAP.get(dist, ("District", ""))
        titles = (f"{d_info[0]} ({d_info[1]})" if d_info[1] else d_info[0], f"Tehsil {teh}", f"Village {vil}")
    else:
        dist, d_name = resolve_district(args.district)
        teh, t_name = resolve_tehsil(dist, args.tehsil)
        vil, v_name = resolve_village(dist, teh, args.village)
        titles = (d_name, t_name, v_name)

    print(f"\n[+] Fetching village extent for District={dist}, Tehsil={teh}, Village={vil}...")
    info = fetch_village_extent(dist, teh, vil)
    print(f"[+] Extent: x=[{info['xmin']}, {info['xmax']}], y=[{info['ymin']}, {info['ymax']}]")
    print(f"[+] GIS Code: {info['gisCode']}, CRS: {info.get('crs')}")

    map_img = download_wms_map(info, width=args.width)

    os.makedirs(args.outdir, exist_ok=True)
    prefix = f"UP_BhuNaksha_{info['gisCode']}_{dist}_{teh}_{vil}"
    png_path = os.path.join(args.outdir, f"{prefix}_LargeText.png")
    pdf_path = os.path.join(args.outdir, f"{prefix}_LargeText_PrintReady.pdf")

    create_print_ready_pdf(map_img, info, pdf_path, png_path, titles=titles)

    if args.report:
        print(f"\n[+] Generating Plot Report for Plot No: {args.report}...")
        download_plot_report(gis_code=info['gisCode'], plot_no=str(args.report).strip(), outdir=args.outdir, titles=titles)


if __name__ == "__main__":
    main()
