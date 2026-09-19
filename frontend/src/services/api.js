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
  // Use the hardcoded DISTRICTS_MAP directly instead of relying on the API,
  // which sometimes fails or blocks requests for level 1.
  return Object.entries(DISTRICTS_MAP).map(([code, [eng, hin]]) => {
    return { code, eng, hin, display: `${eng} (${hin})` };
  }).sort((a, b) => a.eng.localeCompare(b.eng));
}

const DEFAULT_TEHSILS_142 = [{"code":"00748","value":"अनूपशहर"},{"code":"00751","value":"खुर्जा"},{"code":"00749","value":"डिबाई"},{"code":"00746","value":"बुलन्दशहर"},{"code":"00750","value":"शिकारपुर"},{"code":"00745","value":"सिकन्द्राबाद"},{"code":"00747","value":"स्याना"}];

export async function fetchTehsils(distCode) {
  if (distCode === '142') {
    return DEFAULT_TEHSILS_142.map(item => ({
      code: item.code,
      name: item.value,
      display: `${item.value} (${item.code})`
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

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

const DEFAULT_VILLAGES_142_00751 = [{"code":"121678","value":"अ0पुर उर्फ हलपुरा"},{"code":"121521","value":"अखत्यारपुर"},{"code":"121548","value":"अगवाल"},{"code":"121644","value":"अगौरा अमीरपुर"},{"code":"121647","value":"अचलपुर"},{"code":"121546","value":"अछेजा खुर्द"},{"code":"121630","value":"अछौडा"},{"code":"121624","value":"अटेरना"},{"code":"121667","value":"अरनिया खुर्द"},{"code":"121588","value":"अरनिया मंसूरपुर"},{"code":"121589","value":"अरनिया मौजपुर"},{"code":"121593","value":"असगरपुर"},{"code":"121590","value":"अहमदपुर नवीपुर उर्फ रामपुर"},{"code":"121577","value":"अहरौली"},{"code":"121566","value":"आजमाबाद"},{"code":"121571","value":"आसफपुर"},{"code":"121554","value":"इ0ता0उर्फ सीकरा"},{"code":"121561","value":"इ0पुर जु0 उर्फ मौजपुर"},{"code":"121534","value":"इनायतपुर उर्फ मधूपुरा"},{"code":"121515","value":"इब्राहीमपुर"},{"code":"121559","value":"इस्माईलपुर बुढ़ैना"},{"code":"121602","value":"ईशनपुर"},{"code":"121511","value":"उदयपुर"},{"code":"121537","value":"उमराला"},{"code":"121502","value":"उस्मानपुर"},{"code":"121587","value":"उस्मापुर"},{"code":"121579","value":"औरंगा"},{"code":"121500","value":"कपना"},{"code":"121680","value":"कमालपुर पहासू"},{"code":"121535","value":"कमालपुर म0भ0"},{"code":"121595","value":"कमालपुर माजरा नायसर"},{"code":"121620","value":"करौरा"},{"code":"121562","value":"कलन्दर गढी"},{"code":"121607","value":"कलाखुरी"},{"code":"121512","value":"कलाखुरी"},{"code":"121553","value":"कलैना"},{"code":"121666","value":"कहरौला"},{"code":"121539","value":"किर्रा"},{"code":"121594","value":"क्यौली कला"},{"code":"121673","value":"क्यौली खुर्द"},{"code":"121564","value":"क्वारसी"},{"code":"121525","value":"खडूपुरा"},{"code":"121544","value":"खलसिया चूहरपुर"},{"code":"121532","value":"खवरा"},{"code":"121636","value":"खुटैना"},{"code":"121670","value":"खुरियावली"},{"code":"217427","value":"खुर्जा अन्दर चुंगी"},{"code":"121691","value":"खुर्जा बाहर चुंगी"},{"code":"121631","value":"खेडा"},{"code":"121581","value":"गंगथला"},{"code":"121627","value":"गंगावली"},{"code":"121552","value":"गवां"},{"code":"121576","value":"गोठनी"},{"code":"121499","value":"गोविला"},{"code":"121586","value":"गोसपुर टैना"},{"code":"121635","value":"ग्वारौली भोजगढी"},{"code":"121668","value":"घटाल"},{"code":"121686","value":"घनश्यामपुर"},{"code":"121547","value":"चीती"},{"code":"121603","value":"चॉदपुर खुर्द"},{"code":"121514","value":"छपना"},{"code":"121628","value":"जटौला"},{"code":"121530","value":"जमालपुर"},{"code":"121684","value":"जरारा"},{"code":"121503","value":"जला0बाद उर्फ चिंगरावली"},{"code":"121510","value":"जवां"},{"code":"121653","value":"जहानपुर"},{"code":"121584","value":"जाफरनगर गदाईपुर"},{"code":"121657","value":"जावल"},{"code":"121580","value":"जाहिदपुर कलां"},{"code":"121563","value":"जाहिदपुर खुर्द"},{"code":"121643","value":"झमका"},{"code":"121661","value":"ठेगौरा"},{"code":"121516","value":"डासौली"},{"code":"121689","value":"डूगरपुर"},{"code":"121677","value":"ढकपुरा"},{"code":"121605","value":"तालिबपुर"},{"code":"121652","value":"दशहरा खेरली"},{"code":"121517","value":"दस्तूरा"},{"code":"121664","value":"दाँवर"},{"code":"121538","value":"दीनौल"},{"code":"121617","value":"देवराला"},{"code":"121592","value":"दोसपुर दादूपुर"},{"code":"121545","value":"धरपा चूहडपुर"},{"code":"121540","value":"धरांऊ"},{"code":"121527","value":"धरारी"},{"code":"121669","value":"नगर"},{"code":"121663","value":"नगलाकट"},{"code":"121541","value":"नगला मही0पुर"},{"code":"121570","value":"नगला रूमी"},{"code":"121598","value":"नगला शेखू"},{"code":"121634","value":"नगलियाउदयभान"},{"code":"121622","value":"नगलिया टक्कर"},{"code":"121682","value":"नगलिया नरायनपुर"},{"code":"121681","value":"नरायनपुर"},{"code":"121688","value":"नागल"},{"code":"121654","value":"नायफल उर्फ ऊँचागांव"},{"code":"121659","value":"नायसर"},{"code":"121557","value":"निजामपुर"},{"code":"121612","value":"नियमतावाद"},{"code":"121508","value":"नेकपुर"},{"code":"121507","value":"परौरी"},{"code":"121619","value":"पलडा"},{"code":"121632","value":"पला"},{"code":"121685","value":"पहाडपुर"},{"code":"121625","value":"पिलखनहारी उर्फ साबितगढ़"},{"code":"121621","value":"फरकना गंगागढी"},{"code":"121529","value":"फराना"},{"code":"121574","value":"फिरोजपुर"},{"code":"121665","value":"बगपुरा"},{"code":"121596","value":"बलराउॅ"},{"code":"121626","value":"बाघउ"},{"code":"121606","value":"बाढा"},{"code":"121614","value":"बादशाहपुर पंचगाई"},{"code":"121611","value":"बिजली पुर"},{"code":"121550","value":"बोरौली"},{"code":"121524","value":"भगवानपुर"},{"code":"121533","value":"भदौरा"},{"code":"121569","value":"भाईपुर"},{"code":"121578","value":"भादवॉ"},{"code":"121575","value":"भिण्डौर"},{"code":"121509","value":"भुन्नाजाटान"},{"code":"121683","value":"भुल्लनगढी"},{"code":"121641","value":"भोगपुर"},{"code":"121600","value":"मंसूरपुर"},{"code":"121513","value":"मांचड़"},{"code":"121542","value":"मांछीपुर"},{"code":"121597","value":"मीरपुर"},{"code":"121687","value":"मीरपुर पहासू"},{"code":"121672","value":"मुनी"},{"code":"121501","value":"मुमरेजपुर"},{"code":"121551","value":"मूडाखेडा"},{"code":"121583","value":"मैना कलन्दरगढ़ी"},{"code":"121692","value":"मैना मौजपुर"},{"code":"121556","value":"मौ0 क0उर्फढांकर"},{"code":"121650","value":"मौ0पुर म0 बडागांव"},{"code":"121555","value":"मौहम्मदपुर उर्फ  भो0"},{"code":"121506","value":"मौहम्मदपुर नार"},{"code":"121520","value":"मौहम्मदपुर म0वीछट"},{"code":"121645","value":"यूसुफपुर मलग"},{"code":"121504","value":"रखेडा"},{"code":"121679","value":"रनियावली"},{"code":"121651","value":"रसूलपुर"},{"code":"121585","value":"रामगढ़ी"},{"code":"121616","value":"रायपुर मोज्जमपुर"},{"code":"121655","value":"रुकनपुर"},{"code":"121676","value":"रुदरी"},{"code":"121599","value":"रोहिन्दा"},{"code":"121674","value":"लखनबाढ़ा"},{"code":"121609","value":"लखावटी मिजर्ापुर"},{"code":"121604","value":"लालपुर चितोला"},{"code":"121568","value":"लालपुर मुमरेजपुर"},{"code":"121610","value":"वगराई"},{"code":"121648","value":"वडागांव"},{"code":"121543","value":"वरतौली"},{"code":"121642","value":"वाजीदपुर"},{"code":"121658","value":"वादौली"},{"code":"121613","value":"वाहनपुर"},{"code":"121528","value":"विचौला"},{"code":"121522","value":"विधैपुर"},{"code":"121519","value":"वीछट सुजानपुर"},{"code":"121565","value":"शहजादपुर कनैनी"},{"code":"121618","value":"शहवाजपुर दौलत"},{"code":"121601","value":"शहवाजपुर भाल"},{"code":"121573","value":"शाहपुर कलां"},{"code":"121675","value":"शाहपुर पहासू"},{"code":"121660","value":"शाहपुरमेवगढ़ी"},{"code":"121656","value":"शेरपुर मजरा नायसर"},{"code":"121526","value":"सनैता शफीपुर"},{"code":"121536","value":"समसपुर"},{"code":"121591","value":"सरावा दादूपुर"},{"code":"121646","value":"सलैमपुर पहाडगढ़ी"},{"code":"121518","value":"सलैमपुर म0दस्तूरा"},{"code":"121567","value":"सारंगपुर"},{"code":"121671","value":"सारसौल"},{"code":"121531","value":"सिकन्दरपुर"},{"code":"121572","value":"सिरयाल"},{"code":"121558","value":"सीकरी"},{"code":"121639","value":"सुरजावली"},{"code":"121560","value":"सुलतानपुर"},{"code":"121637","value":"सूरतपुर कलां"},{"code":"121638","value":"सूरतपुर खुर्द"},{"code":"121608","value":"सैण्डा फरीदपुर"},{"code":"121582","value":"सौदा हवीबपुर"},{"code":"121549","value":"हजरतपुर"},{"code":"121649","value":"हजरतपुर पूठरी"},{"code":"121615","value":"हमीरपुर"},{"code":"121629","value":"हवीवपुर"},{"code":"121690","value":"हंसनगढ"},{"code":"121505","value":"हसनपुर"},{"code":"121523","value":"हसनपुर लडूकी"},{"code":"121640","value":"हिसारा"},{"code":"121623","value":"हीरापुर नगला जगत"},{"code":"121633","value":"हीसौटी"},{"code":"121662","value":"हैदर नगर मदकौला"}];

export async function fetchVillages(distCode, tehsilCode) {
  if (distCode === '142' && tehsilCode === '00751') {
    return DEFAULT_VILLAGES_142_00751.map(item => ({
      code: item.code,
      name: item.value,
      display: `${item.value} (${item.code})`
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

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
