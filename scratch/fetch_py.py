import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch(level, codes):
    url = 'https://upbhunaksha.gov.in/bhunakshaserver/masterdata/levelvalue'
    data = urllib.parse.urlencode({'level': level, 'codes': codes}).encode('ascii')
    req = urllib.request.Request(url, data=data, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req, context=ctx) as response:
        return json.loads(response.read().decode('utf-8'))

data = {
    'tehsils_142': fetch('2', '142'),
    'villages_142_00751': fetch('3', '142,00751')
}

with open('defaults.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
