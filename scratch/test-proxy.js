const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const https = require('https');

const postData = 'level=1&codes=';
const options = {
  hostname: 'upbhunaksha.gov.in',
  port: 443,
  path: '/bhunakshaserver/masterdata/levelvalue',
  method: 'POST',
  headers: {
    'host': 'upbhunaksha.gov.in',
    'origin': 'https://upbhunaksha.gov.in',
    'referer': 'https://upbhunaksha.gov.in/home',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'content-type': 'application/x-www-form-urlencoded',
    'content-length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`BODY: ${body.substring(0, 100)}...`); });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});
req.write(postData);
req.end();
