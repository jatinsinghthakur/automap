// UP BhuNaksha API Service with Masterdata & Phonetic Search

export const DISTRICTS_MAP = {
  "146": ["Agra", "आगरा"],
  "143": ["Aligarh", "अलीगढ़"],
  "178": ["Ambedkar Nagar", "अम्बेडकरनगर"],
  "203": ["Amethi", "अमेठी"],
  "137": ["Amroha", "अमरोहा"],
  "162": ["Auraiya", "औरैया"],
  "177": ["Ayodhya", "अयोध्या"],
  "191": ["Azamgarh", "आजमगढ"],
  "139": ["Baghpat", "बागपत"],
  "180": ["Bahraich", "बहराइच"],
  "193": ["Ballia", "बलिया"],
  "182": ["Balrampur", "बलरामपुर"],
  "170": ["Banda", "बाँदा"],
  "176": ["Barabanki", "बाराबंकी"],
  "150": ["Bareilly", "बरेली"],
  "185": ["Basti", "बस्ती"],
  "198": ["Bhadohi", "भदोही"],
  "134": ["Bijnor", "बिजनौर"],
  "149": ["Badaun", "बदायूँ"],
  "142": ["Bulandshahr", "बुलन्द शहर"],
  "196": ["Chandauli", "चन्दौली"],
  "171": ["Chitrakoot", "चित्रकूट"],
  "190": ["Deoria", "देवरिया"],
  "201": ["Etah", "एटा"],
  "161": ["Etawah", "इटावा"],
  "159": ["Farrukhabad", "फर्रूखाबाद"],
  "172": ["Fatehpur", "फतेहपुर"],
  "147": ["Firozabad", "फिरोजाबाद"],
  "141": ["Gautam Buddha Nagar", "गौतम बुद्ध नगर"],
  "140": ["Ghaziabad", "गाजियाबाद"],
  "195": ["Ghazipur", "गाजीपुर"],
  "183": ["Gonda", "गोंडा"],
  "188": ["Gorakhpur", "गोरखपुर"],
  "168": ["Hamirpur", "हमीरपुर"],
  "204": ["Hapur", "हापुड़"],
  "155": ["Hardoi", "हरदोई"],
  "144": ["Hathras", "हाथरस"],
  "165": ["Jalaun", "जालौन"],
  "194": ["Jaunpur", "जौनपुर"],
  "166": ["Jhansi", "झांसी"],
  "160": ["Kannauj", "कन्नौज"],
  "163": ["Kanpur Dehat", "कानपुर देहात"],
  "164": ["Kanpur Nagar", "कानपुर नगर"],
  "202": ["Kasganj", "कासगंज"],
  "174": ["Kaushambi", "कौशाम्बी"],
  "153": ["Kheri", "खीरी"],
  "189": ["Kushinagar", "कुशीनगर"],
  "167": ["Lalitpur", "ललितपुर"],
  "157": ["Lucknow", "लखनऊ"],
  "169": ["Mahoba", "महोबा"],
  "187": ["Maharajganj", "महाराजगंज"],
  "148": ["Mainpuri", "मैनपुरी"],
  "145": ["Mathura", "मथुरा"],
  "192": ["Mau", "मऊ"],
  "138": ["Meerut", "मेरठ"],
  "199": ["Mirzapur", "मिर्जापुर"],
  "135": ["Moradabad", "मुरादाबाद"],
  "133": ["Muzaffarnagar", "मुजफफर नगर"],
  "151": ["Pilibhit", "पीलीभीत"],
  "173": ["Pratapgarh", "प्रतापगढ"],
  "175": ["Prayagraj", "प्रयागराज"],
  "158": ["Rae Bareli", "रायबरेली"],
  "136": ["Rampur", "रामपुर"],
  "132": ["Saharanpur", "सहारनपुर"],
  "205": ["Sambhal", "सम्भल"],
  "186": ["Sant Kabir Nagar", "सन्तकबीर नगर"],
  "152": ["Shahjahanpur", "शाहजहांपुर"],
  "206": ["Shamli", "शामली"],
  "181": ["Shravasti", "श्रावस्ती"],
  "184": ["Siddharthnagar", "सिद्धार्थनगर"],
  "154": ["Sitapur", "सीतापुर"],
  "200": ["Sonbhadra", "सोनभद्र"],
  "179": ["Sultanpur", "सुल्तानपुर"],
  "156": ["Unnao", "उन्नाव"],
  "197": ["Varanasi", "वाराणसी"]
};

// Phonetic Helpers
const VOWEL_SIGNS = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', '्', 'ँ']);
const HINDI_SOUND_MAP = {
  'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g',
  'च': 'c', 'छ': 'c', 'ज': 'j', 'झ': 'j',
  'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd', 'ण': 'n',
  'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n',
  'प': 'p', 'फ': 'p', 'ब': 'b', 'भ': 'b', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 's', 'ष': 's', 'स': 's', 'ह': 'h',
  'ड़': 'd', 'ढ़': 'd'
};

export function hindiToSound(text) {
  if (!text) return '';
  let res = '';
  for (const c of text) {
    if (!VOWEL_SIGNS.has(c) && HINDI_SOUND_MAP[c]) {
      res += HINDI_SOUND_MAP[c];
    }
  }
  return res;
}

export function englishToSound(text) {
  if (!text) return '';
  let t = text.toLowerCase();
  const repls = [
    ['chh', 'c'], ['kh', 'k'], ['gh', 'g'], ['ch', 'c'], ['jh', 'j'],
    ['th', 't'], ['dh', 'd'], ['ph', 'p'], ['bh', 'b'], ['sh', 's']
  ];
  for (const [eng, rep] of repls) {
    t = t.replaceAll(eng, rep);
  }
  let res = '';
  for (const c of t) {
    if ('bcdefghjklmnpqrstvwxyz'.includes(c) && !'aeiou'.includes(c)) {
      res += c;
    }
  }
  return res;
}

export function normSound(s) {
  return s.replace(/[ywv]/g, '');
}

// Masterdata API Calls
export async function fetchDistricts() {
  const params = new URLSearchParams({ level: '1', codes: '' });
  const res = await fetch('/bhunakshaserver/masterdata/levelvalue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) throw new Error('Failed to load districts from UP BhuNaksha');
  const list = await res.json();
  return list.map(item => {
    const code = item.code;
    const eng = DISTRICTS_MAP[code] ? DISTRICTS_MAP[code][0] : item.value;
    const hin = DISTRICTS_MAP[code] ? DISTRICTS_MAP[code][1] : item.value;
    return { code, eng, hin, display: `${eng} (${hin})` };
  }).sort((a, b) => a.eng.localeCompare(b.eng));
}

export async function fetchTehsils(distCode) {
  const params = new URLSearchParams({ level: '2', codes: distCode });
  const res = await fetch('/bhunakshaserver/masterdata/levelvalue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) throw new Error('Failed to load tehsils');
  const list = await res.json();
  return list.map(item => ({
    code: item.code,
    name: item.value,
    display: `${item.value} (${item.code})`
  }));
}

export async function fetchVillages(distCode, tehsilCode) {
  const params = new URLSearchParams({ level: '3', codes: `${distCode},${tehsilCode}` });
  const res = await fetch('/bhunakshaserver/masterdata/levelvalue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) throw new Error('Failed to load villages');
  const list = await res.json();
  return list.map(item => ({
    code: item.code,
    name: item.value,
    display: `${item.value} (${item.code})`
  }));
}

// Fetch Bounding Box & Georeference
export async function fetchVillageExtent(distCode, tehsilCode, villageCode) {
  const levels = `${distCode.trim()},${tehsilCode.trim()},${villageCode.trim()}`;
  const params = new URLSearchParams({ gisLevels: levels });
  const res = await fetch('/bhunakshaserver/MapInfo/getVVVVExtentGeoref', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) throw new Error('Failed to fetch map boundaries for village');
  const data = await res.json();
  if (!data || !data.xmax || data.xmax === 0) {
    throw new Error('Map is not digitized or extent unavailable for this village.');
  }
  return data;
}

// Construct WMS URL
export function buildWmsUrl(info, width = 2200) {
  const dx = info.xmax - info.xmin;
  const dy = info.ymax - info.ymin;
  const height = Math.round(width * (dy / dx));

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetMap',
    FORMAT: 'image/png',
    TRANSPARENT: 'FALSE',
    LAYERS: 'VILLAGE_MAP',
    STYLES: 'VILLAGE_MAP',
    CRS: info.crs || 'EPSG:32644',
    gis_code: info.gisCode,
    overlay_codes: '',
    state: '',
    BBOX: `${info.xmin},${info.ymin},${info.xmax},${info.ymax}`,
    WIDTH: String(width),
    HEIGHT: String(height)
  });

  return `/bhunakshaserver/WMS?${params.toString()}`;
}

// Name Resolvers
export function resolveDistrictName(query) {
  const q = query.trim().toLowerCase();
  for (const [code, [eng, hin]] of Object.entries(DISTRICTS_MAP)) {
    if (code === q || eng.toLowerCase() === q || hin.toLowerCase() === q) {
      return { code, eng, hin, name: `${eng} (${hin})` };
    }
  }
  // Substring or phonetic match
  const qSound = normSound(englishToSound(q));
  for (const [code, [eng, hin]] of Object.entries(DISTRICTS_MAP)) {
    if (eng.toLowerCase().includes(q) || hin.includes(q)) {
      return { code, eng, hin, name: `${eng} (${hin})` };
    }
    if (qSound && normSound(englishToSound(eng)).includes(qSound)) {
      return { code, eng, hin, name: `${eng} (${hin})` };
    }
  }
  return null;
}

export function resolveTehsilName(tehsils, query) {
  const q = query.trim().toLowerCase();
  for (const t of tehsils) {
    if (t.code === q || t.code.endsWith(q) || t.name.toLowerCase() === q) {
      return t;
    }
  }
  const qSound = normSound(englishToSound(q));
  for (const t of tehsils) {
    if (t.name.toLowerCase().includes(q)) return t;
    const tSound = normSound(hindiToSound(t.name));
    if (qSound && (qSound === tSound || tSound.includes(qSound))) {
      return t;
    }
  }
  return null;
}

export function resolveVillageName(villages, query) {
  const q = query.trim().toLowerCase();
  for (const v of villages) {
    if (v.code === q || v.name.toLowerCase() === q) {
      return v;
    }
  }
  const qSound = normSound(englishToSound(q));
  const qWords = q.split(/\s+/).map(w => normSound(englishToSound(w))).filter(Boolean);

  // 1. Exact sound match
  for (const v of villages) {
    const vSound = normSound(hindiToSound(v.name));
    if (qSound && qSound === vSound) return v;
  }

  // 2. Word by word match
  for (const v of villages) {
    const vWords = v.name.split(/\s+/).map(w => normSound(hindiToSound(w))).filter(Boolean);
    if (qWords.length > 0 && qWords.every(qw => vWords.some(vw => vw === qw || vw.includes(qw)))) {
      return v;
    }
  }

  // 3. Substring match
  for (const v of villages) {
    if (v.name.toLowerCase().includes(q)) return v;
    const vSound = normSound(hindiToSound(v.name));
    if (qSound && qSound.length >= 3 && vSound.includes(qSound)) {
      return v;
    }
  }

  return null;
}

// One-Shot Parse
export async function parseAndFetchOneShot(rawQuery) {
  const raw = rawQuery.trim();
  if (!raw) throw new Error('Please enter a district, tehsil, and village, or a GIS code.');

  // Direct 14-digit GIS code: e.g. 14200751121533
  if (/^\d{10,16}$/.test(raw)) {
    const distCode = raw.length >= 14 ? raw.slice(0, 3) : raw.slice(0, 2);
    const tehCode = raw.length >= 14 ? raw.slice(3, 8) : raw.slice(2, 5);
    const vilCode = raw.length >= 14 ? raw.slice(8) : raw.slice(5);

    const extent = await fetchVillageExtent(distCode, tehCode, vilCode);
    const distObj = DISTRICTS_MAP[distCode];
    return {
      distCode,
      tehsilCode: tehCode,
      villageCode: vilCode,
      districtName: distObj ? `${distObj[0]} (${distObj[1]})` : distCode,
      tehsilName: tehCode,
      villageName: vilCode,
      extent
    };
  }

  // Split query
  let parts = [];
  if (raw.includes(',')) {
    parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    parts = raw.split(/\s+/).filter(Boolean);
  }

  if (parts.length < 2) {
    throw new Error('Please provide at least: District Tehsil Village (e.g. "bulandshahr khurja kapna")');
  }

  // Match District (supports multi-word district)
  let matchedDist = null;
  let distWordsCount = 1;

  for (let len = Math.min(3, parts.length); len >= 1; len--) {
    const cand = parts.slice(0, len).join(' ');
    const found = resolveDistrictName(cand);
    if (found) {
      matchedDist = found;
      distWordsCount = len;
      break;
    }
  }

  if (!matchedDist) {
    throw new Error(`Could not find district matching "${parts[0]}". Please check the spelling.`);
  }

  const remaining = parts.slice(distWordsCount);
  if (remaining.length === 0) {
    throw new Error(`Found district ${matchedDist.name}. Please also specify Tehsil and Village.`);
  }

  // Fetch tehsils for this district
  const tehsils = await fetchTehsils(matchedDist.code);
  
  // Match Tehsil (supports multi-word tehsil)
  let matchedTehsil = null;
  let tehsilWordsCount = 1;

  for (let len = Math.min(3, remaining.length); len >= 1; len--) {
    const cand = remaining.slice(0, len).join(' ');
    const found = resolveTehsilName(tehsils, cand);
    if (found) {
      matchedTehsil = found;
      tehsilWordsCount = len;
      break;
    }
  }

  if (!matchedTehsil) {
    const names = tehsils.map(t => t.name).join(', ');
    throw new Error(`Tehsil matching "${remaining[0]}" not found in ${matchedDist.name}. Available: ${names}`);
  }

  const vilQuery = remaining.slice(tehsilWordsCount).join(' ');
  if (!vilQuery) {
    throw new Error(`Found ${matchedDist.name} -> ${matchedTehsil.name}. Please enter village name.`);
  }

  // Fetch villages
  const villages = await fetchVillages(matchedDist.code, matchedTehsil.code);
  const matchedVillage = resolveVillageName(villages, vilQuery);
  if (!matchedVillage) {
    throw new Error(`Village "${vilQuery}" not found in ${matchedTehsil.name}. Try typing part of the name.`);
  }

  const extent = await fetchVillageExtent(matchedDist.code, matchedTehsil.code, matchedVillage.code);
  return {
    distCode: matchedDist.code,
    tehsilCode: matchedTehsil.code,
    villageCode: matchedVillage.code,
    districtName: matchedDist.name,
    tehsilName: matchedTehsil.name,
    villageName: matchedVillage.name,
    extent
  };
}
