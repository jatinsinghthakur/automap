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
from PIL import Image, ImageDraw, ImageFont

# Set UTF-8 encoding for terminal output on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False


BASE_URL = "https://upbhunaksha.gov.in/bhunakshaserver"

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
    with urllib.request.urlopen(req, timeout=15) as resp:
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

    return dist_code, teh_code, vil_code, dist_name, teh_name, vil_name


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
    with urllib.request.urlopen(req, timeout=15) as resp:
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

    with urllib.request.urlopen(req, timeout=25) as resp:
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
        doc = fitz.open()
        page = doc.new_page(width=pdf_w, height=pdf_h)

        img_buffer = io.BytesIO()
        canvas.save(img_buffer, format="JPEG", quality=95)
        img_buffer.seek(0)

        page.insert_image(fitz.Rect(0, 0, pdf_w, pdf_h), stream=img_buffer.getvalue())
        doc.save(output_pdf_path, deflate=True)
        doc.close()
    else:
        canvas.save(output_pdf_path, "PDF", resolution=300.0)

    print(f"[OK] Success! Both PNG and PDF are ready.")


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
    parser.add_argument("--outdir", "-o", default=".", help="Output directory")

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
        dist, teh, vil, d_name, t_name, v_name = interactive_wizard()
        titles = (d_name, t_name, v_name)
    elif args.giscode:
        gc = args.giscode.strip()
        dist = gc[:3] if len(gc) >= 14 else gc[:2]
        teh = gc[3:8] if len(gc) >= 14 else gc[2:5]
        vil = gc[8:] if len(gc) >= 14 else gc[5:]
        titles = None
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


if __name__ == "__main__":
    main()
