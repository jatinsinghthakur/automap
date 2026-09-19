const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const https = require('https');

function fetchMasterData(level, codes) {
  return new Promise((resolve, reject) => {
    const postData = `level=${level}&codes=${codes}`;
    const options = {
      hostname: 'upbhunaksha.gov.in',
      port: 443,
      path: '/bhunakshaserver/masterdata/levelvalue',
      method: 'POST',
      headers: {
        'host': 'upbhunaksha.gov.in',
        'origin': 'https://upbhunaksha.gov.in',
        'referer': 'https://upbhunaksha.gov.in/home',
        'user-agent': 'Mozilla/5.0',
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const tehsils = await fetchMasterData(2, '142');
    console.log('TEHSILS:', JSON.stringify(tehsils));
    const villages = await fetchMasterData(3, '142,00751');
    console.log('VILLAGES:', JSON.stringify(villages));
  } catch(e) {
    console.error(e);
  }
}

run();
